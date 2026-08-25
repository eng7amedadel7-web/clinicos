import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, CheckCircle2, Clock3, Phone, PhoneCall, RefreshCw, Volume2 } from "lucide-react";
import { getVoiceAgentData, type VoiceAgentCall } from "@/lib/operations-api";

const clinicTimeZone = "Asia/Riyadh";

function dateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short", timeZone: clinicTimeZone }).format(date);
}

function duration(seconds?: number | null) {
  if (typeof seconds !== "number" || seconds < 0) return "—";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function statusLabel(status: VoiceAgentCall["call_status"]) {
  const labels: Record<VoiceAgentCall["call_status"], string> = {
    queued: "في الانتظار",
    ringing: "يرن الآن",
    in_progress: "جارية",
    completed: "مكتملة",
    missed: "لم يتم الرد",
    failed: "فشلت",
    cancelled: "ملغاة",
  };
  return labels[status] ?? status;
}

function statusTone(status: VoiceAgentCall["call_status"]) {
  if (status === "completed") return "bg-[#d9f0e8] text-[#176b58]";
  if (["missed", "failed", "cancelled"].includes(status)) return "bg-[#f8dfdc] text-[#a64036]";
  return "bg-[#fff0d8] text-[#9a6513]";
}

function PageHeader({ description, onRefresh, isFetching }: { description: string; onRefresh: () => void; isFetching: boolean }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-1.5 text-[11px] font-bold text-[#3c7e93]">الأتمتة / voice agent</p>
        <h1 className="text-[27px] font-extrabold tracking-tight text-[#18374d] md:text-[31px]">الوكيل الصوتي</h1>
        <p className="mt-1 text-[13px] text-[#718591]">{description}</p>
      </div>
      <button onClick={onRefresh} disabled={isFetching} className="quiet-button" data-testid="button-refresh-voice-agent">
        <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} /> تحديث البيانات
      </button>
    </div>
  );
}

function Metric({ label, value, helper, icon: Icon, tone }: { label: string; value: string; helper: string; icon: typeof Phone; tone: string }) {
  return (
    <article className="surface animate-rise p-5">
      <div className="mb-5 flex items-start justify-between"><span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon size={18} /></span><Activity size={16} className="text-[#aac0c8]" /></div>
      <p className="text-2xl font-extrabold text-[#18374d]">{value}</p>
      <p className="mt-1 text-xs font-bold text-[#527080]">{label}</p>
      <p className="mt-2 text-[11px] text-[#8a9ba4]">{helper}</p>
    </article>
  );
}

function LoadingState() {
  return <div className="surface space-y-3 p-6"><div className="skeleton h-20 w-full" /><div className="skeleton h-14 w-full" /><div className="skeleton h-14 w-full" /></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="surface flex min-h-[250px] flex-col items-center justify-center p-10 text-center"><PhoneCall className="mb-3 text-[#9cb2ba]" size={28} /><p className="text-sm font-bold text-[#527080]">{text}</p><p className="mt-1 text-xs text-[#8a9ba4]">ستظهر المكالمات هنا عند تسجيلها من مزود الصوت.</p></div>;
}

