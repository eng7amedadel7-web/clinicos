import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff, Mail, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import {
  getGetAuthSessionQueryKey,
  getHealthCheckQueryKey,
  useHealthCheck,
  useLogin,
  useRecoverPassword,
  useResetPassword,
} from '@workspace/api-client-react';
import { matchAuthErrorKey } from '@/lib/api-errors';
import {
  AuthLocaleProvider,
  AuthShell,
  ErrorAlert,
  FieldError,
  FIELD_INPUT_CLASS,
  fieldClasses,
  getGreetingKey,
  SuccessAlert,
  SUBMIT_BUTTON_CLASS,
  useAuthLocale,
} from '@/components/auth-shell';

const pageCopy = {
  ar: {
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
  },
  en: {
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
  },
} as const;

function useLocalizedApiError(error: unknown): string | undefined {
  const { text } = useAuthLocale();
  if (!error) return undefined;
  const key = matchAuthErrorKey(error);
  return text.errors[key ?? 'generic'];
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

type RecoveryValues = { email: string };
type ResetValues = { password: string; confirmPassword: string };
type LoginValues = { email: string; password: string; remember: boolean };

function RecoveryView({ onBack }: { onBack: () => void }) {
  const recovery = useRecoverPassword();
  const form = useForm<RecoveryValues>({ defaultValues: { email: '' }, mode: 'onTouched' });
  const { lang, text } = useAuthLocale();
  const en = lang === 'en';
  const copy = pageCopy[lang].recovery;
  const field = fieldClasses(en);
  const apiError = useLocalizedApiError(recovery.error);

  const submit = (values: RecoveryValues) => {
    recovery.mutate({ data: { email: values.email.trim() } });
  };

  return (
    <div>
      <div>
        <p className="text-xs font-bold text-sky-700">{copy.eyebrow}</p>
        <h2 className="mt-1.5 text-2xl font-black text-[#0b2437]" data-testid="heading-recovery">
          {copy.title}
        </h2>
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
  const { lang } = useAuthLocale();
  const en = lang === 'en';
  const copy = pageCopy[lang].reset;
  const apiError = useLocalizedApiError(reset.error);

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
  const copy = pageCopy[lang].login;
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

  const apiError = useLocalizedApiError(login.error);

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

        {apiError ? (
          <div className="mt-5">
            <ErrorAlert testid="alert-login-error" message={apiError} />
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
