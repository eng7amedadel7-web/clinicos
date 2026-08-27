import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  ArrowUpLeft,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  CreditCard,
  Inbox,
  MessageSquareText,
  PhoneCall,
  RefreshCw,
  Sparkles,
  UsersRound,
  XCircle,
} from "lucide-react";
import { Link } from "wouter";
import { usePreferences } from "@/lib/preferences";
import { getOperationsSummary } from "@/lib/operations-api";

type Session = { user: { fullName: string }; clinic: { name: string; city: string } };

const clinicTimeZone = "Asia/Riyadh";

function statusLabels(en: boolean): Record<string, string> {
  return en
    ? { scheduled: "Scheduled", confirmed: "Confirmed", checked_in: "Checked in", completed: "Completed", cancelled: "Cancelled", no_show: "No-show", pending: "Pending confirmation" }
    : { scheduled: "مجدول", confirmed: "مؤكد", checked_in: "وصل", completed: "مكتمل", cancelled: "ملغي", no_show: "لم يحضر", pending: "بانتظار التأكيد" };
}

function appointmentStatusTone(status: string | undefined) {
  if (status === "checked_in" || status === "completed") return "bg-[#d9f0e8] text-[#176b58] dark:bg-[#123528] dark:text-[#7fd0b4]";
  if (status === "cancelled" || status === "no_show") return "bg-[#f8dfdc] text-[#a64036] dark:bg-[#3d1f1b] dark:text-[#eb9a90]";
  if (status === "pending" || status === "scheduled") return "bg-[#fff0d8] text-[#9a6513] dark:bg-[#3a2c14] dark:text-[#e0b46a]";
  return "bg-[#dcecf5] text-[#22617d] dark:bg-[#143242] dark:text-[#8cc3dd]";
}

function formatTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit", timeZone: clinicTimeZone }).format(date);
}

function formatRelativeDay(value: string | null | undefined, en: boolean) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays <= 0) return en ? "Today" : "اليوم";
  if (diffDays === 1) return en ? "Yesterday" : "أمس";
  return new Intl.DateTimeFormat(en ? "en-GB" : "ar-SA", { day: "numeric", month: "short", timeZone: clinicTimeZone }).format(date);
}

function riskLabels(en: boolean): Record<string, { label: string; tone: string }> {
  return en
    ? {
        high: { label: "High risk", tone: "bg-[#f8dfdc] text-[#a64036] dark:bg-[#3d1f1b] dark:text-[#eb9a90]" },
        medium: { label: "Medium risk", tone: "bg-[#fff0d8] text-[#9a6513] dark:bg-[#3a2c14] dark:text-[#e0b46a]" },
        low: { label: "Low risk", tone: "bg-[#dcecf5] text-[#22617d] dark:bg-[#143242] dark:text-[#8cc3dd]" },
      }
    : {
        high: { label: "خطورة عالية", tone: "bg-[#f8dfdc] text-[#a64036] dark:bg-[#3d1f1b] dark:text-[#eb9a90]" },
        medium: { label: "خطورة متوسطة", tone: "bg-[#fff0d8] text-[#9a6513] dark:bg-[#3a2c14] dark:text-[#e0b46a]" },
        low: { label: "خطورة منخفضة", tone: "bg-[#dcecf5] text-[#22617d] dark:bg-[#143242] dark:text-[#8cc3dd]" },
      };
}

function systemSourceLabels(en: boolean): Record<string, string> {
  return en
    ? { appointments: "Appointments", patients: "Patients", conversations: "Conversations", followUps: "Follow-ups", noShows: "No-shows", waitlist: "Waitlist", channels: "Channels" }
    : { appointments: "المواعيد", patients: "المرضى", conversations: "المحادثات", followUps: "المتابعات", noShows: "حالات الغياب", waitlist: "قائمة الانتظار", channels: "القنوات" };
}

const billingPhaseLabels: Record<string, { en: string; ar: string }> = {
  trialing: { en: "Trial period", ar: "فترة تجريبية" },
  active: { en: "Active", ar: "نشط" },
  past_due: { en: "Past due", ar: "متأخر السداد" },
  paused: { en: "Paused", ar: "موقوف مؤقتًا" },
  canceled: { en: "Canceled", ar: "ملغي" },
  none: { en: "Not subscribed", ar: "غير مشترك" },
};

