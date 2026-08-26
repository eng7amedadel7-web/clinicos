import { supabaseAdminRequest } from "./supabase";

/**
 * Channel provider adapters — send outbound replies to external channels.
 *
 * The inbox queues a reply via `fn_send_inbox_reply`, then the outbound
 * dispatcher resolves the conversation's channel + recipient and either sends
 * directly through the configured provider (e.g. WhatsApp Cloud API) or falls
 * back to the n8n dispatcher webhook. Adding a new channel = adding a branch
 * in `sendViaProvider`.
 */

type ConversationContext = {
  channelType?: string;
  channelProvider?: string;
  recipientPhone?: string;
};

type ProviderResult = { sent: boolean };

async function resolveConversationContext(conversationId: string): Promise<ConversationContext | null> {
  const conv = await supabaseAdminRequest<{ patient_id?: string; channel_id?: string }[]>(
    `/rest/v1/conversations?select=patient_id,channel_id&id=eq.${encodeURIComponent(conversationId)}&limit=1`,
  );
  if (!conv.ok || !conv.data?.length) return null;
  const { patient_id, channel_id } = conv.data[0]!;

  const [channelRes, patientRes] = await Promise.all([
    channel_id
      ? supabaseAdminRequest<{ type?: string; provider?: string }[]>(`/rest/v1/channels?select=type,provider&id=eq.${encodeURIComponent(channel_id)}&limit=1`)
      : Promise.resolve({ ok: false as const, status: 0, data: [] as { type?: string; provider?: string }[] }),
    patient_id
      ? supabaseAdminRequest<{ phone?: string; contact_phone?: string }[]>(`/rest/v1/patients?select=phone,contact_phone&id=eq.${encodeURIComponent(patient_id)}&limit=1`)
      : Promise.resolve({ ok: false as const, status: 0, data: [] as { phone?: string; contact_phone?: string }[] }),
  ]);

  const patient = patientRes.data?.[0];
  return {
    channelType: channelRes.data?.[0]?.type,
    channelProvider: channelRes.data?.[0]?.provider,
    recipientPhone: patient?.phone || patient?.contact_phone || undefined,
  };
}

async function sendWhatsAppText(to: string, text: string): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneNumberId) return false;
  const normalized = to.replace(/[^\d]/g, "");
  if (normalized.length < 8) return false;
  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: normalized, type: "text", text: { body: text.slice(0, 4096) } }),
      signal: AbortSignal.timeout(20_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Send through the channel's native provider when credentials are configured. */
async function sendViaProvider(ctx: ConversationContext, text: string): Promise<ProviderResult> {
  if (ctx.channelType === "whatsapp" && ctx.recipientPhone) {
    return { sent: await sendWhatsAppText(ctx.recipientPhone, text) };
  }
  // instagram/messenger/telegram adapters can be added here.
  return { sent: false };
}

async function updateMessageStatus(messageId: string, status: string): Promise<void> {
  await supabaseAdminRequest(`/rest/v1/messages?id=eq.${encodeURIComponent(messageId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message_status: status }),
  });
}

/**
 * Resolve the channel context for a conversation and dispatch the reply:
 * directly via the provider when available, returning context for the n8n
 * fallback otherwise.
 */
export async function dispatchDirect(conversationId: string, messageId: string | undefined, content: string): Promise<{ delivered: boolean; context: ConversationContext | null }> {
  const context = await resolveConversationContext(conversationId);
  if (!context) return { delivered: false, context: null };

  const { sent } = await sendViaProvider(context, content);
  if (sent && messageId) {
    await updateMessageStatus(messageId, "sent");
    return { delivered: true, context };
  }
  return { delivered: false, context };
}
