import { Router, type Request } from "express";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { requireClinicPermission, requireSession, respondToPermissionError } from "../lib/permissions";
import { supabaseAdminRequest, supabaseAuthRequest, supabaseRequest } from "../lib/supabase";

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

// ---------------------------------------------------------------------------
// Staff invites — built on the live database machinery: the staff_role enum
// (owner/admin/staff), the staff_email_invites table, and its SECURITY DEFINER
// RPCs (issue/revoke/accept) which carry their own authority checks and audit
// logging. Raw tokens are never stored — the RPCs receive a SHA-256 hex digest
// and the raw token only ever lives inside the shareable invite link.
// ---------------------------------------------------------------------------
const INVITE_ROLES = ["owner", "admin", "staff"] as const;
const inviteSchema = z.object({ email: z.string().email(), role: z.enum(["owner", "admin", "staff"]) });
const acceptInviteSchema = z.object({ token: z.string().trim().min(20).max(200), password: z.string().min(8).optional() });
const PENDING_INVITE_STATUSES = "pending,sent,delivery_failed";

function publicAppOrigin(req: Request): string {
  if (process.env.PUBLIC_APP_URL?.trim()) return process.env.PUBLIC_APP_URL.trim().replace(/\/+$/, "");
  const host = req.get("host") || "localhost:5000";
  const proto = req.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function hashInviteToken(token: string) { return createHash("sha256").update(token).digest("hex"); }

type AuthAdminUser = { id?: string; email?: string };

// Resolve an existing auth user by email through the admin API. Accepts an
// exact single match only — if a GoTrue version ignores the email filter and
// returns a list page, fall back to a bounded paginated scan so a wrong user
// can never be attached.
async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const filtered = await supabaseAdminRequest<AuthAdminUser[]>(`/auth/v1/admin/users?email=eq.${encodeURIComponent(email)}&per_page=2`);
  if (filtered.ok && Array.isArray(filtered.data)) {
    const matches = filtered.data.filter((item) => typeof item?.id === "string" && String(item?.email ?? "").trim().toLowerCase() === email);
    if (matches.length === 1) return matches[0].id ?? null;
  }
  for (let page = 1; page <= 10; page += 1) {
    const listing = await supabaseAdminRequest<AuthAdminUser[]>(`/auth/v1/admin/users?page=${page}&per_page=200`);
    if (!listing.ok || !Array.isArray(listing.data) || listing.data.length === 0) return null;
    const match = listing.data.find((item) => typeof item?.id === "string" && String(item?.email ?? "").trim().toLowerCase() === email);
    if (match?.id) return match.id;
  }
  return null;
}

// Create the auth account exactly like register.ts: service-role admin create
// with auto email confirm first; "already exists" resolves to the attach path;
// anything else falls back to public signup with the same password.
async function resolveInviteAuthUser(email: string, fullName: string, password: string | undefined): Promise<{ userId: string | null; accountCreated: boolean }> {
  if (!password) return { userId: await findAuthUserIdByEmail(email), accountCreated: false };
  const adminCreate = await supabaseAdminRequest<AuthAdminUser & { msg?: string; error?: string; message?: string }>("/auth/v1/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: fullName } }),
  });
  if (adminCreate.ok && adminCreate.data?.id) return { userId: adminCreate.data.id, accountCreated: true };
  const adminErrorText = String(adminCreate.data?.error || adminCreate.data?.msg || adminCreate.data?.message || "");
  if (/already\s+registered|already\s+exists|duplicate/i.test(adminErrorText)) return { userId: await findAuthUserIdByEmail(email), accountCreated: false };
  const signup = await supabaseAuthRequest<{ user?: { id?: string }; msg?: string; message?: string; error_description?: string }>("/auth/v1/signup", {
    email,
    password,
    data: { full_name: fullName },
  });
  if (signup.ok && signup.data?.user?.id) return { userId: signup.data.user.id, accountCreated: true };
  const signupErrorText = String(signup.data?.msg || signup.data?.error_description || signup.data?.message || "");
  if (/already\s+registered|already\s+exists/i.test(signupErrorText)) return { userId: await findAuthUserIdByEmail(email), accountCreated: false };
  return { userId: null, accountCreated: false };
}

async function loadInviteByTokenHash(tokenHash: string) {
  const invites = await supabaseAdminRequest<Row[]>(`/rest/v1/staff_email_invites?select=id,clinic_id,email,staff_role,status,expires_at,accepted_at&token_hash=eq.${tokenHash}&limit=1`);
  return invites;
}

