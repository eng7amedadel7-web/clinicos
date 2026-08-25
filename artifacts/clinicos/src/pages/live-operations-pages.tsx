import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Archive, CalendarDays, Check, ChevronLeft, Clock3, Filter, Inbox, MessageCircle, MoreHorizontal, Plus, RefreshCw, Search, Send, UserRound, UsersRound, X } from "lucide-react";
import { getOperationsList, runOperationsAction, type OperationsItem } from "@/lib/operations-api";
import { usePreferences } from "@/lib/preferences";
import { WorkspaceDataState, WorkspaceEmptyState, WorkspaceErrorState, WorkspaceLoadingState, WorkspacePage, WorkspacePageHeader } from "@/components/workspace-page";

type Patient = { id: string; name: string; phone: string; createdAt: string | null };
type Appointment = { id: string; name: string; scheduledAt: string | null; status: string; doctorName?: string | null; serviceName?: string | null; notes?: string | null };
type Conversation = { id: string; name: string; channel: string; channelId?: string | null; channelType?: string | null; channelProvider?: string | null; channelStatus?: string | null; mode: "AI" | "Human"; lastActivityAt: string | null; lastMessage?: string | null; needsStaff?: boolean; status?: string; priority?: string };
type Message = { id: string; content: string; direction: string; created_at: string; message_status?: string | null; sender_type?: string | null };
type BookingOptions = { patients: Array<{ id: string; name: string }>; doctors: Array<{ id: string; name: string }>; services: Array<{ id: string; name: string }>; slots: Array<{ id: string; doctorId: string; serviceId: string; startTime: string; endTime: string; status: string }> };

