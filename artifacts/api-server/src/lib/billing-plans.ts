export const priceCatalog = {
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

export type BillingPlan = keyof typeof priceCatalog;

// Returns null for an unrecognized price so callers fail closed instead of
// silently upgrading a clinic to a higher plan.
export function planFromPrice(priceId?: string): { plan: string; interval: string } | null {
  for (const [plan, intervals] of Object.entries(priceCatalog)) {
    for (const [interval, id] of Object.entries(intervals)) {
      if (id === priceId) return { plan, interval };
    }
  }
  return null;
}
