import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Clock3, RefreshCw, Send, UsersRound, X } from "lucide-react";
import { getOperationsList, runOperationsAction, type OperationsItem } from "@/lib/operations-api";

function displayPatient(item: OperationsItem) {
  if (item.patientName) return item.patientName;
  const patient = item.patient;
  return patient?.name || [patient?.first_name, patient?.last_name].filter(Boolean).join(" ") || "مريض بدون اسم";
}

function dateLabel(value: unknown) {
  if (typeof value !== "string" || !value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

function statusLabel(value: unknown) {
  if (typeof value !== "string" || !value) return "غير محدد";
  const labels: Record<string, string> = { active: "نشطة", paused: "متوقفة مؤقتاً", fulfilled: "مكتملة", cancelled: "ملغاة", expired: "منتهية", open: "مفتوحة", closed: "مغلقة", pending: "قيد المتابعة" };
  return labels[value] ?? value;
}

function PageHeader({ eyebrow, title, description, onRefresh, isFetching }: { eyebrow: string; title: string; description: string; onRefresh: () => void; isFetching: boolean }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-1.5 text-[11px] font-bold text-[hsl(var(--primary))]">{eyebrow}</p><h1 className="text-[27px] font-extrabold tracking-tight md:text-[31px]">{title}</h1><p className="mt-1 text-[13px] text-[hsl(var(--muted-foreground))]">{description}</p></div><button onClick={onRefresh} disabled={isFetching} className="flex items-center justify-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2.5 text-[12px] font-bold"><RefreshCw size={15} className={isFetching ? "animate-spin" : ""} /> تحديث البيانات</button></div>;
}

function DataState({ isLoading, isError, error, retry, children }: { isLoading: boolean; isError: boolean; error: unknown; retry: () => void; children: React.ReactNode }) {
  if (isLoading) return <div className="surface flex min-h-[260px] items-center justify-center p-10 text-sm text-[hsl(var(--muted-foreground))]">جارٍ تحميل البيانات الحقيقية...</div>;
  if (isError) return <div className="surface flex min-h-[260px] flex-col items-center justify-center p-10 text-center"><AlertTriangle className="mb-3 text-[#a64036]" /><p className="text-sm font-bold">تعذر تحميل البيانات</p><p className="mt-2 max-w-md text-xs leading-6 text-[hsl(var(--muted-foreground))]">{error instanceof Error ? error.message : "حدث خطأ مؤقت."}</p><button className="primary-button mt-5" onClick={retry}><RefreshCw size={15} /> إعادة المحاولة</button></div>;
  return <>{children}</>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="surface flex min-h-[220px] flex-col items-center justify-center p-10 text-center"><UsersRound className="mb-3 text-[hsl(var(--muted-foreground)/.5)]" /><p className="text-sm font-bold text-[hsl(var(--muted-foreground))]">{text}</p></div>;
}

function ActionButton({ label, icon: Icon, disabled, onClick, tone = "default" }: { label: string; icon: typeof Send; disabled?: boolean; onClick: () => void; tone?: "default" | "danger" }) {
  return <button disabled={disabled} onClick={onClick} className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-bold transition disabled:opacity-50 ${tone === "danger" ? "border-[#e2b4b0] text-[#a64036] hover:bg-[#fff7f6]" : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"}`}><Icon size={13} /> {label}</button>;
}

export function WaitlistPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["operations", "waitlist"], queryFn: ({ signal }) => getOperationsList("waitlist", signal), staleTime: 15_000, refetchInterval: 60_000, refetchIntervalInBackground: false });
  const action = useMutation({ mutationFn: ({ id, operation }: { id: string; operation: "pause" | "cancel" }) => runOperationsAction(`/api/operations/waitlist/${encodeURIComponent(id)}/${operation}`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["operations", "waitlist"] }) });
  const items = query.data?.items ?? [];
  return <section className="mx-auto max-w-[1150px]"><PageHeader eyebrow="التشغيل / الفرص" title="قائمة الانتظار" description={query.data ? `${query.data.total} طلبات حقيقية مرتبطة بالعيادة` : "إدارة الطلبات النشطة من Supabase"} onRefresh={() => query.refetch()} isFetching={query.isFetching} /><DataState isLoading={query.isLoading} isError={query.isError} error={query.error} retry={() => query.refetch()}>{items.length ? <div className="space-y-3">{items.map((item) => <div key={String(item.id)} className="surface flex flex-wrap items-center gap-3 p-4"><span className="grid size-10 place-items-center rounded-full bg-[#fff0d8] text-xs font-bold text-[#9a6513]">{displayPatient(item).slice(0, 2)}</span><div className="min-w-[190px] flex-1"><strong className="block text-xs">{displayPatient(item)}</strong><span className="mt-1 block text-[10px] text-[hsl(var(--muted-foreground))]">{statusLabel(item.status)} · أولوية {typeof item.priority === "number" ? item.priority : "—"}</span></div><div className="text-[10px] text-[hsl(var(--muted-foreground))]"><Clock3 size={13} className="ml-1 inline" /> منذ {dateLabel(item.created_at)}</div><span className="rounded-md bg-[#dcecf5] px-2 py-1 text-[10px] font-bold text-[#22617d]">{statusLabel(item.status)}</span>{item.status === "active" ? <ActionButton label="إيقاف مؤقت" icon={Clock3} disabled={action.isPending} onClick={() => action.mutate({ id: String(item.id), operation: "pause" })} /> : null}<ActionButton label="إلغاء" icon={X} tone="danger" disabled={action.isPending} onClick={() => { if (window.confirm("هل تريد إلغاء طلب الانتظار؟")) action.mutate({ id: String(item.id), operation: "cancel" }); }} /></div>)}</div> : <EmptyState text="لا توجد طلبات انتظار نشطة في هذه العيادة." />}</DataState>{action.isError ? <p className="mt-3 text-xs font-bold text-[#a64036]">{action.error instanceof Error ? action.error.message : "تعذر حفظ الإجراء."}</p> : null}</section>;
}

