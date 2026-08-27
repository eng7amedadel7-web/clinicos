import { TrendingUp, Users, CalendarCheck, MessageSquare, PhoneCall, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePreferences } from '@/lib/preferences';

export function InboundFunnelCard() {
  const { language } = usePreferences();
  const isArabic = language === 'ar';

  const funnelSteps = [
    {
      labelAr: 'إجمالي المحادثات والمكالمات الواردة',
      labelEn: 'Total Inbound Inquiries',
      count: 1420,
      pct: 100,
      color: 'bg-sky-500',
      textColor: 'text-sky-600 dark:text-sky-400',
      icon: MessageSquare
    },
    {
      labelAr: 'استفسارات الأسعار والخدمات',
      labelEn: 'Pricing & Service Inquiries',
      count: 890,
      pct: 62.6,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      icon: Sparkles
    },
    {
      labelAr: 'نية حجز مؤكدة ملتقطة بواسطة الذكاء الاصطناعي',
      labelEn: 'AI Detected Booking Intent',
      count: 512,
      pct: 36.0,
      color: 'bg-violet-500',
      textColor: 'text-violet-600 dark:text-violet-400',
      icon: Users
    },
    {
      labelAr: 'مواعيد كشف تم تثبيتها في التقويم',
      labelEn: 'Confirmed Appointments Scheduled',
      count: 384,
      pct: 27.0,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      icon: CalendarCheck
    },
    {
      labelAr: 'مرضى حضروا وتلقوا العلاج بنجاح',
      labelEn: 'Attended & Completed Visits',
      count: 352,
      pct: 24.7,
      color: 'bg-teal-500',
      textColor: 'text-teal-600 dark:text-teal-400',
      icon: CheckCircle2
    }
  ];

  return (
    <div className="surface rounded-3xl p-6 md:p-8 space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
            <TrendingUp className="size-4" />
            <span>{isArabic ? 'قمع تحويل الاستقبال الذكي' : 'Inbound Conversion Funnel'}</span>
          </div>
          <h3 className="text-base font-extrabold text-foreground md:text-lg">
            {isArabic ? 'مسار تحويل الرسائل والمكالمات إلى حجوزات فعلية' : 'Lead-to-Patient Conversion Journey'}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-border/80 bg-muted/40 px-3.5 py-1.5 text-center">
            <span className="block text-[10px] text-muted-foreground">{isArabic ? 'معدل التحويل الكلي' : 'Overall Conversion'}</span>
            <strong className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">24.7%</strong>
          </div>
          <div className="rounded-2xl border border-border/80 bg-muted/40 px-3.5 py-1.5 text-center">
            <span className="block text-[10px] text-muted-foreground">{isArabic ? 'نسبة الحضور الفعلي' : 'Show-Up Rate'}</span>
            <strong className="text-sm font-extrabold text-primary">91.6%</strong>
          </div>
        </div>
      </div>

      {/* Funnel Step Bars */}
      <div className="space-y-3.5">
        {funnelSteps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Icon className={`size-3.5 ${step.textColor}`} />
                  <span className="font-bold text-foreground">
                    {isArabic ? step.labelAr : step.labelEn}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <strong className="font-mono text-foreground font-bold">{step.count.toLocaleString()}</strong>
                  <span className={`font-mono text-[11px] font-semibold ${step.textColor}`}>
                    ({step.pct}%)
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div className="h-3 overflow-hidden rounded-full bg-muted/60 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${step.color}`}
                  style={{ width: `${step.pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Insights */}
      <div className="grid gap-3 pt-3 border-t border-border/70 sm:grid-cols-3 text-xs">
        <div className="rounded-2xl bg-card border border-border/60 p-3">
          <span className="text-[10px] text-muted-foreground">{isArabic ? 'أعلى قناة تحويلاً' : 'Top Conversion Channel'}</span>
          <p className="mt-0.5 font-bold text-foreground">💬 WhatsApp (74.2%)</p>
        </div>
        <div className="rounded-2xl bg-card border border-border/60 p-3">
          <span className="text-[10px] text-muted-foreground">{isArabic ? 'متوسط وقت تأكيد الحجز' : 'Avg Time to Book'}</span>
          <p className="mt-0.5 font-bold text-foreground">⚡ 3 دقائق و 20 ثانية</p>
        </div>
        <div className="rounded-2xl bg-card border border-border/60 p-3">
          <span className="text-[10px] text-muted-foreground">{isArabic ? 'إيرادات الحجوزات المؤكدة' : 'Pipeline Booked Value'}</span>
          <p className="mt-0.5 font-bold text-emerald-600 dark:text-emerald-400">💰 57,600 ريال</p>
        </div>
      </div>
    </div>
  );
}
