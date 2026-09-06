import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CalendarDays, CalendarPlus, CalendarRange, Check, Clock3, Copy, Hourglass, Link2, MessageCircle, Phone, Search, StickyNote, Stethoscope, Sun, UserRoundPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { usePreferences } from "@/lib/preferences";
import { WorkspaceEmptyState, WorkspaceErrorState, WorkspaceLoadingState, WorkspacePage, WorkspacePageHeader } from "@/components/workspace-page";
import { formatWallDate, formatWallTime } from "@/lib/datetime";

// غرفة عمليات الاستقبال: شاشة التشغيل اليومية الوحيدة لموظف الاستقبال — كل الحجوزات مجمعة باليوم
// مع تفاصيل المريض كاملة وإجراءات بنقرة واحدة. تُحمّل من GET /api/appointments/reception?window=all
// والأوقات تُعرض باتفاقية wall-clock-as-UTC عبر formatWallTime/formatWallDate.
type ReceptionBucket = "today" | "tomorrow" | "thisWeek" | "later" | "past";
type ReceptionCounts = { today: number; tomorrow: number; week: number; later: number; past: number };
type ReceptionItem = {
  id: string;
  bucket: string;
  scheduledAt: string | null;
  dayKey: string;
  status: string;
  patientId: string | null;
  patientName: string | null;
  patientPhone: string | null;
  patientAge: number | null;
  doctorId: string | null;
  doctorName: string | null;
  serviceId: string | null;
  serviceName: string | null;
  notes: string | null;
  bookingNumber: string | null;
  queueNumber: number | null;
  conversationId: string | null;
};
type ReceptionResponse = { timezone: string; counts: ReceptionCounts; items: ReceptionItem[] };
type ViewKey = "today" | "tomorrow" | "week" | "all";

const VIEW_CHIPS: Array<{ key: ViewKey; label: string }> = [
  { key: "today", label: "اليوم" },
  { key: "tomorrow", label: "غداً" },
  { key: "week", label: "هذا الأسبوع" },
  { key: "all", label: "الكل" },
];
const VIEW_BUCKET: Record<Exclude<ViewKey, "all">, string> = { today: "today", tomorrow: "tomorrow", week: "thisWeek" };
const BUCKET_RANK: Record<string, number> = { today: 0, tomorrow: 1, thisWeek: 2, later: 3, past: 4 };
const BUCKET_LABELS: Record<string, string> = { today: "اليوم", tomorrow: "غداً", thisWeek: "هذا الأسبوع", later: "لاحقاً", past: "سابقة" };

function statusLabels(): Record<string, string> {
  return { scheduled: "مجدول", confirmed: "مؤكد", checked_in: "وصل", completed: "مكتمل", cancelled: "ملغي", no_show: "لم يحضر", pending: "بانتظار التأكيد" };
}
function statusTone(status: string) { if (["checked_in", "completed"].includes(status)) return "bg-[#d9f0e8] text-[#176b58] dark:bg-[#123528] dark:text-[#7fd0b4]"; if (["scheduled", "confirmed", "pending"].includes(status)) return "bg-[#fff0d8] text-[#9a6513] dark:bg-[#3a2c14] dark:text-[#e0b46a]"; if (["cancelled", "no_show"].includes(status)) return "bg-[#f8dfdc] text-[#a64036] dark:bg-[#3d1f1b] dark:text-[#eb9a90]"; return "bg-[#dcecf5] text-[#22617d] dark:bg-[#143242] dark:text-[#8cc3dd]"; }

