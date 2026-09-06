import { Router } from "express";
import { requireClinicPermission } from "../lib/permissions";
import { supabaseRequest } from "../lib/supabase";

// First-run clinic setup status for the dashboard onboarding checklist.
// Read-only: counts a handful of clinic-scoped rows and reports which setup
// steps are already done, so the UI can guide a newly registered clinic owner.
const router = Router();

type IdRow = { id?: string };
type ClinicRow = { location_config?: Record<string, unknown> };

type OnboardingItemId = "clinicProfile" | "doctors" | "services" | "slots" | "channels" | "team";

function hasRows(result: { ok: boolean; data?: IdRow[] | null }): boolean {
  return result.ok && (result.data?.length ?? 0) > 0;
}

router.get("/status", async (req, res) => {
  let session;
  try {
    session = await requireClinicPermission(req, "Operations", "workspace", "read");
  } catch (error) {
    const statusCode = typeof error === "object" && error && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500;
    res.status(statusCode).json({ error: error instanceof Error ? error.message : "Unable to verify clinic permission." });
    return;
  }

  const clinicFilter = `clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null`;
  const headers = { Authorization: `Bearer ${session.accessToken}` };
  const [clinicResult, doctorsResult, servicesResult, slotsResult, channelsResult, staffResult] = await Promise.all([
    supabaseRequest<ClinicRow[]>(
      `/rest/v1/clinics?select=location_config&id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null&limit=1`,
      { headers },
    ),
    supabaseRequest<IdRow[]>(`/rest/v1/doctors?select=id&${clinicFilter}&is_active=eq.true&limit=1`, { headers }),
    supabaseRequest<IdRow[]>(`/rest/v1/services?select=id&${clinicFilter}&is_active=eq.true&limit=1`, { headers }),
    supabaseRequest<IdRow[]>(`/rest/v1/appointment_slots?select=id&${clinicFilter}&limit=1`, { headers }),
    supabaseRequest<IdRow[]>(`/rest/v1/channels?select=id&${clinicFilter}&limit=1`, { headers }),
    supabaseRequest<IdRow[]>(`/rest/v1/clinic_staff?select=id&${clinicFilter}&limit=50`, { headers }),
  ]);

  const clinic = clinicResult.ok ? clinicResult.data?.[0] : undefined;
  if (!clinic) {
    res.status(403).json({ error: "The selected clinic is not available to this account." });
    return;
  }

  const configuredCity = clinic.location_config?.city;
  const items: Array<{ id: OnboardingItemId; done: boolean }> = [
    { id: "clinicProfile", done: typeof configuredCity === "string" && configuredCity.trim().length > 0 },
    { id: "doctors", done: hasRows(doctorsResult) },
    { id: "services", done: hasRows(servicesResult) },
    { id: "slots", done: hasRows(slotsResult) },
    { id: "channels", done: hasRows(channelsResult) },
    { id: "team", done: hasRows(staffResult) && (staffResult.data?.length ?? 0) > 1 },
  ];

  res.json({ items, complete: items.every((item) => item.done) });
});

export default router;
