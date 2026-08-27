import { Router, type Request, type Response } from "express";
import { requireClinicPermission, respondToPermissionError, type ClinicPermissionAction } from "../lib/permissions";
import { supabaseRequest, type SupabaseResponse } from "../lib/supabase";
import type { SessionPayload } from "../lib/session";

const router = Router();

const waitlistFields = "id,clinic_id,branch_id,patient_id,doctor_id,service_id,status,priority,preferred_date_from,preferred_date_to,preferred_time_from,preferred_time_to,expires_at,fulfilled_at,created_at,updated_at";
const followUpFields = "id,clinic_id,appointment_id,patient_id,conversation_id,branch_id,status,current_step,attempt_number,anchor_at,next_due_at,last_sent_at,last_inbound_at,closed_at,close_reason,employee_approved,intake_source,created_by_staff_id,case_summary,followup_start_at,followup_goal,created_at,updated_at";
const noShowFields = "id,clinic_id,branch_id,appointment_id,patient_id,case_status,classification,risk_level,detection_reason,recovery_eligibility,recovery_deadline,current_attempt_number,max_attempts,opened_at,confirmed_at,last_activity_at,recovered_at,closed_at,recovery_outcome,closure_reason,created_at,updated_at";
const appointmentFields = "id,clinic_id,patient_id,branch_id,conversation_id,scheduled_at,appointment_status,booking_source,booking_number";
const patientFields = "id,name,first_name,last_name,phone,contact_phone";
const voiceCallFields = "id,patient_id,provider,provider_call_id,direction,call_status,outcome,duration_seconds,started_at,ended_at,call_summary,created_at";

type Row = Record<string, unknown> & { id?: string; patient_id?: string | null; appointment_id?: string | null };
type Related = {
  patients: Map<string, Row>;
  appointments: Map<string, Row>;
  branches: Map<string, Row>;
  doctors: Map<string, Row>;
  services: Map<string, Row>;
};

function headers(session: SessionPayload, extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json", ...extra };
}

function jsonError(res: Response, result: SupabaseResponse<unknown>, fallback: string) {
  res.status(result.status || 502).json({ error: fallback });
}

async function hydrate(session: SessionPayload, rows: Row[]): Promise<Related> {
  const patientIds = Array.from(new Set(rows.map((row) => row.patient_id).filter((id): id is string => typeof id === "string" && id.length > 0)));
  const appointmentIds = Array.from(new Set(rows.map((row) => row.appointment_id).filter((id): id is string => typeof id === "string" && id.length > 0)));
  const branchIds = Array.from(new Set(rows.map((row) => row.branch_id).filter((id): id is string => typeof id === "string" && id.length > 0)));
  const doctorIds = Array.from(new Set(rows.map((row) => row.doctor_id).filter((id): id is string => typeof id === "string" && id.length > 0)));
  const serviceIds = Array.from(new Set(rows.map((row) => row.service_id).filter((id): id is string => typeof id === "string" && id.length > 0)));
  const clinicFilter = `clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null`;
  const [patients, appointments, branches, doctors, services] = await Promise.all([
    patientIds.length
      ? supabaseRequest<Row[]>(`/rest/v1/patients?select=${patientFields}&${clinicFilter}&limit=500`, { headers: headers(session) })
      : Promise.resolve({ ok: true, status: 200, data: [] as Row[] }),
    appointmentIds.length
      ? supabaseRequest<Row[]>(`/rest/v1/appointments?select=${appointmentFields}&${clinicFilter}&limit=500`, { headers: headers(session) })
      : Promise.resolve({ ok: true, status: 200, data: [] as Row[] }),
    branchIds.length
      ? supabaseRequest<Row[]>(`/rest/v1/branches?select=id,name,address,phone,is_active&${clinicFilter}&limit=500`, { headers: headers(session) })
      : Promise.resolve({ ok: true, status: 200, data: [] as Row[] }),
    doctorIds.length
      ? supabaseRequest<Row[]>(`/rest/v1/doctors?select=id,name,specialization,is_active&${clinicFilter}&limit=500`, { headers: headers(session) })
      : Promise.resolve({ ok: true, status: 200, data: [] as Row[] }),
    serviceIds.length
      ? supabaseRequest<Row[]>(`/rest/v1/services?select=id,name,duration_minutes,price,is_active&${clinicFilter}&limit=500`, { headers: headers(session) })
      : Promise.resolve({ ok: true, status: 200, data: [] as Row[] }),
  ]);
  if (!patients.ok) throw Object.assign(new Error("Unable to load related patient records."), { statusCode: patients.status || 502 });
  if (!appointments.ok) throw Object.assign(new Error("Unable to load related appointment records."), { statusCode: appointments.status || 502 });
  if (!branches.ok) throw Object.assign(new Error("Unable to load related branch records."), { statusCode: branches.status || 502 });
  if (!doctors.ok) throw Object.assign(new Error("Unable to load related doctor records."), { statusCode: doctors.status || 502 });
  if (!services.ok) throw Object.assign(new Error("Unable to load related service records."), { statusCode: services.status || 502 });
  return {
    patients: new Map((patients.data ?? []).map((row) => [String(row.id), row])),
    appointments: new Map((appointments.data ?? []).map((row) => [String(row.id), row])),
    branches: new Map((branches.data ?? []).map((row) => [String(row.id), row])),
    doctors: new Map((doctors.data ?? []).map((row) => [String(row.id), row])),
    services: new Map((services.data ?? []).map((row) => [String(row.id), row])),
  };
}

