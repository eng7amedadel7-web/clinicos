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

  // Auto-generate API key if none exists
  const apiKey = config.apiKey || `mrn_live_sk_${session.clinicId.slice(0, 8)}_${Buffer.from(session.clinicId).toString("hex").slice(0, 12)}`;

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

  const apiKey = parsed.data.regenerateKey
    ? `mrn_live_sk_${session.clinicId.slice(0, 8)}_${Date.now().toString(36)}`
    : (currentIntegrations.apiKey || `mrn_live_sk_${session.clinicId.slice(0, 8)}_${Buffer.from(session.clinicId).toString("hex").slice(0, 12)}`);

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

    const pingRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "MERUNA-Webhook-Dispatcher/2.0" },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10_000),
    });

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
  const apiKey = (req.headers["x-clinic-api-key"] || req.headers["authorization"]?.replace(/^Bearer\s+/i, "")) as string;
  if (!apiKey || typeof apiKey !== "string") return null;

  // Search clinics where location_config->integrations->apiKey matches or fallback by ID prefix
  const clinicsRes = await supabaseAdminRequest<Array<{ id: string; location_config?: Record<string, any> }>>(
    `/rest/v1/clinics?select=id,location_config&deleted_at=is.null&limit=200`
  );

  if (!clinicsRes.ok || !clinicsRes.data) return null;

  const match = clinicsRes.data.find((c) => {
    const key = c.location_config?.integrations?.apiKey;
    if (key && key === apiKey.trim()) return true;
    // Default fallback check
    const defaultKey = `mrn_live_sk_${c.id.slice(0, 8)}_${Buffer.from(c.id).toString("hex").slice(0, 12)}`;
    return defaultKey === apiKey.trim();
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
