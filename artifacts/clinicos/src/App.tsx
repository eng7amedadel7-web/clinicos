import { createContext, lazy, Suspense, type CSSProperties, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster, toast } from 'sonner';
import {
  Activity,
  Search,
  ArrowLeft,
  ArrowRight,
  Bell,
  ChevronRight,
  GripVertical,
  PanelRightClose,
  PanelRightOpen,
  Moon,
  Sun,
  Building2,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Home,
  Inbox,
  LogOut,
  Mail,
  MapPin,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  PhoneCall,
  Menu,
  X,
} from 'lucide-react';
import {
  getGetAuthSessionQueryKey,
  getGetDashboardSummaryQueryKey,
  getHealthCheckQueryKey,
  getGetClinicSettingsQueryKey,
  useGetAuthSession,
  useGetClinicSettings,
  useGetDashboardSummary,
  useHealthCheck,
  useLogin,
  useLogout,
  useRegister,
  useRecoverPassword,
  useResetPassword,
  useUpdateClinicSettings,
} from '@workspace/api-client-react';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

const liveOperationsPages = () => import('@/pages/live-operations-pages');
const FollowUpsPage = lazy(() => liveOperationsPages().then((m) => ({ default: m.FollowUpsPage })));
const LiveAppointmentsPage = lazy(() => liveOperationsPages().then((m) => ({ default: m.LiveAppointmentsPage })));
const LiveInboxPage = lazy(() => liveOperationsPages().then((m) => ({ default: m.LiveInboxPage })));
const LivePatientsPage = lazy(() => liveOperationsPages().then((m) => ({ default: m.LivePatientsPage })));
const NoShowsPage = lazy(() => liveOperationsPages().then((m) => ({ default: m.NoShowsPage })));
const WaitlistPage = lazy(() => liveOperationsPages().then((m) => ({ default: m.WaitlistPage })));
const LiveDashboard = lazy(() => import('@/pages/live-dashboard'));
const LiveVoiceAgentPage = lazy(() => import('@/pages/live-voice-agent'));
const BillingPage = lazy(() => import('@/pages/billing'));
const Patient360Page = lazy(() => import('@/pages/patient-360-page'));
const AppointmentJourneyPage = lazy(() => import('@/pages/appointment-journey-page'));
const MerunaHome = lazy(() => import('@/pages/meruna-home'));
const CurrentMerunaHome = lazy(() => import('@/pages/meruna-home-current'));
const MergedMerunaHome = lazy(() => import('@/pages/meruna-home-merged'));
const LegalPage = lazy(() => import('@/pages/legal-pages'));
const OperationsDashboard = lazy(() => import('@/pages/operations-dashboard'));
const OrganizationSettings = lazy(() => import('@/pages/organization-settings'));

import { CommandPalette, CommandPaletteTrigger, useCommandPalette } from '@/components/command-palette';
import { PreferencesProvider, usePreferences, type TranslationKey } from '@/lib/preferences';
import { getOperationsSummary } from '@/lib/operations-api';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, gcTime: 5 * 60_000, refetchOnWindowFocus: false, retry: 0 } } });

type LoginValues = { email: string; password: string };
type RegisterValues = { fullName: string; clinicName: string; email: string; password: string };

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2" data-testid="brand-logo">
      <div className="brand-mark" aria-hidden="true"><span /></div>
      <div className={`brand-wordmark ${dark ? '!text-[#0b2940]' : ''}`}>MERUNA <span className="brand-system">SYSTEM</span></div>
    </div>
  );
}

function ErrorMessage({ onRetry, compact = false }: { onRetry: () => void; compact?: boolean }) {
  return (
    <div className={`surface flex flex-col items-center justify-center text-center ${compact ? 'p-6' : 'min-h-[360px] p-10'}`} data-testid="state-error">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f9e9e7] text-[#ad514a]"><RefreshCw size={20} /></div>
      <h2 className="text-lg font-bold text-[#18374d]">تعذّر تحميل البيانات</h2>
      <p className="mt-1 max-w-sm text-sm leading-6 text-[#718591]">حدث خلل مؤقت. حاول مرة أخرى، وسنستأنف من حيث توقفت.</p>
      <button className="primary-button mt-5" onClick={onRetry} data-testid="button-retry"><RefreshCw size={16} /> إعادة المحاولة</button>
    </div>
  );
}

function RouteFallback() {
  return (
    <div className="flex min-h-[60dvh] flex-1 items-center justify-center p-6" data-testid="state-route-loading" dir="rtl">
      <div className="w-full max-w-3xl space-y-4">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-9 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-24 w-full" />
        </div>
        <div className="skeleton h-56 w-full" />
      </div>
    </div>
  );
}

function PublicRouteFallback() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#eef3f7] p-6" data-testid="state-public-route-loading" dir="rtl">
      <div className="w-full max-w-4xl space-y-5">
        <div className="skeleton h-4 w-28" />
        <div className="skeleton h-12 w-3/4" />
        <div className="skeleton h-5 w-1/2" />
        <div className="skeleton h-72 w-full" />
      </div>
    </div>
  );
}

function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-right">
      <span className="mb-2 block text-[.78rem] font-bold text-[#36596d]">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-xs font-semibold text-[#b24e49]" data-testid="text-field-error">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-[#8496a0]">{hint}</span> : null}
    </label>
  );
}

function getApiErrorMessage(error: unknown, language: 'ar' | 'en' = 'ar'): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const candidate = error as { data?: unknown; error?: unknown; message?: unknown; status?: unknown };
  const fallback = language === 'ar'
    ? 'تعذر الاتصال بخدمة الدخول مؤقتًا. استخدم رابط Production الرسمي وحاول مرة أخرى.'
    : 'The sign-in service is temporarily unavailable. Use the official Production link and try again.';
  const status = typeof candidate.status === 'number' ? candidate.status : undefined;
  const data = candidate.data;
  if (data && typeof data === 'object') {
    const nestedError = (data as { error?: unknown }).error;
    if (typeof nestedError === 'string' && nestedError.trim()) return nestedError;
  }
  if (typeof candidate.error === 'string' && candidate.error.trim()) return candidate.error;
  if (typeof candidate.message === 'string' && candidate.message.trim()) {
    const message = candidate.message.trim();
    if (status !== undefined && status >= 500 || /<(!doctype|html)|internal server error/i.test(message)) return fallback;
    return message;
  }
  return status !== undefined && status >= 500 ? fallback : undefined;
}

type AuthLanguage = 'ar' | 'en';

