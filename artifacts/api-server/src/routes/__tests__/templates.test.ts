import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import router from "../templates";

const readSessionMock = vi.fn();
const supabaseRequestMock = vi.fn();

vi.mock("../../lib/session", () => ({
  readSession: (...args: unknown[]) => readSessionMock(...args),
}));
vi.mock("../../lib/supabase", () => ({
  supabaseRequest: (...args: unknown[]) => supabaseRequestMock(...args),
}));
vi.mock("../../lib/permissions", () => ({
  requireClinicPermission: vi.fn(),
  respondToPermissionError: vi.fn(),
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

afterEach(() => {
  readSessionMock.mockReset();
  supabaseRequestMock.mockReset();
});

describe("templates route", () => {
  it("returns 401 when there is no session", async () => {
    readSessionMock.mockReturnValue(null);
    await withServer(async (base) => {
      const res = await fetch(`${base}/templates`);
      expect(res.status).toBe(401);
    });
  });

  it("rejects an invalid template body with 400", async () => {
    readSessionMock.mockReturnValue(session);
    await withServer(async (base) => {
      const res = await fetch(`${base}/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "", content: "" }),
      });
      expect(res.status).toBe(400);
    });
  });

  it("creates a template with 201 on valid body", async () => {
    readSessionMock.mockReturnValue(session);
    supabaseRequestMock.mockResolvedValue({ ok: true, status: 201, data: [] });
    await withServer(async (base) => {
      const res = await fetch(`${base}/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "ترحيب", content: "أهلاً {{patient_name}}" }),
      });
      expect(res.status).toBe(201);
      const body = (await res.json()) as { title?: string };
      expect(body.title).toBe("ترحيب");
    });
  });

  it("falls back to default templates when the DB has none", async () => {
    readSessionMock.mockReturnValue(session);
    supabaseRequestMock.mockResolvedValue({ ok: true, status: 200, data: [] });
    await withServer(async (base) => {
      const res = await fetch(`${base}/templates`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as unknown[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });
  });
});
