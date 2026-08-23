import { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster, toast } from 'sonner';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  Building2,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  Home,
  LogOut,
  Mail,
  MapPin,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
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
  useUpdateClinicSettings,
} from '@workspace/api-client-react';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

const queryClient = new QueryClient();

type LoginValues = { email: string; password: string };
type RegisterValues = { fullName: string; clinicName: string; email: string; password: string };

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2" data-testid="brand-logo">
      <div className="brand-mark" aria-hidden="true"><span /></div>
      <div className={`brand-wordmark ${dark ? '!text-[#0b2940]' : ''}`}>MERU<span>NA</span></div>
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

function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-right">
      <span className="mb-2 block text-[.78rem] font-bold text-[#36596d]">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-xs font-semibold text-[#b24e49]" data-testid="text-field-error">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-[#8496a0]">{hint}</span> : null}
    </label>
  );
}

function getApiErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const candidate = error as { data?: unknown; error?: unknown; message?: unknown };
  const data = candidate.data;
  if (data && typeof data === 'object') {
    const nestedError = (data as { error?: unknown }).error;
    if (typeof nestedError === 'string' && nestedError.trim()) return nestedError;
  }
  if (typeof candidate.error === 'string' && candidate.error.trim()) return candidate.error;
  if (typeof candidate.message === 'string' && candidate.message.trim()) return candidate.message;
  return undefined;
}

function AuthLayout({ children, mode }: { children: ReactNode; mode: 'login' | 'register' }) {
  return (
    <main className="noise min-h-[100dvh] bg-[#eef3f7] lg:grid lg:grid-cols-[minmax(380px,44%)_1fr]" dir="rtl">
      <section className="auth-rail hidden min-h-[100dvh] flex-col justify-between p-12 text-[#e8f3f6] lg:flex xl:p-16">
        <div className="relative z-10"><Logo /></div>
        <div className="relative z-10 max-w-[410px] text-right">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#6b9aae]/30 bg-[#9bc4d2]/10 px-3 py-1.5 text-xs font-semibold text-[#a9cad4]"><ShieldCheck size={14} /> منصة موثوقة لإدارة يومك</div>
          <h1 className="ar text-4xl font-bold leading-[1.35] tracking-tight xl:text-[3.15rem]">{mode === 'login' ? 'كل ما يحتاج انتباهك، في مكان واحد.' : 'ابدأ تنظيم عيادتك بثقة.'}</h1>
          <p className="ar mt-5 max-w-[360px] text-[1.05rem] leading-8 text-[#a8bdc8]">كلينكوس يمنح أصحاب العيادات رؤية أوضح، وقرارات أسرع، ويومًا أكثر هدوءًا.</p>
        </div>
        <div className="relative z-10 flex items-center justify-between text-xs text-[#7896a5]"><span>© 2025 Meruna</span><span>خصوصيتك أولًا</span></div>
      </section>
      <section className="flex min-h-[100dvh] flex-col px-5 py-7 sm:px-10 lg:px-16 lg:py-12 xl:px-24" dir="rtl">
        <div className="flex items-center justify-between lg:hidden"><Logo /><Link href={mode === 'login' ? '/register' : '/login'} className="text-sm font-bold text-[#507080]" data-testid="link-auth-switch">{mode === 'login' ? 'إنشاء حساب' : 'تسجيل الدخول'}</Link></div>
        <div className="m-auto w-full max-w-[445px] py-12">{children}</div>
        <div className="flex items-center justify-between text-xs text-[#8a9aa3]"><span>Meruna Clinicos</span><span className="flex items-center gap-1.5"><ShieldCheck size={13} /> اتصال آمن ومشفّر</span></div>
      </section>
    </main>
  );
}

