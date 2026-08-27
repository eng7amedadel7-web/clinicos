import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Clock3, Headphones, Languages, RefreshCw, ShieldCheck, UsersRound } from "lucide-react";
import { useLocation } from "wouter";
import { BrandMark } from "@/components/brand";

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

type Lang = "ar" | "en";

function readLang(): Lang {
  return window.localStorage.getItem("meruna-language") === "en" ? "en" : "ar";
}

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

function formatRelativeUpdate(updatedAt: number, now: number, en: boolean) {
  const seconds = Math.max(0, Math.floor((now - updatedAt) / 1000));
  if (seconds < 10) return en ? "Updated just now" : "تم التحديث الآن";
  if (seconds < 60) return en ? `Updated ${seconds}s ago` : `تم التحديث منذ ${seconds} ثانية`;
  const minutes = Math.floor(seconds / 60);
  return en ? `Updated ${minutes}m ago` : `تم التحديث منذ ${minutes} دقيقة`;
}

function StatusPanel({ projection, en }: { projection: QueueProjection; en: boolean }) {
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
    ? { label: en ? "It's your turn" : "حان دورك", description: en ? "Please head to the reception point now." : "من فضلك توجه إلى نقطة الاستقبال الآن.", tone: "success" }
    : projection.state === "completed"
      ? { label: en ? "Turn completed" : "تم إنهاء الدور", description: en ? "The visit for this number has been closed." : "تم تسجيل انتهاء الزيارة لهذا الرقم.", tone: "success" }
      : ["cancelled", "expired", "unavailable"].includes(projection.state)
        ? { label: en ? "Turn unavailable" : "الدور غير متاح", description: en ? "Contact the clinic reception for assistance." : "تواصل مع استقبال العيادة للحصول على المساعدة.", tone: "danger" }
        : { label: en ? "You are in the queue" : "أنت في قائمة الانتظار", description: en ? "We will update your status automatically as your turn approaches." : "سنحدّث حالتك تلقائيًا عندما يقترب دورك.", tone: "waiting" };

  return (
    <>
      <section className="queue-hero-card" aria-labelledby="queue-status-title">
        <div className="queue-hero-orbit queue-hero-orbit-one" aria-hidden="true" />
        <div className="queue-hero-orbit queue-hero-orbit-two" aria-hidden="true" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="queue-eyebrow">{en ? "Queue number" : "رقم الانتظار"}</p>
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

      <section className="queue-metrics-grid" aria-label={en ? "Waiting summary" : "ملخص الانتظار"}>
        <article className="queue-metric-card queue-metric-primary">
          <div className="queue-metric-icon"><UsersRound size={18} /></div>
          <span>{en ? "Ahead of you" : "أمامك الآن"}</span>
          <strong>{projection.peopleAhead ?? "—"}</strong>
          <small>{en ? "people in line" : "أشخاص في الدور"}</small>
        </article>
        <article className="queue-metric-card">
          <div className="queue-metric-icon"><Clock3 size={18} /></div>
          <span>{en ? "Estimated wait" : "الانتظار المتوقع"}</span>
          <strong>{projection.estimatedWaitMinutes ?? "—"}</strong>
          <small>{projection.estimatedWaitMinutes === null ? (en ? "Not available right now" : "غير متاح حاليًا") : (en ? "minutes approximately" : "دقيقة تقريبًا")}</small>
        </article>
      </section>

      <section className="queue-progress-card" aria-labelledby="queue-progress-title">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="queue-section-kicker">{en ? "Turn status" : "حالة الدور"}</p>
            <h2 id="queue-progress-title">{en ? "Your place updates automatically" : "مكانك بيتحدث تلقائيًا"}</h2>
          </div>
          <span className="queue-live-pill"><span /> {en ? "Live" : "مباشر"}</span>
        </div>
        <div className="queue-progress-track" aria-hidden="true">
          <div className="queue-progress-fill" style={{ width: `${progress}%` }} />
          <span className="queue-progress-marker" style={{ insetInlineStart: `${progress}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[hsl(var(--muted-foreground))]">
          <span>{en ? "Start of line" : "بداية الدور"}</span>
          <span>{en ? "Your current turn" : "دورك الحالي"}</span>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e8eff1] pt-4 dark:border-[#1e3a4d]">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">{formatRelativeUpdate(projection.updatedAt, now, en)}</span>
          <button type="button" className="queue-refresh-button" onClick={refreshPreview} disabled={refreshing} data-testid="button-queue-refresh">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? (en ? "Updating..." : "جارٍ التحديث...") : (en ? "Refresh status" : "تحديث الحالة")}
          </button>
        </div>
      </section>

      <section className="queue-notice-card">
        <div className="queue-notice-icon"><ShieldCheck size={18} /></div>
        <div>
          <h2>{en ? "Your privacy is protected" : "خصوصيتك محفوظة"}</h2>
          <p>{en ? "This page only shows the queue number status — never your name or medical data." : "هذه الصفحة تعرض حالة رقم الانتظار فقط، ولا تعرض اسمك أو بياناتك الطبية."}</p>
        </div>
      </section>
      {projection.supportAvailable ? <a className="queue-support-link" href="tel:" onClick={(event) => event.preventDefault()}><Headphones size={15} /> {en ? "Need help? Contact reception" : "تحتاج مساعدة؟ تواصل مع الاستقبال"}</a> : null}
    </>
  );
}

function QueueUnavailable({ reason, en }: { reason: "missing" | "production" | "error"; en: boolean }) {
  return (
    <main className="queue-public-shell" dir="rtl">
      <div className="queue-public-noise" aria-hidden="true" />
      <section className="queue-empty-state" role="status">
        <div className="queue-empty-icon"><AlertCircle size={25} /></div>
        <p className="queue-eyebrow">MERUNA</p>
        <h1>{reason === "missing" ? (en ? "Incomplete queue link" : "رابط الانتظار غير مكتمل") : reason === "error" ? (en ? "Could not refresh the turn status" : "تعذر تحديث حالة الدور") : (en ? "This link is not available right now" : "الرابط غير متاح حاليًا")}</h1>
        <p>{reason === "missing" ? (en ? "Use the full link sent to you by the clinic." : "استخدم الرابط المرسل لك من العيادة كاملًا.") : reason === "error" ? (en ? "A temporary connection issue occurred. Try refreshing the page shortly." : "حدث عطل مؤقت في الاتصال. حاول تحديث الصفحة بعد قليل.") : (en ? "The queue service is not active for this link yet. Request a new link from reception." : "لم يتم تفعيل خدمة الكيو لهذا الرابط بعد. اطلب رابطًا جديدًا من الاستقبال.")}</p>
        {reason === "error" ? <button type="button" className="queue-refresh-button mt-5" onClick={() => window.location.reload()}><RefreshCw size={14} /> {en ? "Retry" : "إعادة المحاولة"}</button> : null}
      </section>
    </main>
  );
}

export default function PublicQueuePage() {
  const [location] = useLocation();
  const [lang, setLang] = useState<Lang>(() => readLang());
  const en = lang === "en";
  const token = useMemo(() => location.split("/")[2]?.trim() ?? "", [location]);
  const localPreview = import.meta.env.DEV && token === "preview";
  const [projection, setProjection] = useState<QueueProjection | null>(localPreview ? previewProjection : null);
  const [loading, setLoading] = useState(!localPreview);
  const [error, setError] = useState(false);

  const toggleLang = () => {
    const next: Lang = en ? "ar" : "en";
    window.localStorage.setItem("meruna-language", next);
    setLang(next);
  };

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
          userName: payload.userName || (en ? "User" : "المستخدم"),
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

  if (!token) return <QueueUnavailable reason="missing" en={en} />;
  if (loading) return <main className="queue-public-shell" dir="rtl"><div className="queue-public-container"><div className="queue-empty-state" role="status"><RefreshCw className="animate-spin" size={25} /><p className="queue-eyebrow mt-4">MERUNA</p><h1>{en ? "Loading turn status" : "جارٍ تحميل حالة الدور"}</h1><p>{en ? "Checking the secure booking data now." : "نراجع بيانات الحجز الآمنة الآن."}</p></div></div></main>;
  if (error || !projection) return <QueueUnavailable reason={error ? "error" : "production"} en={en} />;

  return (
    <main className="queue-public-shell" dir="rtl">
      <div className="queue-public-noise" aria-hidden="true" />
      <div className="queue-public-container">
        <header className="queue-public-header">
          <BrandMark size={34} />
          <div className="min-w-0">
            <p className="queue-clinic-name">{projection.clinicName}</p>
            <p className="queue-branch-name">{en ? "Queue system" : "نظام الانتظار"}{projection.branchName ? ` · ${projection.branchName}` : ""}</p>
          </div>
          <button type="button" onClick={toggleLang} className="queue-lang-button" aria-label={en ? "Switch language" : "تبديل اللغة"}><Languages size={14} /> {en ? "ع" : "EN"}</button>
          <span className="queue-secure-badge"><ShieldCheck size={13} /> {en ? "Secure" : "آمن"}</span>
        </header>
        {localPreview ? <div className="queue-preview-banner">{en ? "Local design preview — the data shown is illustrative and will not appear in production." : "معاينة محلية للتصميم — البيانات المعروضة شكلية ولن تظهر في الإنتاج."}</div> : null}
        <StatusPanel projection={projection} en={en} />
        <footer className="queue-public-footer">{en ? "You don't need to keep this page open; reopen the link anytime to check your status." : "لا تحتاج إلى إبقاء الصفحة مفتوحة طوال الوقت؛ افتح الرابط مرة أخرى لمراجعة الحالة."}<strong>{en ? "Powered by MERUNA" : "تابع لـ MERUNA"}</strong></footer>
      </div>
    </main>
  );
}
