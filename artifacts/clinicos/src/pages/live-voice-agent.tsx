import { useMemo, useState } from "react";
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
import { usePreferences } from "@/lib/preferences";

const clinicTimeZone = "Asia/Riyadh";
type VoiceView = "overview" | "calls" | "bookings" | "clinic" | "agent" | "knowledge" | "phone" | "performance" | "usage" | "billing" | "settings";
type Json = Record<string, unknown>;

const viewLabelsAr: Record<VoiceView, string> = {
  overview: "النظرة العامة",
  calls: "المكالمات",
  bookings: "الحجوزات",
  clinic: "بيانات العيادة",
  agent: "إعداد الوكيل",
  knowledge: "قاعدة المعرفة",
  phone: "الهاتف",
  performance: "الأداء",
  usage: "الاستخدام",
  billing: "الخطة والفوترة",
  settings: "الإعدادات",
};

const viewLabelsEn: Record<VoiceView, string> = {
  overview: "Overview",
  calls: "Calls",
  bookings: "Bookings",
  clinic: "Clinic Data",
  agent: "Agent Setup",
  knowledge: "Knowledge Base",
  phone: "Phone",
  performance: "Performance",
  usage: "Usage",
  billing: "Plan & Billing",
  settings: "Settings",
};

const viewIcons: Record<VoiceView, typeof Volume2> = {
  overview: Volume2,
  calls: PhoneCall,
  bookings: CalendarDays,
  clinic: Building2,
  agent: Settings2,
  knowledge: FileText,
  phone: Phone,
  performance: BarChart3,
  usage: Clock3,
  billing: CircleDollarSign,
  settings: Settings2,
};

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
function statusLabel(value: unknown, en: boolean) {
  const key = text(value, "unknown");
  if (en) {
    return ({ completed: "Completed", queued: "Queued", ringing: "Ringing", in_progress: "In Progress", missed: "Missed", failed: "Failed", cancelled: "Cancelled", confirmed: "Confirmed", scheduled: "Scheduled", no_show: "No Show", cancelled_booking: "Cancelled" } as Record<string, string>)[key] || text(value);
  }
  return ({ completed: "مكتملة", queued: "في الانتظار", ringing: "يرن الآن", in_progress: "جارية", missed: "لم يتم الرد", failed: "فشلت", cancelled: "ملغاة", confirmed: "مؤكد", scheduled: "مجدول", no_show: "لم يحضر", cancelled_booking: "ملغى" } as Record<string, string>)[key] || text(value);
}
function statusTone(value: unknown) { const state = text(value, "").toLowerCase(); return state === "completed" || state === "confirmed" || state === "ready" || state === "active" ? "voice-agent-status-success" : ["failed", "missed", "cancelled", "no_show", "rejected"].some((item) => state.includes(item)) ? "voice-agent-status-danger" : "voice-agent-status-warning"; }
function initials(value: unknown) { const name = text(value, "VA"); return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function viewFromLocation(path: string): VoiceView { const value = path.split("/").filter(Boolean)[1] as VoiceView | undefined; return views.some((item) => item.id === value) ? value! : "overview"; }

function PageHeader({ view, onRefresh, fetching }: { view: VoiceView; onRefresh: () => void; fetching: boolean }) {
  const { language, theme } = usePreferences();
  const en = language === "en";
  const dark = theme === "dark";
  const title = en ? viewLabelsEn[view] : viewLabelsAr[view];
  const subtitle = view === "overview"
    ? (en ? "Unified operations workspace for the Voice Agent and clinic calls." : "مساحة تشغيل متكاملة للوكيل الصوتي ومكالمات العيادة.")
    : (en ? "Live data scoped to the current clinic context and account permissions." : "بيانات حية مقيدة بسياق العيادة الحالية وصلاحيات الحساب.");
  const style: React.CSSProperties = dark ? { "--ink": "#e2ecf1", "--paper": "#122434", "--line": "#1e3a4d", "--sub": "#7e939e" } as React.CSSProperties : {};
  return <header className="voice-agent-heading" style={style}><div><div className="voice-agent-eyebrow"><span className="voice-agent-eyebrow-dot" /> MERUNA VOICE <span className="voice-agent-live-pill">LIVE DATA</span></div><h1>{title}</h1><p>{subtitle}</p></div><button onClick={onRefresh} disabled={fetching} className="quiet-button"><RefreshCw size={15} className={fetching ? "animate-spin" : ""} /> {en ? "Refresh data" : "تحديث البيانات"}</button></header>;
}

function VoiceNavigation({ active, onNavigate }: { active: VoiceView; onNavigate: (view: VoiceView) => void }) {
  const { language, theme } = usePreferences();
  const en = language === "en";
  const dark = theme === "dark";
  return <nav className={`mb-5 flex gap-2 overflow-x-auto border-b pb-3 ${dark ? "border-[#1e3a4d]" : "border-[#dfe9ed]"}`} aria-label={en ? "Voice Agent pages" : "صفحات Voice Agent"}>{views.map(({ id, icon: Icon }) => {
    const label = en ? viewLabelsEn[id] : viewLabelsAr[id];
    return <button key={id} onClick={() => onNavigate(id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${active === id ? "bg-[#173f61] text-white shadow-sm" : dark ? "bg-[#122434] text-[#7e939e] hover:bg-[#1e3a4d]" : "bg-white text-[#587785] hover:bg-[#edf6f7]"}`}><Icon size={14} />{label}</button>;
  })}</nav>;
}

function LoadingState() { return <div className="voice-agent-loading"><span /><span /><span /><span /></div>; }
function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { language } = usePreferences();
  const en = language === "en";
  return <div className="voice-agent-error"><AlertTriangleIcon /><strong>{en ? "Unable to load Voice data" : "تعذر تحميل بيانات Voice"}</strong><p>{en ? "Check your clinic session and service connection, then try again." : "تحقق من جلسة العيادة واتصال الخدمة ثم حاول مرة أخرى."}</p><button className="primary-button" onClick={onRetry}><RefreshCw size={15} /> {en ? "Retry" : "إعادة المحاولة"}</button></div>;
}
function AlertTriangleIcon() { return <Activity size={25} className="text-[#c75b54]" />; }

function Card({ title, subtitle, icon: Icon, children, className = "" }: { title: string; subtitle?: string; icon?: typeof Volume2; children: React.ReactNode; className?: string }) {
  const { theme } = usePreferences();
  const dark = theme === "dark";
  const style: React.CSSProperties = dark ? { "--ink": "#e2ecf1", "--paper": "#122434", "--line": "#1e3a4d", "--sub": "#7e939e" } as React.CSSProperties : {};
  return <section className={`voice-agent-panel ${className}`} style={style}><div className="voice-agent-section-heading"><div><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div>{Icon ? <Icon size={18} /> : null}</div>{children}</section>;
}

function MetricCard({ label, value, helper, icon: Icon, tone }: { label: string; value: string; helper: string; icon: typeof Phone; tone: "blue" | "mint" | "violet" | "amber" }) {
  const { theme } = usePreferences();
  const dark = theme === "dark";
  const style: React.CSSProperties = dark ? { "--ink": "#e2ecf1", "--paper": "#122434", "--line": "#1e3a4d", "--sub": "#7e939e" } as React.CSSProperties : {};
  return <article className={`voice-agent-metric voice-agent-metric-${tone}`} style={style}><span className="voice-agent-metric-rule" /><span className="voice-agent-metric-icon"><Icon size={17} /></span><div><span>{label}</span><strong>{value}</strong><small>{helper}</small></div><span className="voice-agent-metric-pulse" /></article>;
}

function LiveConsole({ dashboard }: { dashboard: Json }) {
  const { language, theme } = usePreferences();
  const en = language === "en";
  const dark = theme === "dark";
  const readiness = record(dashboard.readiness);
  const active = bool(readiness.agent) || text(record(dashboard.agent).status, "").toLowerCase() === "active";
  const style: React.CSSProperties = dark ? { "--ink": "#e2ecf1", "--paper": "#122434", "--line": "#1e3a4d", "--sub": "#7e939e" } as React.CSSProperties : {};
  return <section className="voice-agent-live-console" style={style}><div className="voice-agent-live-core"><span className={`voice-agent-live-icon ${active ? "is-active" : ""}`}><PhoneCall size={21} /></span><div><small>{en ? "Current operational status" : "الحالة التشغيلية الحالية"}</small><h2>{text(record(dashboard.clinic).name, "MERUNA Voice Agent")}</h2><p>{active ? (en ? "Agent setup is active for the current clinic" : "إعداد الوكيل نشط للعيادة الحالية") : (en ? "Setup saved; readiness needs review" : "الإعداد محفوظ؛ الجاهزية تحتاج مراجعة")}</p></div></div><div className="voice-agent-wave" aria-hidden="true">{[8, 18, 12, 26, 15, 31, 19, 11, 24, 14, 28].map((height, index) => <i key={index} style={{ height }} />)}</div><span className={`voice-agent-state ${active ? "is-active" : ""}`}><i />{active ? (en ? "Active" : "نشط") : (en ? "Under Review" : "تحت المراجعة")}</span></section>;
}

function HealthRail({ dashboard }: { dashboard: Json }) {
  const { language, theme } = usePreferences();
  const en = language === "en";
  const dark = theme === "dark";
  const readiness = record(dashboard.readiness);
  const knowledge = record(dashboard.knowledge);
  const items = en
    ? [{ label: "Voice Agent", value: bool(readiness.agent) ? "Active" : "Needs Review", icon: ShieldCheck }, { label: "Phone Channel", value: bool(readiness.phone) ? "Connected" : "Unconfirmed", icon: Phone }, { label: "Knowledge Base", value: number(knowledge.ready) > 0 ? `${number(knowledge.ready)} sources ready` : "No ready sources", icon: FileText }]
    : [{ label: "الوكيل الصوتي", value: bool(readiness.agent) ? "نشط" : "يحتاج مراجعة", icon: ShieldCheck }, { label: "قناة الهاتف", value: bool(readiness.phone) ? "متصلة" : "غير مؤكدة", icon: Phone }, { label: "قاعدة المعرفة", value: number(knowledge.ready) > 0 ? `${number(knowledge.ready)} مصدر جاهز` : "لا توجد مصادر جاهزة", icon: FileText }];
  const style: React.CSSProperties = dark ? { "--ink": "#e2ecf1", "--paper": "#122434", "--line": "#1e3a4d", "--sub": "#7e939e" } as React.CSSProperties : {};
  return <section className="voice-agent-health-rail" aria-label={en ? "Agent service status" : "حالة خدمات الوكيل"} style={style}>{items.map(({ label, value, icon: Icon }, index) => <div className="voice-agent-health-item" key={label}><span className={`voice-agent-health-icon ${index === 0 ? "voice-agent-health-connected" : index === 1 ? "voice-agent-health-ready" : "voice-agent-health-live"}`}><Icon size={14} /></span><div><small>{label}</small><strong>{value}</strong><p>{en ? "From scoped Supabase projection" : "من إسقاط Supabase المقيد"}</p></div></div>)}</section>;
}

function OverviewView({ data, onNavigate }: { data: VoiceApiRecord; onNavigate: (view: VoiceView) => void }) {
  const { language, theme } = usePreferences();
  const en = language === "en";
  const dark = theme === "dark";
  const dashboard = record(data.dashboard); const metrics = record(dashboard.metrics); const calls = array(dashboard.recent_calls || dashboard.calls); const readiness = record(dashboard.readiness);
  return <><LiveConsole dashboard={dashboard} /><HealthRail dashboard={dashboard} /><section className="voice-agent-metric-grid"><MetricCard label={en ? "Today's Calls" : "مكالمات اليوم"} value={String(number(metrics.calls_today))} helper={en ? "From live projection" : "من الإسقاط الحي"} icon={Phone} tone="blue" /><MetricCard label={en ? "Today's Bookings" : "حجوزات اليوم"} value={String(number(metrics.voice_bookings_created_today))} helper={en ? "Created by Voice" : "أنشأها Voice"} icon={CalendarDays} tone="mint" /><MetricCard label={en ? "Active Calls" : "مكالمات جارية"} value={String(number(metrics.active_calls))} helper={en ? "Current status" : "الحالة الحالية"} icon={Activity} tone="violet" /><MetricCard label={en ? "Approved Knowledge" : "معرفة معتمدة"} value={String(number(record(dashboard.knowledge).ready))} helper={en ? "Available to agent" : "متاحة للوكيل"} icon={FileText} tone="amber" /></section><section className="voice-agent-main-grid"><div className="voice-agent-main-column"><Card title={en ? "Operations Pulse" : "نبض التشغيل"} subtitle={en ? "Call and booking status from latest projection" : "حالة المكالمات والحجوزات من آخر إسقاط"} icon={Activity}><div className="grid gap-3 sm:grid-cols-3"><div className={`rounded-xl p-4 ${dark ? "bg-[#123528]" : "bg-[#edf7f8]"}`}><small>{en ? "Status" : "الحالة"}</small><strong className={`mt-2 block text-base ${dark ? "text-[#7fd0b4]" : "text-[#173f61]"}`}>{bool(readiness.agent) ? (en ? "Ready" : "جاهز") : (en ? "Needs Review" : "تحتاج مراجعة")}</strong></div><div className={`rounded-xl p-4 ${dark ? "bg-[#143242]" : "bg-[#f1f5fb]"}`}><small>{en ? "Last Updated" : "آخر تحديث"}</small><strong className={`mt-2 block text-sm ${dark ? "text-[#8cc3dd]" : "text-[#173f61]"}`}>{text(dashboard.as_of, "Verified by MERUNA")}</strong></div><div className={`rounded-xl p-4 ${dark ? "bg-[#3a2c14]" : "bg-[#f8f1eb]"}`}><small>{en ? "Scope" : "النطاق"}</small><strong className={`mt-2 block text-sm ${dark ? "text-[#e0b46a]" : "text-[#173f61]"}`}>{en ? "Current clinic only" : "العيادة الحالية فقط"}</strong></div></div><div className="mt-4 flex flex-wrap gap-2"><button className="primary-button" onClick={() => onNavigate("calls")}><PhoneCall size={15} /> {en ? "Call Log" : "سجل المكالمات"}</button><button className="quiet-button" onClick={() => onNavigate("bookings")}><CalendarDays size={15} /> {en ? "Bookings" : "الحجوزات"}</button><button className="quiet-button" onClick={() => onNavigate("knowledge")}><ShieldCheck size={15} /> {en ? "Knowledge" : "المعرفة"}</button></div></Card><RecentCalls calls={calls} onNavigate={onNavigate} /></div><aside className="voice-agent-side-column"><Card title={en ? "Clinic Scope" : "نطاق العيادة"} subtitle={en ? "Source: Supabase projection" : "المصدر: Supabase projection"} icon={Building2}><strong className={`block text-lg ${dark ? "text-[#e2ecf1]" : "text-[#173f61]"}`}>{text(record(dashboard.clinic).name, en ? "Clinic context unavailable" : "سياق العيادة غير متاح")}</strong><p className={`mt-2 text-xs ${dark ? "text-[#7e939e]" : "text-[#718591]"}`}>{text(record(dashboard.clinic).organization_name, "MERUNA")} · {text(record(dashboard.clinic).timezone, "UTC")}</p><button className="quiet-button mt-4" onClick={() => onNavigate("clinic")}>{en ? "Clinic Details" : "تفاصيل العيادة"} <ArrowLeft size={14} /></button></Card><Card title={en ? "Quick Actions" : "إجراءات سريعة"} subtitle={en ? "Pages linked to real contracts" : "صفحات مرتبطة بعقود حقيقية"} icon={Sparkles}><div className="flex flex-col gap-2"><QuickLink label={en ? "Agent Setup" : "إعداد الوكيل"} onClick={() => onNavigate("agent")} icon={Settings2} /><QuickLink label={en ? "Phone & Calling" : "الهاتف والاتصال"} onClick={() => onNavigate("phone")} icon={Phone} /><QuickLink label={en ? "Performance & Usage" : "الأداء والاستخدام"} onClick={() => onNavigate("performance")} icon={BarChart3} /></div></Card></aside></section></>;
}

function QuickLink({ label, onClick, icon: Icon }: { label: string; onClick: () => void; icon: typeof Phone }) {
  const { theme } = usePreferences();
  const dark = theme === "dark";
  return <button onClick={onClick} className={`flex items-center justify-between rounded-xl border px-3 py-3 text-right text-xs font-bold hover:bg-[#edf6f7] ${dark ? "border-[#1e3a4d] bg-[#122434] text-[#7e939e] hover:bg-[#1e3a4d]" : "border-[#e1eaed] bg-[#fbfdfd] text-[#41677a]"}`}><span className="flex items-center gap-2"><Icon size={15} />{label}</span><ChevronRight size={14} /></button>;
}

function RecentCalls({ calls, onNavigate }: { calls: Json[]; onNavigate: (view: VoiceView) => void }) {
  const { language } = usePreferences();
  const en = language === "en";
  return <Card title={en ? "Recent Calls" : "المكالمات الأخيرة"} subtitle={en ? "Log scoped to the current clinic" : "سجل محصور في العيادة الحالية"} icon={PhoneCall}><div className="voice-agent-call-list">{calls.slice(0, 8).map((call, index) => <div className="voice-agent-call-row" key={text(call.id, `call-${index}`)}><span className={`voice-agent-call-avatar ${statusTone(call.call_status)}`}>{initials(call.patient_reference || call.patientName)}</span><div className="voice-agent-call-copy"><strong>{text(call.patient_reference || call.patientName, en ? "Call not linked to a patient record" : "مكالمة غير مرتبطة بملف مريض")}</strong><small>{text(call.direction, "inbound")} · {dateTime(call.started_at || call.created_at)}</small></div><span className="voice-agent-call-duration">{duration(call.duration_seconds)}</span><span className={`voice-agent-status ${statusTone(call.call_status)}`}>{statusLabel(call.call_status, en)}</span><ArrowRight size={15} /></div>)}{!calls.length ? <div className="voice-agent-empty"><PhoneCall size={27} /><strong>{en ? "No recorded calls" : "لا توجد مكالمات مسجلة"}</strong><span>{en ? "Calls will appear once recorded by the voice provider." : "ستظهر المكالمات عند تسجيلها من مزود الصوت."}</span></div> : null}</div><button className="quiet-button mt-4" onClick={() => onNavigate("calls")}>{en ? "View Call Log" : "عرض سجل المكالمات"} <ArrowLeft size={14} /></button></Card>;
}

function ListView({ kind, onNavigate }: { kind: "calls" | "bookings"; onNavigate: (view: VoiceView) => void }) {
  const { language, theme } = usePreferences();
  const en = language === "en";
  const dark = theme === "dark";
  const query = useQuery({ queryKey: ["voice", kind], queryFn: ({ signal }) => kind === "calls" ? getVoiceCallsPage({ range: "30d", limit: 100 }, signal) : getVoiceBookingsPage({ range: "30d", limit: 100 }, signal), staleTime: 15_000 });
  const items = array(record(query.data).items);
  const title = kind === "calls" ? (en ? "Call Log" : "سجل المكالمات") : (en ? "Voice Bookings" : "الحجوزات الصوتية");
  const subtitle = kind === "calls" ? (en ? "Real projection with pagination from Supabase RPC" : "Projection حقيقي مع pagination من Supabase RPC") : (en ? "Voice bookings linked to projection contracts" : "حجوزات Voice المرتبطة بعقود الإسقاط");
  return <Card title={title} subtitle={subtitle} icon={kind === "calls" ? PhoneCall : CalendarDays}><div className="mb-4 flex flex-wrap gap-2 text-xs"><span className={`rounded-full px-3 py-2 font-bold ${dark ? "bg-[#143242] text-[#8cc3dd]" : "bg-[#edf6f7] text-[#3c7c8e]"}`}>{items.length} {en ? "records loaded" : "سجل محمّل"}</span><span className={`rounded-full px-3 py-2 font-bold ${dark ? "bg-[#143242] text-[#8cc3dd]" : "bg-[#f3f6fb] text-[#5e6f94]"}`}>{en ? "Range: 30 days" : "النطاق: 30 يومًا"}</span></div>{query.isLoading ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-right text-xs"><thead><tr className={`border-b ${dark ? "border-[#1e3a4d] text-[#7e939e]" : "border-[#e3ebee] text-[#78909c]"}`}><th className="px-3 py-3">{en ? "Record" : "السجل"}</th><th className="px-3 py-3">{en ? "Status" : "الحالة"}</th><th className="px-3 py-3">{en ? "Intent/Source" : "النية/المصدر"}</th><th className="px-3 py-3">{en ? "Branch" : "الفرع"}</th><th className="px-3 py-3">{en ? "Date" : "التاريخ"}</th></tr></thead><tbody>{items.map((item, index) => <tr className={`border-b ${dark ? "border-[#1e3a4d]" : "border-[#edf2f3]"}`} key={text(item.id, `${kind}-${index}`)}><td className={`px-3 py-4 font-bold ${dark ? "text-[#e2ecf1]" : "text-[#244b60]"}`}>{text(item.patient_reference || item.patientName || item.id, en ? "Unnamed record" : "سجل غير مسمى")}</td><td className="px-3 py-4"><span className={`voice-agent-status ${statusTone(item.appointment_status || item.call_status)}`}>{statusLabel(item.appointment_status || item.call_status, en)}</span></td><td className={`px-3 py-4 ${dark ? "text-[#7e939e]" : "text-[#718591]"}`}>{text(item.intent || item.booking_source, "—")}</td><td className={`px-3 py-4 ${dark ? "text-[#7e939e]" : "text-[#718591]"}`}>{text(item.branch_name, "—")}</td><td className={`px-3 py-4 ${dark ? "text-[#7e939e]" : "text-[#718591]"}`}>{dateTime(item.cursor_at || item.scheduled_at || item.created_at)}</td></tr>)}</tbody></table>{!items.length ? <div className="voice-agent-empty"><FileText size={27} /><strong>{en ? "No records" : "لا توجد سجلات"}</strong><span>{en ? "Data will appear here when real records are available for the clinic." : "ستظهر البيانات هنا عندما تتوفر سجلات حقيقية للعيادة."}</span></div> : null}</div>}<button className="quiet-button mt-5" onClick={() => onNavigate("overview")}><ArrowRight size={14} /> {en ? "Back to Overview" : "العودة للنظرة العامة"}</button></Card>;
}

function DetailView({ kind }: { kind: "clinic" | "agent" | "knowledge" | "phone" | "performance" | "usage" | "billing" | "settings" }) {
  const { language, theme } = usePreferences();
  const en = language === "en";
  const dark = theme === "dark";
  const query = useQuery({ queryKey: ["voice", kind], queryFn: ({ signal }) => kind === "clinic" ? getVoiceClinic(signal) : kind === "agent" ? getVoiceAgentSnapshot(signal) : kind === "knowledge" ? getVoiceKnowledgeSources(signal) : kind === "phone" ? getVoicePhoneChannels(signal) : kind === "performance" ? getVoicePerformance({ range: "7d" }, signal) : kind === "usage" ? getVoiceUsage(signal) : kind === "billing" ? getVoiceBilling(signal) : getVoiceSettings(signal), staleTime: 15_000 });
  const data = record(query.data);
  const config = record(data.snapshot || data.settings || data.dashboard);
  const pageLabel = en ? viewLabelsEn[kind] : viewLabelsAr[kind];
  const pageIcon = viewIcons[kind];
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  if (kind === "knowledge") return <KnowledgeView data={data} />;
  if (kind === "phone") return <PhoneView data={data} />;
  if (kind === "performance") return <PerformanceView data={data} />;
  if (kind === "usage") return <UsageView data={data} />;
  if (kind === "billing") return <BillingView data={data} />;
  return <Card title={pageLabel} subtitle={en ? "Real data from MERUNA contracts scoped to the clinic" : "بيانات حقيقية من عقد MERUNA المقيد بالعيادة"} icon={pageIcon}><div className="grid gap-4 md:grid-cols-2">{Object.entries(config).filter(([key]) => !["metadata", "configuration"].includes(key)).slice(0, 12).map(([key, value]) => <DataField key={key} label={key.replaceAll("_", " ")} value={typeof value === "object" ? JSON.stringify(value) : text(value)} />)}</div><div className={`mt-5 rounded-xl p-4 text-xs leading-6 ${dark ? "bg-[#143242] text-[#7e939e]" : "bg-[#edf6f7] text-[#557987]"}`}>{en ? "No fallback data is shown when clinic context is missing. All readings go through the current MERUNA session." : "لا يتم عرض أي بيانات بديلة عند غياب سياق العيادة. جميع القراءات تمر عبر جلسة MERUNA الحالية."}</div></Card>;
}

function DataField({ label, value }: { label: string; value: string }) {
  const { theme } = usePreferences();
  const dark = theme === "dark";
  return <div className={`rounded-xl border p-4 ${dark ? "border-[#1e3a4d] bg-[#122434]" : "border-[#e4edef] bg-[#fbfdfd]"}`}><small className={`block uppercase tracking-[.12em] ${dark ? "text-[#7e939e]" : "text-[#8499a3]"}`}>{label}</small><strong className={`mt-2 block break-words text-sm ${dark ? "text-[#e2ecf1]" : "text-[#244b60]"}`}>{value}</strong></div>;
}

function KnowledgeView({ data }: { data: Json }) {
  const { language, theme } = usePreferences();
  const en = language === "en";
  const dark = theme === "dark";
  const items = array(data.items);
  return <Card title={en ? "Knowledge Base" : "قاعدة المعرفة"} subtitle={en ? "Clinic sources, approval states, and processing" : "مصادر العيادة وحالات الاعتماد والمعالجة"} icon={FileText}><div className="grid gap-3 md:grid-cols-2">{items.map((item, index) => <article className={`rounded-xl border p-4 ${dark ? "border-[#1e3a4d]" : "border-[#e4edef]"}`} key={text(item.id, `knowledge-${index}`)}><div className="flex items-start justify-between gap-3"><div><strong className={`text-sm ${dark ? "text-[#e2ecf1]" : "text-[#244b60]"}`}>{text(item.title, en ? "Knowledge source" : "مصدر معرفة")}</strong><p className={`mt-2 text-xs ${dark ? "text-[#7e939e]" : "text-[#718591]"}`}>{text(item.source_kind, "document")} · {dateTime(item.updated_at)}</p></div><span className={`voice-agent-status ${statusTone(item.approval_status || item.processing_status)}`}>{statusLabel(item.approval_status || item.processing_status, en)}</span></div></article>)}</div>{!items.length ? <div className="voice-agent-empty"><FileText size={27} /><strong>{en ? "No knowledge sources" : "لا توجد مصادر معرفة"}</strong><span>{en ? "No fallback sources are generated." : "لا يتم إنشاء مصادر بديلة."}</span></div> : null}</Card>;
}

function PhoneView({ data }: { data: Json }) {
  const { language, theme } = usePreferences();
  const en = language === "en";
  const channels = array(data.channels);
  return <Card title={en ? "Phone & Voice Channel" : "الهاتف وقناة الصوت"} subtitle={en ? "Channel status from channels table and provider contracts" : "حالة القناة من جدول channels وعقد المزود"} icon={Phone}><div className="grid gap-3 md:grid-cols-2">{channels.map((channel, index) => <DataField key={text(channel.id, `channel-${index}`)} label={text(channel.provider, "Voice channel")} value={`${statusLabel(channel.status, en)} · ${bool(channel.is_enabled) ? (en ? "Enabled" : "مفعّلة") : (en ? "Disabled" : "غير مفعّلة")} · ${text(channel.phone_number_id, en ? "Number not displayed" : "رقم غير معروض")}`} />)}</div>{!channels.length ? <div className="voice-agent-empty"><Phone size={27} /><strong>{en ? "No voice channel linked" : "لا توجد قناة صوت مرتبطة"}</strong><span>{en ? "Provider provisioning goes through an approved path, not mock data." : "تجهيز المزود يتم عبر مسار معتمد، وليس من خلال بيانات وهمية."}</span></div> : null}</Card>;
}

function PerformanceView({ data }: { data: Json }) {
  const { language } = usePreferences();
  const en = language === "en";
  const projection = record(data.performance || data); const summary = record(projection.summary);
  return <Card title={en ? "Agent Performance" : "أداء الوكيل"} subtitle={en ? "Server-side analysis from get_voice_performance_projection" : "تحليل server-side من get_voice_performance_projection"} icon={BarChart3}><section className="voice-agent-analysis-summary"><div><strong>{number(summary.total_calls)}</strong><span>{en ? "Total Calls" : "إجمالي المكالمات"}</span></div><div><strong>{number(summary.transfers)}</strong><span>{en ? "Transfers" : "تحويلات"}</span></div><div><strong>{number(summary.appointments)}</strong><span>{en ? "Bookings" : "حجوزات"}</span></div><div><strong>{number(summary.handoff_rate)}%</strong><span>{en ? "Conversion Rate" : "نسبة التحويل"}</span></div></section><div className="grid gap-3 md:grid-cols-2"><DataField label={en ? "Data State" : "حالة البيانات"} value={text(projection.data_state, "unavailable")} /><DataField label={en ? "Last Updated" : "آخر تحديث"} value={text(projection.as_of, "Verified by MERUNA")} /></div></Card>;
}

function UsageView({ data }: { data: Json }) {
  const { language } = usePreferences();
  const en = language === "en";
  const usage = record(data.usage || data); const summary = record(usage.summary);
  return <Card title={en ? "Voice Usage" : "استخدام Voice"} subtitle={en ? "Aggregated projection; raw usage events are not sent to the browser" : "Projection مجمع؛ لا يتم إرسال raw usage events إلى المتصفح"} icon={Clock3}><section className="voice-agent-analysis-summary"><div><strong>{number(summary.voice_minutes)}</strong><span>{en ? "Voice Minutes" : "دقائق صوت"}</span></div><div><strong>{number(summary.event_count)}</strong><span>{en ? "Events" : "أحداث"}</span></div><div><strong>{number(summary.voice_call_units)}</strong><span>{en ? "Call Units" : "وحدات المكالمات"}</span></div><div><strong>{text(usage.data_state, "unavailable")}</strong><span>{en ? "Status" : "الحالة"}</span></div></section><div className="voice-agent-analysis-note"><ShieldCheck size={15} /> {en ? "Only aggregated details are shown here per privacy limits and usage contracts." : "التفاصيل المجمعة فقط تظهر هنا وفق حدود الخصوصية وعقد الاستخدام."}</div></Card>;
}

function BillingView({ data }: { data: Json }) {
  const { language } = usePreferences();
  const en = language === "en";
  const billing = record(data.billing || data); const subscription = record(billing.subscription); const plan = record(subscription.plan);
  return <Card title={en ? "Plan & Billing" : "الخطة والفوترة"} subtitle={en ? "Read-only summary; no payment or cancellation commands inside Voice" : "ملخص قراءة فقط؛ لا توجد أوامر دفع أو إلغاء داخل Voice"} icon={CircleDollarSign}><div className="grid gap-3 md:grid-cols-2"><DataField label={en ? "Subscription Status" : "حالة الاشتراك"} value={text(subscription.status, en ? "No visible subscription" : "لا يوجد اشتراك ظاهر")} /><DataField label={en ? "Plan" : "الخطة"} value={text(plan.name, en ? "Unavailable" : "غير متاحة")} /><DataField label={en ? "Data State" : "حالة البيانات"} value={text(billing.data_state, "unavailable")} /><DataField label={en ? "Last Updated" : "آخر تحديث"} value={text(billing.as_of, "Verified by MERUNA")} /></div><div className="voice-agent-managed-note"><ShieldCheck size={15} /><span>{en ? "Payment, plan changes, and cancellation are gated off this page and are not executed from the frontend." : "الدفع وتغيير الخطة والإلغاء محجوبة من هذه الصفحة ولا تُنفذ من الواجهة."}</span></div></Card>;
}

import { VoiceStudioModal } from "@/components/voice-studio-modal";
import { LiveHandoffBanner } from "@/components/live-handoff-banner";

export default function LiveVoiceAgentPage() {
  const { language, theme } = usePreferences();
  const en = language === "en";
  const dark = theme === "dark";
  const [studioOpen, setStudioOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const view = viewFromLocation(location);
  const overviewQuery = useQuery({ queryKey: ["voice", "overview"], queryFn: ({ signal }) => getVoiceOverview(signal), staleTime: 15_000, refetchInterval: false });
  const fallbackQuery = useQuery({ queryKey: ["operations", "voice-agent"], queryFn: ({ signal }) => getVoiceAgentData(signal), enabled: view === "overview" && overviewQuery.isError, staleTime: 15_000 });
  const navigate = (next: VoiceView) => setLocation(next === "overview" ? "/voice-agent" : `/voice-agent/${next}`);
  const refresh = () => { void overviewQuery.refetch(); if (fallbackQuery.isFetched) void fallbackQuery.refetch(); };
  const data = overviewQuery.data || (fallbackQuery.data ? { dashboard: { metrics: { calls_today: fallbackQuery.data.total }, recent_calls: fallbackQuery.data.calls, agent: fallbackQuery.data.configuration, settings: fallbackQuery.data.operationalSettings } } : undefined);
  const isFetching = overviewQuery.isFetching || fallbackQuery.isFetching;
  const content = view === "overview" ? (overviewQuery.isLoading && !data ? <LoadingState /> : overviewQuery.isError && !data ? <ErrorState onRetry={refresh} /> : <OverviewView data={data || {}} onNavigate={navigate} />) : view === "calls" || view === "bookings" ? <ListView kind={view} onNavigate={navigate} /> : <DetailView kind={view} />;
  
  return (
    <main className={`voice-agent-page mx-auto w-full max-w-[1440px] ${dark ? "bg-[#0b1824]" : "bg-[#f6f9fa]"}`} dir="rtl">
      {/* Top Banner for Urgent Escalations */}
      <div className="mb-4">
        <LiveHandoffBanner />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <PageHeader view={view} onRefresh={refresh} fetching={isFetching} />
        <button
          type="button"
          onClick={() => setStudioOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-90"
        >
          <Sparkles className="size-4" />
          <span>{en ? "Open Voice Agent Studio 🎙️" : "استوديو تخصيص الوكيل الصوتي 🎙️"}</span>
        </button>
      </div>

      <VoiceNavigation active={view} onNavigate={navigate} />
      {content}

      <VoiceStudioModal isOpen={studioOpen} onClose={() => setStudioOpen(false)} />
    </main>
  );
}

