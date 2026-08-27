import { createHash, randomBytes } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { requireClinicPermission, respondToPermissionError } from "../lib/permissions";
import { type SessionPayload } from "../lib/session";
import { supabaseAdminRequest, supabaseRequest } from "../lib/supabase";

const router = Router();
const publicTokenPattern = /^[A-Za-z0-9_-]{40,80}$/;
const activeAppointmentStatuses = new Set(["scheduled", "confirmed", "checked_in", "pending"]);

type AppointmentRow = {
  id?: string;
  public_id?: string;
  clinic_id?: string;
  patient_id?: string;
  branch_id?: string | null;
  scheduled_at?: string;
  appointment_status?: string;
  booking_number?: string | null;
  queue_number?: number | null;
  updated_at?: string;
  deleted_at?: string | null;
};

type LinkRow = { booking_id?: string; expires_at?: string; revoked_at?: string | null };
type ClinicRow = { name?: string; timezone?: string };
type PersonRow = { name?: string; first_name?: string; last_name?: string };
type BranchRow = { name?: string };

function hashToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function authHeaders(session: SessionPayload) {
  return { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" };
}

async function protect(req: Request, res: Response) {
  try {
    return await requireClinicPermission(req, "Appointments", "appointments", "update");
  } catch (error) {
    respondToPermissionError(res, error);
    return null;
  }
}

function patientName(row?: PersonRow) {
  return row?.name || [row?.first_name, row?.last_name].filter(Boolean).join(" ") || "المستخدم";
}

function localDate(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function statusForPublicPage(status: string | undefined) {
  if (status === "cancelled") return "cancelled" as const;
  if (status === "completed") return "completed" as const;
  if (status === "no_show") return "expired" as const;
  if (status === "checked_in") return "called" as const;
  return "waiting" as const;
}

router.post("/appointments/:id/queue-link", async (req, res) => {
  const session = await protect(req, res);
  if (!session) return;

  const appointmentResult = await supabaseRequest<AppointmentRow[]>(
    `/rest/v1/appointments?select=id,public_id,clinic_id,patient_id,branch_id,scheduled_at,appointment_status,booking_number,queue_number,updated_at&clinic_id=eq.${encodeURIComponent(session.clinicId)}&id=eq.${encodeURIComponent(req.params.id)}&deleted_at=is.null&limit=1`,
    { headers: authHeaders(session) },
  );
  if (!appointmentResult.ok) { res.status(appointmentResult.status || 502).json({ error: "تعذر قراءة الحجز قبل إصدار رابط الكيو." }); return; }
  const appointment = appointmentResult.data?.[0];
  if (!appointment?.public_id) { res.status(404).json({ error: "الحجز غير موجود في العيادة الحالية." }); return; }
  if (!activeAppointmentStatuses.has(appointment.appointment_status || "scheduled")) { res.status(409).json({ error: "لا يمكن إصدار رابط كيو لحجز غير نشط." }); return; }

  const bookingId = appointment.public_id;
  const revokeOld = await supabaseAdminRequest(`/rest/v1/public_queue_links?booking_id=eq.${encodeURIComponent(bookingId)}&revoked_at=is.null`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ revoked_at: new Date().toISOString() }),
  });
  if (!revokeOld.ok) { res.status(revokeOld.status || 503).json({ error: "خدمة روابط الكيو غير مفعّلة على الخادم حاليًا." }); return; }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const insert = await supabaseAdminRequest("/rest/v1/public_queue_links", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ booking_id: bookingId, token_hash: hashToken(token), expires_at: expiresAt, created_by: session.userId }),
  });
  if (!insert.ok) { res.status(insert.status || 503).json({ error: "تعذر حفظ رابط الكيو. تأكد من تطبيق migration الخاصة بروابط الكيو." }); return; }

  res.status(201).json({ bookingId, queueNumber: appointment.queue_number ?? null, queuePath: `/queue/${token}`, expiresAt });
});

router.delete("/appointments/:id/queue-link", async (req, res) => {
  const session = await protect(req, res);
  if (!session) return;
  const appointmentResult = await supabaseRequest<AppointmentRow[]>(
    `/rest/v1/appointments?select=public_id&clinic_id=eq.${encodeURIComponent(session.clinicId)}&id=eq.${encodeURIComponent(req.params.id)}&deleted_at=is.null&limit=1`,
    { headers: authHeaders(session) },
  );
  const bookingId = appointmentResult.data?.[0]?.public_id;
  if (!appointmentResult.ok || !bookingId) { res.status(404).json({ error: "الحجز غير موجود في العيادة الحالية." }); return; }
  const result = await supabaseAdminRequest(`/rest/v1/public_queue_links?booking_id=eq.${encodeURIComponent(bookingId)}&revoked_at=is.null`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ revoked_at: new Date().toISOString() }),
  });
  if (!result.ok) { res.status(result.status || 503).json({ error: "تعذر إلغاء رابط الكيو." }); return; }
  res.status(204).send();
});

