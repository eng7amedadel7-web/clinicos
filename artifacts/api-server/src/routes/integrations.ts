import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { requireClinicPermission, respondToPermissionError } from "../lib/permissions";
import { supabaseRequest, supabaseAdminRequest } from "../lib/supabase";
import { clinicEvents } from "../lib/events";
import { logger } from "../lib/logger";

const router = Router();

// ملاحظة أمنية: كان المفتاح الخارجي يُشتق حتمياً من clinic_id ويمكن تخمينه،
// لذا أصبح يُولَّد عشوائياً ويُخزَّن في location_config.integrations.apiKey عند أول استخدام.
function generateExternalApiKey(): string {
  return `mrn_live_sk_${randomBytes(24).toString("base64url")}`;
}

function safeKeyEquals(stored: string, provided: string): boolean {
  const a = Buffer.from(stored, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// حماية من SSRF: يُسمح فقط بروابط http وhttps بعناوين عامة، ويُمنع localhost والشبكات الخاصة.
function isBlockedIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return false;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function isBlockedIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  const mapped = lower.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) return isBlockedIpv4(mapped[1]);
  if (lower === "::" || lower === "::1") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true;
  return false;
}

function isBlockedIp(ip: string): boolean {
  return isIP(ip) === 6 ? isBlockedIpv6(ip) : isBlockedIpv4(ip);
}

async function assertSafeWebhookTarget(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("رابط الويب هوك غير صالح.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("يُسمح فقط بروابط http أو https.");
  }

  let host = url.hostname.toLowerCase();
  if (host.startsWith("[") && host.endsWith("]")) host = host.slice(1, -1);

  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new Error("لا يمكن استهداف أسماء نطاقات داخلية أو محلية.");
  }

  if (isIP(host)) {
    if (isBlockedIp(host)) {
      throw new Error("لا يمكن استهداف عناوين الشبكة الداخلية أو المحلية.");
    }
    return url;
  }

  let addresses: Array<{ address: string }>;
  try {
    addresses = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new Error("تعذر تحويل اسم النطاق؛ تحقق من صحة الرابط.");
  }
  if (!addresses.length || addresses.some((a) => isBlockedIp(a.address))) {
    throw new Error("يشير الرابط إلى عنوان شبكة داخلي أو محلي، وهذا غير مسموح.");
  }
  return url;
}

type Session = { clinicId: string; userId: string; accessToken: string };

function headers(session: Session, extra: Record<string, string> = {}) {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...extra,
  };
}

// 1. GET /api/integrations/config - Load clinic integration settings (API key, Webhooks, Pixels)
router.get("/integrations/config", async (req: Request, res: Response) => {
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

  const config = clinicRes.data?.[0]?.location_config?.integrations || {};

  // توليد مفتاح عشوائي وتخزينه عند أول قراءة إذا لم يوجد مفتاح مخزن،
  // بدلاً من الاشتقاق الحتمي من clinic_id القابل للتخمين
  let apiKey = typeof config.apiKey === "string" ? config.apiKey : "";
  if (!apiKey) {
    apiKey = generateExternalApiKey();
    const patchRes = await supabaseRequest(
      `/rest/v1/clinics?id=eq.${encodeURIComponent(session.clinicId)}`,
      {
        method: "PATCH",
        headers: headers(session),
        body: JSON.stringify({
          location_config: {
            ...(clinicRes.data?.[0]?.location_config || {}),
            integrations: { ...config, apiKey, updatedAt: new Date().toISOString() },
          },
        }),
      }
    );
    if (!patchRes.ok) {
      res.status(502).json({ error: "تعذر توليد مفتاح الـ API وتخزينه." });
      return;
    }
  }

  res.json({
    apiKey,
    externalWebhookUrl: config.externalWebhookUrl || "",
    webhookEvents: config.webhookEvents || ["appointment.booked", "patient.created", "call.completed"],
    metaPixelId: config.metaPixelId || "",
    gtmId: config.gtmId || "",
    tiktokPixelId: config.tiktokPixelId || "",
  });
});

// 2. POST /api/integrations/config - Save clinic integration settings
const configSchema = z.object({
  externalWebhookUrl: z.string().url().or(z.literal("")).optional(),
  webhookEvents: z.array(z.string()).optional(),
  metaPixelId: z.string().trim().optional(),
  gtmId: z.string().trim().optional(),
  tiktokPixelId: z.string().trim().optional(),
  regenerateKey: z.boolean().optional(),
});

