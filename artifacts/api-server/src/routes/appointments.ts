import { Router } from "express";
import { readSession } from "../lib/session";
import { supabaseRequest } from "../lib/supabase";

const router = Router();

type AppointmentRow = { id?: string; patient_id?: string; doctor_id?: string; service_id?: string; slot_id?: string; appointment_status?: string; scheduled_at?: string; notes?: string | null };
type PatientRow = { id?: string; name?: string; first_name?: string; last_name?: string };
type DoctorRow = { id?: string; name?: string; specialization?: string | null };
type ServiceRow = { id?: string; name?: string; duration_minutes?: number };
type SlotRow = { id?: string; doctor_id?: string; service_id?: string; start_time?: string; end_time?: string; slot_status?: string };
type AppointmentInput = { patientId?: unknown; slotId?: unknown; scheduledAt?: unknown; status?: unknown; notes?: unknown; appointmentType?: unknown };

function appointmentHeaders(accessToken: string, extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...extra };
}

function appointmentInput(body: AppointmentInput) {
  return {
    patientId: typeof body.patientId === "string" ? body.patientId.trim() : "",
    slotId: typeof body.slotId === "string" ? body.slotId.trim() : "",
    scheduledAt: typeof body.scheduledAt === "string" ? body.scheduledAt.trim() : "",
    status: typeof body.status === "string" && body.status.trim() ? body.status.trim() : "scheduled",
    notes: typeof body.notes === "string" ? body.notes.trim() : "",
    appointmentType: typeof body.appointmentType === "string" && body.appointmentType.trim() ? body.appointmentType.trim() : "NEW_VISIT",
  };
}

function clinicFilter(clinicId: string) {
  return `clinic_id=eq.${encodeURIComponent(clinicId)}&deleted_at=is.null`;
}

router.get("/appointments/options", async (req, res) => {
  const session = readSession(req);
  if (!session) { res.status(401).json({ error: "Not authenticated." }); return; }
  const filter = clinicFilter(session.clinicId);
  const [patientsResult, doctorsResult, servicesResult, slotsResult] = await Promise.all([
    supabaseRequest<PatientRow[]>(`/rest/v1/patients?select=id,name,first_name,last_name&${filter}&status=eq.active&order=created_at.desc&limit=1000`, { headers: { Authorization: `Bearer ${session.accessToken}` } }),
    supabaseRequest<DoctorRow[]>(`/rest/v1/doctors?select=id,name,specialization&${filter}&is_active=eq.true&order=name.asc&limit=200`, { headers: { Authorization: `Bearer ${session.accessToken}` } }),
    supabaseRequest<ServiceRow[]>(`/rest/v1/services?select=id,name,duration_minutes&${filter}&is_active=eq.true&order=sort_order.asc&limit=200`, { headers: { Authorization: `Bearer ${session.accessToken}` } }),
    supabaseRequest<SlotRow[]>(`/rest/v1/appointment_slots?select=id,doctor_id,service_id,start_time,end_time,slot_status&${filter}&slot_status=eq.available&start_time=gte.${encodeURIComponent(new Date().toISOString())}&order=start_time.asc&limit=200`, { headers: { Authorization: `Bearer ${session.accessToken}` } }),
  ]);
  if (!patientsResult.ok || !doctorsResult.ok || !servicesResult.ok || !slotsResult.ok) {
    res.status(502).json({ error: "تعذر تحميل خيارات الحجز." });
    return;
  }
  const patients = (patientsResult.data ?? []).map((patient) => ({ id: patient.id, name: patient.name || [patient.first_name, patient.last_name].filter(Boolean).join(" ") || "مريض بدون اسم" }));
  const doctors = (doctorsResult.data ?? []).map((doctor) => ({ id: doctor.id, name: doctor.name || "طبيب بدون اسم", specialization: doctor.specialization || null }));
  const services = (servicesResult.data ?? []).map((service) => ({ id: service.id, name: service.name || "خدمة بدون اسم", durationMinutes: service.duration_minutes ?? null }));
  const validDoctorIds = new Set(doctors.map((doctor) => String(doctor.id)));
  const validServiceIds = new Set(services.map((service) => String(service.id)));
  const slots = (slotsResult.data ?? []).filter((slot) => validDoctorIds.has(String(slot.doctor_id)) && validServiceIds.has(String(slot.service_id))).map((slot) => ({ id: slot.id, doctorId: slot.doctor_id, serviceId: slot.service_id, startTime: slot.start_time, endTime: slot.end_time, status: slot.slot_status }));
  res.json({ patients, doctors, services, slots });
});

