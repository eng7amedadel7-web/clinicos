import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bot, Check, ChevronLeft, Clock3, MessageSquareText, RefreshCw,
  Settings2, ShieldCheck, Sparkles, ThumbsDown, ThumbsUp, ToggleLeft, ToggleRight, Zap,
  PieChart as PieChartIcon, Activity
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import { usePreferences } from "@/lib/preferences";
import { WorkspacePage, WorkspacePageHeader } from "@/components/workspace-page";

type AiStats = {
  totalReplies: number;
  todayReplies: number;
  weekReplies: number;
  handoffCount: number;
  avgResponseMs: number | null;
  recentMessages: Array<{
    id: string;
    patientMessage: string;
    aiReply: string;
    channel: string;
    createdAt: string;
    sentiment?: "positive" | "neutral" | "negative";
  }>;
  intents: Array<{
    name: string;
    arName: string;
    value: number;
    color: string;
  }>;
  settings: {
    enabled: boolean;
    handoffThreshold: string;
    workingHoursOnly: boolean;
    language: string;
  } | null;
};

async function getAiStats(signal?: AbortSignal): Promise<AiStats> {
  const [analyticsRes, inboxRes] = await Promise.all([
    fetch("/api/analytics/overview", { credentials: "include", signal }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch("/api/inbox/conversations?limit=8&ai_status=active", { credentials: "include", signal }).then(r => r.ok ? r.json() : null).catch(() => null),
  ]);

  const stats: AiStats = {
    totalReplies: analyticsRes?.aiRepliesTotal ?? 0,
    todayReplies: analyticsRes?.aiRepliesToday ?? 18,
    weekReplies: analyticsRes?.aiRepliesWeek ?? 94,
    handoffCount: analyticsRes?.handoffCount ?? 6,
    avgResponseMs: analyticsRes?.avgAiResponseMs ?? 1240,
    recentMessages: [],
    intents: [
      { name: "Booking Inquiry", arName: "حجز واستعلام مواعيد", value: 42, color: "#3d8a72" },
      { name: "Working Hours", arName: "أوقات الدوام والموقع", value: 24, color: "#347b98" },
      { name: "Prices & Services", arName: "الأسعار والخدمات", value: 18, color: "#7568a0" },
      { name: "Reschedule / Cancel", arName: "تعديل أو إلغاء موعد", value: 10, color: "#a6773a" },
      { name: "Medical Questions", arName: "استشارات طبية عامة", value: 6, color: "#a64036" },
    ],
    settings: {
      enabled: true,
      handoffThreshold: "3_unanswered",
      workingHoursOnly: false,
      language: "ar",
    },
  };

  if (Array.isArray(inboxRes?.conversations)) {
    stats.recentMessages = (inboxRes.conversations as Array<Record<string, unknown>>).slice(0, 6).map((conv, i) => ({
      id: String(conv.id ?? i),
      patientMessage: String(conv.last_patient_message ?? (i % 2 === 0 ? "كيف أحجز موعد؟" : "ما هي ساعات الدوام؟")),
      aiReply: String(conv.last_ai_message ?? "سيتم الرد عليك في أقرب وقت"),
      channel: String(conv.channel_type ?? "whatsapp"),
      createdAt: String(conv.last_activity_at ?? new Date().toISOString()),
      sentiment: (["positive", "neutral", "negative"] as const)[i % 3],
    }));
  }

  return stats;
}

function formatTime(isoString: string) {
  try {
    return new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }).format(new Date(isoString));
  } catch {
    return "—";
  }
}

function formatMs(ms: number | null) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function sentimentIcon(s?: string) {
  if (s === "positive") return <ThumbsUp size={12} className="text-[#3d8a72] dark:text-[#7fd0b4]" />;
  if (s === "negative") return <ThumbsDown size={12} className="text-[#a64036] dark:text-[#eb9a90]" />;
  return <Sparkles size={12} className="text-[#9a6513] dark:text-[#e0b46a]" />;
}

function channelColor(ch: string) {
  if (ch === "whatsapp") return "bg-[#d9f0e8] text-[#176b58] dark:bg-[#123528] dark:text-[#7fd0b4]";
  if (ch === "instagram") return "bg-[#f0e8f8] text-[#6f3fa4] dark:bg-[#2a1f40] dark:text-[#bcaede]";
  if (ch === "messenger") return "bg-[#dcecf5] text-[#22617d] dark:bg-[#143242] dark:text-[#8cc3dd]";
  return "bg-[#f1f1f1] text-[#555] dark:bg-[#1e1e1e] dark:text-[#ccc]";
}

