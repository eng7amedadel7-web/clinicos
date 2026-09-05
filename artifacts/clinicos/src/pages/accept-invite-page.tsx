import { useEffect, useState } from "react";
import { AlertCircle, Languages, LogIn, RefreshCw, ShieldCheck, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { BrandMark } from "@/components/brand";

type Lang = "ar" | "en";

function readLang(): Lang {
  return window.localStorage.getItem("meruna-language") === "en" ? "en" : "ar";
}

type InvitePreview = { clinicName: string; email: string; role: string; expiresAt?: string | null };

const inviteRoleLabels: Record<string, { en: string; ar: string }> = {
  owner: { en: "Clinic owner", ar: "مالك العيادة" },
  admin: { en: "Admin", ar: "مدير" },
  staff: { en: "Staff", ar: "موظف" },
};

// Public page (no session): verifies the single-use invite token server-side,
// shows the clinic/role preview, then accepts the invite and sends the user to
// the regular login flow. Follows the public-queue-page conventions because
// this route renders outside PreferencesProvider.
export default function AcceptInvitePage() {
  const [lang, setLang] = useState<Lang>(readLang);
  const en = lang === "en";
  const [, setLocation] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token")?.trim() ?? "";
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const response = await fetch(`/api/accept-invite/preview?token=${encodeURIComponent(token)}`, { credentials: "include" });
        const payload = await response.json().catch(() => null) as (InvitePreview & { error?: string }) | null;
        if (!active) return;
        if (!response.ok || !payload || payload.error) {
          setError(payload?.error || (en ? "This invite link is invalid." : "رابط الدعوة غير صالح."));
          setPreview(null);
        } else {
          setPreview(payload);
        }
      } catch {
        if (active) setError(en ? "Could not verify the invite. Try again." : "تعذر التحقق من رابط الدعوة. حاول مرة أخرى.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const toggleLang = () => {
    const next: Lang = lang === "ar" ? "en" : "ar";
    setLang(next);
    window.localStorage.setItem("meruna-language", next);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || submitting) return;
    if (password.length < 8) {
      setError(en ? "Password must be at least 8 characters." : "كلمة المرور 8 أحرف على الأقل.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/accept-invite", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const payload = await response.json().catch(() => null) as { message?: string; error?: string } | null;
      if (!response.ok || !payload || payload.error) {
        setError(payload?.error || (en ? "Could not accept the invite." : "تعذر قبول الدعوة."));
        return;
      }
      const message = payload.message || (en ? "You have been added to the clinic. You can sign in now." : "تمت إضافتك إلى العيادة بنجاح. يمكنك تسجيل الدخول الآن.");
      setSuccessMessage(message);
      toast.success(message);
      window.setTimeout(() => setLocation("/login"), 2200);
    } catch {
      setError(en ? "Could not accept the invite. Try again." : "تعذر قبول الدعوة. حاول مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabel = preview ? inviteRoleLabels[preview.role]?.[en ? "en" : "ar"] || preview.role : "";

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#eef3f7] p-6 dark:bg-[#0b1824]" dir="rtl">
      <div className="w-full max-w-[520px]">
        <header className="mb-6 flex items-center justify-between gap-3">
          <BrandMark size={34} />
          <button type="button" onClick={toggleLang} className="toolbar-button" aria-label={en ? "Switch language" : "تبديل اللغة"}>
            <Languages size={14} /> {en ? "ع" : "EN"}
          </button>
        </header>
        <section className="surface rounded-2xl p-8 md:p-10" data-testid="card-accept-invite">
          {loading ? (
            <div className="py-10 text-center" role="status" data-testid="state-invite-loading">
              <RefreshCw size={26} className="mx-auto animate-spin text-[#528b9b]" />
              <p className="mt-4 text-xs text-[#8999a1] dark:text-[#7e939e]">{en ? "Verifying the invite link..." : "جارٍ التحقق من رابط الدعوة..."}</p>
            </div>
          ) : successMessage ? (
            <div className="py-6 text-center" data-testid="state-invite-success">
              <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-[#f2faf6] text-[#39755f] dark:bg-[#123528] dark:text-[#7fd0b4]"><ShieldCheck size={26} /></div>
              <p className="text-sm font-bold leading-7 text-[#23475b] dark:text-[#e2ecf1]">{successMessage}</p>
              <button type="button" className="primary-button mt-6" onClick={() => setLocation("/login")} data-testid="button-invite-login"><LogIn size={16} /> {en ? "Go to sign in" : "تسجيل الدخول الآن"}</button>
            </div>
          ) : !token || error ? (
            <div className="py-6 text-center" data-testid="state-invite-error">
              <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-[#fff7f6] text-[#a54c46] dark:bg-[#3d1f1b] dark:text-[#eb9a90]"><AlertCircle size={26} /></div>
              <p className="text-sm font-bold leading-7 text-[#23475b] dark:text-[#e2ecf1]">{error || (en ? "The invite link is missing its token." : "رابط الدعوة لا يحتوي على توكن صالح.")}</p>
              <p className="mt-2 text-xs leading-6 text-[#8999a1] dark:text-[#7e939e]">{en ? "Ask the clinic owner for a fresh invite link." : "اطلب من مالك العيادة رابط دعوة جديدًا."}</p>
              <button type="button" className="primary-button mt-6" onClick={() => setLocation("/login")}><LogIn size={16} /> {en ? "Go to sign in" : "تسجيل الدخول"}</button>
            </div>
          ) : preview ? (
            <div>
              <div className="text-center">
                <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-[#dcebef] text-[#3c7e93] dark:bg-[#143242] dark:text-[#8cc3dd]"><UserPlus size={26} /></div>
                <h1 className="text-lg font-bold text-[#23475b] dark:text-[#e2ecf1]" data-testid="text-invite-clinic">{preview.clinicName || (en ? "Clinic invitation" : "دعوة انضمام لعيادة")}</h1>
                <p className="mt-2 text-sm leading-7 text-[#527080] dark:text-[#a8bfc9]" data-testid="text-invite-details">
                  {en
                    ? `You have been invited to join as ${roleLabel}.`
                    : `تمت دعوتك للانضمام إلى العيادة بدور ${roleLabel}.`}
                </p>
                <p className="mt-1 text-xs text-[#8999a1] dark:text-[#7e939e]" dir="ltr">{preview.email}</p>
              </div>
              <form onSubmit={(event) => void submit(event)} className="mt-7 space-y-4">
                <label className="block text-right">
                  <span className="mb-2 block text-[.78rem] font-bold text-slate-700 dark:text-slate-200">{en ? "Set a password (for new accounts)" : "كلمة المرور (للحسابات الجديدة)"}</span>
                  <input
                    required
                    type="password"
                    dir="ltr"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="input-field"
                    data-testid="input-invite-password"
                  />
                  <span className="mt-2 block text-[10px] leading-5 text-[#8999a1] dark:text-[#7e939e]">
                    {en
                      ? "If this email already has an account, you will be added to the clinic without changing your current password."
                      : "إذا كان لهذا البريد حساب بالفعل، فستُضاف إلى العيادة دون تغيير كلمة مرورك الحالية."}
                  </span>
                </label>
                {error ? <div className="rounded-xl border border-[#edc4c0] dark:border-[#3d1f1b] bg-[#fff7f6] dark:bg-[#3d1f1b] p-3 text-xs text-[#a54c46] dark:text-[#eb9a90]" role="alert" data-testid="alert-invite-error">{error}</div> : null}
                <button type="submit" className="primary-button w-full" disabled={submitting} data-testid="button-accept-invite">
                  <UserPlus size={16} /> {submitting ? (en ? "Accepting..." : "جارٍ قبول الدعوة...") : (en ? "Accept invite" : "قبول الدعوة")}
                </button>
              </form>
            </div>
          ) : null}
        </section>
        <footer className="mt-6 text-center text-[10px] font-bold uppercase tracking-[.2em] text-[#75a0ae]">MERUNA</footer>
      </div>
    </main>
  );
}