const authCopy = {
  ar: {
    railTrusted: 'منصة موثوقة لإدارة يومك',
    railTitle: { login: 'كل ما يحتاج انتباهك، في مكان واحد.', register: 'ابدأ تنظيم عيادتك بثقة.' },
    railBody: 'MERUNA SYSTEM يمنح أصحاب العيادات رؤية أوضح، وقرارات أسرع، ويومًا أكثر هدوءًا.',
    privacy: 'خصوصيتك أولًا',
    secure: 'اتصال آمن ومشفّر',
    language: 'English',
    mobileRegister: 'إنشاء حساب',
    mobileLogin: 'تسجيل الدخول',
      login: {
      greeting: 'مساء الخير', title: 'تسجيل الدخول', subtitle: 'أدخل بياناتك للوصول إلى لوحة عيادتك.', email: 'البريد الإلكتروني', emailHint: 'استخدم البريد المرتبط بحسابك', emailPlaceholder: 'name@clinic.com', password: 'كلمة المرور', passwordPlaceholder: '••••••••', remember: 'تذكرني على هذا الجهاز', forgot: 'نسيت كلمة المرور؟', submit: 'دخول إلى MERUNA SYSTEM', loading: 'جارٍ التحقق...', noAccount: 'ليس لديك حساب؟', register: 'أنشئ عيادتك الآن', or: 'أو', healthy: 'الأنظمة تعمل بشكل طبيعي', degraded: 'الخدمة تواجه ضغطًا مؤقتًا', requiredEmail: 'أدخل البريد الإلكتروني', invalidEmail: 'تحقق من صيغة البريد الإلكتروني', requiredPassword: 'أدخل كلمة المرور', minPassword: 'يجب أن تتكون من 6 أحرف على الأقل', showPassword: 'إظهار كلمة المرور', hidePassword: 'إخفاء كلمة المرور', errorInvalid: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
    },
    registerPage: { eyebrow: 'خطوة واحدة ونبدأ', title: 'إنشاء حساب المالك', subtitle: 'أخبرنا عنك وعن عيادتك لنجهز مساحتك الخاصة.', fullName: 'الاسم الكامل', fullNamePlaceholder: 'د. سارة أحمد', clinicName: 'اسم العيادة', clinicNamePlaceholder: 'عيادة مدار الصحية', email: 'البريد الإلكتروني', password: 'كلمة المرور', passwordHint: 'ثمانية أحرف على الأقل', terms: 'أوافق على شرو�� الاستخدام وسياسة الخصوصية الخاصة بMERUNA SYSTEM.', submit: 'إنشاء حسابي', loading: 'جارٍ إنشاء المساحة...', haveAccount: 'لديك حساب بالفعل؟', login: 'سجل الدخول', requiredName: 'أدخل الاسم الكامل', validName: 'أدخل اسمًا صحيحًا', requiredClinic: 'أدخل اسم العيادة', requiredEmail: 'أدخل البريد الإلكتروني', invalidEmail: 'تحقق من صيغة البريد الإلكتروني', requiredPassword: 'أدخل كلمة المرور', minPassword: 'يجب أن تتكون من 8 أحرف على الأقل', success: 'تم إنشاء عيادتك' },
    recovery: { eyebrow: 'استعادة الوصول', title: 'نسيت كلمة المرور؟', subtitle: 'أدخل بريد الحساب وسنرسل رابطًا آمنًا لإعادة تعيين كلمة المرور.', email: 'البريد الإلكتروني', emailHint: 'استخدم البريد المرتبط بحسابك', emailPlaceholder: 'name@clinic.com', requiredEmail: 'أدخل البريد الإلكتروني', invalidEmail: 'تحقق من صيغة البريد الإلكتروني', send: 'إرسال رابط الاستعادة', sending: 'جارٍ إرسال الرابط...', success: 'إذا كان البريد مرتبطًا بحساب، فسيصلك رابط استعادة خلال دقائق. افحص البريد الوارد ومجلد الرسائل غير المرغوب فيها.', back: 'العودة إلى تسجيل الدخول' },
    reset: { eyebrow: 'كلمة مرور جديدة', title: 'إعادة تعيين كلمة المرور', subtitle: 'أنشئ كلمة مرور جديدة من 8 أحرف على الأقل.', password: 'كلمة المرور الجديدة', confirm: 'تأكيد كلمة المرور', requiredPassword: 'أدخل كلمة المرور الجديدة', minPassword: 'يجب أن تتكون من 8 أحرف على الأقل', requiredConfirm: 'أكد كلمة المرور', mismatch: 'كلمتا المرور غير متطابقتين', update: 'تحديث كلمة المرور', updating: 'جارٍ تحديث كلمة المرور...', success: 'تم تحديث كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.', back: 'العودة إلى تسجيل الدخول' }
  },
  en: {
    railTrusted: 'A trusted space for your day',
    railTitle: { login: 'Everything that needs your attention, in one place.', register: 'Start organizing your clinic with confidence.' },
    railBody: 'MERUNA SYSTEM gives clinic teams clearer visibility, faster decisions, and a calmer day.',
    privacy: 'Your privacy comes first',
    secure: 'Secure and encrypted connection',
    language: 'العربية',
    mobileRegister: 'Create account',
    mobileLogin: 'Sign in',
      login: {
      greeting: 'Good evening', title: 'Sign in', subtitle: 'Enter your details to access your clinic workspace.', email: 'Email address', emailHint: 'Use the email connected to your account', emailPlaceholder: 'name@clinic.com', password: 'Password', passwordPlaceholder: '••••••••', remember: 'Remember me on this device', forgot: 'Forgot your password?', submit: 'Sign in to MERUNA SYSTEM', loading: 'Checking...', noAccount: 'Don’t have an account?', register: 'Create your clinic now', or: 'or', healthy: 'All systems operational', degraded: 'The service is under temporary load', requiredEmail: 'Enter your email address', invalidEmail: 'Check the email format', requiredPassword: 'Enter your password', minPassword: 'Password must be at least 6 characters', showPassword: 'Show password', hidePassword: 'Hide password', errorInvalid: 'The email or password is incorrect.'
    },
    registerPage: { eyebrow: 'One step and you are in', title: 'Create your owner account', subtitle: 'Tell us about you and your clinic so we can prepare your workspace.', fullName: 'Full name', fullNamePlaceholder: 'Dr. Sarah Ahmed', clinicName: 'Clinic name', clinicNamePlaceholder: 'Madar Health Clinic', email: 'Email address', password: 'Password', passwordHint: 'At least eight characters', terms: 'I agree to MERUNA SYSTEM terms of use and privacy policy.', submit: 'Create my account', loading: 'Creating workspace...', haveAccount: 'Already have an account?', login: 'Sign in', requiredName: 'Enter your full name', validName: 'Enter a valid name', requiredClinic: 'Enter your clinic name', requiredEmail: 'Enter your email address', invalidEmail: 'Check the email format', requiredPassword: 'Enter your password', minPassword: 'Password must be at least 8 characters', success: 'Your clinic was created' },
    recovery: { eyebrow: 'Restore access', title: 'Forgot your password?', subtitle: 'Enter your account email and we will send a secure reset link.', email: 'Email address', emailHint: 'Use the email connected to your account', emailPlaceholder: 'name@clinic.com', requiredEmail: 'Enter your email address', invalidEmail: 'Check the email format', send: 'Send reset link', sending: 'Sending reset link...', success: 'If the email is connected to an account, you will receive a reset link shortly. Check your inbox and spam folder.', back: 'Back to sign in' },
    reset: { eyebrow: 'New password', title: 'Reset your password', subtitle: 'Create a new password with at least 8 characters.', password: 'New password', confirm: 'Confirm password', requiredPassword: 'Enter your new password', minPassword: 'Password must be at least 8 characters', requiredConfirm: 'Confirm your password', mismatch: 'Passwords do not match', update: 'Update password', updating: 'Updating password...', success: 'Your password was updated successfully. You can sign in now.', back: 'Back to sign in' }
  }
} as const;

type AuthCopy = (typeof authCopy)[AuthLanguage];
type AuthLocale = { lang: AuthLanguage; text: AuthCopy; toggleLanguage: () => void };
const AuthLocaleContext = createContext<AuthLocale | null>(null);

function useAuthLocale() {
  const locale = useContext(AuthLocaleContext);
  if (!locale) throw new Error('Auth locale is only available inside AuthLocaleProvider');
  return locale;
}

function AuthLocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<AuthLanguage>('ar');
  useEffect(() => {
    const saved = window.localStorage.getItem('meruna-language');
    if (saved === 'en' || saved === 'ar') setLang(saved);
  }, []);
  useEffect(() => { window.localStorage.setItem('meruna-language', lang); }, [lang]);
  const value = { lang, text: authCopy[lang], toggleLanguage: () => setLang((current) => current === 'ar' ? 'en' : 'ar') };
  return <AuthLocaleContext.Provider value={value}>{children}</AuthLocaleContext.Provider>;
}

