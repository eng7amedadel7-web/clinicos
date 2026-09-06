import type { Request, Response } from "express";
import { readSession, type SessionPayload } from "./session";
import { supabaseRequest } from "./supabase";
import { CLINIC_NOT_ACTIVATED_MESSAGE, getClinicActivation } from "./activation";

export type ClinicPermissionAction = "create" | "read" | "update" | "delete" | "manage" | "handoff";

// Live-operation modules stay closed until the clinic redeems its trial code
// (or subscribes). Setup surfaces (Settings: branches, staff, doctors,
// services, slots, channels, billing) remain open so the onboarding checklist
// works pre-activation. Reads stay open as well — RLS already scopes them.
const ACTIVATION_GATED_MODULES = new Set(["Patients", "Appointments", "inbox", "Operations", "Voice"]);

export function requireSession(req: Request): SessionPayload {
  const session = readSession(req);
  if (!session) {
    const error = new Error("Not authenticated.");
    Object.assign(error, { statusCode: 401 });
    throw error;
  }
  return session;
}

export async function requireClinicPermission(
  req: Request,
  module: string,
  resource: string,
  action: ClinicPermissionAction,
  branchId?: string | null,
) {
  const session = requireSession(req);
  if (ACTIVATION_GATED_MODULES.has(module) && action !== "read") {
    const activation = await getClinicActivation(session.accessToken, session.clinicId);
    if (!activation.activated) {
      const error = new Error(CLINIC_NOT_ACTIVATED_MESSAGE);
      Object.assign(error, { statusCode: 403, code: "clinic_not_activated", phase: activation.phase });
      throw error;
    }
  }
  const result = await supabaseRequest<boolean>("/rest/v1/rpc/fn_has_clinic_permission", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_clinic_id: session.clinicId,
      p_module: module,
      p_resource: resource,
      p_action: action,
      p_branch_id: branchId ?? null,
    }),
  });
  if (!result.ok) {
    const error = new Error("Unable to verify clinic permission.");
    Object.assign(error, { statusCode: result.status || 502 });
    throw error;
  }
  if (result.data !== true) {
    const error = new Error("You do not have the required clinic permission.");
    Object.assign(error, { statusCode: 403 });
    throw error;
  }
  return session;
}

export function respondToPermissionError(res: Response, error: unknown) {
  const statusCode = typeof error === "object" && error && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500;
  res.status(statusCode).json({ error: error instanceof Error ? error.message : "Unable to verify clinic permission." });
}

export async function withPermission<T>(
  req: Request,
  module: string,
  resource: string,
  action: ClinicPermissionAction,
  operation: (session: SessionPayload) => Promise<T>,
  branchId?: string | null,
) {
  const session = await requireClinicPermission(req, module, resource, action, branchId);
  return operation(session);
}
