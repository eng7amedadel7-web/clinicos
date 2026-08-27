import { createHmac, timingSafeEqual } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { getProfile } from "./auth";
import { readSession } from "../lib/session";
import { supabaseAdminRequest, supabaseRequest } from "../lib/supabase";

const router = Router();
const PADDLE_API = "https://api.paddle.com";

const priceCatalog = {
  starter: {
    month: process.env.PADDLE_PRICE_STARTER_MONTH ?? "pri_01m0w2fbmjywx91qfsjakk58ey",
    year: process.env.PADDLE_PRICE_STARTER_YEAR ?? "pri_01m0w2fbp8t2tpwwfrd6eysrbp",
  },
  growth: {
    month: process.env.PADDLE_PRICE_GROWTH_MONTH ?? "pri_01m0w2fbz9tfd9b2kbx7q3arvd",
    year: process.env.PADDLE_PRICE_GROWTH_YEAR ?? "pri_01m0w2fc19bacb3vbbr15qaqa4",
  },
  pro: {
    month: process.env.PADDLE_PRICE_PRO_MONTH ?? "pri_01m0w2fc7qqtwsgrq7fh7jgmyt",
    year: process.env.PADDLE_PRICE_PRO_YEAR ?? "pri_01m0w2fc9f7vwsp5dteamsq263",
  },
} as const;

const checkoutSchema = z.object({
  plan: z.enum(["starter", "growth", "pro"]),
  interval: z.enum(["month", "year"]),
});

type BillingProfile = Awaited<ReturnType<typeof getProfile>>;
type StoredSubscription = {
  id?: string;
  paddle_price_id?: string | null;
  plan?: string;
  billing_interval?: string;
  status?: string;
  trial_ends_at?: string | null;
  current_period_starts_at?: string | null;
  current_period_ends_at?: string | null;
  cancel_at_period_end?: boolean;
  scheduled_change?: Record<string, unknown> | null;
  paddle_subscription_id?: string;
};
type StoredTransaction = {
  id?: string;
  status?: string;
  total?: string | null;
  currency_code?: string;
  billed_at?: string | null;
};
type PaddleSubscription = {
  id: string;
  customer_id?: string;
  status: string;
  items?: Array<{ price?: { id?: string; billing_cycle?: { interval?: string } } }>;
  custom_data?: { clinic_id?: string };
  current_billing_period?: { starts_at?: string; ends_at?: string };
  next_billed_at?: string | null;
  canceled_at?: string | null;
  scheduled_change?: Record<string, unknown> | null;
};

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

