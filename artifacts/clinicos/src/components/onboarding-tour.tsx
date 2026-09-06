import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, CalendarDays, Inbox, Bot, Check, ArrowLeft, ArrowRight, X, Compass, KeyRound, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { usePreferences } from '@/lib/preferences';

const TOUR_STORAGE_KEY = 'clinicos_tour_completed';

// The welcome tour is also the mandatory trial-activation flow: for a clinic
// without a live subscription the tour gains a FIFTH card — the platform-issued
// trial code — and loses its close button entirely, so a newly registered owner
// cannot reach the workspace until the code is redeemed. Activated clinics keep
// the legacy skippable tour behaviour (localStorage flag per browser).
type ActivationInfo = { activated: boolean; phase: string; trialEndsAt: string | null };
type OnboardingStatus = { items: Array<{ id: string; done: boolean }>; complete: boolean; activation?: ActivationInfo };

const activationCopy = {
  ar: {
    badge: 'الخطوة الأخيرة',
    title: 'فعّل تجربتك المجانية',
    description: 'فريق ميرونا بعت لك رمز تفعيل خاص بعيادتك. أدخل الرمز هنا لتشغيل تجربتك المجانية والوصول الكامل لمساحة عملك.',
    tip: 'الخطوة دي إجبارية — مش هتقدر تخرج من الجولة لحد ما تدخل الرمز الصحيح.',
    inputLabel: 'رمز التفعيل',
    placeholder: 'MERUNA-XXXX-XXXX-XXXX',
    submit: 'تفعيل التجربة والدخول',
    submitting: 'جارٍ التفعيل...',
    emptyCode: 'أدخل رمز التفعيل الأول.',
    success: (date: string) => `تم تفعيل تجربتك حتى ${date}. أهلاً بك في ميرونا!`,
  },
  en: {
    badge: 'Final step',
    title: 'Activate your free trial',
    description: 'The MERUNA team sent you an activation code for your clinic. Enter it here to start your free trial and unlock your full workspace.',
    tip: 'This step is mandatory — you cannot leave the tour until the correct code is entered.',
    inputLabel: 'Activation code',
    placeholder: 'MERUNA-XXXX-XXXX-XXXX',
    submit: 'Activate & continue',
    submitting: 'Activating...',
    emptyCode: 'Enter the activation code first.',
    success: (date: string) => `Trial activated until ${date}. Welcome to MERUNA!`,
  },
} as const;

