import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import router from "../appointments";

const requireClinicPermissionMock = vi.fn();
const respondToPermissionErrorMock = vi.fn();
const supabaseRequestMock = vi.fn();
const supabaseAdminRequestMock = vi.fn();
const emitClinicEventMock = vi.fn();

vi.mock("../../lib/permissions", () => ({
  requireClinicPermission: (...args: unknown[]) => requireClinicPermissionMock(...args),
  respondToPermissionError: (...args: unknown[]) => respondToPermissionErrorMock(...args),
}));
vi.mock("../../lib/supabase", () => ({
  supabaseRequest: (...args: unknown[]) => supabaseRequestMock(...args),
  supabaseAdminRequest: (...args: unknown[]) => supabaseAdminRequestMock(...args),
}));
vi.mock("../../lib/events", () => ({
  clinicEvents: { emitClinicEvent: (...args: unknown[]) => emitClinicEventMock(...args) },
}));

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

async function withServer(run: (base: string) => Promise<void>) {
  const app = buildApp();
  const server: Server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const port = (server.address() as AddressInfo).port;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

const session = { accessToken: "tok", userId: "u1", email: "e@x.com", clinicId: "c1" };

function dispatchSupabase(path: string, overrides: Partial<Record<string, unknown>> = {}) {
  const ok = (data: unknown) => ({ ok: true, status: 200, data });
  if (path.includes("/rest/v1/branches?")) return ok([]);
  if (path.includes("/rest/v1/appointments?select=id,public_id")) return ok(overrides.appointments ?? [
    { id: "a1", public_id: "pub1", patient_id: "p1", doctor_id: "d1", service_id: "s1", appointment_status: null, scheduled_at: "2026-09-10T09:00:00Z", booking_number: "B-1", queue_number: 3, notes: null, slot_id: null },
  ]);
  if (path.includes("/rest/v1/patients?")) return ok(overrides.patients ?? [{ id: "p1", name: "أحمد علي", first_name: null, last_name: null, phone: "01000000000" }]);
  if (path.includes("/rest/v1/doctors?")) return ok(overrides.doctors ?? [{ id: "d1", name: "د. سيد" }]);
  if (path.includes("/rest/v1/services?")) return ok(overrides.services ?? [{ id: "s1", name: "تنظيف" }]);
  return ok([]);
}

afterEach(() => {
  requireClinicPermissionMock.mockReset();
  supabaseRequestMock.mockReset();
  supabaseAdminRequestMock.mockReset();
  emitClinicEventMock.mockReset();
  // mockReset strips implementations, so the permission-error shim must be
  // re-applied after every test — a bare no-op helper would hang the route.
  respondToPermissionErrorMock.mockReset();
  respondToPermissionErrorMock.mockImplementation((res, error) => {
    const statusCode =
      typeof error === "object" && error && "statusCode" in error && typeof (error as { statusCode?: unknown }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : 403;
    res.status(statusCode).json({ error: "غير مصرح" });
  });
});

// Module-level default so the FIRST test (before any afterEach) has the shim too.
respondToPermissionErrorMock.mockImplementation((res, error) => {
  const statusCode =
    typeof error === "object" && error && "statusCode" in error && typeof (error as { statusCode?: unknown }).statusCode === "number"
      ? (error as { statusCode: number }).statusCode
      : 403;
  res.status(statusCode).json({ error: "غير مصرح" });
});

describe("appointments route", () => {
  it("returns 401 when the caller has no permission", async () => {
    requireClinicPermissionMock.mockRejectedValue(Object.assign(new Error("unauthenticated"), { statusCode: 401 }));
    await withServer(async (base) => {
      const res = await fetch(`${base}/appointments`);
      expect(res.status).toBe(401);
    });
  });

  it("rejects a list request scoped to an invalid branch with 400", async () => {
    requireClinicPermissionMock.mockResolvedValue(session as never);
    supabaseRequestMock.mockResolvedValue({ ok: true, status: 200, data: [] });
    await withServer(async (base) => {
      const res = await fetch(`${base}/appointments?branchId=other-clinic-branch`);
      expect(res.status).toBe(400);
    });
  });

  it("lists appointments with patient, doctor and service names resolved", async () => {
    requireClinicPermissionMock.mockResolvedValue(session as never);
    supabaseRequestMock.mockImplementation((path: string) => Promise.resolve(dispatchSupabase(path)));
    await withServer(async (base) => {
      const res = await fetch(`${base}/appointments`);
      expect(res.status).toBe(200);
      const rows = (await res.json()) as Array<{ name?: string; status?: string; doctorName?: string | null; serviceName?: string | null }>;
      expect(rows[0]?.name).toBe("أحمد علي");
      expect(rows[0]?.status).toBe("scheduled"); // null status falls back
      expect(rows[0]?.doctorName).toBe("د. سيد");
      expect(rows[0]?.serviceName).toBe("تنظيف");
    });
  });

  it("rejects a booking without patient or slot with 400", async () => {
    requireClinicPermissionMock.mockResolvedValue(session as never);
    await withServer(async (base) => {
      const res = await fetch(`${base}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: "p1" }),
      });
      expect(res.status).toBe(400);
    });
  });

  // Regression: b59602fd accidentally deleted POST /appointments and every
  // booking from the UI started 404ing. This test keeps the route alive.
  it("books an appointment through the queue-link RPC and returns 201", async () => {
    requireClinicPermissionMock.mockResolvedValue(session as never);
    supabaseRequestMock.mockImplementation((path: string) => {
      if (path.includes("/rest/v1/rpc/create_appointment_with_queue_link")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          data: [{ appointment_id: "a1", booking_id: "b1", booking_number: "B-1", queue_number: 3, queue_path: "/queue/tok123", queue_expires_at: null }],
        });
      }
      return Promise.resolve({ ok: true, status: 200, data: [] });
    });
    await withServer(async (base) => {
      const res = await fetch(`${base}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": "idem-1" },
        body: JSON.stringify({ patientId: "p1", slotId: "slot1" }),
      });
      expect(res.status).toBe(201);
      const body = (await res.json()) as { id?: string; queuePath?: string; queueNumber?: number | null };
      expect(body.id).toBe("a1");
      expect(body.queuePath).toBe("/queue/tok123");
      // The RPC must be scoped to the session clinic, never the client body.
      const [, init] = supabaseRequestMock.mock.calls.find(([p]: [string]) => p.includes("create_appointment_with_queue_link")) ?? [];
      expect(JSON.parse(String((init as { body?: string })?.body)).p_clinic_id).toBe("c1");
      expect(emitClinicEventMock).toHaveBeenCalledWith("c1", "appointment.booked", expect.objectContaining({ appointmentId: "a1" }));
    });
  });

  it("maps an RPC rejection for a taken slot to 409", async () => {
    requireClinicPermissionMock.mockResolvedValue(session as never);
    supabaseRequestMock.mockImplementation((path: string) => {
      if (path.includes("create_appointment_with_queue_link")) {
        return Promise.resolve({ ok: false, status: 409, data: { message: "slot taken" } });
      }
      return Promise.resolve({ ok: true, status: 200, data: [] });
    });
    await withServer(async (base) => {
      const res = await fetch(`${base}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: "p1", slotId: "slot1" }),
      });
      expect(res.status).toBe(409);
    });
  });
});
