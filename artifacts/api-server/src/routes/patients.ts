import { Router } from "express";
import { requireClinicPermission, respondToPermissionError } from "../lib/permissions";
import { supabaseRequest } from "../lib/supabase";
import { clinicEvents } from "../lib/events";

const router = Router();
type PatientRow = { id?: string; name?: string; first_name?: string; last_name?: string; phone?: string; email?: string; notes?: string; created_at?: string };
type PatientInput = { name?: unknown; phone?: unknown; email?: unknown; notes?: unknown; age?: unknown; address?: unknown; };

function sessionHeaders(accessToken: string, extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...extra };
}

function input(body: PatientInput) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const ageRaw = typeof body.age === "number" ? body.age : Number.parseInt(String(body.age ?? ""), 10);
  const age = Number.isFinite(ageRaw) ? Math.min(130, Math.max(0, ageRaw)) : null;
  return { name, phone, email, notes, address, age };
}

router.get("/patients", async (req, res) => {
  let session;
  try { session = await requireClinicPermission(req, "Patients", "patients", "read"); } catch (error) { respondToPermissionError(res, error); return; }
  const limit = clampInt(req.query.limit, 1000, 1, 1000);
  const offset = clampInt(req.query.offset, 0, 0, 1_000_000);
  const path = "/rest/v1/patients?select=id,name,first_name,last_name,phone,email,notes,age,address,created_at&clinic_id=eq." + encodeURIComponent(session.clinicId) + "&deleted_at=is.null&order=created_at.desc&limit=" + limit + "&offset=" + offset;
  const result = await supabaseRequest<PatientRow[]>(path, { headers: { Authorization: `Bearer ${session.accessToken}` } });
  if (!result.ok) { res.status(result.status || 502).json({ error: "Patients could not be loaded." }); return; }
  const items = (result.data ?? []).map((patient) => ({ id: patient.id, name: patient.name || [patient.first_name, patient.last_name].filter(Boolean).join(" ") || "مريض بدون اسم", phone: patient.phone || "—", email: patient.email || null, notes: patient.notes || null, createdAt: patient.created_at || null }));
  res.json({ items, total: items.length, hasMore: items.length >= limit });
});

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(typeof value === "string" ? value : "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

router.post("/patients", async (req, res) => {
  let session;
  try { session = await requireClinicPermission(req, "Patients", "patients", "create"); } catch (error) { respondToPermissionError(res, error); return; }
  const data = input(req.body ?? {});
  if (!data.name) { res.status(400).json({ error: "اسم المريض مطلوب." }); return; }
  const result = await supabaseRequest<PatientRow[]>("/rest/v1/patients", {
    method: "POST",
    headers: sessionHeaders(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify({ clinic_id: session.clinicId, name: data.name, phone: data.phone || null, email: data.email || null, notes: data.notes || null, address: data.address || null, age: data.age ?? null, status: "active" }),
  });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر حفظ المريض." }); return; }
  const created = result.data?.[0] ?? null;
  if (created?.id) {
    clinicEvents.emitClinicEvent(session.clinicId, "patient.created", { patientId: created.id, name: data.name });
  }
  res.status(201).json(created);
});

router.patch("/patients/:id", async (req, res) => {
  let session;
  try { session = await requireClinicPermission(req, "Patients", "patients", "update"); } catch (error) { respondToPermissionError(res, error); return; }
  const data = input(req.body ?? {});
  if (!data.name) { res.status(400).json({ error: "اسم المريض مطلوب." }); return; }
  const path = "/rest/v1/patients?id=eq." + encodeURIComponent(req.params.id) + "&clinic_id=eq." + encodeURIComponent(session.clinicId) + "&deleted_at=is.null";
  const result = await supabaseRequest<PatientRow[]>(path, {
    method: "PATCH",
    headers: sessionHeaders(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify({ name: data.name, phone: data.phone || null, email: data.email || null, notes: data.notes || null, address: data.address || null, age: data.age ?? null }),
  });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر تحديث المريض." }); return; }
  if (!result.data?.length) { res.status(404).json({ error: "المريض غير موجود." }); return; }
  const updated = result.data[0];
  clinicEvents.emitClinicEvent(session.clinicId, "patient.updated", { patientId: req.params.id, name: data.name });
  res.json(updated);
});

router.get("/patients/:id/360", async (req, res) => {
  let session;
  try { session = await requireClinicPermission(req, "Patients", "patients", "read"); } catch (error) { respondToPermissionError(res, error); return; }
  const clinicId = encodeURIComponent(session.clinicId);
  const patientId = encodeURIComponent(req.params.id);
  const headers = { Authorization: `Bearer ${session.accessToken}` };
  const patientResult = await supabaseRequest<PatientRow[]>(`/rest/v1/patients?select=id,name,first_name,last_name,phone,created_at&clinic_id=eq.${clinicId}&id=eq.${patientId}&deleted_at=is.null&limit=1`, { headers });
  if (!patientResult.ok) { res.status(patientResult.status || 502).json({ error: "تعذر تحميل ملف المريض." }); return; }
  const patient = patientResult.data?.[0];
  if (!patient) { res.status(404).json({ error: "المريض غير موجود في هذه العيادة." }); return; }
  const [appointments, conversations, followUps, noShows] = await Promise.all([
    supabaseRequest<Record<string, unknown>[]>(`/rest/v1/appointments?select=id,scheduled_at,appointment_status,booking_number,branch_id,doctor_id,service_id,created_at&clinic_id=eq.${clinicId}&patient_id=eq.${patientId}&deleted_at=is.null&order=scheduled_at.desc&limit=50`, { headers }),
    supabaseRequest<Record<string, unknown>[]>(`/rest/v1/conversations?select=id,channel_id,status,last_intent,last_patient_message,last_activity_at,priority,is_handoff&clinic_id=eq.${clinicId}&patient_id=eq.${patientId}&deleted_at=is.null&is_archived=eq.false&order=last_activity_at.desc&limit=50`, { headers }),
    supabaseRequest<Record<string, unknown>[]>(`/rest/v1/follow_up_cases?select=id,appointment_id,status,next_due_at,followup_goal,updated_at&clinic_id=eq.${clinicId}&patient_id=eq.${patientId}&order=next_due_at.asc.nullslast&limit=50`, { headers }),
    supabaseRequest<Record<string, unknown>[]>(`/rest/v1/no_show_cases?select=id,appointment_id,case_status,risk_level,last_activity_at,recovery_eligibility&clinic_id=eq.${clinicId}&patient_id=eq.${patientId}&order=last_activity_at.desc.nullslast&limit=50`, { headers }),
  ]);
  const failed = [appointments, conversations, followUps, noShows].find((result) => !result.ok);
  if (failed) { res.status(failed.status || 502).json({ error: "تعذر تحميل سجل المريض الكامل." }); return; }
  res.json({ patient, appointments: appointments.data ?? [], conversations: conversations.data ?? [], followUps: followUps.data ?? [], noShows: noShows.data ?? [] });
});

router.delete("/patients/:id", async (req, res) => {
  let session;
  try { session = await requireClinicPermission(req, "Patients", "patients", "delete"); } catch (error) { respondToPermissionError(res, error); return; }
  const path = "/rest/v1/patients?id=eq." + encodeURIComponent(req.params.id) + "&clinic_id=eq." + encodeURIComponent(session.clinicId) + "&deleted_at=is.null";
  const result = await supabaseRequest<PatientRow[]>(path, {
    method: "PATCH",
    headers: sessionHeaders(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify({ deleted_at: new Date().toISOString(), deleted_by: session.userId, status: "archived" }),
  });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر أرشفة المريض." }); return; }
  if (!result.data?.length) { res.status(404).json({ error: "المريض غير موجود." }); return; }
  clinicEvents.emitClinicEvent(session.clinicId, "patient.deleted", { patientId: req.params.id });
  res.status(204).end();
});

export default router;
