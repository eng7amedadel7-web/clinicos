import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, CalendarDays, CheckCircle2, Clock3, Inbox, MessageSquare, RefreshCw, UsersRound, Wifi, XCircle } from "lucide-react";
import { Link } from "wouter";
import { getOperationsSummary, type OperationsSummary } from "@/lib/operations-api";

type SessionView = { user: { fullName: string }; clinic: { name: string; city: string } };

type StatCardProps = { label: string; value: number | null; helper: string; tone: "blue" | "green" | "amber" | "coral" | "violet"; icon: typeof CalendarDays };

const palette: Record<StatCardProps["tone"], { text: string; soft: string }> = {
  blue: { text: "#347b98", soft: "#dcecf5" },
  green: { text: "#3d8a72", soft: "#d9f0e8" },
  amber: { text: "#a6773a", soft: "#fff0d8" },
  coral: { text: "#a64036", soft: "#f8dfdc" },
  violet: { text: "#7568a0", soft: "#e8e1f4" },
};

function numberLabel(value: number | null) {
  return value === null ? "—" : new Intl.NumberFormat("ar-EG").format(value);
}

function dateLabel(value: unknown) {
  if (typeof value !== "string" || !value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

function textValue(value: unknown, fallback = "—") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function StatCard({ label, value, helper, tone, icon: Icon }: StatCardProps) {
  const colors = palette[tone];
  return <article className="surface p-5" data-testid={`operations-stat-${label}`}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-bold text-[#66808e]">{label}</p>
        <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#18374d]">{numberLabel(value)}</p>
      </div>
      <span className="grid size-10 place-items-center rounded-xl" style={{ backgroundColor: colors.soft, color: colors.text }}><Icon size={18} /></span>
    </div>
    <p className="mt-3 text-[11px] text-[#8a9ba4]">{helper}</p>
  </article>;
}

function StatusGrid({ status }: { status: OperationsSummary["systemStatus"] }) {
  const labels: Record<string, string> = {
    appointments: "المواعيد",
    patients: "المرضى",
    conversations: "المحادثات",
    followUps: "المتابعات",
    noShows: "عدم الحضور",
    waitlist: "قائمة الانتظار",
    channels: "القنوات",
  };
  const entries = Object.entries(status);
  return <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" data-testid="operations-system-status">
    {entries.map(([key, state]) => <div key={key} className="flex items-center justify-between rounded-xl border border-[#e5edf0] bg-[#f8fbfc] px-3 py-2.5"><span className="text-[11px] font-bold text-[#527080]">{labels[key] ?? key}</span>{state === "ready" ? <span className="flex items-center gap-1 text-[10px] font-bold text-[#3d8a72]"><CheckCircle2 size={13} /> متاح</span> : <span className="flex items-center gap-1 text-[10px] font-bold text-[#a6773a]"><XCircle size={13} /> غير متاح</span>}</div>)}
  </div>;
}

export default function OperationsDashboard({ session }: { session: SessionView }) {
  const summaryQuery = useQuery({ queryKey: ["operations", "summary"], queryFn: ({ signal }) => getOperationsSummary(signal), staleTime: 30_000, refetchInterval: 60_000, refetchIntervalInBackground: false });
  const summary = summaryQuery.data;
  const firstName = session.user.fullName.split(" ")[0] || session.user.fullName;
  return <div className="main-content min-w-0 flex-1" dir="rtl">
    <header className="flex items-center justify-between border-b border-[#dbe5ea] bg-[#f6f9fa]/90 px-5 py-4 backdrop-blur md:px-9">
      <div><p className="text-xs font-semibold text-[#78909c]">{session.clinic.name}</p><h1 className="ar mt-1 text-xl font-bold text-[#15364b]">صباح الخير، {firstName}</h1></div>
      <div className="flex items-center gap-2"><button className="quiet-button" onClick={() => summaryQuery.refetch()} disabled={summaryQuery.isFetching} data-testid="button-refresh-operations"><RefreshCw size={16} className={summaryQuery.isFetching ? "animate-spin" : ""} /><span className="hidden text-xs sm:inline">تحديث</span></button><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c9dce3] text-sm font-bold text-[#1c4b61]" data-testid="avatar-user">{firstName.slice(0, 1)}</div></div>
    </header>
    <div className="mx-auto max-w-[1450px] space-y-6 p-5 md:p-9">
      <section className="relative overflow-hidden rounded-2xl bg-[#0c2b41] px-6 py-7 text-[#edf7f8] shadow-[0_16px_32px_rgba(17,55,74,.12)] md:px-8 md:py-8"><div className="relative z-10 max-w-2xl"><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#9ec8d3]"><span className="status-dot" /> بيانات تشغيلية حقيقية</div><h2 className="ar text-2xl font-bold leading-relaxed md:text-3xl">الصورة الحالية لعيادتك، بدون أرقام تجريبية.</h2><p className="ar mt-2 text-sm leading-7 text-[#aac1ca]">تتحدث المؤشرات في الخلفية دون إعادة ضبط الشاشة أو فقدان سياق الموظف.</p></div><div className="absolute -left-8 -top-20 h-64 w-64 rounded-full border border-[#80b6c7]/20" /><div className="absolute -left-16 -top-28 h-80 w-80 rounded-full border border-[#80b6c7]/10" /></section>
      {summaryQuery.isLoading ? <div className="space-y-5" data-testid="state-operations-loading"><div className="skeleton h-32 w-full" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="skeleton h-36" />)}</div></div> : summaryQuery.isError ? <div className="surface flex min-h-[300px] flex-col items-center justify-center p-10 text-center" data-testid="state-operations-error"><AlertTriangle className="mb-3 text-[#a64036]" /><h2 className="text-lg font-bold text-[#18374d]">تعذر تحميل مؤشرات التشغيل</h2><p className="mt-2 max-w-md text-sm leading-6 text-[#718591]">لم نعرض بيانات بديلة حتى لا تختلط الأرقام الحقيقية بالبيانات التجريبية.</p><button className="primary-button mt-5" onClick={() => summaryQuery.refetch()}><RefreshCw size={16} /> إعادة المحاولة</button></div> : summary ? <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="مواعيد اليوم" value={summary.stats.appointmentsToday} helper="من سجل المواعيد في العيادة" tone="blue" icon={CalendarDays} />
          <StatCard label="تحتاج موظفاً" value={summary.stats.conversationsNeedingStaff} helper="محادثات بلا تعيين أو handoff" tone="violet" icon={Inbox} />
          <StatCard label="متابعات مفتوحة" value={summary.stats.openFollowUps} helper="حالات follow-up غير المغلقة" tone="green" icon={MessageSquare} />
          <StatCard label="حالات عدم الحضور" value={summary.stats.openNoShows} helper="حالات recovery غير المغلقة" tone="coral" icon={AlertTriangle} />
          <StatCard label="في قائمة الانتظار" value={summary.stats.activeWaitlist} helper="طلبات نشطة قابلة للمعالجة" tone="amber" icon={Clock3} />
        </section>
        <section className="surface p-5"><div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-[#7892b1]">SYSTEM STATUS</p><h2 className="mt-1 text-base font-extrabold text-[#18374d]">مصادر البيانات</h2></div><Wifi size={18} className="text-[#4c8b9e]" /></div><StatusGrid status={summary.systemStatus} /></section>
        <section className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
          <div className="surface p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-extrabold text-[#18374d]">مواعيد اليوم</h2><p className="mt-1 text-xs text-[#8496a0]">أحدث البيانات المرتبطة بعيادتك</p></div><Link href="/appointments" className="text-xs font-bold text-[#3c7e93]">فتح المواعيد ←</Link></div>{summary.todayAppointments.length ? <div className="space-y-2">{summary.todayAppointments.map((item) => <div key={String(item.id)} className="flex items-center gap-3 rounded-xl border border-[#edf1f3] bg-[#fbfdfd] p-3"><span className="grid size-9 place-items-center rounded-lg bg-[#dcecf5] text-[#22617d]"><CalendarDays size={15} /></span><div className="min-w-0 flex-1"><strong className="block truncate text-xs text-[#28495b]">{textValue(item.patientName, "مريض بدون اسم")}</strong><span className="mt-1 block text-[10px] text-[#8496a0]">{dateLabel(item.scheduled_at)} · {textValue(item.appointment_status, "غير محدد")}</span></div><span className="text-[10px] text-[#8496a0]">{textValue(item.booking_number, "—")}</span></div>)}</div> : <div className="py-10 text-center text-sm text-[#8496a0]">لا توجد مواعيد مسجلة اليوم.</div>}</div>
          <div className="surface p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-extrabold text-[#18374d]">أحدث المحادثات</h2><p className="mt-1 text-xs text-[#8496a0]">افتح Inbox لمتابعة الردود</p></div><Link href="/inbox" className="text-xs font-bold text-[#3c7e93]">فتح Inbox ←</Link></div>{summary.recentConversations.length ? <div className="space-y-2">{summary.recentConversations.map((item) => <Link href={`/inbox?conversationId=${encodeURIComponent(String(item.id ?? ""))}`} key={String(item.id)} className="flex items-center gap-3 rounded-xl border border-[#edf1f3] p-3 transition hover:bg-[#f7fbfc]"><span className="grid size-9 place-items-center rounded-full bg-[#e8e1f4] text-[#65518b]"><MessageSquare size={15} /></span><div className="min-w-0 flex-1"><strong className="block truncate text-xs text-[#28495b]">{textValue(item.patientName, "محادثة بدون اسم")}</strong><span className="mt-1 block truncate text-[10px] text-[#8496a0]">{textValue(item.last_patient_message, "لا توجد رسالة أخيرة")} · {dateLabel(item.last_activity_at)}</span></div>{item.is_handoff ? <span className="rounded-md bg-[#f8dfdc] px-2 py-1 text-[9px] font-bold text-[#a64036]">handoff</span> : null}</Link>)}</div> : <div className="py-10 text-center text-sm text-[#8496a0]">لا توجد محادثات متاحة.</div>}</div>
        </section>
        <section className="grid gap-6 lg:grid-cols-3"><div className="surface p-5"><h2 className="text-base font-extrabold text-[#18374d]">التعافي</h2><p className="mt-1 text-xs text-[#8496a0]">حالات تحتاج قرار الفريق</p><div className="mt-4 space-y-2"><div className="flex items-center justify-between rounded-xl bg-[#f8fbfc] p-3"><span className="flex items-center gap-2 text-xs font-bold text-[#527080]"><UsersRound size={15} /> المتابعات</span><strong className="text-lg text-[#3d8a72]">{numberLabel(summary.stats.openFollowUps)}</strong></div><div className="flex items-center justify-between rounded-xl bg-[#f8fbfc] p-3"><span className="flex items-center gap-2 text-xs font-bold text-[#527080]"><AlertTriangle size={15} /> عدم الحضور</span><strong className="text-lg text-[#a64036]">{numberLabel(summary.stats.openNoShows)}</strong></div></div></div><div className="surface p-5"><h2 className="text-base font-extrabold text-[#18374d]">قائمة الانتظار</h2><p className="mt-1 text-xs text-[#8496a0]">الأولوية الأعلى أولاً</p>{summary.waitlist.length ? <div className="mt-4 space-y-2">{summary.waitlist.slice(0, 3).map((item) => <div key={String(item.id)} className="flex items-center justify-between rounded-xl bg-[#fffaf0] p-3"><span className="truncate text-xs font-bold text-[#527080]">{textValue(item.patientName, "مريض بدون اسم")}</span><span className="text-[10px] font-bold text-[#a6773a]">أولوية {numberLabel(typeof item.priority === "number" ? item.priority : null)}</span></div>)}</div> : <div className="mt-5 text-sm text-[#8496a0]">لا توجد طلبات نشطة.</div>}</div><div className="surface p-5"><h2 className="text-base font-extrabold text-[#18374d]">اختصارات التشغيل</h2><div className="mt-4 grid gap-2"><Link href="/patients" className="flex items-center gap-2 rounded-xl border border-[#edf1f3] p-3 text-xs font-bold text-[#527080] hover:bg-[#f8fbfc]"><UsersRound size={15} /> دليل المرضى</Link><Link href="/appointments" className="flex items-center gap-2 rounded-xl border border-[#edf1f3] p-3 text-xs font-bold text-[#527080] hover:bg-[#f8fbfc]"><CalendarDays size={15} /> إدارة المواعيد</Link><Link href="/inbox" className="flex items-center gap-2 rounded-xl border border-[#edf1f3] p-3 text-xs font-bold text-[#527080] hover:bg-[#f8fbfc]"><Activity size={15} /> متابعة Inbox</Link></div></div></section>
        <p className="text-left text-[10px] text-[#9aa9af]">آخر مزامنة: {dateLabel(summary.generatedAt)}</p>
      </> : <div className="surface p-10 text-center text-sm text-[#8496a0]">لا توجد بيانات متاحة لهذه العيادة.</div>}
    </div>
  </div>;
}
