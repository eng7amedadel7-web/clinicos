import { Router } from "express";
import { z } from "zod";
import { supabaseAuthRequest, supabaseRequest } from "../lib/supabase";
import {
  clearSession,
  readSession,
  writeSession,
  type SessionPayload,
} from "../lib/session";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  fullName: z.string().min(2),
  clinicName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

type SupabaseAuthUser = {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; clinic_name?: string };
};

type SupabaseAuthResult = {
  access_token: string;
  refresh_token?: string;
  user: SupabaseAuthUser;
};

type UserRecord = {
  id?: string;
  user_id?: string;
  auth_user_id?: string;
  email?: string;
  full_name?: string;
  role?: string;
  clinic_id?: string;
  clinic?: { id?: string; name?: string; status?: string; city?: string };
};

type ClinicRecord = {
  id?: string;
  name?: string;
  status?: string;
  city?: string;
};

async function getProfile(user: SupabaseAuthUser, accessToken: string) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const profile = await supabaseRequest<UserRecord[]>(
    `/rest/v1/clinic_users?select=*&auth_user_id=eq.${encodeURIComponent(user.id)}&limit=1`,
    { headers },
  );
  let record = profile.ok ? profile.data?.[0] : undefined;
  if (!record) {
    const fallback = await supabaseRequest<UserRecord[]>(
      `/rest/v1/clinic_users?select=*&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,
      { headers },
    );
    record = fallback.ok ? fallback.data?.[0] : undefined;
  }
  if (!record || !["owner", "admin"].includes(record.role ?? "")) {
    return null;
  }
  let clinic: ClinicRecord | undefined = record?.clinic;
  if (!clinic && record?.clinic_id) {
    const clinicResult = await supabaseRequest<ClinicRecord[]>(
      `/rest/v1/clinics?select=*&id=eq.${encodeURIComponent(record.clinic_id)}&limit=1`,
      { headers },
    );
    clinic = clinicResult.ok ? clinicResult.data?.[0] : undefined;
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? record?.email ?? "",
      fullName:
        record?.full_name ??
        user.user_metadata?.full_name ??
        user.email?.split("@")[0] ??
        "Clinic admin",
      role: record?.role === "admin" ? "admin" : "owner",
    },
    clinic: {
      id: clinic?.id ?? record?.clinic_id ?? "unassigned",
      name:
        clinic?.name ??
        user.user_metadata?.clinic_name ??
        "Your clinic",
      status: clinic?.status ?? "active",
      city: clinic?.city ?? "—",
    },
  };
}

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please enter a valid email and password." });
    return;
  }

  const result = await supabaseAuthRequest<SupabaseAuthResult>(
    "/auth/v1/token?grant_type=password",
    parsed.data,
  );
  if (!result.ok || !result.data?.access_token || !result.data.user) {
    res.status(400).json({ error: "The email or password is incorrect." });
    return;
  }

  const session: SessionPayload = {
    accessToken: result.data.access_token,
    refreshToken: result.data.refresh_token,
    userId: result.data.user.id,
    email: result.data.user.email ?? parsed.data.email,
  };
  writeSession(res, session);
  const profile = await getProfile(result.data.user, result.data.access_token);
  if (!profile) {
    clearSession(res);
    res.status(403).json({ error: "This account is not assigned to a clinic owner or admin role." });
    return;
  }
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
      data: {
        full_name: parsed.data.fullName,
        clinic_name: parsed.data.clinicName,
      },
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

  const headers = {
    Authorization: `Bearer ${result.data.access_token}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  const clinicResult = await supabaseRequest<ClinicRecord[]>("/rest/v1/clinics", {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({
      name: parsed.data.clinicName,
      status: "active",
    }),
  });
  const clinicId = clinicResult.ok ? clinicResult.data?.[0]?.id : undefined;
  if (clinicId) {
    await supabaseRequest("/rest/v1/clinic_users", {
      method: "POST",
      headers,
      body: JSON.stringify({
        auth_user_id: result.data.user.id,
        user_id: result.data.user.id,
        clinic_id: clinicId,
        email: parsed.data.email,
        full_name: parsed.data.fullName,
        role: "owner",
      }),
    });
  }

  const session: SessionPayload = {
    accessToken: result.data.access_token,
    refreshToken: result.data.refresh_token,
    userId: result.data.user.id,
    email: result.data.user.email ?? parsed.data.email,
  };
  writeSession(res, session);
  const profile = await getProfile(result.data.user, result.data.access_token);
  if (!profile) {
    clearSession(res);
    res.status(400).json({ error: "Account created, but the clinic owner profile could not be completed." });
    return;
  }
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
    { headers: { Authorization: `Bearer ${session.accessToken}` } },
  );
  if (!userResult.ok || !userResult.data?.id) {
    clearSession(res);
    res.status(401).json({ error: "Your session has expired. Please sign in again." });
    return;
  }
  const profile = await getProfile(userResult.data, session.accessToken);
  if (!profile) {
    clearSession(res);
    res.status(403).json({ error: "This account is not assigned to a clinic owner or admin role." });
    return;
  }
  res.json(profile);
});

router.post("/logout", (_req, res) => {
  clearSession(res);
  res.status(204).end();
});

export default router;