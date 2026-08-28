import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  Globe,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react';
import { BrandMark } from '@/components/brand';
import {
  getGetAuthSessionQueryKey,
  getHealthCheckQueryKey,
  useHealthCheck,
  useLogin,
  useRecoverPassword,
  useResetPassword,
} from '@workspace/api-client-react';
import { matchAuthErrorKey } from '@/lib/api-errors';

type AuthLanguage = 'ar' | 'en';

const authCopy = {
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
      chips: [
        { title: 'جدول المواعيد', sub: 'محدّث لحظيًا' },
        { title: 'ملف المريض', sub: 'نظرة 360° كاملة' },
        { title: 'تقارير مباشرة', sub: 'مؤشرات الأداء اليوم' },
      ],
    },
    footer: {
      status: 'النظام يعمل بكفاءة 24/7',
      healthy: 'الخادم يعمل بكفاءة',
      degraded: 'الخدمة تواجه بطئًا مؤقتًا',
      secure: 'اتصال آمن ومشفّر 256-bit',
    },
    login: {
      title: 'تسجيل الدخول',
      subtitle: 'أدخل بيانات حسابك للوصول إلى مساحة عمل عيادتك',
      email: 'البريد الإلكتروني',
      emailPlaceholder: 'name@clinic.com',
      emailHint: 'البريد المسجل في حساب العيادة',
      password: 'كلمة المرور',
      passwordPlaceholder: '••••••••',
      showPassword: 'إظهار كلمة المرور',
      hidePassword: 'إخفاء كلمة المرور',
      remember: 'تذكر هذا الجهاز',
      forgot: 'نسيت كلمة المرور؟',
      submit: 'دخول لعيادتك',
      loading: 'جارٍ تسجيل الدخول...',
      noAccount: 'ليس لديك حساب بعد؟',
      register: 'سجل عيادتك الآن',
      or: 'أو',
      orEmail: 'أو بالبريد الإلكتروني',
      demo: 'تجربة فورية كمدير عيادة (Demo)',
      requiredEmail: 'البريد الإلكتروني مطلوب',
      invalidEmail: 'صيغة البريد غير صحيحة',
      requiredPassword: 'كلمة المرور مطلوبة',
      minPassword: 'كلمة المرور لا تقل عن 8 أحرف',
    },
    recovery: {
      eyebrow: 'استعادة الحساب',
      title: 'نسيت كلمة المرور؟',
      subtitle: 'أدخل بريدك الإلكتروني وسنرسل لك رابطًا آمنًا لإعادة التعيين.',
      email: 'البريد الإلكتروني المسجل',
      emailPlaceholder: 'name@clinic.com',
      emailHint: 'سنرسل رابط الاستعادة إلى هذا العنوان',
      send: 'إرسال رابط الاستعادة',
      sending: 'جارٍ الإرسال...',
      back: 'العودة لتسجيل الدخول',
      success: 'تم إرسال رابط إعادة التعيين بنجاح. يرجى مراجعة بريدك الإلكتروني.',
      requiredEmail: 'البريد الإلكتروني مطلوب',
      invalidEmail: 'صيغة البريد غير صحيحة',
    },
    reset: {
      eyebrow: 'أمان الحساب',
      title: 'تعيين كلمة مرور جديدة',
      subtitle: 'اختر كلمة مرور قوية لحماية حساب عيادتك.',
      password: 'كلمة المرور الجديدة',
      confirm: 'تأكيد كلمة المرور',
      update: 'حفظ وتحديث كلمة المرور',
      updating: 'جارٍ الحفظ...',
      back: 'تسجيل الدخول بكلمة المرور الجديدة',
      success: 'تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.',
      requiredPassword: 'كلمة المرور مطلوبة',
      minPassword: 'يجب أن لا تقل عن 8 أحرف',
      requiredConfirm: 'يرجى تأكيد كلمة المرور',
      mismatch: 'كلمتا المرور غير متطابقتين',
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
      generic: 'تعذر الاتصال بخدمة الدخول مؤقتًا. يرجى المحاولة مرة أخرى.',
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
      chips: [
        { title: 'Appointment schedule', sub: 'Updated in real time' },
        { title: 'Patient record', sub: 'Full 360° view' },
        { title: 'Live reports', sub: "Today's performance" },
      ],
    },
    footer: {
      status: 'System operational 24/7',
      healthy: 'All systems operational',
      degraded: 'Service is temporarily degraded',
      secure: 'Secure 256-bit encrypted connection',
    },
    login: {
      title: 'Sign In',
      subtitle: 'Enter your credentials to access your clinic workspace',
      email: 'Email address',
      emailPlaceholder: 'name@clinic.com',
      emailHint: 'The email registered to your clinic account',
      password: 'Password',
      passwordPlaceholder: '••••••••',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      remember: 'Remember this device',
      forgot: 'Forgot password?',
      submit: 'Enter your clinic',
      loading: 'Signing in...',
      noAccount: "Don't have an account?",
      register: 'Register your clinic',
      or: 'or',
      orEmail: 'or continue with email',
      demo: 'Quick Demo Login as Clinic Admin',
      requiredEmail: 'Email is required',
      invalidEmail: 'Enter a valid email address',
      requiredPassword: 'Password is required',
      minPassword: 'Password must be at least 8 characters',
    },
    recovery: {
      eyebrow: 'Account Recovery',
      title: 'Reset your password',
      subtitle: 'Enter your email and we will send you a secure recovery link.',
      email: 'Registered Email',
      emailPlaceholder: 'name@clinic.com',
      emailHint: 'We will send the reset link to this address',
      send: 'Send Recovery Link',
      sending: 'Sending link...',
      back: 'Back to Sign In',
      success: 'Recovery link sent successfully. Please check your inbox.',
      requiredEmail: 'Email is required',
      invalidEmail: 'Enter a valid email address',
    },
    reset: {
      eyebrow: 'Account Security',
      title: 'Set New Password',
      subtitle: 'Choose a strong password to protect your clinic account.',
      password: 'New Password',
      confirm: 'Confirm Password',
      update: 'Update Password',
      updating: 'Updating...',
      back: 'Sign In with New Password',
      success: 'Password updated successfully. You can now sign in.',
      requiredPassword: 'Password is required',
      minPassword: 'Must be at least 8 characters',
      requiredConfirm: 'Please confirm password',
      mismatch: 'Passwords do not match',
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
      generic: 'The sign-in service is temporarily unreachable. Please try again.',
    },
  },
};

