import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, CalendarClock, Loader2, Pencil, Plus, Sparkles, Stethoscope, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { usePreferences } from "@/lib/preferences";

// قسم إعداد تقويم العيادة: الأطباء، الخدمات، والمواعيد المتاحة.
// يستهلك مسارات /api/doctors و /api/services و /api/slots الجديدة، وبمجرد
// إضافة الأطباء والمواعيد تظهر تلقائيًا كخيارات حجز في GET /api/appointments?includeOptions=true.

type DoctorItem = { id: string; name: string; specialization: string | null; isActive: boolean };
type ServiceItem = { id: string; name: string; description: string | null; durationMinutes: number | null; price: number | null; sortOrder: number; isActive: boolean };
type SlotItem = { id: string; doctorId: string; serviceId: string; startTime: string; endTime: string; status: string };

type ListResponse<T> = { items: T[]; total: number; hasMore: boolean };

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const payload = await response.json().catch(() => null) as T | { error?: string } | null;
  if (!response.ok) throw new Error(payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string" ? payload.error : "تعذر تنفيذ العملية.");
  return payload as T;
}

// أوقات المواعيد مخزنة بحيث إن الساعة المكتوبة هي نفسها UTC، فنقرأها بحقول UTC.
function isoToDateInput(iso: string): string {
  return iso.slice(0, 10);
}

function isoToTimeInput(iso: string): string {
  return iso.slice(11, 16);
}

function buildSlotIso(date: string, time: string): string {
  return `${date}T${time}:00Z`;
}

const WEEKDAYS = [
  { value: 0, ar: "الأحد", en: "Sunday" },
  { value: 1, ar: "الاثنين", en: "Monday" },
  { value: 2, ar: "الثلاثاء", en: "Tuesday" },
  { value: 3, ar: "الأربعاء", en: "Wednesday" },
  { value: 4, ar: "الخميس", en: "Thursday" },
  { value: 5, ar: "الجمعة", en: "Friday" },
  { value: 6, ar: "السبت", en: "Saturday" },
];

