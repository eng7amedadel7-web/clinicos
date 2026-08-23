import { Router } from "express";
import { readSession } from "../lib/session";
import { supabaseRequest } from "../lib/supabase";
const router = Router();
type AppointmentRow = { id?: string; patient_id?: string; appointment_status?: string; scheduled_at?: string };
type PatientRow = { id?: string; name?: string; first_name?: string; last_name?: string };
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
export default router;