async function protect(req: Request, res: Response, module: string, resource: string, action: ClinicPermissionAction) {
  try {
    return await requireClinicPermission(req, module, resource, action);
  } catch (error) {
    respondToPermissionError(res, error);
    return null;
  }
}

async function getBranchId(req: Request, res: Response, session: SessionPayload) {
  const branchId = typeof req.query.branchId === "string" ? req.query.branchId.trim() : "";
  if (!branchId) return "";
  const branch = await supabaseRequest<Row[]>(`/rest/v1/branches?select=id&id=eq.${encodeURIComponent(branchId)}&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null&is_active=eq.true&limit=1`, { headers: headers(session) });
  if (!branch.ok || !branch.data?.length) { res.status(400).json({ error: "Invalid branch." }); return null; }
  return branchId;
}

async function getBranchFilter(req: Request, res: Response, session: SessionPayload) {
  const branchId = await getBranchId(req, res, session);
  return branchId === null ? null : branchId ? `&branch_id=eq.${encodeURIComponent(branchId)}` : "";
}

router.get("/operations/summary", async (req, res) => {
  const session = await protect(req, res, "Operations", "workspace", "read");
  if (!session) return;
  const branchFilter = await getBranchFilter(req, res, session);
  if (branchFilter === null) return;
  const clinicFilter = `clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null`;
  const clinicOnly = `clinic_id=eq.${encodeURIComponent(session.clinicId)}`;
  const now = new Date();
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  const auth = { headers: headers(session) };
  const [appointments, patients, conversations, followUps, noShows, waitlist, channels] = await Promise.all([
    supabaseRequest<Row[]>(`/rest/v1/appointments?select=id,patient_id,scheduled_at,appointment_status,booking_number,queue_number&${clinicFilter}${branchFilter}&scheduled_at=gte.${encodeURIComponent(start.toISOString())}&scheduled_at=lt.${encodeURIComponent(end.toISOString())}&order=scheduled_at.asc&limit=100`, auth),
    supabaseRequest<Row[]>(`/rest/v1/patients?select=id,name,first_name,last_name&${clinicFilter}&limit=1000`, auth),
    supabaseRequest<Row[]>(`/rest/v1/conversations?select=id,patient_id,channel_id,status,last_intent,last_patient_message,last_activity_at,assigned_staff_id,priority,is_handoff,is_archived,ai_status&${clinicFilter}&is_archived=eq.false&order=last_activity_at.desc&limit=100`, auth),
    supabaseRequest<Row[]>(`/rest/v1/follow_up_cases?select=id,patient_id,appointment_id,status,next_due_at,followup_goal,updated_at&${clinicOnly}&status=neq.closed&order=next_due_at.asc.nullslast&limit=100`, auth),
    supabaseRequest<Row[]>(`/rest/v1/no_show_cases?select=id,patient_id,appointment_id,case_status,risk_level,last_activity_at,recovery_eligibility&${clinicOnly}&case_status=neq.closed&order=last_activity_at.desc.nullslast&limit=100`, auth),
    supabaseRequest<Row[]>(`/rest/v1/appointment_waitlists?select=id,patient_id,service_id,doctor_id,branch_id,status,priority,created_at&${clinicOnly}&status=eq.active&order=priority.desc,created_at.asc&limit=100`, auth),
    supabaseRequest<Row[]>(`/rest/v1/channels?select=id,type,provider,status,is_enabled,config,updated_at&${clinicFilter}&is_enabled=eq.true&limit=100`, auth),
  ]);
  const patientMap = new Map((patients.data ?? []).map((patient) => [String(patient.id), patient]));
  const patientName = (patientId: unknown) => {
    const patient = typeof patientId === "string" ? patientMap.get(patientId) : undefined;
    return patient?.name || [patient?.first_name, patient?.last_name].filter((value) => typeof value === "string" && value.length > 0).join(" ") || "مريض بدون اسم";
  };
  const attention = (conversations.data ?? []).filter((item) => item.is_handoff === true || !item.assigned_staff_id).length;
  const todayAppointments = appointments.data ?? [];
  const toNumber = (value: unknown) => (typeof value === "number" ? value : Number.isFinite(Number(value)) && String(value).trim() !== "" ? Number(value) : null);
  const servedNumbers = todayAppointments
    .filter((item) => item.appointment_status === "checked_in" || item.appointment_status === "completed")
    .map((item) => toNumber(item.queue_number))
    .filter((value): value is number => value !== null);
  const nowServing = servedNumbers.length ? Math.max(...servedNumbers) : null;
  const waiting = todayAppointments.filter((item) => {
    const status = typeof item.appointment_status === "string" ? item.appointment_status : "";
    const queueNumber = toNumber(item.queue_number);
    return ["scheduled", "confirmed", "pending"].includes(status) && queueNumber !== null && (nowServing === null || queueNumber > nowServing);
  }).length;
  const sources = { appointments, patients, conversations, followUps, noShows, waitlist, channels };
  res.json({
    generatedAt: now.toISOString(),
    stats: {
      appointmentsToday: appointments.ok ? appointments.data?.length ?? 0 : null,
      activePatients: patients.ok ? patients.data?.length ?? 0 : null,
      conversationsNeedingStaff: conversations.ok ? attention : null,
      openFollowUps: followUps.ok ? followUps.data?.length ?? 0 : null,
      openNoShows: noShows.ok ? noShows.data?.length ?? 0 : null,
      activeWaitlist: waitlist.ok ? waitlist.data?.length ?? 0 : null,
      connectedChannels: channels.ok ? channels.data?.length ?? 0 : null,
    },
    queue: {
      nowServing,
      waiting: appointments.ok ? waiting : null,
    },
    todayAppointments: todayAppointments.slice(0, 6).map((item) => ({ ...item, patientName: patientName(item.patient_id) })),
    recentConversations: (conversations.data ?? []).slice(0, 6).map((item) => ({ ...item, patientName: patientName(item.patient_id) })),
    recovery: {
      followUps: (followUps.data ?? []).slice(0, 6).map((item) => ({ ...item, patientName: patientName(item.patient_id) })),
      noShows: (noShows.data ?? []).slice(0, 6).map((item) => ({ ...item, patientName: patientName(item.patient_id) })),
    },
    waitlist: (waitlist.data ?? []).slice(0, 6).map((item) => ({ ...item, patientName: patientName(item.patient_id) })),
    systemStatus: Object.fromEntries(Object.entries(sources).map(([key, value]) => [key, value.ok ? "ready" : "unavailable"])),
  });
});

