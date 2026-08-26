import { useQuery, useQueryClient } from "@tanstack/react-query";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { Check, CreditCard, ExternalLink, FileText, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const plans = [
  { key: "starter", name: "Starter", monthly: 79, yearly: 64, description: "للبدايات المنظمة", features: ["فرع واحد", "حتى 3 مستخدمين", "المواعيد والمرضى", "دعم بالبريد"] },
  { key: "growth", name: "Growth", monthly: 179, yearly: 144, description: "للعيادات سريعة النمو", features: ["حتى 3 فروع", "حتى 15 مستخدمًا", "الأتمتة والمتابعات", "تقارير متقدمة"] },
  { key: "pro", name: "Pro", monthly: 349, yearly: 280, description: "للمجموعات الطبية", features: ["فروع ومستخدمون بلا حدود", "الاستقبال الصوتي الذكي", "أولوية الدعم", "تكاملات متقدمة"] },
] as const;

type Entitlement = { status: "trial" | "active" | "expired" | "canceled" | "none"; plan: string | null; trialEndsAt: string | null; daysRemaining: number | null };

type BillingData = {
  subscription: null | { plan: string; status: string; billing_interval: string; trial_ends_at?: string; current_period_ends_at?: string; cancel_at_period_end?: boolean };
  transactions: Array<{ id: string; status: string; total?: string; currency_code: string; billed_at?: string }>;
  canManage: boolean;
  clientToken: string | null;
  entitlement?: Entitlement;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { credentials: "include", ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "تعذر إتمام الطلب");
  return body as T;
}

function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value)) : "—";
}