function AuthLayout({ children, mode, languageToggle = false }: { children: ReactNode; mode: 'login' | 'register'; languageToggle?: boolean }) {
  const { lang, text, toggleLanguage } = useAuthLocale();
  return (
    <main className="auth-layout noise min-h-[100dvh] bg-[#eef3f7] lg:grid lg:grid-cols-[minmax(380px,44%)_1fr]" dir="ltr">
      <div className="auth-decor auth-decor-one" aria-hidden="true" />
      <div className="auth-decor auth-decor-two" aria-hidden="true" />
      <div className="auth-scanline" aria-hidden="true" />
      <section className={`auth-rail auth-panel-enter hidden min-h-[100dvh] flex-col justify-between p-12 text-[#e8f3f6] lg:flex xl:p-16 text-right`} dir="rtl">
        <div className="auth-brand-lockup relative z-10"><Logo /></div>
        <div className={`auth-rail-copy relative z-10 max-w-[410px] text-right`}>
          <div className="auth-trust-badge mb-7 inline-flex items-center gap-2 rounded-full border border-[#6b9aae]/30 bg-[#9bc4d2]/10 px-3 py-1.5 text-xs font-semibold text-[#a9cad4]"><span className="auth-badge-dot" aria-hidden="true" /><ShieldCheck size={14} /> {text.railTrusted}</div>
          <h1 className="auth-rail-title ar text-4xl font-bold leading-[1.35] tracking-tight xl:text-[3.15rem]">{text.railTitle[mode]}</h1>
          <p className="auth-rail-description ar mt-5 max-w-[360px] text-[1.05rem] leading-8 text-[#a8bdc8]">{text.railBody}</p>
        </div>
        <div className="auth-rail-footer relative z-10 flex items-center justify-between text-xs text-[#7896a5]"><span>© 2026 MERUNA SYSTEM</span><span>{text.privacy}</span></div>
      </section>
      <section className="auth-form-pane flex min-h-[100dvh] flex-col px-5 py-7 sm:px-10 lg:px-16 lg:py-12 xl:px-24" dir="rtl">
        <div className="flex items-center justify-between"><div className="flex items-center justify-between gap-5 lg:hidden"><Logo /><Link href={mode === 'login' ? '/register' : '/login'} className="text-sm font-bold text-[#507080]" data-testid="link-auth-switch">{mode === 'login' ? text.mobileRegister : text.mobileLogin}</Link></div>{languageToggle && <button type="button" className="auth-language-toggle ms-auto rounded-full border border-[#cbdbe2] bg-white/70 px-3 py-2 text-xs font-bold text-[#31556b] transition hover:border-[#5d9caf] hover:text-[#174963]" onClick={toggleLanguage} data-testid="button-auth-language" aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}>{text.language}</button>}</div>
        <div className="m-auto w-full max-w-[445px] py-12">{children}</div>
        <div className="flex items-center justify-between text-xs text-[#8a9aa3]"><span>MERUNA SYSTEM</span><span className="flex items-center gap-1.5"><ShieldCheck size={13} /> {text.secure}</span></div>
      </section>
    </main>
  );
}

type RecoveryValues = { email: string };
type ResetValues = { password: string; confirmPassword: string };

function useRecoveryAccessToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const queryToken = new URLSearchParams(window.location.search).get('access_token');
    const hashToken = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('access_token');
    const accessToken = queryToken || hashToken;
    if (!accessToken) return;

    setToken(accessToken);
    const cleanUrl = new URL(window.location.href);
    ['access_token', 'refresh_token', 'expires_in', 'expires_at', 'token_type', 'type'].forEach(key => cleanUrl.searchParams.delete(key));
    cleanUrl.hash = '';
    window.history.replaceState(null, '', `${cleanUrl.pathname}${cleanUrl.search}`);
  }, []);

  return token;
}

function RecoveryPage({ onBack }: { onBack: () => void }) {
  const recovery = useRecoverPassword();
  const form = useForm<RecoveryValues>({ defaultValues: { email: '' }, mode: 'onTouched' });
  const apiError = getApiErrorMessage(recovery.error);
  const { text } = useAuthLocale();
  const copy = text.recovery;

  const submit = (values: RecoveryValues) => {
    recovery.mutate({ data: { email: values.email.trim() } });
  };

  return (
    <AuthLayout mode="login" languageToggle>
      <div className="animate-rise">
        <div className="mb-8"><p className="mb-3 text-sm font-bold text-[#6c94a3]">{copy.eyebrow}</p><h2 className="ar text-3xl font-bold tracking-tight text-[#12334a]">{copy.title}</h2><p className="mt-2 text-sm leading-6 text-[#718591]">{copy.subtitle}</p></div>
        {apiError ? <div className="mb-5 rounded-xl border border-[#edc4c0] bg-[#fff7f6] p-3 text-sm leading-6 text-[#a54c46]" data-testid="alert-recovery-error">{apiError}</div> : null}
        {recovery.isSuccess ? (
          <div className="rounded-xl border border-[#c7e2d8] bg-[#f2faf6] p-5 text-sm leading-7 text-[#39755f]" data-testid="alert-recovery-success">{copy.success}</div>
        ) : (
          <form onSubmit={form.handleSubmit(submit)} className="space-y-5" noValidate dir="rtl">
            <Field label={copy.email} error={form.formState.errors.email?.message} hint={copy.emailHint}>
              <div className="relative"><Mail size={17} className="absolute right-3.5 top-3.5 text-[#8ca2ad]" /><input {...form.register('email', { required: copy.requiredEmail, pattern: { value: /^\S+@\S+\.\S+$/, message: copy.invalidEmail } })} className="input-field pr-11 text-left" dir="ltr" type="email" placeholder={copy.emailPlaceholder} autoComplete="email" data-testid="input-recovery-email" /></div>
            </Field>
            <button className="primary-button w-full" type="submit" disabled={recovery.isPending} data-testid="button-recovery">{recovery.isPending ? <><RefreshCw size={17} className="animate-spin" /> {copy.sending}</> : <>{copy.send} <ArrowLeft size={17} /></>}</button>
          </form>
        )}
        <button type="button" className="mt-7 w-full text-center text-sm font-bold text-[#3c7e93]" onClick={onBack} data-testid="button-back-to-login">{copy.back}</button>
      </div>
    </AuthLayout>
  );
}

