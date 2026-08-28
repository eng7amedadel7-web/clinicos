import { Router } from "express";
import { z } from "zod";
import { requireClinicPermission, respondToPermissionError } from "../lib/permissions";
import { supabaseRequest } from "../lib/supabase";

type Session = { clinicId: string; userId: string; accessToken: string };
type Row = Record<string, unknown>;
const router = Router();
const branchSchema = z.object({ name: z.string().trim().min(2).max(160), address: z.string().trim().max(240).nullable().optional(), phone: z.string().trim().max(40).nullable().optional(), isActive: z.boolean().optional() });
const roleSchema = z.object({ name: z.string().trim().min(2).max(120) });
const headers = (session: Session, extra: Record<string, string> = {}) => ({ Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json", ...extra });
const clinic = (session: Session) => encodeURIComponent(session.clinicId);

async function protect(req: Parameters<typeof requireClinicPermission>[0], res: Parameters<typeof respondToPermissionError>[0], module: "Settings" | "Users", resource: "clinic_settings" | "users", action: "read" | "manage") {
  try { return await requireClinicPermission(req, module, resource, action); } catch (error) { respondToPermissionError(res, error); return null; }
}

function sendFailure(res: Parameters<typeof respondToPermissionError>[0], result: { ok: boolean; status: number }, fallback: string) {
  if (!result.ok) { res.status(result.status || 502).json({ error: fallback }); return true; }
  return false;
}

router.get("/organization/branches", async (req, res) => {
  const session = await protect(req, res, "Settings", "clinic_settings", "read");
  if (!session) return;
  const result = await supabaseRequest<Row[]>(`/rest/v1/branches?select=id,name,address,phone,is_active,created_at,updated_at&clinic_id=eq.${clinic(session)}&deleted_at=is.null&order=name&limit=200`, { headers: headers(session) });
  if (sendFailure(res, result, "تعذر تحميل الفروع.")) return;
  res.json(result.data ?? []);
});

router.post("/organization/branches", async (req, res) => {
  const session = await protect(req, res, "Settings", "clinic_settings", "manage");
  if (!session) return;
  const parsed = branchSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "بيانات الفرع غير صالحة." }); return; }
  const result = await supabaseRequest<Row[]>("/rest/v1/branches", { method: "POST", headers: headers(session, { Prefer: "return=representation" }), body: JSON.stringify({ clinic_id: session.clinicId, name: parsed.data.name, address: parsed.data.address ?? null, phone: parsed.data.phone ?? null, ...(parsed.data.isActive === undefined ? {} : { is_active: parsed.data.isActive }) }) });
  if (sendFailure(res, result, "تعذر إنشاء الفرع.")) return;
  res.status(201).json(result.data?.[0] ?? null);
});

router.patch("/organization/branches/:id", async (req, res) => {
  const session = await protect(req, res, "Settings", "clinic_settings", "manage");
  if (!session) return;
  const parsed = branchSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "بيانات الفرع غير صالحة." }); return; }
  const current = await supabaseRequest<Row[]>(`/rest/v1/branches?select=id&clinic_id=eq.${clinic(session)}&id=eq.${encodeURIComponent(req.params.id)}&deleted_at=is.null&limit=1`, { headers: headers(session) });
  if (sendFailure(res, current, "تعذر التحقق من الفرع.")) return;
  if (!current.data?.length) { res.status(404).json({ error: "الفرع غير موجود في هذه العيادة." }); return; }
  const { isActive, ...fields } = parsed.data;
  const result = await supabaseRequest<Row[]>(`/rest/v1/branches?id=eq.${encodeURIComponent(req.params.id)}&clinic_id=eq.${clinic(session)}&deleted_at=is.null`, { method: "PATCH", headers: headers(session, { Prefer: "return=representation" }), body: JSON.stringify({ ...fields, ...(isActive === undefined ? {} : { is_active: isActive }), updated_at: new Date().toISOString() }) });
  if (sendFailure(res, result, "تعذر تحديث الفرع.")) return;
  res.json(result.data?.[0] ?? null);
});

router.delete("/organization/branches/:id", async (req, res) => {
  const session = await protect(req, res, "Settings", "clinic_settings", "manage");
  if (!session) return;
  const result = await supabaseRequest<Row[]>(`/rest/v1/branches?id=eq.${encodeURIComponent(req.params.id)}&clinic_id=eq.${clinic(session)}&deleted_at=is.null`, { method: "PATCH", headers: headers(session), body: JSON.stringify({ deleted_at: new Date().toISOString(), is_active: false }) });
  if (sendFailure(res, result, "تعذر حذف الفرع.")) return;
  res.json({ success: true, message: "تم حذف الفرع بنجاح." });
});