type BillingSnapshot = {
  subscription: { plan?: string | null; billing_interval?: string | null } | null;
  lifecycle: { phase: string; statusLabel: string; periodLabel: string; effectiveEndsAt: string | null; isTrialing: boolean; needsAttention: boolean };
};

function KpiCard({ label, value, helper, accent, icon, href, index, alerts }: {
  label: string;
  value: string;
  helper: string;
  accent: string;
  icon: React.ReactNode;
  href?: string;
  index: number;
  alerts?: boolean;
}) {
  const { language } = usePreferences();
  const en = language === "en";
  const body = <>
    <div className="mb-5 flex items-start justify-between">
      <span className={`grid size-10 place-items-center rounded-xl ${accent}`}>{icon}</span>
      {alerts ? <span className="flex items-center gap-1.5 rounded-full bg-[#fff0d8] px-2.5 py-1 text-[10px] font-bold text-[#9a6513] dark:bg-[#3a2c14] dark:text-[#e0b46a]"><span className="size-1.5 animate-pulse rounded-full bg-[#d08327]" /> {en ? "Needs action" : "يحتاج إجراء"}</span> : null}
    </div>
    <p className="text-xs font-bold text-[#66808e] dark:text-[#7e939e]">{label}</p>
    <div className="mt-1 flex items-baseline gap-2"><strong className="text-3xl tracking-tight text-[#18374d] dark:text-[#e2ecf1]">{value}</strong></div>
    <p className="mt-2 text-[11px] text-[#8a9ba4] dark:text-[#7e939e]">{helper}</p>
  </>;
  return <article className="surface stat-card animate-rise p-5" style={{ animationDelay: `${index * 70}ms` }} data-testid={`card-kpi-${index}`}>
    {href ? <Link href={href} className="block" data-testid={`link-kpi-${index}`}>{body}<span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#3c7e93] dark:text-[#8cc3dd]">{en ? "Open section" : "فتح القسم"} <ChevronLeft size={13} /></span></Link> : body}
  </article>;
}

function SectionCard({ title, subtitle, action, children, delay = "" }: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  delay?: string;
}) {
  return <section className={`surface animate-rise ${delay} p-0`}>
    <div className="flex items-center justify-between border-b border-[#edf1f3] px-5 py-4 dark:border-[#1e3a4d]">
      <div><h2 className="font-bold text-[#18374d] dark:text-[#e2ecf1]">{title}</h2><p className="mt-1 text-xs text-[#8496a0] dark:text-[#7e939e]">{subtitle}</p></div>
      {action}
    </div>
    {children}
  </section>;
}

function EmptyHint({ icon, title, hint }: { icon: React.ReactNode; title: string; hint: string }) {
  return <div className="flex flex-col items-center px-5 py-12 text-center" data-testid="state-empty-section">
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#edf4f5] text-[#789daa] dark:bg-[#143242] dark:text-[#8cc3dd]">{icon}</div>
    <p className="text-sm font-bold text-[#527080] dark:text-[#a8bfc9]">{title}</p>
    <p className="mt-1 text-xs text-[#95a4ab] dark:text-[#7e939e]">{hint}</p>
  </div>;
}

