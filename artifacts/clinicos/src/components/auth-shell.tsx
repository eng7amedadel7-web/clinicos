import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Globe, ShieldCheck, X } from 'lucide-react';
import { BrandMark } from '@/components/brand';
import type { AuthErrorKey } from '@/lib/api-errors';

// Shared identity for every auth surface (login, register, password recovery,
// admin gate): pinned split layout — brand panel left, form right — with the
// light form styling and ambient motion. Pages provide only their own copy.
// Text direction follows the active language; the panel geometry stays pinned.

export type AuthLanguage = 'ar' | 'en';
export type GreetingKey = 'morning' | 'afternoon' | 'evening';

type SharedAuthText = {
  language: string;
  home: string;
  greetings: Record<GreetingKey, string>;
  brand: { badge: string; headline: string; sub: string; privacy: string; copyright: string };
  footer: { status: string; healthy: string; degraded: string; secure: string };
  errors: Record<AuthErrorKey | 'generic', string>;
};

export const sharedAuthCopy: Record<AuthLanguage, SharedAuthText> = {
  ar: {
    language: 'English',
    home: 'الرئيسية',
    greetings: { morning: 'صباح الخير', afternoon: 'مساء الخير', evening: 'مساء الخير' },
    brand: {
      badge: 'منصة موثوقة لعيادتك',
      headline: 'كل ما تحتاجه عيادتك، في مكان واحد.',
      sub: 'MERUNA يمنح أصحاب العيادات رؤية أوضح، وقرارات أسرع، وتجربة أفضل لكل مريض.',
      privacy: 'خصوصيتك أولًا',
      copyright: 'Meruna Clinicos',
    },
    footer: {
      status: 'النظام يعمل بكفاءة 24/7',
      healthy: 'الخادم يعمل بكفاءة',
      degraded: 'الخدمة تواجه بطئًا مؤقتًا',
      secure: 'اتصال آمن ومشفّر 256-bit',
    },
    errors: {
      invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      notAssigned: 'هذا الحساب غير مرتبط بعيادة نشطة بصلاحية مالك أو مدير. تواصل مع الدعم إذا كان هذا خطأ.',
      sessionSetup: 'تعذر إنشاء الجلسة بنجاح. حاول مرة أخرى.',
      authUnavailable: 'خدمة الدخول غير متاحة مؤقتًا. حاول مرة أخرى بعد قليل.',
      rateLimited: 'خدمة الدخول تواجه ضغطًا مؤقتًا. انتظر قليلًا ثم حاول مجددًا.',
      tooManyAttempts: 'محاولات كثيرة جدًا. انتظر بضع دقائق ثم حاول مجددًا.',
      tooManyRecovery: 'طلبات استعادة كثيرة جدًا. حاول مرة أخرى لاحقًا.',
      recoveryUnavailable: 'تعذر إرسال بريد الاستعادة مؤقتًا. حاول مرة أخرى.',
      invalidRecoveryLink: 'رابط الاستعادة غير صالح أو منتهي الصلاحية. اطلب رابطًا جديدًا.',
      sessionExpired: 'انتهت صلاحية جلستك. سجّل الدخول من جديد.',
      emailExists: 'هذا البريد الإلكتروني مسجل مسبقًا في النظام. سجّل الدخول أو استخدم بريدًا آخر.',
      invalidRegisterDetails: 'تأكد من البيانات: الاسم الكامل، اسم العيادة، بريد صحيح، وكلمة مرور من 8 أحرف أو أكثر.',
      confirmEmail: 'تم إنشاء الحساب. راجع بريدك الإلكتروني لتأكيده ثم سجّل الدخول.',
      onboardingFailed: 'تم إنشاء الحساب لكن لم يكتمل إعداد ملف العيادة. تواصل مع الدعم لإكمال التفعيل.',
      networkError: 'تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت وحاول مجددًا.',
      generic: 'تعذر إتمام الطلب مؤقتًا. يرجى المحاولة مرة أخرى.',
    },
  },
  en: {
    language: 'العربية',
    home: 'Home',
    greetings: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' },
    brand: {
      badge: 'A trusted platform for your clinic',
      headline: 'Everything your clinic needs, in one place.',
      sub: 'MERUNA gives clinic owners clearer visibility, faster decisions, and a better experience for every patient.',
      privacy: 'Your privacy comes first',
      copyright: 'Meruna Clinicos',
    },
    footer: {
      status: 'System operational 24/7',
      healthy: 'All systems operational',
      degraded: 'Service is temporarily degraded',
      secure: 'Secure 256-bit encrypted connection',
    },
    errors: {
      invalidCredentials: 'Invalid email or password',
      notAssigned: 'This account is not assigned to an active clinic owner or admin role. Contact support if this is a mistake.',
      sessionSetup: 'The session could not be created. Please try again.',
      authUnavailable: 'The sign-in service is temporarily unavailable. Try again shortly.',
      rateLimited: 'The sign-in service is under heavy load. Wait a moment and try again.',
      tooManyAttempts: 'Too many attempts. Wait a few minutes and try again.',
      tooManyRecovery: 'Too many recovery requests. Try again later.',
      recoveryUnavailable: 'The recovery email could not be sent. Please try again.',
      invalidRecoveryLink: 'This recovery link is invalid or expired. Request a new one.',
      sessionExpired: 'Your session has expired. Please sign in again.',
      emailExists: 'This email is already registered. Please sign in or use a different email.',
      invalidRegisterDetails: 'Check your details: full name, clinic name, a valid email, and a password of 8+ characters.',
      confirmEmail: 'Account created. Check your email to confirm it, then sign in.',
      onboardingFailed: 'The account was created but the clinic profile could not be completed. Contact support to finish setup.',
      networkError: 'Could not reach the server. Check your internet connection and try again.',
      generic: 'The request could not be completed. Please try again.',
    },
  },
};