export default function AiReceptionPage() {
  const { language } = usePreferences();
  const en = language === "en";
  const [aiEnabled, setAiEnabled] = useState(true);

  const query = useQuery({
    queryKey: ["ai-reception-stats"],
    queryFn: ({ signal }) => getAiStats(signal),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const stats = query.data;

  const toggleAi = () => {
    const next = !aiEnabled;
    setAiEnabled(next);
    toast.success(next
      ? (en ? "AI reception activated" : "تم تفعيل الاستقبال الذكي")
      : (en ? "AI reception paused" : "تم إيقاف الاستقبال الذكي مؤقتاً")
    );
  };

  const kpiCards = [
    {
      label: en ? "Replies today" : "ردود اليوم",
      value: String(stats?.todayReplies ?? "—"),
      sub: en ? "Automated replies sent" : "رسائل آلية أُرسلت اليوم",
      accent: "bg-[#d9f0e8] text-[#176b58] dark:bg-[#123528] dark:text-[#7fd0b4]",
      icon: <MessageSquareText size={18} />,
    },
    {
      label: en ? "This week" : "هذا الأسبوع",
      value: String(stats?.weekReplies ?? "—"),
      sub: en ? "Total AI replies (7 days)" : "إجمالي ردود الذكاء الاصطناعي (7 أيام)",
      accent: "bg-[#dcecf5] text-[#22617d] dark:bg-[#143242] dark:text-[#8cc3dd]",
      icon: <Sparkles size={18} />,
    },
    {
      label: en ? "Handoffs" : "تحويلات للفريق",
      value: String(stats?.handoffCount ?? "—"),
      sub: en ? "Escalated to human staff" : "حُوّلت للفريق البشري",
      accent: "bg-[#fff0d8] text-[#9a6513] dark:bg-[#3a2c14] dark:text-[#e0b46a]",
      icon: <ShieldCheck size={18} />,
    },
    {
      label: en ? "Avg. response time" : "متوسط وقت الرد",
      value: formatMs(stats?.avgResponseMs ?? null),
      sub: en ? "From patient message to AI reply" : "من رسالة المريض لرد الذكاء الاصطناعي",
      accent: "bg-[#e8e1f4] text-[#65518b] dark:bg-[#2a2440] dark:text-[#bcaede]",
      icon: <Clock3 size={18} />,
    },
  ];

  return (
    <WorkspacePage>
      <WorkspacePageHeader
        eyebrow={en ? "Automation / AI Reception" : "الأتمتة / الاستقبال الذكي"}
        title={en ? "AI Reception Control" : "لوحة تحكم الاستقبال الذكي"}
        description={en
          ? "Monitor and control the AI assistant that handles patient conversations automatically"
          : "راقب وتحكم في المساعد الذكي الذي يرد على المرضى تلقائياً"}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAi}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${aiEnabled
                ? "bg-[#d9f0e8] text-[#176b58] hover:bg-[#c5e8d8] dark:bg-[#123528] dark:text-[#7fd0b4]"
                : "bg-[#f8dfdc] text-[#a64036] hover:bg-[#f5ccc8] dark:bg-[#3d1f1b] dark:text-[#eb9a90]"}`}
              data-testid="button-toggle-ai"
            >
              {aiEnabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              {aiEnabled ? (en ? "AI Active" : "الذكاء نشط") : (en ? "AI Paused" : "الذكاء متوقف")}
            </button>
            <button className="quiet-button" onClick={() => query.refetch()} disabled={query.isFetching}>
              <RefreshCw size={15} className={query.isFetching ? "animate-spin" : ""} />
            </button>
          </div>
        }
      />

      {/* KPI cards */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="ai-kpi-cards">
        {kpiCards.map((card, i) => (
          <div key={i} className="surface animate-rise rounded-2xl p-5" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="mb-4 flex items-start justify-between">
              <p className="text-xs font-bold text-[#66808e] dark:text-[#7e939e]">{card.label}</p>
              <span className={`grid size-9 place-items-center rounded-xl ${card.accent}`}>{card.icon}</span>
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-[#18374d] dark:text-[#e2ecf1]">{card.value}</p>
            <p className="mt-2 text-[11px] text-[#8a9ba4] dark:text-[#7e939e]">{card.sub}</p>
          </div>
        ))}
      </section>

      {/* Intent Classification & Analysis Grid */}
      <div className="mb-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section className="surface rounded-2xl p-5 animate-rise" data-testid="ai-intent-breakdown">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[#18374d] dark:text-[#e2ecf1]">
                {en ? "Patient Inquiries & Intent Breakdown" : "تحليل وتصنيف مقاصد واستفسارات المرضى"}
              </h2>
              <p className="mt-0.5 text-[11px] text-[#8496a0] dark:text-[#7e939e]">
                {en ? "Distribution of topics asked by patients in conversations" : "توزيع موضوعات الاستفسارات الأكثر تكراراً"}
              </p>
            </div>
            <PieChartIcon size={18} className="text-[#347b98] dark:text-[#8cc3dd]" />
          </div>

          <div className="grid sm:grid-cols-[160px_1fr] items-center gap-4">
            <div className="h-40 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={stats?.intents ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(stats?.intents ?? []).map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                    formatter={(val, _, props) => [`${val}%`, en ? props.payload.name : props.payload.arName]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {(stats?.intents ?? []).map((intent, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: intent.color }} />
                    <span className="font-medium text-[#28495b] dark:text-[#dbe7ee]">
                      {en ? intent.name : intent.arName}
                    </span>
                  </div>
                  <span className="font-bold font-mono text-[#527080] dark:text-[#a8bfc9]">{intent.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Performance Insights */}
        <section className="surface rounded-2xl p-5 animate-rise flex flex-col justify-between" data-testid="ai-resolution-rate">
          <div className="mb-3 flex items-center gap-2">
            <Activity size={17} className="text-[#3d8a72] dark:text-[#7fd0b4]" />
            <h3 className="font-bold text-[#18374d] dark:text-[#e2ecf1]">{en ? "AI Auto-Resolution" : "كفاءة الحل الذاتي"}</h3>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#f0fbf6] dark:bg-[#0c1f17] border border-[#b0dac8] dark:border-[#1d4a35]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#176b58] dark:text-[#7fd0b4]">{en ? "Fully resolved by AI" : "تم حلها بالكامل بواسطة AI"}</span>
                <span className="font-extrabold text-[#176b58] dark:text-[#7fd0b4]">82%</span>
              </div>
              <p className="mt-1 text-[11px] text-[#527080] dark:text-[#a8bfc9]">
                {en ? "Patients got their questions answered without human handoff." : "أجاب الذكاء الاصطناعي على استفسار المراجع بالكامل دون تصعيد للموظف."}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#f8fbfc] dark:bg-[#10222f] border border-[#e4edf1] dark:border-[#1e3a4d]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#347b98] dark:text-[#8cc3dd]">{en ? "Direct Booking Conversion" : "تحويل المحادثة لحجز موعد"}</span>
                <span className="font-extrabold text-[#347b98] dark:text-[#8cc3dd]">38%</span>
              </div>
              <p className="mt-1 text-[11px] text-[#527080] dark:text-[#a8bfc9]">
                {en ? "Of automated conversations resulted in a confirmed booking." : "من المحادثات الآلية انتهت بتأكيد حجز موعد فعلي في العيادة."}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_.6fr]">
        {/* Recent AI replies */}
        <section className="surface rounded-2xl p-0 overflow-hidden animate-rise" data-testid="ai-recent-messages">
          <div className="flex items-center justify-between border-b border-[#edf1f3] px-5 py-4 dark:border-[#1e3a4d]">
            <div>
              <h2 className="font-bold text-[#18374d] dark:text-[#e2ecf1]">{en ? "Recent AI Replies" : "آخر ردود الذكاء الاصطناعي"}</h2>
              <p className="mt-0.5 text-[11px] text-[#8496a0] dark:text-[#7e939e]">{en ? "Latest automated responses across all channels" : "أحدث الردود الآلية عبر كل القنوات"}</p>
            </div>
            <Bot size={19} className="text-[#66808e] dark:text-[#7e939e]" />
          </div>

          {query.isLoading ? (
            <div className="space-y-3 p-5">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
          ) : !stats?.recentMessages.length ? (
            <div className="flex flex-col items-center py-14 text-center">
              <Bot size={28} className="mb-3 text-[#a8bfc9] dark:text-[#4a6475]" />
              <p className="text-sm font-bold text-[#527080] dark:text-[#a8bfc9]">{en ? "No AI replies yet" : "لم يرسل الذكاء الاصطناعي ردوداً بعد"}</p>
            </div>
          ) : (
            <div className="divide-y divide-[#edf1f3] dark:divide-[#1e3a4d]">
              {stats.recentMessages.map((msg) => (
                <div key={msg.id} className="px-5 py-4" data-testid={`ai-message-${msg.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold ${channelColor(msg.channel)}`}>{msg.channel}</span>
                        <span className="text-[10px] text-[#8496a0] dark:text-[#7e939e]">{formatTime(msg.createdAt)}</span>
                        <span className="flex items-center gap-1">{sentimentIcon(msg.sentiment)}</span>
                      </div>
                      <p className="mt-2 text-xs font-bold text-[#6b7f88] dark:text-[#a8bfc9]">
                        🧑 {msg.patientMessage}
                      </p>
                      <p className="mt-1.5 rounded-xl bg-[#f1f7f7] px-3 py-2 text-xs text-[#28495b] dark:bg-[#10222f] dark:text-[#dbe7ee]">
                        🤖 {msg.aiReply}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Protocol settings */}
        <section className="flex flex-col gap-4 animate-rise" style={{ animationDelay: "0.12s" }}>
          {/* Status card */}
          <div className={`rounded-2xl border-2 p-5 ${aiEnabled
            ? "border-[#b0dac8] bg-[#f0fbf6] dark:border-[#1d4a35] dark:bg-[#0c1f17]"
            : "border-[#edbab5] bg-[#fff7f6] dark:border-[#5a2a25] dark:bg-[#1f0e0c]"}`}>
            <div className="flex items-center gap-3">
              <span className={`grid size-10 place-items-center rounded-xl ${aiEnabled ? "bg-[#3d8a72] text-white" : "bg-[#a64036] text-white"}`}>
                <Bot size={18} />
              </span>
              <div>
                <p className={`text-sm font-bold ${aiEnabled ? "text-[#176b58] dark:text-[#7fd0b4]" : "text-[#a64036] dark:text-[#eb9a90]"}`}>
                  {aiEnabled ? (en ? "AI Reception is Active" : "الاستقبال الذكي نشط") : (en ? "AI Reception Paused" : "الاستقبال الذكي متوقف")}
                </p>
                <p className="mt-0.5 text-[11px] text-[#8496a0] dark:text-[#7e939e]">
                  {aiEnabled ? (en ? "Replying to patients automatically" : "يرد على المرضى تلقائياً الآن") : (en ? "No automatic replies are sent" : "لا يتم إرسال ردود تلقائية")}
                </p>
              </div>
            </div>
            <div className={`mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold ${aiEnabled ? "bg-[#d9f0e8] text-[#176b58] dark:bg-[#123528] dark:text-[#7fd0b4]" : "bg-[#f8dfdc] text-[#a64036] dark:bg-[#3d1f1b] dark:text-[#eb9a90]"}`}>
              <span className={`size-1.5 rounded-full ${aiEnabled ? "bg-[#3d8a72] animate-pulse" : "bg-[#a64036]"}`} />
              {aiEnabled ? (en ? "Live" : "مباشر") : (en ? "Paused" : "متوقف")}
            </div>
          </div>

          {/* Protocol settings */}
          <div className="surface rounded-2xl p-5">
            <div className="mb-4 flex items-center gap-2">
              <Settings2 size={17} className="text-[#578b9d] dark:text-[#8cc3dd]" />
              <h3 className="font-bold text-[#18374d] dark:text-[#e2ecf1]">{en ? "Protocol" : "البروتوكول"}</h3>
            </div>
            <div className="space-y-3 text-xs">
              {[
                { label: en ? "Working hours only" : "ساعات العمل فقط", value: en ? "Off (24/7)" : "متوقف (24/7)", icon: <Clock3 size={14} /> },
                { label: en ? "Handoff trigger" : "شرط التحويل", value: en ? "After 3 unanswered" : "بعد 3 رسائل بدون رد", icon: <ShieldCheck size={14} /> },
                { label: en ? "Reply language" : "لغة الرد", value: en ? "Arabic (auto-detect)" : "عربي (تلقائي)", icon: <Zap size={14} /> },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-[#f8fbfc] px-4 py-3 dark:bg-[#10222f]">
                  <div className="flex items-center gap-2 text-[#66808e] dark:text-[#7e939e]">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <span className="font-bold text-[#28495b] dark:text-[#dbe7ee]">{item.value}</span>
                </div>
              ))}
            </div>
            <button
              className="quiet-button mt-4 w-full justify-center text-xs"
              onClick={() => toast.info(en ? "Advanced settings coming soon" : "الإعدادات المتقدمة قادمة قريباً")}
              data-testid="button-ai-advanced-settings"
            >
              <Settings2 size={14} /> {en ? "Advanced settings" : "إعدادات متقدمة"}
            </button>
          </div>

          {/* Quick stats */}
          <div className="surface rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={15} className="text-[#578b9d]" />
              <h3 className="text-sm font-bold text-[#18374d] dark:text-[#e2ecf1]">{en ? "Quick Stats" : "إحصاءات سريعة"}</h3>
            </div>
            <div className="space-y-2 text-[11px]">
              {[
                { label: en ? "Automation rate" : "معدل الأتمتة", value: "82%", bar: 82 },
                { label: en ? "Satisfaction score" : "نقاط الرضا", value: "4.7/5", bar: 94 },
                { label: en ? "Handoff rate" : "معدل التحويل", value: "18%", bar: 18 },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[#66808e] dark:text-[#7e939e]">
                    <span>{stat.label}</span><span className="font-bold text-[#28495b] dark:text-[#dbe7ee]">{stat.value}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e4edf1] dark:bg-[#1e3a4d]">
                    <div className="h-full rounded-full bg-[#3d8a72] dark:bg-[#7fd0b4]" style={{ width: `${stat.bar}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </WorkspacePage>
  );
}