function ResetPasswordPage({ accessToken, onDone }: { accessToken: string; onDone: () => void }) {
  const reset = useResetPassword();
  const form = useForm<ResetValues>({ defaultValues: { password: '', confirmPassword: '' }, mode: 'onTouched' });
  const apiError = getApiErrorMessage(reset.error);
  const { text } = useAuthLocale();
  const copy = text.reset;

  const submit = (values: ResetValues) => {
    reset.mutate({ data: { accessToken, password: values.password } });
  };

  return (
    <AuthLayout mode="login" languageToggle>
      <div className="animate-rise">
        <div className="mb-8"><p className="mb-3 text-sm font-bold text-[#6c94a3]">{copy.eyebrow}</p><h2 className="ar text-3xl font-bold tracking-tight text-[#12334a]">{copy.title}</h2><p className="mt-2 text-sm leading-6 text-[#718591]">{copy.subtitle}</p></div>
        {apiError ? <div className="mb-5 rounded-xl border border-[#edc4c0] bg-[#fff7f6] p-3 text-sm leading-6 text-[#a54c46]" data-testid="alert-reset-error">{apiError}</div> : null}
        {reset.isSuccess ? (
          <div className="space-y-5"><div className="rounded-xl border border-[#c7e2d8] bg-[#f2faf6] p-5 text-sm leading-7 text-[#39755f]" data-testid="alert-reset-success">{copy.success}</div><button type="button" className="primary-button w-full" onClick={onDone} data-testid="button-reset-done">{copy.back} <ArrowLeft size={17} /></button></div>
        ) : (
          <form onSubmit={form.handleSubmit(submit)} className="space-y-5" noValidate dir="rtl">
            <Field label={copy.password} error={form.formState.errors.password?.message}><input {...form.register('password', { required: copy.requiredPassword, minLength: { value: 8, message: copy.minPassword } })} className="input-field text-left" dir="ltr" type="password" autoComplete="new-password" data-testid="input-reset-password" /></Field>
            <Field label={copy.confirm} error={form.formState.errors.confirmPassword?.message}><input {...form.register('confirmPassword', { required: copy.requiredConfirm, validate: value => value === form.getValues('password') || copy.mismatch })} className="input-field text-left" dir="ltr" type="password" autoComplete="new-password" data-testid="input-reset-confirm-password" /></Field>
            <button className="primary-button w-full" type="submit" disabled={reset.isPending} data-testid="button-reset-password">{reset.isPending ? <><RefreshCw size={17} className="animate-spin" /> {copy.updating}</> : <>{copy.update} <ArrowLeft size={17} /></>}</button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}

function LoginPage() {
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const login = useLogin();
  const recoveryToken = useRecoveryAccessToken();
  const [showRecovery, setShowRecovery] = useState(false);
  const health = useHealthCheck({ query: { retry: false, enabled: !showRecovery && !recoveryToken, queryKey: getHealthCheckQueryKey() } });
  const form = useForm<LoginValues>({ defaultValues: { email: '', password: '' }, mode: 'onTouched' });
  const [showPassword, setShowPassword] = useState(false);
  const { lang, text } = useAuthLocale();
  const copy = text.login;
  const onSubmit = (values: LoginValues) => {
    login.mutate({ data: values }, {
      onSuccess: (session) => {
        client.setQueryData(getGetAuthSessionQueryKey(), session);
        toast.success(lang === 'ar' ? 'مرحبًا بعودتك' : 'Welcome back');
        setLocation('/dashboard');
      },
    });
  };
  const apiError = getApiErrorMessage(login.error, lang);
  if (recoveryToken) return <ResetPasswordPage accessToken={recoveryToken} onDone={() => { window.history.replaceState(null, '', '/login'); setShowRecovery(false); window.location.reload(); }} />;
  if (showRecovery) return <RecoveryPage onBack={() => setShowRecovery(false)} />;
  const displayApiError = apiError?.toLowerCase().includes('email') || apiError?.toLowerCase().includes('password') ? copy.errorInvalid : apiError;
  return (
    <AuthLayout mode="login" languageToggle>
      <div className="animate-rise">
        <div className="mb-8"><p className="mb-3 text-sm font-bold text-[#6c94a3]">{copy.greeting}</p><h2 className="ar text-3xl font-bold tracking-tight text-[#12334a]" data-testid="heading-login">{copy.title}</h2><p className="mt-2 text-sm leading-6 text-[#718591]">{copy.subtitle}</p></div>
        {displayApiError ? <div className="mb-5 flex items-start gap-2 rounded-xl border border-[#edc4c0] bg-[#fff7f6] p-3 text-sm leading-6 text-[#a54c46]" data-testid="alert-login-error"><X size={17} className="mt-1 shrink-0" /> {displayApiError}</div> : null}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate dir="rtl">
          <Field label={copy.email} error={form.formState.errors.email?.message} hint={copy.emailHint}>
            <div className="relative"><Mail size={17} className="absolute right-3.5 top-3.5 text-[#8ca2ad]" /><input {...form.register('email', { required: copy.requiredEmail, pattern: { value: /^\S+@\S+\.\S+$/, message: copy.invalidEmail } })} className="input-field pr-11 text-left" dir="ltr" type="email" placeholder={copy.emailPlaceholder} autoComplete="email" data-testid="input-login-email" /></div>
          </Field>
          <Field label={copy.password} error={form.formState.errors.password?.message}>
            <div className="relative"><ShieldCheck size={17} className="absolute right-3.5 top-3.5 text-[#8ca2ad]" /><input {...form.register('password', { required: copy.requiredPassword, minLength: { value: 6, message: copy.minPassword } })} className="input-field pl-11 pr-11 text-left" dir="ltr" type={showPassword ? 'text' : 'password'} placeholder={copy.passwordPlaceholder} autoComplete="current-password" data-testid="input-login-password" /><button type="button" className="absolute left-3.5 top-3.5 text-[#8196a1]" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? copy.hidePassword : copy.showPassword} data-testid="button-toggle-password">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
          </Field>
          <div className="flex items-center justify-between text-xs"><label className="flex items-center gap-2 text-[#66808e]"><input type="checkbox" className="h-4 w-4 accent-[#174963]" data-testid="input-remember" /> {copy.remember}</label><button type="button" className="font-bold text-[#3c7e93]" onClick={() => { login.reset(); setShowRecovery(true); }} data-testid="button-forgot-password">{copy.forgot}</button></div>
          <button className="primary-button w-full" type="submit" disabled={login.isPending} data-testid="button-login">{login.isPending ? <><RefreshCw size={17} className="animate-spin" /> {copy.loading}</> : <>{copy.submit} <ArrowLeft size={17} /></>}</button>
        </form>
        <div className="mt-8 flex items-center gap-3 text-xs text-[#8a9ba4]"><div className="h-px flex-1 bg-[#d9e3e8]" /> {copy.or} <div className="h-px flex-1 bg-[#d9e3e8]" /></div>
        <p className="mt-7 text-center text-sm text-[#718591]">{copy.noAccount} <Link href="/register" className="font-bold text-[#3c7e93]" data-testid="link-register">{copy.register}</Link></p>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-[.7rem] text-[#a0adb3]" data-testid="status-api"><span className={`status-dot ${health.isError ? '!bg-[#c67870]' : ''}`} /> {health.isError ? copy.degraded : copy.healthy}</p>
      </div>
    </AuthLayout>
  );
}

function RegisterPage() {
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const register = useRegister();
  const form = useForm<RegisterValues>({ defaultValues: { fullName: '', clinicName: '', email: '', password: '' }, mode: 'onTouched' });
  const { lang, text } = useAuthLocale();
  const copy = text.registerPage;
  const onSubmit = (values: RegisterValues) => register.mutate({ data: values }, { onSuccess: (session) => { client.setQueryData(getGetAuthSessionQueryKey(), session); toast.success(copy.success); setLocation('/dashboard'); } });
  const apiError = getApiErrorMessage(register.error, lang);
  return (
    <AuthLayout mode="register" languageToggle>
      <div className="animate-rise">
        <div className="mb-8"><p className="mb-3 text-sm font-bold text-[#6c94a3]">{copy.eyebrow}</p><h2 className="ar text-3xl font-bold tracking-tight text-[#12334a]" data-testid="heading-register">{copy.title}</h2><p className="mt-2 text-sm leading-6 text-[#718591]">{copy.subtitle}</p></div>
        {apiError ? <div className="mb-5 rounded-xl border border-[#edc4c0] bg-[#fff7f6] p-3 text-sm leading-6 text-[#a54c46]" data-testid="alert-register-error">{apiError}</div> : null}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate dir="rtl">
          <Field label={copy.fullName} error={form.formState.errors.fullName?.message}><div className="relative"><UserRound size={17} className="absolute right-3.5 top-3.5 text-[#8ca2ad]" /><input {...form.register('fullName', { required: copy.requiredName, minLength: { value: 2, message: copy.validName } })} className="input-field pr-11" placeholder={copy.fullNamePlaceholder} autoComplete="name" data-testid="input-register-full-name" /></div></Field>
          <Field label={copy.clinicName} error={form.formState.errors.clinicName?.message}><div className="relative"><Building2 size={17} className="absolute right-3.5 top-3.5 text-[#8ca2ad]" /><input {...form.register('clinicName', { required: copy.requiredClinic, minLength: { value: 2, message: copy.validName } })} className="input-field pr-11" placeholder={copy.clinicNamePlaceholder} data-testid="input-register-clinic-name" /></div></Field>
          <Field label={copy.email} error={form.formState.errors.email?.message}><div className="relative"><Mail size={17} className="absolute right-3.5 top-3.5 text-[#8ca2ad]" /><input {...form.register('email', { required: copy.requiredEmail, pattern: { value: /^\S+@\S+\.\S+$/, message: copy.invalidEmail } })} className="input-field pr-11 text-left" dir="ltr" type="email" placeholder="name@clinic.com" autoComplete="email" data-testid="input-register-email" /></div></Field>
          <Field label={copy.password} error={form.formState.errors.password?.message} hint={copy.passwordHint}><div className="relative"><ShieldCheck size={17} className="absolute right-3.5 top-3.5 text-[#8ca2ad]" /><input {...form.register('password', { required: copy.requiredPassword, minLength: { value: 8, message: copy.minPassword } })} className="input-field pr-11 text-left" dir="ltr" type="password" placeholder="••••••••" autoComplete="new-password" data-testid="input-register-password" /></div></Field>
          <label className="flex items-start gap-2 pt-1 text-xs leading-5 text-[#718591]"><input type="checkbox" required className="mt-1 h-4 w-4 accent-[#174963]" data-testid="input-terms" /> {copy.terms}</label>
          <button className="primary-button mt-2 w-full" type="submit" disabled={register.isPending} data-testid="button-register">{register.isPending ? <><RefreshCw size={17} className="animate-spin" /> {copy.loading}</> : <>{copy.submit} <ArrowLeft size={17} /></>}</button>
        </form>
        <p className="mt-7 text-center text-sm text-[#718591]">{copy.haveAccount} <Link href="/login" className="font-bold text-[#3c7e93]" data-testid="link-login">{copy.login}</Link></p>
      </div>
    </AuthLayout>
  );
}

function Sidebar({ clinicName, userName, mobileOpen = false, onNavigate }: { clinicName: string; userName: string; mobileOpen?: boolean; onNavigate?: () => void }) {
  const [location, setLocation] = useLocation();
  const logout = useLogout();
  const [collapsed, setCollapsed] = useState(() => window.localStorage.getItem('meruna-sidebar-collapsed') === 'true');
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = Number(window.localStorage.getItem('meruna-sidebar-width'));
    return Number.isFinite(saved) ? Math.min(360, Math.max(220, saved)) : 248;
  });
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const [clinicMenuOpen, setClinicMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { language, theme, t, toggleLanguage, toggleTheme, selectedBranchId, setSelectedBranchId, branches, branchesLoading, branchesError, loadBranches } = usePreferences();
  const navGroups: Array<{ id: string; title: string; links: Array<{ href: string; label: string; icon: typeof Home }> }> = [
    { id: 'operations', title: language === 'ar' ? 'التشغيل' : 'Operations', links: [
      { href: '/dashboard', label: t('overview'), icon: Home },
      { href: '/operations', label: language === 'ar' ? 'لوحة التشغيل' : 'Operations board', icon: Activity },
      { href: '/waitlist', label: t('waitlist'), icon: Clock3 },
      { href: '/follow-ups', label: t('followUps'), icon: Sparkles },
      { href: '/no-shows', label: t('noShowsOpen'), icon: ShieldCheck },
    ] },
    { id: 'patients', title: language === 'ar' ? 'المرضى' : 'Patients', links: [
      { href: '/patients', label: t('patients'), icon: UsersRound },
      { href: '/appointments', label: t('appointments'), icon: Clock3 },
      { href: '/inbox', label: t('inbox'), icon: Inbox },
      { href: '/voice-agent', label: t('voiceAgent'), icon: PhoneCall },
    ] },
    { id: 'settings', title: language === 'ar' ? 'الإعدادات' : 'Settings', links: [
      { href: '/organization', label: language === 'ar' ? 'بيانات المنشأة' : 'Organization', icon: Building2 },
      { href: '/billing', label: t('reports'), icon: CreditCard },
      { href: '/settings', label: t('settings'), icon: Settings2 },
    ] },
  ];
  const doLogout = () => logout.mutate(undefined, { onSuccess: () => { queryClient.clear(); toast.success('تم تسجيل الخروج'); setLocation('/login'); }, onError: () => toast.error('تعذر تسجيل الخروج، حاول مجددًا') });

  useEffect(() => {
    window.localStorage.setItem('meruna-sidebar-collapsed', String(collapsed));
  }, [collapsed]);
  useEffect(() => {
    window.localStorage.setItem('meruna-sidebar-width', String(sidebarWidth));
  }, [sidebarWidth]);
  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (!resizeRef.current || collapsed) return;
      const nextWidth = Math.min(360, Math.max(220, resizeRef.current.startWidth + event.clientX - resizeRef.current.startX));
      setSidebarWidth(nextWidth);
    };
    const onPointerUp = () => {
      resizeRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [collapsed]);

  const sidebarStyle = { '--sidebar-width': `${collapsed ? 84 : sidebarWidth}px` } as CSSProperties;
  return (
    <aside className={`sidebar relative flex w-full flex-col px-4 py-5 md:sticky md:top-0 md:h-[100dvh] md:w-[var(--sidebar-width)] md:shrink-0 md:px-5 md:py-7 ${mobileOpen ? 'sidebar-open' : ''}`} style={sidebarStyle} dir="rtl" aria-hidden={undefined}>
      <button type="button" className="sidebar-close" onClick={onNavigate} aria-label="إغلاق القائمة"><X size={18} /></button>
      <div className={`brand-lockup mb-10 flex items-center ${collapsed ? 'justify-center gap-2 px-0' : 'justify-between px-2'}`}>
        {collapsed ? <div className="brand-mark" aria-label="MERUNA SYSTEM"><span /></div> : <Logo />}
        <button type="button" onClick={() => setCollapsed((value) => !value)} className="sidebar-tool" aria-label={collapsed ? 'توسيع الشريط الجانبي' : 'طي الشريط الجانبي'} title={collapsed ? 'توسيع الشريط الجانبي' : 'طي الشريط الجانبي'} data-testid="button-toggle-sidebar">
          {collapsed ? <PanelRightOpen size={17} /> : <PanelRightClose size={17} />}
        </button>
      </div>
      <div className="relative mb-7">
        <button type="button" onClick={() => { loadBranches(); setClinicMenuOpen((value) => !value); }} aria-expanded={clinicMenuOpen} aria-label="تبديل العيادة أو الفرع" title={collapsed ? clinicName : undefined} className={`sidebar-clinic flex w-full items-center rounded-xl border border-[#688b9c]/20 bg-[#143149] p-3 text-right ${collapsed ? 'justify-center gap-0' : 'gap-3'}`} data-testid="button-clinic-switcher">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#8fbaca]/15 text-[#9cc6d3]"><Building2 size={18} /></div>
          <div className={`min-w-0 ${collapsed ? 'md:hidden' : ''}`}><p className="truncate text-xs font-bold text-[#e6f0f2]" data-testid="text-sidebar-clinic">{clinicName}</p><p className="mt-0.5 flex items-center gap-1.5 text-[.68rem] text-[#8ea9b5]"><span className="status-dot" /> {branchesLoading ? t('loadingBranches') : selectedBranchId === 'all' ? t('clinicWide') : branches.find((branch) => branch.id === selectedBranchId)?.name || t('chooseBranch')}</p></div>
          <ChevronDown size={14} className={`mr-auto text-[#7895a2] transition-transform ${clinicMenuOpen ? 'rotate-180' : ''} ${collapsed ? 'md:hidden' : ''}`} />
        </button>
        {clinicMenuOpen && <div className={`sidebar-popover absolute z-20 mt-2 rounded-xl border border-[#688b9c]/20 bg-[#123047] p-2 shadow-xl ${collapsed ? 'md:right-0 md:w-56' : 'inset-x-0'}`} role="menu" aria-label="اختيار الفرع">
          <div className="px-2 py-1.5 text-[10px] font-bold text-[#8ea9b5]">{t('chooseBranchSidebar')}</div>
          <button type="button" onClick={() => { setSelectedBranchId('all'); setClinicMenuOpen(false); }} className={`sidebar-menu-item ${selectedBranchId === 'all' ? 'selected' : ''}`} role="menuitem" data-testid="button-branch-all"><span>{t('allBranches')}</span>{selectedBranchId === 'all' && <Check size={14} />}</button>
          {branches.map((branch) => <button type="button" key={branch.id} onClick={() => { setSelectedBranchId(branch.id); setClinicMenuOpen(false); }} className={`sidebar-menu-item ${selectedBranchId === branch.id ? 'selected' : ''}`} role="menuitem" data-testid={`button-branch-${branch.id}`}><span className="truncate">{branch.name}</span>{selectedBranchId === branch.id && <Check size={14} />}</button>)}
          {!branchesLoading && branchesError && <p className="px-2 py-2 text-[10px] leading-5 text-[#efb2ac]">{t('branchError')}</p>}
          {!branchesLoading && !branchesError && branches.length === 0 && <p className="px-2 py-2 text-[10px] leading-5 text-[#8ea9b5]">{language === 'ar' ? 'لا توجد فروع نشطة؛ الاختيار الحالي يشمل العيادة كلها.' : 'No active branches; the current selection covers the whole clinic.'}</p>}
        </div>}
      </div>
      <nav className={`sidebar-nav min-h-0 overflow-y-auto space-y-1 ${collapsed ? 'md:space-y-2' : ''}`} aria-label="التنقل الرئيسي">
        {navGroups.map((group) => <div key={group.id} className="sidebar-group">
          <p className={`sidebar-group-label ${collapsed ? 'md:sr-only' : ''}`}>{group.title}</p>
          {group.links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => onNavigate?.()} title={collapsed ? label : undefined} aria-label={label} className={`sidebar-link px-3 py-3 text-sm font-semibold ${collapsed ? 'md:justify-center md:gap-0' : ''} ${location === href || location.startsWith(`${href}/`) ? 'active' : ''}`} data-testid={`link-nav-${href.slice(1)}`}><Icon size={18} strokeWidth={1.8} /><span className={collapsed ? 'md:sr-only' : ''}>{label}</span>{collapsed ? <ChevronRight size={12} className="hidden md:block" aria-hidden="true" /> : null}</Link>)}
        </div>)}
      </nav>
      <div className={`sidebar-footer mt-auto shrink-0 border-t border-[#688b9c]/15 pt-5 ${collapsed ? 'md:px-0' : ''}`}>
        <div className="relative">
          <button type="button" onClick={() => setProfileMenuOpen((value) => !value)} aria-expanded={profileMenuOpen} aria-label={t('accountMenu')} title={collapsed ? userName : undefined} className={`mb-2 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-right transition hover:bg-white/10 ${collapsed ? 'md:justify-center md:px-0' : ''}`} data-testid="button-profile-menu"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#b2ccd6] text-sm font-bold text-[#15384d]">{userName.slice(0, 1)}</div><div className={`min-w-0 ${collapsed ? 'md:hidden' : ''}`}><p className="truncate text-xs font-bold text-[#e6f0f2]" data-testid="text-sidebar-user">{userName}</p><p className="text-[.68rem] text-[#8ea9b5]">{t('clinicOwner')}</p></div><ChevronDown size={14} className={`mr-auto text-[#7895a2] transition-transform ${profileMenuOpen ? 'rotate-180' : ''} ${collapsed ? 'md:hidden' : ''}`} /></button>
          {profileMenuOpen && <div className={`sidebar-popover absolute bottom-full z-20 mb-2 rounded-xl border border-[#688b9c]/20 bg-[#123047] p-2 shadow-xl ${collapsed ? 'md:right-0 md:w-56' : 'inset-x-0'}`} role="menu" aria-label="قائمة الملف الشخصي"><div className="px-2 py-1.5 text-[10px] font-bold text-[#8ea9b5]">{t('accountMenu')}</div><Link href="/settings" onClick={() => setProfileMenuOpen(false)} className="sidebar-menu-item" role="menuitem" data-testid="link-profile-settings"><Settings2 size={15} /><span>{t('settings')}</span></Link><button type="button" onClick={doLogout} disabled={logout.isPending} className="sidebar-menu-item danger" role="menuitem" data-testid="button-profile-logout"><LogOut size={15} /><span>{logout.isPending ? (language === 'ar' ? 'جارٍ الخروج...' : 'Signing out...') : t('logout')}</span></button></div>}
        </div>
      </div>
      <div className={`sidebar-resizer ${collapsed ? 'hidden' : ''}`} role="separator" aria-orientation="vertical" aria-label="تغيير عرض الشريط الجانبي" tabIndex={0} onPointerDown={(event) => { event.preventDefault(); resizeRef.current = { startX: event.clientX, startWidth: sidebarWidth }; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; }}><GripVertical size={15} /></div>
    </aside>
  );
}