function inviteValidityError(invite: Row): { status: number; error: string } | null {
  if (invite.status === "accepted") return { status: 410, error: "تم استخدام هذه الدعوة من قبل." };
  if (invite.status === "revoked") return { status: 410, error: "تم إلغاء هذه الدعوة. اطلب من مالك العيادة إنشاء دعوة جديدة." };
  if (invite.status === "delivery_failed") return { status: 410, error: "هذه الدعوة لم تعد صالحة. اطلب من مالك العيادة إنشاء دعوة جديدة." };
  if (typeof invite.expires_at === "string" && new Date(invite.expires_at) <= new Date()) return { status: 410, error: "انتهت صلاحية رابط الدعوة. اطلب من مالك العيادة إنشاء دعوة جديدة." };
  return null;
}

// accept_staff_email_invite is SECURITY DEFINER and requires the invited user's
// own auth.uid(), so the RPC must run under a Supabase JWT belonging to the
// invitee — never the service role. The password path signs in as the freshly
// confirmed account to obtain that JWT.
async function signInForInvite(email: string, password: string): Promise<string | null> {
  const token = await supabaseAuthRequest<{ access_token?: string }>("/auth/v1/token?grant_type=password", { email, password });
  return token.ok && token.data?.access_token ? token.data.access_token : null;
}

router.post("/organization/staff/invites", async (req, res) => {
  const session = await protect(req, res, "Users", "users", "manage");
  if (!session) return;
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "يرجى إدخال بريد إلكتروني صحيح ودور صالح." }); return; }
  const token = randomBytes(32).toString("hex");
  const issued = await supabaseRequest<Row[]>("/rest/v1/rpc/issue_staff_email_invite", {
    method: "POST",
    headers: headers(session),
    body: JSON.stringify({
      p_clinic_id: session.clinicId,
      p_email: parsed.data.email.trim().toLowerCase(),
      p_staff_role: parsed.data.role,
      p_role_id: null,
      p_branch_id: null,
      p_token_hash: hashInviteToken(token),
      p_inviter_id: session.userId,
    }),
  });
  if (sendFailure(res, issued, "تعذر إنشاء الدعوة.")) return;
  res.status(201).json({
    invite: issued.data?.[0] ?? null,
    inviteUrl: `${publicAppOrigin(req)}/accept-invite?token=${token}`,
    message: "تم إنشاء رابط الدعوة. لم يتم إرسال أي بريد إلكتروني؛ انسخ الرابط وشاركه مع الموظف.",
  });
});

router.get("/organization/staff/invites", async (req, res) => {
  const session = await protect(req, res, "Users", "users", "read");
  if (!session) return;
  const invites = await supabaseAdminRequest<Row[]>(`/rest/v1/staff_email_invites?select=id,email,staff_role,status,expires_at,created_at&clinic_id=eq.${clinic(session)}&status=in.(${PENDING_INVITE_STATUSES})&order=created_at.desc&limit=100`);
  if (sendFailure(res, invites, "تعذر تحميل الدعوات.")) return;
  res.json((invites.data ?? []).map((item) => ({ id: String(item.id ?? ""), email: String(item.email ?? ""), role: String(item.staff_role ?? ""), status: String(item.status ?? ""), expiresAt: item.expires_at ? String(item.expires_at) : null, createdAt: item.created_at ? String(item.created_at) : null })));
});

router.delete("/organization/staff/invites/:id", async (req, res) => {
  const session = await protect(req, res, "Users", "users", "manage");
  if (!session) return;
  const revoked = await supabaseRequest<Row[]>("/rest/v1/rpc/revoke_staff_email_invite", {
    method: "POST",
    headers: headers(session),
    body: JSON.stringify({ p_invite_id: req.params.id, p_revoker_id: session.userId }),
  });
  if (sendFailure(res, revoked, "تعذر إلغاء الدعوة.")) return;
  res.json({ success: true, message: "تم إلغاء الدعوة بنجاح." });
});

// Public preview for the accept-invite page (no session): resolves the token
// server-side and only exposes clinic name, email, and role.
router.get("/accept-invite/preview", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token.trim() : "";
  if (token.length < 20) { res.status(400).json({ error: "رابط الدعوة غير صالح." }); return; }
  const invites = await loadInviteByTokenHash(hashInviteToken(token));
  if (sendFailure(res, invites, "تعذر التحقق من رابط الدعوة.")) return;
  const invite = invites.data?.[0];
  if (!invite?.clinic_id) { res.status(404).json({ error: "رابط الدعوة غير صالح." }); return; }
  const invalid = inviteValidityError(invite);
  if (invalid) { res.status(invalid.status).json(invalid); return; }
  const clinicRow = await supabaseAdminRequest<Row[]>(`/rest/v1/clinics?select=name&deleted_at=is.null&id=eq.${encodeURIComponent(String(invite.clinic_id))}&limit=1`);
  if (sendFailure(res, clinicRow, "تعذر تحميل بيانات العيادة.")) return;
  res.json({ clinicName: clinicRow.data?.[0]?.name ? String(clinicRow.data[0].name) : "", email: String(invite.email ?? ""), role: String(invite.staff_role ?? ""), expiresAt: invite.expires_at ? String(invite.expires_at) : null });
});

