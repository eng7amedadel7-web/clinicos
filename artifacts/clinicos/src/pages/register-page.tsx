import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Eye, EyeOff, Mail, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';
import { getGetAuthSessionQueryKey, useRegister } from '@workspace/api-client-react';
import { matchAuthErrorKey } from '@/lib/api-errors';
import {
  AuthLocaleProvider,
  AuthShell,
  ErrorAlert,
  FieldError,
  FIELD_INPUT_CLASS,
  fieldClasses,
  SUBMIT_BUTTON_CLASS,
  useAuthLocale,
} from '@/components/auth-shell';

const pageCopy = {
  ar: {
    eyebrow: 'ابدأ تجربتك',
    title: 'تسجيل عيادة جديدة',
    subtitle: 'أنشئ حساب عيادتك وابدأ في أتمتة العمليات والاستقبال الذكي فورًا.',
    fullName: 'الاسم الكامل للمدير',
    fullNamePlaceholder: 'د. أحمد محمود',
    clinicName: 'اسم العيادة / المركز الطبي',
    clinicNamePlaceholder: 'عيادة الأمل التخصصية',
    email: 'البريد الإلكتروني المهني',
    password: 'كلمة المرور',
    passwordHint: 'يجب أن لا تقل عن 8 أحرف',
    showPassword: 'إظهار كلمة المرور',
    hidePassword: 'إخفاء كلمة المرور',
    terms: 'أوافق على شروط الخدمة وسياسة الخصوصية الخاصة بالنظام',
    termsRequired: 'يجب الموافقة على الشروط والمتطلبات للمتابعة',
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
  en: {
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
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    terms: 'I agree to the Terms of Service and Privacy Policy',
    termsRequired: 'You must accept the terms to continue',
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
} as const;

type RegisterValues = {
  fullName: string;
  clinicName: string;
  email: string;
  password: string;
  terms: boolean;
};

export function RegisterPageInner() {
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const register = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<RegisterValues>({
    defaultValues: { fullName: '', clinicName: '', email: '', password: '', terms: false },
    mode: 'onTouched',
  });
  const { lang, text } = useAuthLocale();
  const en = lang === 'en';
  const copy = pageCopy[lang];
  const field = fieldClasses(en);
  const apiError = register.error ? text.errors[matchAuthErrorKey(register.error) ?? 'generic'] : undefined;

  const onSubmit = (values: RegisterValues) =>
    register.mutate(
      { data: { fullName: values.fullName.trim(), clinicName: values.clinicName.trim(), email: values.email.trim(), password: values.password } },
      {
        onSuccess: (session: unknown) => {
          client.setQueryData(getGetAuthSessionQueryKey(), session);
          toast.success(copy.success);
          setLocation('/dashboard');
        },
      }
    );

  return (
    <AuthShell>
      <div>
        <div>
          <p className="text-xs font-bold text-sky-700">{copy.eyebrow}</p>
          <h1 className="mt-1.5 text-3xl font-black text-[#0b2437]" data-testid="heading-register">
            {copy.title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{copy.subtitle}</p>
        </div>

        {apiError ? (
          <div className="mt-5">
            <ErrorAlert testid="alert-register-error" message={apiError} />
          </div>
        ) : null}

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">{copy.fullName}</span>
            <div className="relative">
              <UserRound size={16} className={`pointer-events-none absolute ${field.startIcon} top-3.5 text-slate-400`} />
              <input
                {...form.register('fullName', { required: copy.requiredName, minLength: { value: 2, message: copy.validName } })}
                className={`${FIELD_INPUT_CLASS} ${field.emailPad}`}
                placeholder={copy.fullNamePlaceholder}
                autoComplete="name"
                data-testid="input-register-full-name"
              />
            </div>
            <FieldError message={form.formState.errors.fullName?.message} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">{copy.clinicName}</span>
            <div className="relative">
              <Building2 size={16} className={`pointer-events-none absolute ${field.startIcon} top-3.5 text-slate-400`} />
              <input
                {...form.register('clinicName', { required: copy.requiredClinic, minLength: { value: 2, message: copy.validName } })}
                className={`${FIELD_INPUT_CLASS} ${field.emailPad}`}
                placeholder={copy.clinicNamePlaceholder}
                autoComplete="organization"
                data-testid="input-register-clinic-name"
              />
            </div>
            <FieldError message={form.formState.errors.clinicName?.message} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">{copy.email}</span>
            <div className="relative">
              <Mail size={16} className={`pointer-events-none absolute ${field.startIcon} top-3.5 text-slate-400`} />
              <input
                {...form.register('email', { required: copy.requiredEmail, pattern: { value: /^\S+@\S+\.\S+$/, message: copy.invalidEmail } })}
                className={`${FIELD_INPUT_CLASS} ${field.emailPad}`}
                dir="ltr"
                type="email"
                placeholder="name@clinic.com"
                autoComplete="email"
                data-testid="input-register-email"
              />
            </div>
            <FieldError message={form.formState.errors.email?.message} />
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
                placeholder="••••••••"
                autoComplete="new-password"
                data-testid="input-register-password"
              />
              <button
                type="button"
                className={`absolute ${field.endIcon} top-3.5 text-slate-400 transition-colors hover:text-slate-600`}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                data-testid="button-toggle-register-password"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.formState.errors.password?.message ? (
              <FieldError message={form.formState.errors.password.message} />
            ) : (
              <span className="mt-1 block text-[11px] text-slate-400">{copy.passwordHint}</span>
            )}
          </label>

          {/* The form is noValidate, so the terms box must be enforced here —
              a bare `required` attribute would silently never run. */}
          <div>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600 shadow-sm transition hover:border-slate-300">
              <input
                {...form.register('terms', { validate: (value) => value === true || copy.termsRequired })}
                type="checkbox"
                className="mt-0.5 size-4 rounded border-slate-300 accent-[#0d2436]"
                data-testid="input-terms"
              />
              <span>{copy.terms}</span>
            </label>
            <FieldError message={form.formState.errors.terms?.message} />
          </div>

          <button className={SUBMIT_BUTTON_CLASS} type="submit" disabled={register.isPending} data-testid="button-register">
            {register.isPending ? (
              <><RefreshCw size={16} className="animate-spin" /><span>{copy.loading}</span></>
            ) : (
              <><span>{copy.submit}</span><ArrowLeft className={`size-4 ${en ? 'rotate-180' : ''}`} /></>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          <Link href="/login" className="font-bold text-sky-700 transition-colors hover:text-sky-600 hover:underline" data-testid="link-login">
            {copy.haveAccount} {copy.login}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <AuthLocaleProvider>
      <RegisterPageInner />
    </AuthLocaleProvider>
  );
}
