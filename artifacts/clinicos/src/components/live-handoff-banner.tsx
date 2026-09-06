import { useState } from 'react';
import { ShieldAlert, UserCheck, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { usePreferences } from '@/lib/preferences';

export type LiveHandoff = {
  id: string;
  patientName: string;
  channel: string;
  summary: string;
};

/**
 * Renders ONLY from real handoff data passed via props.
 * There is no fabricated patient, no canned summary, and no fake
 * "taken over" success feedback: without a `handoff` the banner
 * renders nothing, and taking over just delegates to `onTakeOver`.
 */
export function LiveHandoffBanner({ handoff, onTakeOver }: { handoff?: LiveHandoff | null; onTakeOver?: () => void }) {
  const { language } = usePreferences();
  const isArabic = language === 'ar';
  const [dismissed, setDismissed] = useState(false);

  if (!handoff || dismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 md:p-5 shadow-lg animate-rise" dir="rtl">
      <button
        type="button"
        onClick={() => setDismissed(true)}
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
                {isArabic ? '⚡ طلب تحويل بشري' : '⚡ Human Escalation'}
              </span>
              <span className="font-bold text-xs text-foreground">
                {isArabic ? `المريض: ${handoff.patientName}` : `Patient: ${handoff.patientName}`}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">{handoff.channel}</span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">{isArabic ? 'ملخص الذكاء الاصطناعي: ' : 'AI Summary: '}</strong>
              {handoff.summary}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onTakeOver?.()}
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-amber-700 active:scale-95"
          >
            <UserCheck className="size-4" />
            <span>{isArabic ? 'استلام المحادثة' : 'Take Over Conversation'}</span>
            {isArabic ? <ArrowLeft className="size-3.5" /> : <ArrowRight className="size-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
