import { dispatchDirect } from "./channels";

export type OutboundConfig = { dispatcherUrl: string; headers: Record<string, string> };

export function resolveOutboundDispatcherConfig(env: Partial<Record<"N8N_INBOX_OUTBOUND_WEBHOOK" | "N8N_INBOX_OUTBOUND_TOKEN", string>> = process.env): OutboundConfig {
  const rawUrl = env.N8N_INBOX_OUTBOUND_WEBHOOK?.trim();
  if (!rawUrl) throw Object.assign(new Error("Outbound messaging is not configured for this environment."), { statusCode: 503 });
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw Object.assign(new Error("Outbound messaging configuration is invalid."), { statusCode: 503 });
  }
  if (url.protocol !== "https:") throw Object.assign(new Error("Outbound messaging requires a secure webhook endpoint."), { statusCode: 503 });
  const token = env.N8N_INBOX_OUTBOUND_TOKEN?.trim();
  return { dispatcherUrl: url.toString(), headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } };
}

export type OutboundPayload = {
  conversationId: string;
  messageId?: string;
  content?: string;
};

/**
 * Deliver an outbound reply. Tries a direct provider adapter first (WhatsApp
 * Cloud API, etc.) so replies actually reach the external channel without n8n.
 * Falls back to the n8n dispatcher webhook — forwarding the full context
 * (message content, id) so the workflow can route to any channel — when no
 * direct adapter is configured or it fails.
 */
export async function dispatchOutbound(conversationId: string, payload: OutboundPayload = {}): Promise<void> {
  // 1. Direct provider dispatch (best-effort; never throws into the caller).
  if (payload.content) {
    try {
      const { delivered } = await dispatchDirect(conversationId, payload.messageId, payload.content);
      if (delivered) return;
    } catch {
      /* fall through to n8n */
    }
  }

  // 2. n8n dispatcher fallback with full context.
  const config = resolveOutboundDispatcherConfig();
  let response: Response;
  try {
    response = await fetch(config.dispatcherUrl, {
      method: "POST",
      headers: config.headers,
      body: JSON.stringify({ conversation_id: conversationId, message_id: payload.messageId ?? null, content: payload.content ?? null }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw Object.assign(new Error("Outbound dispatcher could not be reached."), { statusCode: 502 });
  }
  if (!response.ok) throw Object.assign(new Error(`Outbound dispatcher failed (${response.status}).`), { statusCode: 502 });
}
