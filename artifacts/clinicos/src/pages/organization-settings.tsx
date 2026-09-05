import { useEffect, useMemo, useState } from "react";
import { Building2, CalendarClock, Check, Copy, MessageSquare, Plus, RefreshCw, ShieldCheck, Trash2, UploadCloud, UserPlus, UsersRound, Zap } from "lucide-react";
import { toast } from "sonner";
import { usePreferences } from "@/lib/preferences";
import { SmartDataImportModal } from "@/components/smart-data-import-modal";
import { IntegrationsHub } from "@/components/integrations-hub";
import { ChannelConnectionsManager } from "@/components/channel-connections-manager";
import { ClinicCalendarSetup } from "@/components/clinic-calendar-setup";

type Branch = { id: string; name: string; address?: string | null; phone?: string | null; is_active?: boolean };
type Role = { id: string; clinic_id?: string | null; name: string; role_type?: string };
type Staff = { id: string; user_id: string; role?: string | null; user?: { full_name?: string | null; display_name?: string | null; status?: string | null; last_login_at?: string | null } | null; assignments?: Array<{ roles?: { name?: string | null } | null; branch_id?: string | null }> };

type Tab = "branches" | "staff" | "roles" | "calendar" | "channels" | "integrations";
type Invite = { id: string; email: string; role: string; status?: string; expiresAt?: string | null; createdAt?: string | null };

const inviteRoleLabels: Record<string, { en: string; ar: string }> = {
  owner: { en: "Clinic owner", ar: "مالك العيادة" },
  admin: { en: "Admin", ar: "مدير" },
  staff: { en: "Staff", ar: "موظف" },
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const payload = await response.json().catch(() => null) as T | { error?: string } | null;
  if (!response.ok) throw new Error(payload && typeof payload === "object" && payload && "error" in payload && typeof payload.error === "string" ? payload.error : "تعذر تنفيذ العملية.");
  return payload as T;
}