const statusLabels: Record<string, string> = { scheduled: "مجدول", confirmed: "مؤكد", checked_in: "وصل", completed: "مكتمل", cancelled: "ملغي", no_show: "لم يحضر", pending: "بانتظار التأكيد" };
const clinicTimeZone = "Asia/Riyadh";
function statusTone(status: string) { if (["checked_in", "completed"].includes(status)) return "bg-[#d9f0e8] text-[#176b58]"; if (["scheduled", "pending"].includes(status)) return "bg-[#fff0d8] text-[#9a6513]"; if (["cancelled", "no_show"].includes(status)) return "bg-[#f8dfdc] text-[#a64036]"; return "bg-[#dcecf5] text-[#22617d]"; }
function dateTime(value: string | null) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short", timeZone: clinicTimeZone }).format(date); }
function timeOnly(value: string | null) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit", timeZone: clinicTimeZone }).format(date); }

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <WorkspacePageHeader eyebrow={eyebrow} title={title} description={description} action={action} />;
}
function LoadingState() { return <WorkspaceLoadingState rows={2} />; }
function ErrorState({ onRetry }: { onRetry: () => void }) { return <WorkspaceErrorState onRetry={onRetry} />; }
function EmptyState({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) { return <div className="flex flex-col items-center px-5 py-14 text-center text-[#7d929c]">{icon}<p className="mt-3 text-sm font-bold text-[#527080]">{title}</p><p className="mt-1 text-xs">{detail}</p></div>; }

export function LivePatientsPage() {
  const [rows, setRows] = useState<Patient[]>([]); const [query, setQuery] = useState(""); const [phoneFilter, setPhoneFilter] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState(false); const [selected, setSelected] = useState<Patient | null>(null); const [editor, setEditor] = useState<"new" | "edit" | null>(null); const [saving, setSaving] = useState(false); const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const load = () => { setLoading(true); setError(false); fetch("/api/patients", { credentials: "include" }).then((r) => r.ok ? r.json() : Promise.reject()).then((data: Patient[]) => setRows(Array.isArray(data) ? data : [])).catch(() => { setRows([]); setError(true); }).finally(() => setLoading(false)); };
  useEffect(load, []);
  const filtered = useMemo(() => rows.filter((row) => (!phoneFilter || row.phone !== "—") && `${row.name} ${row.phone}`.includes(query)), [rows, phoneFilter, query]);
  const save = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); const endpoint = editor === "edit" && selected ? `/api/patients/${selected.id}` : "/api/patients"; const method = editor === "edit" ? "PATCH" : "POST"; const response = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(form) }); setSaving(false); if (!response.ok) return; setEditor(null); setSelected(null); load(); };
  const archive = async () => { if (!selected || !window.confirm("أرشفة ملف هذا المريض؟")) return; const response = await fetch(`/api/patients/${selected.id}`, { method: "DELETE", credentials: "include" }); if (response.ok) { setSelected(null); load(); } };
  return <WorkspacePage><PageHeader eyebrow="السجلات / المرضى" title="المرضى" description={loading ? "جارٍ تحميل السجلات من Supabase" : `${rows.length} سجلات مفلترة حسب عيادة الجلسة`} action={<button className="primary-button" onClick={() => { setForm({ name: "", phone: "", email: "", notes: "" }); setEditor("new"); }} data-testid="button-add-patient"><Plus size={17} /> إضافة مريض</button>} /><div className="mb-4 flex items-center gap-2"><div className="relative flex-1"><Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ca2ad]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالاسم أو رقم الجوال..." className="input-field pr-10" data-testid="input-patients-search" /></div><button className={`quiet-button ${phoneFilter ? "bg-[#e8f3f5] text-[#3c7e93]" : ""}`} type="button" aria-pressed={phoneFilter} onClick={() => setPhoneFilter((value) => !value)}><Filter size={15} /> {phoneFilter ? "برقم جوال" : "تصفية"}</button></div><div className="surface overflow-hidden p-0">{loading ? <LoadingState /> : error ? <ErrorState onRetry={load} /> : filtered.length ? <div>{filtered.map((patient, index) => <button key={patient.id} onClick={() => setSelected(patient)} className="animate-sweep flex w-full items-center gap-4 border-b border-[#edf1f3] px-5 py-4 text-right transition hover:bg-[#f5f9fa] last:border-0" data-testid={`row-patient-${patient.id}`}><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#d9f0e8] text-xs font-bold text-[#176b58]">{patient.name.slice(0, 2)}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#28495b]">{patient.name}</strong><span className="mt-1 block text-[11px] text-[#8496a0]">{patient.phone} · ملف نشط</span></span><span className="hidden text-[11px] text-[#8496a0] sm:block">{patient.createdAt ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(patient.createdAt)) : "—"}</span><span className="grid size-8 place-items-center rounded-lg bg-[#f1f7f7] text-[#789daa]">{index + 1}</span><ChevronLeft size={16} className="text-[#a0adb3]" /></button>)}</div> : <EmptyState icon={<UsersRound size={28} />} title="لا توجد سجلات مطابقة" detail="ستظهر هنا بيانات المرضى الخاصة بالعيادة الحالية." />}</div>{selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102c32]/35 p-4" onClick={() => setSelected(null)}><div className="surface w-full max-w-md p-6" dir="rtl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold text-[#3c7e93]">ملف المريض</p><h2 className="mt-1 text-xl font-extrabold text-[#18374d]">{selected.name}</h2><p className="mt-1 text-xs text-[#718591]" dir="ltr">{selected.phone}</p></div><button onClick={() => setSelected(null)} aria-label="إغلاق"><X size={18} /></button></div><div className="mt-6 flex gap-2"><button className="primary-button" onClick={() => { setForm({ name: selected.name, phone: selected.phone === "—" ? "" : selected.phone, email: "", notes: "" }); setEditor("edit"); }}><MoreHorizontal size={16} /> تعديل</button><button className="quiet-button text-[#ad514a]" onClick={archive}><Archive size={16} /> أرشفة</button></div></div></div>}{editor && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102c32]/35 p-4"><form className="surface w-full max-w-md space-y-3 p-6" dir="rtl" onSubmit={save}><div className="flex items-center justify-between"><h2 className="text-lg font-extrabold text-[#18374d]">{editor === "new" ? "إضافة مريض" : "تعديل بيانات المريض"}</h2><button type="button" onClick={() => setEditor(null)}><X size={18} /></button></div>{(["name", "phone", "email", "notes"] as const).map((key) => <input key={key} required={key === "name"} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} placeholder={{ name: "اسم المريض *", phone: "رقم الجوال", email: "البريد الإلكتروني", notes: "ملاحظات" }[key]} className="input-field w-full" />)}<button className="primary-button w-full" disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ البيانات"}</button></form></div>}</WorkspacePage>;
}