export default function LiveVoiceAgentPage() {
  const query = useQuery({ queryKey: ["operations", "voice-agent"], queryFn: ({ signal }) => getVoiceAgentData(signal), staleTime: 15_000, refetchInterval: 60_000, refetchIntervalInBackground: false });
  const data = query.data;
  const calls = data?.calls ?? [];
  const completed = calls.filter((call) => call.call_status === "completed").length;
  const attention = calls.filter((call) => ["missed", "failed"].includes(call.call_status)).length;
  const agentActive = data?.configuration?.status === "active";

  return (
    <section className="mx-auto max-w-[1200px]">
      <PageHeader description={data ? "بيانات الوكيل وسجل المكالمات من Supabase" : "إدارة الوكيل الصوتي وسجل المكالمات"} onRefresh={() => query.refetch()} isFetching={query.isFetching} />
      {query.isLoading ? <LoadingState /> : query.isError ? <div className="surface flex min-h-[260px] flex-col items-center justify-center p-10 text-center"><AlertTriangle className="mb-3 text-[#a64036]" /><p className="text-sm font-bold text-[#18374d]">تعذر تحميل بيانات الوكيل الصوتي</p><button className="primary-button mt-5" onClick={() => query.refetch()}><RefreshCw size={15} /> إعادة المحاولة</button></div> : (
        <>
          <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl bg-[#0c2b41] p-6 text-[#edf7f8] shadow-[0_16px_32px_rgba(17,55,74,.12)] md:flex-row md:items-center md:p-7">
            <div className="flex items-center gap-4"><span className={`grid size-12 place-items-center rounded-2xl ${agentActive ? "bg-[#66a898] text-white" : "bg-white/10 text-white/60"}`}><PhoneCall size={23} /></span><div><p className="text-[11px] font-bold text-[#9ec8d3]">حالة الوكيل</p><h2 className="mt-1 text-lg font-extrabold">{data?.configuration?.display_name || "MERUNA Voice Agent"}</h2><p className="mt-1 text-xs text-[#aac1ca]">{agentActive ? "متصل وجاهز لاستقبال المكالمات" : "غير مفعّل حاليًا"}</p></div></div>
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${agentActive ? "bg-[#d9f0e8] text-[#176b58]" : "bg-white/10 text-white/70"}`}><span className={`size-2 rounded-full ${agentActive ? "bg-[#3d8a72]" : "bg-[#9aaeb5]"}`} />{agentActive ? "نشط" : "غير نشط"}</span>
          </div>
          <div className="mb-6 grid gap-4 sm:grid-cols-3"><Metric label="إجمالي المكالمات" value={String(data?.total ?? 0)} helper="من سجل Voice Agent" icon={Phone} tone="bg-[#dcecf5] text-[#22617d]" /><Metric label="مكالمات مكتملة" value={String(completed)} helper="تم تسجيل نتيجتها" icon={CheckCircle2} tone="bg-[#d9f0e8] text-[#176b58]" /><Metric label="تحتاج مراجعة" value={String(attention)} helper="لم يتم الرد أو فشلت" icon={AlertTriangle} tone="bg-[#f8dfdc] text-[#a64036]" /></div>
          <div className="mb-6 grid gap-4 md:grid-cols-3"><div className="surface p-5"><div className="flex items-center gap-2 text-xs font-bold text-[#527080]"><Volume2 size={16} className="text-[#3c7e93]" /> اللغة الافتراضية</div><p className="mt-3 text-sm font-extrabold text-[#18374d]">{data?.operationalSettings?.default_language || data?.configuration?.language_code || "—"}</p></div><div className="surface p-5"><div className="flex items-center gap-2 text-xs font-bold text-[#527080]"><Clock3 size={16} className="text-[#3c7e93]" /> التوفر</div><p className="mt-3 text-sm font-extrabold text-[#18374d]">{data?.operationalSettings?.availability || "—"}</p></div><div className="surface p-5"><div className="flex items-center gap-2 text-xs font-bold text-[#527080]"><PhoneCall size={16} className="text-[#3c7e93]" /> سلوك المكالمة</div><p className="mt-3 text-sm font-extrabold text-[#18374d]">{data?.operationalSettings?.default_call_behavior || "—"}</p></div></div>
          {calls.length ? <div className="surface overflow-hidden p-0"><div className="flex items-center justify-between border-b border-[#edf1f3] px-5 py-4"><div><h2 className="text-sm font-extrabold text-[#18374d]">المكالمات الأخيرة</h2><p className="mt-1 text-[11px] text-[#8496a0]">سجل مرتبط بالعيادة الحالية فقط</p></div><Phone size={17} className="text-[#789daa]" /></div><div>{calls.map((call) => <div key={call.id} className="flex flex-wrap items-center gap-4 border-b border-[#edf1f3] px-5 py-4 last:border-0"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#dcecf5] text-[#22617d]"><Phone size={17} /></span><div className="min-w-[180px] flex-1"><strong className="block text-xs text-[#28495b]">{call.patientName || "مكالمة غير مرتبطة بملف مريض"}</strong><span className="mt-1 block text-[10px] text-[#8496a0]">{call.direction === "inbound" ? "مكالمة واردة" : call.direction === "outbound" ? "مكالمة صادرة" : "مكالمة اختبار"} · {dateTime(call.started_at || call.created_at)}</span></div><span className="text-[10px] text-[#8496a0]">{duration(call.duration_seconds)}</span><span className={`rounded-md px-2 py-1 text-[10px] font-bold ${statusTone(call.call_status)}`}>{statusLabel(call.call_status)}</span></div>)}</div></div> : <EmptyState text="لا توجد مكالمات مسجلة في هذه العيادة." />}
        </>
      )}
    </section>
  );
}