router.get("/public/queue/:token", async (req, res) => {
  const token = typeof req.params.token === "string" ? req.params.token.trim() : "";
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  if (!publicTokenPattern.test(token)) { res.status(404).json({ error: "رابط الكيو غير صالح." }); return; }

  const linkResult = await supabaseAdminRequest<LinkRow[]>(`/rest/v1/public_queue_links?select=booking_id,expires_at,revoked_at&token_hash=eq.${hashToken(token)}&revoked_at=is.null&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&limit=1`);
  if (!linkResult.ok) { res.status(503).json({ error: "خدمة الكيو غير متاحة حاليًا." }); return; }
  const link = linkResult.data?.[0];
  if (!link?.booking_id) { res.status(404).json({ error: "رابط الكيو غير صالح أو منتهي." }); return; }

  const appointmentResult = await supabaseAdminRequest<AppointmentRow[]>(`/rest/v1/appointments?select=public_id,clinic_id,patient_id,branch_id,scheduled_at,appointment_status,booking_number,queue_number,updated_at&public_id=eq.${encodeURIComponent(link.booking_id)}&deleted_at=is.null&limit=1`);
  const appointment = appointmentResult.data?.[0];
  if (!appointmentResult.ok) { res.status(503).json({ error: "تعذر تحميل حالة الكيو حاليًا." }); return; }
  if (!appointment?.clinic_id || !appointment.scheduled_at) { res.status(404).json({ error: "الحجز المرتبط بالرابط غير متاح." }); return; }

  const clinicResult = await supabaseAdminRequest<ClinicRow[]>(`/rest/v1/clinics?select=name,timezone&id=eq.${encodeURIComponent(appointment.clinic_id)}&deleted_at=is.null&limit=1`);
  const patientResult = appointment.patient_id
    ? await supabaseAdminRequest<PersonRow[]>(`/rest/v1/patients?select=name,first_name,last_name&id=eq.${encodeURIComponent(appointment.patient_id)}&clinic_id=eq.${encodeURIComponent(appointment.clinic_id)}&deleted_at=is.null&limit=1`)
    : { ok: true, status: 200, data: [] as PersonRow[] };
  const branchResult = appointment.branch_id
    ? await supabaseAdminRequest<BranchRow[]>(`/rest/v1/branches?select=name&id=eq.${encodeURIComponent(appointment.branch_id)}&clinic_id=eq.${encodeURIComponent(appointment.clinic_id)}&deleted_at=is.null&limit=1`)
    : { ok: true, status: 200, data: [] as BranchRow[] };
  if (!clinicResult.ok || !patientResult.ok || !branchResult.ok) { res.status(503).json({ error: "تعذر تحميل تفاصيل الكيو حاليًا." }); return; }

  const clinic = clinicResult.data?.[0];
  const timezone = clinic?.timezone || "UTC";
  const queueNumber = appointment.queue_number ?? null;
  let peopleAhead: number | null = null;
  if (queueNumber !== null) {
    const scheduledTime = new Date(appointment.scheduled_at).getTime();
    const start = new Date(scheduledTime - 36 * 60 * 60 * 1000).toISOString();
    const end = new Date(scheduledTime + 36 * 60 * 60 * 1000).toISOString();
    const aheadResult = await supabaseAdminRequest<AppointmentRow[]>(`/rest/v1/appointments?select=queue_number,appointment_status,scheduled_at&clinic_id=eq.${encodeURIComponent(appointment.clinic_id)}&scheduled_at=gte.${encodeURIComponent(start)}&scheduled_at=lt.${encodeURIComponent(end)}&queue_number=lt.${encodeURIComponent(String(queueNumber))}&deleted_at=is.null&limit=500`);
    if (aheadResult.ok) {
      const targetDate = localDate(appointment.scheduled_at, timezone);
      peopleAhead = (aheadResult.data ?? []).filter((row) => activeAppointmentStatuses.has(row.appointment_status || "scheduled") && typeof row.scheduled_at === "string" && localDate(row.scheduled_at, timezone) === targetDate).length;
    }
  }

  const status = statusForPublicPage(appointment.appointment_status);
  res.json({
    clinicName: clinic?.name || "العيادة",
    branchName: branchResult.data?.[0]?.name || null,
    userName: patientName(patientResult.data?.[0]),
    bookingId: appointment.public_id,
    ticketLabel: appointment.booking_number || appointment.public_id,
    queueNumber,
    state: status,
    peopleAhead,
    estimatedWaitMinutes: null,
    updatedAt: appointment.updated_at || appointment.scheduled_at,
    supportAvailable: false,
    expiresAt: link.expires_at,
  });
});

export default router;
