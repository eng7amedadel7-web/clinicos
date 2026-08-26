import { supabaseAdminRequest } from "./supabase";

export type Entitlement = {
  status: "trial" | "active" | "expired" | "canceled" | "none";
  plan: string | null;
  trialEndsAt: string | null;
  daysRemaining: number | null;
};

const TRIAL_DAYS = 14;

type SubscriptionRow = {
  status?: string;
  plan?: string;
  trial_ends_at?: string | null;
  current_period_ends_at?: string | null;
  cancel_at_period_end?: boolean;
};

function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso) - Date.now();
  return Number.isNaN(ms) ? null : Math.ceil(ms / 86_400_000);
}

/**
 * Provision a 14-day trial subscription for a freshly onboarded clinic.
 * Uses the service role key (bypasses RLS) since new clinics have no billing
 * INSERT policy. Best-effort: a failure here must NOT block registration.
 */
export async function createTrialSubscription(clinicId: string): Promise<void> {
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 86_400_000).toISOString();
  await supabaseAdminRequest("/rest/v1/clinic_subscriptions?on_conflict=clinic_id", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      clinic_id: clinicId,
      // Synthetic id — the column is NOT NULL + UNIQUE; a real Paddle id replaces it on checkout.
      paddle_subscription_id: `trial:${clinicId}`,
      plan: "starter",
      billing_interval: "month",
      status: "trialing",
      trial_ends_at: trialEndsAt,
      updated_at: new Date().toISOString(),
    }),
  });
}

/**
 * Resolve the clinic's current entitlement from its subscription row.
 * Used to surface trial/expiry state to the UI and (optionally) gate access.
 */
export async function resolveEntitlement(clinicId: string): Promise<Entitlement> {
  const result = await supabaseAdminRequest<SubscriptionRow[]>(
    `/rest/v1/clinic_subscriptions?select=status,plan,trial_ends_at,current_period_ends_at,cancel_at_period_end&clinic_id=eq.${encodeURIComponent(clinicId)}&limit=1`,
  );
  const row = result.ok ? result.data?.[0] : undefined;
  if (!row) return { status: "none", plan: null, trialEndsAt: null, daysRemaining: null };

  const trialEndsAt = row.trial_ends_at ?? null;
  const daysRemaining = daysUntil(trialEndsAt);

  if (row.status === "trialing") {
    return { status: daysRemaining !== null && daysRemaining > 0 ? "trial" : "expired", plan: row.plan ?? null, trialEndsAt, daysRemaining };
  }
  if (row.status === "active") {
    return { status: "active", plan: row.plan ?? null, trialEndsAt, daysRemaining };
  }
  if (row.status === "canceled") {
    const grace = daysUntil(row.current_period_ends_at);
    return { status: grace !== null && grace > 0 ? "active" : "canceled", plan: row.plan ?? null, trialEndsAt, daysRemaining };
  }
  return { status: "expired", plan: row.plan ?? null, trialEndsAt, daysRemaining };
}
