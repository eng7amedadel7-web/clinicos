import { useState, useEffect } from 'react';
import { Sparkles, CalendarDays, Inbox, Bot, Check, ArrowLeft, ArrowRight, X, Compass } from 'lucide-react';
import { usePreferences } from '@/lib/preferences';

const TOUR_STORAGE_KEY = 'clinicos_tour_completed';

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

export function OnboardingTour() {
  const { language } = usePreferences();
  const isArabic = language === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const isCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!isCompleted) {
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const handleFinish = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl md:p-8 animate-scale-up">
        {/* Header close */}
        <button
          type="button"
          onClick={handleFinish}
          className="absolute end-4 top-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label={isArabic ? 'إغلاق' : 'Close'}
        >
          <X className="size-4" />
        </button>

        {/* Step Badge */}
        <div className="mb-5 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Compass className="size-3.5" />
            {isArabic ? step.badgeAr : step.badgeEn}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {currentStep + 1} / {steps.length}
          </span>
        </div>

        {/* Icon & Title */}
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

        {/* Description */}
        <p className="text-sm leading-relaxed text-muted-foreground">
          {isArabic ? step.descriptionAr : step.descriptionEn}
        </p>

        {/* Pro Tip Box */}
        <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-primary">
          <strong className="font-bold">{isArabic ? '💡 نصيحة ذكية: ' : '💡 Pro tip: '}</strong>
          <span>{isArabic ? step.tipAr : step.tipEn}</span>
        </div>

        {/* Progress Bar & Actions */}
        <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
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
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="rounded-xl border border-border px-3.5 py-2 text-xs font-bold text-foreground transition hover:bg-muted"
              >
                {isArabic ? 'السابق' : 'Back'}
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
            >
              <span>
                {currentStep === steps.length - 1
                  ? (isArabic ? 'ابدأ العمل الآن' : 'Get Started')
                  : (isArabic ? 'التالي' : 'Next')}
              </span>
              {currentStep === steps.length - 1 ? (
                <Check className="size-3.5" />
              ) : isArabic ? (
                <ArrowLeft className="size-3.5" />
              ) : (
                <ArrowRight className="size-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
