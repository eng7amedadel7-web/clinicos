import { useState } from 'react';
import { useQuery } from '@tanstack/react/react-query';
import { CheckCircle2, Circle, Building2, Stethoscope, HeartPulse, CalendarDays, MessageSquare, UsersRound, X, ListChecks } from 'lucide-react';
import { Link } from 'wouter';
import { usePreferences } from '@/lib/preferences';

// First-run setup checklist for a newly registered clinic. Data comes from
// GET /api/onboarding/status; the card disappears once every step is done or
// the owner dismisses it (per-clinic, kept in localStorage).
type OnboardingStatus = { items: Array<{ id: string; done: boolean }>; complete: boolean };

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
    hintAr: 'سجّل الأطباء العاملين بالعيادة ليظهر أوائل الحجز.',
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

export function OnboardingChecklist({ clinicId }: { clinicId: string }) {
  const { language } = usePreferences();
  const en = language === 'en';
  const [dismissed, setDismissed] = useState(() => window.localStorage.getItem(`meruna-onboarding-dismissed-${clinicId}`) === 'true');
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

  if (statusQuery.isLoading || statusQuery.isError) return null;
  const status = statusQuery.data;
  if (!status || status.complete || dismissed) return null;

  const doneCount = status.items.filter((item) => item.done).length;
  const dismiss = () => {
    window.localStorage.setItem(`meruna-onboarding-dismissed-${clinicId}`, 'true');
    setDismissed(true);
  };

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
    </section>
  );
}