function LoginPage() {
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const login = useLogin();
  const health = useHealthCheck({ query: { retry: false, queryKey: getHealthCheckQueryKey() } });
  const form = useForm<LoginValues>({ defaultValues: { email: '', password: '' }, mode: 'onTouched' });
  const [showPassword, setShowPassword] = useState(false);
  const onSubmit = (values: LoginValues) => {
    login.mutate({ data: values }, {
      onSuccess: (session) => {
        client.setQueryData(getGetAuthSessionQueryKey(), session);
        toast.success('مرحبًا بعودتك');
        setLocation('/dashboard');
      },
    });
  };
  const apiError = getApiErrorMessage(login.error);
  return (
    <AuthLayout mode="login">
      <div className="animate-rise">
        <div className="mb-8"><p className="mb-3 text-sm font-bold text-[#6c94a3]">مساء الخير</p><h2 className="ar text-3xl font-bold tracking-tight text-[#12334a]" data-testid="heading-login">تسجيل الدخول</h2><p className="mt-2 text-sm leading-6 text-[#718591]">أدخل بياناتك للوصول إلى لوحة عيادتك.</p></div>
        {apiError ? <div className="mb-5 flex items-start gap-2 rounded-xl border border-[#edc4c0] bg-[#fff7f6] p-3 text-sm leading-6 text-[#a54c46]" data-testid="alert-login-error"><X size={17} className="mt-1 shrink-0" /> {apiError}</div> : null}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Field label="البريد الإلكتروني" error={form.formState.errors.email?.message} hint="استخدم البريد المرتبط بحسابك">
            <div className="relative"><Mail size={17} className="absolute right-3.5 top-3.5 text-[#8ca2ad]" /><input {...form.register('email', { required: 'أدخل البريد الإلكتروني', pattern: { value: /^\S+@\S+\.\S+$/, message: 'تحقق من صيغة البريد الإلكتروني' } })} className="input-field pr-11 text-left" dir="ltr" type="email" placeholder="name@clinic.com" autoComplete="email" data-testid="input-login-email" /></div>
          </Field>
          <Field label="كلمة المرور" error={form.formState.errors.password?.message}>
            <div className="relative"><ShieldCheck size={17} className="absolute right-3.5 top-3.5 text-[#8ca2ad]" /><input {...form.register('password', { required: 'أدخل كلمة المرور', minLength: { value: 6, message: 'يجب أن تتكون من 6 أحرف على الأقل' } })} className="input-field pl-11 pr-11 text-left" dir="ltr" type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password" data-testid="input-login-password" /><button type="button" className="absolute left-3.5 top-3.5 text-[#8196a1]" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'} data-testid="button-toggle-password">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
          </Field>
          <div className="flex items-center justify-between text-xs"><label className="flex items-center gap-2 text-[#66808e]"><input type="checkbox" className="h-4 w-4 accent-[#174963]" data-testid="input-remember" /> تذكرني على هذا الجهاز</label><button type="button" className="font-bold text-[#3c7e93]" onClick={() => toast.info('تواصل مع مسؤول العيادة لإعادة ضبط كلمة المرور')} data-testid="button-forgot-password">نسيت كلمة المرور؟</button></div>
          <button className="primary-button w-full" type="submit" disabled={login.isPending} data-testid="button-login">{login.isPending ? <><RefreshCw size={17} className="animate-spin" /> جارٍ التحقق...</> : <>دخول إلى كلينكوس <ArrowLeft size={17} /></>}</button>
        </form>
        <div className="mt-8 flex items-center gap-3 text-xs text-[#8a9ba4]"><div className="h-px flex-1 bg-[#d9e3e8]" /> أو <div className="h-px flex-1 bg-[#d9e3e8]" /></div>
        <p className="mt-7 text-center text-sm text-[#718591]">ليس لديك حساب؟ <Link href="/register" className="font-bold text-[#3c7e93]" data-testid="link-register">أنشئ عيادتك الآن</Link></p>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-[.7rem] text-[#a0adb3]" data-testid="status-api"><span className={`status-dot ${health.isError ? '!bg-[#c67870]' : ''}`} /> {health.isError ? 'الخدمة تواجه ضغطًا مؤقتًا' : 'الأنظمة تعمل بشكل طبيعي'}</p>
      </div>
    </AuthLayout>
  );
}

function RegisterPage() {
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const register = useRegister();
  const form = useForm<RegisterValues>({ defaultValues: { fullName: '', clinicName: '', email: '', password: '' }, mode: 'onTouched' });
  const onSubmit = (values: RegisterValues) => register.mutate({ data: values }, { onSuccess: (session) => { client.setQueryData(getGetAuthSessionQueryKey(), session); toast.success('تم إنشاء عيادتك'); setLocation('/dashboard'); } });
  const apiError = getApiErrorMessage(register.error);
  return (
    <AuthLayout mode="register">
      <div className="animate-rise">
        <div className="mb-8"><p className="mb-3 text-sm font-bold text-[#6c94a3]">خطوة واحدة ونبدأ</p><h2 className="ar text-3xl font-bold tracking-tight text-[#12334a]" data-testid="heading-register">إنشاء حساب المالك</h2><p className="mt-2 text-sm leading-6 text-[#718591]">أخبرنا عنك وعن عيادتك لنجهز مساحتك الخاصة.</p></div>
        {apiError ? <div className="mb-5 rounded-xl border border-[#edc4c0] bg-[#fff7f6] p-3 text-sm leading-6 text-[#a54c46]" data-testid="alert-register-error">{apiError}</div> : null}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="الاسم الكامل" error={form.formState.errors.fullName?.message}><div className="relative"><UserRound size={17} className="absolute right-3.5 top-3.5 text-[#8ca2ad]" /><input {...form.register('fullName', { required: 'أدخل الاسم الكامل', minLength: { value: 2, message: 'أدخل اسمًا صحيحًا' } })} className="input-field pr-11" placeholder="د. سارة أحمد" autoComplete="name" data-testid="input-register-full-name" /></div></Field>
          <Field label="اسم العيادة" error={form.formState.errors.clinicName?.message}><div className="relative"><Building2 size={17} className="absolute right-3.5 top-3.5 text-[#8ca2ad]" /><input {...form.register('clinicName', { required: 'أدخل اسم العيادة', minLength: { value: 2, message: 'أدخل اسمًا صحيحًا' } })} className="input-field pr-11" placeholder="عيادة مدار الصحية" data-testid="input-register-clinic-name" /></div></Field>
          <Field label="البريد الإلكتروني" error={form.formState.errors.email?.message}><div className="relative"><Mail size={17} className="absolute right-3.5 top-3.5 text-[#8ca2ad]" /><input {...form.register('email', { required: 'أدخل البريد الإلكتروني', pattern: { value: /^\S+@\S+\.\S+$/, message: 'تحقق من صيغة البريد الإلكتروني' } })} className="input-field pr-11 text-left" dir="ltr" type="email" placeholder="name@clinic.com" autoComplete="email" data-testid="input-register-email" /></div></Field>
          <Field label="كلمة المرور" error={form.formState.errors.password?.message} hint="ثمانية أحرف على الأقل"><div className="relative"><ShieldCheck size={17} className="absolute right-3.5 top-3.5 text-[#8ca2ad]" /><input {...form.register('password', { required: 'أدخل كلمة المرور', minLength: { value: 8, message: 'يجب أن تتكون من 8 أحرف على الأقل' } })} className="input-field pr-11 text-left" dir="ltr" type="password" placeholder="••••••••" autoComplete="new-password" data-testid="input-register-password" /></div></Field>
          <label className="flex items-start gap-2 pt-1 text-xs leading-5 text-[#718591]"><input type="checkbox" required className="mt-1 h-4 w-4 accent-[#174963]" data-testid="input-terms" /> أوافق على شروط الاستخدام وسياسة الخصوصية الخاصة بكلينكوس.</label>
          <button className="primary-button mt-2 w-full" type="submit" disabled={register.isPending} data-testid="button-register">{register.isPending ? <><RefreshCw size={17} className="animate-spin" /> جارٍ إنشاء المساحة...</> : <>إنشاء حسابي <ArrowLeft size={17} /></>}</button>
        </form>
        <p className="mt-7 text-center text-sm text-[#718591]">لديك حساب بالفعل؟ <Link href="/login" className="font-bold text-[#3c7e93]" data-testid="link-login">سجل الدخول</Link></p>
      </div>
    </AuthLayout>
  );
}

function Sidebar({ clinicName, userName }: { clinicName: string; userName: string }) {
  const [location, setLocation] = useLocation();
  const logout = useLogout();
  const links = [{ href: '/dashboard', label: 'الرئيسية', icon: Home }, { href: '/settings', label: 'الإعدادات', icon: Settings2 }];
  const doLogout = () => logout.mutate(undefined, { onSuccess: () => { queryClient.clear(); toast.success('تم تسجيل الخروج'); setLocation('/login'); }, onError: () => toast.error('تعذر تسجيل الخروج، حاول مجددًا') });
  return (
    <aside className="sidebar flex w-full flex-col px-4 py-5 md:sticky md:top-0 md:h-[100dvh] md:w-[248px] md:shrink-0 md:px-5 md:py-7" dir="rtl">
      <div className="brand-lockup mb-12 px-2"><Logo /></div>
      <div className="sidebar-clinic mb-7 flex items-center gap-3 rounded-xl border border-[#688b9c]/20 bg-[#143149] p-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#8fbaca]/15 text-[#9cc6d3]"><Building2 size={18} /></div><div className="min-w-0"><p className="truncate text-xs font-bold text-[#e6f0f2]" data-testid="text-sidebar-clinic">{clinicName}</p><p className="mt-0.5 flex items-center gap-1.5 text-[.68rem] text-[#8ea9b5]"><span className="status-dot" /> مفتوحة اليوم</p></div><ChevronDown size={14} className="mr-auto text-[#7895a2]" /></div>
      <nav className="sidebar-nav space-y-1" aria-label="التنقل الرئيسي">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`sidebar-link px-3 py-3 text-sm font-semibold ${location === href ? 'active' : ''}`} data-testid={`link-nav-${label}`}><Icon size={18} strokeWidth={1.8} /><span>{label}</span></Link>)}</nav>
      <div className="sidebar-footer mt-auto border-t border-[#688b9c]/15 pt-5"><div className="mb-4 flex items-center gap-3 px-2"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#b2ccd6] text-sm font-bold text-[#15384d]">{userName.slice(0, 1)}</div><div className="min-w-0"><p className="truncate text-xs font-bold text-[#e6f0f2]" data-testid="text-sidebar-user">{userName}</p><p className="text-[.68rem] text-[#8ea9b5]">مالك العيادة</p></div></div><button onClick={doLogout} disabled={logout.isPending} className="sidebar-link w-full px-3 py-3 text-sm font-semibold" data-testid="button-logout"><LogOut size={18} /><span>{logout.isPending ? 'جارٍ الخروج...' : 'تسجيل الخروج'}</span></button></div>
    </aside>
  );
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
      <div className="animate-rise relative overflow-hidden rounded-2xl bg-[#0c2b41] px-6 py-7 text-[#edf7f8] shadow-[0_16px_32px_rgba(17,55,74,.12)] md:px-8 md:py-8"><div className="relative z-10 max-w-xl"><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#9ec8d3]"><span className="status-dot" /> لوحة عيادتك اليوم</div><h2 className="ar text-2xl font-bold leading-relaxed md:text-3xl">هذه هي الصورة الكاملة لعيادتك.</h2><p className="ar mt-2 text-sm leading-7 text-[#aac1ca]">ابدأ بالأهم، واترك الباقي لكلينكوس.</p></div><div className="absolute -left-8 -top-20 h-64 w-64 rounded-full border border-[#80b6c7]/20" /><div className="absolute -left-16 -top-28 h-80 w-80 rounded-full border border-[#80b6c7]/10" /><div className="absolute bottom-0 left-12 hidden h-20 w-20 rotate-45 border border-[#80b6c7]/20 md:block" /></div>
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

