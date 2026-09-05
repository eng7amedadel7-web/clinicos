import { timingSafeEqual } from "node:crypto";
import { Router, type NextFunction, type Request, type Response } from "express";
import { supabaseAdminRequest } from "../lib/supabase";
import { sendWasapFlowMessage } from "../lib/wasapflow";
import { logger } from "../lib/logger";

// =============================================================================
// Scheduled jobs for Vercel Cron (see "crons" in vercel.json).
//
// Auth: Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically
// when the CRON_SECRET env var is set, so every endpoint here compares that
// header against the configured secret. When CRON_SECRET is unset the check is
// skipped ONLY outside production so local dev keeps working; in production a
// missing secret fails closed.
//
// DST caveat for the reminders schedule (vercel.json is plain JSON and cannot
// carry comments, so it is documented here and in
// supabase/migrations/2026_09_05_reminder_tracking.sql): "0 6 * * *" is 09:00
// in Africa/Cairo while DST is active (UTC+3) and 08:00 in winter (UTC+2).
// Message times are always rendered with the clinic timezone, so only the send
// moment shifts — never the time shown to the patient.
// =============================================================================

const router = Router();

const DEFAULT_TIMEZONE = "Africa/Cairo";
const REMINDER_WINDOW_HOURS = 24;
const REMINDER_BATCH_LIMIT = 200;
const REMINDER_STATUSES = ["pending", "scheduled", "confirmed"] as const;

type CronAppointmentRow = {
  id?: string;
  clinic_id?: string;
  patient_id?: string;
  scheduled_at?: string | null;
  appointment_status?: string | null;
};
type CronPatientRow = { id?: string; name?: string | null; first_name?: string | null; last_name?: string | null; phone?: string | null };
type CronClinicRow = { id?: string; name?: string | null; timezone?: string | null; location_config?: Record<string, unknown> | null };
type ChannelRow = { id?: string; type?: string; provider?: string; config?: Record<string, unknown> | null; status?: string };
type TrialSubscriptionRow = { id?: string; clinic_id?: string; plan?: string | null; status?: string | null; trial_ends_at?: string | null };
type TrialClinicRow = { id?: string; name?: string | null; status?: string | null };

