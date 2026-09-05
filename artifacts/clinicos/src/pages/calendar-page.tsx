import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus, RefreshCw, User, X } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { usePreferences } from "@/lib/preferences";
import { WorkspacePage, WorkspacePageHeader } from "@/components/workspace-page";

// الخادم يعيد الحقول بصيغة camelCase: { id, name, scheduledAt, status, ... }
type Appointment = {
  id: string;
  name: string;
  scheduledAt: string | null;
  status: string;
  doctorName?: string | null;
  serviceName?: string | null;
};

type AppointmentRow = {
  id?: string;
  name?: string;
  patientName?: string;
  scheduledAt?: string | null;
  scheduled_at?: string | null;
  status?: string;
  appointment_status?: string;
  doctorName?: string | null;
  serviceName?: string | null;
};

type BookingOptions = {
  patients: Array<{ id: string; name: string }>;
  slots: Array<{ id: string; startTime: string; doctorId: string; serviceId: string }>;
  doctors: Array<{ id: string; name: string }>;
  services: Array<{ id: string; name: string }>;
};

async function getCalendarAppointments(signal?: AbortSignal): Promise<Appointment[]> {
  const response = await fetch("/api/appointments?includeOptions=false", { credentials: "include", signal });
  if (!response.ok) throw new Error("تعذر تحميل المواعيد");
  const data = await response.json().catch(() => null);
  // الخادم يعيد مصفوفة مباشرة، أو { appointments, options } عند includeOptions=true
  const rows: AppointmentRow[] = Array.isArray(data) ? data : Array.isArray(data?.appointments) ? data.appointments : [];
  return rows.map((row) => ({
    id: String(row.id ?? ""),
    name: row.name || row.patientName || "مريض بدون اسم",
    scheduledAt: row.scheduledAt ?? row.scheduled_at ?? null,
    status: row.status || row.appointment_status || "scheduled",
    doctorName: row.doctorName ?? null,
    serviceName: row.serviceName ?? null,
  }));
}

async function getBookingOptions(signal?: AbortSignal): Promise<BookingOptions | null> {
  const response = await fetch("/api/appointments?includeOptions=true", { credentials: "include", signal });
  if (!response.ok) return null;
  const data = await response.json().catch(() => null);
  return data?.options || null;
}

