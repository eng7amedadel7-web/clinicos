import { timingSafeEqual } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { supabaseAdminRequest, supabaseRequest } from "../lib/supabase";
import { clinicEvents } from "../lib/events";
import { logger } from "../lib/logger";

const router = Router();

type InboundPayload = {
  clinicId?: string;
  clinic_id?: string;
  channelType?: string;
  channel_type?: string;
  channelId?: string;
  channel_id?: string;
  senderPhone?: string;
  phone?: string;
  sender_phone?: string;
  sender_id?: string;
  senderName?: string;
  name?: string;
  sender_name?: string;
  patient_name?: string;
  content?: string;
  message?: string;
  text?: string;
  externalMessageId?: string;
  external_message_id?: string;
  metadata?: Record<string, unknown>;
};

type Row = Record<string, unknown> & { id: string };

function verifyInboundSecret(req: Request): boolean {
  const configuredSecret = process.env.INBOX_INBOUND_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  if (!configuredSecret) {
    // Without a configured secret there is nothing to verify against; only
    // development/internal traffic may proceed, never production.
    return !isProduction;
  }
  const provided = (
    req.headers["x-inbound-secret"] ||
    req.headers["x-webhook-secret"] ||
    req.headers["authorization"]?.replace(/^Bearer\s+/i, "")
  );
  if (typeof provided !== "string") return false;
  const providedBytes = Buffer.from(provided.trim());
  const configuredBytes = Buffer.from(configuredSecret);
  return providedBytes.length === configuredBytes.length && timingSafeEqual(providedBytes, configuredBytes);
}

const HANDOFF_KEYWORDS = [
  "موظف",
  "بشري",
  "خدمة العملاء",
  "خدمه العملاء",
  "انسان",
  "إنسان",
  "طبيب",
  "دكتور",
  "تحويل",
  "مساعدة",
  "طوارئ",
  "human",
  "agent",
  "representative",
  "doctor",
  "support",
  "handoff",
];

function shouldTriggerHandoff(text: string): boolean {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return HANDOFF_KEYWORDS.some((kw) => normalized.includes(kw));
}

function normalizePhone(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/[^0-9]/g, "");
  if (digits.length < 7 || digits.length > 15) return "";
  return `${trimmed.startsWith("+") ? "+" : ""}${digits}`;
}

