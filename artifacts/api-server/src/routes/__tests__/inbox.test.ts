import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import router from "../inbox";

const requireClinicPermissionMock = vi.fn();
const respondToPermissionErrorMock = vi.fn();
const supabaseRequestMock = vi.fn();
const supabaseAdminRequestMock = vi.fn();
const dispatchOutboundMock = vi.fn();
const emitClinicEventMock = vi.fn();

vi.mock("../../lib/permissions", () => ({
  requireClinicPermission: (...args: unknown[]) => requireClinicPermissionMock(...args),
  respondToPermissionError: (...args: unknown[]) => respondToPermissionErrorMock(...args),
}));
vi.mock("../../lib/supabase", () => ({
  supabaseRequest: (...args: unknown[]) => supabaseRequestMock(...args),
  supabaseAdminRequest: (...args: unknown[]) => supabaseAdminRequestMock(...args),
}));
vi.mock("../../lib/outbound", () => ({
  dispatchOutbound: (...args: unknown[]) => dispatchOutboundMock(...args),
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

const conversationRows = [
  { id: "conv1", patient_id: "p1", channel_id: "ch1", channel_conversation_id: "wa-123", last_patient_message: "مرحبا", assigned_staff_id: null, ai_status: "active", is_handoff: false, last_activity_at: "2026-09-09T10:00:00Z", status: "active", priority: "normal" },
  { id: "conv2", patient_id: "p2", channel_id: "ch2", channel_conversation_id: null, last_patient_message: null, assigned_staff_id: null, ai_status: "paused", is_handoff: true, last_activity_at: "2026-09-09T09:00:00Z", status: "active", priority: "high" },
];

function dispatchSupabase(path: string) {
  const ok = (data: unknown) => ({ ok: true, status: 200, data });
  // Order matters: the longer conversations select must be matched before the
  // bare ownership check (assertConversation) which selects only id.
  if (path.includes("/rest/v1/conversations?select=id,patient_id")) return ok(conversationRows);
  if (path.includes("/rest/v1/conversations?select=id&")) return ok([{ id: "conv1" }]);
  if (path.includes("/rest/v1/messages?")) return ok([{ id: "m2", conversation_id: "conv1", content: "ثانيًا", direction: "incoming", sender_type: "patient", created_at: "2026-09-09T10:01:00Z", message_status: "delivered" }]);
  if (path.includes("/rest/v1/patients?")) return ok([{ id: "p1", name: "أحمد علي", first_name: null, last_name: null }]);
  if (path.includes("/rest/v1/channels?")) return ok([
    { id: "ch1", type: "whatsapp", provider: "wasapflow", status: "connected", is_enabled: true, config: { display_name: "واتساب العيادة" } },
    { id: "ch2", type: "sms", provider: null, status: "connected", is_enabled: true, config: null },
  ]);
  if (path.includes("/rest/v1/notification_templates?")) return ok([{ id: "t1", template_key: "welcome", language: "ar", body_template: "أهلاً", enabled: true, updated_at: null }]);
  if (path.includes("/rest/v1/domain_events")) return ok([{ id: "evt1", event_type: "conversation.internal_note.created", actor_type: "user", metadata: { content: "ملاحظة" }, occurred_at: "2026-09-09T10:05:00Z", created_at: "2026-09-09T10:05:00Z" }]);
  return ok([]);
}

afterEach(() => {
  requireClinicPermissionMock.mockReset();
  supabaseRequestMock.mockReset();
  supabaseAdminRequestMock.mockReset();
  dispatchOutboundMock.mockReset();
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

describe("inbox route", () => {
  it("returns 401 when the caller has no permission", async () => {
    requireClinicPermissionMock.mockRejectedValue(Object.assign(new Error("unauthenticated"), { statusCode: 401 }));
    await withServer(async (base) => {
      const res = await fetch(`${base}/inbox`);
      expect(res.status).toBe(401);
    });
  });

  it("builds the unified payload: channels filtered, conversations mapped, first conversation selected", async () => {
    requireClinicPermissionMock.mockResolvedValue(session as never);
    supabaseRequestMock.mockImplementation((path: string) => Promise.resolve(dispatchSupabase(path)));
    await withServer(async (base) => {
      const res = await fetch(`${base}/inbox`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        channels: Array<{ id?: string; displayName?: string; isEnabled?: boolean }>;
        channelCounts: Record<string, number>;
        conversations: Array<{ id?: string; name?: string; mode?: string; needsStaff?: boolean; channelStatus?: string }>;
        selectedConversationId: string | null;
        messages: unknown[];
      };
      // SMS is not a supported channel type — it must not surface in the UI list.
      expect(body.channels).toHaveLength(1);
      expect(body.channels[0]?.displayName).toBe("واتساب العيادة");
      expect(body.channelCounts).toMatchObject({ whatsapp: 1, instagram: 0, messenger: 0, telegram: 0 });
      expect(body.conversations[0]).toMatchObject({ id: "conv1", name: "أحمد علي", mode: "AI", needsStaff: true, channelStatus: "connected" });
      expect(body.conversations[1]).toMatchObject({ mode: "Human" });
      expect(body.selectedConversationId).toBe("conv1");
      // No explicit conversationId: the server auto-selects the first
      // conversation and loads its messages right away.
      expect(body.messages).toHaveLength(1);
    });
  });

  it("returns the selected conversation messages newest-first", async () => {
    requireClinicPermissionMock.mockResolvedValue(session as never);
    supabaseRequestMock.mockImplementation((path: string) => Promise.resolve(dispatchSupabase(path)));
    await withServer(async (base) => {
      const res = await fetch(`${base}/inbox?conversationId=conv1`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { messages: Array<{ id?: string }> };
      expect(body.messages).toHaveLength(1);
      expect(body.messages[0]?.id).toBe("m2");
    });
  });

  it("passes through the conversation audit trail", async () => {
    requireClinicPermissionMock.mockResolvedValue(session as never);
    supabaseRequestMock.mockImplementation((path: string) => Promise.resolve(dispatchSupabase(path)));
    await withServer(async (base) => {
      const res = await fetch(`${base}/inbox/conv1/operations`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as Array<{ event_type?: string }>;
      expect(body[0]?.event_type).toBe("conversation.internal_note.created");
    });
  });

  it("returns saved replies for the requested language", async () => {
    requireClinicPermissionMock.mockResolvedValue(session as never);
    supabaseRequestMock.mockImplementation((path: string) => Promise.resolve(dispatchSupabase(path)));
    await withServer(async (base) => {
      const res = await fetch(`${base}/inbox/saved-replies?language=ar`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as Array<{ template_key?: string }>;
      expect(body[0]?.template_key).toBe("welcome");
    });
  });

  it("rejects an empty internal note with 400", async () => {
    requireClinicPermissionMock.mockResolvedValue(session as never);
    await withServer(async (base) => {
      const res = await fetch(`${base}/inbox/conv1/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "   " }),
      });
      expect(res.status).toBe(400);
    });
  });

  it("rejects an invalid conversation mode with 400", async () => {
    requireClinicPermissionMock.mockResolvedValue(session as never);
    await withServer(async (base) => {
      const res = await fetch(`${base}/inbox/conv1/mode`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "ROBOT" }),
      });
      expect(res.status).toBe(400);
    });
  });

  it("rejects an empty outgoing message with 400", async () => {
    requireClinicPermissionMock.mockResolvedValue(session as never);
    // Ownership check runs before the content validation.
    supabaseRequestMock.mockImplementation((path: string) => Promise.resolve(dispatchSupabase(path)));
    await withServer(async (base) => {
      const res = await fetch(`${base}/inbox/conv1/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "" }),
      });
      expect(res.status).toBe(400);
    });
  });

  it("stores an internal note as a domain event and emits realtime", async () => {
    requireClinicPermissionMock.mockResolvedValue(session as never);
    supabaseRequestMock.mockImplementation((path: string) => Promise.resolve(dispatchSupabase(path)));
    await withServer(async (base) => {
      const res = await fetch(`${base}/inbox/conv1/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "ملاحظة داخلية" }),
      });
      expect(res.status).toBe(201);
      const body = (await res.json()) as { event_type?: string };
      expect(body.event_type).toBe("conversation.internal_note.created");
      expect(emitClinicEventMock).toHaveBeenCalledWith("c1", "inbox.note_added", expect.objectContaining({ conversationId: "conv1" }));
    });
  });
});