function formatTrialEnd(iso: string, en: boolean) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(en ? 'en-EG' : 'ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

interface TourStep {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: typeof Sparkles;
  badgeAr: string;
  badgeEn: string;
  tipAr: string;
  tipEn: string;
}

const steps: TourStep[] = [
  {
    titleAr: 'مرحباً بك في MERUNA SYSTEM',
    titleEn: 'Welcome to MERUNA SYSTEM',
    descriptionAr: 'منصة تشغيل العيادات الذكية التي تجمع بين استقبال الذكاء الاصطناعي، وإدارة المواعيد، وتتبع المرضى في مكان واحد.',
    descriptionEn: 'The intelligent clinic operating system uniting AI reception, appointment management, and patient care.',
    icon: Sparkles,
    badgeAr: 'نظرة عامة',
    badgeEn: 'Overview',
    tipAr: 'يمكنك الضغط على مفتاح ؟ في أي وقت لعرض اختصارات لوحة المفاتيح.',
    tipEn: 'Press ? anytime to open keyboard shortcuts.'
  },
  {
    titleAr: 'صندوق الرسائل والمحادثات الموحد',
    titleEn: 'Unified Patient Inbox',
    descriptionAr: 'استقبل رسائل الواتساب والإنستغرام والموقع في صندوق واحد. يمكنك استخدام القوالب الذكية والردود الآلية بنقرة واحدة.',
    descriptionEn: 'Manage WhatsApp, Instagram, and web chats in one unified inbox with one-click smart templates and AI suggestions.',
    icon: Inbox,
    badgeAr: 'الرسائل الفورية',
    badgeEn: 'Live Messaging',
    tipAr: 'استخدم أيقونة "قوالب الرسائل" للإجابة الفورية وتعبئة بيانات المريض آلياً.',
    tipEn: 'Use the Template picker icon for instant auto-populated patient replies.'
  },
  {
    titleAr: 'التقويم وحجز المواعيد الفوري',
    titleEn: 'Interactive Clinic Calendar',
    descriptionAr: 'تحكم في جداول الأطباء، ومواعيد الكشوفات، وأوقات الانتظار. يدعم التقويم الحجز السريع وطباعة التذاكر الحرارية.',
    descriptionEn: 'Control doctor shifts, consultation slots, and waitlists. Includes quick booking and instant printable slips.',
    icon: CalendarDays,
    badgeAr: 'إدارة المواعيد',
    badgeEn: 'Calendar & Slots',
    tipAr: 'انقر على أي موعد لطباعة تذكرة كشف حرارية أو إرسال تأكيد واتساب.',
    tipEn: 'Click any appointment to print a thermal receipt or send WhatsApp confirmation.'
  },
  {
    titleAr: 'الاستقبال الصوتي والذكاء الاصطناعي',
    titleEn: 'AI Reception & Voice Agent',
    descriptionAr: 'مساعد ذكي يستقبل مكالمات واستفسارات المرضى على مدار الساعة، ويقوم بالحجز التلقائي وتحليل نية المريض.',
    descriptionEn: 'Smart 24/7 agent receiving patient phone calls, handling automated bookings, and classifying inquiries.',
    icon: Bot,
    badgeAr: 'الوكيل الذكي',
    badgeEn: 'AI Operations',
    tipAr: 'تابع مؤشرات تحويل المكالمات ونسب الحضور مباشرة من لوحة الذكاء الاصطناعي.',
    tipEn: 'Monitor call conversion rates and attendance metrics live from AI Analytics.'
  }
];

export function OnboardingTour({ clinicId }: { clinicId: string }) {
  const { language } = usePreferences();
  const isArabic = language === 'ar';
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
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

  // A clinic without a live subscription must finish the code card before the
  // tour can be closed; the flag is only written after a successful activation.
  const needsActivation = Boolean(statusQuery.data && !statusQuery.data.complete && statusQuery.data.activation && !statusQuery.data.activation.activated);

  const redeem = useMutation({
    mutationFn: async (trialCode: string) => {
      const response = await fetch('/api/billing/redeem-trial-code', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trialCode }),
      });
      const payload = await response.json().catch(() => null) as { error?: string; trialEndsAt?: string } | null;
      if (!response.ok) throw new Error(payload?.error || (isArabic ? 'تعذر تفعيل الرمز. حاول مرة أخرى.' : 'Could not activate the code. Try again.'));
      return payload;
    },
    onSuccess: (payload) => {
      setCodeError('');
      setCode('');
      const copy = activationCopy[isArabic ? 'ar' : 'en'];
      toast.success(copy.success(payload?.trialEndsAt ? formatTrialEnd(payload.trialEndsAt, !isArabic) : ''));
      void queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      void queryClient.invalidateQueries({ queryKey: ['billing'] });
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      setIsOpen(false);
    },
    onError: (error: Error) => setCodeError(error.message),
  });

  useEffect(() => {
    if (needsActivation) {
      setIsOpen(true);
      return undefined;
    }
    const isCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!isCompleted) {
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [needsActivation]);

  const copy = activationCopy[isArabic ? 'ar' : 'en'];
  const totalSteps = steps.length + (needsActivation ? 1 : 0);
  const onActivationCard = needsActivation && currentStep >= steps.length;

  const handleFinish = () => {
    if (needsActivation) return; // no escape while the code card is pending
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  const handleNext = () => {
    if (onActivationCard) return;
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const submitCode = (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      setCodeError(copy.emptyCode);
      return;
    }
    redeem.mutate(code.trim());
  };

  if (!isOpen) return null;

  const activation = statusQuery.data?.activation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl md:p-8 animate-scale-up">
        {/* Header close — hidden while the activation code is pending */}
        {!needsActivation && (
          <button
            type="button"
            onClick={handleFinish}
            className="absolute end-4 top-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label={isArabic ? 'إغلاق' : 'Close'}
          >
            <X className="size-4" />
          </button>
        )}

        {/* Step Badge */}
        <div className="mb-5 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${onActivationCard ? 'bg-amber-400/15 text-amber-500 dark:text-amber-300' : 'bg-primary/10 text-primary'}`}>
            <Compass className="size-3.5" />
            {onActivationCard ? copy.badge : isArabic ? steps[currentStep].badgeAr : steps[currentStep].badgeEn}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {Math.min(currentStep + 1, totalSteps)} / {totalSteps}
          </span>
        </div>

        {onActivationCard ? (
          <>
            {/* Mandatory trial-code card */}
            <div className="mb-4 flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
                <KeyRound className="size-7" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-foreground md:text-xl">{copy.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{isArabic ? 'آخر خطوة في بطاقات الترحيب' : 'The last welcome card'}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{copy.description}</p>
            <div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-3.5 text-xs text-amber-600 dark:text-amber-300">
              <strong className="font-bold">{isArabic ? '🔒 تنبيه: ' : '🔒 Note: '}</strong>
              <span>{copy.tip}</span>
            </div>
            <form onSubmit={submitCode} className="mt-5 space-y-3">
              <label className="block text-right">
                <span className="mb-1.5 block text-xs font-bold text-foreground">{copy.inputLabel}</span>
                <input
                  value={code}
                  onChange={(event) => { setCode(event.target.value); setCodeError(''); }}
                  placeholder={copy.placeholder}
                  dir="ltr"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-bold tracking-wider text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  autoComplete="off"
                  spellCheck={false}
                  data-testid="input-tour-activation-code"
                />
                {codeError ? (
                  <span className="mt-2 block text-xs font-bold text-red-500" role="alert" data-testid="text-tour-activation-error">{codeError}</span>
                ) : null}
              </label>
              <button
                type="submit"
                disabled={redeem.isPending}
                aria-busy={redeem.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
                data-testid="button-tour-activate"
              >
                {redeem.isPending ? <><RefreshCw className="size-4 animate-spin" /> <span>{copy.submitting}</span></> : <><KeyRound className="size-4" /> <span>{copy.submit}</span></>}
              </button>
            </form>
            {activation?.trialEndsAt ? (
              <p className="mt-4 text-center text-[11px] text-muted-foreground">
                {isArabic ? `تجربتك شغالة حتى ${formatTrialEnd(activation.trialEndsAt, false)}.` : `Trial active until ${formatTrialEnd(activation.trialEndsAt, true)}.`}
              </p>
            ) : null}
          </>
        ) : (
          <>
            {(() => {
              const step = steps[currentStep];
              const Icon = step.icon;
              return (
                <>
                  <div className="mb-4 flex items-center gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
                      <Icon className="size-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-foreground md:text-xl">
                        {isArabic ? step.titleAr : step.titleEn}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {isArabic ? 'جولة تعريفية سريعة لمركز العمليات' : 'Quick overview of your operating workspace'}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {isArabic ? step.descriptionAr : step.descriptionEn}
                  </p>

                  <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-primary">
                    <strong className="font-bold">{isArabic ? '💡 نصيحة ذكية: ' : '💡 Pro tip: '}</strong>
                    <span>{isArabic ? step.tipAr : step.tipEn}</span>
                  </div>
                </>
              );
            })()}
          </>
        )}

        {/* Progress Bar & Actions */}
        <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  currentStep === idx ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && !onActivationCard && (
              <button
                type="button"
                onClick={handlePrev}
                className="rounded-xl border border-border px-3.5 py-2 text-xs font-bold text-foreground transition hover:bg-muted"
              >
                {isArabic ? 'السابق' : 'Back'}
              </button>
            )}
            {!onActivationCard && (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
              >
                <span>
                  {currentStep === totalSteps - 1
                    ? (needsActivation ? (isArabic ? 'إدخال الرمز' : 'Enter code') : (isArabic ? 'ابدأ العمل الآن' : 'Get Started'))
                    : (isArabic ? 'التالي' : 'Next')}
                </span>
                {needsActivation && currentStep === totalSteps - 1 ? (
                  <KeyRound className="size-3.5" />
                ) : currentStep === totalSteps - 1 ? (
                  <Check className="size-3.5" />
                ) : isArabic ? (
                  <ArrowLeft className="size-3.5" />
                ) : (
                  <ArrowRight className="size-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
