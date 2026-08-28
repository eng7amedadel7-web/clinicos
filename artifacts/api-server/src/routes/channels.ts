import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requireClinicPermission, respondToPermissionError } from "../lib/permissions";
import { supabaseRequest, supabaseAdminRequest } from "../lib/supabase";
import { clinicEvents } from "../lib/events";
import { logger } from "../lib/logger";

const router = Router();

type Session = { clinicId: string; userId: string; accessToken: string };

function headers(session: Session, extra: Record<string, string> = {}) {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...extra,
  };
}

function publicAppOrigin(req: Request): string {
  if (process.env.PUBLIC_APP_URL?.trim()) {
    return process.env.PUBLIC_APP_URL.trim().replace(/\/+$/, "");
  }
  const host = req.get("host") || "localhost:5000";
  const proto = req.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// 1. GET /api/settings/channels - Retrieve all 4 channel connections
router.get("/api/settings/channels", async (req: Request, res: Response) => {
  let session: Session | null = null;
  try {
    session = await requireClinicPermission(req, "Settings", "clinic_settings", "read");
  } catch (error) {
    respondToPermissionError(res, error);
    return;
  }
  if (!session) return;

  const clinicRes = await supabaseRequest<Array<{ id: string; location_config?: Record<string, any> }>>(
    `/rest/v1/clinics?select=id,location_config&id=eq.${encodeURIComponent(session.clinicId)}&limit=1`,
    { headers: headers(session) }
  );

  const locConfig = clinicRes.data?.[0]?.location_config || {};
  const channels = locConfig.channels || {};
  const origin = publicAppOrigin(req);
  const secret = process.env.INBOX_INBOUND_SECRET?.trim() || "";
  const secretParam = secret ? `&secret=${encodeURIComponent(secret)}` : "";

  res.json({
    whatsapp: {
      connected: Boolean(channels.whatsapp?.phoneNumberId && channels.whatsapp?.accessToken),
      phoneNumber: channels.whatsapp?.phoneNumber || "",
      phoneNumberId: channels.whatsapp?.phoneNumberId || "",
      wabaId: channels.whatsapp?.wabaId || "",
      accessToken: channels.whatsapp?.accessToken ? "••••••••••••••••" : "",
      verifyToken: channels.whatsapp?.verifyToken || `mrn_wa_${session.clinicId.slice(0, 8)}`,
      webhookUrl: `${origin}/api/inbound?clinic_id=${session.clinicId}&channel=whatsapp${secretParam}`,
    },
    telegram: {
      connected: Boolean(channels.telegram?.botToken),
      botUsername: channels.telegram?.botUsername || "",
      botToken: channels.telegram?.botToken ? "••••••••••••••••" : "",
      autoLinked: Boolean(channels.telegram?.webhookSet),
      webhookUrl: `${origin}/api/inbound?clinic_id=${session.clinicId}&channel=telegram${secretParam}`,
    },
    instagram: {
      connected: Boolean(channels.instagram?.pageId && channels.instagram?.accessToken),
      pageId: channels.instagram?.pageId || "",
      accountName: channels.instagram?.accountName || "",
      accessToken: channels.instagram?.accessToken ? "••••••••••••••••" : "",
      webhookUrl: `${origin}/api/inbound?clinic_id=${session.clinicId}&channel=instagram${secretParam}`,
    },
    messenger: {
      connected: Boolean(channels.messenger?.pageId && channels.messenger?.accessToken),
      pageId: channels.messenger?.pageId || "",
      pageName: channels.messenger?.pageName || "",
      accessToken: channels.messenger?.accessToken ? "••••••••••••••••" : "",
      verifyToken: channels.messenger?.verifyToken || `mrn_fb_${session.clinicId.slice(0, 8)}`,
      webhookUrl: `${origin}/api/inbound?clinic_id=${session.clinicId}&channel=messenger${secretParam}`,
    },
  });
});

// 2. POST /api/settings/channels/:channel - Save channel credentials
router.post("/api/settings/channels/:channel", async (req: Request, res: Response) => {
  let session: Session | null = null;
  try {
    session = await requireClinicPermission(req, "Settings", "clinic_settings", "manage");
  } catch (error) {
    respondToPermissionError(res, error);
    return;
  }
  if (!session) return;

  const channel = String(req.params.channel || "").toLowerCase();
  if (!["whatsapp", "telegram", "instagram", "messenger"].includes(channel)) {
    res.status(400).json({ error: "Invalid channel name." });
    return;
  }

  const existingRes = await supabaseRequest<Array<{ location_config?: Record<string, any> }>>(
    `/rest/v1/clinics?select=location_config&id=eq.${encodeURIComponent(session.clinicId)}&limit=1`,
    { headers: headers(session) }
  );

  const currentLocConfig = existingRes.data?.[0]?.location_config || {};
  const currentChannels = currentLocConfig.channels || {};
  const channelData = req.body || {};

  // If token is unchanged (all dots), keep previous token
  const previousChannelData = currentChannels[channel] || {};
  if (channelData.accessToken === "••••••••••••••••" || channelData.accessToken === "") {
    channelData.accessToken = previousChannelData.accessToken;
  }
  if (channelData.botToken === "••••••••••••••••" || channelData.botToken === "") {
    channelData.botToken = previousChannelData.botToken;
  }

  const updatedChannels = {
    ...currentChannels,
    [channel]: {
      ...previousChannelData,
      ...channelData,
      updatedAt: new Date().toISOString(),
    },
  };

  const updateResult = await supabaseRequest(
    `/rest/v1/clinics?id=eq.${encodeURIComponent(session.clinicId)}`,
    {
      method: "PATCH",
      headers: headers(session),
      body: JSON.stringify({
        location_config: {
          ...currentLocConfig,
          channels: updatedChannels,
        },
      }),
    }
  );

  if (!updateResult.ok) {
    res.status(502).json({ error: "تعذر حفظ بيانات القناة في قاعدة البيانات." });
    return;
  }

  clinicEvents.emitClinicEvent(session.clinicId, "settings.updated", { channel });
  res.json({ success: true, message: `تم تحديث وربط قناة ${channel} بنجاح!` });
});

// 3. POST /api/settings/channels/telegram/auto-link - Automatically set Telegram Webhook via Bot API
router.post("/api/settings/channels/telegram/auto-link", async (req: Request, res: Response) => {
  let session: Session | null = null;
  try {
    session = await requireClinicPermission(req, "Settings", "clinic_settings", "manage");
  } catch (error) {
    respondToPermissionError(res, error);
    return;
  }
  if (!session) return;

  const { botToken, botUsername } = req.body;
  if (!botToken || typeof botToken !== "string") {
    res.status(400).json({ error: "يرجى إدخال Bot Token من @BotFather." });
    return;
  }

  const origin = publicAppOrigin(req);
  const secret = process.env.INBOX_INBOUND_SECRET?.trim() || "";
  const secretParam = secret ? `&secret=${encodeURIComponent(secret)}` : "";
  const targetWebhookUrl = `${origin}/api/inbound?clinic_id=${session.clinicId}&channel=telegram${secretParam}`;

  try {
    // 1. Call Telegram setWebhook API
    const tgUrl = `https://api.telegram.org/bot${botToken.trim()}/setWebhook?url=${encodeURIComponent(targetWebhookUrl)}`;
    const tgResponse = await fetch(tgUrl, { method: "POST", signal: AbortSignal.timeout(10_000) });
    const tgResult = (await tgResponse.json().catch(() => ({}))) as { ok?: boolean; description?: string };

    if (!tgResult.ok) {
      res.status(400).json({
        error: `رفض تليجرام الربط: ${tgResult.description || "تأكد من صحة الـ Bot Token"}`,
      });
      return;
    }

    // 2. Save in database as active
    const existingRes = await supabaseRequest<Array<{ location_config?: Record<string, any> }>>(
      `/rest/v1/clinics?select=location_config&id=eq.${encodeURIComponent(session.clinicId)}&limit=1`,
      { headers: headers(session) }
    );

    const currentLocConfig = existingRes.data?.[0]?.location_config || {};
    const currentChannels = currentLocConfig.channels || {};

    await supabaseRequest(
      `/rest/v1/clinics?id=eq.${encodeURIComponent(session.clinicId)}`,
      {
        method: "PATCH",
        headers: headers(session),
        body: JSON.stringify({
          location_config: {
            ...currentLocConfig,
            channels: {
              ...currentChannels,
              telegram: {
                botToken: botToken.trim(),
                botUsername: botUsername?.trim() || "",
                webhookSet: true,
                webhookUrl: targetWebhookUrl,
                updatedAt: new Date().toISOString(),
              },
            },
          },
        }),
      }
    );

    res.json({
      success: true,
      message: "تم ربط بوت التليجرام بالعيادة تلقائياً بنجاح! 🚀",
      description: tgResult.description,
    });
  } catch (err) {
    res.status(502).json({
      error: `تعذر الاتصال بسيرفرات تليجرام: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }
});

export default router;