function WorkspaceToolbar({ onOpenMenu, onOpenSearch }: { onOpenMenu?: () => void; onOpenSearch?: () => void }) {
  const { language, theme, t, toggleLanguage, toggleTheme, selectedBranchId } = usePreferences();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const summaryQuery = useQuery({ queryKey: ['operations', 'summary', 'notifications', selectedBranchId], queryFn: ({ signal }) => getOperationsSummary(signal, selectedBranchId === 'all' ? undefined : selectedBranchId), enabled: notificationsOpen, staleTime: 30_000, refetchInterval: 60_000, refetchIntervalInBackground: false });
  const stats = summaryQuery.data?.stats;
  const notifications = [
    { id: 'inbox', label: t('conversationsNeedStaff'), count: stats?.conversationsNeedingStaff ?? 0, href: '/inbox' },
    { id: 'follow-ups', label: t('followUpsDue'), count: stats?.openFollowUps ?? 0, href: '/follow-ups' },
    { id: 'no-shows', label: t('noShowsOpen'), count: stats?.openNoShows ?? 0, href: '/no-shows' },
    { id: 'waitlist', label: t('waitlistActive'), count: stats?.activeWaitlist ?? 0, href: '/waitlist' },
  ].filter((item) => item.count > 0);
  const unreadCount = notifications.length;
  return <div className="workspace-toolbar flex items-center gap-2 border-b border-[#dbe5ea] bg-[#f6f9fa]/90 px-5 py-3 backdrop-blur md:px-9" dir="rtl">
    <button type="button" onClick={onOpenMenu} className="toolbar-button md:hidden" aria-label="فتح القائمة" data-testid="button-open-menu"><Menu size={18} /></button>
    <div className="min-w-0 flex-1 md:hidden"><p className="truncate text-[11px] font-bold text-[#78909c]">MERUNA SYSTEM</p><p className="truncate text-xs text-[#8a9ba4]">{language === 'ar' ? 'مساحة عمل العيادة' : 'Clinic workspace'}</p></div>
    {onOpenSearch ? <div className="hidden min-w-0 flex-1 md:block"><CommandPaletteTrigger onOpen={onOpenSearch} language={language} /></div> : null}
    {onOpenSearch ? <button type="button" onClick={onOpenSearch} className="toolbar-button md:hidden" aria-label={language === 'ar' ? 'بحث' : 'Search'} data-testid="button-open-search-mobile"><Search size={17} /></button> : null}
    <div className="relative">
      <button type="button" onClick={() => setNotificationsOpen((value) => !value)} aria-expanded={notificationsOpen} aria-label={t('notifications')} className="toolbar-button" data-testid="button-notifications"><Bell size={17} />{unreadCount > 0 && <span className="toolbar-badge">{unreadCount}</span>}</button>
      {notificationsOpen && <div className="toolbar-popover absolute left-0 top-full z-30 mt-2 w-[min(21rem,calc(100vw-2rem))] rounded-2xl border border-[#dbe5ea] bg-white p-2 text-right shadow-xl" role="dialog" aria-label={t('notifications')}><div className="border-b border-[#edf1f3] px-3 py-2"><p className="text-sm font-bold text-[#18374d]">{t('notifications')}</p><p className="mt-0.5 text-[10px] text-[#8496a0]">{t('notificationsSubtitle')}</p></div>{notifications.length ? notifications.map((item) => <Link key={item.id} href={item.href} onClick={() => setNotificationsOpen(false)} className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-xs text-[#28495b] transition hover:bg-[#f1f7f7]"><span className="min-w-0 truncate">{item.label}</span><strong className="rounded-md bg-[#dcecf5] px-2 py-1 text-[10px] text-[#22617d]">{item.count}</strong></Link>) : <p className="px-3 py-5 text-center text-xs text-[#8496a0]">{t('noNotifications')}</p>}{summaryQuery.isError && <p className="px-3 pb-2 text-[10px] text-[#a64036]">{language === 'ar' ? 'تعذر تحديث الإشعارات.' : 'Notifications could not be refreshed.'}</p>}</div>}
    </div>
    <button type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? t('lightMode') : t('darkMode')} title={theme === 'dark' ? t('lightMode') : t('darkMode')} className="toolbar-button" data-testid="button-theme-toggle">{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
    <button type="button" onClick={toggleLanguage} aria-label={t('switchLanguage')} title={t('switchLanguage')} className="toolbar-language" data-testid="button-language-toggle">{language === 'ar' ? 'EN' : 'ع'}</button>
  </div>;
}

function DashboardSkeleton() {
  return <div className="space-y-6" data-testid="state-loading"><div className="skeleton h-32 w-full" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map(i => <div className="skeleton h-36" key={i} />)}</div><div className="skeleton h-64 w-full" /></div>;
}

function StatCard({ label, value, helper, tone, index }: { label: string; value: string; helper: string; tone: string; index: number }) {
  const palette: Record<string, string> = { blue: '#347b98', green: '#3d8a72', amber: '#a6773a', violet: '#7568a0' };
  const color = palette[tone] ?? palette.blue;
  return <article className="surface stat-card animate-rise p-5" style={{ color, animationDelay: `${index * 70}ms` }} data-testid={`card-stat-${index}`}><div className="mb-6 flex items-start justify-between"><span className="text-[.78rem] font-bold text-[#66808e]" data-testid={`text-stat-label-${index}`}>{label}</span><span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} /></div><p className="text-3xl font-extrabold tracking-tight text-[#18374d]" data-testid={`text-stat-value-${index}`}>{value}</p><p className="mt-2 text-xs text-[#8a9ba4]" data-testid={`text-stat-helper-${index}`}>{helper}</p></article>;
}

function DashboardPage({ session }: { session: { user: { fullName: string }; clinic: { name: string; city: string } } }) {
  const summaryQuery = useGetDashboardSummary({ query: { retry: 1, queryKey: getGetDashboardSummaryQueryKey() } });
  const summary = summaryQuery.data;
  const firstName = session.user.fullName.split(' ')[0];
  const activities = summary?.recentActivity ?? [];
  const dateLabel = new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  return <div className="main-content min-w-0 flex-1" dir="rtl">
    <header className="flex items-center justify-between border-b border-[#dbe5ea] bg-[#f6f9fa]/90 px-5 py-4 backdrop-blur md:px-9"><div><p className="text-xs font-semibold text-[#78909c]" data-testid="text-current-date">{dateLabel}</p><h1 className="ar mt-1 text-xl font-bold text-[#15364b]" data-testid="heading-dashboard">صباح الخير، {firstName}</h1></div><div className="flex items-center gap-2"><button className="quiet-button hidden sm:inline-flex" onClick={() => toast.info('لا توجد إشعارات جديدة')} data-testid="button-notifications"><Bell size={18} /><span className="text-xs">الإشعارات</span></button><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c9dce3] text-sm font-bold text-[#1c4b61]" data-testid="avatar-user">{firstName.slice(0, 1)}</div></div></header>
    <div className="mx-auto max-w-[1450px] space-y-7 p-5 md:p-9">
      <div className="animate-rise relative overflow-hidden rounded-2xl bg-[#0c2b41] px-6 py-7 text-[#edf7f8] shadow-[0_16px_32px_rgba(17,55,74,.12)] md:px-8 md:py-8"><div className="relative z-10 max-w-xl"><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#9ec8d3]"><span className="status-dot" /> لوحة عيادتك اليوم</div><h2 className="ar text-2xl font-bold leading-relaxed md:text-3xl">هذه هي الصورة الكاملة لعيادتك.</h2><p className="ar mt-2 text-sm leading-7 text-[#aac1ca]">ابدأ بالأهم، واترك الباقي لMERUNA SYSTEM.</p></div><div className="absolute -left-8 -top-20 h-64 w-64 rounded-full border border-[#80b6c7]/20" /><div className="absolute -left-16 -top-28 h-80 w-80 rounded-full border border-[#80b6c7]/10" /><div className="absolute bottom-0 left-12 hidden h-20 w-20 rotate-45 border border-[#80b6c7]/20 md:block" /></div>
      {summaryQuery.isLoading ? <DashboardSkeleton /> : summaryQuery.isError ? <ErrorMessage onRetry={() => summaryQuery.refetch()} /> : summary ? <><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{summary.stats.map((stat, i) => <StatCard {...stat} index={i} key={`${stat.label}-${i}`} />)}</section><section className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]"><div className="surface animate-rise delay-2 p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="font-bold text-[#18374d]">آخر النشاطات</h2><p className="mt-1 text-xs text-[#8496a0]">ما تم إنجازه مؤخرًا في العيادة</p></div><button className="quiet-button text-xs" onClick={() => toast.info('أنت ترى آخر النشاطات بالفعل')} data-testid="button-view-activity">عرض الكل <ArrowLeft size={14} /></button></div>{activities.length ? <div className="divide-y divide-[#edf1f3]">{activities.map((item) => <div className="animate-sweep flex gap-4 py-4 first:pt-0 last:pb-0" key={item.id} data-testid={`activity-${item.id}`}><div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f2f4] text-[#4c8b9e]"><Activity size={17} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold text-[#28495b]" data-testid={`text-activity-title-${item.id}`}>{item.title}</h3><time className="text-[.68rem] text-[#99a8af]" dateTime={item.createdAt}>{new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'short' }).format(new Date(item.createdAt))}</time></div><p className="mt-1 text-xs leading-6 text-[#7f919a]" data-testid={`text-activity-description-${item.id}`}>{item.description}</p></div></div>)}</div> : <div className="flex flex-col items-center py-10 text-center" data-testid="state-empty-activity"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#edf4f5] text-[#789daa]"><FileText size={20} /></div><p className="text-sm font-bold text-[#527080]">لا توجد نشاطات بعد</p><p className="mt-1 text-xs text-[#95a4ab]">ستظهر هنا آخر مستجدات عيادتك.</p></div>}</div><div className="surface animate-rise delay-3 p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="font-bold text-[#18374d]">نبض العيادة</h2><p className="mt-1 text-xs text-[#8496a0]">مؤشرات تساعدك على القرار</p></div><Sparkles size={19} className="text-[#77a5b2]" /></div><div className="space-y-5"><div className="rounded-xl bg-[#f1f7f7] p-4"><div className="flex items-center justify-between text-xs"><span className="font-bold text-[#3c6f79]">جاهزية اليوم</span><span className="font-extrabold text-[#3d8a72]">مستقرة</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#d7e8e7]"><div className="h-full w-[82%] rounded-full bg-[#66a898]" /></div><p className="mt-2 text-[.68rem] text-[#80969a]">كل ما يلزم فريقك واضح الآن</p></div><div className="flex items-start gap-3 border-b border-[#edf1f3] pb-4"><Clock3 size={17} className="mt-0.5 text-[#ad8248]" /><div><p className="text-xs font-bold text-[#355467]">الوقت في صفك</p><p className="mt-1 text-xs leading-5 text-[#8b9aa2]">استغل هدوء بداية اليوم لمراجعة الأولويات.</p></div></div><div className="flex items-start gap-3"><UsersRound size={17} className="mt-0.5 text-[#6f69a0]" /><div><p className="text-xs font-bold text-[#355467]">فريقك متصل</p><p className="mt-1 text-xs leading-5 text-[#8b9aa2]">تابع العمل من لوحة واحدة.</p></div></div></div></div></section></> : <div className="surface p-10 text-center" data-testid="state-empty-dashboard"><Building2 className="mx-auto mb-3 text-[#7d9eaa]" /><p className="font-bold text-[#36596d]">لا توجد بيانات للعيادة</p></div>}
    </div>
  </div>;
}

function SettingsPage({ session }: { session: { user: { fullName: string; email: string; role: string }; clinic: { name: string; city: string; status: string } } }) {
  const client = useQueryClient();
  const settingsQuery = useGetClinicSettings();
  const updateSettings = useUpdateClinicSettings();
  const [saved, setSaved] = useState(false);
  const form = useForm({ defaultValues: { fullName: session.user.fullName, email: session.user.email, clinicName: session.clinic.name, city: session.clinic.city } });

  useEffect(() => {
    if (settingsQuery.data) {
      form.reset({
        fullName: settingsQuery.data.user.fullName,
        email: settingsQuery.data.user.email,
        clinicName: settingsQuery.data.clinic.name,
        city: settingsQuery.data.clinic.city === '—' ? '' : settingsQuery.data.clinic.city,
      });
    }
  }, [settingsQuery.data, form]);

  const save = (values: Record<string, string>) => {
    updateSettings.mutate({ data: { fullName: values.fullName, clinicName: values.clinicName, city: values.city } }, {
      onSuccess: (data) => {
        client.setQueryData(getGetAuthSessionQueryKey(), data);
        client.setQueryData(getGetClinicSettingsQueryKey(), data);
        form.reset({ fullName: data.user.fullName, email: data.user.email, clinicName: data.clinic.name, city: data.clinic.city === '—' ? '' : data.clinic.city });
        setSaved(true);
        toast.success('تم حفظ التغييرات');
        window.setTimeout(() => setSaved(false), 2200);
      },
    });
  };

  if (settingsQuery.isLoading) return <div className="main-content min-w-0 flex-1 p-9" dir="rtl"><DashboardSkeleton /></div>;
  if (settingsQuery.isError) return <div className="main-content min-w-0 flex-1 p-9" dir="rtl"><ErrorMessage onRetry={() => settingsQuery.refetch()} /></div>;

  return <div className="main-content min-w-0 flex-1" dir="rtl"><header className="flex items-center justify-between border-b border-[#dbe5ea] bg-[#f6f9fa]/90 px-5 py-4 md:px-9"><div><p className="text-xs font-semibold text-[#78909c]">مساحتك الخاصة</p><h1 className="ar mt-1 text-xl font-bold text-[#15364b]" data-testid="heading-settings">الإعدادات</h1></div><button className="quiet-button" onClick={() => form.reset()} data-testid="button-reset-settings"><RefreshCw size={17} /> إعادة الضبط</button></header><div className="mx-auto max-w-[1020px] space-y-6 p-5 md:p-9"><div className="animate-rise rounded-2xl bg-[#dcebef] p-6 md:p-8"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f2fafb] text-[#4c8a9b]"><Settings2 size={22} /></div><div><h2 className="ar text-xl font-bold text-[#173f54]">تفاصيل الحساب والعيادة</h2><p className="mt-1 text-sm leading-6 text-[#587785]">حدّث معلوماتك الأساسية لتبقى مساحة العمل دقيقة وواضحة لفريقك.</p></div></div></div>{updateSettings.error ? <div className="surface rounded-xl border-[#edc4c0] bg-[#fff7f6] p-3 text-sm text-[#a54c46]" data-testid="alert-settings-error">تعذر حفظ التغييرات. حاول مرة أخرى.</div> : null}<form onSubmit={form.handleSubmit(save)} className="space-y-6"><section className="surface animate-rise delay-1 p-6 md:p-7"><div className="mb-6 flex items-center gap-3 border-b border-[#edf1f3] pb-5"><UserRound size={18} className="text-[#578b9d]" /><div><h2 className="font-bold text-[#23475b]">بيانات المسؤول</h2><p className="mt-1 text-xs text-[#8999a1]">بيانات تسجيل الدخول والهوية</p></div></div><div className="grid gap-5 md:grid-cols-2"><Field label="الاسم الكامل"><input {...form.register('fullName')} className="input-field" data-testid="input-settings-full-name" /></Field><Field label="البريد الإلكتروني"><input {...form.register('email')} className="input-field text-left bg-[#f3f6f7]" dir="ltr" type="email" readOnly data-testid="input-settings-email" /></Field></div><div className="mt-5 flex items-center gap-2 text-xs text-[#72909b]"><ShieldCheck size={15} /> صلاحية الحساب: <strong className="text-[#3d7587]">{session.user.role === 'owner' ? 'مالك العيادة' : 'مدير'}</strong></div></section><section className="surface animate-rise delay-2 p-6 md:p-7"><div className="mb-6 flex items-center gap-3 border-b border-[#edf1f3] pb-5"><Building2 size={18} className="text-[#578b9d]" /><div><h2 className="font-bold text-[#23475b]">معلومات العيادة</h2><p className="mt-1 text-xs text-[#8999a1]">تظهر هذه المعلومات لفريقك</p></div></div><div className="grid gap-5 md:grid-cols-2"><Field label="اسم العيادة"><input {...form.register('clinicName')} className="input-field" data-testid="input-settings-clinic-name" /></Field><Field label="المدينة"><div className="relative"><MapPin size={17} className="absolute right-3.5 top-3.5 text-[#8ca2ad]" /><input {...form.register('city')} className="input-field pr-11" data-testid="input-settings-city" /></div></Field></div><div className="mt-5 flex items-center gap-2 text-xs text-[#72909b]"><span className="status-dot" /> حالة العيادة: <strong className="text-[#3d7587]">{session.clinic.status || 'نشطة'}</strong></div></section><div className="flex items-center justify-end gap-3"><span className={`text-xs font-bold text-[#4d967f] transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`} data-testid="text-settings-saved"><Check size={14} className="inline" /> تم الحفظ</span><button type="submit" className="primary-button" disabled={updateSettings.isPending} data-testid="button-save-settings"><Check size={17} /> {updateSettings.isPending ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}</button></div></form></div></div>;
}

function ShellCommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { language } = usePreferences();
  return <CommandPalette open={open} onOpenChange={onOpenChange} language={language} />;
}

function ProtectedShell() {
  const sessionQuery = useGetAuthSession({ query: { retry: false, queryKey: getGetAuthSessionQueryKey() } });
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { open: searchOpen, setOpen: setSearchOpen } = useCommandPalette();
  const needsLogin = sessionQuery.isError || !sessionQuery.data;

  useEffect(() => {
    if (needsLogin && location !== '/login') {
      setLocation('/login');
    }
  }, [location, needsLogin, setLocation]);

  useEffect(() => { setMenuOpen(false); }, [location]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  if (sessionQuery.isLoading) return <div className="flex min-h-[100dvh] items-center justify-center bg-[#eef3f7]" data-testid="state-session-loading"><div className="w-64 space-y-3"><div className="skeleton h-4 w-24" /><div className="skeleton h-10 w-full" /><div className="skeleton h-24 w-full" /></div></div>;
  if (needsLogin) return null;
  const session = sessionQuery.data;
  return <div className="app-shell flex min-h-[100dvh] md:flex-row" dir="ltr">
    <Sidebar clinicName={session.clinic.name} userName={session.user.fullName} mobileOpen={menuOpen} onNavigate={() => setMenuOpen(false)} />
    {menuOpen ? <div className="sidebar-overlay md:hidden" role="presentation" onClick={() => setMenuOpen(false)} /> : null}
    <div className={`main-content flex min-h-0 min-w-0 flex-1 flex-col ${location === '/inbox' ? 'md:h-[100dvh] md:overflow-hidden' : ''}`} dir="rtl">
      <WorkspaceToolbar onOpenMenu={() => setMenuOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
      <ShellCommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      <div className="workspace-route flex min-h-0 flex-1 flex-col">
        <Suspense fallback={<RouteFallback />}>
        <Switch>
          <Route path="/settings">{() => <SettingsPage session={session} />}</Route>
          <Route path="/patients" component={LivePatientsPage} />
          <Route path="/patients/:id" component={Patient360Page} />
          <Route path="/appointments" component={LiveAppointmentsPage} />
          <Route path="/appointments/:id" component={AppointmentJourneyPage} />
          <Route path="/inbox" component={LiveInboxPage} />
          <Route path="/waitlist" component={WaitlistPage} />
          <Route path="/follow-ups" component={FollowUpsPage} />
          <Route path="/no-shows" component={NoShowsPage} />
          <Route path="/voice-agent" component={LiveVoiceAgentPage} />
          <Route path="/billing" component={BillingPage} />
          <Route path="/operations">{() => <OperationsDashboard session={session} />}</Route>
          <Route path="/organization" component={OrganizationSettings} />
          <Route>{() => <LiveDashboard session={session} />}</Route>
        </Switch>
        </Suspense>
      </div>
    </div>
  </div>;
}

function NotFound() {
  const [, setLocation] = useLocation();
  return <main className="noise flex min-h-[100dvh] items-center justify-center bg-[#eef3f7] p-6" dir="rtl"><div className="surface w-full max-w-[520px] rounded-2xl p-8 text-center md:p-12"><div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#dbecef] text-[#528b9b]"><CircleHelp size={29} /></div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#75a0ae]">404 / الصفحة غير موجودة</p><h1 className="ar mt-3 text-2xl font-bold text-[#173c52]">هذه الصفحة أخذت استراحة.</h1><p className="mt-2 text-sm leading-7 text-[#7b8f99]">الرابط الذي تتبعه غير متاح. عد إلى لوحة العيادة لنكمل يومك.</p><button className="primary-button mt-7" onClick={() => setLocation('/dashboard')} data-testid="button-go-dashboard"><ArrowRight size={17} /> العودة إلى الرئيسية</button></div></main>;
}

function Router() {
  const [location] = useLocation();
  const legalRoutes = ['/refund-policy', '/privacy-policy', '/terms', '/cookie-policy', '/contact'];
  const publicRoute = location === '/' || location === '/current-home' || location === '/merged-home' || location === '/login' || location === '/register' || location === '/forgot-password' || location === '/reset-password' || legalRoutes.includes(location);
  return <ErrorBoundary resetKey={location}>{publicRoute ? <Suspense fallback={<PublicRouteFallback />}><Switch><Route path="/" component={MerunaHome} /><Route path="/current-home" component={CurrentMerunaHome} /><Route path="/merged-home" component={MergedMerunaHome} /><Route path="/refund-policy">{() => <LegalPage kind="refund" />}</Route><Route path="/privacy-policy">{() => <LegalPage kind="privacy" />}</Route><Route path="/terms">{() => <LegalPage kind="terms" />}</Route><Route path="/cookie-policy">{() => <LegalPage kind="cookies" />}</Route><Route path="/contact">{() => <LegalPage kind="contact" />}</Route><Route path="/login" component={LoginPage} /><Route path="/register" component={RegisterPage} /><Route path="/forgot-password" component={LoginPage} /><Route path="/reset-password" component={LoginPage} /></Switch></Suspense> : <PreferencesProvider><Switch><Route path="/dashboard" component={ProtectedShell} /><Route path="/settings" component={ProtectedShell} /><Route path="/patients" component={ProtectedShell} /><Route path="/patients/:id" component={ProtectedShell} /><Route path="/appointments" component={ProtectedShell} /><Route path="/appointments/:id" component={ProtectedShell} /><Route path="/inbox" component={ProtectedShell} /><Route path="/waitlist" component={ProtectedShell} /><Route path="/follow-ups" component={ProtectedShell} /><Route path="/no-shows" component={ProtectedShell} /><Route path="/voice-agent" component={ProtectedShell} /><Route path="/billing" component={ProtectedShell} /><Route path="/operations" component={ProtectedShell} /><Route path="/organization" component={ProtectedShell} /><Route component={NotFound} /></Switch></PreferencesProvider>}</ErrorBoundary>;
}

function App() {
  return <AuthLocaleProvider><QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster position="bottom-left" richColors /></QueryClientProvider></AuthLocaleProvider>;
}

export default App;
