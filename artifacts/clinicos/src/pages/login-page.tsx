import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Globe,
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
  type LoginInput,
} from '@workspace/api-client-react';

type AuthLanguage = 'ar' | 'en';

const authCopy = {
  ar: {
    language: 'English',
    brandBadge: 'نظام إدارة العيادات الذكي',
    secure: 'اتصال آمن ومشفّر 256-bit',
    login: {
      greeting: 'مرحباً بك مجدداً',
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
      submit: 'تسجيل الدخول',
      loading: 'جارٍ تسجيل الدخول...',
      noAccount: 'ليس لديك حساب بعد؟',
      register: 'سجل عيادتك الآن',
      or: 'أو بالبريد الإلكتروني',
      healthy: 'الخادم يعمل بكفاءة',
      degraded: 'الخدمة تواجه بطئاً مؤقتاً',
      requiredEmail: 'البريد الإلكتروني مطلوب',
      invalidEmail: 'صيغة البريد غير صحيحة',
      requiredPassword: 'كلمة المرور مطلوبة',
      minPassword: 'كلمة المرور لا تقل عن 6 أحرف',
      errorInvalid: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    },
    recovery: {
      eyebrow: 'استعادة الحساب',
      title: 'نسيت كلمة المرور؟',
      subtitle: 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً آمناً لإعادة التعيين.',
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
  },
  en: {
    language: 'العربية',
    brandBadge: 'Intelligent Clinic System',
    secure: 'Secure 256-bit encrypted connection',
    login: {
      greeting: 'Welcome back',
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
      submit: 'Sign In to Workspace',
      loading: 'Signing in...',
      noAccount: "Don't have an account?",
      register: 'Register your clinic',
      or: 'or continue with email',
      healthy: 'All systems operational',
      degraded: 'Service is temporarily degraded',
      requiredEmail: 'Email is required',
      invalidEmail: 'Enter a valid email address',
      requiredPassword: 'Password is required',
      minPassword: 'Password must be at least 6 characters',
      errorInvalid: 'Invalid email or password',
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
  },
};

function getApiErrorMessage(error: unknown, language: 'ar' | 'en' = 'ar'): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const candidate = error as { data?: unknown; error?: unknown; message?: unknown; status?: unknown };
  const fallback = language === 'ar'
    ? 'تعذر الاتصال بخدمة الدخول مؤقتًا. يرجى المحاولة مرة أخرى.'
    : 'The sign-in service is temporarily unavailable. Please try again.';
  if (typeof candidate.message === 'string' && candidate.message.trim()) return candidate.message;
  if (typeof candidate.error === 'string' && candidate.error.trim()) return candidate.error;
  return fallback;
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

function AuthLayout({ children, languageToggle = true }: { children: ReactNode; languageToggle?: boolean }) {
  const { lang, text, toggleLanguage } = useAuthLocale();
  const en = lang === 'en';

  return (
    <div
      className="min-h-[100dvh] w-full bg-[#081624] text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-sky-500 selection:text-white"
      dir={en ? 'ltr' : 'rtl'}
      data-testid="auth-layout"
    >
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 size-96 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full bg-sky-600/5 blur-[90px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandMark size={38} />
          <div>
            <span className="font-extrabold tracking-wider text-base text-white block">MERUNA</span>
            <span className="text-[10px] text-sky-400 font-semibold tracking-widest uppercase block -mt-1">Clinic System</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-colors"
          >
            <ArrowRight className={`size-3.5 ${en ? 'rotate-180' : ''}`} />
            <span>{en ? 'Home' : 'الرئيسية'}</span>
          </Link>
          {languageToggle && (
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-colors"
              data-testid="button-auth-language"
            >
              <Globe className="size-3.5 text-sky-400" />
              <span>{text.language}</span>
            </button>
          )}
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-6 flex-1 flex flex-col justify-center">
        <div className="auth-animate-in w-full bg-[#0d2238] border border-[#1b3a56] shadow-2xl shadow-black/50 rounded-3xl p-7 sm:p-9">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-6 py-5 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-400 live-pulse-dot" />
          <span>{en ? 'System Operational 24/7' : 'النظام يعمل بكفاءة 24/7'}</span>
        </div>
        <div className="flex items-center gap-1">
          <ShieldCheck size={13} className="text-slate-400" />
          <span>{text.secure}</span>
        </div>
      </footer>
    </div>
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
    ['access_token', 'refresh_token', 'expires_in', 'expires_at', 'token_type', 'type'].forEach((key) =>
      cleanUrl.searchParams.delete(key)
    );
    cleanUrl.hash = '';
    window.history.replaceState(null, '', `${cleanUrl.pathname}${cleanUrl.search}`);
  }, []);

  return token;
}

function RecoveryView({ onBack }: { onBack: () => void }) {
  const recovery = useRecoverPassword();
  const form = useForm<RecoveryValues>({ defaultValues: { email: '' }, mode: 'onTouched' });
  const apiError = getApiErrorMessage(recovery.error);
  const { lang, text } = useAuthLocale();
  const en = lang === 'en';
  const copy = text.recovery;

  const submit = (values: RecoveryValues) => {
    recovery.mutate({ data: { email: values.email.trim() } });
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-widest text-sky-400 mb-1">{copy.eyebrow}</p>
        <h2 className="text-2xl font-black text-white">{copy.title}</h2>
        <p className="mt-1.5 text-xs text-slate-400 leading-5">{copy.subtitle}</p>
      </div>

      {apiError ? (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs leading-5 text-red-300" data-testid="alert-recovery-error">
          {apiError}
        </div>
      ) : null}

      {recovery.isSuccess ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs leading-6 text-emerald-300 text-center" data-testid="alert-recovery-success">
          {copy.success}
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
          <label className="block text-right">
            <span className="block text-xs font-bold text-slate-200 mb-1.5">{copy.email}</span>
            <div className="relative">
              <Mail size={16} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
              <input
                {...form.register('email', { required: copy.requiredEmail, pattern: { value: /^\S+@\S+\.\S+$/, message: copy.invalidEmail } })}
                className="w-full bg-[#081829] border border-[#1e3e5c] focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none transition-all"
                dir="ltr"
                type="email"
                placeholder={copy.emailPlaceholder}
                autoComplete="email"
                data-testid="input-recovery-email"
              />
            </div>
            {form.formState.errors.email?.message ? (
              <span className="block text-xs font-semibold text-red-400 mt-1" data-testid="text-field-error">{form.formState.errors.email.message}</span>
            ) : (
              <span className="block text-[11px] text-slate-400 mt-1">{copy.emailHint}</span>
            )}
          </label>

          <button
            className="w-full bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:opacity-95 text-white font-extrabold py-3 rounded-xl text-sm shadow-lg shadow-sky-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            type="submit"
            disabled={recovery.isPending}
            data-testid="button-recovery"
          >
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
        className="mt-6 w-full text-center text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
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
  const apiError = getApiErrorMessage(reset.error);
  const { lang, text } = useAuthLocale();
  const en = lang === 'en';
  const copy = text.reset;

  const submit = (values: ResetValues) => {
    reset.mutate({ data: { accessToken, password: values.password } });
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-widest text-sky-400 mb-1">{copy.eyebrow}</p>
        <h2 className="text-2xl font-black text-white">{copy.title}</h2>
        <p className="mt-1.5 text-xs text-slate-400 leading-5">{copy.subtitle}</p>
      </div>

      {apiError ? (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300" data-testid="alert-reset-error">
          {apiError}
        </div>
      ) : null}

      {reset.isSuccess ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs leading-6 text-emerald-300 text-center" data-testid="alert-reset-success">
            {copy.success}
          </div>
          <button
            type="button"
            className="w-full bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:opacity-95 text-white font-extrabold py-3 rounded-xl text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2"
            onClick={onDone}
            data-testid="button-reset-done"
          >
            <span>{copy.back}</span>
            <ArrowLeft className={`size-4 ${en ? 'rotate-180' : ''}`} />
          </button>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
          <label className="block text-right">
            <span className="block text-xs font-bold text-slate-200 mb-1.5">{copy.password}</span>
            <input
              {...form.register('password', { required: copy.requiredPassword, minLength: { value: 8, message: copy.minPassword } })}
              className="w-full bg-[#081829] border border-[#1e3e5c] focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              dir="ltr"
              type="password"
              autoComplete="new-password"
              data-testid="input-reset-password"
            />
            {form.formState.errors.password?.message && (
              <span className="block text-xs font-semibold text-red-400 mt-1" data-testid="text-field-error">{form.formState.errors.password.message}</span>
            )}
          </label>

          <label className="block text-right">
            <span className="block text-xs font-bold text-slate-200 mb-1.5">{copy.confirm}</span>
            <input
              {...form.register('confirmPassword', { required: copy.requiredConfirm, validate: (value) => value === form.getValues('password') || copy.mismatch })}
              className="w-full bg-[#081829] border border-[#1e3e5c] focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              dir="ltr"
              type="password"
              autoComplete="new-password"
              data-testid="input-reset-confirm-password"
            />
            {form.formState.errors.confirmPassword?.message && (
              <span className="block text-xs font-semibold text-red-400 mt-1" data-testid="text-field-error">{form.formState.errors.confirmPassword.message}</span>
            )}
          </label>

          <button
            className="w-full bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:opacity-95 text-white font-extrabold py-3 rounded-xl text-sm shadow-lg shadow-sky-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            type="submit"
            disabled={reset.isPending}
            data-testid="button-reset-password"
          >
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
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const login = useLogin();
  const recoveryToken = useRecoveryAccessToken();
  const [showRecovery, setShowRecovery] = useState(false);
  const health = useHealthCheck({ query: { retry: false, enabled: !showRecovery && !recoveryToken, queryKey: getHealthCheckQueryKey() } });
  const form = useForm<LoginInput>({ defaultValues: { email: '', password: '' }, mode: 'onTouched' });
  const [showPassword, setShowPassword] = useState(false);
  const { lang, text } = useAuthLocale();
  const en = lang === 'en';
  const copy = text.login;

  const onSubmit = (values: LoginInput) => {
    login.mutate(
      { data: values },
      {
        onSuccess: (session: unknown) => {
          client.setQueryData(getGetAuthSessionQueryKey(), session);
          toast.success(lang === 'ar' ? 'مرحبًا بعودتك' : 'Welcome back');
          setLocation('/dashboard');
        },
      }
    );
  };

  const apiError = getApiErrorMessage(login.error, lang);
  if (recoveryToken) {
    return (
      <AuthLayout>
        <ResetPasswordView
          accessToken={recoveryToken}
          onDone={() => {
            window.history.replaceState(null, '', '/login');
            setShowRecovery(false);
            window.location.reload();
          }}
        />
      </AuthLayout>
    );
  }

  if (showRecovery) {
    return (
      <AuthLayout>
        <RecoveryView onBack={() => setShowRecovery(false)} />
      </AuthLayout>
    );
  }

  const displayApiError =
    apiError?.toLowerCase().includes('email') || apiError?.toLowerCase().includes('password')
      ? copy.errorInvalid
      : apiError;

  return (
    <AuthLayout>
      <div>
        {/* Header */}
        <div className="mb-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-sky-400 mb-1">{copy.greeting}</p>
          <h1 className="text-2xl sm:text-3xl font-black text-white" data-testid="heading-login">
            {copy.title}
          </h1>
          <p className="mt-1.5 text-xs text-slate-400 leading-5">{copy.subtitle}</p>
        </div>

        {/* API Error */}
        {displayApiError ? (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs leading-5 text-red-300" data-testid="alert-login-error">
            <X size={15} className="mt-0.5 shrink-0 text-red-400" />
            <span>{displayApiError}</span>
          </div>
        ) : null}

        {/* Demo Login Button */}
        <button
          type="button"
          className="w-full mb-4 py-2.5 px-4 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          onClick={() => {
            form.setValue('email', 'demo@meruna.app');
            form.setValue('password', 'demo1234');
          }}
          data-testid="button-demo-login"
        >
          <Sparkles className="size-4 text-sky-400" />
          <span>{lang === 'ar' ? 'تجربة فورية كمدير عيادة (Demo)' : 'Quick Demo Login as Clinic Admin'}</span>
        </button>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700/60" />
          </div>
          <span className="relative bg-[#0d2238] px-3 text-[11px] font-semibold text-slate-400 uppercase">{copy.or}</span>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Email field */}
          <label className="block text-right">
            <span className="block text-xs font-bold text-slate-200 mb-1.5">{copy.email}</span>
            <div className="relative">
              <Mail size={16} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
              <input
                {...form.register('email', { required: copy.requiredEmail, pattern: { value: /^\S+@\S+\.\S+$/, message: copy.invalidEmail } })}
                className="w-full bg-[#081829] border border-[#1e3e5c] focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none transition-all"
                dir="ltr"
                type="email"
                placeholder={copy.emailPlaceholder}
                autoComplete="email"
                data-testid="input-login-email"
              />
            </div>
            {form.formState.errors.email?.message ? (
              <span className="block text-xs font-semibold text-red-400 mt-1" data-testid="text-field-error">
                {form.formState.errors.email.message}
              </span>
            ) : (
              <span className="block text-[11px] text-slate-400 mt-1">{copy.emailHint}</span>
            )}
          </label>

          {/* Password field */}
          <label className="block text-right">
            <span className="block text-xs font-bold text-slate-200 mb-1.5">{copy.password}</span>
            <div className="relative">
              <ShieldCheck size={16} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
              <input
                {...form.register('password', { required: copy.requiredPassword, minLength: { value: 6, message: copy.minPassword } })}
                className="w-full bg-[#081829] border border-[#1e3e5c] focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 pr-10 pl-10 text-sm outline-none transition-all"
                dir="ltr"
                type={showPassword ? 'text' : 'password'}
                placeholder={copy.passwordPlaceholder}
                autoComplete="current-password"
                data-testid="input-login-password"
              />
              <button
                type="button"
                className="absolute left-3.5 top-3.5 text-slate-400 hover:text-white transition-colors"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.formState.errors.password?.message && (
              <span className="block text-xs font-semibold text-red-400 mt-1" data-testid="text-field-error">
                {form.formState.errors.password.message}
              </span>
            )}
          </label>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition-colors select-none">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-sky-400 accent-sky-500" data-testid="input-remember" />
              <span>{copy.remember}</span>
            </label>
            <button
              type="button"
              className="font-bold text-sky-400 hover:text-sky-300 transition-colors"
              onClick={() => {
                login.reset();
                setShowRecovery(true);
              }}
              data-testid="button-forgot-password"
            >
              {copy.forgot}
            </button>
          </div>

          {/* Submit Button */}
          <button
            className="w-full bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:opacity-95 text-white font-extrabold py-3 rounded-xl text-sm shadow-lg shadow-sky-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            type="submit"
            disabled={login.isPending}
            data-testid="button-login"
          >
            {login.isPending ? (
              <><RefreshCw size={16} className="animate-spin" /><span>{copy.loading}</span></>
            ) : (
              <><span>{copy.submit}</span><ArrowLeft className={`size-4 ${en ? 'rotate-180' : ''}`} /></>
            )}
          </button>
        </form>

        {/* Register link */}
        <p className="mt-6 text-center text-xs text-slate-400">
          {copy.noAccount}{' '}
          <Link href="/register" className="font-bold text-sky-400 hover:text-sky-300 hover:underline transition-colors" data-testid="link-register">
            {copy.register}
          </Link>
        </p>

        {/* System status */}
        <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500" data-testid="status-api">
          <span className={`inline-block size-1.5 rounded-full ${health.isError ? 'bg-red-400' : 'bg-emerald-400'}`} />
          <span>{health.isError ? copy.degraded : copy.healthy}</span>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <AuthLocaleProvider>
      <LoginPageInner />
    </AuthLocaleProvider>
  );
}
