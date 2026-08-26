import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertCircle, ArrowUpLeft, CalendarPlus, Check, ChevronLeft, Clock3, FileText, Inbox, MoreHorizontal, PhoneCall, Plus, RefreshCw, Sparkles, UsersRound } from "lucide-react";
import { Link } from "wouter";
import { getGetDashboardSummaryQueryKey, useGetDashboardSummary } from "@workspace/api-client-react";
import { usePreferences } from "@/lib/preferences";

 type Session = { user: { fullName: string }; clinic: { name: string; city: string } };
 type Appointment = { id: string; name: string; scheduledAt: string | null; status: string; serviceName?: string | null; doctorName?: string | null };

const statusLabels: Record<string, string> = {
  scheduled: "مجدول",
  confirmed: "مؤكد",
  checked_in: "وصل",
  completed: "مكتمل",
  cancelled: "ملغي",
  no_show: "لم يحضر",
  pending: "بانتظار التأكيد",
};

const clinicTimeZone = "Asia/Riyadh";

function formatTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit", timeZone: clinicTimeZone }).format(date);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "short", timeZone: clinicTimeZone }).format(date);
}

function statusTone(status: string) {
  if (status === "checked_in" || status === "completed") return "bg-[#d9f0e8] text-[#176b58]";
  if (status === "pending" || status === "scheduled") return "bg-[#fff0d8] text-[#9a6513]";
  if (status === "cancelled" || status === "no_show") return "bg-[#f8dfdc] text-[#a64036]";
  return "bg-[#dcecf5] text-[#22617d]";
}

function StatCard({ label, value, meta, accent, icon, index }: { label: string; value: string; meta: string; accent: string; icon: React.ReactNode; index: number }) {
  return <article className="surface stat-card animate-rise p-5" style={{ animationDelay: `${index * 70}ms` }}>
    <div className="mb-5 flex items-start justify-between"><span className={`grid size-10 place-items-center rounded-xl ${accent}`}>{icon}</span><MoreHorizontal size={17} className="text-[#90a1aa]" /></div>
    <p className="text-xs font-bold text-[#66808e]">{label}</p>
    <div className="mt-1 flex items-baseline gap-2"><strong className="text-3xl tracking-tight text-[#18374d]">{value}</strong><span className="text-[11px] font-bold text-[#3d8a72]">{meta}</span></div>
  </article>;
}