export default function OrganizationSettings() {
  const { language } = usePreferences();
  const en = language === "en";
  const [tab, setTab] = useState<Tab>("branches");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "staff" });
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [lastInvite, setLastInvite] = useState<{ url: string; email: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "branches") setBranches(await requestJson<Branch[]>("/api/organization/branches"));
      if (tab === "staff") { setStaff(await requestJson<Staff[]>("/api/organization/staff")); setInvites(await requestJson<Invite[]>("/api/organization/staff/invites")); }
      if (tab === "roles") setRoles(await requestJson<Role[]>("/api/organization/roles"));
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? "Could not load clinic management." : "تعذر تحميل إدارة العيادة."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [tab]);
  const tabs = useMemo(() => en
    ? [
        { id: "branches" as const, label: "Branches", icon: Building2 },
        { id: "staff" as const, label: "Staff", icon: UsersRound },
        { id: "roles" as const, label: "Roles", icon: ShieldCheck },
        { id: "calendar" as const, label: "Clinic calendar", icon: CalendarClock },
        { id: "channels" as const, label: "Channels (WhatsApp/Telegram)", icon: MessageSquare },
        { id: "integrations" as const, label: "Integrations & API", icon: Zap },
      ]
    : [
        { id: "branches" as const, label: "الفروع", icon: Building2 },
        { id: "staff" as const, label: "الموظفون", icon: UsersRound },
        { id: "roles" as const, label: "الأدوار", icon: ShieldCheck },
        { id: "calendar" as const, label: "تقويم العيادة", icon: CalendarClock },
        { id: "channels" as const, label: "قنوات التواصل (واتساب، تليجرام، انستا)", icon: MessageSquare },
        { id: "integrations" as const, label: "الربط مع الأنظمة والماركتنج", icon: Zap },
      ], [en]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    setError("");
    try {
      if (tab === "branches") await requestJson("/api/organization/branches", { method: "POST", body: JSON.stringify({ name: form.name, address: form.address || null, phone: form.phone || null }) });
      if (tab === "roles") await requestJson("/api/organization/roles", { method: "POST", body: JSON.stringify({ name: form.name }) });
      setForm({ name: "", address: "", phone: "" });
      setShowCreate(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? "Could not save." : "تعذر الحفظ."));
      setLoading(false);
    }
  };

  const updateStaffRole = async (id: string, role: string) => {
    try {
      await requestJson(`/api/organization/staff/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ role }) });
      setStaff((current) => current.map((item) => item.id === id ? { ...item, role } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? "Could not update role." : "تعذر تحديث الدور."));
    }
  };

  const updateBranch = async (branch: Branch) => {
    const name = window.prompt(en ? "Branch name" : "اسم الفرع", branch.name)?.trim();
    if (!name || name === branch.name) return;
    try {
      const updated = await requestJson<Branch>(`/api/organization/branches/${encodeURIComponent(branch.id)}`, { method: "PATCH", body: JSON.stringify({ name }) });
      setBranches((current) => current.map((item) => item.id === branch.id ? { ...item, ...updated } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? "Could not update branch." : "تعذر تحديث الفرع."));
    }
  };

  const copyInviteLink = async (url: string) => {
    try {
      await navigator.clipboard?.writeText(url);
      toast.success(en ? "Invite link copied" : "تم نسخ رابط الدعوة");
    } catch {
      toast.info(en ? "Copy the link from the card shown" : "انسخ الرابط من البطاقة الظاهرة");
    }
  };

  const createInvite = async (payload: { email: string; role: string }) => {
    setInviteBusy(true);
    setInviteError("");
    try {
      const result = await requestJson<{ inviteUrl: string; message: string }>("/api/organization/staff/invites", { method: "POST", body: JSON.stringify(payload) });
      setLastInvite({ url: result.inviteUrl, email: payload.email });
      let copied = false;
      try { await navigator.clipboard?.writeText(result.inviteUrl); copied = true; } catch { /* clipboard permission is optional; the link stays visible */ }
      toast.success(copied ? (en ? "Invite created and link copied — share it with the staff member" : "تم إنشاء الدعوة ونسخ الرابط — شاركه مع الموظف") : (en ? "Invite created; copy the link from the card shown" : "تم إنشاء الدعوة؛ انسخ الرابط من البطاقة الظاهرة"));
      await load();
      return true;
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : (en ? "Could not create invite." : "تعذر إنشاء الدعوة."));
      return false;
    } finally {
      setInviteBusy(false);
    }
  };

  const submitInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { email: inviteForm.email, role: inviteForm.role };
    if (await createInvite(payload)) setInviteForm({ email: "", role: "staff" });
  };

  const revokeInvite = async (invite: Invite) => {
    if (!window.confirm(en ? `Revoke the invite for ${invite.email}?` : `إلغاء دعوة ${invite.email}؟`)) return;
    setInviteBusy(true);
    setInviteError("");
    try {
      const result = await requestJson<{ message?: string }>(`/api/organization/staff/invites/${encodeURIComponent(invite.id)}`, { method: "DELETE" });
      toast.success(result.message || (en ? "Invite revoked." : "تم إلغاء الدعوة."));
      if (lastInvite?.email === invite.email) setLastInvite(null);
      await load();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : (en ? "Could not revoke invite." : "تعذر إلغاء الدعوة."));
    } finally {
      setInviteBusy(false);
    }
  };

  const reissueInvite = async (invite: Invite) => {
    if (!window.confirm(en ? "Revoke the old link and create a new one for this invite?" : "إلغاء الرابط القديم وإنشاء رابط جديد لهذه الدعوة؟")) return;
    setInviteBusy(true);
    try {
      await requestJson(`/api/organization/staff/invites/${encodeURIComponent(invite.id)}`, { method: "DELETE" });
    } catch { /* the create call below surfaces any duplicate-invite error */ }
    setInviteBusy(false);
    await createInvite({ email: invite.email, role: invite.role });
  };

  return <section className="surface mt-6 p-6 md:p-7" dir="rtl"><div className="flex flex-col justify-between gap-4 border-b border-[#edf1f3] dark:border-[#1e3a4d] pb-5 sm:flex-row sm:items-center"><div><div className="flex items-center gap-3"><Building2 size={18} className="text-[#578b9d] dark:text-[#a8bfc9]" /><h2 className="font-bold text-[#23475b] dark:text-[#e2ecf1]">{en ? "Clinic Management" : "إدارة العيادة"}</h2></div><p className="mt-1 text-xs text-[#8999a1] dark:text-[#7e939e]">{en ? "Branches, staff, and real roles linked to the current clinic." : "الفروع، الموظفون، والأدوار الحقيقية المرتبطة بالعيادة الحالية."}</p></div><div className="flex items-center gap-2"><button onClick={() => setImportModalOpen(true)} className="quiet-button"><UploadCloud size={15} /> {en ? "Import data (Excel/PDF)" : "استيراد بيانات (إكسيل/PDF)"}</button><button onClick={() => void load()} disabled={loading} className="quiet-button"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> {en ? "Refresh" : "تحديث"}</button></div></div><div className="mt-5 flex flex-wrap gap-2">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setTab(id); setShowCreate(false); setError(""); }} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${tab === id ? "bg-[#3c7e93] text-white" : "border border-[#dbe5ea] dark:border-[#1e3a4d] text-[#66808e] dark:text-[#7e939e]"}`}><Icon size={15} /> {label}</button>)}{(tab === "branches" || tab === "roles") ? <button onClick={() => setShowCreate((value) => !value)} className="mr-auto flex items-center gap-1 rounded-xl border border-[#3c7e93]/30 px-3 py-2 text-xs font-bold text-[#3c7e93] dark:text-[#8cc3dd]"><Plus size={15} /> {en ? "Add" : "إضافة"}</button> : null}</div>{showCreate ? <form onSubmit={create} className="mt-4 grid gap-2 rounded-xl bg-[#f5f9fa] dark:bg-[#10222f] p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={tab === "branches" ? (en ? "Branch name" : "اسم الفرع") : (en ? "Role name" : "اسم الدور")} className="input-field" />{tab === "branches" ? <><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder={en ? "Address" : "العنوان"} className="input-field" /><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder={en ? "Phone number" : "رقم التواصل"} dir="ltr" className="input-field" /></> : <span /> }<button disabled={loading} className="primary-button"><Check size={15} /> {en ? "Save" : "حفظ"}</button></form> : null}{error ? <div className="mt-4 rounded-xl border border-[#edc4c0] dark:border-[#3d1f1b] bg-[#fff7f6] dark:bg-[#3d1f1b] p-3 text-xs text-[#a54c46] dark:text-[#eb9a90]">{error}</div> : null}{loading && !showCreate ? <div className="py-10 text-center text-xs text-[#8999a1] dark:text-[#7e939e]">{en ? "Loading..." : "جارٍ التحميل..."}</div> : null}{!loading && tab === "branches" ? <div className="mt-4 space-y-2">{branches.map((branch) => <div key={branch.id} className="flex items-center gap-3 rounded-xl border border-[#edf1f3] dark:border-[#1e3a4d] p-4"><span className="grid size-9 place-items-center rounded-lg bg-[#dcebef] dark:bg-[#143242] text-[#3c7e93] dark:text-[#8cc3dd]"><Building2 size={16} /></span><div className="min-w-0 flex-1"><strong className="block text-xs dark:text-[#e2ecf1]">{branch.name}</strong><span className="mt-1 block text-[10px] text-[#8999a1] dark:text-[#7e939e]">{branch.address || (en ? "No address" : "لا يوجد عنوان")}{branch.phone ? ` · ${branch.phone}` : ""}</span></div><span className={`rounded-md px-2 py-1 text-[10px] font-bold ${branch.is_active === false ? "bg-[#fff7f6] dark:bg-[#3d1f1b] text-[#a54c46] dark:text-[#eb9a90]" : "bg-[#f2faf6] dark:bg-[#123528] text-[#39755f] dark:text-[#7fd0b4]"}`}>{branch.is_active === false ? (en ? "Inactive" : "متوقف") : (en ? "Active" : "نشط")}</span><button onClick={() => void updateBranch(branch)} className="rounded-lg border px-2.5 py-1.5 text-[10px] font-bold dark:border-[#1e3a4d] dark:text-[#e2ecf1]">{en ? "Edit" : "تعديل"}</button></div>)}{branches.length === 0 ? <Empty label={en ? "No branches registered." : "لا توجد فروع مسجلة."} /> : null}</div> : null}{!loading && tab === "staff" ? <div className="mt-4 space-y-2">{staff.map((member) => { const name = member.user?.display_name || member.user?.full_name || member.user_id; return <div key={member.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#edf1f3] dark:border-[#1e3a4d] p-4"><span className="grid size-9 place-items-center rounded-full bg-[#dcebef] dark:bg-[#143242] text-[#3c7e93] dark:text-[#8cc3dd] text-xs font-bold">{name.slice(0, 2)}</span><div className="min-w-[180px] flex-1"><strong className="block text-xs dark:text-[#e2ecf1]">{name}</strong><span className="mt-1 block text-[10px] text-[#8999a1] dark:text-[#7e939e]">{member.user?.status || (en ? "Unspecified status" : "حالة غير محددة")} · {member.user?.last_login_at ? `${en ? "Last login" : "آخر دخول"} ${new Date(member.user.last_login_at).toLocaleDateString(en ? "en-EG" : "ar-EG")}` : (en ? "Never logged in" : "لم يسجل دخولاً بعد")}</span></div><select value={member.role || ""} onChange={(event) => void updateStaffRole(member.id, event.target.value)} className="input-field max-w-[180px] py-2 text-xs"><option value="">{en ? "Select role" : "اختر الدور"}</option><option value="owner">{en ? "Clinic owner" : "مالك العيادة"}</option><option value="admin">{en ? "Admin" : "مدير"}</option><option value="staff">{en ? "Staff" : "موظف"}</option></select></div>; })}{staff.length === 0 ? <Empty label={en ? "No staff linked to this clinic." : "لا يوجد موظفون مرتبطون بهذه العيادة."} /> : null}<div className="mt-6 rounded-xl border border-[#dbe5ea] dark:border-[#1e3a4d] p-4"><div className="flex items-center gap-2"><UserPlus size={16} className="text-[#3c7e93] dark:text-[#8cc3dd]" /><h3 className="text-xs font-bold text-[#23475b] dark:text-[#e2ecf1]">{en ? "Invite staff member" : "دعوة موظف"}</h3></div><p className="mt-1 text-[10px] leading-5 text-[#8999a1] dark:text-[#7e939e]">{en ? "No email is sent; copy the invite link and share it with the staff member." : "لا يتم إرسال بريد إلكتروني؛ انسخ رابط الدعوة وشاركه مع الموظف."}</p><form onSubmit={(event) => void submitInvite(event)} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]"><input required type="email" dir="ltr" value={inviteForm.email} onChange={(event) => setInviteForm({ ...inviteForm, email: event.target.value })} placeholder={en ? "staff@email.com" : "البريد الإلكتروني"} className="input-field" data-testid="input-invite-email" /><select value={inviteForm.role} onChange={(event) => setInviteForm({ ...inviteForm, role: event.target.value })} className="input-field py-2 text-xs" data-testid="select-invite-role"><option value="staff">{en ? "Staff" : "موظف"}</option><option value="admin">{en ? "Admin" : "مدير"}</option></select><button disabled={inviteBusy} className="primary-button" data-testid="button-create-invite"><UserPlus size={15} /> {inviteBusy ? (en ? "Working..." : "جارٍ التنفيذ...") : (en ? "Create invite" : "إنشاء الدعوة")}</button></form>{inviteError ? <div className="mt-3 rounded-xl border border-[#edc4c0] dark:border-[#3d1f1b] bg-[#fff7f6] dark:bg-[#3d1f1b] p-3 text-xs text-[#a54c46] dark:text-[#eb9a90]" role="alert">{inviteError}</div> : null}{lastInvite ? <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-[#dbe5ea] dark:border-[#1e3a4d] p-3 text-xs"><Copy size={15} className="text-[#3c7e93] dark:text-[#a8bfc9]" /><span className="text-[#527080] dark:text-[#a8bfc9]">{en ? `Invite link for ${lastInvite.email}:` : `رابط دعوة ${lastInvite.email}:`}</span><code className="min-w-0 flex-1 truncate" dir="ltr">{lastInvite.url}</code><button type="button" className="quiet-button" onClick={() => void copyInviteLink(lastInvite.url)} data-testid="button-copy-invite"><Copy size={14} /> {en ? "Copy" : "نسخ"}</button></div> : null}{invites.length ? <div className="mt-3 space-y-2">{invites.map((invite) => <div key={invite.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#edf1f3] dark:border-[#1e3a4d] p-3" data-testid={`row-invite-${invite.id}`}><span className="grid size-9 place-items-center rounded-lg bg-[#dcebef] dark:bg-[#143242] text-[#3c7e93] dark:text-[#8cc3dd]"><UserPlus size={15} /></span><div className="min-w-[160px] flex-1"><strong className="block text-xs dark:text-[#e2ecf1]" dir="ltr">{invite.email}</strong><span className="mt-1 block text-[10px] text-[#8999a1] dark:text-[#7e939e]">{inviteRoleLabels[invite.role]?.[en ? "en" : "ar"] || invite.role}{invite.expiresAt ? ` · ${en ? "expires" : "تنتهي"} ${new Date(invite.expiresAt).toLocaleDateString(en ? "en-EG" : "ar-EG")}` : ""}</span></div><button type="button" disabled={inviteBusy} onClick={() => void reissueInvite(invite)} className="rounded-lg border px-2.5 py-1.5 text-[10px] font-bold dark:border-[#1e3a4d] dark:text-[#e2ecf1]"><Copy size={12} className="inline" /> {en ? "New link" : "رابط جديد"}</button><button type="button" disabled={inviteBusy} onClick={() => void revokeInvite(invite)} className="rounded-lg border border-[#edc4c0] px-2.5 py-1.5 text-[10px] font-bold text-[#a54c46] dark:border-[#3d1f1b] dark:text-[#eb9a90]"><Trash2 size={12} className="inline" /> {en ? "Revoke" : "إلغاء"}</button></div>)}</div> : null}</div></div> : null}{!loading && tab === "calendar" ? <div className="mt-5"><ClinicCalendarSetup /></div> : null}{!loading && tab === "channels" ? <div className="mt-5"><ChannelConnectionsManager /></div> : null}{!loading && tab === "integrations" ? <div className="mt-5"><IntegrationsHub /></div> : null}
    <SmartDataImportModal isOpen={importModalOpen} onClose={() => { setImportModalOpen(false); void load(); }} defaultType="services" />
</section>;
}

function Empty({ label }: { label: string }) { return <div className="rounded-xl border border-dashed border-[#dbe5ea] dark:border-[#1e3a4d] p-8 text-center text-xs text-[#8999a1] dark:text-[#7e939e]">{label}</div>; }
