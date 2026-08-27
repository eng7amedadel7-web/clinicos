import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Activity, ArrowLeft, ArrowRight, BarChart3, Building2, CalendarDays, CheckCircle2,
  ChevronRight, CircleDollarSign, Clock3, FileText, Headphones, Languages, Phone,
  PhoneCall, RefreshCw, Settings2, ShieldCheck, Sparkles, Users, Volume2,
} from "lucide-react";
import {
  getVoiceAgentData,
  getVoiceAgentSnapshot,
  getVoiceBilling,
  getVoiceBookingsPage,
  getVoiceCallsPage,
  getVoiceClinic,
  getVoiceKnowledgeSources,
  getVoicePerformance,
  getVoicePhoneChannels,
  getVoiceSettings,
  getVoiceUsage,
  getVoiceOverview,
  type VoiceAgentCall,
  type VoiceApiRecord,
} from "@/lib/operations-api";

const clinicTimeZone = "Asia/Riyadh";
type VoiceView = "overview" | "calls" | "bookings" | "clinic" | "agent" | "knowledge" | "phone" | "performance" | "usage" | "billing" | "settings";
type Json = Record<string, unknown>;

const views: Array<{ id: VoiceView; label: string; icon: typeof Volume2 }> = [
  { id: "overview", label: "النظرة العامة", icon: Volume2 },
  { id: "calls", label: "المكالمات", icon: PhoneCall },
  { id: "bookings", label: "الحجوزات", icon: CalendarDays },
  { id: "clinic", label: "بيانات العيادة", icon: Building2 },
  { id: "agent", label: "إعداد الوكيل", icon: Settings2 },
  { id: "knowledge", label: "قاعدة المعرفة", icon: FileText },
  { id: "phone", label: "الهاتف", icon: Phone },
  { id: "performance", label: "الأداء", icon: BarChart3 },
  { id: "usage", label: "الاستخدام", icon: Clock3 },
  { id: "billing", label: "الخطة والفوترة", icon: CircleDollarSign },
  { id: "settings", label: "الإعدادات", icon: Settings2 },
];

