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
  try {
    // 1. Fetch conversation details
    const convLookup = await supabaseAdminRequest<Array<{
      id: string;
      clinic_id: string;
      channel_id?: string | null;
      patient_id?: string | null;
      channel_conversation_id?: string | null;
    }>>(
      `/rest/v1/conversations?select=id,clinic_id,channel_id,patient_id,channel_conversation_id&id=eq.${encodeURIComponent(conversationId)}&limit=1`
    );

    const conv = convLookup.data?.[0];
    if (!conv) {
      logger.warn({ conversationId }, "[Outbound] Conversation not found in Supabase");
      return;
    }

    const clinicId = conv.clinic_id;

    // 2. Fetch the message to send
    const msgLookup = await supabaseAdminRequest<Array<{ id: string; content: string; message_status?: string }>>(
      messageId
        ? `/rest/v1/messages?select=id,content,message_status&id=eq.${encodeURIComponent(messageId)}&limit=1`
        : `/rest/v1/messages?select=id,content,message_status&conversation_id=eq.${encodeURIComponent(conversationId)}&direction=eq.outgoing&order=created_at.desc&limit=1`
    );

    const msg = msgLookup.data?.[0];
    if (!msg || !msg.content) {
      logger.warn({ conversationId, messageId }, "[Outbound] Message content empty or not found");
      return;
    }

    // 3. Resolve recipient phone / external ID
    let recipientPhone = conv.channel_conversation_id?.trim() || "";
    if (conv.patient_id) {
      const patLookup = await supabaseAdminRequest<Array<{ phone?: string | null; name?: string | null }>>(
        `/rest/v1/patients?select=phone,name&id=eq.${encodeURIComponent(conv.patient_id)}&limit=1`
      );
      if (patLookup.data?.[0]?.phone) {
        recipientPhone = patLookup.data[0].phone.trim();
      }
    }

    // 4. Resolve Channel Config
    let channel: { id?: string; type?: string; provider?: string; config?: Record<string, any>; status?: string } | null = null;

    if (conv.channel_id) {
      const chanLookup = await supabaseAdminRequest<Array<{ id: string; type: string; provider: string; config: Record<string, any>; status: string }>>(
        `/rest/v1/channels?select=id,type,provider,config,status&id=eq.${encodeURIComponent(conv.channel_id)}&limit=1`
      );
      if (chanLookup.data?.[0]) {
        channel = chanLookup.data[0];
      }
    }

    // Fallback: lookup active channels for clinic
    if (!channel && clinicId) {
      const clinicChanLookup = await supabaseAdminRequest<Array<{ id: string; type: string; provider: string; config: Record<string, any>; status: string }>>(
        `/rest/v1/channels?select=id,type,provider,config,status&clinic_id=eq.${encodeURIComponent(clinicId)}&is_enabled=eq.true&order=updated_at.desc&limit=5`
      );
      if (clinicChanLookup.data?.length) {
        channel = clinicChanLookup.data[0];
      }
    }

    // Also check clinic location_config for credentials
    let clinicChannelsConfig: Record<string, any> | undefined;
    if (clinicId) {
      const clinicLookup = await supabaseAdminRequest<Array<{ location_config?: Record<string, any> }>>(
        `/rest/v1/clinics?select=location_config&id=eq.${encodeURIComponent(clinicId)}&limit=1`
      );
      clinicChannelsConfig = clinicLookup.data?.[0]?.location_config?.channels;
    }

    const wabaId = channel?.config?.waba_id || channel?.config?.wabaId || clinicChannelsConfig?.whatsapp?.wabaId;
    const isWasapFlow = channel?.provider === "wasapflow" || Boolean(wabaId);
    const botToken = channel?.config?.bot_token || channel?.config?.botToken || clinicChannelsConfig?.telegram?.botToken;
    const isTelegram = channel?.type === "telegram" || channel?.provider === "telegram_direct" || Boolean(botToken);
    const tgChatId = conv.channel_conversation_id || recipientPhone;

    // Delivery 1: WasapFlow WhatsApp Bridge
    if (isWasapFlow && wabaId && recipientPhone) {
      try {
        const sendRes = await sendWasapFlowMessage(wabaId, recipientPhone, msg.content);
        if (sendRes.success) {
          await supabaseAdminRequest(`/rest/v1/messages?id=eq.${encodeURIComponent(msg.id)}`, {
            method: "PATCH",
            body: JSON.stringify({ message_status: "delivered" }),
          });
          logger.info({ conversationId, messageId: msg.id, wabaId }, "[Outbound] Message delivered via WasapFlow Bridge");
          return;
        }
      } catch (wfErr) {
        logger.warn({ wfErr, conversationId }, "[Outbound] WasapFlow send failed, trying fallbacks");
      }
    }

    // Delivery 2: Direct Telegram Bot
    if (isTelegram && botToken && tgChatId) {
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: tgChatId, text: msg.content }),
          signal: AbortSignal.timeout(15_000),
        });
        if (tgRes.ok) {
          await supabaseAdminRequest(`/rest/v1/messages?id=eq.${encodeURIComponent(msg.id)}`, {
            method: "PATCH",
            body: JSON.stringify({ message_status: "delivered" }),
          });
          logger.info({ conversationId, messageId: msg.id }, "[Outbound] Message delivered via Telegram Bot");
          return;
        }
      } catch (tgErr) {
        logger.warn({ tgErr, conversationId }, "[Outbound] Telegram send failed, trying n8n fallback");
      }
    }

    // Delivery 3: n8n / Custom Webhook Dispatcher
    const config = resolveOutboundDispatcherConfig();
    if (config) {
      const payload = {
        conversation_id: conversationId,
        message_id: msg.id,
        content: msg.content,
        phone: recipientPhone,
        channel_type: channel?.type || "whatsapp",
        channel_conversation_id: conv.channel_conversation_id,
      };
      const response = await fetch(config.dispatcherUrl, {
        method: "POST",
        headers: config.headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20_000),
      });
      if (response.ok) {
        await supabaseAdminRequest(`/rest/v1/messages?id=eq.${encodeURIComponent(msg.id)}`, {
          method: "PATCH",
          body: JSON.stringify({ message_status: "delivered" }),
        });
        logger.info({ conversationId, messageId: msg.id }, "[Outbound] Message delivered via n8n dispatcher");
        return;
      }
    }
  } catch (error) {
    logger.error({ error, conversationId }, "[Outbound] Unexpected error in dispatchOutbound");
  }
}