export function LiveAppointmentsPage() {
  const [rows, setRows] = useState<Appointment[]>([]); const [options, setOptions] = useState<BookingOptions | null>(null); const [query, setQuery] = useState(""); const [statusFilter, setStatusFilter] = useState("all"); const [loading, setLoading] = useState(true); const [error, setError] = useState(false); const [booking, setBooking] = useState(false); const [saving, setSaving] = useState(false); const [form, setForm] = useState({ patientId: "", slotId: "", notes: "" });
  const load = () => { setLoading(true); setError(false); fetch("/api/appointments?includeOptions=true", { credentials: "include" }).then(async (response) => { if (!response.ok) throw new Error("load"); const data = await response.json(); setRows(Array.isArray(data.appointments) ? data.appointments : []); setOptions(data.options || null); }).catch(() => { setRows([]); setOptions(null); setError(true); }).finally(() => setLoading(false)); };
  useEffect(load, []);
  const filtered = useMemo(() => rows.filter((row) => row.name.includes(query) && (statusFilter === "all" || row.status === statusFilter)), [rows, query, statusFilter]);
  const save = async (event: React.FormEvent) => { event.preventDefault(); if (!form.patientId || !form.slotId) return; setSaving(true); const response = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(form) }); setSaving(false); if (!response.ok) return; setBooking(false); setForm({ patientId: "", slotId: "", notes: "" }); load(); };
  const cancel = async (id: string) => { if (!window.confirm("إلغاء هذا الموعد؟")) return; const response = await fetch(`/api/appointments/${id}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({}) }); if (response.ok) load(); };
  const doctorName = (id: string) => options?.doctors.find((doctor) => doctor.id === id)?.name || "طبيب العيادة";
  const serviceName = (id: string) => options?.services.find((service) => service.id === id)?.name || "خدمة العيادة";
  return <WorkspacePage><PageHeader eyebrow="التشغيل / المواعيد" title="المواعيد" description={loading ? "جارٍ تحميل المواعيد من Supabase" : `${rows.length} مواعيد مرتبطة بالعيادة الحالية`} action={<button className="primary-button" onClick={() => setBooking(true)} data-testid="button-new-appointment"><Plus size={17} /> حجز موعد</button>} /><div className="mb-4 flex items-center gap-2"><div className="relative flex-1"><Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ca2ad]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث باسم المريض..." className="input-field pr-10" data-testid="input-appointments-search" /></div><button className={`quiet-button ${statusFilter !== "all" ? "bg-[#e8f3f5] text-[#3c7e93]" : ""}`} type="button" aria-pressed={statusFilter !== "all"} onClick={() => setStatusFilter((value) => value === "all" ? "scheduled" : value === "scheduled" ? "confirmed" : value === "confirmed" ? "completed" : "all")}><Filter size={15} /> {statusFilter === "all" ? "تصفية" : statusLabels[statusFilter] || statusFilter}</button></div><div className="surface overflow-hidden p-0">{loading ? <LoadingState /> : error ? <ErrorState onRetry={load} /> : filtered.length ? <div>{filtered.map((row) => <div key={row.id} className="animate-sweep flex flex-wrap items-center gap-4 border-b border-[#edf1f3] px-5 py-4 last:border-0" data-testid={`row-appointment-${row.id}`}><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#dcecf5] text-[#22617d]"><CalendarDays size={19} /></span><span className="min-w-[180px] flex-1"><strong className="block text-sm text-[#28495b]">{row.name}</strong><span className="mt-1 block text-[11px] text-[#8496a0]">{dateTime(row.scheduledAt)} · {row.serviceName || "خدمة العيادة"}{row.doctorName ? ` · ${row.doctorName}` : ""}</span></span><span className={`rounded-md px-2 py-1 text-[10px] font-bold ${statusTone(row.status)}`}>{statusLabels[row.status] || row.status}</span>{row.status !== "cancelled" && <button className="quiet-button text-[#ad514a]" onClick={() => cancel(row.id)}><X size={15} /> إلغاء</button>}</div>)}</div> : <EmptyState icon={<CalendarDays size={28} />} title="لا توجد مواعيد مطابقة" detail="يمكنك حجز موعد من slot متاح تابع للعيادة الحالية." />}</div>{booking && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102c32]/35 p-4"><form className="surface w-full max-w-lg space-y-4 p-6" dir="rtl" onSubmit={save}><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold text-[#3c7e93]">حجز من المواعيد المتاحة</p><h2 className="mt-1 text-lg font-extrabold text-[#18374d]">حجز موعد جديد</h2></div><button type="button" onClick={() => setBooking(false)}><X size={18} /></button></div><label className="block text-xs font-bold">المريض<select required value={form.patientId} onChange={(event) => setForm({ ...form, patientId: event.target.value, slotId: "" })} className="input-field mt-1.5 w-full"><option value="">اختر مريضًا من العيادة</option>{options?.patients.map((patient) => <option value={patient.id} key={patient.id}>{patient.name}</option>)}</select></label><label className="block text-xs font-bold">الموعد المتاح<select required value={form.slotId} onChange={(event) => setForm({ ...form, slotId: event.target.value })} className="input-field mt-1.5 w-full"><option value="">اختر slot متاحًا</option>{options?.slots.map((slot) => <option value={slot.id} key={slot.id}>{dateTime(slot.startTime)} · {doctorName(slot.doctorId)} · {serviceName(slot.serviceId)}</option>)}</select></label>{options && options.slots.length === 0 && <p className="rounded-xl bg-[#fffaf0] p-3 text-xs leading-6 text-[#9a6513]">لا توجد slots متاحة حاليًا في هذه العيادة.</p>}<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="ملاحظات اختيارية" className="input-field min-h-20 w-full" /><button className="primary-button w-full" disabled={saving || !options?.slots.length}>{saving ? "جارٍ الحفظ..." : "تأكيد الحجز"}</button></form></div>}</WorkspacePage>;
}

type InboxChannelType = "all" | "whatsapp" | "messenger" | "telegram" | "instagram";
type InboxChannel = { id: string; type: string; provider?: string | null; status?: string | null; isEnabled?: boolean; displayName?: string | null };

const inboxChannelMeta: Array<{ type: Exclude<InboxChannelType, "all">; label: string; accent: string; soft: string }> = [
  { type: "whatsapp", label: "واتساب", accent: "#25d366", soft: "#e8faef" },
  { type: "messenger", label: "ماسنجر", accent: "#168aff", soft: "#e8f3ff" },
  { type: "telegram", label: "تليجرام", accent: "#229ed9", soft: "#e8f7fd" },
  { type: "instagram", label: "إنستغرام", accent: "#d9468f", soft: "#fcecf5" },
];

function ChannelLogo({ type, size = 20 }: { type: InboxChannelType; size?: number }) {
  const meta = inboxChannelMeta.find((item) => item.type === type);
  const color = meta?.accent ?? "#3c7e93";
  if (type === "whatsapp") return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill={color} /><path d="M8.5 7.9c.25-.3.62-.32.9-.1l1.15.92c.28.22.34.62.14.93l-.55.85c.55 1.1 1.45 2.02 2.58 2.58l.85-.55c.31-.2.71-.14.93.14l.92 1.15c.22.28.2.65-.1.9-.52.44-1.2.7-1.9.56-3.68-.74-6.57-3.63-7.31-7.31-.14-.7.12-1.38.56-1.9Z" fill="white" /></svg>;
  if (type === "messenger") return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 3.3c-5.3 0-9.4 3.65-9.4 8.5 0 2.67 1.34 5.05 3.46 6.6v2.28l2.2-1.2c1.1.35 2.3.54 3.74.54 5.3 0 9.4-3.65 9.4-8.5S17.3 3.3 12 3.3Z" fill={color} /><path d="m6.95 13.55 3.1-3.3 1.65 1.55 3.75-2.05-3.1 3.3-1.65-1.55-3.75 2.05Z" fill="white" /></svg>;
  if (type === "telegram") return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill={color} /><path d="m6.8 11.72 9.4-3.62c.43-.16.8.1.66.64l-1.6 7.54c-.12.54-.44.67-.9.42l-2.6-1.92-1.25 1.2c-.14.14-.25.25-.5.25l.18-2.64 4.8-4.34c.21-.18-.05-.28-.33-.1l-5.93 3.74-2.56-.8c-.55-.17-.56-.55.1-.77Z" fill="white" /></svg>;
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5" stroke={color} strokeWidth="2" /><circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" /><circle cx="17.3" cy="6.8" r="1.1" fill={color} /></svg>;
}

function inboxChannelLabel(type?: string | null) {
  return inboxChannelMeta.find((item) => item.type === type)?.label || "قناة غير محددة";
}

export function LiveInboxPage() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [channels, setChannels] = useState<InboxChannel[]>([]);
  const [channelCounts, setChannelCounts] = useState<Record<string, number>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [channelType, setChannelType] = useState<InboxChannelType>("all");
  const [reply, setReply] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);
  const [modeUpdating, setModeUpdating] = useState(false);

  const load = async (conversationId?: string, requestedChannel: InboxChannelType = channelType) => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams();
    if (conversationId) params.set("conversationId", conversationId);
    if (requestedChannel !== "all") params.set("channelType", requestedChannel);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    try {
      const response = await fetch(`/api/inbox${suffix}`, { credentials: "include" });
      if (!response.ok) throw new Error("inbox");
      const data = await response.json();
      setItems(Array.isArray(data.conversations) ? data.conversations : []);
      setChannels(Array.isArray(data.channels) ? data.channels : []);
      setChannelCounts(data.channelCounts && typeof data.channelCounts === "object" ? data.channelCounts as Record<string, number> : {});
      setSelectedId(data.selectedConversationId || null);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selected = items.find((item) => item.id === selectedId) || null;
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesChannel = channelType === "all" || item.channelType === channelType;
      const matchesSearch = !needle || `${item.name} ${item.channel} ${item.lastMessage || ""}`.toLowerCase().includes(needle);
      return matchesChannel && matchesSearch;
    });
  }, [channelType, items, search]);
  const selectChannel = (nextChannel: InboxChannelType) => {
    setChannelType(nextChannel);
    const nextItems = nextChannel === "all" ? items : items.filter((item) => item.channelType === nextChannel);
    const nextConversation = nextItems.find((item) => item.id === selectedId) || nextItems[0];
    if (nextConversation) {
      setSelectedId(nextConversation.id);
      load(nextConversation.id, nextChannel);
    } else {
      setSelectedId(null);
      setMessages([]);
      load(undefined, nextChannel);
    }
  };

  const selectConversation = (id: string) => {
    setSelectedId(id);
    load(id, channelType);
  };

  const toggleMode = async () => {
    if (!selected || modeUpdating) return;
    const mode = selected.mode === "AI" ? "Human" : "AI";
    setModeUpdating(true);
    try {
      const response = await fetch(`/api/inbox/${encodeURIComponent(selected.id)}/mode`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ mode }) });
      if (response.ok) setItems((current) => current.map((item) => item.id === selected.id ? { ...item, mode } : item));
    } finally {
      setModeUpdating(false);
    }
  };

  const send = async () => {
    if (!selected || !reply.trim() || sending) return;
    setSending(true);
    try {
      const response = await fetch(`/api/inbox/${encodeURIComponent(selected.id)}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ content: reply.trim() }) });
      if (!response.ok) return;
      const saved = await response.json();
      setReply("");
      if (saved?.id) setMessages((current) => [...current, saved]);
      await load(selected.id, channelType);
    } finally {
      setSending(false);
    }
  };

  const activeChannelMeta = inboxChannelMeta.find((item) => item.type === selected?.channelType);
  return <WorkspacePage className="h-full min-h-0 max-w-none gap-3 px-3 py-3 md:px-5 md:py-4" data-testid="page-inbox">
    <PageHeader eyebrow="التواصل / صندوق الوارد" title="صندوق الوارد" description={loading ? "جارٍ تحميل المحادثات من Supabase" : `${visible.length} محادثات حقيقية مرتبطة بالعيادة الحالية`} action={<button className="quiet-button" onClick={() => load(selectedId || undefined, channelType)} disabled={loading}><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> تحديث</button>} />
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5" role="tablist" aria-label="قنوات التواصل">
      <button type="button" role="tab" aria-selected={channelType === "all"} onClick={() => selectChannel("all")} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-[11px] font-bold transition active:scale-[.98] ${channelType === "all" ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white shadow-[0_7px_18px_hsl(var(--primary)/.2)]" : "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/.45)]"}`}><span className="grid size-7 place-items-center rounded-lg border border-current/20 text-xs">✦</span><span>كل القنوات</span><span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[9px]">{items.length}</span></button>
      {inboxChannelMeta.map((meta) => { const count = channelCounts[meta.type] || 0; const configured = channels.some((channel) => channel.type === meta.type && channel.isEnabled !== false); const active = channelType === meta.type; return <button type="button" key={meta.type} role="tab" aria-selected={active} onClick={() => selectChannel(meta.type)} title={configured ? undefined : "القناة غير متصلة أو غير مهيأة"} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-[11px] font-bold transition active:scale-[.98] ${active ? "text-white shadow-[0_7px_18px_rgba(0,0,0,.12)]" : "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/.45)]"}`} style={active ? { borderColor: meta.accent, backgroundColor: meta.accent } : undefined}><span className="grid size-7 place-items-center rounded-lg" style={{ backgroundColor: active ? "rgba(255,255,255,.18)" : meta.soft }}><ChannelLogo type={meta.type} size={19} /></span><span>{meta.label}</span><span className={`rounded-full px-1.5 py-0.5 text-[9px] ${active ? "bg-white/20" : "bg-[hsl(var(--muted))]"}`}>{count}</span></button>; })}
    </div>
    <div className="surface flex min-h-0 min-w-0 flex-1 overflow-hidden p-0 lg:grid lg:grid-cols-[320px_minmax(0,1fr)]" data-testid="inbox-workspace">
      {loading && !items.length ? <div className="p-5 lg:col-span-2"><LoadingState /></div> : error ? <div className="p-5 lg:col-span-2"><ErrorState onRetry={() => load(selectedId || undefined, channelType)} /></div> : <>
        <div className="flex min-h-0 flex-col border-l border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <div className="shrink-0 border-b border-[hsl(var(--border))] p-4"><div className="flex items-center justify-between"><strong className="text-sm">المحادثات <span className="mr-1 rounded-md bg-[hsl(var(--primary)/.1)] px-1.5 py-0.5 text-[10px] text-[hsl(var(--primary))]">{visible.length}</span></strong><span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))]">{channelType === "all" ? "كل القنوات" : inboxChannelLabel(channelType)}</span></div><div className="relative mt-3"><Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث في المحادثات" className="input-field w-full pr-8 text-xs" data-testid="input-inbox-search" /></div></div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{visible.map((item) => { const meta = inboxChannelMeta.find((entry) => entry.type === item.channelType); return <button key={item.id} onClick={() => selectConversation(item.id)} className={`flex w-full gap-3 border-b border-[hsl(var(--border)/.6)] px-4 py-4 text-right transition hover:bg-[hsl(var(--muted)/.45)] ${selectedId === item.id ? "bg-[hsl(var(--primary)/.07)]" : ""}`} data-testid={`row-conversation-${item.id}`}><span className="grid size-10 shrink-0 place-items-center rounded-full" style={{ backgroundColor: meta?.soft || "#e8f1f5" }}><ChannelLogo type={(item.channelType as InboxChannelType) || "instagram"} size={20} /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-xs">{item.name}</strong><small className="whitespace-nowrap text-[9px] text-[hsl(var(--muted-foreground))]">{dateTime(item.lastActivityAt)}</small></span><span className="mt-1 block truncate text-[10px] text-[hsl(var(--muted-foreground))]">{item.lastMessage || item.channel}</span><span className="mt-2 flex items-center gap-1.5"><span className="text-[9px] font-bold" style={{ color: meta?.accent }}>{meta?.label || item.channelType || "قناة غير محددة"}</span><span className={`rounded-md px-2 py-1 text-[10px] font-bold ${item.mode === "AI" ? "bg-[#e8e1f4] text-[#65518b]" : "bg-[#dcecf5] text-[#22617d]"}`}>{item.mode === "AI" ? "المساعد الذكي" : "الفريق"}</span></span></span></button>; })}{!visible.length && <EmptyState icon={<MessageCircle size={25} />} title="لا توجد محادثات" detail="لا توجد محادثات مسجلة على هذه القناة في العيادة الحالية." />}</div>
        </div>
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          {selected ? <><div className="flex shrink-0 items-center justify-between gap-3 border-b border-[hsl(var(--border))] px-5 py-4"><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full" style={{ backgroundColor: activeChannelMeta?.soft || "#e8f1f5" }}><ChannelLogo type={(selected.channelType as InboxChannelType) || "instagram"} size={21} /></span><div className="min-w-0"><strong className="block truncate text-sm">{selected.name}</strong><span className="block truncate text-[10px] text-[hsl(var(--muted-foreground))]">{activeChannelMeta?.label || selected.channelType || "قناة غير محددة"} · {selected.channelProvider || "مزود غير محدد"} · {selected.channelStatus || "غير محدد"}</span></div></div><button className="quiet-button shrink-0" onClick={toggleMode} disabled={modeUpdating}><UserRound size={15} /> {selected.mode === "AI" ? "تحويل للفريق" : "إعادة للمساعد"}</button></div><div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[hsl(var(--background)/.45)]"><div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-5" data-testid="inbox-message-scroll" style={{ scrollbarGutter: "stable" }}>{messages.length ? messages.map((message) => <div key={message.id} className={`max-w-[75%] rounded-2xl p-3 text-xs leading-6 shadow-[0_1px_2px_rgba(20,50,65,.05)] ${message.direction === "outgoing" ? "mr-auto bg-[hsl(var(--primary))] text-white" : "ml-auto border border-[hsl(var(--border))] bg-[hsl(var(--card))]"}`}>{message.content}<small className="mt-1 block text-[9px] opacity-60">{dateTime(message.created_at)} · {message.message_status || ""}</small></div>) : <EmptyState icon={<MessageCircle size={25} />} title="لا توجد رسائل بعد" detail="ابدأ من الرسالة الأولى إذا كانت المحادثة جديدة." />}</div><div className="shrink-0 border-t border-[hsl(var(--border))] bg-[hsl(var(--card)/.9)] p-4"><div className="mb-2 text-[10px] text-[hsl(var(--muted-foreground))]">الرد محفوظ عبر مسار الخادم المحمي ثم يمرر لموصل القناة المناسب.</div><div className="flex gap-2"><input value={reply} onChange={(event) => setReply(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") send(); }} placeholder={`اكتب ردك على ${activeChannelMeta?.label || "المحادثة"}...`} className="input-field min-w-0 flex-1" data-testid="input-inbox-reply" /><button className="primary-button shrink-0" onClick={send} disabled={sending || !reply.trim()} data-testid="button-send-reply"><Send size={16} /> {sending ? "جارٍ الإرسال..." : "إرسال"}</button></div></div></div></> : <EmptyState icon={<Inbox size={30} />} title="اختر محادثة" detail="المحادثات التي تراها هنا مفلترة حسب عيادة الجلسة والقناة المحددة." />}
        </div>
      </>}
    </div>
  </WorkspacePage>;
}
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

function OperationsPageHeader({ eyebrow, title, description, onRefresh, isFetching }: { eyebrow: string; title: string; description: string; onRefresh: () => void; isFetching: boolean }) {
  return <WorkspacePageHeader eyebrow={eyebrow} title={title} description={description} action={<button onClick={onRefresh} disabled={isFetching} className="quiet-button"><RefreshCw size={15} className={isFetching ? "animate-spin" : ""} /> تحديث البيانات</button>} />;
}

function OperationsDataState({ isLoading, isError, retry, children }: { isLoading: boolean; isError: boolean; retry: () => void; children: ReactNode }) {
  return <WorkspaceDataState isLoading={isLoading} isError={isError} retry={retry}>{children}</WorkspaceDataState>;
}

function OperationsEmptyState({ text }: { text: string }) {
  return <WorkspaceEmptyState icon={<UsersRound size={28} />} title={text} />;
}

function OperationsActionButton({ label, icon: Icon, disabled, onClick, tone = "default" }: { label: string; icon: typeof Send; disabled?: boolean; onClick: () => void; tone?: "default" | "danger" }) {
  return <button disabled={disabled} onClick={onClick} className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-bold transition disabled:opacity-50 ${tone === "danger" ? "border-[#e2b4b0] text-[#a64036] hover:bg-[#fff7f6]" : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"}`}><Icon size={13} /> {label}</button>;
}

export function WaitlistPage() {
  const queryClient = useQueryClient();
  const { selectedBranchId } = usePreferences();
  const query = useQuery({ queryKey: ["operations", "waitlist", selectedBranchId], queryFn: ({ signal }) => getOperationsList("waitlist", signal, selectedBranchId === "all" ? undefined : selectedBranchId), staleTime: 15_000, refetchInterval: 60_000, refetchIntervalInBackground: false });
  const action = useMutation({ mutationFn: ({ id, operation }: { id: string; operation: "pause" | "cancel" }) => runOperationsAction(`/api/operations/waitlist/${encodeURIComponent(id)}/${operation}`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["operations", "waitlist", selectedBranchId] }) });
  const items = query.data?.items ?? [];
  return <WorkspacePage><OperationsPageHeader eyebrow="التشغيل / الفرص" title="قائمة الانتظار" description={query.data ? `${query.data.total} طلبات حقيقية مرتبطة بالعيادة` : "إدارة الطلبات النشطة من Supabase"} onRefresh={() => query.refetch()} isFetching={query.isFetching} /><OperationsDataState isLoading={query.isLoading} isError={query.isError} retry={() => query.refetch()}>{items.length ? <div className="space-y-3">{items.map((item) => <div key={String(item.id)} className="surface flex flex-wrap items-center gap-3 p-4"><span className="grid size-10 place-items-center rounded-full bg-[#fff0d8] text-xs font-bold text-[#9a6513]">{displayPatient(item).slice(0, 2)}</span><div className="min-w-[190px] flex-1"><strong className="block text-xs">{displayPatient(item)}</strong><span className="mt-1 block text-[10px] text-[hsl(var(--muted-foreground))]">{statusLabel(item.status)} · أولوية {typeof item.priority === "number" ? item.priority : "—"}</span></div><div className="text-[10px] text-[hsl(var(--muted-foreground))]"><Clock3 size={13} className="ml-1 inline" /> منذ {dateLabel(item.created_at)}</div><span className="rounded-md bg-[#dcecf5] px-2 py-1 text-[10px] font-bold text-[#22617d]">{statusLabel(item.status)}</span>{item.status === "active" ? <OperationsActionButton label="إيقاف مؤقت" icon={Clock3} disabled={action.isPending} onClick={() => action.mutate({ id: String(item.id), operation: "pause" })} /> : null}<OperationsActionButton label="إلغاء" icon={X} tone="danger" disabled={action.isPending} onClick={() => { if (window.confirm("هل تريد إلغاء طلب الانتظار؟")) action.mutate({ id: String(item.id), operation: "cancel" }); }} /></div>)}</div> : <OperationsEmptyState text="لا توجد طلبات انتظار نشطة في هذه العيادة." />}</OperationsDataState>{action.isError ? <p className="mt-3 text-xs font-bold text-[#a64036]">{action.error instanceof Error ? action.error.message : "تعذر حفظ الإجراء."}</p> : null}</WorkspacePage>;
}