router.get("/operations/voice-agent", async (req, res) => {
  const session = await protect(req, res, "Voice", "overview", "read");
  if (!session) return;
  const clinicId = encodeURIComponent(session.clinicId);
  const auth = { headers: headers(session) };
  const [configuration, operationalSettings, calls] = await Promise.all([
    supabaseRequest<Row[]>(`/rest/v1/voice_agent_configurations?select=display_name,status,language_code,dialect_code&clinic_id=eq.${clinicId}&limit=1`, auth),
    supabaseRequest<Row[]>(`/rest/v1/voice_operational_settings?select=default_language,availability,default_call_behavior&clinic_id=eq.${clinicId}&limit=1`, auth),
    supabaseRequest<Row[]>(`/rest/v1/voice_agent_call_logs?select=${voiceCallFields}&clinic_id=eq.${clinicId}&order=started_at.desc.nullslast,created_at.desc&limit=100`, auth),
  ]);
  if (!configuration.ok || !operationalSettings.ok || !calls.ok) {
    const failed = [configuration, operationalSettings, calls].find((result) => !result.ok);
    res.status(failed?.status || 502).json({ error: "تعذر تحميل بيانات الوكيل الصوتي." });
    return;
  }
  const patientIds = Array.from(new Set((calls.data ?? []).map((call) => call.patient_id).filter((id): id is string => typeof id === "string" && id.length > 0)));
  const patients = patientIds.length
    ? await supabaseRequest<Row[]>(`/rest/v1/patients?select=id,name,first_name,last_name&clinic_id=eq.${clinicId}&deleted_at=is.null&limit=500`, auth)
    : { ok: true, status: 200, data: [] as Row[] };
  if (!patients.ok) {
    jsonError(res, patients, "تعذر تحميل بيانات مرضى المكالمات.");
    return;
  }
  const patientMap = new Map((patients.data ?? []).map((patient) => [String(patient.id), patient]));
  const patientName = (patientId: unknown) => {
    const patient = typeof patientId === "string" ? patientMap.get(patientId) : undefined;
    return patient?.name || [patient?.first_name, patient?.last_name].filter((value) => typeof value === "string" && value.length > 0).join(" ") || null;
  };
  res.json({
    configuration: configuration.data?.[0] ?? null,
    operationalSettings: operationalSettings.data?.[0] ?? null,
    total: calls.data?.length ?? 0,
    calls: (calls.data ?? []).map((call) => ({ ...call, patientName: patientName(call.patient_id) })),
  });
});

