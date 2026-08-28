import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Mail,
  ShieldCheck,
  Building2,
  UserRound,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Globe,
  X,
} from 'lucide-react';
import { BrandMark } from '@/components/brand';
import {
  getGetAuthSessionQueryKey,
  useRegister,
  type RegisterInput,
} from '@workspace/api-client-react';

type AuthLanguage = 'ar' | 'en';

const authCopy = {
  ar: {
    language: 'English',
    brandBadge: 'نظام إدارة العيادات الذكي',
    secure: 'اتصال آمن ومشفّر 256-bit',
    registerPage: {
      eyebrow: 'ابدأ تجربتك',
      title: 'تسجيل عيادة جديدة',
      subtitle: 'أنشئ حساب عيادتك وابدأ في أتمتة العمليات والاستقبال الذكي فوراً.',
      fullName: 'الاسم الكامل للمدير',
      fullNamePlaceholder: 'د. أحمد محمود',
      clinicName: 'اسم العيادة / المركز الطبي',
      clinicNamePlaceholder: 'عيادة الأمل التخصصية',
      email: 'البريد الإلكتروني المهني',
      password: 'كلمة المرور',
      passwordHint: 'يجب أن لا تقل عن 8 أحرف',
      terms: 'أوافق على شروط الخدمة وسياسة الخصوصية الخاصة بالنظام',
      submit: 'إنشاء حساب العيادة',
      loading: 'جارٍ إنشاء الحساب...',
      haveAccount: 'لديك حساب بالفعل؟',
      login: 'تسجيل الدخول',
      success: 'تم تسجيل العيادة بنجاح. أهلاً بك في ميرونا!',
      requiredName: 'الاسم مطلوب',
      validName: 'الاسم لا يقل عن حرفين',
      requiredClinic: 'اسم العيادة مطلوب',
      requiredEmail: 'البريد الإلكتروني مطلوب',
      invalidEmail: 'صيغة البريد غير صحيحة',
      requiredPassword: 'كلمة المرور مطلوبة',
      minPassword: 'يجب أن لا تقل عن 8 أحرف',
    },
  },
  en: {
    language: 'العربية',
    brandBadge: 'Intelligent Clinic System',
    secure: 'Secure 256-bit encrypted connection',
    registerPage: {
      eyebrow: 'Get Started',
      title: 'Register Your Clinic',
      subtitle: 'Create your clinic account and launch AI reception in minutes.',
      fullName: 'Full Name',
      fullNamePlaceholder: 'Dr. Sarah Johnson',
      clinicName: 'Clinic / Medical Center Name',
      clinicNamePlaceholder: 'Hope Dental Care',
      email: 'Work Email Address',
      password: 'Password',
      passwordHint: 'Must be at least 8 characters',
      terms: 'I agree to the Terms of Service and Privacy Policy',
      submit: 'Create Clinic Account',
      loading: 'Creating account...',
      haveAccount: 'Already have an account?',
      login: 'Sign in',
      success: 'Clinic registered successfully. Welcome to Meruna!',
      requiredName: 'Name is required',
      validName: 'Must be at least 2 characters',
      requiredClinic: 'Clinic name is required',
      requiredEmail: 'Email is required',
      invalidEmail: 'Enter a valid email address',
      requiredPassword: 'Password is required',
      minPassword: 'Must be at least 8 characters',
    },
  },
};

function getApiErrorMessage(error: unknown, language: 'ar' | 'en' = 'ar'): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const candidate = error as { data?: unknown; error?: unknown; message?: unknown; status?: unknown };
  
  const raw = String(
    (candidate.data && typeof candidate.data === 'object' && (candidate.data as { error?: string }).error) ||
    candidate.error ||
    candidate.message ||
    ''
  ).toLowerCase();

  const isAr = language === 'ar';

  if (/already\s+registered|already\s+exists|user\s+already/i.test(raw)) {
    return isAr
      ? 'هذا البريد الإلكتروني مسجل مسبقاً في النظام. يرجى تسجيل الدخول أو استخدام بريد آخر.'
      : 'This email is already registered. Please log in or use a different email.';
  }

  if (/password.*(short|weak|8)/i.test(raw)) {
    return isAr
      ? 'كلمة المرور يجب أن لا تقل عن 8 أحرف.'
      : 'Password must be at least 8 characters.';
  }

  if (/rate.*limit|too many/i.test(raw)) {
    return isAr
      ? 'تم تجاوز عدد المحاولات المسموح بها، يرجى الانتظار دقيقة والمحاولة مجدداً.'
      : 'Too many attempts. Please wait a minute and try again.';
  }

  if (/network|offline|failed to fetch/i.test(raw)) {
    return isAr
      ? 'تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت.'
      : 'Could not connect to server. Please check your internet connection.';
  }

  return isAr
    ? 'تعذر إتمام تسجيل الحساب حالياً. يرجى التأكد من البيانات والمحاولة مرة أخرى.'
    : 'We could not complete your registration. Please verify your details and try again.';
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