export function FollowUpsPage() {
  const queryClient = useQueryClient();
  const { selectedBranchId } = usePreferences();
  const query = useQuery({ queryKey: ["operations", "follow-ups", selectedBranchId], queryFn: ({ signal }) => getOperationsList("follow-ups", signal, selectedBranchId === "all" ? undefined : selectedBranchId), staleTime: 15_000, refetchInterval: 60_000, refetchIntervalInBackground: false });
  const action = useMutation({ mutationFn: (id: string) => runOperationsAction(`/api/operations/follow-ups/${encodeURIComponent(id)}/decision`, { outcome: "completed_by_staff", stopFollowup: true, needsHandoff: false }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["operations", "follow-ups", selectedBranchId] }) });
  const items = query.data?.items ?? [];
  return <WorkspacePage><OperationsPageHeader eyebrow="التشغيل / follow-up" title="المتابعات" description={query.data ? `${query.data.total} حالات حقيقية تحتاج قرار الفريق` : "إدارة حالات المتابعة من Supabase"} onRefresh={() => query.refetch()} isFetching={query.isFetching} /><OperationsDataState isLoading={query.isLoading} isError={query.isError} retry={() => query.refetch()}>{items.length ? <div className="space-y-3">{items.map((item) => <div key={String(item.id)} className="surface flex flex-wrap items-center gap-3 p-4"><span className="grid size-10 place-items-center rounded-full bg-[#d9f0e8] text-xs font-bold text-[#176b58]">{displayPatient(item).slice(0, 2)}</span><div className="min-w-[190px] flex-1"><strong className="block text-xs">{displayPatient(item)}</strong><span className="mt-1 block text-[10px] text-[hsl(var(--muted-foreground))]">{statusLabel(item.status)} · {textValue(item.followup_goal)}</span></div><div className="text-[10px] text-[hsl(var(--muted-foreground))]"><Clock3 size={13} className="ml-1 inline" /> الاستحقاق {dateLabel(item.next_due_at)}</div><OperationsActionButton label="تسجيل القرار" icon={Check} disabled={action.isPending} onClick={() => action.mutate(String(item.id))} /></div>)}</div> : <OperationsEmptyState text="لا توجد متابعات مفتوحة في هذه العيادة." />}</OperationsDataState>{action.isError ? <p className="mt-3 text-xs font-bold text-[#a64036]">{action.error instanceof Error ? action.error.message : "تعذر حفظ قرار المتابعة."}</p> : null}</WorkspacePage>;
}