type BrandChip = { title: string; sub: string };

// Deterministic bubble field: varied sizes/depths so the rise feels organic
// without Math.random (which would differ between renders).
const BUBBLES = [
  { left: '4%', size: 84, duration: 18, delay: -4, drift: 48, opacity: 0.3 },
  { left: '12%', size: 36, duration: 13, delay: -9, drift: -30, opacity: 0.42 },
  { left: '21%', size: 120, duration: 24, delay: -14, drift: 60, opacity: 0.22 },
  { left: '31%', size: 26, duration: 11, delay: -2, drift: 24, opacity: 0.46 },
  { left: '43%', size: 64, duration: 16, delay: -7, drift: -44, opacity: 0.32 },
  { left: '55%', size: 44, duration: 14, delay: -11, drift: 36, opacity: 0.4 },
  { left: '66%', size: 96, duration: 21, delay: -5, drift: -52, opacity: 0.24 },
  { left: '76%', size: 30, duration: 12, delay: -15, drift: 28, opacity: 0.44 },
  { left: '86%', size: 72, duration: 19, delay: -8, drift: -38, opacity: 0.3 },
  { left: '94%', size: 40, duration: 15, delay: -12, drift: 42, opacity: 0.38 },
];

const CHIP_ICONS = [CalendarDays, UsersRound, Activity];
// Full class strings so Tailwind's JIT can see every variant.
const CHIP_POSITIONS_AR = ['top-[16%] left-[6%]', 'top-[45%] left-[10%]', 'bottom-[16%] left-[15%]'];
const CHIP_POSITIONS_EN = ['top-[16%] right-[6%]', 'top-[45%] right-[10%]', 'bottom-[16%] right-[15%]'];
const CHIP_ROTATIONS = ['-2deg', '2deg', '-1.5deg'];
const CHIP_DELAYS = ['-1s', '-3.5s', '-2.2s'];

