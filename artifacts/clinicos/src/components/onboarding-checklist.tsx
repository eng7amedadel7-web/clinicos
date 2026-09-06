import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Building2, Stethoscope, HeartPulse, CalendarDays, MessageSquare, UsersRound, X, ListChecks, KeyRound, RefreshCw } from 'lucide-react';
import { Link } from 'wouter';
import { toast } from 'sonner';
import { usePreferences } from '@/lib/preferences';

// First-run setup checklist for a newly registered clinic. Data comes from
// GET /api/onboarding/status; the card disappears once every step is done or
// the owner dismisses it (per-clinic, kept in localStorage). The activation
// step is the last one: the clinic owner pastes the platform-issued trial code
// to open the 14-day trial window. Live operations stay server-gated until then.
type OnboardingItem = { id: string; done: boolean };
type ActivationInfo = { activated: boolean; phase: string; trialEndsAt: string | null };
type OnboardingStatus = { items: OnboardingItem[]; complete: boolean; activation?: ActivationInfo };

type StepMeta = {
  labelAr: string;
  labelEn: string;
  hintAr: string;
  hintEn: string;
  href: string;
  tab: string;
  icon: typeof Building2;
};

const stepMeta: Record<string, StepMeta> = {
  clinicProfile: {
    labelAr: 'بيانات العيادة',
    labelEn: 'Clinic profile',
    hintAr: 'أكمل اسم عيادتك ومدينتها لتبقى مساحة العمل واضحة لفريقك.',
    hintEn: 'Complete your clinic name and city so the workspace stays clear.',
    href: '/settings',
    tab: 'account',
    icon: Building2,
  },
  doctors: {
    labelAr: 'إضافة طبيب',
    labelEn: 'Add your first doctor',
    hintAr: 'سجّل الأطباء العاملين بالعيادة ليصبحوا قابلين للحجز.',
    hintEn: 'Register your doctors so they become bookable.',
    href: '/organization',
    tab: 'calendar',
    icon: Stethoscope,
  },
  services: {
    labelAr: 'تحديد الخدمات',
    labelEn: 'Define services',
    hintAr: 'أضف الخدمات ومدة كل خدمة وسعرها.',
    hintEn: 'Add services with their duration and price.',
    href: '/organization',
    tab: 'calendar',
    icon: HeartPulse,
  },
  slots: {
    labelAr: 'توليد المواعيد المتاحة',
    labelEn: 'Generate appointment slots',
    hintAr: 'حدد ساعات العمل ليتاح الحجز الإلكتروني فورًا.',
    hintEn: 'Set working hours so online booking opens instantly.',
    href: '/organization',
    tab: 'calendar',
    icon: CalendarDays,
  },
  channels: {
    labelAr: 'ربط قناة تواصل',
    labelEn: 'Connect a channel',
    hintAr: 'اربط واتساب أو تليجرام ليتوحد صندوق الوارد.',
    hintEn: 'Connect WhatsApp or Telegram to unify your inbox.',
    href: '/settings',
    tab: 'channels',
    icon: MessageSquare,
  },
  team: {
    labelAr: 'دعوة فريق العمل',
    labelEn: 'Invite your team',
    hintAr: 'أنشئ رابط دعوة لكل موظف وحدد دوره.',
    hintEn: 'Create an invite link per staff member with their role.',
    href: '/organization',
    tab: 'staff',
    icon: UsersRound,
  },
};

const ACTIVATION_COPY = {
  ar: {
    label: 'تفعيل التجربة المجانية',
    hint: 'أدخل رمز التفعيل اللي وصلك من فريق ميرونا لتبدأ تجربتك المجانية.',
    placeholder: 'MERUNA-XXXX-XXXX-XXXX',
    submit: 'تفعيل التجربة',
    submitting: 'جارٍ التفعيل...',
    expiredTrial: 'انتهت تجربتك المجانية. أدخل رمز تفعيل جديد أو اشترك من صفحة الفوترة.',
    success: (date: string) => `تم تفعيل تجربتك المجانية حتى ${date}. أهلاً بك!`,
  },
  en: {
    label: 'Activate your free trial',
    hint: 'Enter the activation code you received from the MERUNA team to start your free trial.',
    placeholder: 'MERUNA-XXXX-XXXX-XXXX',
    submit: 'Activate trial',
    submitting: 'Activating...',
    expiredTrial: 'Your free trial has ended. Enter a new activation code or subscribe from the billing page.',
    success: (date: string) => `Trial activated until ${date}. Welcome aboard!`,
  },
} as const;

