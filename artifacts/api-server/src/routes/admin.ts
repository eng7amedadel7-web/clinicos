import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { supabaseAdminRequest, supabaseRequest } from "../lib/supabase";
import { clinicEvents } from "../lib/events";
import { sendWelcomeKit } from "../lib/welcome-email";
import { logger } from "../lib/logger";

const router = Router();

function getAdminSecret(): string {
  return process.env.PLATFORM_ADMIN_SECRET?.trim() || "meruna-saas-admin-secret-2026";
}

function verifyAdminAccess(req: Request): boolean {
  const configured = getAdminSecret();
  const provided = (
    req.headers["x-admin-key"] ||
    req.headers["x-admin-secret"] ||
    req.query.key ||
    req.headers["authorization"]?.replace(/^Bearer\s+/i, "")
  );

  if (typeof provided !== "string") return false;
  return provided.trim() === configured;
}

function publicAppOrigin(req: Request): string {
  if (process.env.PUBLIC_APP_URL?.trim()) {
    return process.env.PUBLIC_APP_URL.trim().replace(/\/+$/, "");
  }
  const host = req.get("host") || "localhost:5000";
  const proto = req.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function generateWebhooks(clinicId: string, baseUrl: string) {
  const secret = process.env.INBOX_INBOUND_SECRET?.trim() || "";
  const secretParam = secret ? `&secret=${encodeURIComponent(secret)}` : "";

  return {
    whatsapp: `${baseUrl}/api/inbound?clinic_id=${clinicId}&channel=whatsapp${secretParam}`,
    telegram: `${baseUrl}/api/inbound?clinic_id=${clinicId}&channel=telegram${secretParam}`,
    instagram: `${baseUrl}/api/inbound?clinic_id=${clinicId}&channel=instagram${secretParam}`,
    messenger: `${baseUrl}/api/inbound?clinic_id=${clinicId}&channel=messenger${secretParam}`,
    voice: `${baseUrl}/api/inbound?clinic_id=${clinicId}&channel=voice${secretParam}`,
    voiceAgentPage: `${baseUrl}/voice-agent`,
  };
}

// 1. GET /admin/clinics - List all clinics with onboarding status
router.get("/admin/clinics", async (req: Request, res: Response) => {
  if (!verifyAdminAccess(req)) {
    res.status(401).json({ error: "Unauthorized: Invalid or missing admin secret key." });
    return;
  }

  let clinicsResult = await supabaseAdminRequest<Array<Record<string, unknown>>>(
    "/rest/v1/clinics?select=id,name,status,timezone,location_config,created_at&deleted_at=is.null&order=created_at.desc&limit=200"
  );

  if (!clinicsResult.ok) {
    clinicsResult = await supabaseRequest<Array<Record<string, unknown>>>(
      "/rest/v1/clinics?select=id,name,status,timezone,location_config,created_at&deleted_at=is.null&order=created_at.desc&limit=200"
    );
  }

  const clinics = (clinicsResult.ok && Array.isArray(clinicsResult.data)) ? clinicsResult.data : [];
  const clinicIds = clinics.map((c) => String(c.id)).filter(Boolean);

  // Fetch staff/owners for these clinics
  const staffResult = clinicIds.length > 0
    ? await supabaseAdminRequest<Array<Record<string, unknown>>>(
        `/rest/v1/clinic_staff?select=clinic_id,user_id,role&clinic_id=in.(${clinicIds.map(encodeURIComponent).join(",")})`
      )
    : { ok: true, data: [] as Array<Record<string, unknown>> };

  const staff: Array<Record<string, unknown>> = staffResult.data || [];
  const userIds = Array.from(new Set(staff.map((s) => String(s.user_id)).filter(Boolean)));

  const usersResult = userIds.length > 0
    ? await supabaseAdminRequest<Array<Record<string, unknown>>>(
        `/rest/v1/users?select=id,full_name,display_name,email&id=in.(${userIds.map(encodeURIComponent).join(",")})`
      )
    : { ok: true, data: [] as Array<Record<string, unknown>> };

  const users: Array<Record<string, unknown>> = usersResult.data || [];
  const usersMap = new Map(users.map((u) => [String(u.id), u]));

  const appBase = publicAppOrigin(req);

  const enhancedClinics = clinics.map((clinic) => {
    const cid = String(clinic.id);
    const clinicStaff = staff.filter((s) => String(s.clinic_id) === cid);
    const ownerStaff = clinicStaff.find((s) => s.role === "owner") || clinicStaff[0];
    const ownerUser = ownerStaff ? usersMap.get(String(ownerStaff.user_id)) : null;

    const webhooks = generateWebhooks(cid, appBase);

    return {
      id: cid,
      name: clinic.name,
      status: clinic.status || "active",
      createdAt: clinic.created_at,
      locationConfig: clinic.location_config,
      owner: ownerUser
        ? {
            id: ownerUser.id,
            fullName: ownerUser.full_name || ownerUser.display_name || "Owner",
            email: ownerUser.email,
          }
        : null,
      webhooks,
    };
  });

  res.json({ clinics: enhancedClinics });
});

// 2. POST /admin/provision - 1-Click Provision an existing or new clinic
const provisionSchema = z.object({
  clinicId: z.string().optional(),
  clinicName: z.string().trim().min(2).optional(),
  ownerFullName: z.string().trim().min(2).optional(),
  ownerEmail: z.string().email().optional(),
  ownerPassword: z.string().min(8).optional(),
  city: z.string().trim().optional(),
  sendWelcomeEmail: z.boolean().optional().default(true),
});

router.post("/admin/provision", async (req: Request, res: Response) => {
  if (!verifyAdminAccess(req)) {
    res.status(401).json({ error: "Unauthorized: Invalid or missing admin secret key." });
    return;
  }

  const parsed = provisionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request payload", details: parsed.error.format() });
    return;
  }

  const { clinicId, clinicName, ownerFullName, ownerEmail, ownerPassword, city, sendWelcomeEmail } = parsed.data;
  const appBase = publicAppOrigin(req);

  let targetClinicId = clinicId;
  let targetClinicName = clinicName || "عيادة جديدة";
  let targetOwnerEmail = ownerEmail;

  const stepsCompleted: string[] = [];

  // Branch A: Existing Clinic Provisioning
  if (targetClinicId) {
    const existing = await supabaseAdminRequest<Array<Record<string, unknown>>>(
      `/rest/v1/clinics?select=id,name,location_config&id=eq.${encodeURIComponent(targetClinicId)}&limit=1`
    );

    if (!existing.ok || !existing.data?.length) {
      res.status(404).json({ error: "Clinic not found." });
      return;
    }

    targetClinicName = String(existing.data[0].name || targetClinicName);
    stepsCompleted.push("Clinic verified");

    // Ensure primary branch exists
    const branches = await supabaseAdminRequest<Array<Record<string, unknown>>>(
      `/rest/v1/branches?select=id&clinic_id=eq.${encodeURIComponent(targetClinicId)}&limit=1`
    );

    if (branches.ok && (!branches.data || branches.data.length === 0)) {
      await supabaseAdminRequest("/rest/v1/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({
          clinic_id: targetClinicId,
          name: "الفرع الرئيسي",
          address: city || "المقر الرئيسي",
          is_active: true,
        }),
      });
      stepsCompleted.push("Default branch created");
    } else {
      stepsCompleted.push("Branches verified");
    }

    // Try finding owner email if not passed
    if (!targetOwnerEmail) {
      const staffRes = await supabaseAdminRequest<Array<Record<string, unknown>>>(
        `/rest/v1/clinic_staff?select=user_id&clinic_id=eq.${encodeURIComponent(targetClinicId)}&role=eq.owner&limit=1`
      );
      if (staffRes.ok && staffRes.data?.[0]?.user_id) {
        const userRes = await supabaseAdminRequest<Array<Record<string, unknown>>>(
          `/rest/v1/users?select=email&id=eq.${encodeURIComponent(String(staffRes.data[0].user_id))}&limit=1`
        );
        if (userRes.ok && userRes.data?.[0]?.email) {
          targetOwnerEmail = String(userRes.data[0].email);
        }
      }
    }
  } else {
    // Branch B: Create New Clinic from Admin
    if (!clinicName || !ownerEmail || !ownerPassword) {
      res.status(400).json({ error: "For creating a new clinic, clinicName, ownerEmail, and ownerPassword are required." });
      return;
    }

    // Create user via Supabase Auth
    const signUpResult = await supabaseRequest<{ access_token?: string; user?: { id: string } }>("/auth/v1/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: ownerEmail,
        password: ownerPassword,
        data: { full_name: ownerFullName || "Clinic Owner", clinic_name: clinicName },
      }),
    });

    if (!signUpResult.ok || !signUpResult.data?.user?.id) {
      res.status(signUpResult.status || 500).json({ error: "Failed to create owner user in auth system." });
      return;
    }

    stepsCompleted.push("Owner auth user created");

    const userId = signUpResult.data.user.id;
    const accessToken = signUpResult.data.access_token;

    // Call app_onboard_clinic RPC
    if (accessToken) {
      const suffix = userId.slice(0, 8);
      const onboardResult = await supabaseRequest<{ clinic_id?: string }>("/rest/v1/rpc/app_onboard_clinic", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          p_organization_name: `${clinicName} Organization`,
          p_organization_slug: `org-${suffix}`,
          p_clinic_name: clinicName,
          p_clinic_slug: `clinic-${suffix}`,
          p_timezone: "Asia/Riyadh",
          p_clinic_type: "general",
          p_channels: [],
          p_primary_branch_name: "الفرع الرئيسي",
          p_primary_branch_address: city || null,
          p_primary_branch_phone: null,
          p_founder_id: userId,
        }),
      });

      if (onboardResult.ok && onboardResult.data?.clinic_id) {
        targetClinicId = onboardResult.data.clinic_id;
        stepsCompleted.push("Clinic schema & organization onboarded");
      }
    }

    if (!targetClinicId) {
      res.status(500).json({ error: "Failed to initialize clinic database schema." });
      return;
    }
  }

  // Generate webhooks
  const webhooks = generateWebhooks(targetClinicId, appBase);
  stepsCompleted.push("Webhooks generated");

  // Send Welcome Kit email if requested and email is available
  let emailSent = false;
  if (sendWelcomeEmail && targetOwnerEmail) {
    try {
      await sendWelcomeKit({
        clinicName: targetClinicName,
        ownerEmail: targetOwnerEmail,
        webhooks,
        dashboardUrl: `${appBase}/dashboard`,
      });
      emailSent = true;
      stepsCompleted.push(`Welcome Kit sent to ${targetOwnerEmail}`);
    } catch (err) {
      logger.error({ error: String(err) }, "[Admin] Failed to send welcome kit email");
      stepsCompleted.push(`Welcome email failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  // Emit event to update live system
  clinicEvents.emitClinicEvent(targetClinicId, "settings.updated", { provisioned: true, at: new Date().toISOString() });
  stepsCompleted.push("Realtime event emitted");

  res.json({
    success: true,
    clinicId: targetClinicId,
    clinicName: targetClinicName,
    ownerEmail: targetOwnerEmail,
    emailSent,
    stepsCompleted,
    webhooks,
    dashboardUrl: `${appBase}/dashboard`,
    loginUrl: `${appBase}/login`,
  });
});

// 3. POST /admin/send-welcome-kit - Resend welcome email manually
router.post("/admin/send-welcome-kit", async (req: Request, res: Response) => {
  if (!verifyAdminAccess(req)) {
    res.status(401).json({ error: "Unauthorized: Invalid or missing admin secret key." });
    return;
  }

  const { clinicId, ownerEmail, clinicName } = req.body;
  if (!clinicId || !ownerEmail) {
    res.status(400).json({ error: "clinicId and ownerEmail are required." });
    return;
  }

  const appBase = publicAppOrigin(req);
  const webhooks = generateWebhooks(clinicId, appBase);

  try {
    await sendWelcomeKit({
      clinicName: clinicName || "العيادة",
      ownerEmail,
      webhooks,
      dashboardUrl: `${appBase}/dashboard`,
    });
    res.json({ success: true, message: `Welcome Kit sent to ${ownerEmail}` });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to send email." });
  }
});

export default router;
