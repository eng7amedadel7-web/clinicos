import { useEffect, useMemo, useState } from "react";
import { Building2, Check, Plus, RefreshCw, ShieldCheck, UsersRound } from "lucide-react";

type Branch = { id: string; name: string; address?: string | null; phone?: string | null; is_active?: boolean };
type Role = { id: string; clinic_id?: string | null; name: string; role_type?: string };
type Staff = { id: string; user_id: string; role?: string | null; user?: { full_name?: string | null; display_name?: string | null; status?: string | null; last_login_at?: string | null } | null; assignments?: Array<{ roles?: { name?: string | null } | null; branch_id?: string | null }> };

type Tab = "branches" | "staff" | "roles";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const payload = await response.json().catch(() => null) as T | { error?: string } | null;
  if (!response.ok) throw new Error(payload && typeof payload === "object" && payload && "error" in payload && typeof payload.error === "string" ? payload.error : "تعذر تنفيذ العملية.");
  return payload as T;
}

export default function OrganizationSettings() {
  const [tab, setTab] = useState<Tab>("branches");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "branches") setBranches(await requestJson<Branch[]>("/api/organization/branches"));
      if (tab === "staff") setStaff(await requestJson<Staff[]>("/api/organization/staff"));
      if (tab === "roles") setRoles(await requestJson<Role[]>("/api/organization/roles"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل إدارة العيادة.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [tab]);
  const tabs = useMemo(() => [{ id: "branches" as const, label: "الفروع", icon: Building2 }, { id: "staff" as const, label: "الموظفون", icon: UsersRound }, { id: "roles" as const, label: "الأدوار", icon: ShieldCheck }], []);

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
      setError(err instanceof Error ? err.message : "تعذر الحفظ.");
      setLoading(false);
    }
  };

  const updateStaffRole = async (id: string, role: string) => {
    try {
      await requestJson(`/api/organization/staff/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ role }) });
      setStaff((current) => current.map((item) => item.id === id ? { ...item, role } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحديث الدور.");
    }
  };

  const updateBranch = async (branch: Branch) => {
    const name = window.prompt("اسم الفرع", branch.name)?.trim();
    if (!name || name === branch.name) return;
    try {
      const updated = await requestJson<Branch>(`/api/organization/branches/${encodeURIComponent(branch.id)}`, { method: "PATCH", body: JSON.stringify({ name }) });
      setBranches((current) => current.map((item) => item.id === branch.id ? { ...item, ...updated } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحديث الفرع.");
    }
  };

  return <section className="surface mt-6 p-6 md:p-7" dir="rtl"><div className="flex flex-col justify-between gap-4 border-b border-[#edf1f3] pb-5 sm:flex-row sm:items-center"><div><div className="flex items-center gap-3"><Building2 size={18} className="text-[#578b9d]" /><h2 className="font-bold text-[#23475b]">إدارة العيادة</h2></div><p className="mt-1 text-xs text-[#8999a1]">الفروع، الموظفون، والأدوار الحقيقية المرتبطة بالعيادة الحالية.</p></div><button onClick={() => void load()} disabled={loading} className="quiet-button"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> تحديث</button></div><div className="mt-5 flex flex-wrap gap-2">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setTab(id); setShowCreate(false); setError(""); }} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${tab === id ? "bg-[#3c7e93] text-white" : "border border-[#dbe5ea] text-[#66808e]"}`}><Icon size={15} /> {label}</button>)}{(tab === "branches" || tab === "roles") ? <button onClick={() => setShowCreate((value) => !value)} className="mr-auto flex items-center gap-1 rounded-xl border border-[#3c7e93]/30 px-3 py-2 text-xs font-bold text-[#3c7e93]"><Plus size={15} /> إضافة</button> : null}</div>{showCreate ? <form onSubmit={create} className="mt-4 grid gap-2 rounded-xl bg-[#f5f9fa] p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={tab === "branches" ? "اسم الفرع" : "اسم الدور"} className="input-field" />{tab === "branches" ? <><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="العنوان" className="input-field" /><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="رقم التواصل" dir="ltr" className="input-field" /></> : <span /> }<button disabled={loading} className="primary-button"><Check size={15} /> حفظ</button></form> : null}{error ? <div className="mt-4 rounded-xl border border-[#edc4c0] bg-[#fff7f6] p-3 text-xs text-[#a54c46]">{error}</div> : null}{loading && !showCreate ? <div className="py-10 text-center text-xs text-[#8999a1]">جارٍ التحميل...</div> : null}{!loading && tab === "branches" ? <div className="mt-4 space-y-2">{branches.map((branch) => <div key={branch.id} className="flex items-center gap-3 rounded-xl border border-[#edf1f3] p-4"><span className="grid size-9 place-items-center rounded-lg bg-[#dcebef] text-[#3c7e93]"><Building2 size={16} /></span><div className="min-w-0 flex-1"><strong className="block text-xs">{branch.name}</strong><span className="mt-1 block text-[10px] text-[#8999a1]">{branch.address || "لا يوجد عنوان"}{branch.phone ? ` · ${branch.phone}` : ""}</span></div><span className={`rounded-md px-2 py-1 text-[10px] font-bold ${branch.is_active === false ? "bg-[#fff7f6] text-[#a54c46]" : "bg-[#f2faf6] text-[#39755f]"}`}>{branch.is_active === false ? "متوقف" : "نشط"}</span><button onClick={() => void updateBranch(branch)} className="rounded-lg border px-2.5 py-1.5 text-[10px] font-bold">تعديل</button></div>)}{branches.length === 0 ? <Empty label="لا توجد فروع مسجلة." /> : null}</div> : null}{!loading && tab === "staff" ? <div className="mt-4 space-y-2">{staff.map((member) => { const name = member.user?.display_name || member.user?.full_name || member.user_id; return <div key={member.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#edf1f3] p-4"><span className="grid size-9 place-items-center rounded-full bg-[#dcebef] text-[#3c7e93] text-xs font-bold">{name.slice(0, 2)}</span><div className="min-w-[180px] flex-1"><strong className="block text-xs">{name}</strong><span className="mt-1 block text-[10px] text-[#8999a1]">{member.user?.status || "حالة غير محددة"} · {member.user?.last_login_at ? `آخر دخول ${new Date(member.user.last_login_at).toLocaleDateString("ar-EG")}` : "لم يسجل دخولاً بعد"}</span></div><select value={member.role || ""} onChange={(event) => void updateStaffRole(member.id, event.target.value)} className="input-field max-w-[180px] py-2 text-xs"><option value="">اختر الدور</option><option value="owner">مالك العيادة</option><option value="admin">مدير</option><option value="reception">استقبال</option><option value="doctor">طبيب</option><option value="staff">موظف</option></select></div>; })}{staff.length === 0 ? <Empty label="لا يوجد موظفون مرتبطون بهذه العيادة." /> : null}</div> : null}{!loading && tab === "roles" ? <div className="mt-4 space-y-2">{roles.map((role) => <div key={role.id} className="flex items-center gap-3 rounded-xl border border-[#edf1f3] p-4"><span className="grid size-9 place-items-center rounded-lg bg-[#f0ecf8] text-[#7568a0]"><ShieldCheck size={16} /></span><div className="flex-1"><strong className="block text-xs">{role.name}</strong><span className="text-[10px] text-[#8999a1]">{role.role_type || "دور مخصص"}{role.clinic_id ? " · خاص بالعيادة" : " · أساسي"}</span></div></div>)}{roles.length === 0 ? <Empty label="لا توجد أدوار متاحة." /> : null}</div> : null}</section>;
}

function Empty({ label }: { label: string }) { return <div className="rounded-xl border border-dashed border-[#dbe5ea] p-8 text-center text-xs text-[#8999a1]">{label}</div>; }
