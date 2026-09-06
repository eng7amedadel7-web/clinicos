import { supabaseRequest } from "./supabase";

// Trial activation state for the calling clinic. A clinic counts as activated
// while it holds a live subscription: an active/past-due/paused Paddle plan,
// or an unexpired trialing window created by redeeming a trial code. A missing
// row (the default for new clinics since the auto-trial trigger was removed)
// or an expired trial means the clinic is not activated yet.
export type ActivationSnapshot = {
  activated: boolean;
  phase: "trialing" | "active" | "past_due" | "paused" | "canceled" | "none";
  trialEndsAt: string | null;
};

type StoredSubscription = {
  status?: string | null;
  trial_ends_at?: string | null;
  current_period_ends_at?: string | null;
};

export const CLINIC_NOT_ACTIVATED_MESSAGE =
  "عيادتك غير مفعلة بعد. أدخل رمز التفعيل من لوحة عيادتك لبدء تجربتك المجانية.";

export async function getClinicActivation(accessToken: string, clinicId: string): Promise<ActivationSnapshot> {
  const result = await supabaseRequest<StoredSubscription[]>(
    `/rest/v1/clinic_subscriptions?select=status,trial_ends_at,current_period_ends_at&clinic_id=eq.${encodeURIComponent(clinicId)}&limit=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const row = result.ok ? result.data?.[0] : undefined;
  if (!row?.status) {
    return { activated: false, phase: "none", trialEndsAt: null };
  }

  const trialEndsAt = row.trial_ends_at ?? null;
  const periodEndsAt = row.current_period_ends_at ?? null;
  const phase = row.status as ActivationSnapshot["phase"];

  if (phase === "trialing") {
    const live = !!trialEndsAt && new Date(trialEndsAt) > new Date();
    return { activated: live, phase, trialEndsAt };
  }
  if (phase === "active" || phase === "past_due" || phase === "paused") {
    return { activated: true, phase, trialEndsAt };
  }
  // Canceled plans keep access until the paid period actually ends.
  if (phase === "canceled") {
    const live = !!periodEndsAt && new Date(periodEndsAt) > new Date();
    return { activated: live, phase, trialEndsAt };
  }
  return { activated: false, phase, trialEndsAt };
}