router.get("/organization/staff", async (req, res) => {
  const session = await protect(req, res, "Users", "users", "read");
  if (!session) return;
  const staff = await supabaseRequest<Row[]>(`/rest/v1/clinic_staff?select=id,clinic_id,user_id,role,created_at,telegram_chat_id,telegram_verified_at&clinic_id=eq.${clinic(session)}&order=created_at.desc&limit=200`, { headers: headers(session) });
  if (sendFailure(res, staff, "تعذر تحميل فريق العيادة.")) return;
  const staffRows = staff.data ?? [];
  const userIds = Array.from(new Set(staffRows.map((item) => typeof item.user_id === "string" ? item.user_id : "").filter(Boolean)));
  const users = userIds.length ? await supabaseRequest<Row[]>(`/rest/v1/users?select=id,full_name,display_name,avatar_url,status,last_login_at&id=in.(${userIds.map(encodeURIComponent).join(",")})&deleted_at=is.null&limit=200`, { headers: headers(session) }) : { ok: true, status: 200, data: [] as Row[] };
  if (sendFailure(res, users, "تعذر تحميل بيانات أعضاء الفريق.")) return;
  const roles = await supabaseRequest<Row[]>(`/rest/v1/user_roles?select=user_id,role_id,branch_id,roles(id,name,role_type)&clinic_id=eq.${clinic(session)}&limit=500`, { headers: headers(session) });
  if (sendFailure(res, roles, "تعذر تحميل صلاحيات الفريق.")) return;
  const usersById = new Map((users.data ?? []).map((item) => [String(item.id), item]));
  res.json(staffRows.map((item) => ({ ...item, user: usersById.get(String(item.user_id)) ?? null, assignments: (roles.data ?? []).filter((assignment) => assignment.user_id === item.user_id) })));
});

router.patch("/organization/staff/:id", async (req, res) => {
  const session = await protect(req, res, "Users", "users", "manage");
  if (!session) return;
  const role = z.string().trim().min(1).max(80).safeParse(req.body?.role);
  if (!role.success) { res.status(400).json({ error: "الدور غير صالح." }); return; }
  const current = await supabaseRequest<Row[]>(`/rest/v1/clinic_staff?select=id&clinic_id=eq.${clinic(session)}&id=eq.${encodeURIComponent(req.params.id)}&limit=1`, { headers: headers(session) });
  if (sendFailure(res, current, "تعذر التحقق من عضو الفريق.")) return;
  if (!current.data?.length) { res.status(404).json({ error: "عضو الفريق غير موجود في هذه العيادة." }); return; }
  const result = await supabaseRequest<Row[]>(`/rest/v1/clinic_staff?id=eq.${encodeURIComponent(req.params.id)}&clinic_id=eq.${clinic(session)}`, { method: "PATCH", headers: headers(session, { Prefer: "return=representation" }), body: JSON.stringify({ role: role.data }) });
  if (sendFailure(res, result, "تعذر تحديث دور عضو الفريق.")) return;
  res.json(result.data?.[0] ?? null);
});

router.get("/organization/roles", async (req, res) => {
  const session = await protect(req, res, "Users", "users", "read");
  if (!session) return;
  const result = await supabaseRequest<Row[]>(`/rest/v1/roles?select=id,clinic_id,name,role_type,created_at,updated_at&or=(clinic_id.is.null,clinic_id.eq.${clinic(session)})&deleted_at=is.null&order=role_type,name&limit=200`, { headers: headers(session) });
  if (sendFailure(res, result, "تعذر تحميل الأدوار.")) return;
  res.json(result.data ?? []);
});

router.post("/organization/roles", async (req, res) => {
  const session = await protect(req, res, "Users", "users", "manage");
  if (!session) return;
  const parsed = roleSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "اسم الدور غير صالح." }); return; }
  const result = await supabaseRequest<Row[]>("/rest/v1/roles", { method: "POST", headers: headers(session, { Prefer: "return=representation" }), body: JSON.stringify({ clinic_id: session.clinicId, name: parsed.data.name, role_type: "custom" }) });
  if (sendFailure(res, result, "تعذر إنشاء الدور.")) return;
  res.status(201).json(result.data?.[0] ?? null);
});

router.patch("/organization/roles/:id", async (req, res) => {
  const session = await protect(req, res, "Users", "users", "manage");
  if (!session) return;
  const parsed = roleSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "اسم الدور غير صالح." }); return; }
  const result = await supabaseRequest<Row[]>(`/rest/v1/roles?id=eq.${encodeURIComponent(req.params.id)}&clinic_id=eq.${clinic(session)}&deleted_at=is.null`, { method: "PATCH", headers: headers(session, { Prefer: "return=representation" }), body: JSON.stringify({ name: parsed.data.name }) });
  if (sendFailure(res, result, "تعذر تحديث الدور.")) return;
  if (!result.data?.length) { res.status(404).json({ error: "الدور غير موجود في هذه العيادة." }); return; }
  res.json(result.data[0]);
});

export default router;
