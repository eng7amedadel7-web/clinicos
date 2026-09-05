import { describe, expect, it, vi } from "vitest";

vi.mock("../../lib/supabase", () => ({
  supabaseAdminRequest: vi.fn(),
}));

import { resolveOutboundDispatcherConfig } from "../../lib/outbound";

describe("resolveOutboundDispatcherConfig", () => {
  it("returns null when the webhook URL is missing", () => {
    expect(resolveOutboundDispatcherConfig({ N8N_INBOX_OUTBOUND_TOKEN: "tok" })).toBeNull();
  });

  it("returns null when the token is missing", () => {
    expect(resolveOutboundDispatcherConfig({ N8N_INBOX_OUTBOUND_WEBHOOK: "https://hooks.example.com/x" })).toBeNull();
  });

  it("returns null for a non-HTTPS webhook URL", () => {
    expect(
      resolveOutboundDispatcherConfig({
        N8N_INBOX_OUTBOUND_WEBHOOK: "http://hooks.example.com/x",
        N8N_INBOX_OUTBOUND_TOKEN: "tok",
      }),
    ).toBeNull();
  });

  it("returns null for a malformed webhook URL", () => {
    expect(
      resolveOutboundDispatcherConfig({
        N8N_INBOX_OUTBOUND_WEBHOOK: "not a url",
        N8N_INBOX_OUTBOUND_TOKEN: "tok",
      }),
    ).toBeNull();
  });

  it("builds a dispatcher config with the token header for a valid HTTPS URL", () => {
    const config = resolveOutboundDispatcherConfig({
      N8N_INBOX_OUTBOUND_WEBHOOK: " https://hooks.example.com/webhook/abc ",
      N8N_INBOX_OUTBOUND_TOKEN: " secret-token ",
    });
    expect(config).not.toBeNull();
    expect(config?.dispatcherUrl).toBe("https://hooks.example.com/webhook/abc");
    expect(config?.headers["x-meruna-outbound-token"]).toBe("secret-token");
    expect(config?.headers["Content-Type"]).toBe("application/json");
  });
});
