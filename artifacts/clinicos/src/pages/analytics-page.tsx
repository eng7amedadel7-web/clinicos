import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  CalendarCheck,
  CalendarX,
  Download,
  MessageCircle,
  Printer,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users,
  Wifi,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getAnalyticsSummary } from "@/lib/analytics-api";
import { usePreferences } from "@/lib/preferences";

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: "#25D366",
  instagram: "#E1306C",
  messenger: "#0084FF",
  telegram: "#229ED9",
  unknown: "#94a3b8",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "#22c55e",
  cancelled: "#ef4444",
  no_show: "#f59e0b",
  scheduled: "#3b82f6",
  confirmed: "#6366f1",
  checked_in: "#06b6d4",
  pending: "#94a3b8",
};

function KPICard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "blue",
  change,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  helper?: string;
  tone?: "blue" | "green" | "amber" | "red" | "purple" | "cyan";
  change?: number | null;
}) {
  const tones = {
    blue: "from-blue-500/10 to-blue-500/5 border-blue-200/50 dark:border-blue-900/40",
    green: "from-emerald-500/10 to-emerald-500/5 border-emerald-200/50 dark:border-emerald-900/40",
    amber: "from-amber-500/10 to-amber-500/5 border-amber-200/50 dark:border-amber-900/40",
    red: "from-red-500/10 to-red-500/5 border-red-200/50 dark:border-red-900/40",
    purple: "from-purple-500/10 to-purple-500/5 border-purple-200/50 dark:border-purple-900/40",
    cyan: "from-cyan-500/10 to-cyan-500/5 border-cyan-200/50 dark:border-cyan-900/40",
  };
  const iconTones = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  };

  return (
    <div
      className={`rounded-xl border bg-gradient-to-br p-4 shadow-xs transition hover:shadow-sm ${tones[tone]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`grid size-9 shrink-0 place-items-center rounded-lg ${iconTones[tone]}`}>
          <Icon className="size-4" />
        </div>
        {change !== null && change !== undefined && (
          <div
            className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              change >= 0
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
            }`}
          >
            {change >= 0 ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-black text-foreground tabular-nums">{value}</p>
        <p className="mt-0.5 text-xs font-bold text-foreground">{label}</p>
        {helper && <p className="mt-0.5 text-[10px] text-muted-foreground">{helper}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon: typeof Activity }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-3.5" />
      </div>
      <h2 className="text-sm font-bold text-foreground">{children}</h2>
    </div>
  );
}

function formatDayLabel(dateStr: string, lang: "ar" | "en") {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { month: "numeric", day: "numeric" });
}

function statusLabel(status: string, lang: "ar" | "en") {
  const ar: Record<string, string> = {
    completed: "مكتمل",
    cancelled: "ملغي",
    no_show: "لم يحضر",
    scheduled: "مجدول",
    confirmed: "مؤكد",
    checked_in: "وصل",
    pending: "بانتظار",
    unknown: "غير معروف",
  };
  const en: Record<string, string> = {
    completed: "Completed",
    cancelled: "Cancelled",
    no_show: "No Show",
    scheduled: "Scheduled",
    confirmed: "Confirmed",
    checked_in: "Checked In",
    pending: "Pending",
    unknown: "Unknown",
  };
  return (lang === "ar" ? ar[status] : en[status]) ?? status;
}

function channelLabel(ch: string, lang: "ar" | "en") {
  const ar: Record<string, string> = {
    whatsapp: "واتساب",
    instagram: "إنستغرام",
    messenger: "ماسنجر",
    telegram: "تليجرام",
    unknown: "غير محدد",
  };
  const en: Record<string, string> = {
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    messenger: "Messenger",
    telegram: "Telegram",
    unknown: "Unknown",
  };
  return (lang === "ar" ? ar[ch] : en[ch]) ?? ch;
}

