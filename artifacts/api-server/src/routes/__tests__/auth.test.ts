import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import router from "../auth";

const readSessionMock = vi.fn();
const writeSessionMock = vi.fn();
const clearSessionMock = vi.fn();
const supabaseAuthRequestMock = vi.fn();
const supabaseAdminRequestMock = vi.fn();
const supabaseRequestMock = vi.fn();

vi.mock("../../lib/session", () => ({
  readSession: (...args: unknown[]) => readSessionMock(...args),
  writeSession: (...args: unknown[]) => writeSessionMock(...args),
  clearSession: (...args: unknown[]) => clearSessionMock(...args),
  SESSION_COOKIE: "meruna_session",
}));
vi.mock("../../lib/supabase", () => ({
  supabaseAuthRequest: (...args: unknown[]) => supabaseAuthRequestMock(...args),
  supabaseAdminRequest: (...args: unknown[]) => supabaseAdminRequestMock(...args),
  supabaseRequest: (...args: unknown[]) => supabaseRequestMock(...args),
  getSupabasePublicConfig: () => null,
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

const session = { accessToken: "tok", userId: "u1", email: "e@x.com", clinicId: "c1", remember: true };

// Profile lookup chain: users → user_roles → roles + clinic_staff + clinics.
function dispatchSupabase(path: string, overrides: { userRoles?: unknown[]; authUser?: { id?: string } } = {}) {
  const ok = (data: unknown) => ({ ok: true, status: 200, data });
  if (path.startsWith("/auth/v1/user")) return ok(overrides.authUser ?? { id: "u1", email: "e@x.com" });
  if (path.includes("/rest/v1/users?")) return ok([{ full_name: "أحمد" }]);
  if (path.includes("/rest/v1/user_roles?")) return ok(overrides.userRoles ?? [{ clinic_id: "c1", role_id: "r1", branch_id: null, expires_at: null }]);
  if (path.includes("/rest/v1/roles?")) return ok([{ name: "owner" }]);
  if (path.includes("/rest/v1/clinic_staff?")) return ok([{ role: "owner" }]);
  if (path.includes("/rest/v1/clinics?")) return ok([{ id: "c1", name: "عيادة النور", status: "active", timezone: "Africa/Cairo", location_config: { city: "القاهرة" } }]);
  return ok([]);
}

afterEach(() => {
  readSessionMock.mockReset();
  writeSessionMock.mockReset();
  clearSessionMock.mockReset();
  supabaseAuthRequestMock.mockReset();
  supabaseAdminRequestMock.mockReset();
  supabaseRequestMock.mockReset();
});
describe("auth route", () => {
  it("rejects a malformed login body with 400", async () => {
    await withServer(async (base) => {
      const res = await fetch(`${base}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email", password: "123" }),
      });
      expect(res.status).toBe(400);
    });
  });

  it("maps rejected credentials to 400 with the Arabic message", async () => {
    supabaseAuthRequestMock.mockResolvedValue({ ok: false, status: 400, data: { msg: "Invalid login credentials" } });
    await withServer(async (base) => {
      const res = await fetch(`${base}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "e@x.com", password: "password123" }),
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error?: string };
      expect(body.error).toContain("غير صحيحة");
    });
  });

  it("tells the user when the email is not confirmed", async () => {
    supabaseAuthRequestMock.mockResolvedValue({ ok: false, status: 400, data: { msg: "Email not confirmed" } });
    await withServer(async (base) => {
      const res = await fetch(`${base}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "e@x.com", password: "password123" }),
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error?: string };
      expect(body.error).toContain("غير مؤكد");
    });
  });

  it("logs in, resolves the profile, and writes the session scoped to the clinic", async () => {
    supabaseAuthRequestMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: { access_token: "at", refresh_token: "rt", user: { id: "u1", email: "e@x.com", user_metadata: {} } },
    });
    supabaseRequestMock.mockImplementation((path: string) => Promise.resolve(dispatchSupabase(path)));
    await withServer(async (base) => {
      const res = await fetch(`${base}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "e@x.com", password: "password123" }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { user?: { fullName?: string; role?: string }; clinic?: { name?: string; city?: string } };
      expect(body.user).toMatchObject({ fullName: "أحمد", role: "owner" });
      expect(body.clinic).toMatchObject({ name: "عيادة النور", city: "القاهرة" });
      expect(writeSessionMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ clinicId: "c1", userId: "u1" }));
    });
  });

  it("refuses login for an account with no active clinic (403)", async () => {
    supabaseAuthRequestMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: { access_token: "at", refresh_token: "rt", user: { id: "u1", email: "e@x.com", user_metadata: {} } },
    });
    supabaseRequestMock.mockImplementation((path: string) => Promise.resolve(dispatchSupabase(path, { userRoles: [] })));
    await withServer(async (base) => {
      const res = await fetch(`${base}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "e@x.com", password: "password123" }),
      });
      expect(res.status).toBe(403);
    });
  });

  it("rejects a registration with a short password (400)", async () => {
    await withServer(async (base) => {
      const res = await fetch(`${base}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: "أحمد", clinicName: "عيادة", email: "e@x.com", password: "123" }),
      });
      expect(res.status).toBe(400);
    });
  });

  it("recognizes an already-registered email during signup", async () => {
    supabaseAdminRequestMock.mockResolvedValue({ ok: false, status: 400, data: { msg: "User already registered" } });
    await withServer(async (base) => {
      const res = await fetch(`${base}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: "أحمد", clinicName: "عيادة النور", email: "e@x.com", password: "password123" }),
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error?: string };
      expect(body.error).toContain("مسجل مسبقاً");
    });
  });

  it("returns 401 for a session request without a cookie", async () => {
    readSessionMock.mockReturnValue(null);
    await withServer(async (base) => {
      const res = await fetch(`${base}/session`);
      expect(res.status).toBe(401);
    });
  });

  it("clears the session when the auth user no longer matches it", async () => {
    readSessionMock.mockReturnValue(session);
    supabaseRequestMock.mockImplementation((path: string) => Promise.resolve(dispatchSupabase(path, { authUser: { id: "someone-else" } })));
    await withServer(async (base) => {
      const res = await fetch(`${base}/session`);
      expect(res.status).toBe(401);
      expect(clearSessionMock).toHaveBeenCalled();
    });
  });

  it("signs out with 204", async () => {
    await withServer(async (base) => {
      const res = await fetch(`${base}/logout`, { method: "POST" });
      expect(res.status).toBe(204);
      expect(clearSessionMock).toHaveBeenCalled();
    });
  });
});
