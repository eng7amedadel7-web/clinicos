import { createHash, randomBytes } from "node:crypto";
import { Router } from "express";
import { requireClinicPermission, respondToPermissionError } from "../lib/permissions";
import { supabaseRequest } from "../lib/supabase";
import { clinicEvents } from "../lib/events";

const router = Router();

type AppointmentRow = { id?: string; public_id?: string; clinic_id?: string; patient_id?: string; branch_id?: string; doctor_id?: string; service_id?: string; slot_id?: string; appointment_status?: string; scheduled_at?: string; booking_number?: string | null; queue_number?: number | null; notes?: string | null; created_at?: string | null; updated_at?: string | null; confirmed_at?: string | null; completed_at?: string | null; cancelled_at?: string | null; cancellation_reason?: string | null };
type CreatedAppointmentRow = { appointment_id?: string; booking_id?: string; booking_number?: string | null; queue_number?: number | null; queue_path?: string | null; queue_expires_at?: string | null };
type PatientRow = { id?: string; name?: string; first_name?: string; last_name?: string };
type DoctorRow = { id?: string; name?: string; specialization?: string | null };
type ServiceRow = { id?: string; name?: string; duration_minutes?: number };
type SlotRow = { id?: string; doctor_id?: string; service_id?: string; start_time?: string; end_time?: string; slot_status?: string };
type AppointmentInput = { patientId?: unknown; slotId?: unknown; scheduledAt?: unknown; status?: unknown; notes?: unknown; appointmentType?: unknown };
type CheckinRow = { status?: string; checked_in_at?: string | null; called_at?: string | null; in_service_at?: string | null; completed_at?: string | null; cancelled_at?: string | null; created_at?: string | null };
type FollowUpRow = { status?: string; followup_goal?: string | null; next_due_at?: string | null; created_at?: string | null };
type NoShowRow = { case_status?: string; classification?: string | null; risk_level?: string | null; last_activity_at?: string | null; created_at?: string | null };

async function protect(req: Parameters<typeof requireClinicPermission>[0], res: Parameters<typeof respondToPermissionError>[0], action: "read" | "create" | "update") {
  try {
    return await requireClinicPermission(req, "Appointments", "appointments", action);
  } catch (error) {
    respondToPermissionError(res, error);
    return null;
  }
}

function appointmentHeaders(accessToken: string, extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...extra };
}

const validStatuses = new Set(["scheduled", "confirmed", "checked_in", "completed", "cancelled", "no_show", "pending"]);
const validAppointmentTypes = new Set(["NEW_VISIT", "FOLLOW_UP", "EMERGENCY", "CONSULTATION", "PROCEDURE"]);

function appointmentInput(body: AppointmentInput) {
  const status = typeof body.status === "string" && body.status.trim() ? body.status.trim() : "scheduled";
  const appointmentType = typeof body.appointmentType === "string" && body.appointmentType.trim() ? body.appointmentType.trim() : "NEW_VISIT";
  return {
    patientId: typeof body.patientId === "string" ? body.patientId.trim() : "",
    slotId: typeof body.slotId === "string" ? body.slotId.trim() : "",
    scheduledAt: typeof body.scheduledAt === "string" ? body.scheduledAt.trim() : "",
    status: validStatuses.has(status) ? status : "scheduled",
    notes: typeof body.notes === "string" ? body.notes.trim() : "",
    appointmentType: validAppointmentTypes.has(appointmentType) ? appointmentType : "NEW_VISIT",
  };
}

function clinicFilter(clinicId: string) {
  return `clinic_id=eq.${encodeURIComponent(clinicId)}&deleted_at=is.null`;
}