const AuthLocaleContext = createContext<{
  lang: AuthLanguage;
  text: SharedAuthText;
  toggleLanguage: () => void;
} | null>(null);

// Falls back to Arabic defaults when no provider is mounted (e.g. the
// Arabic-only admin gate), so the shell renders standalone.
export function useAuthLocale() {
  const locale = useContext(AuthLocaleContext);
  if (!locale) {
    return {
      lang: 'ar' as AuthLanguage,
      text: sharedAuthCopy['ar'],
      toggleLanguage: () => {},
    };
  }
  return locale;
}

export function AuthLocaleProvider({ children }: { children: ReactNode }) {
  // Same preference semantics as lib/preferences.tsx (Arabic-first): only an
  // explicit saved 'en' switches language, and the shared landing/auth key
  // 'meruna-language' is kept. Reading it lazily also prevents the wrong
  // first paint when a returning user saved the other language.
  const [lang, setLang] = useState<AuthLanguage>(
    () => (window.localStorage.getItem('meruna-language') === 'en' ? 'en' : 'ar')
  );

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem('meruna-language', lang);
  }, [lang]);

  const value = {
    lang,
    text: sharedAuthCopy[lang],
    toggleLanguage: () => setLang((curr) => (curr === 'ar' ? 'en' : 'ar')),
  };
  return <AuthLocaleContext.Provider value={value}>{children}</AuthLocaleContext.Provider>;
}

