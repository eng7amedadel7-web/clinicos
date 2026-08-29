import { supabaseAdminRequest } from "./supabase";
import { sendWasapFlowMessage } from "./wasapflow";
import { logger } from "./logger";

export type OutboundConfig = { dispatcherUrl: string; headers: Record<string, string> };

export function resolveOutboundDispatcherConfig(env: Partial<Record<"N8N_INBOX_OUTBOUND_WEBHOOK" | "N8N_INBOX_OUTBOUND_TOKEN", string>> = process.env): OutboundConfig | null {
  const rawUrl = env.N8N_INBOX_OUTBOUND_WEBHOOK?.trim();
  const token = env.N8N_INBOX_OUTBOUND_TOKEN?.trim();
  if (!rawUrl || !token) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  return {
    dispatcherUrl: url.toString(),
    headers: { "Content-Type": "application/json", "x-meruna-outbound-token": token },
  };
}

export async function dispatchOutbound(conversationId: string, messageId?: string | null) {
  // 1. Check if this conversation uses WasapFlow WhatsApp channel
  try {
    const convLookup = await supabaseAdminRequest<Array<{
      id: string;
      clinic_id: string;
      channel_id: string;
      patient_id: string;
      channels?: { id: string; provider: string; type: string; config: Record<string, any> };
      patients?: { phone: string; name?: string };
    }>>(
      `/rest/v1/conversations?select=id,clinic_id,channel_id,patient_id,channels(id,provider,type,config),patients(phone,name)&id=eq.${encodeURIComponent(conversationId)}&limit=1`
    );

    const conv = convLookup.data?.[0];
    const channel = conv?.channels;
    const patientPhone = conv?.patients?.phone;
    const wabaId = channel?.config?.waba_id;

    if (channel?.provider === "wasapflow" && wabaId && patientPhone) {
      // Find the message content
      const msgLookup = await supabaseAdminRequest<Array<{ id: string; content: string }>>(
        `/rest/v1/messages?select=id,content&conversation_id=eq.${encodeURIComponent(conversationId)}&direction=eq.outgoing&order=created_at.desc&limit=1`
      );

      const msg = msgLookup.data?.[0];
      if (msg && msg.content) {
        const sendRes = await sendWasapFlowMessage(wabaId, patientPhone, msg.content);
        if (sendRes.success) {
          await supabaseAdminRequest(`/rest/v1/messages?id=eq.${encodeURIComponent(msg.id)}`, {
            method: "PATCH",
            body: JSON.stringify({ message_status: "delivered" }),
          });
          logger.info({ conversationId, messageId: msg.id, wabaId }, "[Outbound] Message sent directly via WasapFlow Bridge");
          return;
        }
      }
    }
  } catch (err) {
    logger.warn({ err, conversationId }, "[Outbound] WasapFlow direct send attempt failed, trying n8n webhook");
  }

  // 2. Fallback to n8n outbound webhook dispatcher
  const config = resolveOutboundDispatcherConfig();
  if (!config) {
    logger.info({ conversationId }, "[Outbound] No n8n dispatcher configured, message queued in DB");
    return;
  }

  const payload = { conversation_id: conversationId, ...(messageId ? { message_id: messageId } : {}) };
  let response: Response;
  try {
    response = await fetch(config.dispatcherUrl, {
      method: "POST",
      headers: config.headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw Object.assign(new Error("Outbound dispatcher could not be reached."), { statusCode: 502 });
  }
  if (!response.ok) throw Object.assign(new Error(`Outbound dispatcher failed (${response.status}).`), { statusCode: 502 });
}