const SUBMIT_BUTTON_CLASS =
  'flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d2436] py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#0d2436]/20 transition-all hover:bg-[#143350] active:scale-[0.99] disabled:opacity-60';

const FIELD_INPUT_CLASS =
  'w-full rounded-xl border border-slate-200 bg-white py-3 text-sm text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15';

// Icons sit on the reading-start edge and the password toggle on the end edge;
// logical positions flip between RTL and LTR.
function fieldClasses(en: boolean) {
  return {
    startIcon: en ? 'left-3.5' : 'right-3.5',
    endIcon: en ? 'right-3.5' : 'left-3.5',
    emailPad: en ? 'pl-10 pr-4' : 'pr-10 pl-4',
    passwordPad: 'px-10',
  };
}

type GreetingKey = 'morning' | 'afternoon' | 'evening';

function getGreetingKey(date = new Date()): GreetingKey {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

const AuthLocaleContext = createContext<{
  lang: AuthLanguage;
  text: typeof authCopy['ar'];
  toggleLanguage: () => void;
} | null>(null);

function useAuthLocale() {
  const locale = useContext(AuthLocaleContext);
  if (!locale) {
    return {
      lang: 'ar' as AuthLanguage,
      text: authCopy['ar'],
      toggleLanguage: () => {},
    };
  }
  return locale;
}

function AuthLocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<AuthLanguage>('ar');
  useEffect(() => {
    const saved = window.localStorage.getItem('meruna-language');
    if (saved === 'en' || saved === 'ar') setLang(saved);
  }, []);
  useEffect(() => {
    window.localStorage.setItem('meruna-language', lang);
  }, [lang]);
  const value = {
    lang,
    text: authCopy[lang],
    toggleLanguage: () => setLang((curr) => (curr === 'ar' ? 'en' : 'ar')),
  };
  return <AuthLocaleContext.Provider value={value}>{children}</AuthLocaleContext.Provider>;
}

function useRecoveryAccessToken(): [string | null, () => void] {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const queryToken = new URLSearchParams(window.location.search).get('access_token');
    const hashToken = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('access_token');
    const accessToken = queryToken || hashToken;
    if (!accessToken) return;

    setToken(accessToken);
    const cleanUrl = new URL(window.location.href);
    ['access_token', 'refresh_token', 'expires_in', 'expires_at', 'token_type', 'type'].forEach((key) =>
      cleanUrl.searchParams.delete(key)
    );
    cleanUrl.hash = '';
    window.history.replaceState(null, '', `${cleanUrl.pathname}${cleanUrl.search}`);
  }, []);

  return [token, () => setToken(null)];
}

function ErrorAlert({ message, testid }: { message: string; testid: string }) {
  return (
    <div
      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700"
      data-testid={testid}
      role="alert"
    >
      <X size={15} className="mt-0.5 shrink-0 text-red-400" />
      <span>{message}</span>
    </div>
  );
}

function SuccessAlert({ message, testid }: { message: string; testid: string }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs leading-5 text-emerald-700"
      data-testid={testid}
      role="status"
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-emerald-700">
        <Check size={12} strokeWidth={3} />
      </span>
      <span>{message}</span>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className="mt-1 block text-xs font-semibold text-red-600" data-testid="text-field-error">
      {message}
    </span>
  );
}