export function getGreetingKey(date = new Date()): GreetingKey {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

const ARABIC_CHAR_RE = /[\u0600-\u06FF]/;
const LATIN_TOKEN_RE = /([A-Za-z0-9][A-Za-z0-9@._+\-/:#%]*)/g;

// Isolates Latin tokens (brand names, units like 256-bit, numbers) inside
// Arabic sentences so the bidi algorithm cannot visually scramble them.
// Pure-Latin copy is returned untouched to keep the DOM clean.
export function BidiText({ children }: { children: string }) {
  if (!ARABIC_CHAR_RE.test(children)) return children;
  const parts = children.split(LATIN_TOKEN_RE);
  return (
    <>
      {parts.map((part, index) => (index % 2 === 1 ? <bdi key={index}>{part}</bdi> : part))}
    </>
  );
}

export const SUBMIT_BUTTON_CLASS =
  'auth-submit flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d2436] py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#0d2436]/25 outline-none transition-all duration-200 hover:bg-[#143350] hover:shadow-xl hover:shadow-[#0d2436]/25 enabled:hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-sky-500/30 enabled:active:translate-y-0 enabled:active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 dark:bg-[#2a6c8c] dark:shadow-black/30 dark:hover:bg-[#35809f] dark:focus-visible:ring-sky-400/30';

export const FIELD_INPUT_CLASS =
  'w-full rounded-xl border border-slate-200 bg-white py-3 text-sm text-slate-800 shadow-sm outline-none transition-all duration-200 hover:border-slate-300 placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:shadow-none dark:placeholder:text-slate-500 dark:hover:border-white/20 dark:focus:border-sky-400/70 dark:focus:ring-sky-400/20';

// Field icons sit on the inline-start edge and the password toggle on the
// inline-end edge using logical utilities — they flip automatically with the
// column direction and never need per-language geometry.
export function fieldClasses() {
  return {
    startIcon: 'start-3.5',
    endIcon: 'end-3.5',
    emailPad: 'ps-10 pe-4',
    passwordPad: 'px-10',
  };
}

// Shared pill style for the header actions (home link, language toggle).
const HEADER_PILL_CLASS =
  'inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-px hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:shadow-none dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white';

const PASSWORD_TOGGLE_CLASS =
  'absolute end-3.5 top-3.5 -m-1 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200';

export function PasswordFieldToggle({
  visible,
  onToggle,
  showLabel,
  hideLabel,
  testId,
}: {
  visible: boolean;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
  testId: string;
}) {
  return (
    <button
      type="button"
      className={PASSWORD_TOGGLE_CLASS}
      onClick={onToggle}
      aria-label={visible ? hideLabel : showLabel}
      aria-pressed={visible}
      data-testid={testId}
    >
      {visible ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

export function ErrorAlert({ message, testid }: { message: string; testid: string }) {
  return (
    <div
      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
      data-testid={testid}
      role="alert"
    >
      <X size={15} className="mt-0.5 shrink-0 text-red-400 dark:text-red-300/80" />
      <span>
        <BidiText>{message}</BidiText>
      </span>
    </div>
  );
}

export function SuccessAlert({ message, testid }: { message: string; testid: string }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs leading-5 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
      data-testid={testid}
      role="status"
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300">
        <Check size={12} strokeWidth={3} />
      </span>
      <span>
        <BidiText>{message}</BidiText>
      </span>
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className="mt-1 block text-xs font-semibold text-red-600 dark:text-red-400" data-testid="text-field-error">
      <BidiText>{message}</BidiText>
    </span>
  );
}

function BrandPanel() {
  const { lang, text } = useAuthLocale();
  const rtl = lang === 'ar';

  return (
    <aside
      dir={rtl ? 'rtl' : 'ltr'}
      className={`relative hidden w-full flex-1 flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-[linear-gradient(165deg,#0e2f4c_0%,#0a2033_48%,#06121f_100%)] p-10 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] lg:flex xl:p-14 ${rtl ? 'ar' : ''}`}
    >
      {/* Ambient motion: drifting orbs, breathing rings, a slow diagonal sheen */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(58%_46%_at_72%_36%,rgba(56,189,248,0.09),transparent_70%)]" />
        <div className="auth-orb absolute -right-24 -top-24 size-[420px] rounded-full bg-sky-500/15 blur-3xl" />
        <div className="auth-orb auth-orb-slow absolute -bottom-32 -left-20 size-[460px] rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="auth-glow absolute left-1/2 top-1/3 size-[340px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[100px]" />
        <div className="auth-ring absolute -bottom-24 -right-16 size-80 rounded-full border border-white/10" />
        <div className="auth-ring absolute -bottom-10 -right-2 size-48 rounded-full border border-white/10" style={{ animationDelay: '-4s' }} />
        <div className="auth-sheen absolute -top-1/2 h-[200%] w-40 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
        <div
          className="auth-sheen auth-sheen-soft absolute -top-1/2 h-[200%] w-24 bg-gradient-to-r from-transparent via-sky-300/10 to-transparent"
          style={{ animationDelay: '-6s' }}
        />
      </div>

      <header className="relative z-10 flex items-center gap-3">
        <BrandMark size={40} />
        <div dir="ltr">
          <span className="block text-base font-extrabold tracking-[0.18em] text-white">MERUNA</span>
          <span className="-mt-1 block text-xs font-semibold uppercase tracking-widest text-sky-400">Clinic System</span>
        </div>
      </header>

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <span className="auth-badge inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-4 py-1.5 text-xs font-bold text-sky-300">
          <ShieldCheck className="size-3.5" />
          <BidiText>{text.brand.badge}</BidiText>
        </span>
        <h2 className="auth-float mt-7 max-w-[600px] text-4xl font-black leading-[1.3] text-white xl:text-[2.9rem] xl:leading-[1.25]">
          <span className="auth-shimmer">
            <BidiText>{text.brand.headline}</BidiText>
          </span>
        </h2>
        <p className="mt-5 max-w-md text-sm leading-8 text-slate-300">
          <BidiText>{text.brand.sub}</BidiText>
        </p>
      </div>

      <footer className="relative z-10 flex items-center justify-between text-xs text-slate-400">
        <span>
          <BidiText>{text.brand.privacy}</BidiText>
        </span>
        <span dir="ltr">© {text.brand.copyright}</span>
      </footer>
    </aside>
  );
}

// Auth routes mount outside PreferencesProvider, so the shell syncs the app
// dark-mode class from the same stored theme preference itself. Every
// destination (app shell, landing) re-syncs it on mount, so no cleanup is
// needed beyond keeping the value in step while auth is visible.
function useAuthThemeSync() {
  useEffect(() => {
    const stored =
      window.localStorage.getItem('clinicos-theme') ?? window.localStorage.getItem('meruna-theme');
    document.documentElement.classList.toggle('dark', stored === 'dark');
  }, []);
}

export function AuthShell({ children, languageToggle = true }: { children: ReactNode; languageToggle?: boolean }) {
  const { lang, text, toggleLanguage } = useAuthLocale();
  useAuthThemeSync();
  const rtl = lang === 'ar';
  const BackArrow = rtl ? ArrowRight : ArrowLeft;

  // The split layout is pinned: brand panel on the left, form on the right.
  // Only the text direction of each column follows the active language.
  return (
    <div
      className="flex min-h-[100dvh] w-full flex-row bg-[#f2f6f9] text-slate-800 dark:bg-background dark:text-slate-200"
      dir="ltr"
      data-testid="auth-layout"
    >
      <BrandPanel />

      {/* Form side */}
      <div
        dir={rtl ? 'rtl' : 'ltr'}
        className={`relative flex w-full flex-col lg:w-[54%] xl:w-[56%] 2xl:w-[58%] ${rtl ? 'ar' : ''}`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="auth-orb absolute -right-24 -top-24 size-80 rounded-full bg-sky-200/60 blur-3xl dark:bg-sky-500/10" />
          <div className="auth-orb auth-orb-slow absolute -bottom-24 -left-24 size-80 rounded-full bg-indigo-200/50 blur-3xl dark:bg-indigo-500/10" />
        </div>

        <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
          <div className="flex items-center gap-2.5 lg:hidden" dir="ltr">
            <BrandMark size={30} />
            <span className="text-sm font-extrabold tracking-[0.16em] text-[#0b2437] dark:text-white">MERUNA</span>
          </div>
          <span className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <Link href="/" className={HEADER_PILL_CLASS}>
              <BackArrow className="size-3.5" />
              <span>{text.home}</span>
            </Link>
            {languageToggle ? (
              <button
                type="button"
                onClick={toggleLanguage}
                className={HEADER_PILL_CLASS}
                data-testid="button-auth-language"
              >
                <Globe className="size-3.5 text-sky-600 dark:text-sky-400" />
                <span>{text.language}</span>
              </button>
            ) : null}
          </div>
        </header>

        <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-8 sm:px-10">
          <div className="auth-stagger w-full max-w-[430px] py-4">{children}</div>
        </main>

        <footer className="relative z-10 flex items-center justify-between px-6 py-5 text-xs text-slate-500 sm:px-10 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="live-pulse-dot inline-block size-1.5 rounded-full bg-emerald-500" />
            <span>
              <BidiText>{text.footer.status}</BidiText>
            </span>
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={13} className="text-slate-400 dark:text-slate-500" />
            <span>
              <BidiText>{text.footer.secure}</BidiText>
            </span>
          </span>
        </footer>
      </div>
    </div>
  );
}