router.get("/appointments/options", async (req, res) => {
  const session = await protect(req, res, "read");
  if (!session) return;
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
  const session = await protect(req, res, "read");
  if (!session) return;
  const branchId = typeof req.query.branchId === "string" ? req.query.branchId.trim() : "";
  const filter = `${clinicFilter(session.clinicId)}${branchId ? `&branch_id=eq.${encodeURIComponent(branchId)}` : ""}`;
  const headers = { Authorization: `Bearer ${session.accessToken}` };
  if (branchId) {
    const branch = await supabaseRequest<{ id?: string }[]>(`/rest/v1/branches?select=id&id=eq.${encodeURIComponent(branchId)}&${clinicFilter(session.clinicId)}&is_active=eq.true&limit=1`, { headers });
    if (!branch.ok || !branch.data?.length) { res.status(400).json({ error: "Invalid branch." }); return; }
  }
  const [appointmentsResult, patientsResult] = await Promise.all([
    supabaseRequest<AppointmentRow[]>(`/rest/v1/appointments?select=id,public_id,patient_id,branch_id,appointment_status,scheduled_at,booking_number,queue_number&${filter}&order=scheduled_at.asc&limit=100`, { headers }),
    supabaseRequest<PatientRow[]>(`/rest/v1/patients?select=id,name,first_name,last_name&${filter}&limit=1000`, { headers }),
  ]);
  if (!appointmentsResult.ok) { res.status(appointmentsResult.status || 502).json({ error: "Appointments could not be loaded." }); return; }
  const patients = new Map((patientsResult.data ?? []).map((p) => [String(p.id), p]));
  const appointments = (appointmentsResult.data ?? []).map((row) => {
    const patient = patients.get(String(row.patient_id));
    return {
      id: row.id,
      bookingId: row.public_id || null,
      bookingNumber: row.booking_number || null,
      queueNumber: row.queue_number ?? null,
      name: patient?.name || [patient?.first_name, patient?.last_name].filter(Boolean).join(" ") || "مريض بدون اسم",
      scheduledAt: row.scheduled_at,
      status: row.appointment_status || "scheduled",
      doctorName: null,
      serviceName: null,
      slotId: row.slot_id || null,
      notes: row.notes || null,
    };
  });
  if (req.query.includeOptions === "true") {
    const [doctorsResult, servicesResult, slotsResult] = await Promise.all([
      supabaseRequest<DoctorRow[]>(`/rest/v1/doctors?select=id,name,specialization&${filter}&is_active=eq.true&order=name.asc&limit=200`, { headers }),
      supabaseRequest<ServiceRow[]>(`/rest/v1/services?select=id,name,duration_minutes&${filter}&is_active=eq.true&order=sort_order.asc&limit=200`, { headers }),
      supabaseRequest<SlotRow[]>(`/rest/v1/appointment_slots?select=id,doctor_id,service_id,start_time,end_time,slot_status&${filter}&slot_status=eq.available&start_time=gte.${encodeURIComponent(new Date().toISOString())}&order=start_time.asc&limit=200`, { headers }),
    ]);
    const doctors = (doctorsResult.data ?? []).map((doctor) => ({ id: doctor.id, name: doctor.name || "طبيب بدون اسم", specialization: doctor.specialization || null }));
    const services = (servicesResult.data ?? []).map((service) => ({ id: service.id, name: service.name || "خدمة بدون اسم", durationMinutes: service.duration_minutes ?? null }));
    const validDoctorIds = new Set(doctors.map((doctor) => String(doctor.id)));
    const validServiceIds = new Set(services.map((service) => String(service.id)));
    const slots = (slotsResult.data ?? []).filter((slot) => validDoctorIds.has(String(slot.doctor_id)) && validServiceIds.has(String(slot.service_id))).map((slot) => ({ id: slot.id, doctorId: slot.doctor_id, serviceId: slot.service_id, startTime: slot.start_time, endTime: slot.end_time, status: slot.slot_status }));
    const bookingPatients = (patientsResult.data ?? []).map((patient) => ({ id: patient.id, name: patient.name || [patient.first_name, patient.last_name].filter(Boolean).join(" ") || "مريض بدون اسم" }));
    res.json({ appointments, options: { patients: bookingPatients, doctors, services, slots } });
    return;
  }
  res.json(appointments);
});

router.post("/appointments", async (req, res) => {
  const session = await protect(req, res, "create");
  if (!session) return;
  const data = appointmentInput(req.body ?? {});
  if (!data.patientId || !data.slotId) { res.status(400).json({ error: "المريض والموعد المتاح مطلوبان." }); return; }

  const idempotencyKey = (req.get("Idempotency-Key") || randomBytes(32).toString("hex")).trim();
  const queueToken = createHash("sha256")
    .update(`meruna-queue:${session.clinicId}:${idempotencyKey}`, "utf8")
    .digest("base64url");
  const result = await supabaseRequest<CreatedAppointmentRow[]>("/rest/v1/rpc/create_appointment_with_queue_link", {
    method: "POST",
    headers: appointmentHeaders(session.accessToken),
    body: JSON.stringify({
      p_clinic_id: session.clinicId,
      p_patient_id: data.patientId,
      p_slot_id: data.slotId,
      p_appointment_status: data.status,
      p_notes: data.notes || null,
      p_appointment_type: data.appointmentType,
      p_create_idempotency_key: idempotencyKey,
      p_queue_token: queueToken,
    }),
  });
  if (!result.ok) {
    const status = result.status === 409 || result.status === 400 ? 409 : (result.status || 502);
    res.status(status).json({ error: status === 409 ? "هذا الـslot لم يعد متاحًا أو تم تنفيذ الطلب مسبقًا." : "تعذر حجز الموعد." });
    return;
  }

  const created = result.data?.[0];
  if (!created?.appointment_id || !created.booking_id || !created.queue_path) {
    res.status(502).json({ error: "تعذر إكمال رابط الكيو للحجز." });
    return;
  }
  clinicEvents.emitClinicEvent(session.clinicId, "appointment.booked", {
    appointmentId: created.appointment_id,
    queueNumber: created.queue_number ?? null,
    scheduledAt: data.scheduledAt || null,
  });
  res.status(201).json({
    id: created.appointment_id,
    bookingId: created.booking_id,
    bookingNumber: created.booking_number ?? null,
    queueNumber: created.queue_number ?? null,
    queuePath: created.queue_path,
    queueExpiresAt: created.queue_expires_at ?? null,
  });
});