export default function LiveDashboard({ session }: { session: Session }) {
  const { language } = usePreferences();
  const en = language === "en";
  const summaryQuery = useQuery({
    queryKey: ["operations", "summary", "dashboard"],
    queryFn: ({ signal }) => getOperationsSummary(signal),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 1,
  });
  const billingQuery = useQuery({
    queryKey: ["billing", "dashboard-card"],
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/billing", { credentials: "include", signal });
      if (!response.ok) throw new Error("billing unavailable");
      return (await response.json()) as BillingSnapshot;
    },
    staleTime: 60_000,
    retry: 0,
  });

  const summary = summaryQuery.data;
  const stats = summary?.stats;
  const firstName = session.user.fullName.split(" ")[0] || session.user.fullName;
  const todayLabel = new Intl.DateTimeFormat(en ? "en-GB" : "ar-SA", { weekday: "long", day: "numeric", month: "long", timeZone: clinicTimeZone }).format(new Date());
  const updatedAt = summary ? formatTime(summary.generatedAt) : null;

  const attentionConversations = useMemo(
    () => (summary?.recentConversations ?? []).filter((item) => item.is_handoff === true || !item.assigned_staff_id).slice(0, 4),
    [summary],
  );
  const followUps = summary?.recovery.followUps ?? [];
  const noShows = summary?.recovery.noShows ?? [];
  const schedule = summary?.todayAppointments ?? [];
  const queue = summary?.queue;
  const billing = billingQuery.data;
  const billingPhase = billingPhaseLabels[billing?.lifecycle.phase ?? "none"] ?? billingPhaseLabels.none;
  const billingPlan = billing?.subscription?.plan;

  const busy = summaryQuery.isLoading;
  const failed = summaryQuery.isError;

  const refresh = () => { void summaryQuery.refetch(); void billingQuery.refetch(); };

  return <div className="main-content min-w-0 flex-1" dir="rtl">
    <header className="flex items-center justify-between border-b border-[#dbe5ea] bg-[#f6f9fa]/90 px-5 py-4 backdrop-blur md:px-9 dark:border-[#1e3a4d] dark:bg-[#0b1824]/90">
      <div>
        <p className="text-xs font-semibold text-[#78909c] dark:text-[#7e939e]" data-testid="text-current-date">{todayLabel}</p>
        <h1 className="ar mt-1 text-xl font-bold text-[#15364b] dark:text-[#e2ecf1]" data-testid="heading-dashboard">{en ? `Good morning, ${firstName}` : `صباح الخير، ${firstName}`}</h1>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-full border border-[#cfe2e8] bg-white px-3 py-1.5 text-[11px] font-bold text-[#41707f] sm:inline-flex dark:border-[#1e3a4d] dark:bg-[#122434] dark:text-[#8cc3dd]" data-testid="chip-live-status">
          <span className="size-2 animate-pulse rounded-full bg-[#3d8a72]" /> {en ? "Live clinic data" : "بيانات حية"}
        </span>
        <button className="quiet-button inline-flex" onClick={refresh} disabled={summaryQuery.isFetching} data-testid="button-refresh-dashboard"><RefreshCw size={16} className={summaryQuery.isFetching ? "animate-spin" : ""} /> {en ? "Refresh" : "تحديث"}</button>
      </div>
    </header>

    <div className="flex w-full flex-col gap-6 p-5 md:p-8">
      {busy ? <div className="space-y-6" data-testid="state-dashboard-loading">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div className="skeleton h-40" key={item} />)}</div>
        <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]"><div className="skeleton h-80" /><div className="skeleton h-80" /></div>
      </div> : failed ? <div className="surface flex min-h-[360px] flex-col items-center justify-center p-10 text-center" data-testid="state-dashboard-error">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f9e9e7] text-[#ad514a] dark:bg-[#3d1f1b] dark:text-[#eb9a90]"><AlertCircle size={21} /></div>
        <h2 className="text-lg font-bold text-[#18374d] dark:text-[#e2ecf1]">{en ? "Could not load operations data" : "تعذّر تحميل بيانات التشغيل"}</h2>
        <p className="mt-1 max-w-sm text-sm leading-6 text-[#718591] dark:text-[#7e939e]">{en ? "Live data could not be loaded from the server. Try again." : "لم تُحمَّل البيانات الحية من الخادم. أعد المحاولة."}</p>
        <button className="primary-button mt-5" onClick={refresh} data-testid="button-retry-dashboard"><RefreshCw size={16} /> {en ? "Retry" : "إعادة المحاولة"}</button>
      </div> : summary && stats ? <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard index={0} label={en ? "Today's appointments" : "مواعيد اليوم"} value={String(stats.appointmentsToday ?? 0)} helper={en ? "Scheduled for today" : "مجدولة على مدار اليوم"} accent="bg-[#d9f0e8] text-[#176b58] dark:bg-[#123528] dark:text-[#7fd0b4]" icon={<CalendarPlus size={19} />} href="/appointments" />
          <KpiCard index={1} label={en ? "Conversations need staff" : "محادثات تحتاج موظفًا"} value={String(stats.conversationsNeedingStaff ?? 0)} helper={en ? "Waiting for a human reply" : "بانتظار رد من فريقك"} accent="bg-[#fff0d8] text-[#9a6513] dark:bg-[#3a2c14] dark:text-[#e0b46a]" icon={<Inbox size={19} />} href="/inbox" alerts={(stats.conversationsNeedingStaff ?? 0) > 0} />
          <KpiCard index={2} label={en ? "Open follow-ups" : "متابعات مفتوحة"} value={String(stats.openFollowUps ?? 0)} helper={en ? "Patients due for a follow-up" : "مرضى مستحقون للمتابعة"} accent="bg-[#dcecf5] text-[#22617d] dark:bg-[#143242] dark:text-[#8cc3dd]" icon={<Sparkles size={19} />} href="/follow-ups" />
          <KpiCard index={3} label={en ? "Active waitlist" : "قائمة الانتظار"} value={String(stats.activeWaitlist ?? 0)} helper={en ? "Patients seeking the nearest slot" : "مرضى يبحثون عن أقرب موعد"} accent="bg-[#e8e1f4] text-[#65518b] dark:bg-[#2a2440] dark:text-[#bcaede]" icon={<Clock3 size={19} />} href="/waitlist" />
        </section>

        <section className="grid gap-4 xl:grid-cols-2" data-testid="strip-live-queue-billing">
          <div className="surface flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl px-5 py-4">
            <span className="grid size-10 place-items-center rounded-xl bg-[#dcecf5] text-[#22617d] dark:bg-[#143242] dark:text-[#8cc3dd]"><UsersRound size={19} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#66808e] dark:text-[#7e939e]">{en ? "Live queue" : "الكيو الآن"}</p>
              {queue && (queue.nowServing !== null || queue.waiting !== null) ? (
                <p className="mt-1 text-sm font-bold text-[#18374d] dark:text-[#e2ecf1]">
                  {en ? <>Now serving <strong className="text-[#22617d] dark:text-[#8cc3dd]">#{queue.nowServing ?? "—"}</strong> · waiting <strong className="text-[#22617d] dark:text-[#8cc3dd]">{queue.waiting ?? 0}</strong></> : <>يُقدَّم الآن <strong className="text-[#22617d] dark:text-[#8cc3dd]">#{queue.nowServing ?? "—"}</strong> · في الانتظار <strong className="text-[#22617d] dark:text-[#8cc3dd]">{queue.waiting ?? 0}</strong></>}
                </p>
              ) : (
                <p className="mt-1 text-sm text-[#8a9ba4] dark:text-[#7e939e]">{en ? "No active queue yet today." : "لا يوجد كيو نشط اليوم بعد."}</p>
              )}
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-[#e6f4ee] px-2.5 py-1 text-[10px] font-bold text-[#2c7a5d] dark:bg-[#123528] dark:text-[#7fd0b4]"><span className="size-1.5 animate-pulse rounded-full bg-[#3d8a72]" /> {en ? "Live" : "مباشر"}</span>
          </div>
          <div className="surface flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl px-5 py-4">
            <span className="grid size-10 place-items-center rounded-xl bg-[#d9f0e8] text-[#176b58] dark:bg-[#123528] dark:text-[#7fd0b4]"><CreditCard size={19} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#66808e] dark:text-[#7e939e]">{en ? "Subscription" : "الاشتراك"}</p>
              <p className="mt-1 text-sm font-bold text-[#18374d] dark:text-[#e2ecf1]">
                {billingPlan ? <span className="capitalize">{billingPlan}</span> : null}
                <span className="mx-2 text-[#95a4ab] dark:text-[#7e939e]">·</span>
                {en ? billingPhase.en : billingPhase.ar}
              </p>
              {billing?.lifecycle.isTrialing && billing.lifecycle.effectiveEndsAt ? (
                <p className="mt-0.5 text-[11px] text-[#9a6513] dark:text-[#e0b46a]">{en ? `Trial ends ${formatRelativeDay(billing.lifecycle.effectiveEndsAt, en)}` : `تنتهي التجربة ${formatRelativeDay(billing.lifecycle.effectiveEndsAt, en)}`}</p>
              ) : null}
            </div>
            {billing?.lifecycle.needsAttention ? <span className="flex items-center gap-1.5 rounded-full bg-[#fff0d8] px-2.5 py-1 text-[10px] font-bold text-[#9a6513] dark:bg-[#3a2c14] dark:text-[#e0b46a]"><span className="size-1.5 animate-pulse rounded-full bg-[#d08327]" /> {en ? "Needs action" : "يحتاج إجراء"}</span> : null}
            <Link href="/billing" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3c7e93] dark:text-[#8cc3dd]" data-testid="link-dashboard-billing">{en ? "Manage" : "إدارة"} <ChevronLeft size={13} /></Link>
          </div>
        </section>

        <section className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-[#e4edf1] bg-white/70 px-5 py-3 text-xs text-[#5c7784] dark:border-[#1e3a4d] dark:bg-[#122434]/70 dark:text-[#a8bfc9]" data-testid="strip-secondary-metrics">
          <span className="flex items-center gap-2"><UsersRound size={15} className="text-[#6f69a0]" /> {en ? "Active patients" : "مرضى نشطون"}: <strong className="text-[#28495b] dark:text-[#dbe7ee]">{stats.activePatients ?? "—"}</strong></span>
          <span className="flex items-center gap-2"><AlertCircle size={15} className="text-[#ad8248]" /> {en ? "Open no-shows" : "حالات عدم حضور"}: <strong className="text-[#28495b] dark:text-[#dbe7ee]">{stats.openNoShows ?? "—"}</strong></span>
          <span className="flex items-center gap-2"><PhoneCall size={15} className="text-[#3d8a72]" /> {en ? "Connected channels" : "قنوات متصلة"}: <strong className="text-[#28495b] dark:text-[#dbe7ee]">{stats.connectedChannels ?? "—"}</strong></span>
          {updatedAt && <span className="ms-auto text-[10px] text-[#93a6ae] dark:text-[#7e939e]" data-testid="text-updated-at">{en ? "Updated" : "آخر تحديث"} {updatedAt}</span>}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
          <SectionCard
            title={en ? "Today's schedule" : "جدول اليوم"}
            subtitle={en ? `Clinic ${session.clinic.name}` : `مواعيد عيادة ${session.clinic.name} المرتبطة بالسيرفر`}
            delay="delay-2"
            action={<Link href="/appointments" className="flex items-center gap-1 text-[11px] font-bold text-[#3c7e93] dark:text-[#8cc3dd]" data-testid="link-dashboard-appointments">{en ? "View all" : "عرض الكل"} <ChevronLeft size={14} /></Link>}
          >
            {schedule.length ? <div className="divide-y divide-[#edf1f3] dark:divide-[#1e3a4d]">
              {schedule.map((appointment) => <div key={appointment.id} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-[#f5f9fa] dark:hover:bg-[#10222f]" data-testid={`dashboard-appointment-${appointment.id}`}>
                <span className="w-[52px] shrink-0 text-[12px] font-bold text-[#4f7183] dark:text-[#a8bfc9]">{formatTime(typeof appointment.scheduled_at === "string" ? appointment.scheduled_at : null)}</span>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e6f0f3] text-[11px] font-bold text-[#22617d] dark:bg-[#143242] dark:text-[#8cc3dd]">{String(appointment.patientName ?? "؟").slice(0, 2)}</span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-xs text-[#28495b] dark:text-[#dbe7ee]">{String(appointment.patientName ?? (en ? "Unnamed patient" : "مريض بدون اسم"))}</strong>
                  <span className="block truncate text-[10px] text-[#8496a0] dark:text-[#7e939e]">{typeof appointment.booking_number === "string" && appointment.booking_number ? `#${appointment.booking_number}` : en ? "Clinic booking" : "حجز عيادة"}</span>
                </span>
                <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${appointmentStatusTone(typeof appointment.appointment_status === "string" ? appointment.appointment_status : undefined)}`}>{statusLabels(en)[String(appointment.appointment_status ?? "")] ?? String(appointment.appointment_status ?? "")}</span>
              </div>)}
            </div> : <EmptyHint icon={<CalendarPlus size={20} />} title={en ? "No appointments today" : "لا توجد مواعيد اليوم"} hint={en ? "New bookings will appear here in real time." : "ستظهر الحجوزات الجديدة هنا تلقائيًا."} />}
          </SectionCard>

          <div className="flex min-w-0 flex-col gap-6">
            <SectionCard
              title={en ? "Needs your attention" : "يحتاج انتباهك"}
              subtitle={en ? "Handoffs and unassigned conversations" : "تسليمات ومحادثات بدون موظف مسؤول"}
              delay="delay-3"
              action={<span className="grid size-7 place-items-center rounded-lg bg-[#fff0d8] text-xs font-bold text-[#9a6513] dark:bg-[#3a2c14] dark:text-[#e0b46a]">{attentionConversations.length}</span>}
            >
              {attentionConversations.length ? <div className="space-y-2.5 p-3">
                {attentionConversations.map((conversation) => <Link key={conversation.id} href="/inbox" className="block rounded-xl border border-[#f2dfb9] bg-[#fffaf0] p-3 transition hover:border-[#e5c98b] dark:border-[#4a3a1a] dark:bg-[#2a2110] dark:hover:border-[#6b5426]" data-testid={`dashboard-attention-${conversation.id}`}>
                  <div className="flex items-center gap-2">
                    {conversation.is_handoff ? <Activity size={14} className="shrink-0 text-[#ad4338] dark:text-[#eb9a90]" /> : <Inbox size={14} className="shrink-0 text-[#986311] dark:text-[#e0b46a]" />}
                    <strong className="min-w-0 flex-1 truncate text-[11px] text-[#5d4a1f] dark:text-[#e0b46a]">{String(conversation.patientName ?? (en ? "Unnamed patient" : "مريض بدون اسم"))}</strong>
                    <span className="shrink-0 text-[9px] text-[#a98c4c] dark:text-[#b3945c]">{formatRelativeDay(typeof conversation.last_activity_at === "string" ? conversation.last_activity_at : null, en)}</span>
                  </div>
                  <p className="mt-1.5 truncate text-[10px] leading-5 text-[#8b7a4a] dark:text-[#b3945c]">{typeof conversation.last_patient_message === "string" && conversation.last_patient_message ? conversation.last_patient_message : en ? "Awaiting first reply" : "بانتظار أول رد"}</p>
                </Link>)}
                <Link href="/inbox" className="flex items-center justify-between rounded-lg bg-[#fdf6e8] px-3 py-2.5 text-[10px] font-bold text-[#986311] transition hover:bg-[#faefd4] dark:bg-[#3a2c14] dark:text-[#e0b46a] dark:hover:bg-[#4a3a1a]" data-testid="link-dashboard-inbox">{en ? "Open inbox" : "فتح صندوق الوارد"} <ArrowUpLeft size={14} /></Link>
              </div> : <EmptyHint icon={<CheckCircle2 size={20} />} title={en ? "All clear" : "كل شيء تحت السيطرة"} hint={en ? "No conversation is waiting for your team." : "لا توجد محادثات تنتظر رد فريقك الآن."} />}
            </SectionCard>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[.7fr_1.3fr]">
          <SectionCard
            title={en ? "Recovery radar" : "رادار الاسترداد"}
            subtitle={en ? "Follow-ups due and no-show recovery" : "متابعات مستحقة وحالات حضور قابلة للاسترداد"}
            action={<Link href="/follow-ups" className="flex items-center gap-1 text-[11px] font-bold text-[#3c7e93] dark:text-[#8cc3dd]" data-testid="link-dashboard-recovery">{en ? "Manage" : "إدارة"} <ChevronLeft size={14} /></Link>}
          >
            {followUps.length || noShows.length ? <div className="space-y-3 p-4">
              {followUps.slice(0, 3).map((item) => <div key={`fu-${item.id}`} className="flex items-center gap-3 rounded-xl bg-[#f2f8f9] p-3 dark:bg-[#10222f]" data-testid={`dashboard-followup-${item.id}`}>
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#dcecf5] text-[#22617d] dark:bg-[#143242] dark:text-[#8cc3dd]"><Sparkles size={15} /></span>
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-[11px] text-[#28495b] dark:text-[#dbe7ee]">{String(item.patientName ?? "—")}</strong>
                  <span className="block text-[10px] text-[#7f919a] dark:text-[#7e939e]">{en ? "Due" : "الاستحقاق"}: {formatRelativeDay(typeof item.next_due_at === "string" ? item.next_due_at : null, en)}</span>
                </div>
              </div>)}
              {noShows.slice(0, 3).map((item) => {
                const risk = riskLabels(en)[String(item.risk_level ?? "")] ?? riskLabels(en).low;
                return <div key={`ns-${item.id}`} className="flex items-center gap-3 rounded-xl bg-[#fdf6f5] p-3 dark:bg-[#241512]" data-testid={`dashboard-noshow-${item.id}`}>
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f5d8d4] text-[#ad4338] dark:bg-[#3d1f1b] dark:text-[#eb9a90]"><XCircle size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-[11px] text-[#28495b] dark:text-[#dbe7ee]">{String(item.patientName ?? "—")}</strong>
                    <span className="mt-1 inline-block rounded-md bg-[#f8e7e4] px-1.5 py-0.5 text-[9px] font-bold text-[#a64036] dark:bg-[#3d1f1b] dark:text-[#eb9a90]">{risk.label}</span>
                  </div>
                </div>;
              })}
            </div> : <EmptyHint icon={<CheckCircle2 size={20} />} title={en ? "Nothing to recover" : "لا يوجد ما يستدعي الاسترداد"} hint={en ? "Follow-ups and no-show cases will appear here." : "ستظهر المتابعات وحالات عدم الحضور هنا."} />}
          </SectionCard>

          <SectionCard
            title={en ? "Recent conversations" : "أحدث المحادثات"}
            subtitle={en ? "Latest patient activity across channels" : "آخر نشاط للمرضى على قنوات العيادة"}
            action={<Link href="/inbox" className="flex items-center gap-1 text-[11px] font-bold text-[#3c7e93] dark:text-[#8cc3dd]" data-testid="link-dashboard-conversations">{en ? "Open inbox" : "فتح الصندوق"} <ChevronLeft size={14} /></Link>}
          >
            {(summary?.recentConversations ?? []).length ? <div className="divide-y divide-[#edf1f3] dark:divide-[#1e3a4d]">
              {(summary?.recentConversations ?? []).slice(0, 5).map((conversation) => <Link key={conversation.id} href="/inbox" className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-[#f5f9fa] dark:hover:bg-[#10222f]" data-testid={`dashboard-conversation-${conversation.id}`}>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e8e1f4] text-[#65518b] dark:bg-[#2a2440] dark:text-[#bcaede]"><MessageSquareText size={16} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <strong className="min-w-0 truncate text-xs text-[#28495b] dark:text-[#dbe7ee]">{String(conversation.patientName ?? (en ? "Unnamed patient" : "مريض بدون اسم"))}</strong>
                    {conversation.is_handoff ? <span className="shrink-0 rounded-md bg-[#f8dfdc] px-1.5 py-0.5 text-[9px] font-bold text-[#a64036] dark:bg-[#3d1f1b] dark:text-[#eb9a90]">{en ? "Handoff" : "تسليم"}</span> : null}
                  </span>
                  <span className="block truncate text-[10px] text-[#8496a0] dark:text-[#7e939e]">{typeof conversation.last_patient_message === "string" && conversation.last_patient_message ? conversation.last_patient_message : en ? "No messages yet" : "لا توجد رسائل بعد"}</span>
                </span>
                <span className="shrink-0 text-[9px] text-[#a0adb3] dark:text-[#7e939e]">{formatRelativeDay(typeof conversation.last_activity_at === "string" ? conversation.last_activity_at : null, en)}</span>
              </Link>)}
            </div> : <EmptyHint icon={<MessageSquareText size={20} />} title={en ? "No conversations yet" : "لا توجد محادثات بعد"} hint={en ? "Patient messages from connected channels will appear here." : "ستظهر رسائل المرضى من القنوات المتصلة هنا."} />}
          </SectionCard>
        </section>

        <section className="flex flex-wrap items-center gap-2" data-testid="strip-system-status">
          <span className="text-[11px] font-bold text-[#66808e] dark:text-[#7e939e]">{en ? "System status:" : "حالة الأنظمة:"}</span>
          {Object.entries(summary.systemStatus).map(([source, state]) => <span key={source} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${state === "ready" ? "bg-[#e6f4ee] text-[#2c7a5d] dark:bg-[#123528] dark:text-[#7fd0b4]" : "bg-[#f9e9e7] text-[#a64036] dark:bg-[#3d1f1b] dark:text-[#eb9a90]"}`} data-testid={`chip-system-${source}`}>
            <span className={`size-1.5 rounded-full ${state === "ready" ? "bg-[#3d8a72]" : "bg-[#c67870]"}`} />
            {systemSourceLabels(en)[source] ?? source}
          </span>)}
        </section>
      </> : null}
    </div>
  </div>;
}