export default function AnalyticsPage() {
  const { language } = usePreferences();
  const en = language === "en";

  const query = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: ({ signal }) => getAnalyticsSummary(signal),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  });

  const data = query.data;

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ["Metric", "Value", "Unit"],
      ["Appointments This Week", data.appointments.thisWeek, "bookings"],
      ["Appointments Last Week", data.appointments.lastWeek, "bookings"],
      ["Completion Rate", `${data.appointments.completionRate}%`, "percentage"],
      ["Cancellation Rate", `${data.appointments.cancellationRate}%`, "percentage"],
      ["No-Show Rate", `${data.appointments.noShowRate}%`, "percentage"],
      ["New Patients This Month", data.patients.newThisMonth, "patients"],
      ["Total Conversations", data.inbox.totalConversations, "conversations"],
      ["AI Handled Conversations", data.inbox.aiConversations, "conversations"],
      ["Human Handled Conversations", data.inbox.humanConversations, "conversations"],
      ["Total Messages", data.inbox.totalMessages, "messages"],
      ["AI Messages", data.inbox.aiMessages, "messages"],
      ["Staff Messages", data.inbox.staffMessages, "messages"],
    ];
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map(e => e.map(x => `"${x}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `meruna-analytics-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <section className="space-y-6 pb-10" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-black text-foreground">
            {en ? "Analytics & Reports" : "التقارير والإحصائيات"}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {en
              ? "Live clinic performance overview — last 2 weeks"
              : "نظرة عامة على أداء العيادة — آخر أسبوعين"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <>
              <button
                onClick={exportCsv}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs transition hover:bg-muted"
                data-testid="button-export-csv"
                title={en ? "Export CSV" : "تصدير CSV"}
              >
                <Download className="size-3.5 text-[#22617d] dark:text-[#8cc3dd]" />
                <span>{en ? "Export CSV" : "تصدير CSV"}</span>
              </button>
              <button
                onClick={printReport}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs transition hover:bg-muted"
                data-testid="button-print-report"
                title={en ? "Print report" : "طباعة التقرير"}
              >
                <Printer className="size-3.5" />
                <span>{en ? "Print" : "طباعة"}</span>
              </button>
            </>
          )}
          <button
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs transition hover:bg-muted disabled:opacity-50"
            data-testid="button-refresh-analytics"
          >
            <RefreshCw className={`size-3.5 ${query.isFetching ? "animate-spin" : ""}`} />
            <span>{en ? "Refresh" : "تحديث"}</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {query.isLoading && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl border bg-muted/30 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error State */}
      {query.isError && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-10 text-center">
          <AlertTriangle className="mb-2 size-8 text-destructive/60" />
          <p className="text-sm font-bold text-destructive">
            {en ? "Could not load analytics" : "تعذر تحميل بيانات التقارير"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {query.error instanceof Error ? query.error.message : ""}
          </p>
          <button
            onClick={() => query.refetch()}
            className="mt-4 rounded-lg bg-destructive px-4 py-2 text-xs font-bold text-white hover:bg-destructive/80"
          >
            {en ? "Retry" : "إعادة المحاولة"}
          </button>
        </div>
      )}

      {data && (
        <>
          {/* ── APPOINTMENTS SECTION ── */}
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
            <SectionTitle icon={CalendarCheck}>
              {en ? "Appointments — This Week" : "المواعيد — هذا الأسبوع"}
            </SectionTitle>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
              <KPICard
                icon={CalendarCheck}
                label={en ? "Total Appointments" : "إجمالي المواعيد"}
                value={data.appointments.thisWeek}
                helper={en ? `vs ${data.appointments.lastWeek} last week` : `مقابل ${data.appointments.lastWeek} الأسبوع الماضي`}
                tone="blue"
                change={data.appointments.weekOverWeekChange}
              />
              <KPICard
                icon={Activity}
                label={en ? "Completion Rate" : "معدل الإنجاز"}
                value={`${data.appointments.completionRate}%`}
                helper={`${data.appointments.completed} ${en ? "completed" : "مكتمل"}`}
                tone="green"
              />
              <KPICard
                icon={CalendarX}
                label={en ? "Cancellation Rate" : "معدل الإلغاء"}
                value={`${data.appointments.cancellationRate}%`}
                helper={`${data.appointments.cancelled} ${en ? "cancelled" : "ملغي"}`}
                tone="amber"
              />
              <KPICard
                icon={AlertTriangle}
                label={en ? "No-Show Rate" : "معدل عدم الحضور"}
                value={`${data.appointments.noShowRate}%`}
                helper={`${data.appointments.noShow} ${en ? "no-shows" : "لم يحضروا"}`}
                tone="red"
              />
            </div>

            {/* Daily Trend Chart */}
            {data.appointments.dailyTrend.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-bold text-muted-foreground">
                  {en ? "Daily Appointment Trend" : "الاتجاه اليومي للمواعيد"}
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data.appointments.dailyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => formatDayLabel(v, language)}
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                      labelFormatter={(v) => formatDayLabel(String(v), language)}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Area
                      type="monotone"
                      dataKey="total"
                      name={en ? "Total" : "الكل"}
                      stroke="#3b82f6"
                      fill="url(#colorTotal)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name={en ? "Completed" : "مكتمل"}
                      stroke="#22c55e"
                      fill="url(#colorCompleted)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="cancelled"
                      name={en ? "Cancelled" : "ملغي"}
                      stroke="#ef4444"
                      fill="none"
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Status Breakdown Bar Chart */}
            {data.appointments.statusBreakdown.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-xs font-bold text-muted-foreground">
                  {en ? "Status Breakdown (This Week)" : "توزيع الحالات هذا الأسبوع"}
                </p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={data.appointments.statusBreakdown}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="status"
                      tickFormatter={(v) => statusLabel(v, language)}
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                      width={70}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                      formatter={(val, _, props) => [val, statusLabel(props.payload.status, language)]}
                    />
                    <Bar dataKey="count" name={en ? "Count" : "العدد"} radius={[0, 4, 4, 0]}>
                      {data.appointments.statusBreakdown.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] ?? "#94a3b8"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* ── INBOX / CHANNELS SECTION ── */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Inbox KPIs */}
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
              <SectionTitle icon={MessageCircle}>
                {en ? "Inbox — Last 30 Days" : "صندوق الوارد — آخر 30 يوم"}
              </SectionTitle>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <KPICard
                  icon={MessageCircle}
                  label={en ? "Total Conversations" : "إجمالي المحادثات"}
                  value={data.inbox.totalConversations}
                  tone="blue"
                />
                <KPICard
                  icon={Bot}
                  label={en ? "AI Handled" : "تلقائي بالذكاء"}
                  value={data.inbox.aiConversations}
                  helper={
                    data.inbox.totalConversations > 0
                      ? `${Math.round((data.inbox.aiConversations / data.inbox.totalConversations) * 100)}%`
                      : "0%"
                  }
                  tone="purple"
                />
                <KPICard
                  icon={UserRound}
                  label={en ? "Staff Handled" : "تلقائي بشري"}
                  value={data.inbox.humanConversations}
                  tone="cyan"
                />
                <KPICard
                  icon={Zap}
                  label={en ? "Total Messages" : "إجمالي الرسائل"}
                  value={data.inbox.totalMessages}
                  helper={`${data.inbox.inboundMessages} ${en ? "in" : "واردة"} / ${data.inbox.outboundMessages} ${en ? "out" : "صادرة"}`}
                  tone="amber"
                />
              </div>

              {/* AI vs Staff messages bar */}
              {data.inbox.totalMessages > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold text-muted-foreground">
                    {en ? "Message Senders" : "مصادر الرسائل الصادرة"}
                  </p>
                  <div className="flex h-6 w-full overflow-hidden rounded-full">
                    <div
                      style={{ width: `${Math.round((data.inbox.aiMessages / data.inbox.totalMessages) * 100)}%` }}
                      className="bg-purple-500 transition-all"
                      title={en ? "AI" : "ذكاء اصطناعي"}
                    />
                    <div
                      style={{ width: `${Math.round((data.inbox.staffMessages / data.inbox.totalMessages) * 100)}%` }}
                      className="bg-sky-500 transition-all"
                      title={en ? "Staff" : "موظف"}
                    />
                    <div
                      style={{
                        width: `${Math.max(
                          0,
                          100 -
                            Math.round((data.inbox.aiMessages / data.inbox.totalMessages) * 100) -
                            Math.round((data.inbox.staffMessages / data.inbox.totalMessages) * 100)
                        )}%`,
                      }}
                      className="bg-muted"
                    />
                  </div>
                  <div className="mt-1.5 flex items-center gap-4 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-purple-500" />{en ? "AI" : "ذكاء اصطناعي"} {data.inbox.aiMessages}</span>
                    <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-sky-500" />{en ? "Staff" : "موظف"} {data.inbox.staffMessages}</span>
                    <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-muted-foreground/40" />{en ? "Patient" : "مريض"} {data.inbox.inboundMessages}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Channel Distribution Pie */}
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
              <SectionTitle icon={Wifi}>
                {en ? "Channel Distribution" : "توزيع القنوات"}
              </SectionTitle>

              {data.inbox.channelDistribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={data.inbox.channelDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="count"
                      >
                        {data.inbox.channelDistribution.map((entry) => (
                          <Cell
                            key={entry.channel}
                            fill={CHANNEL_COLORS[entry.channel] ?? "#94a3b8"}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          fontSize: "11px",
                        }}
                        formatter={(val, _, props) => [
                          `${val} ${en ? "conversations" : "محادثة"}`,
                          channelLabel(props.payload.channel, language),
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="mt-2 space-y-1.5">
                    {data.inbox.channelDistribution
                      .sort((a, b) => b.count - a.count)
                      .map((entry) => {
                        const pct =
                          data.inbox.totalConversations > 0
                            ? Math.round((entry.count / data.inbox.totalConversations) * 100)
                            : 0;
                        return (
                          <div key={entry.channel} className="flex items-center gap-2">
                            <span
                              className="size-2.5 shrink-0 rounded-full"
                              style={{ background: CHANNEL_COLORS[entry.channel] ?? "#94a3b8" }}
                            />
                            <span className="flex-1 text-xs text-foreground font-semibold">
                              {channelLabel(entry.channel, language)}
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums">{entry.count}</span>
                            <span className="w-10 text-right text-xs font-bold text-foreground tabular-nums">{pct}%</span>
                          </div>
                        );
                      })}
                  </div>
                </>
              ) : (
                <div className="flex h-48 items-center justify-center text-muted-foreground">
                  <p className="text-xs">{en ? "No channel data available" : "لا توجد بيانات قنوات بعد"}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── PATIENTS SECTION ── */}
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
            <SectionTitle icon={Users}>
              {en ? "Patients — This Month" : "المرضى — هذا الشهر"}
            </SectionTitle>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <KPICard
                icon={Users}
                label={en ? "New Patients (30d)" : "مرضى جدد (30 يوم)"}
                value={data.patients.newThisMonth}
                tone="green"
              />
              <KPICard
                icon={BarChart3}
                label={en ? "Avg / Week" : "متوسط أسبوعي"}
                value={Math.round(data.patients.newThisMonth / 4)}
                tone="blue"
              />
              <KPICard
                icon={Activity}
                label={en ? "Inbox Engagement" : "تفاعل الإنبوكس"}
                value={
                  data.patients.newThisMonth > 0
                    ? `${Math.round((data.inbox.totalConversations / data.patients.newThisMonth) * 100)}%`
                    : "—"
                }
                helper={en ? "Conversations per new patient" : "محادثات لكل مريض جديد"}
                tone="purple"
              />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