function record(value: unknown): Json { return value && typeof value === "object" && !Array.isArray(value) ? value as Json : {}; }
function array(value: unknown): Json[] { return Array.isArray(value) ? value.filter((item): item is Json => Boolean(item && typeof item === "object" && !Array.isArray(item))) : []; }
function text(value: unknown, fallback = "—") { return typeof value === "string" && value.trim() ? value : fallback; }
function number(value: unknown, fallback = 0) { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
function bool(value: unknown) { return value === true; }
function dateTime(value: unknown) { if (typeof value !== "string" || !value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short", timeZone: clinicTimeZone }).format(date); }
function duration(seconds: unknown) { const value = number(seconds, -1); if (value < 0) return "—"; return `${Math.floor(value / 60)}:${String(Math.round(value % 60)).padStart(2, "0")}`; }
function statusLabel(value: unknown) { return ({ completed: "مكتملة", queued: "في الانتظار", ringing: "يرن الآن", in_progress: "جارية", missed: "لم يتم الرد", failed: "فشلت", cancelled: "ملغاة", confirmed: "مؤكد", scheduled: "مجدول", no_show: "لم يحضر", cancelled_booking: "ملغى" } as Record<string, string>)[text(value, "unknown")] || text(value); }
function statusTone(value: unknown) { const state = text(value, "").toLowerCase(); return state === "completed" || state === "confirmed" || state === "ready" || state === "active" ? "voice-agent-status-success" : ["failed", "missed", "cancelled", "no_show", "rejected"].some((item) => state.includes(item)) ? "voice-agent-status-danger" : "voice-agent-status-warning"; }
function initials(value: unknown) { const name = text(value, "VA"); return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function viewFromLocation(path: string): VoiceView { const value = path.split("/").filter(Boolean)[1] as VoiceView | undefined; return views.some((item) => item.id === value) ? value! : "overview"; }

function PageHeader({ view, onRefresh, fetching }: { view: VoiceView; onRefresh: () => void; fetching: boolean }) {
  const title = views.find((item) => item.id === view)?.label || "الوكيل الصوتي";
  return <header className="voice-agent-heading"><div><div className="voice-agent-eyebrow"><span className="voice-agent-eyebrow-dot" /> MERUNA VOICE <span className="voice-agent-live-pill">LIVE DATA</span></div><h1>{title}</h1><p>{view === "overview" ? "مساحة تشغيل متكاملة للوكيل الصوتي ومكالمات العيادة." : "بيانات حية مقيدة بسياق العيادة الحالية وصلاحيات الحساب."}</p></div><button onClick={onRefresh} disabled={fetching} className="quiet-button"><RefreshCw size={15} className={fetching ? "animate-spin" : ""} /> تحديث البيانات</button></header>;
}

function VoiceNavigation({ active, onNavigate }: { active: VoiceView; onNavigate: (view: VoiceView) => void }) {
  return <nav className="mb-5 flex gap-2 overflow-x-auto border-b border-[#dfe9ed] pb-3" aria-label="صفحات Voice Agent">{views.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => onNavigate(id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${active === id ? "bg-[#173f61] text-white shadow-sm" : "bg-white text-[#587785] hover:bg-[#edf6f7]"}`}><Icon size={14} />{label}</button>)}</nav>;
}

function LoadingState() { return <div className="voice-agent-loading"><span /><span /><span /><span /></div>; }
function ErrorState({ onRetry }: { onRetry: () => void }) { return <div className="voice-agent-error"><AlertTriangleIcon /><strong>تعذر تحميل بيانات Voice</strong><p>تحقق من جلسة العيادة واتصال الخدمة ثم حاول مرة أخرى.</p><button className="primary-button" onClick={onRetry}><RefreshCw size={15} /> إعادة المحاولة</button></div>; }
function AlertTriangleIcon() { return <Activity size={25} className="text-[#c75b54]" />; }

function Card({ title, subtitle, icon: Icon, children, className = "" }: { title: string; subtitle?: string; icon?: typeof Volume2; children: React.ReactNode; className?: string }) {
  return <section className={`voice-agent-panel ${className}`}><div className="voice-agent-section-heading"><div><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div>{Icon ? <Icon size={18} /> : null}</div>{children}</section>;
}

function MetricCard({ label, value, helper, icon: Icon, tone }: { label: string; value: string; helper: string; icon: typeof Phone; tone: "blue" | "mint" | "violet" | "amber" }) {
  return <article className={`voice-agent-metric voice-agent-metric-${tone}`}><span className="voice-agent-metric-rule" /><span className="voice-agent-metric-icon"><Icon size={17} /></span><div><span>{label}</span><strong>{value}</strong><small>{helper}</small></div><span className="voice-agent-metric-pulse" /></article>;
}

function LiveConsole({ dashboard }: { dashboard: Json }) {
  const readiness = record(dashboard.readiness);
  const active = bool(readiness.agent) || text(record(dashboard.agent).status, "").toLowerCase() === "active";
  return <section className="voice-agent-live-console"><div className="voice-agent-live-core"><span className={`voice-agent-live-icon ${active ? "is-active" : ""}`}><PhoneCall size={21} /></span><div><small>الحالة التشغيلية الحالية</small><h2>{text(record(dashboard.clinic).name, "MERUNA Voice Agent")}</h2><p>{active ? "إعداد الوكيل نشط للعيادة الحالية" : "الإعداد محفوظ؛ الجاهزية تحتاج مراجعة"}</p></div></div><div className="voice-agent-wave" aria-hidden="true">{[8, 18, 12, 26, 15, 31, 19, 11, 24, 14, 28].map((height, index) => <i key={index} style={{ height }} />)}</div><span className={`voice-agent-state ${active ? "is-active" : ""}`}><i />{active ? "نشط" : "تحت المراجعة"}</span></section>;
}

function HealthRail({ dashboard }: { dashboard: Json }) {
  const readiness = record(dashboard.readiness);
  const knowledge = record(dashboard.knowledge);
  const items = [{ label: "الوكيل الصوتي", value: bool(readiness.agent) ? "نشط" : "يحتاج مراجعة", icon: ShieldCheck }, { label: "قناة الهاتف", value: bool(readiness.phone) ? "متصلة" : "غير مؤكدة", icon: Phone }, { label: "قاعدة المعرفة", value: number(knowledge.ready) > 0 ? `${number(knowledge.ready)} مصدر جاهز` : "لا توجد مصادر جاهزة", icon: FileText }];
  return <section className="voice-agent-health-rail" aria-label="حالة خدمات الوكيل">{items.map(({ label, value, icon: Icon }, index) => <div className="voice-agent-health-item" key={label}><span className={`voice-agent-health-icon ${index === 0 ? "voice-agent-health-connected" : index === 1 ? "voice-agent-health-ready" : "voice-agent-health-live"}`}><Icon size={14} /></span><div><small>{label}</small><strong>{value}</strong><p>من إسقاط Supabase المقيد</p></div></div>)}</section>;
}

function OverviewView({ data, onNavigate }: { data: VoiceApiRecord; onNavigate: (view: VoiceView) => void }) {
  const dashboard = record(data.dashboard); const metrics = record(dashboard.metrics); const calls = array(dashboard.recent_calls || dashboard.calls); const readiness = record(dashboard.readiness);
  return <><LiveConsole dashboard={dashboard} /><HealthRail dashboard={dashboard} /><section className="voice-agent-metric-grid"><MetricCard label="مكالمات اليوم" value={String(number(metrics.calls_today))} helper="من الإسقاط الحي" icon={Phone} tone="blue" /><MetricCard label="حجوزات اليوم" value={String(number(metrics.voice_bookings_created_today))} helper="أنشأها Voice" icon={CalendarDays} tone="mint" /><MetricCard label="مكالمات جارية" value={String(number(metrics.active_calls))} helper="الحالة الحالية" icon={Activity} tone="violet" /><MetricCard label="معرفة معتمدة" value={String(number(record(dashboard.knowledge).ready))} helper="متاحة للوكيل" icon={FileText} tone="amber" /></section><section className="voice-agent-main-grid"><div className="voice-agent-main-column"><Card title="نبض التشغيل" subtitle="حالة المكالمات والحجوزات من آخر إسقاط" icon={Activity}><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-[#edf7f8] p-4"><small>الحالة</small><strong className="mt-2 block text-base text-[#173f61]">{bool(readiness.agent) ? "جاهز" : "تحتاج مراجعة"}</strong></div><div className="rounded-xl bg-[#f1f5fb] p-4"><small>آخر تحديث</small><strong className="mt-2 block text-sm text-[#173f61]">{text(dashboard.as_of, "تم التحقق بواسطة MERUNA")}</strong></div><div className="rounded-xl bg-[#f8f1eb] p-4"><small>النطاق</small><strong className="mt-2 block text-sm text-[#173f61]">العيادة الحالية فقط</strong></div></div><div className="mt-4 flex flex-wrap gap-2"><button className="primary-button" onClick={() => onNavigate("calls")}><PhoneCall size={15} /> سجل المكالمات</button><button className="quiet-button" onClick={() => onNavigate("bookings")}><CalendarDays size={15} /> الحجوزات</button><button className="quiet-button" onClick={() => onNavigate("knowledge")}><ShieldCheck size={15} /> المعرفة</button></div></Card><RecentCalls calls={calls} onNavigate={onNavigate} /></div><aside className="voice-agent-side-column"><Card title="نطاق العيادة" subtitle="المصدر: Supabase projection" icon={Building2}><strong className="block text-lg text-[#173f61]">{text(record(dashboard.clinic).name, "سياق العيادة غير متاح")}</strong><p className="mt-2 text-xs text-[#718591]">{text(record(dashboard.clinic).organization_name, "MERUNA")} · {text(record(dashboard.clinic).timezone, "UTC")}</p><button className="quiet-button mt-4" onClick={() => onNavigate("clinic")}>تفاصيل العيادة <ArrowLeft size={14} /></button></Card><Card title="إجراءات سريعة" subtitle="صفحات مرتبطة بعقود حقيقية" icon={Sparkles}><div className="flex flex-col gap-2"><QuickLink label="إعداد الوكيل" onClick={() => onNavigate("agent")} icon={Settings2} /><QuickLink label="الهاتف والاتصال" onClick={() => onNavigate("phone")} icon={Phone} /><QuickLink label="الأداء والاستخدام" onClick={() => onNavigate("performance")} icon={BarChart3} /></div></Card></aside></section></>;
}

function QuickLink({ label, onClick, icon: Icon }: { label: string; onClick: () => void; icon: typeof Phone }) { return <button onClick={onClick} className="flex items-center justify-between rounded-xl border border-[#e1eaed] bg-[#fbfdfd] px-3 py-3 text-right text-xs font-bold text-[#41677a] hover:bg-[#edf6f7]"><span className="flex items-center gap-2"><Icon size={15} />{label}</span><ChevronRight size={14} /></button>; }

function RecentCalls({ calls, onNavigate }: { calls: Json[]; onNavigate: (view: VoiceView) => void }) {
  return <Card title="المكالمات الأخيرة" subtitle="سجل محصور في العيادة الحالية" icon={PhoneCall}><div className="voice-agent-call-list">{calls.slice(0, 8).map((call, index) => <div className="voice-agent-call-row" key={text(call.id, `call-${index}`)}><span className={`voice-agent-call-avatar ${statusTone(call.call_status)}`}>{initials(call.patient_reference || call.patientName)}</span><div className="voice-agent-call-copy"><strong>{text(call.patient_reference || call.patientName, "مكالمة غير مرتبطة بملف مريض")}</strong><small>{text(call.direction, "inbound")} · {dateTime(call.started_at || call.created_at)}</small></div><span className="voice-agent-call-duration">{duration(call.duration_seconds)}</span><span className={`voice-agent-status ${statusTone(call.call_status)}`}>{statusLabel(call.call_status)}</span><ArrowRight size={15} /></div>)}{!calls.length ? <div className="voice-agent-empty"><PhoneCall size={27} /><strong>لا توجد مكالمات مسجلة</strong><span>ستظهر المكالمات عند تسجيلها من مزود الصوت.</span></div> : null}</div><button className="quiet-button mt-4" onClick={() => onNavigate("calls")}>عرض سجل المكالمات <ArrowLeft size={14} /></button></Card>;
}

function ListView({ kind, onNavigate }: { kind: "calls" | "bookings"; onNavigate: (view: VoiceView) => void }) {
  const query = useQuery({ queryKey: ["voice", kind], queryFn: ({ signal }) => kind === "calls" ? getVoiceCallsPage({ range: "30d", limit: 100 }, signal) : getVoiceBookingsPage({ range: "30d", limit: 100 }, signal), staleTime: 15_000 });
  const items = array(record(query.data).items);
  return <Card title={kind === "calls" ? "سجل المكالمات" : "الحجوزات الصوتية"} subtitle={kind === "calls" ? "Projection حقيقي مع pagination من Supabase RPC" : "حجوزات Voice المرتبطة بعقود الإسقاط"} icon={kind === "calls" ? PhoneCall : CalendarDays}><div className="mb-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-[#edf6f7] px-3 py-2 font-bold text-[#3c7c8e]">{items.length} سجل محمّل</span><span className="rounded-full bg-[#f3f6fb] px-3 py-2 font-bold text-[#5e6f94]">النطاق: 30 يومًا</span></div>{query.isLoading ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-right text-xs"><thead><tr className="border-b border-[#e3ebee] text-[#78909c]"><th className="px-3 py-3">السجل</th><th className="px-3 py-3">الحالة</th><th className="px-3 py-3">النية/المصدر</th><th className="px-3 py-3">الفرع</th><th className="px-3 py-3">التاريخ</th></tr></thead><tbody>{items.map((item, index) => <tr className="border-b border-[#edf2f3]" key={text(item.id, `${kind}-${index}`)}><td className="px-3 py-4 font-bold text-[#244b60]">{text(item.patient_reference || item.patientName || item.id, "سجل غير مسمى")}</td><td className="px-3 py-4"><span className={`voice-agent-status ${statusTone(item.appointment_status || item.call_status)}`}>{statusLabel(item.appointment_status || item.call_status)}</span></td><td className="px-3 py-4 text-[#718591]">{text(item.intent || item.booking_source, "—")}</td><td className="px-3 py-4 text-[#718591]">{text(item.branch_name, "—")}</td><td className="px-3 py-4 text-[#718591]">{dateTime(item.cursor_at || item.scheduled_at || item.created_at)}</td></tr>)}</tbody></table>{!items.length ? <div className="voice-agent-empty"><FileText size={27} /><strong>لا توجد سجلات</strong><span>ستظهر البيانات هنا عندما تتوفر سجلات حقيقية للعيادة.</span></div> : null}</div>}<button className="quiet-button mt-5" onClick={() => onNavigate("overview")}><ArrowRight size={14} /> العودة للنظرة العامة</button></Card>;
}

function DetailView({ kind }: { kind: "clinic" | "agent" | "knowledge" | "phone" | "performance" | "usage" | "billing" | "settings" }) {
  const query = useQuery({ queryKey: ["voice", kind], queryFn: ({ signal }) => kind === "clinic" ? getVoiceClinic(signal) : kind === "agent" ? getVoiceAgentSnapshot(signal) : kind === "knowledge" ? getVoiceKnowledgeSources(signal) : kind === "phone" ? getVoicePhoneChannels(signal) : kind === "performance" ? getVoicePerformance({ range: "7d" }, signal) : kind === "usage" ? getVoiceUsage(signal) : kind === "billing" ? getVoiceBilling(signal) : getVoiceSettings(signal), staleTime: 15_000 });
  const data = record(query.data);
  const config = record(data.snapshot || data.settings || data.dashboard);
  const page = views.find((item) => item.id === kind)!;
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  if (kind === "knowledge") return <KnowledgeView data={data} />;
  if (kind === "phone") return <PhoneView data={data} />;
  if (kind === "performance") return <PerformanceView data={data} />;
  if (kind === "usage") return <UsageView data={data} />;
  if (kind === "billing") return <BillingView data={data} />;
  return <Card title={page.label} subtitle="بيانات حقيقية من عقد MERUNA المقيد بالعيادة" icon={page.icon}><div className="grid gap-4 md:grid-cols-2">{Object.entries(config).filter(([key]) => !["metadata", "configuration"].includes(key)).slice(0, 12).map(([key, value]) => <DataField key={key} label={key.replaceAll("_", " ")} value={typeof value === "object" ? JSON.stringify(value) : text(value)} />)}</div><div className="mt-5 rounded-xl bg-[#edf6f7] p-4 text-xs leading-6 text-[#557987]">لا يتم عرض أي بيانات بديلة عند غياب سياق العيادة. جميع القراءات تمر عبر جلسة MERUNA الحالية.</div></Card>;
}

function DataField({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-[#e4edef] bg-[#fbfdfd] p-4"><small className="block uppercase tracking-[.12em] text-[#8499a3]">{label}</small><strong className="mt-2 block break-words text-sm text-[#244b60]">{value}</strong></div>; }
function KnowledgeView({ data }: { data: Json }) { const items = array(data.items); return <Card title="قاعدة المعرفة" subtitle="مصادر العيادة وحالات الاعتماد والمعالجة" icon={FileText}><div className="grid gap-3 md:grid-cols-2">{items.map((item, index) => <article className="rounded-xl border border-[#e4edef] p-4" key={text(item.id, `knowledge-${index}`)}><div className="flex items-start justify-between gap-3"><div><strong className="text-sm text-[#244b60]">{text(item.title, "مصدر معرفة")}</strong><p className="mt-2 text-xs text-[#718591]">{text(item.source_kind, "document")} · {dateTime(item.updated_at)}</p></div><span className={`voice-agent-status ${statusTone(item.approval_status || item.processing_status)}`}>{statusLabel(item.approval_status || item.processing_status)}</span></div></article>)}</div>{!items.length ? <div className="voice-agent-empty"><FileText size={27} /><strong>لا توجد مصادر معرفة</strong><span>لا يتم إنشاء مصادر بديلة.</span></div> : null}</Card>; }
function PhoneView({ data }: { data: Json }) { const channels = array(data.channels); return <Card title="الهاتف وقناة الصوت" subtitle="حالة القناة من جدول channels وعقد المزود" icon={Phone}><div className="grid gap-3 md:grid-cols-2">{channels.map((channel, index) => <DataField key={text(channel.id, `channel-${index}`)} label={text(channel.provider, "Voice channel")} value={`${statusLabel(channel.status)} · ${bool(channel.is_enabled) ? "مفعّلة" : "غير مفعّلة"} · ${text(channel.phone_number_id, "رقم غير معروض")}`} />)}</div>{!channels.length ? <div className="voice-agent-empty"><Phone size={27} /><strong>لا توجد قناة صوت مرتبطة</strong><span>تجهيز المزود يتم عبر مسار معتمد، وليس من خلال بيانات وهمية.</span></div> : null}</Card>; }
function PerformanceView({ data }: { data: Json }) { const projection = record(data.performance || data); const summary = record(projection.summary); return <Card title="أداء الوكيل" subtitle="تحليل server-side من get_voice_performance_projection" icon={BarChart3}><section className="voice-agent-analysis-summary"><div><strong>{number(summary.total_calls)}</strong><span>إجمالي المكالمات</span></div><div><strong>{number(summary.transfers)}</strong><span>تحويلات</span></div><div><strong>{number(summary.appointments)}</strong><span>حجوزات</span></div><div><strong>{number(summary.handoff_rate)}%</strong><span>نسبة التحويل</span></div></section><div className="grid gap-3 md:grid-cols-2"><DataField label="حالة البيانات" value={text(projection.data_state, "unavailable")} /><DataField label="آخر تحديث" value={text(projection.as_of, "تم التحقق بواسطة MERUNA")} /></div></Card>; }
function UsageView({ data }: { data: Json }) { const usage = record(data.usage || data); const summary = record(usage.summary); return <Card title="استخدام Voice" subtitle="Projection مجمع؛ لا يتم إرسال raw usage events إلى المتصفح" icon={Clock3}><section className="voice-agent-analysis-summary"><div><strong>{number(summary.voice_minutes)}</strong><span>دقائق صوت</span></div><div><strong>{number(summary.event_count)}</strong><span>أحداث</span></div><div><strong>{number(summary.voice_call_units)}</strong><span>وحدات المكالمات</span></div><div><strong>{text(usage.data_state, "unavailable")}</strong><span>الحالة</span></div></section><div className="voice-agent-analysis-note"><ShieldCheck size={15} /> التفاصيل المجمعة فقط تظهر هنا وفق حدود الخصوصية وعقد الاستخدام.</div></Card>; }
function BillingView({ data }: { data: Json }) { const billing = record(data.billing || data); const subscription = record(billing.subscription); const plan = record(subscription.plan); return <Card title="الخطة والفوترة" subtitle="ملخص قراءة فقط؛ لا توجد أوامر دفع أو إلغاء داخل Voice" icon={CircleDollarSign}><div className="grid gap-3 md:grid-cols-2"><DataField label="حالة الاشتراك" value={text(subscription.status, "لا يوجد اشتراك ظاهر")} /><DataField label="الخطة" value={text(plan.name, "غير متاحة")} /><DataField label="حالة البيانات" value={text(billing.data_state, "unavailable")} /><DataField label="آخر تحديث" value={text(billing.as_of, "تم التحقق بواسطة MERUNA")} /></div><div className="voice-agent-managed-note"><ShieldCheck size={15} /><span>الدفع وتغيير الخطة والإلغاء محجوبة من هذه الصفحة ولا تُنفذ من الواجهة.</span></div></Card>; }

export default function LiveVoiceAgentPage() {
  const [location, setLocation] = useLocation();
  const view = viewFromLocation(location);
  const overviewQuery = useQuery({ queryKey: ["voice", "overview"], queryFn: ({ signal }) => getVoiceOverview(signal), staleTime: 15_000, refetchInterval: 60_000, refetchIntervalInBackground: false });
  const fallbackQuery = useQuery({ queryKey: ["operations", "voice-agent"], queryFn: ({ signal }) => getVoiceAgentData(signal), enabled: view === "overview" && overviewQuery.isError, staleTime: 15_000 });
  const navigate = (next: VoiceView) => setLocation(next === "overview" ? "/voice-agent" : `/voice-agent/${next}`);
  const refresh = () => { void overviewQuery.refetch(); if (fallbackQuery.isFetched) void fallbackQuery.refetch(); };
  const data = overviewQuery.data || (fallbackQuery.data ? { dashboard: { metrics: { calls_today: fallbackQuery.data.total }, recent_calls: fallbackQuery.data.calls, agent: fallbackQuery.data.configuration, settings: fallbackQuery.data.operationalSettings } } : undefined);
  const isFetching = overviewQuery.isFetching || fallbackQuery.isFetching;
  const content = view === "overview" ? (overviewQuery.isLoading && !data ? <LoadingState /> : overviewQuery.isError && !data ? <ErrorState onRetry={refresh} /> : <OverviewView data={data || {}} onNavigate={navigate} />) : view === "calls" || view === "bookings" ? <ListView kind={view} onNavigate={navigate} /> : <DetailView kind={view} />;
  return <main className="voice-agent-page mx-auto w-full max-w-[1440px]" dir="rtl"><PageHeader view={view} onRefresh={refresh} fetching={isFetching} /><VoiceNavigation active={view} onNavigate={navigate} />{content}</main>;
}
