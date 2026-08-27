import { createHash, randomBytes } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { requireClinicPermission, respondToPermissionError } from "../lib/permissions";
import { type SessionPayload } from "../lib/session";
import { supabaseRequest } from "../lib/supabase";

const router = Router();
const publicTokenPattern = /^[A-Za-z0-9_-]{40,80}$/;
const activeAppointmentStatuses = new Set(["scheduled", "confirmed", "checked_in", "pending"]);

type AppointmentRow = {
  id?: string;
  public_id?: string;
  clinic_id?: string;
  scheduled_at?: string;
  appointment_status?: string;
  booking_number?: string | null;
  queue_number?: number | null;
  updated_at?: string;
};

type ProjectionRow = {
  clinic_name?: string;
  branch_name?: string | null;
  user_name?: string;
  booking_number?: string | null;
  queue_number?: number | null;
  appointment_status?: string;
  scheduled_at?: string;
  updated_at?: string;
  people_ahead?: number | null;
};

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

router.post("/appointments/:id/queue-link", async (req, res) => {
  const session = await protect(req, res);
  if (!session) return;

  const appointmentResult = await supabaseRequest<AppointmentRow[]>(
    `/rest/v1/appointments?select=id,public_id,clinic_id,scheduled_at,appointment_status,booking_number,queue_number,updated_at&clinic_id=eq.${encodeURIComponent(session.clinicId)}&id=eq.${encodeURIComponent(req.params.id)}&deleted_at=is.null&limit=1`,
    { headers: authHeaders(session) },
  );
  if (!appointmentResult.ok) { res.status(appointmentResult.status || 502).json({ error: "تعذر قراءة الحجز قبل إصدار رابط الكيو." }); return; }
  const appointment = appointmentResult.data?.[0];
  if (!appointment?.public_id) { res.status(404).json({ error: "الحجز غير موجود في العيادة الحالية." }); return; }
  if (!activeAppointmentStatuses.has(appointment.appointment_status || "scheduled")) { res.status(409).json({ error: "لا يمكن إصدار رابط كيو لحجز غير نشط." }); return; }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const issueResult = await supabaseRequest<Array<{ booking_id?: string; queue_number?: number | null }>>("/rest/v1/rpc/issue_public_queue_link", {
    method: "POST",
    headers: authHeaders(session),
    body: JSON.stringify({ p_appointment_id: req.params.id, p_token_hash: hashToken(token), p_expires_at: expiresAt }),
  });
  if (!issueResult.ok) { res.status(issueResult.status || 503).json({ error: "تعذر إصدار رابط الكيو. تأكد من تطبيق migration الخاصة بروابط الكيو." }); return; }
  if (!issueResult.data?.[0]?.booking_id) { res.status(404).json({ error: "الحجز غير موجود في العيادة الحالية." }); return; }

  res.status(201).json({ bookingId: issueResult.data[0].booking_id, queueNumber: issueResult.data[0].queue_number ?? null, queuePath: `/queue/${token}`, expiresAt });
});

router.delete("/appointments/:id/queue-link", async (req, res) => {
  const session = await protect(req, res);
  if (!session) return;
  const result = await supabaseRequest("/rest/v1/rpc/revoke_public_queue_link", {
    method: "POST",
    headers: authHeaders(session),
    body: JSON.stringify({ p_appointment_id: req.params.id }),
  });
  if (!result.ok) { res.status(result.status || 503).json({ error: "تعذر إلغاء رابط الكيو." }); return; }
  res.status(204).send();
});

router.get("/public/queue/:token", async (req, res) => {
  const token = typeof req.params.token === "string" ? req.params.token.trim() : "";
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  if (!publicTokenPattern.test(token)) { res.status(404).json({ error: "رابط الكيو غير صالح." }); return; }

  const projectionResult = await supabaseRequest<ProjectionRow[]>("/rest/v1/rpc/get_public_queue_projection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ p_token_hash: hashToken(token) }),
  });
  if (!projectionResult.ok) { res.status(503).json({ error: "خدمة الكيو غير متاحة حاليًا." }); return; }
  const projection = projectionResult.data?.[0];
  if (!projection?.clinic_name || !projection.scheduled_at) { res.status(404).json({ error: "رابط الكيو غير صالح أو منتهي." }); return; }

  const state = projection.appointment_status === "cancelled"
    ? "cancelled"
    : projection.appointment_status === "completed"
      ? "completed"
      : projection.appointment_status === "no_show"
        ? "expired"
        : projection.appointment_status === "checked_in" ? "called" : "waiting";

  res.json({
    clinicName: projection.clinic_name,
    branchName: projection.branch_name || null,
    userName: projection.user_name || "المستخدم",
    ticketLabel: projection.booking_number || "—",
    queueNumber: projection.queue_number ?? null,
    state,
    peopleAhead: projection.people_ahead ?? null,
    estimatedWaitMinutes: null,
    updatedAt: projection.updated_at || projection.scheduled_at,
    supportAvailable: false,
  });
});

export default router;
