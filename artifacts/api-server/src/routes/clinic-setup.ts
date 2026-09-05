import { Router } from "express";
import { requireClinicPermission, respondToPermissionError } from "../lib/permissions";
import { supabaseRequest } from "../lib/supabase";
import { clinicEvents } from "../lib/events";

// Clinic calendar setup CRUD: doctors, services, and appointment slots.
// Table/column names mirror exactly what src/routes/appointments.ts selects for
// the booking options endpoint (doctors, services, appointment_slots) and what
// the create_appointment_with_queue_link RPC writes, so anything created here
// immediately shows up in GET /api/appointments?includeOptions=true.

const router = Router();

type DoctorRow = { id?: string; name?: string; specialization?: string | null; is_active?: boolean; created_at?: string | null };
type ServiceRow = { id?: string; name?: string; description?: string | null; duration_minutes?: number; price?: number | null; sort_order?: number; is_active?: boolean; created_at?: string | null };
type SlotRow = { id?: string; doctor_id?: string; service_id?: string; start_time?: string; end_time?: string; slot_status?: string };

type DoctorInput = { name?: unknown; specialization?: unknown; isActive?: unknown };
type ServiceInput = { name?: unknown; description?: unknown; durationMinutes?: unknown; price?: unknown; sortOrder?: unknown; isActive?: unknown };
type SlotInput = { doctorId?: unknown; serviceId?: unknown; startTime?: unknown; endTime?: unknown };
type GenerateInput = { doctorId?: unknown; serviceId?: unknown; date?: unknown; weekday?: unknown; from?: unknown; to?: unknown; durationMinutes?: unknown };

function sessionHeaders(accessToken: string, extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...extra };
}

async function protect(req: Parameters<typeof requireClinicPermission>[0], res: Parameters<typeof respondToPermissionError>[0], action: "read" | "manage") {
  try {
    return await requireClinicPermission(req, "Settings", "clinic_settings", action);
  } catch (error) {
    respondToPermissionError(res, error);
    return null;
  }
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(typeof value === "string" ? value : "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown): string | null {
  const trimmed = text(value);
  return trimmed ? trimmed : null;
}

function optionalNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalBool(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const MAX_GENERATED_SLOTS = 200;
const validSlotStatuses = new Set(["available", "booked"]);

// Slot times are wall-clock times the clinic typed in; they are stored as UTC
// so the same HH:MM that was generated is what comes back out (formatted with
// UTC getters in the UI).
function slotTimestamp(date: string, time: string): string {
  const [hours, minutes] = time.split(":").map((part) => Number.parseInt(part, 10));
  return new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)), hours, minutes, 0, 0)).toISOString();
}

function slotDateKey(iso: string): string {
  return iso.slice(0, 10);
}

// Generates the HH:MM stepping from `from` up to (not past) `to`.
function slotTimes(from: string, to: string, durationMinutes: number): string[] {
  const toMinutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
  const start = toMinutes(from);
  const end = toMinutes(to);
  const times: string[] = [];
  for (let cursor = start; cursor + durationMinutes <= end; cursor += durationMinutes) {
    const hours = String(Math.floor(cursor / 60)).padStart(2, "0");
    const minutes = String(cursor % 60).padStart(2, "0");
    times.push(`${hours}:${minutes}`);
    if (times.length >= MAX_GENERATED_SLOTS) break;
  }
  return times;
}

// Resolves the target date for the generator: an explicit YYYY-MM-DD, or the
// next occurrence (today included) of a weekday number where 0 is Sunday.
function resolveGenerateDate(body: GenerateInput): { date: string | null; error: string | null } {
  const date = text(body.date);
  if (date) {
    if (!datePattern.test(date)) return { date: null, error: "صيغة التاريخ غير صحيحة، استخدم YYYY-MM-DD." };
    return { date, error: null };
  }
  const weekday = optionalNumber(body.weekday);
  if (weekday === null) return { date: null, error: "يلزم تحديد التاريخ أو اليوم من الأسبوع." };
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return { date: null, error: "اليوم من الأسبوع يجب أن يكون رقمًا بين 0 و6." };
  const today = new Date();
  const todayKey = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const offset = (weekday - today.getUTCDay() + 7) % 7;
  const target = new Date(todayKey + offset * 24 * 60 * 60 * 1000);
  const month = String(target.getUTCMonth() + 1).padStart(2, "0");
  const day = String(target.getUTCDate()).padStart(2, "0");
  return { date: `${target.getUTCFullYear()}-${month}-${day}`, error: null };
}