export function ClinicCalendarSetup() {
  const { language } = usePreferences();
  const en = language === "en";
  const [section, setSection] = useState<"doctors" | "services" | "slots">("doctors");

  const sections = en
    ? [
        { id: "doctors" as const, label: "Doctors", icon: Stethoscope },
        { id: "services" as const, label: "Services", icon: Briefcase },
        { id: "slots" as const, label: "Available slots", icon: CalendarClock },
      ]
    : [
        { id: "doctors" as const, label: "الأطباء", icon: Stethoscope },
        { id: "services" as const, label: "الخدمات", icon: Briefcase },
        { id: "slots" as const, label: "المواعيد المتاحة", icon: CalendarClock },
      ];

  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2">
      {sections.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => setSection(id)} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${section === id ? "bg-[#3c7e93] text-white" : "border border-[#dbe5ea] dark:border-[#1e3a4d] text-[#66808e] dark:text-[#7e939e]"}`}>
          <Icon size={15} /> {label}
        </button>
      ))}
    </div>
    {section === "doctors" ? <DoctorsSection en={en} /> : null}
    {section === "services" ? <ServicesSection en={en} /> : null}
    {section === "slots" ? <SlotsSection en={en} /> : null}
  </div>;
}

function SectionError({ error }: { error: string }) {
  return <div className="rounded-xl border border-[#edc4c0] dark:border-[#3d1f1b] bg-[#fff7f6] dark:bg-[#3d1f1b] p-3 text-xs text-[#a54c46] dark:text-[#eb9a90]">{error}</div>;
}

function SectionEmpty({ label }: { label: string }) {
  return <div className="rounded-xl border border-dashed border-[#dbe5ea] dark:border-[#1e3a4d] p-8 text-center text-xs text-[#8999a1] dark:text-[#7e939e]">{label}</div>;
}

function LoadingRow({ label }: { label: string }) {
  return <div className="flex items-center justify-center gap-2 py-8 text-xs text-[#8999a1] dark:text-[#7e939e]"><Loader2 size={14} className="animate-spin" /> {label}</div>;
}

// ---------------------------------------------------------------------------
// الأطباء
// ---------------------------------------------------------------------------

function DoctorsSection({ en }: { en: boolean }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<{ id: string | null; name: string; specialization: string; isActive: boolean }>({ id: null, name: "", specialization: "", isActive: true });
  const doctorsQuery = useQuery({
    queryKey: ["clinic-setup", "doctors"],
    queryFn: () => requestJson<ListResponse<DoctorItem>>("/api/doctors"),
    staleTime: 10_000,
  });
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["clinic-setup"] });

  const saveMutation = useMutation({
    mutationFn: (data: { id: string | null; name: string; specialization: string; isActive: boolean }) =>
      data.id
        ? requestJson(`/api/doctors/${encodeURIComponent(data.id)}`, { method: "PATCH", body: JSON.stringify({ name: data.name, specialization: data.specialization || null, isActive: data.isActive }) })
        : requestJson("/api/doctors", { method: "POST", body: JSON.stringify({ name: data.name, specialization: data.specialization || null, isActive: data.isActive }) }),
    onSuccess: (_data, variables) => {
      toast.success(en ? (variables.id ? "Doctor updated." : "Doctor added.") : (variables.id ? "تم تحديث الطبيب." : "تمت إضافة الطبيب."));
      setForm({ id: null, name: "", specialization: "", isActive: true });
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => requestJson(`/api/doctors/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success(en ? "Doctor deleted." : "تم حذف الطبيب.");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const doctors = doctorsQuery.data?.items ?? [];
  const busy = saveMutation.isPending || deleteMutation.isPending;

  return <div className="space-y-3">
    <form onSubmit={(event) => { event.preventDefault(); if (!form.name.trim()) return; saveMutation.mutate(form); }} className="grid gap-2 rounded-xl bg-[#f5f9fa] dark:bg-[#10222f] p-4 sm:grid-cols-[1fr_1fr_auto_auto]">
      <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={en ? "Doctor name" : "اسم الطبيب"} className="input-field" />
      <input value={form.specialization} onChange={(event) => setForm({ ...form, specialization: event.target.value })} placeholder={en ? "Specialty" : "التخصص"} className="input-field" />
      <label className="flex items-center gap-2 text-xs text-[#66808e] dark:text-[#7e939e]">
        <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
        {en ? "Active" : "نشط"}
      </label>
      <button disabled={busy} className="primary-button"><Plus size={15} /> {form.id ? (en ? "Update" : "تحديث") : (en ? "Add" : "إضافة")}</button>
      {form.id ? <button type="button" onClick={() => setForm({ id: null, name: "", specialization: "", isActive: true })} className="quiet-button">{en ? "Cancel" : "إلغاء"}</button> : null}
    </form>
    {doctorsQuery.isError ? <SectionError error={doctorsQuery.error instanceof Error ? doctorsQuery.error.message : (en ? "Could not load doctors." : "تعذر تحميل الأطباء.")} /> : null}
    {doctorsQuery.isLoading ? <LoadingRow label={en ? "Loading doctors..." : "جارٍ تحميل الأطباء..."} /> : (
      <div className="space-y-2">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#edf1f3] dark:border-[#1e3a4d] p-4">
            <span className="grid size-9 place-items-center rounded-lg bg-[#dcebef] dark:bg-[#143242] text-[#3c7e93] dark:text-[#8cc3dd]"><UserRound size={16} /></span>
            <div className="min-w-0 flex-1">
              <strong className="block text-xs dark:text-[#e2ecf1]">{doctor.name}</strong>
              <span className="mt-1 block text-[10px] text-[#8999a1] dark:text-[#7e939e]">{doctor.specialization || (en ? "No specialty" : "بدون تخصص")}</span>
            </div>
            <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${doctor.isActive ? "bg-[#f2faf6] dark:bg-[#123528] text-[#39755f] dark:text-[#7fd0b4]" : "bg-[#fff7f6] dark:bg-[#3d1f1b] text-[#a54c46] dark:text-[#eb9a90]"}`}>{doctor.isActive ? (en ? "Active" : "نشط") : (en ? "Inactive" : "متوقف")}</span>
            <button onClick={() => setForm({ id: doctor.id, name: doctor.name, specialization: doctor.specialization || "", isActive: doctor.isActive })} disabled={busy} className="rounded-lg border px-2.5 py-1.5 text-[10px] font-bold dark:border-[#1e3a4d] dark:text-[#e2ecf1]"><Pencil size={12} className="inline" /> {en ? "Edit" : "تعديل"}</button>
            <button onClick={() => { if (window.confirm(en ? "Delete this doctor?" : "حذف هذا الطبيب؟")) deleteMutation.mutate(doctor.id); }} disabled={busy} className="rounded-lg border border-[#edc4c0] px-2.5 py-1.5 text-[10px] font-bold text-[#a54c46] dark:border-[#3d1f1b] dark:text-[#eb9a90]"><Trash2 size={12} className="inline" /> {en ? "Delete" : "حذف"}</button>
          </div>
        ))}
        {doctors.length === 0 ? <SectionEmpty label={en ? "No doctors yet. Add the first doctor so bookings can start." : "لا يوجد أطباء بعد. أضف أول طبيب لتبدأ الحجوزات."} /> : null}
      </div>
    )}
  </div>;
}

// ---------------------------------------------------------------------------
// الخدمات
// ---------------------------------------------------------------------------

function ServicesSection({ en }: { en: boolean }) {
  const queryClient = useQueryClient();
  const emptyForm = { id: null as string | null, name: "", description: "", durationMinutes: "30", price: "0", sortOrder: "0", isActive: true };
  const [form, setForm] = useState(emptyForm);
  const servicesQuery = useQuery({
    queryKey: ["clinic-setup", "services"],
    queryFn: () => requestJson<ListResponse<ServiceItem>>("/api/services"),
    staleTime: 10_000,
  });
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["clinic-setup"] });

  const saveMutation = useMutation({
    mutationFn: (data: typeof emptyForm) => {
      const payload = { name: data.name, description: data.description || null, durationMinutes: Number(data.durationMinutes) || 30, price: Number(data.price) || 0, sortOrder: Number(data.sortOrder) || 0, isActive: data.isActive };
      return data.id
        ? requestJson(`/api/services/${encodeURIComponent(data.id)}`, { method: "PATCH", body: JSON.stringify(payload) })
        : requestJson("/api/services", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: (_data, variables) => {
      toast.success(en ? (variables.id ? "Service updated." : "Service added.") : (variables.id ? "تم تحديث الخدمة." : "تمت إضافة الخدمة."));
      setForm(emptyForm);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => requestJson(`/api/services/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success(en ? "Service deleted." : "تم حذف الخدمة.");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const services = servicesQuery.data?.items ?? [];
  const busy = saveMutation.isPending || deleteMutation.isPending;

  return <div className="space-y-3">
    <form onSubmit={(event) => { event.preventDefault(); if (!form.name.trim()) return; saveMutation.mutate(form); }} className="grid gap-2 rounded-xl bg-[#f5f9fa] dark:bg-[#10222f] p-4 sm:grid-cols-2">
      <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={en ? "Service name" : "اسم الخدمة"} className="input-field" />
      <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder={en ? "Description (optional)" : "الوصف (اختياري)"} className="input-field" />
      <label className="flex items-center gap-2 text-xs text-[#66808e] dark:text-[#7e939e]">
        {en ? "Duration (minutes)" : "المدة بالدقائق"}
        <input type="number" min={5} step={5} value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })} className="input-field py-2" />
      </label>
      <label className="flex items-center gap-2 text-xs text-[#66808e] dark:text-[#7e939e]">
        {en ? "Price" : "السعر"}
        <input type="number" min={0} step={1} value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="input-field py-2" />
      </label>
      <label className="flex items-center gap-2 text-xs text-[#66808e] dark:text-[#7e939e]">
        {en ? "Sort order" : "ترتيب العرض"}
        <input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} className="input-field py-2" />
      </label>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-[#66808e] dark:text-[#7e939e]">
          <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
          {en ? "Active" : "نشط"}
        </label>
        <button disabled={busy} className="primary-button"><Plus size={15} /> {form.id ? (en ? "Update" : "تحديث") : (en ? "Add" : "إضافة")}</button>
        {form.id ? <button type="button" onClick={() => setForm(emptyForm)} className="quiet-button">{en ? "Cancel" : "إلغاء"}</button> : null}
      </div>
    </form>
    {servicesQuery.isError ? <SectionError error={servicesQuery.error instanceof Error ? servicesQuery.error.message : (en ? "Could not load services." : "تعذر تحميل الخدمات.")} /> : null}
    {servicesQuery.isLoading ? <LoadingRow label={en ? "Loading services..." : "جارٍ تحميل الخدمات..."} /> : (
      <div className="space-y-2">
        {services.map((service) => (
          <div key={service.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#edf1f3] dark:border-[#1e3a4d] p-4">
            <span className="grid size-9 place-items-center rounded-lg bg-[#dcebef] dark:bg-[#143242] text-[#3c7e93] dark:text-[#8cc3dd]"><Briefcase size={16} /></span>
            <div className="min-w-0 flex-1">
              <strong className="block text-xs dark:text-[#e2ecf1]">{service.name}</strong>
              <span className="mt-1 block text-[10px] text-[#8999a1] dark:text-[#7e939e]">
                {service.durationMinutes ? `${service.durationMinutes} ${en ? "min" : "دقيقة"}` : (en ? "No duration" : "بدون مدة")}
                {service.price !== null ? ` · ${service.price} ${en ? "SAR" : "ر.س"}` : ""}
                {service.description ? ` · ${service.description}` : ""}
              </span>
            </div>
            <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${service.isActive ? "bg-[#f2faf6] dark:bg-[#123528] text-[#39755f] dark:text-[#7fd0b4]" : "bg-[#fff7f6] dark:bg-[#3d1f1b] text-[#a54c46] dark:text-[#eb9a90]"}`}>{service.isActive ? (en ? "Active" : "نشط") : (en ? "Inactive" : "متوقف")}</span>
            <button onClick={() => setForm({ id: service.id, name: service.name, description: service.description || "", durationMinutes: String(service.durationMinutes ?? 30), price: String(service.price ?? 0), sortOrder: String(service.sortOrder ?? 0), isActive: service.isActive })} disabled={busy} className="rounded-lg border px-2.5 py-1.5 text-[10px] font-bold dark:border-[#1e3a4d] dark:text-[#e2ecf1]"><Pencil size={12} className="inline" /> {en ? "Edit" : "تعديل"}</button>
            <button onClick={() => { if (window.confirm(en ? "Delete this service?" : "حذف هذه الخدمة؟")) deleteMutation.mutate(service.id); }} disabled={busy} className="rounded-lg border border-[#edc4c0] px-2.5 py-1.5 text-[10px] font-bold text-[#a54c46] dark:border-[#3d1f1b] dark:text-[#eb9a90]"><Trash2 size={12} className="inline" /> {en ? "Delete" : "حذف"}</button>
          </div>
        ))}
        {services.length === 0 ? <SectionEmpty label={en ? "No services yet. Add the first service so slots can be generated." : "لا توجد خدمات بعد. أضف أول خدمة لتتمكن من توليد المواعيد."} /> : null}
      </div>
    )}
  </div>;
}

// ---------------------------------------------------------------------------
// المواعيد المتاحة + مولّد المواعيد
// ---------------------------------------------------------------------------

const emptyGenerator = { doctorId: "", serviceId: "", date: "", weekday: "1", from: "09:00", to: "17:00", durationMinutes: "30" };

function SlotsSection({ en }: { en: boolean }) {
  const queryClient = useQueryClient();
  const [generator, setGenerator] = useState(emptyGenerator);
  const [doctorFilter, setDoctorFilter] = useState("");
  const [showSingleAdd, setShowSingleAdd] = useState(false);
  const emptySingleSlot = { doctorId: "", serviceId: "", date: "", from: "09:00", to: "09:30" };
  const [singleSlot, setSingleSlot] = useState(emptySingleSlot);
  const [editSlot, setEditSlot] = useState<{ id: string; date: string; from: string; to: string; status: string } | null>(null);

  const doctorsQuery = useQuery({
    queryKey: ["clinic-setup", "doctors"],
    queryFn: () => requestJson<ListResponse<DoctorItem>>("/api/doctors"),
    staleTime: 10_000,
  });
  const servicesQuery = useQuery({
    queryKey: ["clinic-setup", "services"],
    queryFn: () => requestJson<ListResponse<ServiceItem>>("/api/services"),
    staleTime: 10_000,
  });
  const slotsQuery = useQuery({
    queryKey: ["clinic-setup", "slots", doctorFilter],
    queryFn: () => requestJson<ListResponse<SlotItem>>(`/api/slots${doctorFilter ? `?doctorId=${encodeURIComponent(doctorFilter)}` : ""}`),
    staleTime: 10_000,
  });
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["clinic-setup"] });

  const generateMutation = useMutation({
    mutationFn: (data: typeof emptyGenerator) => requestJson<{ created: number; skipped: number; date: string }>("/api/slots/generate", {
      method: "POST",
      body: JSON.stringify({
        doctorId: data.doctorId,
        serviceId: data.serviceId,
        ...(data.date ? { date: data.date } : { weekday: Number(data.weekday) }),
        from: data.from,
        to: data.to,
        durationMinutes: Number(data.durationMinutes) || 30,
      }),
    }),
    onSuccess: (result) => {
      toast.success(en ? `Generated ${result.created} slots for ${result.date}.` : `تم توليد ${result.created} موعدًا في ${result.date}.`);
      setGenerator(emptyGenerator);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const singleMutationSuccess = () => {
    toast.success(en ? "Slot created." : "تم إنشاء الموعد.");
    setSingleSlot(emptySingleSlot);
    invalidate();
  };

  const addSlotMutation = useMutation({
    mutationFn: (data: { doctorId: string; serviceId: string; date: string; from: string; to: string }) => requestJson("/api/slots", {
      method: "POST",
      body: JSON.stringify({ doctorId: data.doctorId, serviceId: data.serviceId, startTime: buildSlotIso(data.date, data.from), endTime: buildSlotIso(data.date, data.to) }),
    }),
    onSuccess: singleMutationSuccess,
    onError: (error: Error) => toast.error(error.message),
  });

  const updateSlotMutation = useMutation({
    mutationFn: (data: { id: string; date: string; from: string; to: string; status: string }) => requestJson(`/api/slots/${encodeURIComponent(data.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ startTime: buildSlotIso(data.date, data.from), endTime: buildSlotIso(data.date, data.to), status: data.status }),
    }),
    onSuccess: () => {
      toast.success(en ? "Slot updated." : "تم تحديث الموعد.");
      setEditSlot(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteSlotMutation = useMutation({
    mutationFn: (id: string) => requestJson(`/api/slots/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success(en ? "Slot deleted." : "تم حذف الموعد.");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const doctors = doctorsQuery.data?.items ?? [];
  const services = servicesQuery.data?.items ?? [];
  const slots = slotsQuery.data?.items ?? [];
  const doctorName = (id: string) => doctors.find((doctor) => doctor.id === id)?.name || (en ? "Unknown doctor" : "طبيب غير معروف");
  const serviceName = (id: string) => services.find((service) => service.id === id)?.name || (en ? "Unknown service" : "خدمة غير معروفة");
  const busy = generateMutation.isPending || addSlotMutation.isPending || updateSlotMutation.isPending || deleteSlotMutation.isPending;
  const canGenerate = generator.doctorId && generator.serviceId;

  return <div className="space-y-4">
    <form onSubmit={(event) => { event.preventDefault(); if (!canGenerate) return; generateMutation.mutate(generator); }} className="space-y-3 rounded-xl border border-[#3c7e93]/20 bg-[#f5f9fa] dark:bg-[#10222f] p-4">
      <div className="flex items-center gap-2 text-xs font-bold text-[#3c7e93] dark:text-[#8cc3dd]"><Sparkles size={15} /> {en ? "Generate slots from working hours" : "توليد المواعيد من ساعات العمل"}</div>
      <div className="grid gap-2 sm:grid-cols-3">
        <select required value={generator.doctorId} onChange={(event) => setGenerator({ ...generator, doctorId: event.target.value })} className="input-field">
          <option value="">{en ? "Choose doctor" : "اختر الطبيب"}</option>
          {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
        </select>
        <select required value={generator.serviceId} onChange={(event) => setGenerator({ ...generator, serviceId: event.target.value })} className="input-field">
          <option value="">{en ? "Choose service" : "اختر الخدمة"}</option>
          {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
        </select>
        <input type="date" value={generator.date} onChange={(event) => setGenerator({ ...generator, date: event.target.value })} className="input-field" aria-label={en ? "Date" : "التاريخ"} />
        <select value={generator.weekday} onChange={(event) => setGenerator({ ...generator, weekday: event.target.value })} disabled={Boolean(generator.date)} className="input-field disabled:opacity-50">
          {WEEKDAYS.map((day) => <option key={day.value} value={day.value}>{generator.date ? day.ar : (en ? day.en : day.ar)}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-[#66808e] dark:text-[#7e939e]">
          {en ? "From" : "من"}
          <input type="time" required value={generator.from} onChange={(event) => setGenerator({ ...generator, from: event.target.value })} className="input-field py-2" />
        </label>
        <label className="flex items-center gap-2 text-xs text-[#66808e] dark:text-[#7e939e]">
          {en ? "To" : "إلى"}
          <input type="time" required value={generator.to} onChange={(event) => setGenerator({ ...generator, to: event.target.value })} className="input-field py-2" />
        </label>
        <label className="flex items-center gap-2 text-xs text-[#66808e] dark:text-[#7e939e]">
          {en ? "Slot duration (minutes)" : "مدة الموعد بالدقائق"}
          <input type="number" min={5} step={5} required value={generator.durationMinutes} onChange={(event) => setGenerator({ ...generator, durationMinutes: event.target.value })} className="input-field py-2" />
        </label>
        <button disabled={busy || !canGenerate} className="primary-button"><Sparkles size={15} /> {en ? "Generate slots" : "توليد المواعيد"}</button>
      </div>
      <p className="text-[10px] text-[#8999a1] dark:text-[#7e939e]">{en ? "Leave the date empty and pick a weekday to generate for its next occurrence. Existing slots at the same times are skipped." : "اترك التاريخ فارغًا واختر يومًا من الأسبوع للتوليد في أقرب موعد له. المواعيد الموجودة مسبقًا في نفس الأوقات يتم تجاهلها."}</p>
    </form>

    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="text-xs font-bold text-[#23475b] dark:text-[#e2ecf1]">{en ? "Slots" : "قائمة المواعيد"}</h4>
      <div className="flex items-center gap-2">
        <select value={doctorFilter} onChange={(event) => setDoctorFilter(event.target.value)} className="input-field max-w-[200px] py-2 text-xs">
          <option value="">{en ? "All doctors" : "كل الأطباء"}</option>
          {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
        </select>
        <button onClick={() => setShowSingleAdd((value) => !value)} className="quiet-button"><Plus size={15} /> {en ? "Single slot" : "موعد فردي"}</button>
      </div>
    </div>

    {showSingleAdd ? (
      <form onSubmit={(event) => { event.preventDefault(); if (!singleSlot.doctorId || !singleSlot.serviceId) return; addSlotMutation.mutate(singleSlot); }} className="grid gap-2 rounded-xl bg-[#f5f9fa] dark:bg-[#10222f] p-4 sm:grid-cols-3">
        <select required value={singleSlot.doctorId} onChange={(event) => setSingleSlot({ ...singleSlot, doctorId: event.target.value })} className="input-field">
          <option value="">{en ? "Choose doctor" : "اختر الطبيب"}</option>
          {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
        </select>
        <select required value={singleSlot.serviceId} onChange={(event) => setSingleSlot({ ...singleSlot, serviceId: event.target.value })} className="input-field">
          <option value="">{en ? "Choose service" : "اختر الخدمة"}</option>
          {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
        </select>
        <input type="date" required value={singleSlot.date} onChange={(event) => setSingleSlot({ ...singleSlot, date: event.target.value })} className="input-field" />
        <label className="flex items-center gap-2 text-xs text-[#66808e] dark:text-[#7e939e]">
          {en ? "From" : "من"}
          <input type="time" required value={singleSlot.from} onChange={(event) => setSingleSlot({ ...singleSlot, from: event.target.value })} className="input-field py-2" />
        </label>
        <label className="flex items-center gap-2 text-xs text-[#66808e] dark:text-[#7e939e]">
          {en ? "To" : "إلى"}
          <input type="time" required value={singleSlot.to} onChange={(event) => setSingleSlot({ ...singleSlot, to: event.target.value })} className="input-field py-2" />
        </label>
        <button disabled={busy} className="primary-button"><Plus size={15} /> {en ? "Add slot" : "إضافة الموعد"}</button>
      </form>
    ) : null}

    {slotsQuery.isError ? <SectionError error={slotsQuery.error instanceof Error ? slotsQuery.error.message : (en ? "Could not load slots." : "تعذر تحميل المواعيد.")} /> : null}
    {slotsQuery.isLoading ? <LoadingRow label={en ? "Loading slots..." : "جارٍ تحميل المواعيد..."} /> : (
      <div className="space-y-2">
        {slots.map((slot) => {
          const booked = slot.status === "booked";
          return (
            <div key={slot.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#edf1f3] dark:border-[#1e3a4d] p-4">
              <span className="grid size-9 place-items-center rounded-lg bg-[#dcebef] dark:bg-[#143242] text-[#3c7e93] dark:text-[#8cc3dd]"><CalendarClock size={16} /></span>
              <div className="min-w-0 flex-1">
                <strong className="block text-xs dark:text-[#e2ecf1]" dir="ltr">{isoToDateInput(slot.startTime)} · {isoToTimeInput(slot.startTime)} → {isoToTimeInput(slot.endTime)}</strong>
                <span className="mt-1 block text-[10px] text-[#8999a1] dark:text-[#7e939e]">{doctorName(slot.doctorId)} · {serviceName(slot.serviceId)}</span>
              </div>
              <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${booked ? "bg-[#fff7f6] dark:bg-[#3d1f1b] text-[#a54c46] dark:text-[#eb9a90]" : "bg-[#f2faf6] dark:bg-[#123528] text-[#39755f] dark:text-[#7fd0b4]"}`}>{booked ? (en ? "Booked" : "محجوز") : (en ? "Available" : "متاح")}</span>
              <button onClick={() => setEditSlot({ id: slot.id, date: isoToDateInput(slot.startTime), from: isoToTimeInput(slot.startTime), to: isoToTimeInput(slot.endTime), status: slot.status })} disabled={busy} className="rounded-lg border px-2.5 py-1.5 text-[10px] font-bold dark:border-[#1e3a4d] dark:text-[#e2ecf1]"><Pencil size={12} className="inline" /> {en ? "Edit" : "تعديل"}</button>
              <button onClick={() => { if (window.confirm(en ? "Delete this slot?" : "حذف هذا الموعد؟")) deleteSlotMutation.mutate(slot.id); }} disabled={busy} title={booked ? (en ? "Booked slots cannot be deleted." : "لا يمكن حذف موعد محجوز.") : undefined} className="rounded-lg border border-[#edc4c0] px-2.5 py-1.5 text-[10px] font-bold text-[#a54c46] disabled:opacity-40 dark:border-[#3d1f1b] dark:text-[#eb9a90]"><Trash2 size={12} className="inline" /> {en ? "Delete" : "حذف"}</button>
            </div>
          );
        })}
        {slots.length === 0 ? <SectionEmpty label={en ? "No slots yet. Use the generator above to create bookable times." : "لا توجد مواعيد متاحة بعد. استخدم المولّد في الأعلى لإنشاء المواعيد."} /> : null}
      </div>
    )}

    {editSlot ? (
      <form onSubmit={(event) => { event.preventDefault(); updateSlotMutation.mutate(editSlot); }} className="grid gap-2 rounded-xl border border-[#3c7e93]/20 bg-[#f5f9fa] dark:bg-[#10222f] p-4 sm:grid-cols-[auto_auto_auto_auto_auto_auto]">
        <input type="date" required value={editSlot.date} onChange={(event) => setEditSlot({ ...editSlot, date: event.target.value })} className="input-field" />
        <input type="time" required value={editSlot.from} onChange={(event) => setEditSlot({ ...editSlot, from: event.target.value })} className="input-field" />
        <input type="time" required value={editSlot.to} onChange={(event) => setEditSlot({ ...editSlot, to: event.target.value })} className="input-field" />
        <select value={editSlot.status} onChange={(event) => setEditSlot({ ...editSlot, status: event.target.value })} className="input-field">
          <option value="available">{en ? "Available" : "متاح"}</option>
          <option value="booked">{en ? "Booked" : "محجوز"}</option>
        </select>
        <button disabled={busy} className="primary-button">{en ? "Save" : "حفظ"}</button>
        <button type="button" onClick={() => setEditSlot(null)} className="quiet-button">{en ? "Cancel" : "إلغاء"}</button>
      </form>
    ) : null}
  </div>;
}