function safeEqual(provided: string, expected: string): boolean {
  try {
    const providedBuffer = Buffer.from(provided, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    if (providedBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(providedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

function cronGuard(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      logger.error("[Cron] CRON_SECRET is not set in production; refusing to run scheduled jobs");
      res.status(503).json({ error: "المهام المجدولة معطّلة: CRON_SECRET غير مضبوط في البيئة." });
      return;
    }
    next();
    return;
  }
  // Vercel Cron sends "Authorization: Bearer $CRON_SECRET" when the env var exists.
  const provided = req.get("authorization") ?? "";
  if (!safeEqual(provided, `Bearer ${secret}`)) {
    res.status(401).json({ error: "مفتاح المهام المجدولة غير صحيح." });
    return;
  }
  next();
}

function inFilter(values: string[]): string {
  return values.map(encodeURIComponent).join(",");
}

function clinicName(clinic: CronClinicRow | undefined): string {
  return clinic?.name?.trim() || "العيادة";
}

function patientName(patient: CronPatientRow | undefined): string {
  return patient?.name?.trim() || [patient?.first_name, patient?.last_name].filter(Boolean).join(" ").trim() || "مريض بدون اسم";
}

function resolveTimezone(clinic: CronClinicRow | undefined): string {
  const configured = clinic?.timezone?.trim();
  return configured || DEFAULT_TIMEZONE;
}

function formatAppointmentDateTime(iso: string, timezone: string): { date: string; time: string } | null {
  const moment = new Date(iso);
  if (Number.isNaN(moment.getTime())) return null;
  try {
    const date = new Intl.DateTimeFormat("ar-EG", { timeZone: timezone, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(moment);
    const time = new Intl.DateTimeFormat("ar-EG", { timeZone: timezone, hour: "numeric", minute: "2-digit", hour12: true }).format(moment);
    return { date, time };
  } catch {
    // Invalid clinic timezone string: fall back to the default instead of failing the whole run.
    const date = new Intl.DateTimeFormat("ar-EG", { timeZone: DEFAULT_TIMEZONE, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(moment);
    const time = new Intl.DateTimeFormat("ar-EG", { timeZone: DEFAULT_TIMEZONE, hour: "numeric", minute: "2-digit", hour12: true }).format(moment);
    return { date, time };
  }
}

function resolveWabaId(channel: ChannelRow | undefined, clinic: CronClinicRow | undefined): string {
  // Same resolution order as lib/outbound.ts: channel config waba_id/wabaId,
  // then clinic location_config.channels.whatsapp.wabaId as fallback.
  const config = (channel?.config ?? {}) as Record<string, unknown>;
  const fromChannel = config.waba_id ?? config.wabaId;
  if (typeof fromChannel === "string" && fromChannel.trim()) return fromChannel.trim();
  const locationConfig = (clinic?.location_config ?? {}) as { channels?: { whatsapp?: { wabaId?: unknown } } };
  const fromLocation = locationConfig.channels?.whatsapp?.wabaId;
  return typeof fromLocation === "string" ? fromLocation.trim() : "";
}

async function loadClinicChannel(clinicId: string, clinic: CronClinicRow | undefined, cache: Map<string, ChannelRow | undefined>): Promise<ChannelRow | undefined> {
  if (cache.has(clinicId)) return cache.get(clinicId);
  const result = await supabaseAdminRequest<ChannelRow[]>(
    `/rest/v1/channels?select=id,type,provider,config,status&clinic_id=eq.${encodeURIComponent(clinicId)}&is_enabled=eq.true&order=updated_at.desc&limit=5`
  );
  const channel = result.ok ? result.data?.[0] : undefined;
  cache.set(clinicId, channel);
  return channel;
}

router.get("/cron/reminders", cronGuard, async (_req, res) => {
  const ranAt = new Date();
  const windowFrom = ranAt.toISOString();
  const windowTo = new Date(ranAt.getTime() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  try {
    // Upcoming, still-active appointments without a reminder yet. The
    // reminder_sent_at column comes from supabase/migrations/2026_09_05_reminder_tracking.sql.
    const appointmentsResult = await supabaseAdminRequest<CronAppointmentRow[]>(
      `/rest/v1/appointments?select=id,clinic_id,patient_id,scheduled_at,appointment_status` +
        `&deleted_at=is.null&appointment_status=in.(${REMINDER_STATUSES.join(",")})` +
        `&reminder_sent_at=is.null&scheduled_at=gte.${encodeURIComponent(windowFrom)}&scheduled_at=lte.${encodeURIComponent(windowTo)}` +
        `&order=scheduled_at.asc&limit=${REMINDER_BATCH_LIMIT}`
    );
    if (!appointmentsResult.ok) {
      logger.error({ status: appointmentsResult.status }, "[Cron] Reminders: appointments lookup failed");
      res.status(502).json({ error: "تعذّر تحميل مواعيد التذكير من قاعدة البيانات." });
      return;
    }
    const appointments = (appointmentsResult.data ?? []).filter((row) => row.id && row.clinic_id && row.patient_id && row.scheduled_at);

    const patientIds = [...new Set(appointments.map((row) => String(row.patient_id)))];
    const clinicIds = [...new Set(appointments.map((row) => String(row.clinic_id)))];

    const [patientsResult, clinicsResult] = await Promise.all([
      patientIds.length
        ? supabaseAdminRequest<CronPatientRow[]>(`/rest/v1/patients?select=id,name,first_name,last_name,phone&id=in.(${inFilter(patientIds)})`)
        : Promise.resolve({ ok: true, status: 200, data: [] as CronPatientRow[] }),
      clinicIds.length
        ? supabaseAdminRequest<CronClinicRow[]>(`/rest/v1/clinics?select=id,name,timezone,location_config&id=in.(${inFilter(clinicIds)})`)
        : Promise.resolve({ ok: true, status: 200, data: [] as CronClinicRow[] }),
    ]);
    if (!patientsResult.ok || !clinicsResult.ok) {
      logger.error({ patientsStatus: patientsResult.status, clinicsStatus: clinicsResult.status }, "[Cron] Reminders: patients/clinics lookup failed");
      res.status(502).json({ error: "تعذّر تحميل بيانات المرضى أو العيادات لإرسال التذكيرات." });
      return;
    }

    const patients = new Map((patientsResult.data ?? []).map((row) => [String(row.id), row]));
    const clinics = new Map((clinicsResult.data ?? []).map((row) => [String(row.id), row]));
    const channelCache = new Map<string, ChannelRow | undefined>();

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const results: Array<{ appointmentId: string; patientName: string; scheduledAt: string; status: string; error?: string }> = [];

    for (const appointment of appointments) {
      const appointmentId = String(appointment.id);
      const clinicId = String(appointment.clinic_id);
      const patient = patients.get(String(appointment.patient_id));
      const clinic = clinics.get(clinicId);
      const name = patientName(patient);
      const base = { appointmentId, patientName: name, scheduledAt: String(appointment.scheduled_at) };

      const phone = patient?.phone?.trim();
      if (!phone) {
        skipped += 1;
        // No phone on file: leave reminder_sent_at null so the job can retry once data is fixed.
        results.push({ ...base, status: "skipped", error: "لا يوجد رقم هاتف للمريض." });
        continue;
      }

      const channel = await loadClinicChannel(clinicId, clinic, channelCache);
      const wabaId = resolveWabaId(channel, clinic);
      if (!wabaId) {
        skipped += 1;
        results.push({ ...base, status: "skipped", error: "لا توجد قناة واتساب مفعّلة للعيادة." });
        continue;
      }

      const formatted = formatAppointmentDateTime(String(appointment.scheduled_at), resolveTimezone(clinic));
      if (!formatted) {
        skipped += 1;
        results.push({ ...base, status: "skipped", error: "موعد غير صالح." });
        continue;
      }

      const message = `تذكير: موعدك في ${clinicName(clinic)} يوم ${formatted.date} الساعة ${formatted.time}. بانتظارك!`;
      try {
        const sendResult = await sendWasapFlowMessage(wabaId, phone, message);
        const markResult = await supabaseAdminRequest(`/rest/v1/appointments?id=eq.${encodeURIComponent(appointmentId)}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ reminder_sent_at: new Date().toISOString() }),
        });
        if (!markResult.ok) {
          logger.warn({ appointmentId, status: markResult.status }, "[Cron] Reminder sent but reminder_sent_at update failed");
        }
        sent += 1;
        logger.info({ appointmentId, clinicId, messageId: sendResult.messageId ?? null }, "[Cron] Appointment reminder sent");
        results.push({ ...base, status: "sent" });
      } catch (sendError) {
        failed += 1;
        const reason = sendError instanceof Error ? sendError.message : "تعذّر إرسال الرسالة.";
        logger.warn({ appointmentId, clinicId, err: sendError }, "[Cron] Appointment reminder send failed");
        results.push({ ...base, status: "failed", error: reason });
      }
    }

    res.json({
      job: "reminders",
      ranAt: windowFrom,
      window: { from: windowFrom, to: windowTo },
      candidates: appointments.length,
      sent,
      failed,
      skipped,
      results,
    });
  } catch (error) {
    logger.error({ err: error }, "[Cron] Reminders job crashed");
    res.status(500).json({ error: "فشل تشغيل مهمة تذكير المواعيد." });
  }
});

router.get("/cron/trial-expiry", cronGuard, async (_req, res) => {
  const ranAt = new Date().toISOString();

  try {
    // Report-only by design: the codebase has no explicit "trial expired"
    // status value (billing.ts maps trialing/active/past_due/paused/canceled,
    // and Paddle owns status transitions), so this job never mutates
    // clinic_subscriptions — it only flags expired trials for operators.
    const subscriptionsResult = await supabaseAdminRequest<TrialSubscriptionRow[]>(
      `/rest/v1/clinic_subscriptions?select=id,clinic_id,plan,status,trial_ends_at&status=eq.trialing&trial_ends_at=lt.${encodeURIComponent(ranAt)}&order=trial_ends_at.asc&limit=500`
    );
    if (!subscriptionsResult.ok) {
      logger.error({ status: subscriptionsResult.status }, "[Cron] Trial expiry: subscriptions lookup failed");
      res.status(502).json({ error: "تعذّر تحميل بيانات الاشتراكات التجريبية من قاعدة البيانات." });
      return;
    }
    const subscriptions = (subscriptionsResult.data ?? []).filter((row) => row.id && row.clinic_id);

    const clinicIds = [...new Set(subscriptions.map((row) => String(row.clinic_id)))];
    const clinicsResult = clinicIds.length
      ? await supabaseAdminRequest<TrialClinicRow[]>(`/rest/v1/clinics?select=id,name,status&id=in.(${inFilter(clinicIds)})`)
      : { ok: true, status: 200, data: [] as TrialClinicRow[] };
    if (!clinicsResult.ok) {
      logger.error({ status: clinicsResult.status }, "[Cron] Trial expiry: clinics lookup failed");
      res.status(502).json({ error: "تعذّر تحميل بيانات العيادات لفحص انتهاء التجربة." });
      return;
    }

    const clinics = new Map((clinicsResult.data ?? []).map((row) => [String(row.id), row]));
    const expiredTrials = subscriptions.map((row) => {
      const clinic = clinics.get(String(row.clinic_id));
      return {
        subscriptionId: String(row.id),
        clinicId: String(row.clinic_id),
        clinicName: clinic?.name?.trim() || "عيادة بدون اسم",
        clinicStatus: clinic?.status ?? null,
        plan: row.plan ?? null,
        trialEndedAt: row.trial_ends_at ?? null,
      };
    });

    logger.info({ expiredCount: expiredTrials.length }, "[Cron] Trial expiry report generated");
    res.json({
      job: "trial-expiry",
      ranAt,
      mode: "report-only",
      expiredTrialCount: expiredTrials.length,
      expiredTrials,
    });
  } catch (error) {
    logger.error({ err: error }, "[Cron] Trial expiry job crashed");
    res.status(500).json({ error: "فشل تشغيل مهمة فحص انتهاء التجربة." });
  }
});

export default router;