// ---------------------------------------------------------------------------
// Doctors
// ---------------------------------------------------------------------------

router.get("/doctors", async (req, res) => {
  const session = await protect(req, res, "read");
  if (!session) return;
  const limit = clampInt(req.query.limit, 200, 1, 1000);
  const path = `/rest/v1/doctors?select=id,name,specialization,is_active,created_at&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null&order=name.asc&limit=${limit}`;
  const result = await supabaseRequest<DoctorRow[]>(path, { headers: sessionHeaders(session.accessToken) });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر تحميل قائمة الأطباء." }); return; }
  const items = (result.data ?? []).map((doctor) => ({ id: doctor.id, name: doctor.name || "طبيب بدون اسم", specialization: doctor.specialization || null, isActive: doctor.is_active ?? true, createdAt: doctor.created_at || null }));
  res.json({ items, total: items.length, hasMore: items.length >= limit });
});

router.post("/doctors", async (req, res) => {
  const session = await protect(req, res, "manage");
  if (!session) return;
  const body = (req.body ?? {}) as DoctorInput;
  const name = text(body.name);
  if (!name) { res.status(400).json({ error: "اسم الطبيب مطلوب." }); return; }
  const result = await supabaseRequest<DoctorRow[]>("/rest/v1/doctors", {
    method: "POST",
    headers: sessionHeaders(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify({ clinic_id: session.clinicId, name, specialization: optionalText(body.specialization), is_active: optionalBool(body.isActive) ?? true }),
  });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر حفظ الطبيب." }); return; }
  const created = result.data?.[0] ?? null;
  clinicEvents.emitClinicEvent(session.clinicId, "settings.updated", { entity: "doctors", action: "created", doctorId: created?.id ?? null });
  res.status(201).json(created);
});

router.patch("/doctors/:id", async (req, res) => {
  const session = await protect(req, res, "manage");
  if (!session) return;
  const body = (req.body ?? {}) as DoctorInput;
  const name = text(body.name);
  if (!name) { res.status(400).json({ error: "اسم الطبيب مطلوب." }); return; }
  const isActive = optionalBool(body.isActive);
  const changes: Record<string, unknown> = { name, specialization: optionalText(body.specialization) };
  if (isActive !== null) changes.is_active = isActive;
  const path = `/rest/v1/doctors?id=eq.${encodeURIComponent(req.params.id)}&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null`;
  const result = await supabaseRequest<DoctorRow[]>(path, {
    method: "PATCH",
    headers: sessionHeaders(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify(changes),
  });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر تحديث الطبيب." }); return; }
  if (!result.data?.length) { res.status(404).json({ error: "الطبيب غير موجود." }); return; }
  clinicEvents.emitClinicEvent(session.clinicId, "settings.updated", { entity: "doctors", action: "updated", doctorId: req.params.id });
  res.json(result.data[0]);
});

router.delete("/doctors/:id", async (req, res) => {
  const session = await protect(req, res, "manage");
  if (!session) return;
  const path = `/rest/v1/doctors?id=eq.${encodeURIComponent(req.params.id)}&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null`;
  const result = await supabaseRequest<DoctorRow[]>(path, {
    method: "PATCH",
    headers: sessionHeaders(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify({ deleted_at: new Date().toISOString(), is_active: false }),
  });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر حذف الطبيب." }); return; }
  if (!result.data?.length) { res.status(404).json({ error: "الطبيب غير موجود." }); return; }
  clinicEvents.emitClinicEvent(session.clinicId, "settings.updated", { entity: "doctors", action: "deleted", doctorId: req.params.id });
  res.status(204).end();
});

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

router.get("/services", async (req, res) => {
  const session = await protect(req, res, "read");
  if (!session) return;
  const limit = clampInt(req.query.limit, 200, 1, 1000);
  const path = `/rest/v1/services?select=id,name,description,duration_minutes,price,sort_order,is_active,created_at&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null&order=sort_order.asc&limit=${limit}`;
  const result = await supabaseRequest<ServiceRow[]>(path, { headers: sessionHeaders(session.accessToken) });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر تحميل قائمة الخدمات." }); return; }
  const items = (result.data ?? []).map((service) => ({ id: service.id, name: service.name || "خدمة بدون اسم", description: service.description || null, durationMinutes: service.duration_minutes ?? null, price: service.price ?? null, sortOrder: service.sort_order ?? 0, isActive: service.is_active ?? true, createdAt: service.created_at || null }));
  res.json({ items, total: items.length, hasMore: items.length >= limit });
});

router.post("/services", async (req, res) => {
  const session = await protect(req, res, "manage");
  if (!session) return;
  const body = (req.body ?? {}) as ServiceInput;
  const name = text(body.name);
  if (!name) { res.status(400).json({ error: "اسم الخدمة مطلوب." }); return; }
  const durationMinutes = optionalNumber(body.durationMinutes);
  const price = optionalNumber(body.price);
  const sortOrder = optionalNumber(body.sortOrder);
  if (durationMinutes !== null && (!Number.isInteger(durationMinutes) || durationMinutes <= 0)) { res.status(400).json({ error: "مدة الخدمة يجب أن تكون عددًا صحيحًا أكبر من صفر." }); return; }
  if (price !== null && price < 0) { res.status(400).json({ error: "سعر الخدمة لا يمكن أن يكون سالبًا." }); return; }
  const result = await supabaseRequest<ServiceRow[]>("/rest/v1/services", {
    method: "POST",
    headers: sessionHeaders(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify({
      clinic_id: session.clinicId,
      name,
      description: optionalText(body.description),
      duration_minutes: durationMinutes ?? 30,
      price: price ?? 0,
      sort_order: sortOrder ?? 0,
      is_active: optionalBool(body.isActive) ?? true,
    }),
  });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر حفظ الخدمة." }); return; }
  const created = result.data?.[0] ?? null;
  clinicEvents.emitClinicEvent(session.clinicId, "settings.updated", { entity: "services", action: "created", serviceId: created?.id ?? null });
  res.status(201).json(created);
});

router.patch("/services/:id", async (req, res) => {
  const session = await protect(req, res, "manage");
  if (!session) return;
  const body = (req.body ?? {}) as ServiceInput;
  const name = text(body.name);
  if (!name) { res.status(400).json({ error: "اسم الخدمة مطلوب." }); return; }
  const durationMinutes = optionalNumber(body.durationMinutes);
  const price = optionalNumber(body.price);
  const sortOrder = optionalNumber(body.sortOrder);
  const isActive = optionalBool(body.isActive);
  if (durationMinutes !== null && (!Number.isInteger(durationMinutes) || durationMinutes <= 0)) { res.status(400).json({ error: "مدة الخدمة يجب أن تكون عددًا صحيحًا أكبر من صفر." }); return; }
  if (price !== null && price < 0) { res.status(400).json({ error: "سعر الخدمة لا يمكن أن يكون سالبًا." }); return; }
  const changes: Record<string, unknown> = { name, description: optionalText(body.description), duration_minutes: durationMinutes ?? 30, price: price ?? 0, sort_order: sortOrder ?? 0 };
  if (isActive !== null) changes.is_active = isActive;
  const path = `/rest/v1/services?id=eq.${encodeURIComponent(req.params.id)}&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null`;
  const result = await supabaseRequest<ServiceRow[]>(path, {
    method: "PATCH",
    headers: sessionHeaders(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify(changes),
  });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر تحديث الخدمة." }); return; }
  if (!result.data?.length) { res.status(404).json({ error: "الخدمة غير موجودة." }); return; }
  clinicEvents.emitClinicEvent(session.clinicId, "settings.updated", { entity: "services", action: "updated", serviceId: req.params.id });
  res.json(result.data[0]);
});

router.delete("/services/:id", async (req, res) => {
  const session = await protect(req, res, "manage");
  if (!session) return;
  const path = `/rest/v1/services?id=eq.${encodeURIComponent(req.params.id)}&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null`;
  const result = await supabaseRequest<ServiceRow[]>(path, {
    method: "PATCH",
    headers: sessionHeaders(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify({ deleted_at: new Date().toISOString(), is_active: false }),
  });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر حذف الخدمة." }); return; }
  if (!result.data?.length) { res.status(404).json({ error: "الخدمة غير موجودة." }); return; }
  clinicEvents.emitClinicEvent(session.clinicId, "settings.updated", { entity: "services", action: "deleted", serviceId: req.params.id });
  res.status(204).end();
});

// ---------------------------------------------------------------------------
// Appointment slots
// ---------------------------------------------------------------------------

router.get("/slots", async (req, res) => {
  const session = await protect(req, res, "read");
  if (!session) return;
  const limit = clampInt(req.query.limit, 200, 1, 1000);
  const doctorId = text(req.query.doctorId);
  const serviceId = text(req.query.serviceId);
  const from = text(req.query.from);
  const to = text(req.query.to);
  let path = `/rest/v1/appointment_slots?select=id,doctor_id,service_id,start_time,end_time,slot_status&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null&order=start_time.asc&limit=${limit}`;
  if (doctorId) path += `&doctor_id=eq.${encodeURIComponent(doctorId)}`;
  if (serviceId) path += `&service_id=eq.${encodeURIComponent(serviceId)}`;
  if (from && datePattern.test(from)) path += `&start_time=gte.${encodeURIComponent(slotTimestamp(from, "00:00"))}`;
  if (to && datePattern.test(to)) path += `&start_time=lte.${encodeURIComponent(slotTimestamp(to, "23:59"))}`;
  const result = await supabaseRequest<SlotRow[]>(path, { headers: sessionHeaders(session.accessToken) });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر تحميل المواعيد المتاحة." }); return; }
  const items = (result.data ?? []).map((slot) => ({ id: slot.id, doctorId: slot.doctor_id, serviceId: slot.service_id, startTime: slot.start_time, endTime: slot.end_time, status: slot.slot_status || "available" }));
  res.json({ items, total: items.length, hasMore: items.length >= limit });
});

router.post("/slots", async (req, res) => {
  const session = await protect(req, res, "manage");
  if (!session) return;
  const body = (req.body ?? {}) as SlotInput;
  const doctorId = text(body.doctorId);
  const serviceId = text(body.serviceId);
  const startTime = text(body.startTime);
  const endTime = text(body.endTime);
  if (!doctorId || !serviceId) { res.status(400).json({ error: "الطبيب والخدمة مطلوبان." }); return; }
  if (!startTime || !endTime || new Date(startTime).toString() === "Invalid Date" || new Date(endTime).toString() === "Invalid Date") { res.status(400).json({ error: "وقت البداية والنهاية مطلوبان." }); return; }
  if (new Date(endTime).getTime() <= new Date(startTime).getTime()) { res.status(400).json({ error: "نهاية الموعد يجب أن تكون بعد بدايته." }); return; }
  const result = await supabaseRequest<SlotRow[]>("/rest/v1/appointment_slots", {
    method: "POST",
    headers: sessionHeaders(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify({ clinic_id: session.clinicId, doctor_id: doctorId, service_id: serviceId, start_time: new Date(startTime).toISOString(), end_time: new Date(endTime).toISOString(), slot_status: "available" }),
  });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر إنشاء الموعد." }); return; }
  const created = result.data?.[0] ?? null;
  clinicEvents.emitClinicEvent(session.clinicId, "settings.updated", { entity: "appointment_slots", action: "created", slotId: created?.id ?? null });
  res.status(201).json(created);
});

// Key UX endpoint: turn working hours into N bookable slots in one request.
// POST /slots/generate { doctorId, serviceId, date | weekday, from, to, durationMinutes }
router.post("/slots/generate", async (req, res) => {
  const session = await protect(req, res, "manage");
  if (!session) return;
  const body = (req.body ?? {}) as GenerateInput;
  const doctorId = text(body.doctorId);
  const serviceId = text(body.serviceId);
  const from = text(body.from);
  const to = text(body.to);
  const durationMinutes = optionalNumber(body.durationMinutes);
  if (!doctorId || !serviceId) { res.status(400).json({ error: "اختر الطبيب والخدمة أولًا." }); return; }
  if (!timePattern.test(from) || !timePattern.test(to)) { res.status(400).json({ error: "صيغة وقت البداية والنهاية يجب أن تكون HH:MM." }); return; }
  if (!Number.isInteger(durationMinutes) || (durationMinutes ?? 0) <= 0) { res.status(400).json({ error: "مدة الموعد يجب أن تكون عددًا صحيحًا أكبر من صفر." }); return; }
  const resolved = resolveGenerateDate(body);
  if (resolved.error || !resolved.date) { res.status(400).json({ error: resolved.error || "تعذر تحديد تاريخ المواعيد." }); return; }
  const date = resolved.date;
  const times = slotTimes(from, to, durationMinutes ?? 30);
  if (!times.length) { res.status(400).json({ error: "لا توجد مواعيد ضمن هذه الأوقات، تأكد أن مدة الموعد أقصر من الفترة المتاحة." }); return; }

  const dayStart = slotTimestamp(date, "00:00");
  const dayEnd = slotTimestamp(date, "23:59");
  const existingResult = await supabaseRequest<SlotRow[]>(`/rest/v1/appointment_slots?select=start_time&clinic_id=eq.${encodeURIComponent(session.clinicId)}&doctor_id=eq.${encodeURIComponent(doctorId)}&deleted_at=is.null&start_time=gte.${encodeURIComponent(dayStart)}&start_time=lte.${encodeURIComponent(dayEnd)}&limit=1000`, { headers: sessionHeaders(session.accessToken) });
  if (!existingResult.ok) { res.status(existingResult.status || 502).json({ error: "تعذر التحقق من المواعيد الموجودة." }); return; }
  const existingStarts = new Set((existingResult.data ?? []).map((slot) => slotDateKey(String(slot.start_time)) + "T" + String(slot.start_time).slice(11, 16)));
  const rows = times
    .filter((time) => !existingStarts.has(`${date}T${time}`))
    .map((time) => ({
      clinic_id: session.clinicId,
      doctor_id: doctorId,
      service_id: serviceId,
      start_time: slotTimestamp(date, time),
      end_time: slotTimestamp(date, nextEnd(time, durationMinutes ?? 30)),
      slot_status: "available",
    }));
  if (!rows.length) { res.status(409).json({ error: "كل المواعيد في هذه الفترة منشأة مسبقًا." }); return; }

  const result = await supabaseRequest<SlotRow[]>("/rest/v1/appointment_slots", {
    method: "POST",
    headers: sessionHeaders(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify(rows),
  });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر توليد المواعيد." }); return; }
  const created = result.data ?? [];
  clinicEvents.emitClinicEvent(session.clinicId, "settings.updated", { entity: "appointment_slots", action: "generated", date, count: created.length });
  res.status(201).json({ created: created.length, skipped: times.length - created.length, date, slots: created.map((slot) => ({ id: slot.id, doctorId: slot.doctor_id, serviceId: slot.service_id, startTime: slot.start_time, endTime: slot.end_time, status: slot.slot_status })) });
});

function nextEnd(time: string, durationMinutes: number): string {
  const total = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)) + durationMinutes;
  const hours = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const minutes = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

router.patch("/slots/:id", async (req, res) => {
  const session = await protect(req, res, "manage");
  if (!session) return;
  const body = (req.body ?? {}) as SlotInput & { status?: unknown };
  const startTime = text(body.startTime);
  const endTime = text(body.endTime);
  const status = text(body.status);
  const changes: Record<string, unknown> = {};
  if (startTime) {
    if (new Date(startTime).toString() === "Invalid Date") { res.status(400).json({ error: "وقت البداية غير صالح." }); return; }
    changes.start_time = new Date(startTime).toISOString();
  }
  if (endTime) {
    if (new Date(endTime).toString() === "Invalid Date") { res.status(400).json({ error: "وقت النهاية غير صالح." }); return; }
    changes.end_time = new Date(endTime).toISOString();
  }
  if (status) {
    if (!validSlotStatuses.has(status)) { res.status(400).json({ error: "حالة الموعد غير معروفة." }); return; }
    changes.slot_status = status;
  }
  if (!Object.keys(changes).length) { res.status(400).json({ error: "لا توجد تغييرات." }); return; }
  const path = `/rest/v1/appointment_slots?id=eq.${encodeURIComponent(req.params.id)}&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null`;
  const result = await supabaseRequest<SlotRow[]>(path, {
    method: "PATCH",
    headers: sessionHeaders(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify(changes),
  });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر تحديث الموعد." }); return; }
  if (!result.data?.length) { res.status(404).json({ error: "الموعد غير موجود." }); return; }
  clinicEvents.emitClinicEvent(session.clinicId, "settings.updated", { entity: "appointment_slots", action: "updated", slotId: req.params.id });
  res.json(result.data[0]);
});

router.delete("/slots/:id", async (req, res) => {
  const session = await protect(req, res, "manage");
  if (!session) return;
  const path = `/rest/v1/appointment_slots?id=eq.${encodeURIComponent(req.params.id)}&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null`;
  const result = await supabaseRequest<SlotRow[]>(path, {
    method: "PATCH",
    headers: sessionHeaders(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify({ deleted_at: new Date().toISOString() }),
  });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر حذف الموعد." }); return; }
  if (!result.data?.length) { res.status(404).json({ error: "الموعد غير موجود." }); return; }
  clinicEvents.emitClinicEvent(session.clinicId, "settings.updated", { entity: "appointment_slots", action: "deleted", slotId: req.params.id });
  res.status(204).end();
});

export default router;