export default function BillingPage() {
  const client = useQueryClient();
  const [interval, setInterval] = useState<"month" | "year">("year");
  const [pending, setPending] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["clinic-billing"], queryFn: () => api<BillingData>("/billing") });
  const subscription = query.data?.subscription;

  const checkout = async (plan: string) => {
    if (!query.data?.clientToken) {
      toast.error("إعداد الدفع غير مكتمل");
      return;
    }
    setPending(plan);
    try {
      const { transactionId } = await api<{ transactionId: string }>("/billing/checkout", { method: "POST", body: JSON.stringify({ plan, interval }) });
      const paddle: Paddle | undefined = await initializePaddle({ token: query.data.clientToken, eventCallback: (event) => {
        if (event.name === "checkout.completed") {
          toast.success("تم تفعيل الاشتراك بنجاح");
          void client.invalidateQueries({ queryKey: ["clinic-billing"] });
        }
      } });
      paddle?.Checkout.open({ transactionId, settings: { displayMode: "overlay", theme: "light", locale: "ar" } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر فتح الدفع");
    } finally {
      setPending(null);
    }
  };

  const openPortal = async () => {
    setPending("portal");
    try {
      const { url } = await api<{ url: string }>("/billing/portal", { method: "POST", body: "{}" });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر فتح بوابة الفوترة");
    } finally {
      setPending(null);
    }
  };

  if (query.isLoading) return <main className="main-content min-w-0 flex-1 p-6 md:p-9" dir="rtl"><div className="skeleton h-52 w-full" /></main>;
  if (query.isError) return <main className="main-content min-w-0 flex-1 p-6 md:p-9" dir="rtl"><div className="surface p-8 text-center"><p className="font-bold text-[#173f54]">تعذر تحميل بيانات الاشتراك</p><button className="quiet-button mt-4" onClick={() => query.refetch()}>إعادة المحاولة</button></div></main>;

  return <main className="main-content min-w-0 flex-1" dir="rtl">
    <header className="border-b border-[#dbe5ea] bg-[#f6f9fa]/90 px-5 py-4 backdrop-blur md:px-9"><p className="text-xs font-semibold text-[#78909c]">الفوترة تخص هذه العيادة فقط</p><h1 className="ar mt-1 text-xl font-bold text-[#15364b]">الاشتراك والفوترة</h1></header>
    <div className="mx-auto flex max-w-[1280px] flex-col gap-7 p-5 md:p-9">
      <section className="relative overflow-hidden rounded-3xl bg-[#0c2b41] p-7 text-[#edf7f8] shadow-[0_18px_45px_rgba(12,43,65,.18)] md:p-9">
        <div className="relative z-10 flex flex-col justify-between gap-7 md:flex-row md:items-end"><div><div className="mb-3 flex items-center gap-2 text-xs font-bold text-[#85c8d7]"><ShieldCheck size={16} /> اشتراك آمن عبر Paddle</div><h2 className="ar text-3xl font-bold">{subscription?.plan ? `باقة ${subscription.plan.toUpperCase()}` : "تجربة Pro المجانية"}</h2><p className="mt-3 text-sm leading-7 text-[#aac1ca]">الحالة: <strong className="text-white">{subscription?.status === "trialing" ? "فترة تجريبية" : subscription?.status === "active" ? "نشط" : subscription?.status ?? "غير مشترك"}</strong> · التجديد/الانتهاء: {formatDate(subscription?.current_period_ends_at ?? subscription?.trial_ends_at)}</p>{subscription?.cancel_at_period_end && <p className="mt-2 text-xs text-[#e9c27b]">سيتم الإلغاء في نهاية دورة الفوترة الحالية.</p>}</div>
          {subscription?.status === "active" && <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold transition hover:bg-white/15 disabled:opacity-60" disabled={pending === "portal"} onClick={openPortal}>{pending === "portal" ? <Loader2 className="animate-spin" size={17} /> : <ExternalLink size={17} />} إدارة الدفع والإلغاء</button>}
        </div><Sparkles className="absolute -left-8 -top-8 size-52 text-white/[.035]" />
      </section>
      {query.data?.entitlement?.status === "trial" && <div className="flex items-center gap-3 rounded-2xl border border-[#e9c27b] bg-[#fff8e6] px-5 py-4 text-sm"><Clock3 size={18} className="shrink-0 text-[#9a6513]" /><p className="text-[#6b4a12]"><strong>فترة تجريبية:</strong> متبقّي {query.data.entitlement.daysRemaining ?? 0} يومًا. أضف طريقة دفع قبل {formatDate(query.data.entitlement.trialEndsAt)} لتجنّب انقطاع الخدمة.</p></div>}
      {query.data?.entitlement?.status === "expired" && <div className="flex items-center gap-3 rounded-2xl border border-[#e3b8b3] bg-[#fdecea] px-5 py-4 text-sm"><AlertCircle size={18} className="shrink-0 text-[#a64036]" /><p className="text-[#7a2d28]"><strong>انتهت الفترة التجريبية.</strong> اشترك في إحدى الباقات بالأسفل لاستئناف الوصول الكامل.</p></div>}
      {query.data?.entitlement?.status === "canceled" && <div className="flex items-center gap-3 rounded-2xl border border-[#c9dce3] bg-[#eef3f7] px-5 py-4 text-sm"><AlertCircle size={18} className="shrink-0 text-[#3c7e93]" /><p className="text-[#2a4a58]"><strong>أُلغي الاشتراك.</strong> أعِد الاشتراك في إحدى الباقات بالأسفل لتفعيل الخدمة.</p></div>}

      <section><div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><h2 className="ar text-2xl font-bold text-[#173f54]">اختر الباقة المناسبة</h2><p className="mt-2 text-sm text-[#728995]">10 أيام مجانًا، ثم تُحاسب حسب الفترة المختارة. يمكنك الإلغاء بنهاية الدورة.</p></div><div className="inline-flex w-fit rounded-xl bg-[#dfecef] p-1"><button className={`rounded-lg px-4 py-2 text-xs font-bold ${interval === "month" ? "bg-white text-[#173f54] shadow-sm" : "text-[#66808e]"}`} onClick={() => setInterval("month")}>شهري</button><button className={`rounded-lg px-4 py-2 text-xs font-bold ${interval === "year" ? "bg-white text-[#173f54] shadow-sm" : "text-[#66808e]"}`} onClick={() => setInterval("year")}>سنوي · وفر 20%</button></div></div>
        <div className="grid gap-4 lg:grid-cols-3">{plans.map((plan) => <article key={plan.key} className={`surface relative flex flex-col p-6 ${plan.key === "growth" ? "border-[#78aeba] shadow-[0_18px_45px_rgba(38,95,114,.12)]" : ""}`}>{plan.key === "growth" && <span className="absolute -top-3 right-5 rounded-full bg-[#2d7188] px-3 py-1 text-[10px] font-bold text-white">الأكثر اختيارًا</span>}<p className="text-xs font-bold text-[#64808e]">{plan.description}</p><h3 className="mt-2 text-xl font-extrabold text-[#15364b]">{plan.name}</h3><div className="mt-5 flex items-end gap-2"><strong className="text-4xl font-extrabold text-[#15364b]">${interval === "year" ? plan.yearly : plan.monthly}</strong><span className="pb-1 text-xs text-[#7a909b]">/ شهريًا</span></div><div className="my-6 flex flex-col gap-3">{plan.features.map((feature) => <p key={feature} className="flex items-center gap-2 text-sm text-[#4e6977]"><span className="grid size-5 place-items-center rounded-full bg-[#e0eff1] text-[#347b98]"><Check size={12} /></span>{feature}</p>)}</div><button className="primary-button mt-auto w-full justify-center disabled:opacity-60" disabled={!query.data?.canManage || pending === plan.key} onClick={() => checkout(plan.key)}>{pending === plan.key ? <Loader2 className="animate-spin" size={17} /> : <CreditCard size={17} />} اختيار {plan.name}</button></article>)}</div>
      </section>

      <section className="surface p-6"><div className="mb-5 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#e6f0f2] text-[#397b91]"><FileText size={18} /></span><div><h2 className="font-bold text-[#173f54]">سجل المدفوعات</h2><p className="text-xs text-[#8497a0]">المعاملات الخاصة بهذه العيادة فقط</p></div></div>{query.data?.transactions.length ? <div className="flex flex-col divide-y divide-[#edf1f3]">{query.data.transactions.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 py-4 text-sm"><div><p className="font-bold text-[#28495b]">{item.status === "completed" ? "دفعة مكتملة" : item.status}</p><p className="mt-1 text-xs text-[#8a9ba4]">{formatDate(item.billed_at)}</p></div><strong className="text-[#173f54]">{item.total ? `$${(Number(item.total) / 100).toFixed(2)}` : "—"}</strong></div>)}</div> : <p className="py-8 text-center text-sm text-[#8497a0]">لا توجد مدفوعات مسجلة بعد.</p>}</section>
    </div>
  </main>;
}
