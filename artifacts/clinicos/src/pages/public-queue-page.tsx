import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Clock3, Headphones, RefreshCw, ShieldCheck, UsersRound } from "lucide-react";
import { useLocation } from "wouter";

// This page intentionally has no clinic or patient identifier in the URL-facing UI.
// The production endpoint will resolve a short-lived opaque token server-side.
type QueueState = "waiting" | "called" | "completed" | "expired" | "unavailable";

type QueueProjection = {
  clinicName: string;
  branchName: string | null;
  userName: string;
  ticketLabel: string;
  state: QueueState;
  peopleAhead: number | null;
  estimatedWaitMinutes: number | null;
  updatedAt: number;
  supportAvailable: boolean;
};

const previewProjection: QueueProjection = {
  clinicName: "عيادة ميرونا",
  branchName: "الفرع الرئيسي",
  userName: "أحمد محمد",
  ticketLabel: "A-027",
  state: "waiting",
  peopleAhead: 3,
  estimatedWaitMinutes: 18,
  updatedAt: Date.now(),
  supportAvailable: true,
};

function formatRelativeUpdate(updatedAt: number, now: number) {
  const seconds = Math.max(0, Math.floor((now - updatedAt) / 1000));
  if (seconds < 10) return "تم التحديث الآن";
  if (seconds < 60) return `تم التحديث منذ ${seconds} ثانية`;
  const minutes = Math.floor(seconds / 60);
  return `تم التحديث منذ ${minutes} دقيقة`;
}

