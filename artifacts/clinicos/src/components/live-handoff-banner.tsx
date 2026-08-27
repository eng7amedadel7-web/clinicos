import { useState } from 'react';
import { ShieldAlert, Bot, UserCheck, ArrowLeft, ArrowRight, MessageSquare, PhoneCall, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { usePreferences } from '@/lib/preferences';

export function LiveHandoffBanner({ onTakeOver }: { onTakeOver?: () => void }) {
  const { language } = usePreferences();
  const isArabic = language === 'ar';
  const [isVisible, setIsVisible] = useState(true);
  const [takenOver, setTakenOver] = useState(false);

  if (!isVisible) return null;

  const handleTakeOver = () => {
    setTakenOver(true);
    toast.success(isArabic ? 'تم تحويل المحادثة إليك، وتوقف الوكيل الصوتي عن الرد التلقائي' : 'Conversation handed off to you; AI auto-reply paused');
    onTakeOver?.();
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 md:p-5 shadow-lg animate-rise" dir="rtl">
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        className="absolute top-3 end-3 text-muted-foreground hover:text-foreground text-xs"
        aria-label="Dismiss alert"
      >
        <X className="size-4" />
      </button>

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        {/* Patient & Alert Info */}
        <div className="flex items-start gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
            <ShieldAlert className="size-6 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                {isArabic ? '⚡ طلب تحويل بشري عاجل' : '⚡ Urgent Human Escalation'}
              </span>
              <span className="font-bold text-xs text-foreground">
                {isArabic ? 'المريض: أحمد المنصوري (0551234567)' : 'Patient: Ahmed Mansour (0551234567)'}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                WhatsApp · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">{isArabic ? 'ملخص الذكاء الاصطناعي: ' : 'AI Summary: '}</strong>
              {isArabic
                ? 'المريض يعاني من حساسية مفاجئة بعد جلسة تبييض ويطلب استشارة الطبيب لتعديل المسكن فوراً.'
                : 'Patient experiencing sensitivity after bleaching session, requesting immediate doctor consultation.'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          {takenOver ? (
            <span className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm">
              <UserCheck className="size-4" />
              <span>{isArabic ? 'أنت تدير المحادثة الآن' : 'You are in control'}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleTakeOver}
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-amber-700 active:scale-95"
            >
              <UserCheck className="size-4" />
              <span>{isArabic ? 'استلام المحادثة فوراً' : 'Take Over Conversation'}</span>
              {isArabic ? <ArrowLeft className="size-3.5" /> : <ArrowRight className="size-3.5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
