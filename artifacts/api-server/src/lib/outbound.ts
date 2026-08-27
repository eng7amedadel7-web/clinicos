export type OutboundConfig = { dispatcherUrl: string; headers: Record<string, string> };

export function resolveOutboundDispatcherConfig(env: Partial<Record<"N8N_INBOX_OUTBOUND_WEBHOOK" | "N8N_INBOX_OUTBOUND_TOKEN", string>> = process.env): OutboundConfig {
  const rawUrl = env.N8N_INBOX_OUTBOUND_WEBHOOK?.trim() || "https://meruna-n8n-railway-production.up.railway.app/webhook/inbox-outbound";
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw Object.assign(new Error("Outbound messaging configuration is invalid."), { statusCode: 503 });
  }
  if (url.protocol !== "https:") throw Object.assign(new Error("Outbound messaging requires a secure webhook endpoint."), { statusCode: 503 });
  const token = env.N8N_INBOX_OUTBOUND_TOKEN?.trim() || "70J0/uffKw8jklLnDRFkCJJHxm6AxeyM";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["x-meruna-outbound-token"] = token;
    headers["Authorization"] = token;
    if (!token.toLowerCase().startsWith("bearer ")) {
      headers["X-API-KEY"] = token;
      headers["x-token"] = token;
    }
  }
  return { dispatcherUrl: url.toString(), headers };
}

export async function dispatchOutbound(conversationId: string, messageId?: string | null) {
  const config = resolveOutboundDispatcherConfig();
  const payload = { conversation_id: conversationId, ...(messageId ? { message_id: messageId } : {}) };
  let response: Response;
  try {
    response = await fetch(config.dispatcherUrl, { method: "POST", headers: config.headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(20_000) });
  } catch {
    throw Object.assign(new Error("Outbound dispatcher could not be reached."), { statusCode: 502 });
  }
  if (!response.ok) throw Object.assign(new Error(`Outbound dispatcher failed (${response.status}).`), { statusCode: 502 });
}