function ProtectedShell() {
  const sessionQuery = useGetAuthSession({ query: { retry: false, queryKey: getGetAuthSessionQueryKey() } });
  const [location, setLocation] = useLocation();
  if (sessionQuery.isLoading) return <div className="flex min-h-[100dvh] items-center justify-center bg-[#eef3f7]" data-testid="state-session-loading"><div className="w-64 space-y-3"><div className="skeleton h-4 w-24" /><div className="skeleton h-10 w-full" /><div className="skeleton h-24 w-full" /></div></div>;
  if (sessionQuery.isError || !sessionQuery.data) { if (location !== '/login') setLocation('/login'); return null; }
  const session = sessionQuery.data;
  return <div className="app-shell flex min-h-[100dvh] md:flex-row"><Sidebar clinicName={session.clinic.name} userName={session.user.fullName} />{location === '/settings' ? <SettingsPage session={session} /> : <DashboardPage session={session} />}</div>;
}

function NotFound() {
  const [, setLocation] = useLocation();
  return <main className="noise flex min-h-[100dvh] items-center justify-center bg-[#eef3f7] p-6" dir="rtl"><div className="surface w-full max-w-[520px] rounded-2xl p-8 text-center md:p-12"><div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#dbecef] text-[#528b9b]"><CircleHelp size={29} /></div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#75a0ae]">404 / الصفحة غير موجودة</p><h1 className="ar mt-3 text-2xl font-bold text-[#173c52]">هذه الصفحة أخذت استراحة.</h1><p className="mt-2 text-sm leading-7 text-[#7b8f99]">الرابط الذي تتبعه غير متاح. عد إلى لوحة العيادة لنكمل يومك.</p><button className="primary-button mt-7" onClick={() => setLocation('/dashboard')} data-testid="button-go-dashboard"><ArrowRight size={17} /> العودة إلى الرئيسية</button></div></main>;
}

function Router() {
  const [location] = useLocation();
  const publicRoute = location === '/' || location === '/login' || location === '/register';
  return <ErrorBoundary resetKey={location}>{publicRoute ? <Switch><Route path="/" component={LoginPage} /><Route path="/login" component={LoginPage} /><Route path="/register" component={RegisterPage} /></Switch> : <Switch><Route path="/dashboard" component={ProtectedShell} /><Route path="/settings" component={ProtectedShell} /><Route component={NotFound} /></Switch>}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster position="bottom-left" richColors /></QueryClientProvider>;
}

export default App;