function formatTrialEnd(iso: string, en: boolean) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(en ? 'en-EG' : 'ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export function OnboardingChecklist({ clinicId }: { clinicId: string }) {
  const { language } = usePreferences();
  const en = language === 'en';
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(() => window.localStorage.getItem(`meruna-onboarding-dismissed-${clinicId}`) === 'true');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const statusQuery = useQuery({
    queryKey: ['onboarding', 'status', clinicId],
    queryFn: async ({ signal }) => {
      const response = await fetch('/api/onboarding/status', { credentials: 'include', signal });
      if (!response.ok) throw new Error('onboarding status unavailable');
      return (await response.json()) as OnboardingStatus;
    },
    staleTime: 15_000,
    retry: 0,
  });

  const redeem = useMutation({
    mutationFn: async (trialCode: string) => {
      const response = await fetch('/api/billing/redeem-trial-code', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trialCode }),
      });
      const payload = await response.json().catch(() => null) as { error?: string; trialEndsAt?: string } | null;
      if (!response.ok) throw new Error(payload?.error || (en ? 'Could not activate the code. Try again.' : 'تعذر تفعيل الرمز. حاول مرة أخرى.'));
      return payload;
    },
    onSuccess: (payload) => {
      setCodeError('');
      setCode('');
      toast.success(ACTIVATION_COPY[en ? 'en' : 'ar'].success(payload?.trialEndsAt ? formatTrialEnd(payload.trialEndsAt, en) : ''));
      void queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      void queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
    onError: (error: Error) => setCodeError(error.message),
  });

  if (statusQuery.isLoading || statusQuery.isError) return null;
  const status = statusQuery.data;
  if (!status || status.complete || dismissed) return null;

  const doneCount = status.items.filter((item) => item.done).length;
  const dismiss = () => {
    window.localStorage.setItem(`meruna-onboarding-dismissed-${clinicId}`, 'true');
    setDismissed(true);
  };

  const activationInfo = status.activation;
  const activationStep = status.items.find((item) => item.id === 'activation');

  return (
    <section className="surface animate-rise rounded-2xl p-5 md:p-6" data-testid="card-onboarding">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#dcebef] text-[#22617d] dark:bg-[#143242] dark:text-[#8cc3dd]"><ListChecks size={19} /></span>
          <div>
            <h2 className="font-bold text-[#18374d] dark:text-[#e2ecf1]" data-testid="heading-onboarding">{en ? 'Set up your clinic' : 'خطوات إعداد عيادتك'}</h2>
            <p className="mt-0.5 text-xs text-[#526b78] dark:text-[#7e939e]">{en ? 'Finish these steps to open your clinic for patients.' : 'أكمل الخطوات دي عشان تفتح عيادتك للمرضى.'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#e6f4ee] px-2.5 py-1 text-[10px] font-bold text-[#2c7a5d] dark:bg-[#123528] dark:text-[#7fd0b4]" data-testid="text-onboarding-progress">{doneCount} / {status.items.length}</span>
          <button type="button" onClick={dismiss} className="toolbar-button" aria-label={en ? 'Dismiss setup steps' : 'إخفاء خطوات الإعداد'} data-testid="button-onboarding-dismiss"><X size={15} /></button>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e3edf1] dark:bg-[#10222f]">
        <div className="h-full rounded-full bg-[#3d8a72] transition-all" style={{ width: `${Math.round((doneCount / Math.max(1, status.items.length)) * 100)}%` }} />
      </div>

      <ul className="mt-4 grid gap-2 md:grid-cols-2">
        {status.items.map((item) => {
          if (item.id === 'activation') return null;
          const meta = stepMeta[item.id];
          if (!meta) return null;
          const Icon = meta.icon;
          return (
            <li key={item.id}>
              <Link
                href={`${meta.href}?tab=${meta.tab}`}
                className={`flex items-start gap-3 rounded-xl border p-3 transition ${item.done ? 'border-[#d9efe6] bg-[#f4faf7] dark:border-[#123528] dark:bg-[#0f2a20]' : 'border-[#dbe5ea] bg-white hover:border-[#9fc0ca] hover:bg-[#f6fafb] dark:border-[#1e3a4d] dark:bg-[#0d1c29] dark:hover:bg-[#10222f]'}`}
                data-testid={`link-onboarding-${item.id}`}
              >
                <span className={`mt-0.5 shrink-0 ${item.done ? 'text-[#3d8a72] dark:text-[#7fd0b4]' : 'text-[#93a6ae] dark:text-[#7e939e]'}`}>
                  {item.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </span>
                <span className="min-w-0">
                  <span className={`flex items-center gap-1.5 text-xs font-bold ${item.done ? 'text-[#527080] line-through dark:text-[#7e939e]' : 'text-[#23475b] dark:text-[#e2ecf1]'}`}>
                    <Icon size={13} /> {en ? meta.labelEn : meta.labelAr}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-5 text-[#7f919a] dark:text-[#7e939e]">{en ? meta.hintEn : meta.hintAr}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {activationStep ? (
        <div
          className={`mt-4 rounded-xl border p-4 ${activationStep.done ? 'border-[#d9efe6] bg-[#f4faf7] dark:border-[#123528] dark:bg-[#0f2a20]' : 'border-[#c9e0ea] bg-[#eef6fa] dark:border-[#1e3a4d] dark:bg-[#0d1c29]'}`}
          data-testid="card-onboarding-activation"
        >
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 shrink-0 ${activationStep.done ? 'text-[#3d8a72] dark:text-[#7fd0b4]' : 'text-[#3c7e93] dark:text-[#8cc3dd]'}`}>
              {activationStep.done ? <CheckCircle2 size={18} /> : <KeyRound size={18} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-bold ${activationStep.done ? 'text-[#527080] dark:text-[#7e939e]' : 'text-[#23475b] dark:text-[#e2ecf1]'}`}>
                {en ? ACTIVATION_COPY.en.label : ACTIVATION_COPY.ar.label}
              </p>
              {activationStep.done ? (
                <p className="mt-1 text-[10px] leading-5 text-[#527080] dark:text-[#7e939e]">
                  {activationInfo?.trialEndsAt
                    ? en
                      ? `Trial active until ${formatTrialEnd(activationInfo.trialEndsAt, true)}.`
                      : `تجربتك شغالة حتى ${formatTrialEnd(activationInfo.trialEndsAt, false)}.`
                    : en ? 'Your clinic is activated.' : 'عيادتك مفعلة.'}
                </p>
              ) : (
                <>
                  <p className="mt-1 text-[10px] leading-5 text-[#7f919a] dark:text-[#7e939e]">
                    {activationInfo && !activationInfo.activated && activationInfo.phase === 'trialing'
                      ? en ? ACTIVATION_COPY.en.expiredTrial : ACTIVATION_COPY.ar.expiredTrial
                      : en ? ACTIVATION_COPY.en.hint : ACTIVATION_COPY.ar.hint}
                  </p>
                  <form
                    className="mt-3 flex flex-wrap items-center gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!code.trim()) {
                        setCodeError(en ? 'Enter the activation code first.' : 'أدخل رمز التفعيل أولًا.');
                        return;
                      }
                      redeem.mutate(code.trim());
                    }}
                  >
                    <input
                      value={code}
                      onChange={(event) => { setCode(event.target.value); setCodeError(''); }}
                      placeholder={en ? ACTIVATION_COPY.en.placeholder : ACTIVATION_COPY.ar.placeholder}
                      dir="ltr"
                      className="input-field min-w-0 flex-1 py-2 text-xs font-bold tracking-wider"
                      autoComplete="off"
                      spellCheck={false}
                      data-testid="input-onboarding-activation-code"
                    />
                    <button type="submit" className="primary-button py-2 text-xs" disabled={redeem.isPending} aria-busy={redeem.isPending} data-testid="button-onboarding-activate">
                      {redeem.isPending ? <><RefreshCw size={14} className="animate-spin" /> {en ? ACTIVATION_COPY.en.submitting : ACTIVATION_COPY.ar.submitting}</> : <><KeyRound size={14} /> {en ? ACTIVATION_COPY.en.submit : ACTIVATION_COPY.ar.submit}</>}
                    </button>
                  </form>
                  {codeError ? <p className="mt-2 text-[10px] font-bold text-[#a54c46] dark:text-[#eb9a90]" role="alert" data-testid="text-onboarding-activation-error">{codeError}</p> : null}
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