router.get("/appointments/:id/journey", async (req, res) => {
  let session;
  try {
    session = await requireClinicPermission(req, "Appointments", "appointments", "read");
  } catch (error) {
    respondToPermissionError(res, error);
    return;
  }
  const headers = { Authorization: `Bearer ${session.accessToken}` };
  const appointmentResult = await supabaseRequest<AppointmentRow[]>(
    `/rest/v1/appointments?select=id,public_id,clinic_id,patient_id,branch_id,scheduled_at,appointment_status,booking_number,queue_number,created_at,updated_at,confirmed_at,completed_at,cancelled_at,cancellation_reason&${clinicFilter(session.clinicId)}&id=eq.${encodeURIComponent(req.params.id)}&limit=1`,
    { headers },
  );
  if (!appointmentResult.ok) { res.status(appointmentResult.status || 502).json({ error: "تعذر تحميل بيانات الموعد." }); return; }
  const appointment = appointmentResult.data?.[0];
  if (!appointment?.id) { res.status(404).json({ error: "الموعد غير موجود في العيادة الحالية." }); return; }

  const [checkinsResult, followUpsResult, noShowsResult] = await Promise.all([
    supabaseRequest<CheckinRow[]>(`/rest/v1/appointment_checkins?select=status,checked_in_at,called_at,in_service_at,completed_at,cancelled_at,created_at&${clinicFilter(session.clinicId)}&appointment_id=eq.${encodeURIComponent(appointment.id)}&order=created_at.desc&limit=1`, { headers }),
    supabaseRequest<FollowUpRow[]>(`/rest/v1/follow_up_cases?select=status,followup_goal,next_due_at,created_at&${clinicFilter(session.clinicId)}&appointment_id=eq.${encodeURIComponent(appointment.id)}&order=created_at.desc&limit=1`, { headers }),
    supabaseRequest<NoShowRow[]>(`/rest/v1/no_show_cases?select=case_status,classification,risk_level,last_activity_at,created_at&${clinicFilter(session.clinicId)}&appointment_id=eq.${encodeURIComponent(appointment.id)}&order=created_at.desc&limit=1`, { headers }),
  ]);
  if (!checkinsResult.ok || !followUpsResult.ok || !noShowsResult.ok) { res.status(502).json({ error: "تعذر تحميل بيانات رحلة الموعد المرتبطة." }); return; }

  const checkin = checkinsResult.data?.[0];
  const events: Array<{ id: string; event_type: string; actor_type: string; occurred_at: string }> = [];
  const addEvent = (id: string, eventType: string, occurredAt?: string | null, actorType = "النظام") => { if (occurredAt) events.push({ id, event_type: eventType, actor_type: actorType, occurred_at: occurredAt }); };
  addEvent("created", "تم إنشاء الحجز", appointment.created_at);
  addEvent("confirmed", "تم تأكيد الموعد", appointment.confirmed_at);
  addEvent("checked-in", "تم تسجيل الوصول", checkin?.checked_in_at, "الاستقبال");
  addEvent("called", "تم استدعاء المستخدم", checkin?.called_at, "الاستقبال");
  addEvent("in-service", "بدأت الخدمة", checkin?.in_service_at, "الفريق الطبي");
  addEvent("completed", "اكتملت الزيارة", appointment.completed_at || checkin?.completed_at);
  addEvent("cancelled", "تم إلغاء الموعد", appointment.cancelled_at || checkin?.cancelled_at);
  events.sort((left, right) => Date.parse(left.occurred_at) - Date.parse(right.occurred_at));

  res.json({
    appointment,
    events,
    followUp: followUpsResult.data?.[0] || null,
    noShow: noShowsResult.data?.[0] || null,
  });
});

router.patch("/appointments/:id", async (req, res) => {
  const session = await protect(req, res, "update");
  if (!session) return;
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
  const updated = result.data[0];
  clinicEvents.emitClinicEvent(session.clinicId, "appointment.updated", {
    appointmentId: req.params.id,
    status: updated.appointment_status,
    scheduledAt: updated.scheduled_at,
  });
  res.json(updated);
});

router.post("/appointments/:id/cancel", async (req, res) => {
  const session = await protect(req, res, "update");
  if (!session) return;
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
  const path = `/rest/v1/appointments?id=eq.${encodeURIComponent(req.params.id)}&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null`;
  const result = await supabaseRequest<AppointmentRow[]>(path, { method: "PATCH", headers: appointmentHeaders(session.accessToken, { Prefer: "return=representation" }), body: JSON.stringify({ appointment_status: "cancelled", cancellation_reason: reason || null, cancelled_at: new Date().toISOString(), updated_by: session.userId }) });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر إلغاء الموعد." }); return; }
  if (!result.data?.length) { res.status(404).json({ error: "الموعد غير موجود." }); return; }
  const cancelled = result.data[0];
  clinicEvents.emitClinicEvent(session.clinicId, "appointment.cancelled", {
    appointmentId: req.params.id,
    reason,
  });
  res.json(cancelled);
});

export default router;