router.get("/appointments", async (req, res) => {
  const session = readSession(req);
  if (!session) { res.status(401).json({ error: "Not authenticated." }); return; }
  const filter = clinicFilter(session.clinicId);
  const headers = { Authorization: `Bearer ${session.accessToken}` };
  const [appointmentsResult, patientsResult, doctorsResult, servicesResult] = await Promise.all([
    supabaseRequest<AppointmentRow[]>(`/rest/v1/appointments?select=id,patient_id,doctor_id,service_id,slot_id,appointment_status,scheduled_at,notes&${filter}&order=scheduled_at.asc&limit=100`, { headers }),
    supabaseRequest<PatientRow[]>(`/rest/v1/patients?select=id,name,first_name,last_name&${filter}&limit=1000`, { headers }),
    supabaseRequest<DoctorRow[]>(`/rest/v1/doctors?select=id,name&${filter}&limit=200`, { headers }),
    supabaseRequest<ServiceRow[]>(`/rest/v1/services?select=id,name&${filter}&limit=200`, { headers }),
  ]);
  if (!appointmentsResult.ok) { res.status(appointmentsResult.status || 502).json({ error: "Appointments could not be loaded." }); return; }
  const patients = new Map((patientsResult.data ?? []).map((p) => [String(p.id), p]));
  const doctors = new Map((doctorsResult.data ?? []).map((doctor) => [String(doctor.id), doctor]));
  const services = new Map((servicesResult.data ?? []).map((service) => [String(service.id), service]));
  res.json((appointmentsResult.data ?? []).map((row) => {
    const patient = patients.get(String(row.patient_id));
    return {
      id: row.id,
      name: patient?.name || [patient?.first_name, patient?.last_name].filter(Boolean).join(" ") || "مريض بدون اسم",
      scheduledAt: row.scheduled_at,
      status: row.appointment_status || "scheduled",
      doctorName: doctors.get(String(row.doctor_id))?.name || null,
      serviceName: services.get(String(row.service_id))?.name || null,
      slotId: row.slot_id || null,
      notes: row.notes || null,
    };
  }));
});

router.post("/appointments", async (req, res) => {
  const session = readSession(req);
  if (!session) { res.status(401).json({ error: "Not authenticated." }); return; }
  const data = appointmentInput(req.body ?? {});
  if (!data.patientId || !data.slotId) { res.status(400).json({ error: "المريض والموعد المتاح مطلوبان." }); return; }
  const headers = { Authorization: `Bearer ${session.accessToken}` };
  const [patientCheck, slotCheck] = await Promise.all([
    supabaseRequest<{ id?: string }[]>(`/rest/v1/patients?select=id&id=eq.${encodeURIComponent(data.patientId)}&${clinicFilter(session.clinicId)}&status=eq.active&limit=1`, { headers }),
    supabaseRequest<SlotRow[]>(`/rest/v1/appointment_slots?select=id,doctor_id,service_id,start_time,end_time&${clinicFilter(session.clinicId)}&id=eq.${encodeURIComponent(data.slotId)}&slot_status=eq.available&limit=1`, { headers }),
  ]);
  if (!patientCheck.ok || !slotCheck.ok) { res.status(502).json({ error: "تعذر التحقق من المريض والموعد." }); return; }
  if (!patientCheck.data?.length) { res.status(404).json({ error: "المريض غير موجود في هذه العيادة." }); return; }
  const slot = slotCheck.data?.[0];
  if (!slot?.id || !slot.doctor_id || !slot.service_id || !slot.start_time) { res.status(409).json({ error: "هذا الموعد لم يعد متاحًا." }); return; }
  const result = await supabaseRequest<AppointmentRow[]>("/rest/v1/appointments", {
    method: "POST",
    headers: appointmentHeaders(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify({ clinic_id: session.clinicId, patient_id: data.patientId, doctor_id: slot.doctor_id, service_id: slot.service_id, slot_id: slot.id, scheduled_at: slot.start_time, appointment_status: data.status, booking_source: "staff_portal", appointment_type: data.appointmentType, notes: data.notes || null, created_by: session.userId }),
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
