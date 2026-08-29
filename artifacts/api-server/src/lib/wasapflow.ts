import { createHmac, timingSafeEqual } from "node:crypto";
import { logger } from "./logger";

export interface WasapFlowConfig {
  partnerKey: string;
  webhookSecret: string;
  baseUrl: string;
}

export function resolveWasapFlowConfig(): WasapFlowConfig {
  const partnerKey = process.env.WF_PARTNER_KEY?.trim() || "wf_live_9192772d69d0bd88cc3c43fba49ce30f285996031e54f98d";
  const webhookSecret = process.env.WF_WEBHOOK_SECRET?.trim() || "whsec_1c2802fa153ac44cca81a2f92b439753974f0ef65eeeed1d";
  const baseUrl = (process.env.WF_BASE_URL?.trim() || "https://officialapi.wasapflow.com/bridge/v1").replace(/\/+$/, "");

  return { partnerKey, webhookSecret, baseUrl };
}

export async function createWasapFlowConnectSession(clinicId: string, displayName?: string) {
  const config = resolveWasapFlowConfig();
  const url = `${config.baseUrl}/connect/session`;

  const payload = {
    display_name: displayName || "Clinicos Clinic",
    state: clinicId,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-partner-key": config.partnerKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });

    const data = (await res.json()) as {
      success: boolean;
      connect_url?: string;
      token?: string;
      expires_in?: number;
      error?: { code: string; message: string };
    };

    if (!data.success || !data.connect_url) {
      throw new Error(data.error?.message || "Failed to create WasapFlow connect session");
    }

    return {
      connectUrl: data.connect_url,
      token: data.token,
      expiresIn: data.expires_in || 1800,
    };
  } catch (err) {
    logger.error({ err, clinicId }, "[WasapFlow] Failed to create connect session");
    throw Object.assign(
      new Error(err instanceof Error ? err.message : "Could not initialize WhatsApp connection session."),
      { statusCode: 502 }
    );
  }
}

export async function sendWasapFlowMessage(wabaId: string, to: string, text: string) {
  const config = resolveWasapFlowConfig();
  const url = `${config.baseUrl}/messages/send`;

  // Format to standard international digits without '+'
  const cleanTo = to.replace(/\D/g, "");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-partner-key": config.partnerKey,
        "x-waba-id": wabaId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: cleanTo,
        text,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    const data = (await res.json()) as {
      success: boolean;
      message_id?: string;
      messages?: Array<{ id: string }>;
      error?: { code: string; message: string };
    };

    if (!data.success) {
      throw new Error(`${data.error?.code || "SEND_FAILED"}: ${data.error?.message || "WasapFlow send failed"}`);
    }

    const messageId = data.message_id || data.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (err) {
    logger.error({ err, wabaId, to }, "[WasapFlow] Failed to send message");
    throw Object.assign(
      new Error(err instanceof Error ? err.message : "Failed to deliver WhatsApp message via WasapFlow."),
      { statusCode: 502 }
    );
  }
}

export function verifyWasapFlowSignature(rawBody: string | Buffer, signature?: string | null): boolean {
  const config = resolveWasapFlowConfig();
  if (!signature || !config.webhookSecret) return false;

  try {
    const hmac = createHmac("sha256", config.webhookSecret);
    hmac.update(rawBody);
    const expected = `sha256=${hmac.digest("hex")}`;

    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
}