async function handleInbound(req: Request, res: Response) {
  if (!verifyInboundSecret(req)) {
    res.status(401).json({ error: "Invalid or missing inbound webhook secret." });
    return;
  }

  const body = req.body as InboundPayload;
  const suppliedClinicId = (body.clinicId || body.clinic_id || "").trim();
  const channelType = (body.channelType || body.channel_type || "whatsapp").toLowerCase();
  let channelId = (body.channelId || body.channel_id || "").trim();
  let clinicId = "";
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const explicitPhone = (body.senderPhone || body.phone || body.sender_phone || "").trim();
  const rawPhone = (explicitPhone || body.sender_id || "").trim();
  const normalizedPhone = explicitPhone ? normalizePhone(rawPhone) : rawPhone;
  const senderName = (body.senderName || body.name || body.sender_name || body.patient_name || "").trim();
  const content = (body.content || body.message || body.text || "").trim();
  const externalMessageId = (body.externalMessageId || body.external_message_id || "").trim();

  if (!content) {
    res.status(400).json({ error: "Message content is required." });
    return;
  }
  if (content.length > 4000 || senderName.length > 200 || externalMessageId.length > 256) {
    res.status(413).json({ error: "Inbound payload exceeds the allowed size." });
    return;
  }
  if (explicitPhone && !normalizedPhone) {
    res.status(400).json({ error: "A valid sender phone is required." });
    return;
  }

  // In production, the tenant must be resolved from a server-known channel.
  // A clinicId supplied by an external webhook is only an assertion and never
  // becomes the tenant boundary by itself.
  if (channelId) {
    const channelLookup = await supabaseAdminRequest<Row[]>(
      `/rest/v1/channels?select=id,clinic_id,type,status,is_enabled&id=eq.${encodeURIComponent(channelId)}&deleted_at=is.null&status=eq.connected&is_enabled=eq.true&limit=1`,
    );
    if (!channelLookup.ok) {
      res.status(502).json({ error: "Unable to resolve the inbound channel." });
      return;
    }
    if (!channelLookup.data?.length || !channelLookup.data[0].clinic_id) {
      res.status(404).json({ error: "Inbound channel is not registered." });
      return;
    }
    const resolvedClinicId = String(channelLookup.data[0].clinic_id);
    const registeredChannelType = String(channelLookup.data[0].type || "").toLowerCase();
    if (suppliedClinicId && suppliedClinicId !== resolvedClinicId) {
      logger.warn({ channelId }, "[Inbound] Rejected clinic mismatch for channel");
      res.status(403).json({ error: "Inbound channel does not belong to the requested clinic." });
      return;
    }
    if (registeredChannelType && registeredChannelType !== channelType) {
      res.status(400).json({ error: "Inbound channel type does not match its registered channel." });
      return;
    }
    clinicId = resolvedClinicId;
  } else if (!isProduction && suppliedClinicId) {
    // Development-only compatibility for local fixtures. Production callers
    // must always provide a registered channelId.
    clinicId = suppliedClinicId;
  }

  if (!clinicId) {
    res.status(400).json({ error: "A registered channel_id is required to resolve the clinic." });
    return;
  }

  // Reserve/detect retries using the provider's tenant-scoped message id.
  // This is a replay guard for completed deliveries; a durable atomic inbox
  // reservation should replace it before any provider is connected directly.
  const idempotencyKey = externalMessageId && channelId
    ? `inbound:${channelId}:${externalMessageId}`
    : "";
  if (idempotencyKey) {
    const previousEvent = await supabaseAdminRequest<Row[]>(
      `/rest/v1/domain_events?select=id&clinic_id=eq.${encodeURIComponent(clinicId)}&idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&limit=1`,
    );
    if (!previousEvent.ok) {
      res.status(502).json({ error: "Unable to verify inbound message idempotency." });
      return;
    }
    if (previousEvent.data?.length) {
      res.status(200).json({ ok: true, duplicate: true });
      return;
    }
  }

  // 1. Resolve or create channel record
  if (!channelId) {
    const channelFind = await supabaseAdminRequest<Row[]>(
      `/rest/v1/channels?select=id&clinic_id=eq.${encodeURIComponent(clinicId)}&type=eq.${encodeURIComponent(channelType)}&deleted_at=is.null&limit=1`,
    );
    if (channelFind.ok && channelFind.data?.length) {
      channelId = String(channelFind.data[0].id);
    } else {
      const channelCreate = await supabaseAdminRequest<Row[]>("/rest/v1/channels", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          clinic_id: clinicId,
          type: channelType,
          provider: channelType === "whatsapp" ? "meta" : "direct",
          status: "connected",
          is_enabled: true,
          config: {},
        }),
      });
      if (channelCreate.ok && channelCreate.data?.length) {
        channelId = String(channelCreate.data[0].id);
      }
    }
  }

  // 2. Resolve or create Patient
  let patientId = "";
  let resolvedPatientName = senderName || "مريض بدون اسم";
  const phone = normalizedPhone || "—";

  if (phone && phone !== "—") {
    const patientFind = await supabaseAdminRequest<Row[]>(
      `/rest/v1/patients?select=id,name,phone&clinic_id=eq.${encodeURIComponent(clinicId)}&phone=eq.${encodeURIComponent(phone)}&deleted_at=is.null&limit=1`,
    );
    if (patientFind.ok && patientFind.data?.length) {
      patientId = String(patientFind.data[0].id);
      resolvedPatientName = String(patientFind.data[0].name || resolvedPatientName);
    }
  }

  if (!patientId) {
    const patientInsert = await supabaseAdminRequest<Row[]>("/rest/v1/patients", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        clinic_id: clinicId,
        name: resolvedPatientName,
        phone,
      }),
    });
    if (patientInsert.ok && patientInsert.data?.length) {
      patientId = String(patientInsert.data[0].id);
    } else {
      logger.error("[Inbound] Failed to create or find patient record");
      res.status(502).json({ error: "Failed to create patient record." });
      return;
    }
  }

  // 3. Resolve or create Conversation
  let conversationId = "";
  let isExistingHandoff = false;

  const convFind = await supabaseAdminRequest<Row[]>(
    `/rest/v1/conversations?select=id,is_handoff,ai_status&clinic_id=eq.${encodeURIComponent(clinicId)}&patient_id=eq.${encodeURIComponent(patientId)}&is_archived=eq.false&order=last_activity_at.desc.nullslast&limit=1`,
  );

  const handoffDetected = shouldTriggerHandoff(content);

  if (convFind.ok && convFind.data?.length) {
    conversationId = String(convFind.data[0].id);
    isExistingHandoff = Boolean(convFind.data[0].is_handoff);
  } else {
    const convCreate = await supabaseAdminRequest<Row[]>("/rest/v1/conversations", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        clinic_id: clinicId,
        patient_id: patientId,
        channel_id: channelId || null,
        channel_conversation_id: rawPhone || crypto.randomUUID(),
        ai_status: handoffDetected ? "paused" : "active",
        is_handoff: handoffDetected,
        status: "open",
        priority: handoffDetected ? "high" : "medium",
        last_patient_message: content,
        last_activity_at: new Date().toISOString(),
      }),
    });
    if (convCreate.ok && convCreate.data?.length) {
      conversationId = String(convCreate.data[0].id);
    } else {
      logger.error("[Inbound] Failed to create conversation");
      res.status(502).json({ error: "Failed to create conversation." });
      return;
    }
  }

  const finalHandoff = isExistingHandoff || handoffDetected;

  // 4. Insert message
  const messageInsert = await supabaseAdminRequest<Row[]>("/rest/v1/messages", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      clinic_id: clinicId,
      conversation_id: conversationId,
      content,
      direction: "inbound",
      sender_type: "patient",
      message_status: "delivered",
    }),
  });

  if (!messageInsert.ok || !messageInsert.data?.length) {
    logger.error("[Inbound] Failed to insert message");
    res.status(502).json({ error: "Failed to save message." });
    return;
  }

  const savedMessage = messageInsert.data[0];

  // 5. Update conversation timestamp and status
  await supabaseAdminRequest(`/rest/v1/conversations?id=eq.${encodeURIComponent(conversationId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      last_patient_message: content,
      last_activity_at: new Date().toISOString(),
      is_handoff: finalHandoff,
      ...(handoffDetected ? { ai_status: "paused", priority: "high" } : {}),
    }),
  });

  // 6. Record domain event
  const eventType = handoffDetected ? "conversation.handoff_requested" : "conversation.message_received";
  await supabaseAdminRequest("/rest/v1/domain_events", {
    method: "POST",
    body: JSON.stringify({
      clinic_id: clinicId,
      event_type: eventType,
      schema_version: 1,
      entity_type: "conversation",
      entity_id: conversationId,
      actor_type: "system",
      actor_id: "inbound-webhook",
      correlation_id: crypto.randomUUID(),
        idempotency_key: idempotencyKey || `inbound:${savedMessage.id}`,
        metadata: {
          message_id: savedMessage.id,
          channel_type: channelType,
          is_handoff: finalHandoff,
          ...(externalMessageId ? { external_message_id: externalMessageId } : {}),
        },
    }),
  });

  // 7. Emit Realtime event to active browser sessions for this clinic
  clinicEvents.emitClinicEvent(
    clinicId,
    handoffDetected ? "inbox.handoff_requested" : "inbox.message_received",
    {
      conversationId,
      messageId: savedMessage.id,
      patientId,
      patientName: resolvedPatientName,
      phone,
      content,
      channelType,
      isHandoff: finalHandoff,
      createdAt: new Date().toISOString(),
    },
  );

  logger.info(
    {
      clinicId,
      conversationId,
      messageId: savedMessage.id,
      handoffDetected,
    },
    "[Inbound] Processed incoming message successfully",
  );

  res.status(201).json({
    ok: true,
    messageId: savedMessage.id,
    conversationId,
    patientId,
    isHandoff: finalHandoff,
  });
}

async function handleWasapFlowWebhook(req: Request, res: Response) {
  // Always respond 200 OK promptly as required by WasapFlow Bridge
  const body = req.body || {};
  const event = String(body.event || "").toLowerCase();
  const wabaId = String(body.waba_id || "").trim();
  const phoneNumberId = String(body.phone_number_id || "").trim();
  const data = body.data || {};

  if (!wabaId && !phoneNumberId) {
    res.status(200).send("OK");
    return;
  }

  // Respond immediately so WasapFlow doesn't timeout / retry
  res.status(200).send("OK");

  try {
    // 1. Resolve clinic from WABA ID in channels table
    const channelLookup = await supabaseAdminRequest<Row[]>(
      `/rest/v1/channels?select=id,clinic_id,config&type=eq.whatsapp&deleted_at=is.null&limit=20`
    );

    let matchedChannel = channelLookup.data?.find((ch) => {
      const cfg = (ch.config && typeof ch.config === "object" ? ch.config : {}) as Record<string, any>;
      return (
        String(cfg.waba_id || "").trim() === wabaId ||
        String(cfg.phoneNumberId || "").trim() === phoneNumberId ||
        String(ch.phone_number_id || "").trim() === phoneNumberId
      );
    });

    if (!matchedChannel || !matchedChannel.clinic_id) {
      logger.warn({ wabaId, phoneNumberId, event }, "[WasapFlow Webhook] No matching clinic channel found");
      return;
    }

    const clinicId = String(matchedChannel.clinic_id);
    const channelId = String(matchedChannel.id);

    // 2. Handle Inbound Message from Patient
    if (event === "message.received") {
      const fromPhone = String(data.from || "").trim();
      const senderPhone = normalizePhone(fromPhone.startsWith("+") ? fromPhone : `+${fromPhone}`);
      const senderName = String(data.contact_name || "").trim() || "مريض واتساب";
      const content = String(data.text || (data.type && data.type !== "text" ? `[${data.type}]` : "")).trim();
      const externalMessageId = String(data.message_id || "").trim();

      if (!content || !senderPhone) return;

      // Resolve/Create Patient
      let patientId = "";
      const patientFind = await supabaseAdminRequest<Row[]>(
        `/rest/v1/patients?select=id,name&clinic_id=eq.${encodeURIComponent(clinicId)}&phone=eq.${encodeURIComponent(senderPhone)}&deleted_at=is.null&limit=1`
      );

      if (patientFind.ok && patientFind.data?.length) {
        patientId = String(patientFind.data[0].id);
      } else {
        const patientCreate = await supabaseAdminRequest<Row[]>("/rest/v1/patients", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            clinic_id: clinicId,
            name: senderName,
            phone: senderPhone,
          }),
        });
        if (patientCreate.ok && patientCreate.data?.length) {
          patientId = String(patientCreate.data[0].id);
        }
      }

      if (!patientId) return;

      const handoffDetected = shouldTriggerHandoff(content);

      // Resolve/Create Conversation
      let conversationId = "";
      const convFind = await supabaseAdminRequest<Row[]>(
        `/rest/v1/conversations?select=id,is_handoff&clinic_id=eq.${encodeURIComponent(clinicId)}&patient_id=eq.${encodeURIComponent(patientId)}&is_archived=eq.false&order=last_activity_at.desc.nullslast&limit=1`
      );

      if (convFind.ok && convFind.data?.length) {
        conversationId = String(convFind.data[0].id);
      } else {
        const convCreate = await supabaseAdminRequest<Row[]>("/rest/v1/conversations", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            clinic_id: clinicId,
            patient_id: patientId,
            channel_id: channelId,
            channel_conversation_id: fromPhone,
            ai_status: handoffDetected ? "paused" : "active",
            is_handoff: handoffDetected,
            status: "open",
            priority: handoffDetected ? "high" : "medium",
            last_patient_message: content,
            last_activity_at: new Date().toISOString(),
          }),
        });
        if (convCreate.ok && convCreate.data?.length) {
          conversationId = String(convCreate.data[0].id);
        }
      }

      if (!conversationId) return;

      // Insert Message
      const messageInsert = await supabaseAdminRequest<Row[]>("/rest/v1/messages", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          clinic_id: clinicId,
          conversation_id: conversationId,
          content,
          direction: "inbound",
          sender_type: "patient",
          message_status: "delivered",
        }),
      });

      // Update Conversation
      await supabaseAdminRequest(`/rest/v1/conversations?id=eq.${encodeURIComponent(conversationId)}`, {
        method: "PATCH",
        body: JSON.stringify({
          last_patient_message: content,
          last_activity_at: new Date().toISOString(),
          ...(handoffDetected ? { ai_status: "paused", priority: "high", is_handoff: true } : {}),
        }),
      });

      // Emit Realtime Event
      const savedMessageId = messageInsert.data?.[0]?.id || "";
      clinicEvents.emitClinicEvent(
        clinicId,
        handoffDetected ? "inbox.handoff_requested" : "inbox.message_received",
        {
          conversationId,
          messageId: savedMessageId,
          patientId,
          patientName: senderName,
          phone: senderPhone,
          content,
          channelType: "whatsapp",
          isHandoff: handoffDetected,
          createdAt: new Date().toISOString(),
        }
      );

      logger.info({ clinicId, conversationId, from: senderPhone }, "[WasapFlow Webhook] Inbound message received and synced");
    }

    // 3. Handle Coexistence Message Echo (Sent from Doctor's Phone WhatsApp Business App)
    else if (event === "message.echo") {
      const recipientPhone = normalizePhone(String(data.recipient || "").trim());
      const content = String(data.text || "").trim();
      if (!recipientPhone || !content) return;

      const patientFind = await supabaseAdminRequest<Row[]>(
        `/rest/v1/patients?select=id&clinic_id=eq.${encodeURIComponent(clinicId)}&phone=eq.${encodeURIComponent(recipientPhone)}&deleted_at=is.null&limit=1`
      );
      if (!patientFind.data?.length) return;
      const patientId = String(patientFind.data[0].id);

      const convFind = await supabaseAdminRequest<Row[]>(
        `/rest/v1/conversations?select=id&clinic_id=eq.${encodeURIComponent(clinicId)}&patient_id=eq.${encodeURIComponent(patientId)}&is_archived=eq.false&order=last_activity_at.desc.nullslast&limit=1`
      );
      if (!convFind.data?.length) return;
      const conversationId = String(convFind.data[0].id);

      const msgInsert = await supabaseAdminRequest<Row[]>("/rest/v1/messages", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          clinic_id: clinicId,
          conversation_id: conversationId,
          content,
          direction: "outgoing",
          sender_type: "clinic",
          message_status: "delivered",
        }),
      });

      const messageId = msgInsert.data?.[0]?.id || "";
      clinicEvents.emitClinicEvent(clinicId, "inbox.message_sent", {
        conversationId,
        messageId,
        content,
      });

      logger.info({ clinicId, conversationId }, "[WasapFlow Webhook] Synced WhatsApp Business App echo message");
    }
  } catch (err) {
    logger.error({ err, event }, "[WasapFlow Webhook] Error processing event");
  }
}

router.post("/inbox/inbound", handleInbound);
router.post("/inbox/webhook", handleInbound);
router.post("/api/inbound/wasapflow", handleWasapFlowWebhook);
router.post("/inbox/wasapflow", handleWasapFlowWebhook);

export default router;

