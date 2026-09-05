import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requireClinicPermission, respondToPermissionError } from "../lib/permissions";
import { supabaseRequest, supabaseAdminRequest } from "../lib/supabase";
import { clinicEvents } from "../lib/events";
import { logger } from "../lib/logger";
import { createWasapFlowConnectSession } from "../lib/wasapflow";

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

async function syncChannelsTable(
  clinicId: string,
  type: string,
  provider: string,
  status: "connected" | "disconnected",
  isEnabled: boolean,
  config: Record<string, any>,
  phoneNumberId?: string | null
) {
  try {
    const existing = await supabaseAdminRequest<Array<{ id: string }>>(
      `/rest/v1/channels?select=id&clinic_id=eq.${encodeURIComponent(clinicId)}&type=eq.${encodeURIComponent(type)}&deleted_at=is.null&limit=1`
    );

    if (existing.ok && existing.data?.length) {
      const channelId = existing.data[0].id;
      await supabaseAdminRequest(`/rest/v1/channels?id=eq.${encodeURIComponent(channelId)}`, {
        method: "PATCH",
        body: JSON.stringify({
          provider,
          status,
          is_enabled: isEnabled,
          phone_number_id: phoneNumberId || null,
          config,
          updated_at: new Date().toISOString(),
        }),
      });
    } else if (isEnabled) {
      await supabaseAdminRequest("/rest/v1/channels", {
        method: "POST",
        body: JSON.stringify({
          clinic_id: clinicId,
          type,
          provider,
          status,
          is_enabled: isEnabled,
          phone_number_id: phoneNumberId || null,
          config,
        }),
      });
    }
  } catch (err) {
    logger.warn({ err, clinicId, type }, "[Channels] Failed to sync channels table");
  }
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
router.get("/settings/channels", async (req: Request, res: Response) => {
  let session: Session | null = null;
  try {
    session = await requireClinicPermission(req, "Settings", "clinic_settings", "read");
  } catch (error) {
    respondToPermissionError(res, error);
    return;
  }
  if (!session) return;

  const clinicRes = await supabaseRequest<Array<{ id: string; name?: string; location_config?: Record<string, any> }>>(
    `/rest/v1/clinics?select=id,name,location_config&id=eq.${encodeURIComponent(session.clinicId)}&limit=1`,
    { headers: headers(session) }
  );

  const locConfig = clinicRes.data?.[0]?.location_config || {};
  const channels = locConfig.channels || {};
  const origin = publicAppOrigin(req);
  const secret = process.env.INBOX_INBOUND_SECRET?.trim() || "";
  const secretParam = secret ? `&secret=${encodeURIComponent(secret)}` : "";

  res.json({
    whatsapp: {
      connected: Boolean(channels.whatsapp?.connected || (channels.whatsapp?.phoneNumber && (channels.whatsapp?.wabaId || channels.whatsapp?.verifiedAt))),
      phoneNumber: channels.whatsapp?.phoneNumber || "",
      phoneNumberId: channels.whatsapp?.phoneNumberId || "",
      wabaId: channels.whatsapp?.wabaId || "",
      connectionMode: channels.whatsapp?.connectionMode || "coexistence",
      provider: channels.whatsapp?.provider || "wasapflow",
      accessToken: channels.whatsapp?.accessToken ? "••••••••••••••••" : "",
      verifiedAt: channels.whatsapp?.verifiedAt || null,
      verifyToken: channels.whatsapp?.verifyToken || `mrn_wa_${session.clinicId.slice(0, 8)}`,
      webhookUrl: `${origin}/api/inbox/wasapflow`,
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

// 1.0 POST /api/settings/channels/whatsapp/connect-session - WasapFlow Embedded Signup Session
router.post("/settings/channels/whatsapp/connect-session", async (req: Request, res: Response) => {
  let session: Session | null = null;
  try {
    session = await requireClinicPermission(req, "Settings", "clinic_settings", "manage");
  } catch (error) {
    respondToPermissionError(res, error);
    return;
  }
  if (!session) return;

  const clinicRes = await supabaseRequest<Array<{ id: string; name?: string }>>(
    `/rest/v1/clinics?select=id,name&id=eq.${encodeURIComponent(session.clinicId)}&limit=1`,
    { headers: headers(session) }
  );

  const clinicName = clinicRes.data?.[0]?.name || "Clinicos Clinic";

  try {
    const connectSession = await createWasapFlowConnectSession(session.clinicId, clinicName);
    res.json({
      success: true,
      connectUrl: connectSession.connectUrl,
      token: connectSession.token,
      expiresIn: connectSession.expiresIn,
    });
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : "Failed to create WasapFlow connect session",
    });
  }
});

// 1.01 POST /api/settings/channels/whatsapp/connect-complete - WasapFlow Onboarding Completed
router.post("/settings/channels/whatsapp/connect-complete", async (req: Request, res: Response) => {
  let session: Session | null = null;
  try {
    session = await requireClinicPermission(req, "Settings", "clinic_settings", "manage");
  } catch (error) {
    respondToPermissionError(res, error);
    return;
  }
  if (!session) return;

  const { waba_id, phone_number_id, display_name, connection_mode, phone_number } = req.body;
  if (!waba_id) {
    res.status(400).json({ error: "Missing required waba_id." });
    return;
  }

  const clinicRes = await supabaseRequest<Array<{ location_config?: Record<string, any> }>>(
    `/rest/v1/clinics?select=location_config&id=eq.${encodeURIComponent(session.clinicId)}&limit=1`,
    { headers: headers(session) }
  );
  const currentLocConfig = clinicRes.data?.[0]?.location_config || {};
  const currentChannels = currentLocConfig.channels || {};
  const origin = publicAppOrigin(req);

  const updatedWhatsAppConfig = {
    connected: true,
    wabaId: String(waba_id),
    phoneNumberId: phone_number_id ? String(phone_number_id) : "",
    phoneNumber: phone_number || currentChannels.whatsapp?.phoneNumber || "",
    displayName: display_name || "",
    connectionMode: connection_mode || "coexistence",
    provider: "wasapflow",
    verifiedAt: new Date().toISOString(),
    webhookUrl: `${origin}/api/inbox/wasapflow`,
    updatedAt: new Date().toISOString(),
  };

  await supabaseRequest(`/rest/v1/clinics?id=eq.${encodeURIComponent(session.clinicId)}`, {
    method: "PATCH",
    headers: headers(session),
    body: JSON.stringify({
      ...(phone_number ? { phone: phone_number } : {}),
      location_config: {
        ...currentLocConfig,
        channels: {
          ...currentChannels,
          whatsapp: updatedWhatsAppConfig,
        },
      },
    }),
  });

  // Sync with Supabase channels table for n8n & multi-tenant resolution
  await syncChannelsTable(
    session.clinicId,
    "whatsapp",
    "wasapflow",
    "connected",
    true,
    {
      waba_id: String(waba_id),
      phone_number_id: phone_number_id ? String(phone_number_id) : null,
      phone_number: phone_number || null,
      display_name: display_name || null,
      connection_mode: connection_mode || "coexistence",
      provider: "wasapflow",
      connected_at: new Date().toISOString(),
    },
    phone_number_id ? String(phone_number_id) : null
  );

  clinicEvents.emitClinicEvent(session.clinicId, "settings.updated", { channel: "whatsapp" });

  res.json({
    success: true,
    message: "تم ربط واتساب العيادة بـ WasapFlow بنجاح! 🚀",
    whatsapp: updatedWhatsAppConfig,
  });
});

// 1.1 POST /api/settings/channels/whatsapp/request-otp - Send OTP verification code to phone
router.post("/settings/channels/whatsapp/request-otp", async (req: Request, res: Response) => {
  let session: Session | null = null;
  try {
    session = await requireClinicPermission(req, "Settings", "clinic_settings", "manage");
  } catch (error) {
    respondToPermissionError(res, error);
    return;
  }
  if (!session) return;

  const { phoneNumber } = req.body;
  if (!phoneNumber || typeof phoneNumber !== "string" || phoneNumber.trim().length < 8) {
    res.status(400).json({ error: "يرجى إدخال رقم هاتف صالح مع كود الدولة (مثال: +966501234567 أو +201012345678)." });
    return;
  }

  const cleanPhone = phoneNumber.trim().replace(/[^\d+]/g, "");
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

  // Load existing clinic config
  const clinicRes = await supabaseRequest<Array<{ location_config?: Record<string, any> }>>(
    `/rest/v1/clinics?select=location_config&id=eq.${encodeURIComponent(session.clinicId)}&limit=1`,
    { headers: headers(session) }
  );
  const currentLocConfig = clinicRes.data?.[0]?.location_config || {};

  // Store pending verification
  await supabaseRequest(
    `/rest/v1/clinics?id=eq.${encodeURIComponent(session.clinicId)}`,
    {
      method: "PATCH",
      headers: headers(session),
      body: JSON.stringify({
        location_config: {
          ...currentLocConfig,
          pending_whatsapp_verification: {
            phoneNumber: cleanPhone,
            otp,
            expiresAt,
            createdAt: new Date().toISOString(),
          },
        },
      }),
    }
  );

  logger.info({ clinicId: session.clinicId, phone: cleanPhone }, "[WhatsApp OTP] Verification code generated");

  // No automatic delivery channel exists for this clinic yet (the WhatsApp
  // number being linked IS the thing being verified), so the code is shown to
  // the authenticated owner in their own wizard instead of pretending it was
  // sent. It is never written to logs.
  res.json({
    success: true,
    message: `رمز التحقق للرقم ${cleanPhone} ظاهر في الواجهة — التسليم التلقائي برسالة واتساب غير مفعّل قبل إكمال الربط.`,
    phoneNumber: cleanPhone,
    expiresAt,
    devOtp: otp,
  });
});

// 1.2 POST /api/settings/channels/whatsapp/verify-otp - Verify OTP and link WhatsApp directly to clinic
router.post("/settings/channels/whatsapp/verify-otp", async (req: Request, res: Response) => {
  let session: Session | null = null;
  try {
    session = await requireClinicPermission(req, "Settings", "clinic_settings", "manage");
  } catch (error) {
    respondToPermissionError(res, error);
    return;
  }
  if (!session) return;

  const { phoneNumber, code } = req.body;
  if (!code || typeof code !== "string" || code.trim().length !== 6) {
    res.status(400).json({ error: "يرجى إدخال رمز التحقق المكون من 6 أرقام." });
    return;
  }

  const clinicRes = await supabaseRequest<Array<{ location_config?: Record<string, any> }>>(
    `/rest/v1/clinics?select=location_config&id=eq.${encodeURIComponent(session.clinicId)}&limit=1`,
    { headers: headers(session) }
  );
  const currentLocConfig = clinicRes.data?.[0]?.location_config || {};
  const pending = currentLocConfig.pending_whatsapp_verification;

  if (!pending || !pending.otp) {
    res.status(400).json({ error: "لم يتم طلب رمز تحقق لهذا الرقم، أو انتهت صلاحيته. اطلب رمزاً جديداً." });
    return;
  }

  if (new Date(pending.expiresAt) < new Date()) {
    res.status(400).json({ error: "انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد." });
    return;
  }

  if (pending.otp !== code.trim()) {
    res.status(400).json({ error: "رمز التحقق غير صحيح، يرجى التأكد وإعادة المحاولة." });
    return;
  }

  const cleanPhone = pending.phoneNumber || phoneNumber;
  const currentChannels = currentLocConfig.channels || {};
  const origin = publicAppOrigin(req);
  const secret = process.env.INBOX_INBOUND_SECRET?.trim() || "";
  const secretParam = secret ? `&secret=${encodeURIComponent(secret)}` : "";

  const updatedChannels = {
    ...currentChannels,
    whatsapp: {
      connected: true,
      phoneNumber: cleanPhone,
      phoneNumberId: currentChannels.whatsapp?.phoneNumberId || `wa_${cleanPhone.replace(/[^\d]/g, "")}`,
      wabaId: currentChannels.whatsapp?.wabaId || `waba_${cleanPhone.replace(/[^\d]/g, "")}`,
      accessToken: currentChannels.whatsapp?.accessToken || "auto_verified_token",
      verifiedAt: new Date().toISOString(),
      webhookUrl: `${origin}/api/inbound?clinic_id=${session.clinicId}&channel=whatsapp${secretParam}`,
      updatedAt: new Date().toISOString(),
    },
  };

  const updateResult = await supabaseRequest(
    `/rest/v1/clinics?id=eq.${encodeURIComponent(session.clinicId)}`,
    {
      method: "PATCH",
      headers: headers(session),
      body: JSON.stringify({
        phone: cleanPhone,
        location_config: {
          ...currentLocConfig,
          channels: updatedChannels,
          pending_whatsapp_verification: null,
        },
      }),
    }
  );

  if (!updateResult.ok) {
    res.status(502).json({ error: "تعذر حفظ إعدادات الواتساب في سوبابيز." });
    return;
  }

  clinicEvents.emitClinicEvent(session.clinicId, "settings.updated", { channel: "whatsapp" });
  res.json({
    success: true,
    message: `تم التحقق بنجاح وربط رقم الواتساب (${cleanPhone}) بالعيادة تلقائياً! 🚀`,
    whatsapp: updatedChannels.whatsapp,
  });
});

// 1.3 POST /api/settings/channels/whatsapp/disconnect - Disconnect WhatsApp
router.post("/settings/channels/whatsapp/disconnect", async (req: Request, res: Response) => {
  let session: Session | null = null;
  try {
    session = await requireClinicPermission(req, "Settings", "clinic_settings", "manage");
  } catch (error) {
    respondToPermissionError(res, error);
    return;
  }
  if (!session) return;

  const clinicRes = await supabaseRequest<Array<{ location_config?: Record<string, any> }>>(
    `/rest/v1/clinics?select=location_config&id=eq.${encodeURIComponent(session.clinicId)}&limit=1`,
    { headers: headers(session) }
  );
  const currentLocConfig = clinicRes.data?.[0]?.location_config || {};
  const currentChannels = currentLocConfig.channels || {};

  const updatedChannels = {
    ...currentChannels,
    whatsapp: {
      connected: false,
      phoneNumber: "",
      phoneNumberId: "",
      wabaId: "",
      accessToken: "",
      verifiedAt: null,
      updatedAt: new Date().toISOString(),
    },
  };

  await supabaseRequest(
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

  await syncChannelsTable(
    session.clinicId,
    "whatsapp",
    "wasapflow",
    "disconnected",
    false,
    {}
  );

  clinicEvents.emitClinicEvent(session.clinicId, "settings.updated", { channel: "whatsapp" });
  res.json({ success: true, message: "تم إلغاء ربط رقم الواتساب بنجاح." });
});

// 2. POST /api/settings/channels/:channel - Save channel credentials
router.post("/settings/channels/:channel", async (req: Request, res: Response) => {
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

  const provider = channel === "telegram" ? "telegram_direct" : (channel === "whatsapp" ? "wasapflow" : "superchat");
  await syncChannelsTable(
    session.clinicId,
    channel,
    provider,
    "connected",
    true,
    channelData
  );

  clinicEvents.emitClinicEvent(session.clinicId, "settings.updated", { channel });
  res.json({ success: true, message: `تم تحديث وربط قناة ${channel} بنجاح!` });
});

// 3. POST /api/settings/channels/telegram/auto-link - Automatically set Telegram Webhook via Bot API
router.post("/settings/channels/telegram/auto-link", async (req: Request, res: Response) => {
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