router.post("/integrations/config", async (req: Request, res: Response) => {
  let session: Session | null = null;
  try {
    session = await requireClinicPermission(req, "Settings", "clinic_settings", "manage");
  } catch (error) {
    respondToPermissionError(res, error);
    return;
  }
  if (!session) return;

  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات الإعدادات غير صالحة.", details: parsed.error.format() });
    return;
  }

  const existingRes = await supabaseRequest<Array<{ location_config?: Record<string, any> }>>(
    `/rest/v1/clinics?select=location_config&id=eq.${encodeURIComponent(session.clinicId)}&limit=1`,
    { headers: headers(session) }
  );

  const currentLocConfig = existingRes.data?.[0]?.location_config || {};
  const currentIntegrations = currentLocConfig.integrations || {};

  // إعادة التوليد تنتج مفتاحاً عشوائياً جديداً، وأي مفتاح يُحفظ هنا هو المفتاح العشوائي المخزن فقط
  const apiKey = parsed.data.regenerateKey
    ? generateExternalApiKey()
    : (typeof currentIntegrations.apiKey === "string" && currentIntegrations.apiKey
        ? currentIntegrations.apiKey
        : generateExternalApiKey());

  const updatedIntegrations = {
    ...currentIntegrations,
    apiKey,
    ...(parsed.data.externalWebhookUrl !== undefined ? { externalWebhookUrl: parsed.data.externalWebhookUrl } : {}),
    ...(parsed.data.webhookEvents !== undefined ? { webhookEvents: parsed.data.webhookEvents } : {}),
    ...(parsed.data.metaPixelId !== undefined ? { metaPixelId: parsed.data.metaPixelId } : {}),
    ...(parsed.data.gtmId !== undefined ? { gtmId: parsed.data.gtmId } : {}),
    ...(parsed.data.tiktokPixelId !== undefined ? { tiktokPixelId: parsed.data.tiktokPixelId } : {}),
    updatedAt: new Date().toISOString(),
  };

  const updateResult = await supabaseRequest<Array<Record<string, unknown>>>(
    `/rest/v1/clinics?id=eq.${encodeURIComponent(session.clinicId)}`,
    {
      method: "PATCH",
      headers: headers(session),
      body: JSON.stringify({
        location_config: {
          ...currentLocConfig,
          integrations: updatedIntegrations,
        },
      }),
    }
  );

  if (!updateResult.ok) {
    res.status(502).json({ error: "تعذر حفظ إعدادات التكامل في قاعدة البيانات." });
    return;
  }

  clinicEvents.emitClinicEvent(session.clinicId, "settings.updated", { integrations: true });
  res.json({ success: true, integrations: updatedIntegrations });
});

// 3. POST /api/integrations/test-webhook - Ping external webhook URL (Zapier / Make / CRM)
router.post("/integrations/test-webhook", async (req: Request, res: Response) => {
  let session: Session | null = null;
  try {
    session = await requireClinicPermission(req, "Settings", "clinic_settings", "manage");
  } catch (error) {
    respondToPermissionError(res, error);
    return;
  }
  if (!session) return;

  const { webhookUrl } = req.body;
  if (!webhookUrl || typeof webhookUrl !== "string") {
    res.status(400).json({ error: "يرجى تحديد رابط الويب هوك للاختبار." });
    return;
  }

  // حماية من SSRF: نتحقق من الرابط ونحل اسم النطاق قبل أي طلب، ونرفض إعادة التوجيه
  let target: URL;
  try {
    target = await assertSafeWebhookTarget(webhookUrl);
  } catch (guardErr) {
    res.status(400).json({
      success: false,
      error: guardErr instanceof Error ? guardErr.message : "رابط الويب هوك غير مسموح.",
    });
    return;
  }

  try {
    const testPayload = {
      event: "test.ping",
      clinicId: session.clinicId,
      timestamp: new Date().toISOString(),
      data: {
        message: "اختبار اتصال ناجح مع منصة MERUNA SYSTEM 🚀",
        samplePatient: { name: "مريض تجريبي", phone: "+966500000000" },
      },
    };

    const pingRes = await fetch(target, {
      method: "POST",
      // نستخدم manual لمنع المتابعة التلقائية لأي إعادة توجيه قد تقود لعناوين داخلية
      redirect: "manual",
      headers: { "Content-Type": "application/json", "User-Agent": "MERUNA-Webhook-Dispatcher/2.0" },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10_000),
    });

    if (pingRes.status >= 300 && pingRes.status < 400) {
      res.status(400).json({
        success: false,
        error: "رابط الويب هوك يعيد التوجيه، وإعادة التوجيه غير مسموحة لأسباب أمنية.",
      });
      return;
    }

    res.json({
      success: pingRes.ok,
      statusCode: pingRes.status,
      message: pingRes.ok ? "تم إرسال إشعار الاختبار بنجاح!" : `استجاب السيرفر برمز خطأ ${pingRes.status}`,
    });
  } catch (err) {
    res.status(502).json({
      success: false,
      error: `تعذر الاتصال برابط الويب هوك: ${err instanceof Error ? err.message : "خطأ غير معروف"}`,
    });
  }
});