export default function LiveDashboard({ session }: { session: Session }) {
  const { language, selectedBranchId } = usePreferences();
  const summaryQuery = useGetDashboardSummary({ query: { retry: 0, staleTime: 30_000, gcTime: 5 * 60_000, queryKey: getGetDashboardSummaryQueryKey() } });
  const appointmentsQuery = useQuery({
    queryKey: ["dashboard", "appointments", selectedBranchId],
    queryFn: async ({ signal }) => {
      const suffix = selectedBranchId === "all" ? "" : `?branchId=${encodeURIComponent(selectedBranchId)}`;
      const response = await fetch(`/api/appointments${suffix}`, { credentials: "include", signal });
      if (!response.ok) throw new Error("appointments");
      const data: unknown = await response.json();
      return Array.isArray(data) ? data as Appointment[] : [];
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 0,
  });
  const appointments = appointmentsQuery.data ?? [];
  const appointmentsLoading = appointmentsQuery.isLoading;
  const appointmentsError = appointmentsQuery.isError;
  const summary = summaryQuery.data;

  const firstName = session.user.fullName.split(" ")[0] || session.user.fullName;
  const waitingCount = useMemo(() => appointments.filter((appointment) => ["scheduled", "pending"].includes(appointment.status)).length, [appointments]);
  const attendedCount = useMemo(() => appointments.filter((appointment) => ["checked_in", "completed"].includes(appointment.status)).length, [appointments]);
  const attendanceRate = appointments.length ? `${Math.round((attendedCount / appointments.length) * 100)}٪` : "—";
  const teamCount = summary?.stats.find((stat) => stat.label === (language === "ar" ? "أعضاء الفريق" : "Team members"))?.value ?? "—";
  const patientCount = summary?.stats.find((stat) => stat.label === "المرضى")?.value ?? "—";
  const visibleAppointments = appointments.slice(0, 5);
  const todayLabel = new Intl.DateTimeFormat("ar-SA", { weekday: "long", day: "numeric", month: "long", timeZone: clinicTimeZone }).format(new Date());
  const busy = summaryQuery.isLoading || appointmentsLoading;
  const failed = summaryQuery.isError || appointmentsError;

  return <div className="main-content min-w-0 flex-1" dir="rtl">
    <header className="flex items-center justify-between border-b border-[#dbe5ea] bg-[#f6f9fa]/90 px-5 py-4 backdrop-blur md:px-9"><div><p className="text-xs font-semibold text-[#78909c]">{todayLabel}</p><h1 className="ar mt-1 text-xl font-bold text-[#15364b]">صباح الخير، {firstName}</h1></div><div className="flex items-center gap-2"><button className="quiet-button hidden sm:inline-flex" onClick={() => { summaryQuery.refetch(); appointmentsQuery.refetch(); }} data-testid="button-refresh-dashboard"><RefreshCw size={17} /> تحديث</button><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c9dce3] text-sm font-bold text-[#1c4b61]">{firstName.slice(0, 1)}</div></div></header>
    <div className="flex w-full flex-col gap-7 p-5 md:p-8">
      <section className="animate-rise relative overflow-hidden rounded-2xl bg-[#0c2b41] px-6 py-7 text-[#edf7f8] shadow-[0_16px_32px_rgba(17,55,74,.12)] md:px-8 md:py-8"><div className="relative z-10 max-w-2xl"><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#9ec8d3]"><span className="status-dot" /> صورة اليوم / التشغيل</div><h2 className="ar text-2xl font-bold leading-relaxed md:text-3xl">كل ما يحتاج انتباهك، في مكان واحد.</h2><p className="ar mt-2 text-sm leading-7 text-[#aac1ca]">{session.clinic.name}{session.clinic.city && session.clinic.city !== "—" ? ` · ${session.clinic.city}` : ""} — رؤية واضحة لقرارات يومك.</p></div><div className="absolute -left-8 -top-20 h-64 w-64 rounded-full border border-[#80b6c7]/20" /><div className="absolute -left-16 -top-28 h-80 w-80 rounded-full border border-[#80b6c7]/10" /><div className="absolute bottom-0 left-12 hidden h-20 w-20 rotate-45 border border-[#80b6c7]/20 md:block" /></section>
      {busy ? <div className="space-y-6" data-testid="state-dashboard-loading"><div className="skeleton h-36 w-full" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div className="skeleton h-36" key={item} />)}</div><div className="skeleton h-72 w-full" /></div> : failed ? <div className="surface flex min-h-[360px] flex-col items-center justify-center p-10 text-center" data-testid="state-dashboard-error"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f9e9e7] text-[#ad514a]"><AlertCircle size={21} /></div><h2 className="text-lg font-bold text-[#18374d]">تعذّر تحميل بيانات التشغيل</h2><p className="mt-1 max-w-sm text-sm leading-6 text-[#718591]">البيانات لم تُعرض من نسخة ثابتة. أعد المحاولة لجلبها من Supabase عبر الخادم.</p><button className="primary-button mt-5" onClick={() => { summaryQuery.refetch(); appointmentsQuery.refetch(); }} data-testid="button-retry-dashboard"><RefreshCw size={16} /> إعادة المحاولة</button></div> : <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard index={0} label="مواعيد العيادة" value={String(appointments.length)} meta="من Supabase" accent="bg-[#d9f0e8] text-[#176b58]" icon={<CalendarPlus size={19} />} /><StatCard index={1} label="بانتظار التأكيد" value={String(waitingCount)} meta="الآن" accent="bg-[#fff0d8] text-[#9a6513]" icon={<Clock3 size={19} />} /><StatCard index={2} label="نسبة الحضور" value={attendanceRate} meta={appointments.length ? `${attendedCount} حضروا` : "لا توجد مواعيد"} accent="bg-[#dcecf5] text-[#22617d]" icon={<Check size={19} />} /><StatCard index={3} label="المرضى النشطون" value={patientCount} meta={`${teamCount} أعضاء فريق`} accent="bg-[#e8e1f4] text-[#65518b]" icon={<UsersRound size={19} />} /></section>
        <section className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]"><div className="surface animate-rise delay-2 p-0"><div className="flex items-center justify-between border-b border-[#edf1f3] px-5 py-4"><div><h2 className="font-bold text-[#18374d]">جدول اليوم</h2><p className="mt-1 text-xs text-[#8496a0]">مواعيد مرتبطة بعيادة {session.clinic.name}</p></div><Link href="/appointments" className="flex items-center gap-1 text-[11px] font-bold text-[#3c7e93]" data-testid="link-dashboard-appointments">عرض الكل <ChevronLeft size={14} /></Link></div>{visibleAppointments.length ? <div className="divide-y divide-[#edf1f3]">{visibleAppointments.map((appointment, index) => <button key={appointment.id} className="animate-sweep flex w-full items-center gap-3 px-5 py-3.5 text-right transition hover:bg-[#f5f9fa]" data-testid={`dashboard-appointment-${appointment.id}`}><span className="w-[48px] text-[12px] font-bold text-[#718591]">{formatTime(appointment.scheduledAt)}</span><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#dcecf5] text-[11px] font-bold text-[#22617d]">{appointment.name.slice(0, 2)}</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-[#28495b]">{appointment.name}</strong><span className="block truncate text-[10px] text-[#8496a0]">{appointment.serviceName || "خدمة العيادة"}{appointment.doctorName ? ` · ${appointment.doctorName}` : ""}</span></span><span className={`hidden rounded-md px-2 py-1 text-[10px] font-bold sm:block ${statusTone(appointment.status)}`}>{statusLabels[appointment.status] || appointment.status}</span><span className="text-[10px] text-[#a0adb3]">{formatDate(appointment.scheduledAt)}</span><ChevronLeft size={15} className="text-[#a0adb3]" /></button>)}</div> : <div className="flex flex-col items-center px-5 py-12 text-center" data-testid="state-empty-dashboard-appointments"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#edf4f5] text-[#789daa]"><FileText size={20} /></div><p className="text-sm font-bold text-[#527080]">لا توجد مواعيد مرتبطة بالعيادة</p><p className="mt-1 text-xs text-[#95a4ab]">ستظهر هنا المواعيد التي تُحفظ من قسم المواعيد.</p></div>}<div className="flex items-center justify-center border-t border-[#edf1f3] py-3"><Link href="/appointments" className="text-[11px] font-bold text-[#7d929c]" data-testid="link-dashboard-open-appointments">فتح قسم المواعيد</Link></div></div><div className="surface animate-rise delay-3 p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="font-bold text-[#18374d]">حالة التشغيل</h2><p className="mt-1 text-xs text-[#8496a0]">مؤشرات مباشرة من بيانات العيادة</p></div><Sparkles size={19} className="text-[#77a5b2]" /></div><div className="space-y-4"><div className="rounded-xl bg-[#f1f7f7] p-4"><div className="flex items-center justify-between text-xs"><span className="font-bold text-[#3c6f79]">المواعيد المحملة</span><span className="font-extrabold text-[#3d8a72]">{appointments.length}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#d7e8e7]"><div className="h-full rounded-full bg-[#66a898] transition-all" style={{ width: `${Math.min(100, appointments.length ? Math.max(8, appointments.length * 12) : 0)}%` }} /></div><p className="mt-2 text-[.68rem] text-[#80969a]">النتيجة مفلترة حسب عيادة الجلسة</p></div><div className="flex items-start gap-3 border-b border-[#edf1f3] pb-4"><Inbox size={17} className="mt-0.5 text-[#ad8248]" /><div><p className="text-xs font-bold text-[#355467]">صندوق الوارد</p><p className="mt-1 text-xs leading-5 text-[#8b9aa2]">افتح المحادثات المرتبطة بالعيادة وتابع الرسائل من مكان واحد.</p><Link href="/inbox" className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-[#3c7e93]" data-testid="link-dashboard-inbox">فتح الصندوق <ArrowUpLeft size={13} /></Link></div></div><div className="flex items-start gap-3"><PhoneCall size={17} className="mt-0.5 text-[#6f69a0]" /><div><p className="text-xs font-bold text-[#355467]">الفريق والمرضى</p><p className="mt-1 text-xs leading-5 text-[#8b9aa2]">{patientCount} مريضًا نشطًا ضمن مساحة العمل الحالية.</p></div></div></div></div></section>
      </>}
    </div>
  </div>;
}
