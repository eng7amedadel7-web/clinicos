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
  const rawPhone = (body.senderPhone || body.phone || body.sender_phone || body.sender_id || "").trim();
  const senderName = (body.senderName || body.name || body.sender_name || body.patient_name || "").trim();
  const content = (body.content || body.message || body.text || "").trim();

  if (!content) {
    res.status(400).json({ error: "Message content is required." });
    return;
  }

  // In production, the tenant must be resolved from a server-known channel.
  // A clinicId supplied by an external webhook is only an assertion and never
  // becomes the tenant boundary by itself.
  if (channelId) {
    const channelLookup = await supabaseAdminRequest<Row[]>(
      `/rest/v1/channels?select=id,clinic_id,type&id=eq.${encodeURIComponent(channelId)}&deleted_at=is.null&limit=1`,
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
  const phone = rawPhone || "—";

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
      idempotency_key: `inbound:${savedMessage.id}`,
      metadata: {
        message_id: savedMessage.id,
        patient_name: resolvedPatientName,
        phone,
        content,
        channel_type: channelType,
        is_handoff: finalHandoff,
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

router.post("/inbox/inbound", handleInbound);
router.post("/inbox/webhook", handleInbound);

export default router;
