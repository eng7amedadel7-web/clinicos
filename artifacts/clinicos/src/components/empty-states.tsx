import { Inbox, CalendarDays, UsersRound, CheckSquare, Search, FileText, Sparkles } from 'lucide-react';
import { usePreferences } from '@/lib/preferences';

interface EmptyStateProps {
  type: 'inbox' | 'calendar' | 'patients' | 'tasks' | 'search' | 'analytics';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EnhancedEmptyState({ type, title, description, actionLabel, onAction }: EmptyStateProps) {
  const { language } = usePreferences();
  const isArabic = language === 'ar';

  const configs = {
    inbox: {
      icon: Inbox,
      defaultTitleAr: 'لا توجد محادثات جديدة حالياً',
      defaultTitleEn: 'No conversations in inbox',
      defaultDescAr: 'جميع رسائل واستفسارات المرضى تم الرد عليها بالكامل. أنت متزامن تماماً!',
      defaultDescEn: 'All patient inquiries and messages have been resolved. You are all caught up!',
      badgeAr: 'صندوق نظيف',
      badgeEn: 'All Clear'
    },
    calendar: {
      icon: CalendarDays,
      defaultTitleAr: 'لا توجد مواعيد مسجلة لهذا اليوم',
      defaultTitleEn: 'No appointments scheduled today',
      defaultDescAr: 'الجدول متاح لاستقبال الحجوزات الجديدة أو إتاحة أوقات انتظار مرنة.',
      defaultDescEn: 'The calendar is clear and ready for new patient bookings or walk-ins.',
      badgeAr: 'جدول شاغر',
      badgeEn: 'Open Schedule'
    },
    patients: {
      icon: UsersRound,
      defaultTitleAr: 'لم يتم العثور على سجلات مرضى',
      defaultTitleEn: 'No patient profiles found',
      defaultDescAr: 'ابدأ بإضافة أول ملف مريض أو استيراد البيانات من النظام السابق.',
      defaultDescEn: 'Get started by creating your first patient profile or importing records.',
      badgeAr: 'سجل جديد',
      badgeEn: 'New Directory'
    },
    tasks: {
      icon: CheckSquare,
      defaultTitleAr: 'تم إنجاز كافة مهام العيادة اليوم 🎉',
      defaultTitleEn: 'All clinic tasks completed 🎉',
      defaultDescAr: 'رائع! لا توجد مهام معلقة أو متأخرة في قائمة انتظار الفريق.',
      defaultDescEn: 'Great job! There are no pending or overdue tasks in the clinic queue.',
      badgeAr: 'إنجاز 100%',
      badgeEn: '100% Done'
    },
    search: {
      icon: Search,
      defaultTitleAr: 'لم نتمكن من العثور على نتائج مطابقة',
      defaultTitleEn: 'No matching results found',
      defaultDescAr: 'تأكد من صحة الاسم أو رقم الهاتف أو جرب كلمات بحث أخرى.',
      defaultDescEn: 'Double-check the spelling, phone number, or try broader keywords.',
      badgeAr: 'بحث فارغ',
      badgeEn: 'No Matches'
    },
    analytics: {
      icon: FileText,
      defaultTitleAr: 'البيانات قيد التجميع والتحليل',
      defaultTitleEn: 'Data being collected & analyzed',
      defaultDescAr: 'ستظهر مؤشرات الأداء والرسوم البيانية بمجرد استقبال أول مجموعة من المواعيد والمكالمات.',
      defaultDescEn: 'Operational metrics and charts will populate once calls and appointments flow in.',
      badgeAr: 'تحليلات حية',
      badgeEn: 'Live Data'
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/60 p-8 text-center animate-fade-in md:p-12" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Decorative Icon Glow */}
      <div className="relative mb-5 flex size-18 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner">
        <Icon className="size-8" />
        <span className="absolute -top-1.5 -end-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-white shadow-xs">
          <Sparkles className="size-3" />
        </span>
      </div>

      {/* Badge */}
      <span className="mb-2 inline-block rounded-full bg-muted px-3 py-1 text-[11px] font-bold text-muted-foreground">
        {isArabic ? config.badgeAr : config.badgeEn}
      </span>

      {/* Title */}
      <h3 className="text-base font-extrabold text-foreground md:text-lg">
        {title || (isArabic ? config.defaultTitleAr : config.defaultTitleEn)}
      </h3>

      {/* Description */}
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground md:text-sm">
        {description || (isArabic ? config.defaultDescAr : config.defaultDescEn)}
      </p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-90 active:scale-95"
        >
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