function StatusPanel({ projection }: { projection: QueueProjection }) {
  const [now, setNow] = useState(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const refreshPreview = () => {
    setRefreshing(true);
    window.setTimeout(() => {
      setNow(Date.now());
      setRefreshing(false);
    }, 450);
  };

  const progress = projection.peopleAhead === null ? 45 : projection.peopleAhead === 0 ? 100 : Math.max(16, Math.min(88, 100 - projection.peopleAhead * 16));
  const statusCopy = projection.state === "called"
    ? { label: "حان دورك", description: "من فضلك توجه إلى نقطة الاستقبال الآن.", tone: "success" }
    : projection.state === "completed"
      ? { label: "تم إنهاء الدور", description: "تم تسجيل انتهاء الزيارة لهذا الرقم.", tone: "success" }
      : ["cancelled", "expired", "unavailable"].includes(projection.state)
        ? { label: "الدور غير متاح", description: "تواصل مع استقبال العيادة للحصول على المساعدة.", tone: "danger" }
        : { label: "أنت في قائمة الانتظار", description: "سنحدّث حالتك تلقائيًا عندما يقترب دورك.", tone: "waiting" };

  return (
    <>
      <section className="queue-hero-card" aria-labelledby="queue-status-title">
        <div className="queue-hero-orbit queue-hero-orbit-one" aria-hidden="true" />
        <div className="queue-hero-orbit queue-hero-orbit-two" aria-hidden="true" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="queue-eyebrow">رقم الانتظار</p>
            <h1 id="queue-status-title" className="queue-ticket-number" dir="ltr">{projection.ticketLabel}</h1>
            <p className="queue-user-name">{projection.userName}</p>
          </div>
          <div className={`queue-status-dot ${statusCopy.tone}`} aria-label={statusCopy.label} />
        </div>
        <div className="relative z-10 mt-8">
          <p className="queue-status-label">{statusCopy.label}</p>
          <p className="queue-status-description">{statusCopy.description}</p>
        </div>
      </section>

      <section className="queue-metrics-grid" aria-label="ملخص الانتظار">
        <article className="queue-metric-card queue-metric-primary">
          <div className="queue-metric-icon"><UsersRound size={18} /></div>
          <span>أمامك الآن</span>
          <strong>{projection.peopleAhead ?? "—"}</strong>
          <small>أشخاص في الدور</small>
        </article>
        <article className="queue-metric-card">
          <div className="queue-metric-icon"><Clock3 size={18} /></div>
          <span>الانتظار المتوقع</span>
          <strong>{projection.estimatedWaitMinutes ?? "—"}</strong>
          <small>{projection.estimatedWaitMinutes === null ? "غير متاح حاليًا" : "دقيقة تقريبًا"}</small>
        </article>
      </section>

      <section className="queue-progress-card" aria-labelledby="queue-progress-title">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="queue-section-kicker">حالة الدور</p>
            <h2 id="queue-progress-title">مكانك بيتحدث تلقائيًا</h2>
          </div>
          <span className="queue-live-pill"><span /> مباشر</span>
        </div>
        <div className="queue-progress-track" aria-hidden="true">
          <div className="queue-progress-fill" style={{ width: `${progress}%` }} />
          <span className="queue-progress-marker" style={{ insetInlineStart: `${progress}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[hsl(var(--muted-foreground))]">
          <span>بداية الدور</span>
          <span>دورك الحالي</span>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e8eff1] pt-4">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">{formatRelativeUpdate(projection.updatedAt, now)}</span>
          <button type="button" className="queue-refresh-button" onClick={refreshPreview} disabled={refreshing} data-testid="button-queue-refresh">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "جارٍ التحديث..." : "تحديث الحالة"}
          </button>
        </div>
      </section>

      <section className="queue-notice-card">
        <div className="queue-notice-icon"><ShieldCheck size={18} /></div>
        <div>
          <h2>خصوصيتك محفوظة</h2>
          <p>هذه الصفحة تعرض حالة رقم الانتظار فقط، ولا تعرض اسمك أو بياناتك الطبية.</p>
        </div>
      </section>
      {projection.supportAvailable ? <a className="queue-support-link" href="tel:" onClick={(event) => event.preventDefault()}><Headphones size={15} /> تحتاج مساعدة؟ تواصل مع الاستقبال</a> : null}
    </>
  );
}

function QueueUnavailable({ reason }: { reason: "missing" | "production" | "error" }) {
  return (
    <main className="queue-public-shell" dir="rtl">
      <div className="queue-public-noise" aria-hidden="true" />
      <section className="queue-empty-state" role="status">
        <div className="queue-empty-icon"><AlertCircle size={25} /></div>
        <p className="queue-eyebrow">MERUNA SYSTEM</p>
        <h1>{reason === "missing" ? "رابط الانتظار غير مكتمل" : reason === "error" ? "تعذر تحديث حالة الدور" : "الرابط غير متاح حاليًا"}</h1>
        <p>{reason === "missing" ? "استخدم الرابط المرسل لك من العيادة كاملًا." : reason === "error" ? "حدث عطل مؤقت في الاتصال. حاول تحديث الصفحة بعد قليل." : "لم يتم تفعيل خدمة الكيو لهذا الرابط بعد. اطلب رابطًا جديدًا من الاستقبال."}</p>
        {reason === "error" ? <button type="button" className="queue-refresh-button mt-5" onClick={() => window.location.reload()}><RefreshCw size={14} /> إعادة المحاولة</button> : null}
      </section>
    </main>
  );
}

export default function PublicQueuePage() {
  const [location] = useLocation();
  const token = useMemo(() => location.split("/")[2]?.trim() ?? "", [location]);
  const localPreview = import.meta.env.DEV && token === "preview";
  const [projection, setProjection] = useState<QueueProjection | null>(localPreview ? previewProjection : null);
  const [loading, setLoading] = useState(!localPreview);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (localPreview || !token) return;
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(`/api/public/queue/${encodeURIComponent(token)}`, { credentials: "omit", cache: "no-store" });
        const payload = await response.json().catch(() => null) as Partial<QueueProjection> | null;
        if (!response.ok || !payload?.clinicName || !payload?.ticketLabel) throw new Error("queue unavailable");
        if (!active) return;
        setProjection({
          clinicName: payload.clinicName,
          branchName: payload.branchName ?? null,
          userName: payload.userName || "المستخدم",
          ticketLabel: payload.ticketLabel,
          state: payload.state || "unavailable",
          peopleAhead: typeof payload.peopleAhead === "number" ? payload.peopleAhead : null,
          estimatedWaitMinutes: typeof payload.estimatedWaitMinutes === "number" ? payload.estimatedWaitMinutes : null,
          updatedAt: typeof payload.updatedAt === "string" ? Date.parse(payload.updatedAt) || Date.now() : Number(payload.updatedAt) || Date.now(),
          supportAvailable: payload.supportAvailable === true,
        });
        setError(false);
      } catch {
        if (active) { setProjection(null); setError(true); }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(load, 15_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [localPreview, token]);

  if (!token) return <QueueUnavailable reason="missing" />;
  if (loading) return <main className="queue-public-shell" dir="rtl"><div className="queue-public-container"><div className="queue-empty-state" role="status"><RefreshCw className="animate-spin" size={25} /><p className="queue-eyebrow mt-4">MERUNA SYSTEM</p><h1>جارٍ تحميل حالة الدور</h1><p>نراجع بيانات الحجز الآمنة الآن.</p></div></div></main>;
  if (error || !projection) return <QueueUnavailable reason={error ? "error" : "production"} />;

  return (
    <main className="queue-public-shell" dir="rtl">
      <div className="queue-public-noise" aria-hidden="true" />
      <div className="queue-public-container">
        <header className="queue-public-header">
          <div className="queue-brand-mark" aria-hidden="true"><span /></div>
          <div className="min-w-0">
            <p className="queue-clinic-name">{projection.clinicName}</p>
            <p className="queue-branch-name">نظام الانتظار{projection.branchName ? ` · ${projection.branchName}` : ""}</p>
          </div>
          <span className="queue-secure-badge"><ShieldCheck size={13} /> آمن</span>
        </header>
        <div className="queue-preview-banner">معاينة محلية للتصميم — البيانات المعروضة شكلية ولن تظهر في الإنتاج.</div>
        <StatusPanel projection={projection} />
        <footer className="queue-public-footer">لا تحتاج إلى إبقاء الصفحة مفتوحة طوال الوقت؛ افتح الرابط مرة أخرى لمراجعة الحالة.<strong>تابع لـ MERUNA SYSTEM</strong></footer>
      </div>
    </main>
  );
}
