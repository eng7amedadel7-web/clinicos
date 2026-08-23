import { Router, type Request } from "express";
import { z } from "zod";
import { getProfile } from "./auth";
import { supabaseRequest } from "../lib/supabase";
import { readSession } from "../lib/session";

const router = Router();

const updateSettingsSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  clinicName: z.string().trim().min(2).max(160),
  city: z.string().trim().max(120),
});

type AuthUser = { id: string; email?: string; user_metadata?: { full_name?: string } };
type ClinicRow = { id?: string; name?: string; status?: string; location_config?: Record<string, unknown> };

async function loadProfile(req: Request) {
  const session = readSession(req);
  if (!session) return null;
  const userResult = await supabaseRequest<AuthUser>("/auth/v1/user", {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  if (!userResult.ok || !userResult.data?.id || userResult.data.id !== session.userId) return null;
  const profile = await getProfile(userResult.data, session.accessToken);
  if (!profile || profile.clinic.id !== session.clinicId) return null;
  return { session, user: userResult.data, profile };
}

router.get("/settings", async (req, res) => {
  const current = await loadProfile(req);
  if (!current) {
    res.status(401).json({ error: "Not authenticated or clinic access has expired." });
    return;
  }
  res.json(current.profile);
});

router.patch("/settings", async (req, res) => {
  const current = await loadProfile(req);
  if (!current) {
    res.status(401).json({ error: "Not authenticated or clinic access has expired." });
    return;
  }

  const parsed = updateSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid full name, clinic name, and city." });
    return;
  }

  const headers = {
    Authorization: `Bearer ${current.session.accessToken}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  const clinicResult = await supabaseRequest<ClinicRow[]>(
    `/rest/v1/clinics?select=id,name,status,location_config&id=eq.${encodeURIComponent(current.session.clinicId)}&deleted_at=is.null&limit=1`,
    { headers },
  );
  const clinic = clinicResult.ok ? clinicResult.data?.[0] : undefined;
  if (!clinic?.id) {
    res.status(403).json({ error: "The selected clinic is not available to this account." });
    return;
  }

  const locationConfig = {
    ...(clinic.location_config ?? {}),
    city: parsed.data.city,
  };
  const [userUpdate, clinicUpdate] = await Promise.all([
    supabaseRequest(`/rest/v1/users?id=eq.${encodeURIComponent(current.session.userId)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ full_name: parsed.data.fullName }),
    }),
    supabaseRequest(`/rest/v1/clinics?id=eq.${encodeURIComponent(current.session.clinicId)}&deleted_at=is.null`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ name: parsed.data.clinicName, location_config: locationConfig }),
    }),
  ]);

  if (!userUpdate.ok || !clinicUpdate.ok) {
    res.status(400).json({ error: "The clinic settings could not be saved." });
    return;
  }

  const profile = await getProfile(current.user, current.session.accessToken);
  if (!profile || profile.clinic.id !== current.session.clinicId) {
    res.status(500).json({ error: "Settings were saved, but the updated profile could not be loaded." });
    return;
  }
  res.json(profile);
});

export default router;