// Public accept endpoint: the RPC does the authoritative work under the
// invitee's own identity. Either a signed-in session matching the invited
// email is supplied (cookie), or a password to create/attach the account and
// sign in server-side.
router.post("/accept-invite", async (req, res) => {
  const parsed = acceptInviteSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "رابط الدعوة غير صالح أو كلمة المرور أقل من 8 أحرف." }); return; }
  const tokenHash = hashInviteToken(parsed.data.token.trim());
  const invites = await loadInviteByTokenHash(tokenHash);
  if (sendFailure(res, invites, "تعذر التحقق من رابط الدعوة.")) return;
  const invite = invites.data?.[0];
  if (!invite?.clinic_id) { res.status(404).json({ error: "رابط الدعوة غير صالح." }); return; }
  const invalid = inviteValidityError(invite);
  if (invalid) { res.status(invalid.status).json(invalid); return; }
  const role = String(invite.staff_role ?? "").trim().toLowerCase();
  if (!(INVITE_ROLES as readonly string[]).includes(role)) { res.status(400).json({ error: "دور الدعوة غير معروف. اطلب دعوة جديدة." }); return; }
  const email = String(invite.email ?? "").trim().toLowerCase();

  // Prefer the caller's own session when it already belongs to the invitee.
  let userToken: string | null = null;
  try {
    const sessionPayload = requireSession(req);
    const inviteeUserId = await findAuthUserIdByEmail(email);
    if (inviteeUserId && sessionPayload.userId === inviteeUserId) userToken = sessionPayload.accessToken;
  } catch {
    // No session cookie — fall through to the password path.
  }

  let accountCreated = false;
  if (!userToken && parsed.data.password) {
    const fullName = email.split("@")[0];
    const resolved = await resolveInviteAuthUser(email, fullName, parsed.data.password);
    if (!resolved.userId) { res.status(502).json({ error: "تعذر تجهيز حساب الموظف بهذا البريد. تواصل مع الدعم." }); return; }
    accountCreated = resolved.accountCreated;
    if (!accountCreated) {
      // Account already existed and the password may differ from it — try the
      // supplied password; a failure means the invitee must sign in themselves.
      userToken = await signInForInvite(email, parsed.data.password);
      if (!userToken) { res.status(401).json({ error: "هذا البريد مسجل بالفعل بكلمة مرور أخرى. سجّل الدخول أولاً ثم افتح رابط الدعوة مرة أخرى." }); return; }
    } else {
      userToken = await signInForInvite(email, parsed.data.password ?? "");
    }
  }

  if (!userToken) { res.status(400).json({ error: "هذا البريد غير مسجل بعد؛ أدخل كلمة مرور لإكمال إنشاء الحساب، أو سجّل الدخول بنفس بريد الدعوة ثم افتح الرابط." }); return; }

  const accepted = await supabaseRequest<Row[]>("/rest/v1/rpc/accept_staff_email_invite", {
    method: "POST",
    headers: { Authorization: `Bearer ${userToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_token_hash: tokenHash }),
  });
  if (!accepted.ok) {
    const rpcBody = (accepted.data as unknown as Row | Row[] | undefined);
    const rpcErrorText = String(
      (!Array.isArray(rpcBody) && rpcBody ? (rpcBody.message || rpcBody.error) : "") || "",
    );
    if (/already\s+been\s+accepted/i.test(rpcErrorText)) { res.status(410).json({ error: "تم استخدام هذه الدعوة من قبل." }); return; }
    if (/sign in using the email/i.test(rpcErrorText)) { res.status(403).json({ error: "يجب تسجيل الدخول بنفس بريد الدعوة." }); return; }
    if (/already a member/i.test(rpcErrorText)) { res.status(409).json({ error: "هذا الحساب عضو في العيادة بالفعل." }); return; }
    if (/no longer valid|not found/i.test(rpcErrorText)) { res.status(410).json({ error: "هذه الدعوة لم تعد صالحة." }); return; }
    res.status(502).json({ error: "تعذر إتمام قبول الدعوة." });
    return;
  }

  req.log?.info({ clinicId: String(invite.clinic_id), role }, "[Organization] Staff invite accepted");
  res.json({
    success: true,
    accountCreated,
    role,
    message: accountCreated
      ? "تم إنشاء حسابك وإضافتك إلى العيادة بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور التي اخترتها."
      : "تمت إضافتك إلى العيادة بنجاح. سجّل الدخول بكلمة مرور حسابك الحالية.",
  });
});

export default router;
