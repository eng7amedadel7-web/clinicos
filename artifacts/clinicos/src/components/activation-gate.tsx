import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { BrandMark } from '@/components/brand';
import { usePreferences } from '@/lib/preferences';

// Mandatory trial-activation gate. While the clinic has no live subscription,
// this full-screen overlay locks the whole workspace: no dismiss button, no
// backdrop close, no escape — the owner must paste the platform-issued trial
// code (the final "card" of the welcome/onboarding flow) to get in. It renders
// at the shell level so route changes and keyboard shortcuts cannot escape it.
// A status-fetch failure fails OPEN so a server hiccup never locks users out.
type ActivationInfo = { activated: boolean; phase: string; trialEndsAt: string | null };
type OnboardingStatus = { items: Array<{ id: string; done: boolean }>; complete: boolean; activation?: ActivationInfo };

const gateCopy = {
  ar: {
    kicker: 'الخطوة الأخيرة في بطاقات الترحيب',
    title: 'فعّل تجربتك المجانية',
    body: 'فريق ميرونا بعت لك رمز تفعيل خاص بعيادتك. أدخل الرمز هنا لتشغيل تجربتك المجانية والوصول الكامل لمساحة عملك.',
    lockHint: 'الخطوة دي إجبارية — مش هتقدر تكمل لحد ما تدخل الرمز الصحيح.',
    trialNote: 'بعد التفعيل هتكمّل باقي خطوات إعداد العيادة براحتك.',
    placeholder: 'MERUNA-XXXX-XXXX-XXXX',
    inputLabel: 'رمز التفعيل',
    submit: 'تفعيل التجربة والدخول',
    submitting: 'جارٍ التفعيل...',
    emptyCode: 'أدخل رمز التفعيل الأول.',
    success: (date: string) => `تم تفعيل تجربتك حتى ${date}. أهلاً بك في ميرونا!`,
  },
  en: {
    kicker: 'The final welcome step',
    title: 'Activate your free trial',
    body: 'The MERUNA team sent you an activation code for your clinic. Enter it here to start your free trial and unlock your full workspace.',
    lockHint: 'This step is mandatory — you cannot continue until the correct code is entered.',
    trialNote: 'After activation you can complete the remaining setup steps at your own pace.',
    placeholder: 'MERUNA-XXXX-XXXX-XXXX',
    inputLabel: 'Activation code',
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

export function ActivationGate({ clinicId }: { clinicId: string }) {
  const { language } = usePreferences();
  const en = language === 'en';
  const copy = en ? gateCopy.en : gateCopy.ar;
  const queryClient = useQueryClient();
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
      toast.success(copy.success(payload?.trialEndsAt ? formatTrialEnd(payload.trialEndsAt, en) : ''));
      void queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      void queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
    onError: (error: Error) => setCodeError(error.message),
  });

  if (statusQuery.isLoading || statusQuery.isError) return null;
  const status = statusQuery.data;
  if (!status || !status.activation || status.activation.activated) return null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      setCodeError(copy.emptyCode);
      return;
    }
    redeem.mutate(code.trim());
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#081624]/95 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={copy.title} dir="rtl">
      <div className="w-full max-w-lg rounded-3xl border border-[#1e3a4d] bg-[#0d2134] p-7 shadow-2xl md:p-9" data-testid="card-activation-gate">
        <div className="mb-6 flex items-center justify-between">
          <BrandMark size={34} />
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-bold text-amber-300">{copy.kicker}</span>
        </div>
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300">
          <KeyRound className="size-7" />
        </div>
        <h1 className="text-2xl font-black text-white" data-testid="heading-activation-gate">{copy.title}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">{copy.body}</p>
        <p className="mt-2 text-xs leading-6 text-amber-300/90">{copy.lockHint}</p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="block text-right">
            <span className="mb-1.5 block text-xs font-bold text-slate-200">{copy.inputLabel}</span>
            <input
              value={code}
              onChange={(event) => { setCode(event.target.value); setCodeError(''); }}
              placeholder={copy.placeholder}
              dir="ltr"
              className="w-full rounded-xl border border-[#1e3a4d] bg-[#081624] px-4 py-3 text-sm font-bold tracking-wider text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
              autoComplete="off"
              spellCheck={false}
              autoFocus
              data-testid="input-activation-gate-code"
            />
            {codeError ? <span className="mt-2 block text-xs font-bold text-red-400" role="alert" data-testid="text-activation-gate-error">{codeError}</span> : null}
          </label>
          <button
            type="submit"
            disabled={redeem.isPending}
            aria-busy={redeem.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-400 hover:to-indigo-500 disabled:opacity-60"
            data-testid="button-activation-gate-submit"
          >
            {redeem.isPending ? <><RefreshCw className="size-4 animate-spin" /> <span>{copy.submitting}</span></> : <><KeyRound className="size-4" /> <span>{copy.submit}</span></>}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">{copy.trialNote}</p>
      </div>
    </div>
  );
}