function AuthLayout({ children }: { children: ReactNode }) {
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
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-colors"
            data-testid="button-auth-language"
          >
            <Globe className="size-3.5 text-sky-400" />
            <span>{text.language}</span>
          </button>
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

export function RegisterPageInner() {
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const register = useRegister();
  const form = useForm<RegisterInput>({ defaultValues: { fullName: '', clinicName: '', email: '', password: '' }, mode: 'onTouched' });
  const { lang, text } = useAuthLocale();
  const en = lang === 'en';
  const copy = text.registerPage;

  const onSubmit = (values: RegisterInput) =>
    register.mutate(
      { data: values },
      {
        onSuccess: (session: unknown) => {
          client.setQueryData(getGetAuthSessionQueryKey(), session);
          toast.success(copy.success);
          setLocation('/dashboard');
        },
      }
    );

  const apiError = getApiErrorMessage(register.error, lang);

  return (
    <AuthLayout>
      <div>
        {/* Header */}
        <div className="mb-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-sky-400 mb-1">{copy.eyebrow}</p>
          <h2 className="text-2xl font-black text-white" data-testid="heading-register">
            {copy.title}
          </h2>
          <p className="mt-1.5 text-xs text-slate-400 leading-5">{copy.subtitle}</p>
        </div>

        {/* API Error */}
        {apiError ? (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs leading-5 text-red-300" data-testid="alert-register-error">
            <X size={15} className="mt-0.5 shrink-0 text-red-400" />
            <span>{apiError}</span>
          </div>
        ) : null}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <label className="block text-right">
            <span className="block text-xs font-bold text-slate-200 mb-1.5">{copy.fullName}</span>
            <div className="relative">
              <UserRound size={16} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
              <input
                {...form.register('fullName', { required: copy.requiredName, minLength: { value: 2, message: copy.validName } })}
                className="w-full bg-[#081829] border border-[#1e3e5c] focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none transition-all"
                placeholder={copy.fullNamePlaceholder}
                autoComplete="name"
                data-testid="input-register-full-name"
              />
            </div>
            {form.formState.errors.fullName?.message && (
              <span className="block text-xs font-semibold text-red-400 mt-1" data-testid="text-field-error">
                {form.formState.errors.fullName.message}
              </span>
            )}
          </label>

          <label className="block text-right">
            <span className="block text-xs font-bold text-slate-200 mb-1.5">{copy.clinicName}</span>
            <div className="relative">
              <Building2 size={16} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
              <input
                {...form.register('clinicName', { required: copy.requiredClinic, minLength: { value: 2, message: copy.validName } })}
                className="w-full bg-[#081829] border border-[#1e3e5c] focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none transition-all"
                placeholder={copy.clinicNamePlaceholder}
                data-testid="input-register-clinic-name"
              />
            </div>
            {form.formState.errors.clinicName?.message && (
              <span className="block text-xs font-semibold text-red-400 mt-1" data-testid="text-field-error">
                {form.formState.errors.clinicName.message}
              </span>
            )}
          </label>

          <label className="block text-right">
            <span className="block text-xs font-bold text-slate-200 mb-1.5">{copy.email}</span>
            <div className="relative">
              <Mail size={16} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
              <input
                {...form.register('email', { required: copy.requiredEmail, pattern: { value: /^\S+@\S+\.\S+$/, message: copy.invalidEmail } })}
                className="w-full bg-[#081829] border border-[#1e3e5c] focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none transition-all"
                dir="ltr"
                type="email"
                placeholder="name@clinic.com"
                autoComplete="email"
                data-testid="input-register-email"
              />
            </div>
            {form.formState.errors.email?.message && (
              <span className="block text-xs font-semibold text-red-400 mt-1" data-testid="text-field-error">
                {form.formState.errors.email.message}
              </span>
            )}
          </label>

          <label className="block text-right">
            <span className="block text-xs font-bold text-slate-200 mb-1.5">{copy.password}</span>
            <div className="relative">
              <ShieldCheck size={16} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
              <input
                {...form.register('password', { required: copy.requiredPassword, minLength: { value: 8, message: copy.minPassword } })}
                className="w-full bg-[#081829] border border-[#1e3e5c] focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none transition-all"
                dir="ltr"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                data-testid="input-register-password"
              />
            </div>
            {form.formState.errors.password?.message ? (
              <span className="block text-xs font-semibold text-red-400 mt-1" data-testid="text-field-error">
                {form.formState.errors.password.message}
              </span>
            ) : (
              <span className="block text-[11px] text-slate-400 mt-1">{copy.passwordHint}</span>
            )}
          </label>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-700/60 bg-slate-800/40 p-3 text-xs leading-5 text-slate-300 transition hover:bg-slate-800/60">
            <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded accent-sky-500" data-testid="input-terms" />
            <span>{copy.terms}</span>
          </label>

          <button
            className="w-full bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:opacity-95 text-white font-extrabold py-3 rounded-xl text-sm shadow-lg shadow-sky-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            type="submit"
            disabled={register.isPending}
            data-testid="button-register"
          >
            {register.isPending ? (
              <><RefreshCw size={16} className="animate-spin" /><span>{copy.loading}</span></>
            ) : (
              <><span>{copy.submit}</span><ArrowLeft className={`size-4 ${en ? 'rotate-180' : ''}`} /></>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          <Link href="/login" className="font-bold text-sky-400 hover:text-sky-300 hover:underline transition-colors" data-testid="link-login">
            {copy.haveAccount} {copy.login}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <AuthLocaleProvider>
      <RegisterPageInner />
    </AuthLocaleProvider>
  );
}