router.get("/operations/waitlist", async (req, res) => {
  const session = await protect(req, res, "Appointments", "appointments", "read");
  if (!session) return;
  const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
  const branchId = await getBranchId(req, res, session);
  if (branchId === null) return;
  const params = new URLSearchParams({ select: waitlistFields, clinic_id: `eq.${session.clinicId}`, order: "priority.desc,created_at.asc", limit: "100" });
  if (branchId) params.set("branch_id", `eq.${branchId}`);
  if (status) params.set("status", `eq.${status}`);
  const result = await supabaseRequest<Row[]>(`/rest/v1/appointment_waitlists?${params.toString()}`, { headers: headers(session) });
  if (!result.ok) { jsonError(res, result, "تعذر تحميل قائمة الانتظار."); return; }
  try {
    const related = await hydrate(session, result.data ?? []);
    res.json({
      total: result.data?.length ?? 0,
      items: (result.data ?? []).map((item) => ({
        ...item,
        patient: item.patient_id ? related.patients.get(String(item.patient_id)) ?? null : null,
        appointment: item.appointment_id ? related.appointments.get(String(item.appointment_id)) ?? null : null,
      })),
    });
  } catch (error) {
    respondToPermissionError(res, error);
  }
});

router.get("/operations/follow-ups", async (req, res) => {
  const session = await protect(req, res, "Appointments", "appointments", "read");
  if (!session) return;
  const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
  const branchId = await getBranchId(req, res, session);
  if (branchId === null) return;
  const params = new URLSearchParams({ select: followUpFields, clinic_id: `eq.${session.clinicId}`, order: "next_due_at.asc.nullslast", limit: "100" });
  if (branchId) params.set("branch_id", `eq.${branchId}`);
  if (status) params.set("status", `eq.${status}`);
  const result = await supabaseRequest<Row[]>(`/rest/v1/follow_up_cases?${params.toString()}`, { headers: headers(session) });
  if (!result.ok) { jsonError(res, result, "تعذر تحميل المتابعات."); return; }
  try {
    const related = await hydrate(session, result.data ?? []);
    res.json({
      total: result.data?.length ?? 0,
      items: (result.data ?? []).map((item) => ({
        ...item,
        patient: item.patient_id ? related.patients.get(String(item.patient_id)) ?? null : null,
        appointment: item.appointment_id ? related.appointments.get(String(item.appointment_id)) ?? null : null,
      })),
    });
  } catch (error) {
    respondToPermissionError(res, error);
  }
});

