import { Router } from "express";
import { readSession } from "../lib/session";
import { supabaseRequest } from "../lib/supabase";
const router = Router();
type AppointmentRow = { id?: string; patient_id?: string; appointment_status?: string; scheduled_at?: string };
type PatientRow = { id?: string; name?: string; first_name?: string; last_name?: string };
type AppointmentInput = { patientId?: unknown; scheduledAt?: unknown; status?: unknown; notes?: unknown };
function appointmentHeaders(accessToken: string, extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...extra };
}
function appointmentInput(body: AppointmentInput) {
  return {
    patientId: typeof body.patientId === "string" ? body.patientId.trim() : "",
    scheduledAt: typeof body.scheduledAt === "string" ? body.scheduledAt.trim() : "",
    status: typeof body.status === "string" ? body.status.trim() : "scheduled",
    notes: typeof body.notes === "string" ? body.notes.trim() : "",
  };
}
router.get("/appointments", async (req, res) => {
  const session = readSession(req);
  if (!session) { res.status(401).json({ error: "Not authenticated." }); return; }
  const filter = "clinic_id=eq." + encodeURIComponent(session.clinicId) + "&deleted_at=is.null";
  const [appointmentsResult, patientsResult] = await Promise.all([
    supabaseRequest<AppointmentRow[]>("/rest/v1/appointments?select=id,patient_id,appointment_status,scheduled_at&" + filter + "&order=scheduled_at.asc&limit=100", { headers: { Authorization: `Bearer ${session.accessToken}` } }),
    supabaseRequest<PatientRow[]>("/rest/v1/patients?select=id,name,first_name,last_name&" + filter + "&limit=1000", { headers: { Authorization: `Bearer ${session.accessToken}` } }),
  ]);
  if (!appointmentsResult.ok) { res.status(appointmentsResult.status || 502).json({ error: "Appointments could not be loaded." }); return; }
  const patients = new Map((patientsResult.data ?? []).map((p) => [String(p.id), p]));
  res.json((appointmentsResult.data ?? []).map((row) => { const p = patients.get(String(row.patient_id)); return { id: row.id, name: p?.name || [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "مريض بدون اسم", scheduledAt: row.scheduled_at, status: row.appointment_status || "scheduled" }; }));
});

router.post("/appointments", async (req, res) => {
  const session = readSession(req);
  if (!session) { res.status(401).json({ error: "Not authenticated." }); return; }
  const data = appointmentInput(req.body ?? {});
  if (!data.patientId || !data.scheduledAt) { res.status(400).json({ error: "المريض ووقت الموعد مطلوبان." }); return; }
  const patientCheck = await supabaseRequest<{ id?: string }[]>(`/rest/v1/patients?select=id&id=eq.${encodeURIComponent(data.patientId)}&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null&limit=1`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
  if (!patientCheck.ok) { res.status(patientCheck.status || 502).json({ error: "تعذر التحقق من المريض." }); return; }
  if (!patientCheck.data?.length) { res.status(404).json({ error: "المريض غير موجود في هذه العيادة." }); return; }
  const result = await supabaseRequest<AppointmentRow[]>("/rest/v1/appointments", {
    method: "POST",
    headers: appointmentHeaders(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify({ clinic_id: session.clinicId, patient_id: data.patientId, scheduled_at: data.scheduledAt, appointment_status: data.status, notes: data.notes || null, created_by: session.userId }),
  });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر حجز الموعد." }); return; }
  res.status(201).json(result.data?.[0] ?? null);
});

router.patch("/appointments/:id", async (req, res) => {
  const session = readSession(req);
  if (!session) { res.status(401).json({ error: "Not authenticated." }); return; }
  const data = appointmentInput(req.body ?? {});
  const changes: Record<string, string> = {};
  if (data.scheduledAt) changes.scheduled_at = data.scheduledAt;
  if (data.status) changes.appointment_status = data.status;
  if (data.notes) changes.notes = data.notes;
  if (!Object.keys(changes).length) { res.status(400).json({ error: "لا توجد تغييرات." }); return; }
  const path = `/rest/v1/appointments?id=eq.${encodeURIComponent(req.params.id)}&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null`;
  const result = await supabaseRequest<AppointmentRow[]>(path, { method: "PATCH", headers: appointmentHeaders(session.accessToken, { Prefer: "return=representation" }), body: JSON.stringify({ ...changes, updated_by: session.userId }) });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر تحديث الموعد." }); return; }
  if (!result.data?.length) { res.status(404).json({ error: "الموعد غير موجود." }); return; }
  res.json(result.data[0]);
});

router.post("/appointments/:id/cancel", async (req, res) => {
  const session = readSession(req);
  if (!session) { res.status(401).json({ error: "Not authenticated." }); return; }
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
  const path = `/rest/v1/appointments?id=eq.${encodeURIComponent(req.params.id)}&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null`;
  const result = await supabaseRequest<AppointmentRow[]>(path, { method: "PATCH", headers: appointmentHeaders(session.accessToken, { Prefer: "return=representation" }), body: JSON.stringify({ appointment_status: "cancelled", cancellation_reason: reason || null, cancelled_at: new Date().toISOString(), updated_by: session.userId }) });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر إلغاء الموعد." }); return; }
  if (!result.data?.length) { res.status(404).json({ error: "الموعد غير موجود." }); return; }
  res.json(result.data[0]);
});

export default router;
