import { createHash, randomBytes } from "node:crypto";
import { Router } from "express";
import { requireClinicPermission, respondToPermissionError } from "../lib/permissions";
import { supabaseAdminRequest, supabaseRequest } from "../lib/supabase";
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

async function protect(req: Parameters<typeof requireClinicPermission>[0], res: Parameters<typeof respondToPermissionError>[0], action: "read" | "create" | "update" | "delete") {
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

// أفضل جهد: إرجاع slot إلى available عند إلغاء الموعد؛ لا تفشل العملية الأساسية إن تعذر
async function restoreSlotAvailability(slotId: string | undefined | null) {
  if (!slotId) return;
  try {
    await supabaseAdminRequest(`/rest/v1/appointment_slots?id=eq.${encodeURIComponent(slotId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot_status: "available" }),
    });
  } catch {
    // non-fatal by design
  }
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
  // عقد قائمة المواعيد (list contract):
  // - الافتراضي: المواعيد القادمة فقط، من اللحظة الحالية فصاعدًا، بترتيب زمني تصاعدي وحد أقصى 200 صف؛
  //   هذا يمنع اختفاء الحجوزات الجديدة خلف أقدم 100 سجل كما كان يحدث سابقًا.
  // - باراميترا from و to اختيارية بصيغة ISO لتقييد عمود scheduled_at بين تاريخين، وكل واحدة تعمل بمفردها.
  // - باراميتر all بقيمة true يلغي فلتر الافتراضي "القادمة فقط" لعرض السجل الكامل، ويبقى حد الـ200 ساريًا.
  const all = req.query.all === "true";
  const parseDateParam = (value: unknown) => {
    if (typeof value !== "string" || !value.trim()) return null;
    const parsed = new Date(value.trim());
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const fromDate = parseDateParam(req.query.from);
  const toDate = parseDateParam(req.query.to);
  const horizonFrom = fromDate ?? (all ? null : new Date());
  const dateWindow = `${horizonFrom ? `&scheduled_at=gte.${encodeURIComponent(horizonFrom.toISOString())}` : ""}${toDate ? `&scheduled_at=lte.${encodeURIComponent(toDate.toISOString())}` : ""}`;
  const scopeFilter = `${clinicFilter(session.clinicId)}${branchId ? `&branch_id=eq.${encodeURIComponent(branchId)}` : ""}`;
  const filter = `${scopeFilter}${dateWindow}`;
  const headers = { Authorization: `Bearer ${session.accessToken}` };
  if (branchId) {
    const branch = await supabaseRequest<{ id?: string }[]>(`/rest/v1/branches?select=id&id=eq.${encodeURIComponent(branchId)}&${clinicFilter(session.clinicId)}&is_active=eq.true&limit=1`, { headers });
    if (!branch.ok || !branch.data?.length) { res.status(400).json({ error: "Invalid branch." }); return; }
  }
  const [appointmentsResult, patientsResult] = await Promise.all([
    supabaseRequest<AppointmentRow[]>(`/rest/v1/appointments?select=id,public_id,patient_id,branch_id,doctor_id,service_id,slot_id,appointment_status,scheduled_at,booking_number,queue_number,notes&${filter}&order=scheduled_at.asc&limit=200`, { headers }),
    supabaseRequest<PatientRow[]>(`/rest/v1/patients?select=id,name,first_name,last_name&${scopeFilter}&limit=1000`, { headers }),
  ]);
  if (!appointmentsResult.ok) { res.status(appointmentsResult.status || 502).json({ error: "Appointments could not be loaded." }); return; }
  const appointmentRows = appointmentsResult.data ?? [];
  // نفس نمط بحث المرضى بالجملة: نجيب أسماء الأطباء والخدمات المرتبطة بالصفوف المعروضة دفعة واحدة،
  // ولو فشل البحث نكمل بالأسماء null بدل إسقاط القائمة كلها.
  const lookupNamesById = async (table: "doctors" | "services", ids: string[]) => {
    if (!ids.length) return [] as Array<{ id?: string; name?: string }>;
    const result = await supabaseRequest<Array<{ id?: string; name?: string }>>(`/rest/v1/${table}?select=id,name&${scopeFilter}&id=in.(${ids.map((id) => encodeURIComponent(id)).join(",")})&limit=500`, { headers });
    return result.ok ? (result.data ?? []) : [];
  };
  const [doctorLookup, serviceLookup] = await Promise.all([
    lookupNamesById("doctors", Array.from(new Set(appointmentRows.map((row) => row.doctor_id || "").filter(Boolean)))),
    lookupNamesById("services", Array.from(new Set(appointmentRows.map((row) => row.service_id || "").filter(Boolean)))),
  ]);
  const doctorsById = new Map(doctorLookup.map((doctor) => [String(doctor.id), doctor.name || "طبيب بدون اسم"]));
  const servicesById = new Map(serviceLookup.map((service) => [String(service.id), service.name || "خدمة بدون اسم"]));
  const patients = new Map((patientsResult.data ?? []).map((p) => [String(p.id), p]));
  const appointments = appointmentRows.map((row) => {
    const patient = patients.get(String(row.patient_id));
    return {
      id: row.id,
      bookingId: row.public_id || null,
      bookingNumber: row.booking_number || null,
      queueNumber: row.queue_number ?? null,
      name: patient?.name || [patient?.first_name, patient?.last_name].filter(Boolean).join(" ") || "مريض بدون اسم",
      scheduledAt: row.scheduled_at,
      status: row.appointment_status || "scheduled",
      doctorId: row.doctor_id || null,
      doctorName: row.doctor_id ? (doctorsById.get(String(row.doctor_id)) ?? null) : null,
      serviceName: row.service_id ? (servicesById.get(String(row.service_id)) ?? null) : null,
      slotId: row.slot_id || null,
      notes: row.notes || null,
    };
  });
  if (req.query.includeOptions === "true") {
    const doctorIdParam = typeof req.query.doctorId === "string" ? req.query.doctorId.trim() : "";
    const dateParam = typeof req.query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date) ? req.query.date : "";
    let slotWindow = `&slot_status=eq.available&start_time=gte.${encodeURIComponent(new Date().toISOString())}`;
    if (dateParam) {
      // Wall-clock-as-UTC convention: the day window is the plain UTC day so
      // the HH:MM the clinic generated is exactly what the picker shows.
      slotWindow = `&slot_status=eq.available&start_time=gte.${encodeURIComponent(`${dateParam}T00:00:00Z`)}&start_time=lt.${encodeURIComponent(`${dateParam}T23:59:59.999Z`)}`;
    }
    const doctorWindow = doctorIdParam ? `&doctor_id=eq.${encodeURIComponent(doctorIdParam)}` : "";
    const [doctorsResult, servicesResult, slotsResult] = await Promise.all([
      supabaseRequest<DoctorRow[]>(`/rest/v1/doctors?select=id,name,specialization&${filter}&is_active=eq.true&order=name.asc&limit=200`, { headers }),
      supabaseRequest<ServiceRow[]>(`/rest/v1/services?select=id,name,duration_minutes&${filter}&is_active=eq.true&order=sort_order.asc&limit=200`, { headers }),
      supabaseRequest<SlotRow[]>(`/rest/v1/appointment_slots?select=id,doctor_id,service_id,start_time,end_time,slot_status&${filter}${doctorWindow}${slotWindow}&order=start_time.asc&limit=500`, { headers }),
    ]);
    if (!doctorsResult.ok || !servicesResult.ok || !slotsResult.ok) {
      res.status(502).json({ error: "تعذر تحميل خيارات الحجز من قاعدة البيانات." });
      return;
    }
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

// جدول اليوم لأي دكتور: كل الـslots في اليوم (متاح ومحجوز) مع المريض على المحجوز.
// الأوقات تتبع اتفاقية wall-clock-as-UTC: نافذة اليوم هي يوم UTC الصريح.
router.get("/appointments/schedule", async (req, res) => {
  const session = await protect(req, res, "read");
  if (!session) return;
  const dateParam = typeof req.query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date) ? req.query.date : new Date().toISOString().slice(0, 10);
  const doctorIdParam = typeof req.query.doctorId === "string" ? req.query.doctorId.trim() : "";
  const clinicFilterStr = `clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null`;
  const headers = { Authorization: `Bearer ${session.accessToken}` };
  const doctorFilter = doctorIdParam ? `&doctor_id=eq.${encodeURIComponent(doctorIdParam)}` : "";

  const slotsResult = await supabaseRequest<Array<{ id: string; doctor_id: string; service_id: string; start_time: string; end_time: string; slot_status: string }>>(
    `/rest/v1/appointment_slots?select=id,doctor_id,service_id,start_time,end_time,slot_status&${clinicFilterStr}${doctorFilter}&start_time=gte.${encodeURIComponent(`${dateParam}T00:00:00Z`)}&start_time=lt.${encodeURIComponent(`${dateParam}T23:59:59.999Z`)}&order=start_time.asc&limit=500`,
    { headers },
  );
  if (!slotsResult.ok) { res.status(slotsResult.status || 502).json({ error: "تعذر تحميل جدول المواعيد." }); return; }
  const slots = slotsResult.data ?? [];

  const slotIds = slots.map((slot) => slot.id).filter(Boolean);
  const appointmentsBySlot = new Map<string, { id: string; patient_id: string; appointment_status: string; notes: string | null }>();
  if (slotIds.length) {
    const apptsResult = await supabaseRequest<Array<{ id: string; slot_id: string; patient_id: string; appointment_status: string; notes: string | null }>>(
      `/rest/v1/appointments?select=id,slot_id,patient_id,appointment_status,notes&${clinicFilterStr}&slot_id=in.(${slotIds.map((id) => encodeURIComponent(id)).join(",")})&deleted_at=is.null&limit=500`,
      { headers },
    );
    if (apptsResult.ok) for (const appt of apptsResult.data ?? []) if (appt.slot_id) appointmentsBySlot.set(String(appt.slot_id), appt);
  }
  const patientIds = [...new Set([...appointmentsBySlot.values()].map((appt) => String(appt.patient_id)).filter(Boolean))];
  const patientsById = new Map<string, { name: string; phone: string | null }>();
  if (patientIds.length) {
    const patientsResult = await supabaseRequest<Array<{ id: string; name: string; first_name: string; last_name: string; phone: string | null }>>(
      `/rest/v1/patients?select=id,name,first_name,last_name,phone&id=in.(${patientIds.map((id) => encodeURIComponent(id)).join(",")})&limit=500`,
      { headers },
    );
    if (patientsResult.ok) for (const patient of patientsResult.data ?? []) patientsById.set(String(patient.id), { name: patient.name || [patient.first_name, patient.last_name].filter(Boolean).join(" ") || "مريض بدون اسم", phone: patient.phone || null });
  }
  const serviceIds = [...new Set(slots.map((slot) => String(slot.service_id)).filter(Boolean))];
  const servicesById = new Map<string, string>();
  if (serviceIds.length) {
    const servicesResult = await supabaseRequest<Array<{ id: string; name: string }>>(
      `/rest/v1/services?select=id,name&id=in.(${serviceIds.map((id) => encodeURIComponent(id)).join(",")})&limit=500`,
      { headers },
    );
    if (servicesResult.ok) for (const service of servicesResult.data ?? []) servicesById.set(String(service.id), service.name || "خدمة بدون اسم");
  }

  const schedule = slots.map((slot) => {
    const appt = appointmentsBySlot.get(String(slot.id));
    const patient = appt ? patientsById.get(String(appt.patient_id)) : undefined;
    return {
      id: slot.id,
      doctorId: slot.doctor_id,
      startTime: slot.start_time,
      endTime: slot.end_time,
      status: slot.slot_status,
      serviceName: servicesById.get(String(slot.service_id)) ?? null,
      appointment: appt ? { id: appt.id, status: appt.appointment_status, notes: appt.notes, patientName: patient?.name ?? "مريض بدون اسم", patientPhone: patient?.phone ?? null } : null,
    };
  });

  res.json({ date: dateParam, slots: schedule });
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
  // لا نطبق status افتراضيًا على PATCH؛ فقط عند إرساله صراحةً حتى لا يُعاد موعد ملغى/مكتمل إلى scheduled
  const rawStatus = typeof req.body?.status === "string" ? req.body.status.trim() : "";
  if (rawStatus && validStatuses.has(rawStatus)) changes.appointment_status = rawStatus;
  if (data.notes) changes.notes = data.notes;
  if (!Object.keys(changes).length) { res.status(400).json({ error: "لا توجد تغييرات." }); return; }
  const path = `/rest/v1/appointments?id=eq.${encodeURIComponent(req.params.id)}&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null`;
  const result = await supabaseRequest<AppointmentRow[]>(path, { method: "PATCH", headers: appointmentHeaders(session.accessToken, { Prefer: "return=representation" }), body: JSON.stringify({ ...changes, updated_by: session.userId }) });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر تحديث الموعد." }); return; }
  if (!result.data?.length) { res.status(404).json({ error: "الموعد غير موجود." }); return; }
  const updated = result.data[0];
  if (changes.appointment_status === "cancelled" || changes.appointment_status === "no_show") {
    await restoreSlotAvailability(updated.slot_id);
  }
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
  await restoreSlotAvailability(cancelled.slot_id);
  clinicEvents.emitClinicEvent(session.clinicId, "appointment.cancelled", {
    appointmentId: req.params.id,
    reason,
  });
  res.json(cancelled);
});

// حذف نهائي ناعم: يظل السجل في القاعدة للأرشفة والتدقيق لكنه يختفي من كل الواجهات،
// ويحرر الـslot المرتبط ليصبح متاحاً للحجز من جديد.
router.delete("/appointments/:id", async (req, res) => {
  const session = await protect(req, res, "delete");
  if (!session) return;
  const path = `/rest/v1/appointments?id=eq.${encodeURIComponent(req.params.id)}&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null`;
  const result = await supabaseRequest<AppointmentRow[]>(path, { method: "PATCH", headers: appointmentHeaders(session.accessToken, { Prefer: "return=representation" }), body: JSON.stringify({ deleted_at: new Date().toISOString(), deleted_by: session.userId, updated_by: session.userId }) });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر حذف الموعد." }); return; }
  const deleted = result.data?.[0];
  if (!deleted?.id) { res.status(404).json({ error: "الموعد غير موجود." }); return; }
  await restoreSlotAvailability(deleted.slot_id);
  clinicEvents.emitClinicEvent(session.clinicId, "appointment.deleted", { appointmentId: req.params.id });
  res.json({ success: true });
});

// نقل حجز محجوز إلى موعد متاح آخر لنفس الطبيب: يقلب حالتي الـslot
// (القديم متاح، الجديد محجوز) ويحدّث وقت الموعد — بأمان تراجعي.
router.post("/appointments/:id/move", async (req, res) => {
  const session = await protect(req, res, "update");
  if (!session) return;
  const targetSlotId = typeof req.body?.targetSlotId === "string" ? req.body.targetSlotId.trim() : "";
  if (!targetSlotId) { res.status(400).json({ error: "الموعد الهدف مطلوب." }); return; }

  const apptHeaders = appointmentHeaders(session.accessToken, { Prefer: "return=representation" });
  const apptPath = `/rest/v1/appointments?select=id,clinic_id,doctor_id,slot_id,scheduled_at,appointment_status&clinic_id=eq.${encodeURIComponent(session.clinicId)}&id=eq.${encodeURIComponent(req.params.id)}&deleted_at=is.null&limit=1`;
  const apptResult = await supabaseRequest<Array<{ id: string; clinic_id: string; doctor_id: string | null; slot_id: string | null; scheduled_at: string; appointment_status: string }>>(apptPath, { headers: apptHeaders });
  if (!apptResult.ok) { res.status(apptResult.status || 502).json({ error: "تعذر تحميل الموعد." }); return; }
  const appointment = apptResult.data?.[0];
  if (!appointment?.id) { res.status(404).json({ error: "الموعد غير موجود." }); return; }
  if (appointment.appointment_status === "cancelled") { res.status(409).json({ error: "لا يمكن نقل موعد ملغى — احجز موعداً جديداً." }); return; }
  if (appointment.slot_id && appointment.slot_id === targetSlotId) { res.status(409).json({ error: "الموعد محجوز على هذا الوقت بالفعل." }); return; }

  const targetResult = await supabaseAdminRequest<Array<{ id: string; doctor_id: string; start_time: string; end_time: string; slot_status: string }>>(
    `/rest/v1/appointment_slots?select=id,doctor_id,start_time,end_time,slot_status&clinic_id=eq.${encodeURIComponent(session.clinicId)}&id=eq.${encodeURIComponent(targetSlotId)}&deleted_at=is.null&limit=1`,
  );
  const targetSlot = targetResult.data?.[0];
  if (!targetSlot) { res.status(404).json({ error: "الموعد الهدف غير موجود." }); return; }
  if (targetSlot.slot_status !== "available") { res.status(409).json({ error: "الموعد الهدف لم يبق متاحاً — اختر وقتاً آخر." }); return; }
  if (appointment.doctor_id && targetSlot.doctor_id !== appointment.doctor_id) { res.status(409).json({ error: "لا يمكن نقل الحجز لطبيب مختلف — اختر موعداً لنفس الطبيب." }); return; }

  // 1) Book the target slot first (service-role: slots are backend-owned state).
  const bookTarget = await supabaseAdminRequest(`/rest/v1/appointment_slots?id=eq.${encodeURIComponent(targetSlot.id)}`, {
    method: "PATCH",
    body: JSON.stringify({ slot_status: "booked", updated_at: new Date().toISOString() }),
  });
  if (!bookTarget.ok) { res.status(502).json({ error: "تعذر حجز الموعد الهدف — لم يتم أي تغيير." }); return; }

  // 2) Move the appointment under the caller's own identity.
  const moved = await supabaseRequest<AppointmentRow[]>(`/rest/v1/appointments?id=eq.${encodeURIComponent(appointment.id)}&clinic_id=eq.${encodeURIComponent(session.clinicId)}`, {
    method: "PATCH",
    headers: apptHeaders,
    body: JSON.stringify({ slot_id: targetSlot.id, scheduled_at: targetSlot.start_time, updated_by: session.userId }),
  });
  if (!moved.ok) {
    await supabaseAdminRequest(`/rest/v1/appointment_slots?id=eq.${encodeURIComponent(targetSlot.id)}`, { method: "PATCH", body: JSON.stringify({ slot_status: "available" }) });
    res.status(moved.status || 502).json({ error: "تعذر نقل الموعد — تم التراجع." });
    return;
  }

  // 3) Free the old slot (best effort).
  if (appointment.slot_id) await restoreSlotAvailability(appointment.slot_id);

  clinicEvents.emitClinicEvent(session.clinicId, "appointment.updated", {
    appointmentId: appointment.id,
    status: appointment.appointment_status,
    scheduledAt: targetSlot.start_time,
  });
  res.json({ success: true, appointment: moved.data?.[0] ?? null, scheduledAt: targetSlot.start_time });
});

export default router;