// ==========================================
// 4. OPEN REST API (For External Systems & CRMs)
// Authenticated via Header: `x-clinic-api-key`
// ==========================================

async function resolveClinicByApiKey(req: Request): Promise<{ clinicId: string } | null> {
  const rawKey = (req.headers["x-clinic-api-key"] || req.headers["authorization"]?.replace(/^Bearer\s+/i, "")) as string;
  if (!rawKey || typeof rawKey !== "string") return null;
  const provided = rawKey.trim();
  if (!provided) return null;

  // Search clinics where location_config->integrations->apiKey matches
  const clinicsRes = await supabaseAdminRequest<Array<{ id: string; location_config?: Record<string, any> }>>(
    `/rest/v1/clinics?select=id,location_config&deleted_at=is.null&limit=200`
  );

  if (!clinicsRes.ok || !clinicsRes.data) return null;

  const match = clinicsRes.data.find((c) => {
    const stored = c.location_config?.integrations?.apiKey;
    // نتحقق دائماً بمقارنة timing-safe ضد المفتاح العشوائي المخزن فقط
    if (typeof stored === "string" && stored && safeKeyEquals(stored, provided)) return true;
    // ملاحظة انتقالية: نقبل المفتاح القديم المشتق من clinic_id فقط حين لا يوجد مفتاح مخزن بعد،
    // وبمجرد فتح صفحة التكامل يُولَّد مفتاح عشوائي ويُخزَّن فيتوقف القديم عن العمل
    if (!stored) {
      const legacyKey = `mrn_live_sk_${c.id.slice(0, 8)}_${Buffer.from(c.id).toString("hex").slice(0, 12)}`;
      return safeKeyEquals(legacyKey, provided);
    }
    return false;
  });

  return match ? { clinicId: match.id } : null;
}

// POST /api/v1/external/patients - Ingest new lead or patient from external marketing/CRM
router.post("/v1/external/patients", async (req: Request, res: Response) => {
  const clinic = await resolveClinicByApiKey(req);
  if (!clinic) {
    res.status(401).json({ error: "Unauthorized: Invalid or missing x-clinic-api-key header." });
    return;
  }

  const { name, phone, email, notes, source } = req.body;
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "Field 'name' is required." });
    return;
  }

  const insertResult = await supabaseAdminRequest<Array<Record<string, unknown>>>("/rest/v1/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({
      clinic_id: clinic.clinicId,
      name: name.trim(),
      phone: phone ? String(phone).trim() : null,
      email: email ? String(email).trim() : null,
      notes: notes ? `${notes} (المصدر: ${source || "External API"})` : `المصدر: ${source || "External API"}`,
      status: "active",
    }),
  });

  if (!insertResult.ok || !insertResult.data?.length) {
    res.status(500).json({ error: "Failed to store patient in database." });
    return;
  }

  const created = insertResult.data[0];
  clinicEvents.emitClinicEvent(clinic.clinicId, "patient.created", { patientId: created.id, name: created.name });

  res.status(201).json({
    success: true,
    message: "Patient/lead created successfully in MERUNA.",
    patient: created,
  });
});

// POST /api/v1/external/appointments - Ingest booking from external website/EHR
router.post("/v1/external/appointments", async (req: Request, res: Response) => {
  const clinic = await resolveClinicByApiKey(req);
  if (!clinic) {
    res.status(401).json({ error: "Unauthorized: Invalid or missing x-clinic-api-key header." });
    return;
  }

  const { patientName, patientPhone, scheduledAt, serviceName, notes } = req.body;
  if (!patientName) {
    res.status(400).json({ error: "Field 'patientName' is required." });
    return;
  }

  // Get primary branch
  const branchRes = await supabaseAdminRequest<Array<{ id: string }>>(
    `/rest/v1/branches?select=id&clinic_id=eq.${encodeURIComponent(clinic.clinicId)}&limit=1`
  );
  const branchId = branchRes.data?.[0]?.id || null;

  const insertResult = await supabaseAdminRequest<Array<Record<string, unknown>>>("/rest/v1/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({
      clinic_id: clinic.clinicId,
      branch_id: branchId,
      patient_name: String(patientName).trim(),
      scheduled_at: scheduledAt || new Date().toISOString(),
      status: "confirmed",
      notes: notes ? String(notes).trim() : (serviceName ? `خدمة: ${serviceName}` : "حجز خارجي"),
    }),
  });

  if (!insertResult.ok || !insertResult.data?.length) {
    res.status(500).json({ error: "Failed to create appointment in database." });
    return;
  }

  const created = insertResult.data[0];
  clinicEvents.emitClinicEvent(clinic.clinicId, "appointment.booked", { appointmentId: created.id, name: patientName });

  res.status(201).json({
    success: true,
    message: "Appointment booked successfully in MERUNA.",
    appointment: created,
  });
});

export default router;
