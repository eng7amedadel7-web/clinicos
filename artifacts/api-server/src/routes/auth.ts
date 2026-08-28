import { Router } from "express";
import { z } from "zod";
import { getSupabasePublicConfig, supabaseAuthRequest, supabaseRequest } from "../lib/supabase";
import {
  clearSession,
  readSession,
  writeSession,
  type SessionPayload,
} from "../lib/session";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberDevice: z.boolean().optional(),
});

const passwordRecoverySchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  accessToken: z.string().min(20),
  password: z.string().min(8),
});

const registerSchema = z.object({
  fullName: z.string().trim().min(2),
  clinicName: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

type SupabaseAuthUser = {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; clinic_name?: string };
};

type SupabaseAuthResult = {
  access_token?: string;
  refresh_token?: string;
  user: SupabaseAuthUser;
};

type PublicUserRecord = {
  id?: string;
  full_name?: string;
  display_name?: string;
};

type MembershipRecord = {
  clinic_id?: string;
  role_id?: string;
  branch_id?: string | null;
  expires_at?: string | null;
};

type StaffRecord = {
  role?: string;
};

type RoleRecord = {
  name?: string;
};

type ClinicRecord = {
  id?: string;
  name?: string;
  status?: string;
  timezone?: string;
  location_config?: Record<string, unknown>;
};

function restHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

function clinicCity(clinic: ClinicRecord) {
  const configuredCity = clinic.location_config?.city;
  return typeof configuredCity === "string" && configuredCity.trim()
    ? configuredCity
    : "—";
}

export async function getProfile(user: SupabaseAuthUser, accessToken: string) {
  const headers = restHeaders(accessToken);
  const [userResult, membershipResult] = await Promise.all([
    supabaseRequest<PublicUserRecord[]>(
      `/rest/v1/users?select=id,full_name,display_name&id=eq.${encodeURIComponent(user.id)}&limit=1`,
      { headers },
    ),
    supabaseRequest<MembershipRecord[]>(
      `/rest/v1/user_roles?select=clinic_id,role_id,branch_id,expires_at&user_id=eq.${encodeURIComponent(user.id)}&limit=50`,
      { headers },
    ),
  ]);

  const activeMembership = (membershipResult.ok ? membershipResult.data ?? [] : [])
    .filter((membership) => {
      if (!membership.clinic_id) return false;
      return !membership.expires_at || new Date(membership.expires_at) > new Date();
    })
    .sort((a, b) => (a.branch_id ? 1 : 0) - (b.branch_id ? 1 : 0))[0];

  if (!activeMembership?.clinic_id || !activeMembership.role_id) return null;

  const [roleResult, staffResult, clinicResult] = await Promise.all([
    supabaseRequest<RoleRecord[]>(
      `/rest/v1/roles?select=name&id=eq.${encodeURIComponent(activeMembership.role_id)}&limit=1`,
      { headers },
    ),
    supabaseRequest<StaffRecord[]>(
      `/rest/v1/clinic_staff?select=role&clinic_id=eq.${encodeURIComponent(activeMembership.clinic_id)}&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,
      { headers },
    ),
    supabaseRequest<ClinicRecord[]>(
      `/rest/v1/clinics?select=id,name,status,timezone,location_config&id=eq.${encodeURIComponent(activeMembership.clinic_id)}&deleted_at=is.null&limit=1`,
      { headers },
    ),
  ]);

  const clinic = clinicResult.ok ? clinicResult.data?.[0] : undefined;
  if (!clinic?.id || !clinic.name || clinic.status === "suspended") return null;

  const roleName = String(roleResult.ok ? roleResult.data?.[0]?.name ?? "" : "").toLowerCase();
  const staffRole = String(staffResult.ok ? staffResult.data?.[0]?.role ?? "" : "").toLowerCase();
  const role = staffRole === "owner" ? "owner" : roleName === "admin" ? "admin" : null;
  if (!role) return null;

  const publicUser = userResult.ok ? userResult.data?.[0] : undefined;
  const fullName =
    publicUser?.full_name?.trim() ||
    publicUser?.display_name?.trim() ||
    user.user_metadata?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Clinic admin";

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      fullName,
      role,
    },
    clinic: {
      id: clinic.id,
      name: clinic.name,
      status: clinic.status ?? "active",
      city: clinicCity(clinic),
    },
  };
}

function sessionFor(
  auth: SupabaseAuthResult,
  email: string,
  clinicId: string,
  rememberDevice = true,
): SessionPayload | null {
  if (!auth.access_token || !auth.user?.id) return null;
  return {
    accessToken: auth.access_token,
    refreshToken: auth.refresh_token,
    userId: auth.user.id,
    email: auth.user.email ?? email,
    clinicId,
    remember: rememberDevice,
  };
}

async function onboardClinic(user: SupabaseAuthUser, clinicName: string, accessToken: string) {
  const suffix = user.id.slice(0, 8);
  const clinicSlug = safeSlug(clinicName, `clinic-${suffix}`);
  const organizationSlug = safeSlug(`${clinicName}-org`, `organization-${suffix}`);
  const onboarding = await supabaseRequest<{ clinic_id?: string }>(
    "/rest/v1/rpc/app_onboard_clinic",
    {
      method: "POST",
      headers: { ...restHeaders(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify({
        p_organization_name: `${clinicName} Organization`,
        p_organization_slug: `${organizationSlug}-${suffix}`.slice(0, 63),
        p_clinic_name: clinicName,
        p_clinic_slug: `${clinicSlug}-${suffix}`.slice(0, 63),
        p_timezone: "Asia/Riyadh",
        p_clinic_type: "general",
        p_channels: [],
        p_primary_branch_name: "الفرع الرئيسي",
        p_primary_branch_address: null,
        p_primary_branch_phone: null,
        p_founder_id: user.id,
      }),
    },
  );
  return onboarding.ok && onboarding.data?.clinic_id ? onboarding.data.clinic_id : null;
}

// Registration can leave a confirmed auth user with no clinic when the
// app_onboard_clinic RPC fails after signup; without a retry the account stays
// permanently locked out of the dashboard. Retry only when the user has zero
// role memberships, so suspended or demoted accounts are never re-onboarded.
async function recoverOrphanedOnboarding(user: SupabaseAuthUser, accessToken: string) {
  const membershipResult = await supabaseRequest<MembershipRecord[]>(
    `/rest/v1/user_roles?select=clinic_id&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,
    { headers: restHeaders(accessToken) },
  );
  if (!membershipResult.ok || membershipResult.data?.length) return null;
  const clinicName = user.user_metadata?.clinic_name?.trim();
  if (!clinicName) return null;
  const clinicId = await onboardClinic(user, clinicName, accessToken);
  if (!clinicId) return null;
  return getProfile(user, accessToken);
}

function publicAppOrigin() {
  return process.env.PUBLIC_APP_URL?.trim().replace(/\/+$/, "") || "https://clinicos-ashy-one.vercel.app";
}

function safeSlug(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || fallback;
}

router.post("/forgot-password", async (req, res) => {
  const parsed = passwordRecoverySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }

  const origin = publicAppOrigin();
  const result = await supabaseAuthRequest<{ message?: string }>(
    "/auth/v1/recover",
    {
      email: parsed.data.email.trim().toLowerCase(),
      ...(origin ? { options: { redirectTo: `${origin}/reset-password` } } : {}),
    },
  );

  // Keep the response generic so this endpoint cannot be used for account enumeration,
  // but do not claim success when the email provider rejected the request.
  if (!result.ok) {
    req.log?.error({ status: result.status }, "[Auth] Password recovery provider rejected request");
    res.status(502).json({ error: "Password recovery email delivery is temporarily unavailable." });
    return;
  }
  res.json({ message: "If an account exists for that email, a recovery link will be sent." });
});

router.post("/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Use a valid recovery link and a password of 8+ characters." });
    return;
  }

  const result = await supabaseRequest<{ id?: string }>("/auth/v1/user", {
    method: "PUT",
    headers: {
      ...restHeaders(parsed.data.accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: parsed.data.password }),
  });
  if (!result.ok || !result.data?.id) {
    res.status(400).json({ error: "This recovery link is invalid or expired. Request a new one." });
    return;
  }
  res.json({ message: "Password updated successfully." });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please enter a valid email and password." });
    return;
  }

  const result = await supabaseAuthRequest<SupabaseAuthResult>(
    "/auth/v1/token?grant_type=password",
    { email: parsed.data.email, password: parsed.data.password },
  );
  if (!result.ok || !result.data?.access_token || !result.data.user) {
    if (result.status === 401 || result.status === 403) {
      req.log?.error({ status: result.status }, "[Auth] Supabase Auth configuration rejected login request");
      res.status(503).json({ error: "Authentication service configuration is unavailable." });
      return;
    }
    if (result.status === 429) {
      res.status(503).json({ error: "Authentication service is temporarily rate-limited. Try again shortly." });
      return;
    }
    res.status(400).json({ error: "The email or password is incorrect." });
    return;
  }

  const profile = await getProfile(result.data.user, result.data.access_token);
  if (!profile) {
    const recovered = await recoverOrphanedOnboarding(result.data.user, result.data.access_token);
    if (!recovered) {
      res.status(403).json({ error: "This account is not assigned to an active clinic owner or admin role." });
      return;
    }
    const session = sessionFor(
      result.data,
      parsed.data.email,
      recovered.clinic.id,
      parsed.data.rememberDevice !== false,
    );
    if (!session) {
      res.status(401).json({ error: "The authenticated session could not be created." });
      return;
    }
    writeSession(res, session);
    res.json(recovered);
    return;
  }

  const session = sessionFor(
    result.data,
    parsed.data.email,
    profile.clinic.id,
    parsed.data.rememberDevice !== false,
  );
  if (!session) {
    res.status(401).json({ error: "The authenticated session could not be created." });
    return;
  }
  writeSession(res, session);
  res.json(profile);
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Use a full name, clinic name, valid email, and password of 8+ characters.",
    });
    return;
  }

  const result = await supabaseAuthRequest<SupabaseAuthResult>(
    "/auth/v1/signup",
    {
      email: parsed.data.email,
      password: parsed.data.password,
      data: { full_name: parsed.data.fullName, clinic_name: parsed.data.clinicName },
    },
  );
  if (!result.ok || !result.data?.user) {
    res.status(400).json({ error: "We couldn't create this account. The email may already be registered." });
    return;
  }

  if (!result.data.access_token) {
    res.status(400).json({
      error: "Account created. Check your email to confirm it, then sign in.",
    });
    return;
  }

  const clinicId = await onboardClinic(result.data.user, parsed.data.clinicName, result.data.access_token);
  if (!clinicId) {
    res.status(400).json({ error: "Account created, but the clinic owner profile could not be completed." });
    return;
  }

  const profile = await getProfile(result.data.user, result.data.access_token);
  if (!profile) {
    res.status(400).json({ error: "Account created, but the clinic owner profile could not be loaded." });
    return;
  }

  const session = sessionFor(result.data, parsed.data.email, profile.clinic.id);
  if (!session) {
    res.status(401).json({ error: "The authenticated session could not be created." });
    return;
  }
  writeSession(res, session);
  res.status(201).json(profile);
});

