import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveWasapFlowConfig, verifyWasapFlowSignature } from "../../lib/wasapflow";

const ENV_KEYS = ["WF_PARTNER_KEY", "WF_WEBHOOK_SECRET", "WF_BASE_URL"] as const;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key];
    }
  }
});

describe("resolveWasapFlowConfig", () => {
  it("returns empty credentials when env vars are not set (no hardcoded fallbacks)", () => {
    const config = resolveWasapFlowConfig();
    expect(config.partnerKey).toBe("");
    expect(config.webhookSecret).toBe("");
  });

  it("never falls back to a live-looking partner key", () => {
    const config = resolveWasapFlowConfig();
    expect(config.partnerKey).not.toMatch(/^wf_live_/);
    expect(config.webhookSecret).not.toMatch(/^whsec_/);
  });

  it("reads credentials from env and trims whitespace", () => {
    process.env.WF_PARTNER_KEY = "  wf_test_key  ";
    process.env.WF_WEBHOOK_SECRET = " whsec_test ";
    const config = resolveWasapFlowConfig();
    expect(config.partnerKey).toBe("wf_test_key");
    expect(config.webhookSecret).toBe("whsec_test");
  });

  it("uses the default bridge base URL and strips trailing slashes", () => {
    process.env.WF_BASE_URL = "https://example.com/bridge/v1///";
    const config = resolveWasapFlowConfig();
    expect(config.baseUrl).toBe("https://example.com/bridge/v1");
  });
});

describe("verifyWasapFlowSignature", () => {
  const body = JSON.stringify({ event: "message", id: "abc123" });

  it("accepts a correctly signed payload", () => {
    process.env.WF_WEBHOOK_SECRET = "test-secret";
    const signature = `sha256=${createHmac("sha256", "test-secret").update(body).digest("hex")}`;
    expect(verifyWasapFlowSignature(body, signature)).toBe(true);
  });

  it("rejects a tampered payload", () => {
    process.env.WF_WEBHOOK_SECRET = "test-secret";
    const signature = `sha256=${createHmac("sha256", "test-secret").update(body).digest("hex")}`;
    expect(verifyWasapFlowSignature(`${body} `, signature)).toBe(false);
  });

  it("rejects when the signature is missing", () => {
    process.env.WF_WEBHOOK_SECRET = "test-secret";
    expect(verifyWasapFlowSignature(body, undefined)).toBe(false);
    expect(verifyWasapFlowSignature(body, null)).toBe(false);
    expect(verifyWasapFlowSignature(body, "")).toBe(false);
  });

  it("fails closed when no webhook secret is configured", () => {
    const signature = `sha256=${createHmac("sha256", "anything").update(body).digest("hex")}`;
    expect(verifyWasapFlowSignature(body, signature)).toBe(false);
  });

  it("rejects malformed signatures without throwing", () => {
    process.env.WF_WEBHOOK_SECRET = "test-secret";
    expect(verifyWasapFlowSignature(body, "not-a-signature")).toBe(false);
    expect(verifyWasapFlowSignature(body, "sha256=zzz")).toBe(false);
  });
});