function getWeekDays(baseDate: Date): Date[] {
  const start = new Date(baseDate);
  const dayOfWeek = start.getDay(); // 0=Sun, 6=Sat
  const diff = (dayOfWeek + 1) % 7;
  start.setDate(start.getDate() - diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function statusColors(status: string) {
  if (status === "completed" || status === "checked_in") return "bg-[#d9f0e8] text-[#176b58] border-[#b0dac8] dark:bg-[#123528] dark:text-[#7fd0b4] dark:border-[#1d4a35]";
  if (status === "scheduled" || status === "confirmed") return "bg-[#fff0d8] text-[#9a6513] border-[#f5d499] dark:bg-[#3a2c14] dark:text-[#e0b46a] dark:border-[#4a3a1a]";
  if (status === "cancelled" || status === "no_show") return "bg-[#f8dfdc] text-[#a64036] border-[#edbab5] dark:bg-[#3d1f1b] dark:text-[#eb9a90] dark:border-[#5a2a25]";
  return "bg-[#dcecf5] text-[#22617d] border-[#b0cfe0] dark:bg-[#143242] dark:text-[#8cc3dd] dark:border-[#1e3a4d]";
}

function statusLabel(status: string, en: boolean) {
  const labels: Record<string, [string, string]> = {
    scheduled: ["مجدول", "Scheduled"],
    confirmed: ["مؤكد", "Confirmed"],
    checked_in: ["وصل", "Checked in"],
    completed: ["مكتمل", "Completed"],
    cancelled: ["ملغي", "Cancelled"],
    no_show: ["لم يحضر", "No show"],
    pending: ["معلق", "Pending"],
  };
  const pair = labels[status];
  return pair ? (en ? pair[1] : pair[0]) : status;
}

const CLINIC_TZ = "Asia/Riyadh";
function formatTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit", timeZone: CLINIC_TZ }).format(d);
}

function formatDateShort(d: Date, en: boolean) {
  return new Intl.DateTimeFormat(en ? "en-US" : "ar-EG", { weekday: "short", day: "numeric" }).format(d);
}

function formatMonthYear(d: Date, en: boolean) {
  return new Intl.DateTimeFormat(en ? "en-US" : "ar-EG", { month: "long", year: "numeric" }).format(d);
}

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const { language, selectedBranchId } = usePreferences();
  const en = language === "en";
  const today = useMemo(() => new Date(), []);

  const [baseDate, setBaseDate] = useState<Date>(today);
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({ patientId: "", slotId: "", notes: "" });

  const query = useQuery({
    queryKey: ["calendar-appointments", selectedBranchId],
    queryFn: ({ signal }) => getCalendarAppointments(signal),
    staleTime: 30_000,
    refetchInterval: false,
  });

  const optionsQuery = useQuery({
    queryKey: ["booking-options"],
    queryFn: ({ signal }) => getBookingOptions(signal),
    enabled: bookingOpen,
    staleTime: 60_000,
  });

  const bookMutation = useMutation({
    mutationFn: async (form: { patientId: string; slotId: string; notes: string }) => {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("تعذر حجز الموعد");
      return res.json();
    },
    onSuccess: async (created: { queuePath?: string }) => {
      if (created.queuePath) {
        const queueUrl = new URL(created.queuePath, window.location.origin).toString();
        try {
          await navigator.clipboard?.writeText(queueUrl);
          toast.success(en ? "Appointment booked; queue link copied" : "تم حجز الموعد ونسخ رابط الكيو");
        } catch {
          toast.success(en ? "Appointment booked; queue link is ready" : "تم حجز الموعد ورابط الكيو جاهز");
        }
      } else {
        toast.success(en ? "Appointment booked successfully" : "تم حجز الموعد بنجاح");
      }
      setBookingOpen(false);
      setBookingForm({ patientId: "", slotId: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["calendar-appointments"] });
      query.refetch();
    },
    onError: () => {
      toast.error(en ? "Failed to book appointment" : "تعذر إتمام الحجز");
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, scheduledAt }: { id: string; scheduledAt: string }) => {
      const res = await fetch(`/api/appointments/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ scheduledAt }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || (en ? "Failed to reschedule appointment" : "تعذر نقل الموعد"));
      }
      return res.json();
    },
    // تحديث متفائل مع التراجع عند الفشل
    onMutate: async ({ id, scheduledAt }) => {
      await queryClient.cancelQueries({ queryKey: ["calendar-appointments"] });
      const previous = queryClient.getQueryData<Appointment[]>(["calendar-appointments", selectedBranchId]);
      queryClient.setQueryData<Appointment[]>(["calendar-appointments", selectedBranchId], (old) =>
        (old ?? []).map((appt) => (appt.id === id ? { ...appt, scheduledAt } : appt))
      );
      return { previous };
    },
    onSuccess: (_data, vars) => {
      toast.success(
        en
          ? `Appointment rescheduled to ${formatDateShort(new Date(vars.scheduledAt), en)}`
          : `تم نقل الموعد وتأجيله إلى ${formatDateShort(new Date(vars.scheduledAt), en)}`
      );
      queryClient.invalidateQueries({ queryKey: ["calendar-appointments"] });
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["calendar-appointments", selectedBranchId], context.previous);
      toast.error(error.message || (en ? "Failed to reschedule appointment" : "تعذر نقل الموعد"));
      queryClient.invalidateQueries({ queryKey: ["calendar-appointments"] });
    },
  });

  const appointments = query.data ?? [];
  const weekDays = useMemo(() => getWeekDays(baseDate), [baseDate]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const appt of appointments) {
      if (!appt.scheduledAt) continue;
      const d = new Date(appt.scheduledAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(appt);
    }
    return map;
  }, [appointments]);

  function dayKey(d: Date) { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }

  const goNext = () => { const d = new Date(baseDate); d.setDate(d.getDate() + (viewMode === "week" ? 7 : 1)); setBaseDate(d); };
  const goPrev = () => { const d = new Date(baseDate); d.setDate(d.getDate() - (viewMode === "week" ? 7 : 1)); setBaseDate(d); };
  const goToday = () => setBaseDate(today);

  const todayKey = dayKey(today);

  const headerTitle = viewMode === "week"
    ? `${formatDateShort(weekDays[0], en)} — ${formatDateShort(weekDays[6], en)} · ${formatMonthYear(weekDays[3], en)}`
    : formatDateShort(baseDate, en);

  const options = optionsQuery.data;
  const doctorName = (id: string) => options?.doctors.find((d) => d.id === id)?.name || (en ? "Doctor" : "الطبيب");
  const serviceName = (id: string) => options?.services.find((s) => s.id === id)?.name || (en ? "Service" : "الخدمة");

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.patientId || !bookingForm.slotId) {
      toast.error(en ? "Please select a patient and a time slot" : "يرجى اختيار المريض والموعد المتاح");
      return;
    }
    bookMutation.mutate(bookingForm);
  };

  return (
    <WorkspacePage>
      <WorkspacePageHeader
        eyebrow={en ? "Operations / Calendar" : "التشغيل / التقويم"}
        title={en ? "Appointments Calendar" : "تقويم المواعيد"}
        description={en ? "View and navigate clinic appointments by week or day" : "استعرض مواعيد العيادة بعرض أسبوعي أو يومي"}
        action={
          <div className="flex items-center gap-2">
            <button
              className="primary-button"
              onClick={() => setBookingOpen(true)}
              data-testid="button-quick-book-calendar"
            >
              <Plus size={15} />
              {en ? "Quick Book" : "حجز موعد"}
            </button>
            <button className="quiet-button" onClick={() => query.refetch()} disabled={query.isFetching} data-testid="button-refresh-calendar">
              <RefreshCw size={15} className={query.isFetching ? "animate-spin" : ""} />
              {en ? "Refresh" : "تحديث"}
            </button>
          </div>
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-xl border border-[#dbe5ea] bg-white dark:border-[#1e3a4d] dark:bg-[#122434]">
          <button
            className={`rounded-r-xl px-4 py-2 text-xs font-bold transition ${viewMode === "week" ? "bg-[#e6f4ee] text-[#2c7a5d] dark:bg-[#123528] dark:text-[#7fd0b4]" : "text-[#66808e] hover:bg-[#f5f9fa] dark:text-[#7e939e] dark:hover:bg-[#10222f]"}`}
            onClick={() => setViewMode("week")}
            data-testid="button-view-week"
          >
            {en ? "Week" : "أسبوع"}
          </button>
          <button
            className={`rounded-l-xl px-4 py-2 text-xs font-bold transition ${viewMode === "day" ? "bg-[#e6f4ee] text-[#2c7a5d] dark:bg-[#123528] dark:text-[#7fd0b4]" : "text-[#66808e] hover:bg-[#f5f9fa] dark:text-[#7e939e] dark:hover:bg-[#10222f]"}`}
            onClick={() => setViewMode("day")}
            data-testid="button-view-day"
          >
            {en ? "Day" : "يوم"}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button className="quiet-button" onClick={goPrev} aria-label={en ? "Previous" : "السابق"} data-testid="button-calendar-prev">
            <ChevronRight size={16} />
          </button>
          <button className="quiet-button font-bold" onClick={goToday} data-testid="button-calendar-today">
            {en ? "Today" : "اليوم"}
          </button>
          <button className="quiet-button" onClick={goNext} aria-label={en ? "Next" : "التالي"} data-testid="button-calendar-next">
            <ChevronLeft size={16} />
          </button>
        </div>

        <span className="text-sm font-bold text-[#28495b] dark:text-[#dbe7ee]">{headerTitle}</span>
      </div>

      {/* Loading skeleton */}
      {query.isLoading && (
        <div className="grid gap-4 sm:grid-cols-7">
          {Array.from({ length: 7 }, (_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      )}

      {/* Error */}
      {query.isError && !query.isLoading && (
        <div className="surface flex flex-col items-center justify-center py-16 text-center">
          <CalendarDays size={32} className="mb-3 text-[#8a9ba4] dark:text-[#7e939e]" />
          <p className="text-sm font-bold text-[#527080] dark:text-[#a8bfc9]">{en ? "Could not load appointments" : "تعذر تحميل المواعيد"}</p>
          <button className="primary-button mt-4" onClick={() => query.refetch()}>
            <RefreshCw size={15} /> {en ? "Retry" : "إعادة المحاولة"}
          </button>
        </div>
      )}

      {/* Week view */}
      {!query.isLoading && !query.isError && viewMode === "week" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-7 animate-rise">
          {weekDays.map((day) => {
            const key = dayKey(day);
            const dayAppts = (appointmentsByDay.get(key) ?? []).sort((a, b) =>
              (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? "")
            );
            const isToday = key === todayKey;
            return (
              <div
                key={key}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("ring-2", "ring-primary", "bg-primary/5");
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove("ring-2", "ring-primary", "bg-primary/5");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("ring-2", "ring-primary", "bg-primary/5");
                  const apptId = e.dataTransfer.getData("text/plain");
                  const appt = appointments.find((item) => item.id === apptId);
                  if (!apptId || !appt?.scheduledAt) return;
                  const original = new Date(appt.scheduledAt);
                  if (Number.isNaN(original.getTime())) return;
                  if (dayKey(original) === dayKey(day)) return; // نفس اليوم: لا يوجد تغيير
                  // نحافظ على وقت الموعد الأصلي ونغيّر اليوم فقط
                  const next = new Date(day);
                  next.setHours(original.getHours(), original.getMinutes(), 0, 0);
                  rescheduleMutation.mutate({ id: appt.id, scheduledAt: next.toISOString() });
                }}
                className={`flex flex-col rounded-2xl border p-3 transition-all ${isToday ? "border-[#9fc0ca] bg-[#f0f7f9] dark:border-[#1e5a6d] dark:bg-[#0e2030]" : "border-[#e4edf1] bg-white dark:border-[#1e3a4d] dark:bg-[#122434]"}`}
                data-testid={`calendar-day-${key}`}
              >
                {/* Day header */}
                <div className="mb-3 text-center">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? "text-[#22617d] dark:text-[#8cc3dd]" : "text-[#8a9ba4] dark:text-[#7e939e]"}`}>
                    {formatDateShort(day, en)}
                  </p>
                  {isToday && (
                    <span className="mt-1 inline-block rounded-full bg-[#22617d] px-2 py-0.5 text-[9px] font-bold text-white dark:bg-[#8cc3dd] dark:text-[#0b1824]">
                      {en ? "Today" : "اليوم"}
                    </span>
                  )}
                </div>

                {/* Appointments */}
                <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: "280px" }}>
                  {dayAppts.length === 0 && (
                    <p className="py-6 text-center text-[10px] text-[#a8bfc9] dark:text-[#4a6475]">
                      {en ? "No appointments" : "لا مواعيد"}
                    </p>
                  )}
                  {dayAppts.map((appt) => (
                    <div
                      key={appt.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", appt.id || "");
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <Link
                        href={`/appointments/${appt.id}`}
                        className={`block rounded-xl border p-2 transition hover:opacity-80 ${statusColors(appt.status)}`}
                        data-testid={`calendar-appt-${appt.id}`}
                      >
                        <div className="flex items-center gap-1">
                          <Clock3 size={10} className="shrink-0 opacity-70" />
                          <span className="text-[10px] font-bold">{formatTime(appt.scheduledAt)}</span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] font-bold leading-tight">
                          {appt.name}
                        </p>
                        <p className="truncate text-[9px] opacity-75">
                          {statusLabel(appt.status, en)}
                        </p>
                      </Link>
                    </div>
                  ))}
                </div>

                {/* Quick Add button */}
                <button
                  type="button"
                  onClick={() => setBookingOpen(true)}
                  className="mt-2 block w-full rounded-lg border border-dashed border-[#cfe2e8] py-1 text-center text-[9px] font-bold text-[#8a9ba4] transition hover:border-[#9fc0ca] hover:text-[#22617d] dark:border-[#1e3a4d] dark:text-[#4a6475] dark:hover:border-[#1e5a6d] dark:hover:text-[#8cc3dd]"
                  data-testid={`calendar-add-appt-${key}`}
                >
                  + {en ? "Book" : "حجز"}
                </button>
              </div>
            );
          })}
        </div>
      )}


      {/* Day view */}
      {!query.isLoading && !query.isError && viewMode === "day" && (() => {
        const key = dayKey(baseDate);
        const dayAppts = (appointmentsByDay.get(key) ?? []).sort((a, b) =>
          (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? "")
        );
        const isToday = key === todayKey;
        return (
          <div className="surface animate-rise p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className={`grid size-12 place-items-center rounded-xl text-lg font-extrabold ${isToday ? "bg-[#22617d] text-white dark:bg-[#8cc3dd] dark:text-[#0b1824]" : "bg-[#dcecf5] text-[#22617d] dark:bg-[#143242] dark:text-[#8cc3dd]"}`}>
                {baseDate.getDate()}
              </span>
              <div>
                <p className="text-xs font-bold text-[#66808e] dark:text-[#7e939e]">{formatMonthYear(baseDate, en)}</p>
                <h2 className="text-base font-extrabold dark:text-[#e2ecf1]">
                  {dayAppts.length} {en ? "appointments" : "موعد"}
                  {isToday && <span className="mr-2 inline-flex items-center rounded-full bg-[#d9f0e8] px-2 py-0.5 text-[10px] font-bold text-[#176b58] dark:bg-[#123528] dark:text-[#7fd0b4]">{en ? "Today" : "اليوم"}</span>}
                </h2>
              </div>
            </div>

            {dayAppts.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center">
                <CalendarDays size={32} className="mb-3 text-[#a8bfc9] dark:text-[#4a6475]" />
                <p className="text-sm font-bold text-[#527080] dark:text-[#a8bfc9]">{en ? "No appointments this day" : "لا توجد مواعيد في هذا اليوم"}</p>
                <button onClick={() => setBookingOpen(true)} className="primary-button mt-4">
                  <Plus size={15} /> {en ? "Book appointment" : "حجز موعد"}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#edf1f3] dark:divide-[#1e3a4d]">
                {dayAppts.map((appt) => (
                  <Link
                    key={appt.id}
                    href={`/appointments/${appt.id}`}
                    className="flex items-center gap-4 py-3.5 transition hover:bg-[#f5f9fa] dark:hover:bg-[#10222f]"
                    data-testid={`day-appt-${appt.id}`}
                  >
                    <span className="w-14 shrink-0 text-right text-xs font-bold text-[#4f7183] dark:text-[#a8bfc9]">
                      {formatTime(appt.scheduledAt)}
                    </span>
                    <span className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${statusColors(appt.status)}`}>
                      {statusLabel(appt.status, en)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold dark:text-[#e2ecf1]">{appt.name}</p>
                      {appt.serviceName && <p className="mt-0.5 truncate text-[10px] text-[#8496a0] dark:text-[#7e939e]">{appt.serviceName}</p>}
                    </div>
                    <ChevronLeft size={15} className="shrink-0 text-[#a0adb3] dark:text-[#4a6475]" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Quick Booking Modal */}
      {bookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1824]/50 p-4" onClick={() => setBookingOpen(false)}>
          <form className="surface w-full max-w-lg space-y-4 rounded-2xl p-6" dir="rtl" onClick={(e) => e.stopPropagation()} onSubmit={handleBookSubmit}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#3c7e93] dark:text-[#a8bfc9]">{en ? "Quick Booking" : "حجز فوري"}</p>
                <h2 className="mt-1 text-lg font-extrabold text-[#18374d] dark:text-[#e2ecf1]">{en ? "Book New Appointment" : "حجز موعد جديد"}</h2>
              </div>
              <button type="button" onClick={() => setBookingOpen(false)} aria-label={en ? "Close" : "إغلاق"}><X size={18} /></button>
            </div>

            <label className="block text-xs font-bold text-[#527080] dark:text-[#a8bfc9]">
              {en ? "Patient *" : "المريض *"}
              <select
                required
                value={bookingForm.patientId}
                onChange={(e) => setBookingForm({ ...bookingForm, patientId: e.target.value, slotId: "" })}
                className="input-field mt-1.5 w-full"
                data-testid="select-calendar-patient"
              >
                <option value="">{en ? "Select a patient from the clinic" : "اختر مريضاً من العيادة"}</option>
                {options?.patients.map((p) => (
                  <option value={p.id} key={p.id}>{p.name}</option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-bold text-[#527080] dark:text-[#a8bfc9]">
              {en ? "Available slot *" : "الموعد المتاح *"}
              <select
                required
                value={bookingForm.slotId}
                onChange={(e) => setBookingForm({ ...bookingForm, slotId: e.target.value })}
                className="input-field mt-1.5 w-full"
                data-testid="select-calendar-slot"
              >
                <option value="">{en ? "Select an available slot" : "اختر موعداً متاحاً"}</option>
                {options?.slots.map((s) => (
                  <option value={s.id} key={s.id}>
                    {formatTime(s.startTime)} · {doctorName(s.doctorId)} · {serviceName(s.serviceId)}
                  </option>
                ))}
              </select>
            </label>

            {options && options.slots.length === 0 && (
              <p className="rounded-xl bg-[#fffaf0] p-3 text-xs leading-6 text-[#9a6513] dark:bg-[#3a2c14] dark:text-[#e0b46a]">
                {en ? "No available slots currently configured in this clinic." : "لا توجد مواعيد متاحة مسجلة حالياً في هذه العيادة."}
              </p>
            )}

            <textarea
              value={bookingForm.notes}
              onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
              placeholder={en ? "Optional notes for the appointment..." : "ملاحظات إضافية للموعد..."}
              className="input-field min-h-20 w-full"
              data-testid="input-calendar-booking-notes"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" className="quiet-button" onClick={() => setBookingOpen(false)}>
                {en ? "Cancel" : "إلغاء"}
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={bookMutation.isPending || !options?.slots.length}
                data-testid="button-submit-calendar-booking"
              >
                {bookMutation.isPending ? (en ? "Booking..." : "جارٍ الحجز...") : (en ? "Confirm Booking" : "تأكيد الحجز")}
              </button>
            </div>
          </form>
        </div>
      )}
    </WorkspacePage>
  );
}