router.get("/session", async (req, res) => {
  const session = readSession(req);
  if (!session) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  const userResult = await supabaseRequest<SupabaseAuthUser>(
    "/auth/v1/user",
    { headers: restHeaders(session.accessToken) },
  );
  if (!userResult.ok || !userResult.data?.id || userResult.data.id !== session.userId) {
    clearSession(res);
    res.status(401).json({ error: "Your session has expired. Please sign in again." });
    return;
  }

  const profile = await getProfile(userResult.data, session.accessToken);
  if (!profile || profile.clinic.id !== session.clinicId) {
    clearSession(res);
    res.status(403).json({ error: "This account is no longer assigned to the selected clinic." });
    return;
  }
  res.json(profile);
});

router.get("/realtime-token", async (req, res) => {
  const session = readSession(req);
  if (!session) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  const userResult = await supabaseRequest<SupabaseAuthUser>(
    "/auth/v1/user",
    { headers: restHeaders(session.accessToken) },
  );
  if (!userResult.ok || !userResult.data?.id || userResult.data.id !== session.userId) {
    clearSession(res);
    res.status(401).json({ error: "Your session has expired. Please sign in again." });
    return;
  }

  const profile = await getProfile(userResult.data, session.accessToken);
  if (!profile || profile.clinic.id !== session.clinicId) {
    clearSession(res);
    res.status(403).json({ error: "This account is no longer assigned to the selected clinic." });
    return;
  }

  const publicConfig = getSupabasePublicConfig();
  if (!publicConfig) {
    res.status(503).json({ error: "Realtime configuration is unavailable." });
    return;
  }
  res.setHeader("Cache-Control", "no-store");
  res.json({ url: publicConfig.url, anonKey: publicConfig.key, accessToken: session.accessToken, clinicId: profile.clinic.id });
});

router.post("/logout", (_req, res) => {
  clearSession(res);
  res.status(204).end();
});

export default router;