async function paddleRequest<T>(path: string, init: RequestInit = {}) {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) throw new Error("Paddle is not configured.");
  const response = await fetch(`${PADDLE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = (await response.json()) as { data?: T; error?: { detail?: string } };
  if (!response.ok || !body.data) throw new Error(body.error?.detail ?? "Paddle request failed.");
  return body.data;
}

async function requireClinic(req: Request, res: Response): Promise<{ session: NonNullable<ReturnType<typeof readSession>>; profile: NonNullable<BillingProfile> } | null> {
  const session = readSession(req);
  if (!session) {
    res.status(401).json({ error: "Not authenticated." });
    return null;
  }
  const userResult = await supabaseRequest<{ id: string; email?: string }>("/auth/v1/user", {
    headers: authHeaders(session.accessToken),
  });
  if (!userResult.ok || !userResult.data?.id || userResult.data.id !== session.userId) {
    res.status(401).json({ error: "Your session has expired." });
    return null;
  }
  const profile = await getProfile(userResult.data, session.accessToken);
  if (!profile || profile.clinic.id !== session.clinicId) {
    res.status(403).json({ error: "Clinic access is no longer available." });
    return null;
  }
  return { session, profile };
}

function planFromPrice(priceId?: string) {
  for (const [plan, intervals] of Object.entries(priceCatalog)) {
    for (const [interval, id] of Object.entries(intervals)) {
      if (id === priceId) return { plan, interval };
    }
  }
  return { plan: "pro", interval: "month" };
}

function assertAdminResult(result: { ok: boolean; status: number }, operation: string) {
  if (!result.ok) throw new Error(`${operation} failed (${result.status}).`);
}

function trialEndsAtFor(subscription: PaddleSubscription) {
  if (subscription.status !== "trialing") return null;
  return subscription.next_billed_at ?? subscription.current_billing_period?.ends_at ?? null;
}

function summarizeLifecycle(subscription: StoredSubscription | null) {
  if (!subscription?.status) {
    return {
      phase: "none",
      statusLabel: "غير مشترك",
      periodLabel: "لا توجد دورة فوترة نشطة",
      effectiveEndsAt: null,
      isTrialing: false,
      needsAttention: false,
    } as const;
  }

  const isTrialing = subscription.status === "trialing";
  const effectiveEndsAt = subscription.current_period_ends_at ?? subscription.trial_ends_at ?? null;
  const statusMap: Record<string, string> = {
    trialing: "فترة تجريبية",
    active: "نشط",
    past_due: "متأخر السداد",
    paused: "موقوف مؤقتًا",
    canceled: "ملغي",
  };
  const periodLabel = isTrialing
    ? "انتهاء التجربة"
    : subscription.cancel_at_period_end
      ? "الإلغاء المجدول"
      : "التجديد القادم";

  return {
    phase: subscription.status,
    statusLabel: statusMap[subscription.status] ?? subscription.status,
    periodLabel,
    effectiveEndsAt,
    isTrialing,
    needsAttention: subscription.status === "past_due",
  } as const;
}

async function syncSubscriptionSnapshot(clinicId: string, stored: StoredSubscription | null) {
  if (!stored?.paddle_subscription_id) return stored;
  const remote = await paddleRequest<PaddleSubscription>(`/subscriptions/${encodeURIComponent(stored.paddle_subscription_id)}`);
  const selection = planFromPrice(remote.items?.[0]?.price?.id);
  const write = await supabaseAdminRequest<unknown>("/rest/v1/clinic_subscriptions?on_conflict=clinic_id", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      clinic_id: clinicId,
      paddle_subscription_id: remote.id,
        paddle_price_id: remote.items?.[0]?.price?.id ?? stored.paddle_price_id ?? null,
      plan: selection.plan,
      billing_interval: selection.interval,
      status: remote.status,
      trial_ends_at: trialEndsAtFor(remote),
      current_period_starts_at: remote.current_billing_period?.starts_at ?? null,
      current_period_ends_at: remote.current_billing_period?.ends_at ?? null,
      cancel_at_period_end: Boolean(remote.scheduled_change),
      scheduled_change: remote.scheduled_change ?? {},
      updated_at: new Date().toISOString(),
    }),
  });
  assertAdminResult(write, "Subscription sync");
  if (remote.customer_id) {
    const customerWrite = await supabaseAdminRequest<unknown>("/rest/v1/billing_customers?on_conflict=clinic_id", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ clinic_id: clinicId, paddle_customer_id: remote.customer_id, updated_at: new Date().toISOString() }),
    });
    assertAdminResult(customerWrite, "Customer sync");
  }
  return {
    ...stored,
    paddle_subscription_id: remote.id,
    plan: selection.plan,
    billing_interval: selection.interval,
    status: remote.status,
    trial_ends_at: trialEndsAtFor(remote),
    current_period_starts_at: remote.current_billing_period?.starts_at ?? null,
    current_period_ends_at: remote.current_billing_period?.ends_at ?? null,
    cancel_at_period_end: Boolean(remote.scheduled_change),
    scheduled_change: remote.scheduled_change ?? {},
  } satisfies StoredSubscription;
}

router.get("/billing", async (req, res) => {
  const context = await requireClinic(req, res);
  if (!context) return;
  const headers = authHeaders(context.session.accessToken);
  const [subscription, transactions] = await Promise.all([
    supabaseRequest<StoredSubscription[]>(`/rest/v1/clinic_subscriptions?select=id,paddle_price_id,plan,billing_interval,status,trial_ends_at,current_period_starts_at,current_period_ends_at,cancel_at_period_end,scheduled_change,paddle_subscription_id&clinic_id=eq.${context.session.clinicId}&limit=1`, { headers }),
    supabaseRequest<StoredTransaction[]>(`/rest/v1/billing_transactions?select=id,status,total,currency_code,billed_at&clinic_id=eq.${context.session.clinicId}&order=billed_at.desc&limit=20`, { headers }),
  ]);
  if (!subscription.ok || !transactions.ok) {
    req.log?.error({ subscriptionStatus: subscription.status, transactionsStatus: transactions.status }, "Billing data lookup failed");
    res.status(502).json({ error: "Billing data is temporarily unavailable." });
    return;
  }

  let currentSubscription = subscription.data?.[0] ?? null;
  if (currentSubscription?.paddle_subscription_id) {
    try {
      currentSubscription = await syncSubscriptionSnapshot(context.session.clinicId, currentSubscription);
    } catch (error) {
      req.log?.warn({ err: error, subscriptionId: currentSubscription.paddle_subscription_id }, "Billing subscription sync skipped");
    }
  }
  const lifecycle = summarizeLifecycle(currentSubscription);

  res.json({
    subscription: currentSubscription,
    lifecycle,
    transactions: transactions.ok ? transactions.data ?? [] : [],
    canManage: context.profile.user.role === "owner" || context.profile.user.role === "admin",
    clientToken: process.env.PADDLE_CLIENT_TOKEN ?? null,
    catalog: priceCatalog,
  });
});

router.post("/billing/checkout", async (req, res) => {
  const context = await requireClinic(req, res);
  if (!context) return;
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Choose a valid plan and billing period." });
    return;
  }
  const priceId = priceCatalog[parsed.data.plan][parsed.data.interval];
  try {
    const transaction = await paddleRequest<{ id: string }>("/transactions", {
      method: "POST",
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        custom_data: { clinic_id: context.session.clinicId, user_id: context.session.userId },
        collection_mode: "automatic",
      }),
    });
    res.status(201).json({ transactionId: transaction.id });
  } catch (error) {
    req.log?.error({ err: error }, "Paddle checkout creation failed");
    res.status(502).json({ error: "Checkout is temporarily unavailable." });
  }
});

router.post("/billing/portal", async (req, res) => {
  const context = await requireClinic(req, res);
  if (!context) return;
  const subscriptionResult = await supabaseAdminRequest<Array<{ paddle_subscription_id?: string }>>(
    `/rest/v1/clinic_subscriptions?select=paddle_subscription_id&clinic_id=eq.${context.session.clinicId}&limit=1`,
  );
  if (!subscriptionResult.ok) {
    req.log?.error({ status: subscriptionResult.status }, "Billing subscription lookup failed");
    res.status(503).json({ error: "Billing service is not configured." });
    return;
  }
  const subscriptionId = subscriptionResult.data?.[0]?.paddle_subscription_id;
  if (!subscriptionId) {
    res.status(404).json({ error: "No active Paddle subscription was found." });
    return;
  }
  try {
    const portal = await paddleRequest<{ urls?: { general?: { overview?: string } } }>(`/customers/${encodeURIComponent((await getCustomerId(context.session.clinicId)) ?? "")}/portal-sessions`, { method: "POST", body: "{}" });
    const url = portal.urls?.general?.overview;
    if (!url) throw new Error("Portal URL missing");
    res.json({ url });
  } catch (error) {
    req.log?.error({ err: error }, "Paddle portal creation failed");
    res.status(502).json({ error: "The billing portal is temporarily unavailable." });
  }
});

async function getCustomerId(clinicId: string) {
  const result = await supabaseAdminRequest<Array<{ paddle_customer_id?: string }>>(`/rest/v1/billing_customers?select=paddle_customer_id&clinic_id=eq.${clinicId}&limit=1`);
  if (!result.ok) throw new Error(`Billing customer lookup failed (${result.status}).`);
  return result.data?.[0]?.paddle_customer_id;
}

export async function paddleWebhook(req: Request, res: Response) {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body ?? ""));
  const signature = req.header("paddle-signature") ?? "";
  const secret = process.env.PADDLE_WEBHOOK_SECRET ?? "";
  const parts = Object.fromEntries(signature.split(";").map((part) => part.split("=", 2)));
  const timestamp = parts.ts;
  const provided = parts.h1;
  const timestampSeconds = Number(timestamp);
  if (!timestamp || !provided || !secret || !Number.isFinite(timestampSeconds) || Math.abs(Date.now() / 1000 - timestampSeconds) > 300) {
    res.status(401).json({ error: "Invalid webhook signature." });
    return;
  }
  const expected = createHmac("sha256", secret).update(`${timestamp}:${rawBody.toString("utf8")}`).digest("hex");
  const valid = provided.length === expected.length && timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  if (!valid) {
    res.status(401).json({ error: "Invalid webhook signature." });
    return;
  }

  let event: { event_id: string; event_type: string; occurred_at?: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody.toString("utf8")) as typeof event;
  } catch {
    res.status(400).json({ error: "Invalid webhook payload." });
    return;
  }
  if (!event.event_id || !event.event_type || !event.data || typeof event.data !== "object") {
    res.status(400).json({ error: "Invalid webhook payload." });
    return;
  }
  const alreadyProcessed = await supabaseAdminRequest<Array<{ event_id: string }>>(`/rest/v1/billing_events?select=event_id&event_id=eq.${encodeURIComponent(event.event_id)}&limit=1`);
  if (!alreadyProcessed.ok) {
    res.status(503).json({ error: "Webhook processing is temporarily unavailable." });
    return;
  }
  if (alreadyProcessed.data?.length) {
    res.status(200).json({ received: true, duplicate: true });
    return;
  }
  const data = event.data as unknown as PaddleSubscription & { subscription_id?: string; billed_at?: string; details?: { totals?: { total?: string; currency_code?: string } }; invoice_number?: string };
  const clinicId = data.custom_data?.clinic_id;
  if (!clinicId) {
    res.status(200).json({ received: true, ignored: true });
    return;
  }

  try {
    if (event.event_type.startsWith("subscription.")) {
      const priceId = data.items?.[0]?.price?.id;
      const selection = planFromPrice(priceId);
      const subscriptionWrite = await supabaseAdminRequest("/rest/v1/clinic_subscriptions?on_conflict=clinic_id", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({
          clinic_id: clinicId,
          paddle_subscription_id: data.id,
          paddle_price_id: priceId,
          plan: selection.plan,
          billing_interval: selection.interval,
          status: data.status === "canceled" ? "canceled" : data.status,
          trial_ends_at: trialEndsAtFor(data),
          current_period_starts_at: data.current_billing_period?.starts_at,
          current_period_ends_at: data.current_billing_period?.ends_at,
          cancel_at_period_end: Boolean(data.scheduled_change),
          scheduled_change: data.scheduled_change,
          updated_at: new Date().toISOString(),
        }),
      });
      assertAdminResult(subscriptionWrite, "Subscription update");
      if (data.customer_id) {
        const customerWrite = await supabaseAdminRequest("/rest/v1/billing_customers?on_conflict=clinic_id", {
          method: "POST",
          headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({ clinic_id: clinicId, paddle_customer_id: data.customer_id, updated_at: new Date().toISOString() }),
        });
        assertAdminResult(customerWrite, "Customer update");
      }
    }

    if (event.event_type.startsWith("transaction.")) {
      const transactionWrite = await supabaseAdminRequest("/rest/v1/billing_transactions?on_conflict=paddle_transaction_id", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({
          clinic_id: clinicId,
          paddle_transaction_id: data.id,
          status: data.status,
          currency_code: data.details?.totals?.currency_code ?? "USD",
          total: data.details?.totals?.total,
          billed_at: data.billed_at ?? event.occurred_at,
        }),
      });
      assertAdminResult(transactionWrite, "Transaction update");
    }

    const eventWrite = await supabaseAdminRequest("/rest/v1/billing_events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: event.event_id, event_type: event.event_type, clinic_id: clinicId, occurred_at: event.occurred_at }),
    });
    assertAdminResult(eventWrite, "Billing event write");
  } catch (error) {
    req.log?.error({ err: error }, "Paddle webhook persistence failed");
    res.status(503).json({ error: "Webhook processing is temporarily unavailable." });
    return;
  }
  res.status(200).json({ received: true });
}

export default router;