export function NoShowsPage() {
  const queryClient = useQueryClient();
  const { selectedBranchId } = usePreferences();
  const query = useQuery({ queryKey: ["operations", "no-shows", selectedBranchId], queryFn: ({ signal }) => getOperationsList("no-shows", signal, selectedBranchId === "all" ? undefined : selectedBranchId), staleTime: 15_000, refetchInterval: 60_000, refetchIntervalInBackground: false });
  const action = useMutation({ mutationFn: ({ id, operation }: { id: string; operation: "classify" | "close" }) => runOperationsAction(`/api/operations/no-shows/${encodeURIComponent(id)}/${operation}`, operation === "close" ? { outcome: "closed_by_staff", reason: "تمت المراجعة من فريق العيادة" } : {}), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["operations", "no-shows", selectedBranchId] }) });
  const items = query.data?.items ?? [];
  return <WorkspacePage><OperationsPageHeader eyebrow="التشغيل / recovery" title="عدم الحضور" description={query.data ? `${query.data.total} حالات حقيقية تحتاج معالجة` : "إدارة حالات عدم الحضور من Supabase"} onRefresh={() => query.refetch()} isFetching={query.isFetching} /><OperationsDataState isLoading={query.isLoading} isError={query.isError} retry={() => query.refetch()}>{items.length ? <div className="space-y-3">{items.map((item) => <div key={String(item.id)} className="surface flex flex-wrap items-center gap-3 p-4"><span className="grid size-10 place-items-center rounded-full bg-[#f8dfdc] text-[#a64036]"><AlertTriangle size={17} /></span><div className="min-w-[190px] flex-1"><strong className="block text-xs">{displayPatient(item)}</strong><span className="mt-1 block text-[10px] text-[hsl(var(--muted-foreground))]">{statusLabel(item.case_status)} · مستوى الخطر {textValue(item.risk_level)}</span></div><div className="text-[10px] text-[hsl(var(--muted-foreground))]">آخر نشاط {dateLabel(item.last_activity_at)}</div><OperationsActionButton label="تصنيف" icon={RefreshCw} disabled={action.isPending} onClick={() => action.mutate({ id: String(item.id), operation: "classify" })} /><OperationsActionButton label="إغلاق الحالة" icon={Check} tone="danger" disabled={action.isPending} onClick={() => { if (window.confirm("هل تريد إغلاق حالة عدم الحضور؟")) action.mutate({ id: String(item.id), operation: "close" }); }} /></div>)}</div> : <OperationsEmptyState text="لا توجد حالات عدم حضور مفتوحة في هذه العيادة." />}</OperationsDataState>{action.isError ? <p className="mt-3 text-xs font-bold text-[#a64036]">{action.error instanceof Error ? action.error.message : "تعذر حفظ إجراء recovery."}</p> : null}</WorkspacePage>;
}

function textValue(value: unknown, fallback = "غير محدد") {
  return typeof value === "string" && value.trim() ? value : fallback;
}