function StatCard({ icon, label, value, iconClass, accent }: { icon: ReactNode; label: string; value: string | number; iconClass: string; accent: string }) {
  return (
    <div className="surface relative overflow-hidden p-4" data-testid={`stat-reception-${label}`}>
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} aria-hidden />
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-[#66808e] dark:text-[#7e939e]">{label}</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-[#18374d] dark:text-[#e2ecf1]">{value}</p>
        </div>
        <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${iconClass}`}>{icon}</span>
      </div>
    </div>
  );
}

const EMPTY_FOR_VIEW: Record<ViewKey, { title: string; detail: string }> = {
  today: { title: "لا حجوزات اليوم", detail: "يوم هادئ — وقت مناسب لمتابعة المرضى وتجهيز جدول الغد." },
  tomorrow: { title: "لا حجوزات غداً", detail: "افتح شاشة المواعيد واحجز مواعيد الغد من هناك." },
  week: { title: "لا حجوزات هذا الأسبوع", detail: "المواعيد القادمة خلال الأسبوع ستظهر هنا تلقائياً." },
  all: { title: "لا حجوزات مسجلة", detail: "كل حجوزات العيادة القادمة والسابقة ستظهر في هذه الشاشة." },
};
const EMPTY_ICON_FOR_VIEW: Record<ViewKey, ReactNode> = {
  today: <Sun size={28} />,
  tomorrow: <CalendarClock size={28} />,
  week: <CalendarRange size={28} />,
  all: <CalendarDays size={28} />,
};

export function ReceptionPage() {
  const { language } = usePreferences();
  const queryClient = useQueryClient();
  const labels = statusLabels();
  const [view, setView] = useState<ViewKey>("today");
  const [query, setQuery] = useState("");
  const [issuedQueueLink, setIssuedQueueLink] = useState<{ id: string; url: string } | null>(null);

  const receptionQuery = useQuery({
    queryKey: ["reception"],
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      const response = await fetch("/api/appointments/reception?window=all", { credentials: "include", signal });
      const data = await response.json().catch(() => null) as (ReceptionResponse & { error?: string }) | null;
      if (!response.ok) throw new Error(data?.error || "تعذر تحميل حجوزات الاستقبال.");
      return data;
    },
    staleTime: 15_000,
  });
  const counts = receptionQuery.data?.counts;
  const items = receptionQuery.data?.items ?? [];

  const invalidateReception = () => { void queryClient.invalidateQueries({ queryKey: ["reception"] }); };
  const mutationError = (error: unknown, fallback: string) => toast.error(error instanceof Error && error.message ? error.message : fallback);

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/appointments/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ status: "confirmed" }) });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "تعذر تأكيد الموعد.");
      return payload;
    },
    onSuccess: () => { toast.success("تم تأكيد الموعد"); invalidateReception(); },
    onError: (error: unknown) => mutationError(error, "تعذر تأكيد الموعد."),
  });
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/appointments/${encodeURIComponent(id)}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({}) });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "تعذر إلغاء الموعد.");
      return payload;
    },
    onSuccess: () => { toast.success("تم إلغاء الموعد وتحرير الوقت"); invalidateReception(); },
    onError: (error: unknown) => mutationError(error, "تعذر إلغاء الموعد."),
  });
  const queueLinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/appointments/${encodeURIComponent(id)}/queue-link`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({}) });
      const payload = await response.json().catch(() => null) as { queuePath?: string; error?: string } | null;
      if (!response.ok || !payload?.queuePath) throw new Error(payload?.error || "تعذر إصدار رابط الكيو.");
      return new URL(payload.queuePath, window.location.origin).toString();
    },
    onSuccess: (url, id) => {
      setIssuedQueueLink({ id, url });
      void navigator.clipboard?.writeText(url).then(
        () => toast.success("تم إصدار رابط الكيو ونسخه"),
        () => toast.success("تم إصدار رابط الكيو؛ انسخه من الشريط الظاهر"),
      );
      invalidateReception();
    },
    onError: (error: unknown) => mutationError(error, "تعذر إصدار رابط الكيو."),
  });

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (view !== "all" && item.bucket !== VIEW_BUCKET[view]) return false;
      if (!needle) return true;
      return `${item.patientName ?? ""} ${item.patientPhone ?? ""}`.toLowerCase().includes(needle);
    });
  }, [items, view, query]);

  // تجميع باليوم عبر dayKey: صفوف كل يوم بترتيب الوقت، والأيام بترتيب الأقسام
  // اليوم ثم غداً ثم الأسبوع ثم لاحقاً ثم السابقة (الأحدث أولاً داخل السابقة).
  const dayGroups = useMemo(() => {
    const map = new Map<string, { dayKey: string; bucket: string; items: ReceptionItem[] }>();
    for (const item of filtered) {
      const dayKey = item.dayKey || "none";
      const group = map.get(dayKey) ?? { dayKey, bucket: item.bucket, items: [] };
      group.items.push(item);
      map.set(dayKey, group);
    }
    return Array.from(map.values())
      .map((group) => ({ ...group, items: [...group.items].sort((left, right) => (left.scheduledAt ?? "").localeCompare(right.scheduledAt ?? "")) }))
      .sort((left, right) => {
        const rankLeft = BUCKET_RANK[left.bucket] ?? 3;
        const rankRight = BUCKET_RANK[right.bucket] ?? 3;
        if (rankLeft !== rankRight) return rankLeft - rankRight;
        return left.bucket === "past" ? right.dayKey.localeCompare(left.dayKey) : left.dayKey.localeCompare(right.dayKey);
      });
  }, [filtered]);

  const dayHeaderLabel = (dayKey: string) => /^\d{4}-\d{2}-\d{2}$/.test(dayKey)
    ? formatWallDate(`${dayKey}T12:00:00Z`, language, { weekday: "long", day: "numeric", month: "long" })
    : "بدون تاريخ محدد";

  const searching = query.trim().length > 0;
  const emptyState = searching
    ? { title: "لا نتائج مطابقة للبحث", detail: "جرّب اسم المريض أو رقم الجوال، أو غيّر نطاق العرض." }
    : EMPTY_FOR_VIEW[view];
  const emptyIcon = searching ? <Search size={28} /> : EMPTY_ICON_FOR_VIEW[view];

  return <WorkspacePage>
    <WorkspacePageHeader
      eyebrow="التشغيل / الاستقبال"
      title="غرفة عمليات الاستقبال"
      description={receptionQuery.isLoading ? "جارٍ تحميل حجوزات العيادة..." : counts ? `${counts.today} حجز اليوم · ${counts.tomorrow} غداً · ${counts.week} هذا الأسبوع` : "كل الحجوزات والإجراءات من شاشة واحدة"}
      action={<div className="flex items-center gap-2">
        <Link href="/appointments" className="primary-button" data-testid="link-quick-book"><CalendarPlus size={17} /> حجز موعد</Link>
        <Link href="/patients" className="quiet-button" data-testid="link-quick-patient"><UserRoundPlus size={16} /> مريض جديد</Link>
      </div>}
    />

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard icon={<Sun size={20} />} label="اليوم" value={counts ? counts.today : "—"} iconClass="bg-[#fff0d8] text-[#9a6513] dark:bg-[#3a2c14] dark:text-[#e0b46a]" accent="bg-[#e0b46a]" />
      <StatCard icon={<CalendarClock size={20} />} label="غداً" value={counts ? counts.tomorrow : "—"} iconClass="bg-[#dcecf5] text-[#22617d] dark:bg-[#143242] dark:text-[#8cc3dd]" accent="bg-[#8cc3dd]" />
      <StatCard icon={<CalendarRange size={20} />} label="هذا الأسبوع" value={counts ? counts.week : "—"} iconClass="bg-[#d9f0e8] text-[#176b58] dark:bg-[#123528] dark:text-[#7fd0b4]" accent="bg-[#7fd0b4]" />
      <StatCard icon={<Hourglass size={20} />} label="لاحقاً" value={counts ? counts.later : "—"} iconClass="bg-[#f1f5f7] text-[#527080] dark:bg-[#10222f] dark:text-[#a8bfc9]" accent="bg-[#7e939e]" />
    </div>

    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="نطاق عرض الحجوزات">
      {VIEW_CHIPS.map((chip) => {
        const chipCount = chip.key === "all" ? items.length : counts ? counts[chip.key === "week" ? "week" : chip.key] : null;
        return <button key={chip.key} type="button" aria-pressed={view === chip.key} data-testid={`chip-view-${chip.key}`} onClick={() => setView(chip.key)} className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${view === chip.key ? "bg-[#3c7e93] text-white shadow-sm" : "border border-[#dbe5ea] text-[#66808e] hover:bg-[#f5f9fa] dark:border-[#1e3a4d] dark:text-[#7e939e] dark:hover:bg-[#10222f]"}`}>
          {chip.label}
          {typeof chipCount === "number" ? <span className={`rounded-full px-1.5 text-[10px] ${view === chip.key ? "bg-white/20" : "bg-[#e8f3f5] text-[#3c7e93] dark:bg-[#143242] dark:text-[#8cc3dd]"}`}>{chipCount}</span> : null}
        </button>;
      })}
      <div className="relative min-w-[220px] flex-1">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ca2ad] dark:text-[#7e939e]" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث باسم المريض أو رقم الجوال..." className="input-field pr-10" data-testid="input-reception-search" />
      </div>
    </div>

    {issuedQueueLink ? <div className="surface flex flex-wrap items-center gap-3 p-3 text-xs" data-testid="banner-queue-link">
      <Copy size={15} className="text-[#3c7e93] dark:text-[#a8bfc9]" />
      <span className="text-[#527080] dark:text-[#a8bfc9]">رابط الكيو جاهز:</span>
      <code className="min-w-0 flex-1 truncate" dir="ltr">{issuedQueueLink.url}</code>
      <button type="button" className="quiet-button" onClick={() => void navigator.clipboard?.writeText(issuedQueueLink.url).then(() => toast.success("تم نسخ الرابط"))}><Copy size={14} /> نسخ</button>
    </div> : null}

    <div className="surface overflow-hidden p-0" data-testid="reception-list">
      {receptionQuery.isLoading ? <WorkspaceLoadingState rows={6} /> : receptionQuery.isError ? <WorkspaceErrorState onRetry={() => receptionQuery.refetch()} /> : dayGroups.length ? <div>{dayGroups.map((group) => <section key={group.dayKey}>
        <header className="flex flex-wrap items-center gap-3 border-b border-[#edf1f3] bg-[#f7fbfc] px-5 py-3 dark:border-[#1e3a4d] dark:bg-[#10222f]">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-bl from-[#dcecf5] to-[#c4dde8] text-[#22617d] dark:from-[#143242] dark:to-[#0f2431] dark:text-[#8cc3dd]"><CalendarDays size={18} /></span>
          <h2 className="text-base font-extrabold text-[#18374d] dark:text-[#e2ecf1]" data-testid={`text-day-${group.dayKey}`}>{dayHeaderLabel(group.dayKey)}</h2>
          <span className="rounded-full bg-[#e8f3f5] px-2.5 py-1 text-[10px] font-bold text-[#3c7e93] dark:bg-[#143242] dark:text-[#8cc3dd]">{BUCKET_LABELS[group.bucket] ?? "مواعيد"}</span>
          <span className="text-[11px] font-bold text-[#8aa0aa] dark:text-[#7e939e]">{group.items.length} موعد</span>
        </header>
        {group.items.map((item) => <article key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#edf1f3] px-5 py-3.5 transition last:border-0 hover:bg-[#f5f9fa] dark:border-[#1e3a4d] dark:hover:bg-[#10222f]" data-testid={`row-reception-${item.id}`}>
          <span className="w-[76px] shrink-0 font-mono text-xl font-extrabold tracking-tight text-[#18374d] dark:text-[#e0b46a]" dir="ltr">{formatWallTime(item.scheduledAt, language)}</span>
          <div className="min-w-[210px] flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link href={`/patients/${item.patientId ?? ""}`} className="text-sm font-extrabold text-[#28495b] hover:text-[#3c7e93] hover:underline dark:text-[#e2ecf1] dark:hover:text-[#8cc3dd]" data-testid={`link-patient-${item.id}`}>{item.patientName || "مريض"}</Link>
              {typeof item.patientAge === "number" ? <span className="rounded-full bg-[#f1f5f7] px-2 py-0.5 text-[10px] font-bold text-[#527080] dark:bg-[#10222f] dark:text-[#a8bfc9]">{item.patientAge} سنة</span> : null}
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${statusTone(item.status)}`}>{labels[item.status] ?? item.status}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#526b78] dark:text-[#7e939e]">
              {item.patientPhone ? <a href={`tel:${item.patientPhone}`} dir="ltr" className="inline-flex items-center gap-1 font-bold hover:text-[#3c7e93] dark:hover:text-[#8cc3dd]" data-testid={`link-phone-${item.id}`}><Phone size={12} /> {item.patientPhone}</a> : null}
              {item.doctorName ? <span className="inline-flex items-center gap-1"><Stethoscope size={12} /> {item.doctorName}</span> : null}
              {item.serviceName ? <span>{item.serviceName}</span> : null}
              {item.bookingNumber ? <span>رقم الحجز: {item.bookingNumber}</span> : null}
              {item.queueNumber != null ? <span>الكيو: {item.queueNumber}</span> : null}
            </div>
            {item.notes ? <p title={item.notes} className="mt-1 flex max-w-md items-center gap-1 truncate text-[11px] text-[#8aa0aa] dark:text-[#7e939e]"><StickyNote size={12} className="shrink-0" /> {item.notes}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {item.status === "pending" ? <button type="button" className="quiet-button" aria-label="تأكيد الموعد" disabled={confirmMutation.isPending} onClick={() => confirmMutation.mutate(item.id)} data-testid={`button-confirm-${item.id}`}><Check size={15} /> تأكيد</button> : null}
            <button type="button" className="quiet-button" aria-label="إصدار رابط الكيو" disabled={queueLinkMutation.isPending && queueLinkMutation.variables === item.id} onClick={() => queueLinkMutation.mutate(item.id)} data-testid={`button-queue-link-${item.id}`}><Link2 size={15} /> رابط الكيو</button>
            <Link href="/inbox" className="quiet-button" aria-label="فتح المحادثات" data-testid={`link-message-${item.id}`}><MessageCircle size={15} /> رسالة</Link>
            <Link href={`/appointments/${item.id}`} className="quiet-button" aria-label="رحلة الموعد" data-testid={`link-journey-${item.id}`}><Clock3 size={15} /> الرحلة</Link>
            {item.status !== "cancelled" ? <button type="button" className="quiet-button text-[#ad514a] dark:text-[#eb9a90]" aria-label="إلغاء الموعد" disabled={cancelMutation.isPending} onClick={() => { if (window.confirm(`إلغاء موعد ${item.patientName || "المريض"}؟ سيتم تحرير الوقت المتاح.`)) cancelMutation.mutate(item.id); }} data-testid={`button-cancel-${item.id}`}><X size={15} /> إلغاء</button> : null}
          </div>
        </article>)}
      </section>)}</div> : <WorkspaceEmptyState icon={emptyIcon} title={emptyState.title} detail={emptyState.detail} />}
    </div>
  </WorkspacePage>;
}