function BrandPanel() {
  const { lang, text } = useAuthLocale();
  const chipPositions = lang === 'en' ? CHIP_POSITIONS_EN : CHIP_POSITIONS_AR;

  return (
    <aside className="relative hidden w-full flex-1 flex-col justify-between overflow-hidden p-10 text-slate-100 lg:flex xl:p-14 bg-[linear-gradient(165deg,#0e2f4c_0%,#0a2033_48%,#06121f_100%)]">
      {/* Ambient layers: drifting orbs, pulsing rings, rising bubbles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="auth-orb absolute -right-24 -top-24 size-[420px] rounded-full bg-sky-500/15 blur-3xl" />
        <div className="auth-orb auth-orb-slow absolute -bottom-32 -left-20 size-[460px] rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="auth-glow absolute left-1/4 top-1/3 size-[300px] rounded-full bg-cyan-400/10 blur-[100px]" />
        <div className="auth-ring absolute -bottom-24 -right-16 size-80 rounded-full border border-white/10" />
        <div className="auth-ring absolute -bottom-10 -right-2 size-48 rounded-full border border-white/10" style={{ animationDelay: '-4s' }} />
        {BUBBLES.map((bubble, index) => (
          <span
            key={index}
            className="auth-bubble"
            style={
              {
                left: bubble.left,
                width: bubble.size,
                height: bubble.size,
                animationDuration: `${bubble.duration}s`,
                animationDelay: `${bubble.delay}s`,
                '--bubble-drift': `${bubble.drift}px`,
                '--bubble-opacity': bubble.opacity,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* Floating feature chips */}
      {text.brand.chips.map((chip: BrandChip, index: number) => {
        const Icon = CHIP_ICONS[index];
        return (
          <div
            key={chip.title}
            className={`auth-chip absolute z-10 hidden xl:block ${chipPositions[index]}`}
            style={{ '--chip-rot': CHIP_ROTATIONS[index], animationDelay: CHIP_DELAYS[index] } as CSSProperties}
            aria-hidden="true"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 shadow-2xl shadow-black/30 backdrop-blur-md">
              <span className="flex size-9 items-center justify-center rounded-xl bg-sky-400/15 text-sky-300">
                <Icon size={18} />
              </span>
              <span>
                <span className="block text-xs font-bold text-white">{chip.title}</span>
                <span className="block text-[10px] text-slate-400">{chip.sub}</span>
              </span>
            </div>
          </div>
        );
      })}

      <header className="relative z-10 flex items-center gap-3">
        <BrandMark size={40} />
        <div>
          <span className="block text-base font-extrabold tracking-[0.18em] text-white">MERUNA</span>
          <span className="-mt-1 block text-[10px] font-semibold uppercase tracking-widest text-sky-400">Clinic System</span>
        </div>
      </header>

      <div className="relative z-10 max-w-xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-4 py-1.5 text-xs font-bold text-sky-300">
          <ShieldCheck className="size-3.5" />
          {text.brand.badge}
        </span>
        <h2 className="mt-6 text-4xl font-black leading-[1.3] text-white xl:text-[2.9rem] xl:leading-[1.25]">
          {text.brand.headline}
        </h2>
        <p className="mt-5 max-w-md text-sm leading-8 text-slate-300">{text.brand.sub}</p>
      </div>

      <footer className="relative z-10 flex items-center justify-between text-[11px] text-slate-400">
        <span>{text.brand.privacy}</span>
        <span>© {text.brand.copyright}</span>
      </footer>
    </aside>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  const { lang, text, toggleLanguage } = useAuthLocale();
  const en = lang === 'en';

  return (
    <div
      className="flex min-h-[100dvh] w-full flex-col bg-[#f2f6f9] text-slate-800 lg:flex-row"
      dir={en ? 'ltr' : 'rtl'}
      data-testid="auth-layout"
    >
      {/* Form side — reading start (right in Arabic, left in English) */}
      <div className="relative flex w-full flex-col lg:w-[46%] xl:w-[44%]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-24 -top-24 size-72 rounded-full bg-sky-200/50 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 size-72 rounded-full bg-indigo-200/50 blur-3xl" />
        </div>

        <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
          <div className="flex items-center gap-2.5 lg:hidden">
            <BrandMark size={30} />
            <span className="text-sm font-extrabold tracking-[0.16em] text-[#0b2437]">MERUNA</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-900"
            >
              <ArrowRight className={`size-3.5 ${en ? 'rotate-180' : ''}`} />
              <span>{text.home}</span>
            </Link>
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-900"
              data-testid="button-auth-language"
            >
              <Globe className="size-3.5 text-sky-600" />
              <span>{text.language}</span>
            </button>
          </div>
        </header>

        <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-8 sm:px-10">
          <div className="auth-stagger w-full max-w-[400px] py-4">{children}</div>
        </main>

        <footer className="relative z-10 flex items-center justify-between px-6 py-5 text-[11px] text-slate-500 sm:px-10">
          <span className="flex items-center gap-1.5">
            <span className="live-pulse-dot inline-block size-1.5 rounded-full bg-emerald-500" />
            <span>{text.footer.status}</span>
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={13} className="text-slate-400" />
            <span>{text.footer.secure}</span>
          </span>
        </footer>
      </div>

      <BrandPanel />
    </div>
  );
}

type RecoveryValues = { email: string };
type ResetValues = { password: string; confirmPassword: string };
type LoginValues = { email: string; password: string; remember: boolean };

function RecoveryView({ onBack }: { onBack: () => void }) {
  const recovery = useRecoverPassword();
  const form = useForm<RecoveryValues>({ defaultValues: { email: '' }, mode: 'onTouched' });
  const { lang, text } = useAuthLocale();
  const en = lang === 'en';
  const copy = text.recovery;
  const field = fieldClasses(en);
  const errorKey = matchAuthErrorKey(recovery.error);
  const apiError = recovery.error ? (errorKey ? text.errors[errorKey] : text.errors.generic) : undefined;

  const submit = (values: RecoveryValues) => {
    recovery.mutate({ data: { email: values.email.trim() } });
  };

  return (
    <div>
      <div>
        <p className="text-xs font-bold text-sky-700">{copy.eyebrow}</p>
        <h2 className="mt-1.5 text-2xl font-black text-[#0b2437]">{copy.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{copy.subtitle}</p>
      </div>

      {apiError ? (
        <div className="mt-5">
          <ErrorAlert testid="alert-recovery-error" message={apiError} />
        </div>
      ) : null}

      {recovery.isSuccess ? (
        <div className="mt-6">
          <SuccessAlert testid="alert-recovery-success" message={copy.success} />
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(submit)} className="mt-6 space-y-4" noValidate>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">{copy.email}</span>
            <div className="relative">
              <Mail size={16} className={`pointer-events-none absolute ${field.startIcon} top-3.5 text-slate-400`} />
              <input
                {...form.register('email', { required: copy.requiredEmail, pattern: { value: /^\S+@\S+\.\S+$/, message: copy.invalidEmail } })}
                className={`${FIELD_INPUT_CLASS} ${field.emailPad}`}
                dir="ltr"
                type="email"
                placeholder={copy.emailPlaceholder}
                autoComplete="email"
                data-testid="input-recovery-email"
              />
            </div>
            {form.formState.errors.email?.message ? (
              <FieldError message={form.formState.errors.email.message} />
            ) : (
              <span className="mt-1 block text-[11px] text-slate-400">{copy.emailHint}</span>
            )}
          </label>

          <button className={SUBMIT_BUTTON_CLASS} type="submit" disabled={recovery.isPending} data-testid="button-recovery">
            {recovery.isPending ? (
              <><RefreshCw size={16} className="animate-spin" /><span>{copy.sending}</span></>
            ) : (
              <><span>{copy.send}</span><ArrowLeft className={`size-4 ${en ? 'rotate-180' : ''}`} /></>
            )}
          </button>
        </form>
      )}

      <button
        type="button"
        className="mt-6 w-full text-center text-xs font-bold text-sky-700 transition-colors hover:text-sky-600"
        onClick={onBack}
        data-testid="button-back-to-login"
      >
        {copy.back}
      </button>
    </div>
  );
}

function ResetPasswordView({ accessToken, onDone }: { accessToken: string; onDone: () => void }) {
  const reset = useResetPassword();
  const form = useForm<ResetValues>({ defaultValues: { password: '', confirmPassword: '' }, mode: 'onTouched' });
  const { lang, text } = useAuthLocale();
  const en = lang === 'en';
  const copy = text.reset;
  const errorKey = matchAuthErrorKey(reset.error);
  const apiError = reset.error ? (errorKey ? text.errors[errorKey] : text.errors.generic) : undefined;

  const submit = (values: ResetValues) => {
    reset.mutate({ data: { accessToken, password: values.password } });
  };

  return (
    <div>
      <div>
        <p className="text-xs font-bold text-sky-700">{copy.eyebrow}</p>
        <h2 className="mt-1.5 text-2xl font-black text-[#0b2437]">{copy.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{copy.subtitle}</p>
      </div>

      {apiError ? (
        <div className="mt-5">
          <ErrorAlert testid="alert-reset-error" message={apiError} />
        </div>
      ) : null}

      {reset.isSuccess ? (
        <div className="mt-6 space-y-4">
          <SuccessAlert testid="alert-reset-success" message={copy.success} />
          <button type="button" className={SUBMIT_BUTTON_CLASS} onClick={onDone} data-testid="button-reset-done">
            <span>{copy.back}</span>
            <ArrowLeft className={`size-4 ${en ? 'rotate-180' : ''}`} />
          </button>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(submit)} className="mt-6 space-y-4" noValidate>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">{copy.password}</span>
            <input
              {...form.register('password', { required: copy.requiredPassword, minLength: { value: 8, message: copy.minPassword } })}
              className={`${FIELD_INPUT_CLASS} px-4`}
              dir="ltr"
              type="password"
              autoComplete="new-password"
              data-testid="input-reset-password"
            />
            <FieldError message={form.formState.errors.password?.message} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">{copy.confirm}</span>
            <input
              {...form.register('confirmPassword', { required: copy.requiredConfirm, validate: (value) => value === form.getValues('password') || copy.mismatch })}
              className={`${FIELD_INPUT_CLASS} px-4`}
              dir="ltr"
              type="password"
              autoComplete="new-password"
              data-testid="input-reset-confirm-password"
            />
            <FieldError message={form.formState.errors.confirmPassword?.message} />
          </label>

          <button className={SUBMIT_BUTTON_CLASS} type="submit" disabled={reset.isPending} data-testid="button-reset-password">
            {reset.isPending ? (
              <><RefreshCw size={16} className="animate-spin" /><span>{copy.updating}</span></>
            ) : (
              <><span>{copy.update}</span><ArrowLeft className={`size-4 ${en ? 'rotate-180' : ''}`} /></>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export function LoginPageInner() {
  const [path, setLocation] = useLocation();
  const client = useQueryClient();
  const login = useLogin();
  const [recoveryToken, clearRecoveryToken] = useRecoveryAccessToken();
  const [showPassword, setShowPassword] = useState(false);
  const [greeting] = useState(getGreetingKey);
  const health = useHealthCheck({ query: { retry: false, queryKey: getHealthCheckQueryKey() } });
  const form = useForm<LoginValues>({ defaultValues: { email: '', password: '', remember: true }, mode: 'onTouched' });
  const { lang, text } = useAuthLocale();
  const en = lang === 'en';
  const copy = text.login;
  const field = fieldClasses(en);
  const isDev = import.meta.env.DEV;

  const onSubmit = (values: LoginValues) => {
    login.mutate(
      { data: { email: values.email.trim(), password: values.password, rememberDevice: values.remember } },
      {
        onSuccess: (session: unknown) => {
          client.setQueryData(getGetAuthSessionQueryKey(), session);
          toast.success(en ? 'Welcome back' : 'مرحبًا بعودتك');
          setLocation('/dashboard');
        },
      }
    );
  };

  const errorKey = matchAuthErrorKey(login.error);
  const displayApiError = login.error ? (errorKey ? text.errors[errorKey] : text.errors.generic) : undefined;

  if (recoveryToken) {
    return (
      <AuthShell>
        <ResetPasswordView
          accessToken={recoveryToken}
          onDone={() => {
            clearRecoveryToken();
            setLocation('/login');
          }}
        />
      </AuthShell>
    );
  }

  // /forgot-password and /reset-password are real routes now, so the view is
  // path-driven: deep links open recovery directly and browser back works.
  if (path === '/forgot-password' || path === '/reset-password') {
    return (
      <AuthShell>
        <RecoveryView onBack={() => setLocation('/login')} />
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div>
        <div>
          <p className="text-xs font-bold text-sky-700">{text.greetings[greeting]}</p>
          <h1 className="mt-1.5 text-3xl font-black text-[#0b2437]" data-testid="heading-login">
            {copy.title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{copy.subtitle}</p>
        </div>

        {displayApiError ? (
          <div className="mt-5">
            <ErrorAlert testid="alert-login-error" message={displayApiError} />
          </div>
        ) : null}

        {isDev ? (
          <>
            <button
              type="button"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-bold text-sky-800 transition-colors hover:bg-sky-100"
              onClick={() => {
                form.setValue('email', 'demo@meruna.app');
                form.setValue('password', 'demo1234');
              }}
              data-testid="button-demo-login"
            >
              <Sparkles className="size-4 text-sky-600" />
              <span>{copy.demo}</span>
            </button>
            <div className="relative my-5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-[#f2f6f9] px-3 text-[11px] font-semibold text-slate-400">{copy.orEmail}</span>
            </div>
          </>
        ) : null}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">{copy.email}</span>
            <div className="relative">
              <Mail size={16} className={`pointer-events-none absolute ${field.startIcon} top-3.5 text-slate-400`} />
              <input
                {...form.register('email', { required: copy.requiredEmail, pattern: { value: /^\S+@\S+\.\S+$/, message: copy.invalidEmail } })}
                className={`${FIELD_INPUT_CLASS} ${field.emailPad}`}
                dir="ltr"
                type="email"
                placeholder={copy.emailPlaceholder}
                autoComplete="email"
                data-testid="input-login-email"
              />
            </div>
            {form.formState.errors.email?.message ? (
              <FieldError message={form.formState.errors.email.message} />
            ) : (
              <span className="mt-1 block text-[11px] text-slate-400">{copy.emailHint}</span>
            )}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">{copy.password}</span>
            <div className="relative">
              <ShieldCheck size={16} className={`pointer-events-none absolute ${field.startIcon} top-3.5 text-slate-400`} />
              <input
                {...form.register('password', { required: copy.requiredPassword, minLength: { value: 8, message: copy.minPassword } })}
                className={`${FIELD_INPUT_CLASS} ${field.passwordPad}`}
                dir="ltr"
                type={showPassword ? 'text' : 'password'}
                placeholder={copy.passwordPlaceholder}
                autoComplete="current-password"
                data-testid="input-login-password"
              />
              <button
                type="button"
                className={`absolute ${field.endIcon} top-3.5 text-slate-400 transition-colors hover:text-slate-600`}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <FieldError message={form.formState.errors.password?.message} />
          </label>

          <div className="flex items-center justify-between pt-1 text-xs">
            <label className="flex cursor-pointer select-none items-center gap-2 text-slate-600 transition-colors hover:text-slate-900">
              <input
                {...form.register('remember')}
                type="checkbox"
                className="size-4 rounded border-slate-300 accent-[#0d2436]"
                data-testid="input-remember"
              />
              <span>{copy.remember}</span>
            </label>
            <button
              type="button"
              className="font-bold text-sky-700 transition-colors hover:text-sky-600"
              onClick={() => {
                login.reset();
                setLocation('/forgot-password');
              }}
              data-testid="button-forgot-password"
            >
              {copy.forgot}
            </button>
          </div>

          <button className={`${SUBMIT_BUTTON_CLASS} mt-1`} type="submit" disabled={login.isPending} data-testid="button-login">
            {login.isPending ? (
              <><RefreshCw size={16} className="animate-spin" /><span>{copy.loading}</span></>
            ) : (
              <><span>{copy.submit}</span><ArrowLeft className={`size-4 ${en ? 'rotate-180' : ''}`} /></>
            )}
          </button>
        </form>

        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-[#f2f6f9] px-3 text-[11px] font-semibold text-slate-400">{copy.or}</span>
        </div>

        <p className="text-center text-xs text-slate-500">
          {copy.noAccount}{' '}
          <Link href="/register" className="font-bold text-sky-700 transition-colors hover:text-sky-600 hover:underline" data-testid="link-register">
            {copy.register}
          </Link>
        </p>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-500" data-testid="status-api">
          <span className={`inline-block size-1.5 rounded-full ${health.isError ? 'bg-red-400' : 'bg-emerald-500 live-pulse-dot'}`} />
          <span>{health.isError ? text.footer.degraded : text.footer.healthy}</span>
        </p>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <AuthLocaleProvider>
      <LoginPageInner />
    </AuthLocaleProvider>
  );
}