export function FollowUpsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["operations", "follow-ups"], queryFn: ({ signal }) => getOperationsList("follow-ups", signal), staleTime: 15_000, refetchInterval: 60_000, refetchIntervalInBackground: false });
  const action = useMutation({ mutationFn: (id: string) => runOperationsAction(`/api/operations/follow-ups/${encodeURIComponent(id)}/decision`, { outcome: "completed_by_staff", stopFollowup: true, needsHandoff: false }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["operations", "follow-ups"] }) });
  const items = query.data?.items ?? [];
  return <section className="mx-auto max-w-[1150px]"><PageHeader eyebrow="التشغيل / follow-up" title="المتابعات" description={query.data ? `${query.data.total} حالات حقيقية تحتاج قرار الفريق` : "إدارة حالات المتابعة من Supabase"} onRefresh={() => query.refetch()} isFetching={query.isFetching} /><DataState isLoading={query.isLoading} isError={query.isError} error={query.error} retry={() => query.refetch()}>{items.length ? <div className="space-y-3">{items.map((item) => <div key={String(item.id)} className="surface flex flex-wrap items-center gap-3 p-4"><span className="grid size-10 place-items-center rounded-full bg-[#d9f0e8] text-xs font-bold text-[#176b58]">{displayPatient(item).slice(0, 2)}</span><div className="min-w-[190px] flex-1"><strong className="block text-xs">{displayPatient(item)}</strong><span className="mt-1 block text-[10px] text-[hsl(var(--muted-foreground))]">{statusLabel(item.status)} · {textValue(item.followup_goal)}</span></div><div className="text-[10px] text-[hsl(var(--muted-foreground))]"><Clock3 size={13} className="ml-1 inline" /> الاستحقاق {dateLabel(item.next_due_at)}</div><ActionButton label="تسجيل القرار" icon={Check} disabled={action.isPending} onClick={() => action.mutate(String(item.id))} /></div>)}</div> : <EmptyState text="لا توجد متابعات مفتوحة في هذه العيادة." />}</DataState>{action.isError ? <p className="mt-3 text-xs font-bold text-[#a64036]">{action.error instanceof Error ? action.error.message : "تعذر حفظ قرار المتابعة."}</p> : null}</section>;
}

export function NoShowsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["operations", "no-shows"], queryFn: ({ signal }) => getOperationsList("no-shows", signal), staleTime: 15_000, refetchInterval: 60_000, refetchIntervalInBackground: false });
  const action = useMutation({ mutationFn: ({ id, operation }: { id: string; operation: "classify" | "close" }) => runOperationsAction(`/api/operations/no-shows/${encodeURIComponent(id)}/${operation}`, operation === "close" ? { outcome: "closed_by_staff", reason: "تمت المراجعة من فريق العيادة" } : {}), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["operations", "no-shows"] }) });
  const items = query.data?.items ?? [];
  return <section className="mx-auto max-w-[1150px]"><PageHeader eyebrow="التشغيل / recovery" title="عدم الحضور" description={query.data ? `${query.data.total} حالات حقيقية تحتاج معالجة` : "إدارة حالات عدم الحضور من Supabase"} onRefresh={() => query.refetch()} isFetching={query.isFetching} /><DataState isLoading={query.isLoading} isError={query.isError} error={query.error} retry={() => query.refetch()}>{items.length ? <div className="space-y-3">{items.map((item) => <div key={String(item.id)} className="surface flex flex-wrap items-center gap-3 p-4"><span className="grid size-10 place-items-center rounded-full bg-[#f8dfdc] text-[#a64036]"><AlertTriangle size={17} /></span><div className="min-w-[190px] flex-1"><strong className="block text-xs">{displayPatient(item)}</strong><span className="mt-1 block text-[10px] text-[hsl(var(--muted-foreground))]">{statusLabel(item.case_status)} · مستوى الخطر {textValue(item.risk_level)}</span></div><div className="text-[10px] text-[hsl(var(--muted-foreground))]">آخر نشاط {dateLabel(item.last_activity_at)}</div><ActionButton label="تصنيف" icon={RefreshCw} disabled={action.isPending} onClick={() => action.mutate({ id: String(item.id), operation: "classify" })} /><ActionButton label="إغلاق الحالة" icon={Check} tone="danger" disabled={action.isPending} onClick={() => { if (window.confirm("هل تريد إغلاق حالة عدم الحضور؟")) action.mutate({ id: String(item.id), operation: "close" }); }} /></div>)}</div> : <EmptyState text="لا توجد حالات عدم حضور مفتوحة في هذه العيادة." />}</DataState>{action.isError ? <p className="mt-3 text-xs font-bold text-[#a64036]">{action.error instanceof Error ? action.error.message : "تعذر حفظ إجراء recovery."}</p> : null}</section>;
}

function textValue(value: unknown, fallback = "غير محدد") {
  return typeof value === "string" && value.trim() ? value : fallback;
}