router.get("/operations/no-shows", async (req, res) => {
  const session = await protect(req, res, "Appointments", "appointments", "read");
  if (!session) return;
  const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
  const branchId = await getBranchId(req, res, session);
  if (branchId === null) return;
  const params = new URLSearchParams({ select: noShowFields, clinic_id: `eq.${session.clinicId}`, order: "last_activity_at.desc.nullslast", limit: "100" });
  if (branchId) params.set("branch_id", `eq.${branchId}`);
  if (status) params.set("case_status", `eq.${status}`);
  const result = await supabaseRequest<Row[]>(`/rest/v1/no_show_cases?${params.toString()}`, { headers: headers(session) });
  if (!result.ok) { jsonError(res, result, "تعذر تحميل حالات عدم الحضور."); return; }
  try {
    const related = await hydrate(session, result.data ?? []);
    res.json({
      total: result.data?.length ?? 0,
      items: (result.data ?? []).map((item) => ({
        ...item,
        patient: item.patient_id ? related.patients.get(String(item.patient_id)) ?? null : null,
        appointment: item.appointment_id ? related.appointments.get(String(item.appointment_id)) ?? null : null,
      })),
    });
  } catch (error) {
    respondToPermissionError(res, error);
  }
});

async function assertOwned(session: SessionPayload, table: string, id: string) {
  const result = await supabaseRequest<Row[]>(`/rest/v1/${table}?select=id&clinic_id=eq.${encodeURIComponent(session.clinicId)}&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: headers(session) });
  if (!result.ok) throw Object.assign(new Error("تعذر التحقق من ملكية السجل."), { statusCode: result.status || 502 });
  if (!result.data?.length) throw Object.assign(new Error("السجل غير موجود في هذه العيادة."), { statusCode: 404 });
}

async function callOperation(req: Request, res: Response, rpc: string, table: string, id: string, body: Record<string, unknown>) {
  const session = await protect(req, res, "Appointments", "appointments", "update");
  if (!session) return;
  try {
    await assertOwned(session, table, id);
    const operationBody = { ...body, p_clinic_id: session.clinicId, p_worker: `clinicos:${session.userId}` };
    const result = await supabaseRequest<unknown>(`/rest/v1/rpc/${rpc}`, { method: "POST", headers: headers(session), body: JSON.stringify(operationBody) });
    if (!result.ok) { jsonError(res, result, "تعذر حفظ العملية التشغيلية."); return; }
    res.json(result.data ?? null);
  } catch (error) {
    respondToPermissionError(res, error);
  }
}

router.post("/operations/waitlist/:id/pause", async (req, res) => callOperation(req, res, "pause_waitlist_entry", "appointment_waitlists", req.params.id, { p_waitlist_id: req.params.id, p_correlation_id: crypto.randomUUID() }));
router.post("/operations/waitlist/:id/cancel", async (req, res) => callOperation(req, res, "cancel_waitlist_entry", "appointment_waitlists", req.params.id, { p_waitlist_id: req.params.id, p_correlation_id: crypto.randomUUID() }));
router.post("/operations/follow-ups/:id/decision", async (req, res) => callOperation(req, res, "followup_record_agent_decision", "follow_up_cases", req.params.id, {
  p_case_id: req.params.id,
  p_outcome: typeof req.body?.outcome === "string" ? req.body.outcome.trim() : "",
  p_reply: typeof req.body?.reply === "string" ? req.body.reply.trim() : null,
  p_next_action: typeof req.body?.nextAction === "string" ? req.body.nextAction.trim() : null,
  p_stop_followup: req.body?.stopFollowup === true,
  p_needs_handoff: req.body?.needsHandoff === true,
}));
router.post("/operations/no-shows/:id/classify", async (req, res) => callOperation(req, res, "classify_no_show", "no_show_cases", req.params.id, { p_case_id: req.params.id }));
router.post("/operations/no-shows/:id/close", async (req, res) => callOperation(req, res, "close_no_show_case", "no_show_cases", req.params.id, {
  p_case_id: req.params.id,
  p_outcome: typeof req.body?.outcome === "string" ? req.body.outcome.trim() : "",
  p_closure_reason: typeof req.body?.reason === "string" ? req.body.reason.trim() : null,
}));

export default router;
