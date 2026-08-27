import { Router, type Request, type Response } from "express";
import { requireClinicPermission, respondToPermissionError } from "../lib/permissions";
import { supabaseRequest } from "../lib/supabase";
import { dispatchOutbound } from "../lib/outbound";
import { clinicEvents } from "../lib/events";

const router = Router();
type Conversation = { id?: string; patient_id?: string; clinic_id?: string; channel_id?: string; channel_conversation_id?: string; last_patient_message?: string | null; assigned_staff_id?: string | null; ai_status?: string; is_handoff?: boolean; is_archived?: boolean; last_activity_at?: string; status?: string; priority?: string; };
type Patient = { id?: string; name?: string; first_name?: string; last_name?: string; };
type Channel = { id?: string; type?: string; provider?: string; status?: string; is_enabled?: boolean; updated_at?: string; config?: Record<string, unknown> };
type Message = { id?: string; conversation_id?: string; clinic_id?: string; content?: string | null; direction?: string; sender_type?: string; message_status?: string; created_at?: string };
type SupabaseErrorPayload = { message?: unknown; error?: unknown; error_description?: unknown; code?: unknown };
type InboxReplyResult = { conversation_id?: string; message_id?: string };

function inboxReplyErrorMessage(payload: unknown) {
  const values = payload && typeof payload === "object" ? payload as SupabaseErrorPayload : {};
  const raw = [values.message, values.error_description, values.error].find((value) => typeof value === "string" && value.trim());
  const message = typeof raw === "string" ? raw : "";
  if (/no staff membership/i.test(message)) return "حسابك ليس عضوًا في عيادة هذه المحادثة.";
  if (/no permission for this clinic/i.test(message)) return "لا تملك صلاحية الوصول إلى هذه المحادثة.";
  if (/not authenticated/i.test(message)) return "انتهت جلسة الدخول؛ سجّل الدخول مرة أخرى.";
  if (/conversation not found/i.test(message)) return "المحادثة غير موجودة أو لم تعد متاحة.";
  return "تعذر تجهيز الرسالة للإرسال. تحقق من صلاحيات الحساب واتصال القناة وحاول مرة أخرى.";
}

const headers = (token: string, extra: Record<string, string> = {}) => ({
  Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...extra,
});
const clinicFilter = (clinicId: string) => `clinic_id=eq.${encodeURIComponent(clinicId)}&deleted_at=is.null`;
const patientName = (patient?: Patient) => patient?.name || [patient?.first_name, patient?.last_name].filter(Boolean).join(" ") || "محادثة بدون اسم";

function sseHeaders(res: Response) {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
}

function sseEvent(res: Response, event: string, data: Record<string, unknown>) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function readInboxFingerprint(session: { clinicId: string; accessToken: string }, conversationId?: string | null) {
  const authHeaders = { headers: headers(session.accessToken) };
  const [conversationHead, channelHead, selectedMessageHead] = await Promise.all([
    supabaseRequest<Conversation[]>(
      `/rest/v1/conversations?select=id,last_activity_at,assigned_staff_id,ai_status,is_handoff,status,priority&${clinicFilter(session.clinicId)}&is_archived=eq.false&order=last_activity_at.desc.nullslast&limit=1`,
      authHeaders,
    ),
    supabaseRequest<Channel[]>(
      `/rest/v1/channels?select=id,status,is_enabled,updated_at&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null&order=updated_at.desc.nullslast&limit=1`,
      authHeaders,
    ),
    conversationId
      ? supabaseRequest<Message[]>(
          `/rest/v1/messages?select=id,created_at,message_status&conversation_id=eq.${encodeURIComponent(conversationId)}&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null&order=created_at.desc&limit=1`,
          authHeaders,
        )
      : Promise.resolve({ ok: true, status: 200, data: [] as Message[] }),
  ]);
  const fingerprint = {
    conversation: conversationHead.ok ? conversationHead.data?.[0] ?? null : null,
    channel: channelHead.ok ? channelHead.data?.[0] ?? null : null,
    selectedMessage: selectedMessageHead.ok ? selectedMessageHead.data?.[0] ?? null : null,
  };
  return {
    ok: conversationHead.ok && channelHead.ok && selectedMessageHead.ok,
    fingerprint: JSON.stringify(fingerprint),
  };
}

async function assertConversation(session: { clinicId: string; accessToken: string }, conversationId: string) {
  const result = await supabaseRequest<Conversation[]>(`/rest/v1/conversations?select=id&${clinicFilter(session.clinicId)}&id=eq.${encodeURIComponent(conversationId)}&limit=1`, { headers: headers(session.accessToken) });
  if (!result.ok) throw Object.assign(new Error("تعذر التحقق من المحادثة."), { statusCode: result.status || 502 });
  if (!result.data?.length) throw Object.assign(new Error("المحادثة غير موجودة في هذه العيادة."), { statusCode: 404 });
}

async function assertOutboundReady(session: { clinicId: string; accessToken: string }, conversationId: string) {
  const conversationResult = await supabaseRequest<Conversation[]>(
    `/rest/v1/conversations?select=id,channel_id&${clinicFilter(session.clinicId)}&id=eq.${encodeURIComponent(conversationId)}&limit=1`,
    { headers: headers(session.accessToken) },
  );
  if (!conversationResult.ok) throw Object.assign(new Error("تعذر التحقق من قناة المحادثة."), { statusCode: conversationResult.status || 502 });
  const channelId = conversationResult.data?.[0]?.channel_id;
  if (!channelId) throw Object.assign(new Error("المحادثة غير مرتبطة بقناة إرسال."), { statusCode: 409 });

  const channelResult = await supabaseRequest<Channel[]>(
    `/rest/v1/channels?select=id,type,provider,status,is_enabled&${clinicFilter(session.clinicId)}&id=eq.${encodeURIComponent(channelId)}&limit=1`,
    { headers: headers(session.accessToken) },
  );
  if (!channelResult.ok) throw Object.assign(new Error("تعذر التحقق من حالة قناة الإرسال."), { statusCode: channelResult.status || 502 });
  const channel = channelResult.data?.[0];
  if (!channel) throw Object.assign(new Error("قناة المحادثة غير موجودة في هذه العيادة."), { statusCode: 409 });
  if (channel.is_enabled === false || String(channel.status || "").toLowerCase() !== "connected") {
    throw Object.assign(new Error("قناة المحادثة غير متصلة؛ تم إيقاف الإرسال قبل حفظ الرسالة."), { statusCode: 409 });
  }
  if (!["whatsapp", "instagram", "messenger", "telegram"].includes(String(channel.type || "").toLowerCase())) {
    throw Object.assign(new Error("نوع قناة الإرسال غير مدعوم."), { statusCode: 409 });
  }
}

async function insertConversationEvent(session: { clinicId: string; accessToken: string; userId: string }, conversationId: string, eventType: string, metadata: Record<string, unknown>) {
  await assertConversation(session, conversationId);
  const result = await supabaseRequest<Record<string, unknown>[]>("/rest/v1/domain_events", {
    method: "POST",
    headers: headers(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify({ clinic_id: session.clinicId, event_type: eventType, schema_version: 1, entity_type: "conversation", entity_id: conversationId, actor_type: "user", actor_id: session.userId, correlation_id: crypto.randomUUID(), idempotency_key: `${eventType}:${conversationId}:${crypto.randomUUID()}`, metadata }),
  });
  if (!result.ok) throw Object.assign(new Error("تعذر حفظ إجراء المحادثة."), { statusCode: result.status || 502 });
  return result.data?.[0] ?? null;
}

router.get("/inbox", async (req, res) => {
  let session;
  try { session = await requireClinicPermission(req, "inbox", "conversations", "read"); } catch (error) { respondToPermissionError(res, error); return; }
  const [conversationsResult, patientsResult, channelsResult] = await Promise.all([
    supabaseRequest<Conversation[]>(`/rest/v1/conversations?select=id,patient_id,channel_id,channel_conversation_id,last_patient_message,assigned_staff_id,ai_status,is_handoff,last_activity_at,status,priority&${clinicFilter(session.clinicId)}&is_archived=eq.false&order=last_activity_at.desc&limit=500`, { headers: headers(session.accessToken) }),
    supabaseRequest<Patient[]>(`/rest/v1/patients?select=id,name,first_name,last_name&${clinicFilter(session.clinicId)}&limit=1000`, { headers: headers(session.accessToken) }),
    supabaseRequest<Channel[]>(`/rest/v1/channels?select=id,type,provider,status,is_enabled,config&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null&limit=100`, { headers: headers(session.accessToken) }),
  ]);
  if (!conversationsResult.ok) { res.status(conversationsResult.status || 502).json({ error: "تعذر تحميل المحادثات." }); return; }
  const patients = new Map((patientsResult.data ?? []).map((patient) => [String(patient.id), patient]));
  const channels = new Map((channelsResult.data ?? []).map((channel) => [String(channel.id), channel]));
  const safeChannelConfig = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const channelDisplayName = (channel: Channel | undefined) => {
    const config = safeChannelConfig(channel?.config);
    return typeof config.display_name === "string" && config.display_name.trim() ? config.display_name : channel?.type || "قناة غير محددة";
  };
  const allConversations = (conversationsResult.data ?? []).map((conversation) => {
    const channel = channels.get(String(conversation.channel_id));
    return {
      id: conversation.id,
      name: patientName(patients.get(String(conversation.patient_id))),
      channel: conversation.channel_conversation_id || channelDisplayName(channel),
      channelId: conversation.channel_id || null,
      channelType: channel?.type || "unknown",
      channelProvider: channel?.provider || null,
      channelStatus: channel?.status || "unknown",
      mode: conversation.ai_status === "active" && !conversation.is_handoff ? "AI" : "Human",
      lastActivityAt: conversation.last_activity_at || null,
      lastMessage: conversation.last_patient_message || null,
      assignedStaffId: conversation.assigned_staff_id || null,
      needsStaff: Boolean(conversation.is_handoff || !conversation.assigned_staff_id),
      status: conversation.status || "active",
      priority: conversation.priority || "normal",
    };
  });
  const supportedChannelTypes = ["whatsapp", "instagram", "messenger", "telegram"] as const;
  const requestedChannelType = typeof req.query.channelType === "string" && supportedChannelTypes.includes(req.query.channelType as typeof supportedChannelTypes[number]) ? req.query.channelType : null;
  const conversations = requestedChannelType ? allConversations.filter((item) => item.channelType === requestedChannelType) : allConversations;
  const channelCounts = Object.fromEntries(supportedChannelTypes.map((type) => [type, allConversations.filter((item) => item.channelType === type).length]));
  const requestedConversationId = typeof req.query.conversationId === "string" ? req.query.conversationId : null;
  const conversationId = requestedConversationId && conversations.some((item) => item.id === requestedConversationId) ? requestedConversationId : conversations[0]?.id;
  let messages: Message[] = [];
  if (conversationId) {
    const messageResult = await supabaseRequest<Message[]>(`/rest/v1/messages?select=id,conversation_id,content,direction,sender_type,created_at,message_status&conversation_id=eq.${encodeURIComponent(conversationId)}&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null&order=created_at.asc&limit=200`, { headers: headers(session.accessToken) });
    if (!messageResult.ok) { res.status(messageResult.status || 502).json({ error: "تعذر تحميل رسائل المحادثة." }); return; }
    messages = messageResult.data ?? [];
  }
  res.json({
    channels: (channelsResult.data ?? []).filter((channel) => ["whatsapp", "instagram", "messenger", "telegram"].includes(channel.type || "")).map((channel) => ({ id: channel.id, type: channel.type, provider: channel.provider, status: channel.status, isEnabled: channel.is_enabled !== false, displayName: channelDisplayName(channel) })),
    channelCounts,
    conversations,
    selectedConversationId: conversationId || null,
    messages,
  });
});

router.get("/inbox/stream", async (req: Request, res: Response) => {
  let session;
  try {
    session = await requireClinicPermission(req, "inbox", "conversations", "read");
  } catch (error) {
    respondToPermissionError(res, error);
    return;
  }

  const selectedConversationId = typeof req.query.conversationId === "string" && req.query.conversationId.trim()
    ? req.query.conversationId.trim()
    : null;

  if (selectedConversationId) {
    try {
      await assertConversation(session, selectedConversationId);
    } catch (error) {
      respondToPermissionError(res, error);
      return;
    }
  }

  sseHeaders(res);
  let closed = false;
  let lastFingerprint = "";

  const pushIfChanged = async (reason: "initial" | "changed" | "heartbeat" | string) => {
    if (closed) return;
    const snapshot = await readInboxFingerprint(session, selectedConversationId);
    if (!snapshot.ok) {
      sseEvent(res, "error", { reason: "sync_failed" });
      return;
    }
    if (reason === "heartbeat") {
      sseEvent(res, "heartbeat", { at: new Date().toISOString() });
      return;
    }
    if (!lastFingerprint || snapshot.fingerprint !== lastFingerprint) {
      lastFingerprint = snapshot.fingerprint;
      sseEvent(res, "invalidate", { reason, at: new Date().toISOString() });
    }
  };

  const unsubscribeEvents = clinicEvents.subscribeClinic(session.clinicId, (event) => {
    if (closed) return;
    // Push typed event directly to client
    sseEvent(res, event.type, event.data);
    // Also trigger query invalidation immediately
    void pushIfChanged(event.type);
  });

  await pushIfChanged("initial");
  const changeInterval = setInterval(() => { void pushIfChanged("changed"); }, 15_000);
  const heartbeatInterval = setInterval(() => { void pushIfChanged("heartbeat"); }, 25_000);

  req.on("close", () => {
    closed = true;
    unsubscribeEvents();
    clearInterval(changeInterval);
    clearInterval(heartbeatInterval);
    res.end();
  });
});

router.get("/inbox/:id/operations", async (req, res) => {
  let session;
  try { session = await requireClinicPermission(req, "inbox", "conversations", "read"); await assertConversation(session, req.params.id); } catch (error) { respondToPermissionError(res, error); return; }
  const result = await supabaseRequest<Record<string, unknown>[]>(`/rest/v1/domain_events?select=id,event_type,actor_type,metadata,occurred_at,created_at&clinic_id=eq.${encodeURIComponent(session.clinicId)}&entity_type=eq.conversation&entity_id=eq.${encodeURIComponent(req.params.id)}&order=occurred_at.desc&limit=100`, { headers: headers(session.accessToken) });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر تحميل سجل المحادثة." }); return; }
  res.json(result.data ?? []);
});

router.get("/inbox/saved-replies", async (req, res) => {
  let session;
  try { session = await requireClinicPermission(req, "inbox", "conversations", "read"); } catch (error) { respondToPermissionError(res, error); return; }
  const language = req.query.language === "en" ? "en" : "ar";
  const result = await supabaseRequest<Record<string, unknown>[]>(`/rest/v1/notification_templates?select=id,template_key,language,body_template,enabled,updated_at&clinic_id=eq.${encodeURIComponent(session.clinicId)}&channel_type=eq.inbox&language=eq.${language}&enabled=eq.true&order=updated_at.desc&limit=100`, { headers: headers(session.accessToken) });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر تحميل الردود المحفوظة." }); return; }
  res.json(result.data ?? []);
});

router.post("/inbox/:id/note", async (req, res) => {
  let session;
  try { session = await requireClinicPermission(req, "inbox", "conversations", "update"); const content = typeof req.body?.content === "string" ? req.body.content.trim().slice(0, 4000) : ""; if (!content) { res.status(400).json({ error: "نص الملاحظة مطلوب." }); return; } res.status(201).json(await insertConversationEvent(session, req.params.id, "conversation.internal_note.created", { content })); } catch (error) { if (!res.headersSent) respondToPermissionError(res, error); }
});

router.post("/inbox/:id/snooze", async (req, res) => {
  let session;
  try { session = await requireClinicPermission(req, "inbox", "conversations", "update"); const until = typeof req.body?.until === "string" ? req.body.until : ""; if (!until || Date.parse(until) <= Date.now()) { res.status(400).json({ error: "وقت التأجيل يجب أن يكون في المستقبل." }); return; } res.status(201).json(await insertConversationEvent(session, req.params.id, "conversation.snoozed", { snoozed_until: until, reason: typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 240) : null })); } catch (error) { if (!res.headersSent) respondToPermissionError(res, error); }
});

router.post("/inbox/:id/unsnooze", async (req, res) => {
  let session;
  try { session = await requireClinicPermission(req, "inbox", "conversations", "update"); res.status(201).json(await insertConversationEvent(session, req.params.id, "conversation.unsnoozed", {})); } catch (error) { if (!res.headersSent) respondToPermissionError(res, error); }
});


router.post("/inbox/:id/outcome", async (req, res) => {
  let session;
  try { session = await requireClinicPermission(req, "inbox", "conversations", "update"); const outcome = typeof req.body?.outcome === "string" ? req.body.outcome.trim().slice(0, 80) : ""; if (!outcome) { res.status(400).json({ error: "نتيجة المحادثة مطلوبة." }); return; } res.status(201).json(await insertConversationEvent(session, req.params.id, "conversation.outcome.recorded", { outcome, note: typeof req.body?.note === "string" ? req.body.note.trim().slice(0, 4000) : null })); } catch (error) { if (!res.headersSent) respondToPermissionError(res, error); }
});

router.patch("/inbox/:id/mode", async (req, res) => {
  let session;
  try { session = await requireClinicPermission(req, "inbox", "handoffs", "handoff"); } catch (error) { respondToPermissionError(res, error); return; }
  const mode = req.body?.mode === "AI" ? "AI" : req.body?.mode === "Human" ? "Human" : "";
  if (!mode) { res.status(400).json({ error: "وضع المحادثة غير صالح." }); return; }
  const conversation = await supabaseRequest<Conversation[]>(`/rest/v1/conversations?select=id&${clinicFilter(session.clinicId)}&id=eq.${encodeURIComponent(req.params.id)}&limit=1`, { headers: headers(session.accessToken) });
  if (!conversation.ok) { res.status(conversation.status || 502).json({ error: "تعذر التحقق من المحادثة." }); return; }
  if (!conversation.data?.length) { res.status(404).json({ error: "المحادثة غير موجودة." }); return; }
  const result = await supabaseRequest<unknown>("/rest/v1/rpc/fn_set_conversation_ai_status", {
    method: "POST", headers: headers(session.accessToken),
    body: JSON.stringify({ p_conversation_id: req.params.id, p_ai_status: mode === "AI" ? "active" : "paused", p_is_handoff: mode === "Human" }),
  });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر حفظ وضع المحادثة." }); return; }
  clinicEvents.emitClinicEvent(session.clinicId, "inbox.mode_changed", { conversationId: req.params.id, mode });
  res.json({ mode });
});

router.post("/inbox/:id/messages", async (req, res) => {
  let session;
  try {
    session = await requireClinicPermission(req, "inbox", "messages", "create");
    await assertConversation(session, req.params.id);
    await assertOutboundReady(session, req.params.id);
  } catch (error) {
    respondToPermissionError(res, error);
    return;
  }
  const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
  if (!content) { res.status(400).json({ error: "نص الرسالة مطلوب." }); return; }
  const queued = await supabaseRequest<InboxReplyResult | SupabaseErrorPayload>("/rest/v1/rpc/fn_send_inbox_reply", {
    method: "POST", headers: headers(session.accessToken), body: JSON.stringify({ p_conversation_id: req.params.id, p_content: content }),
  });
  if (!queued.ok) {
    const errorCode = queued.data && typeof queued.data === "object" && "code" in queued.data && typeof queued.data.code === "string" ? queued.data.code : "unknown";
    console.warn("[Inbox] reply RPC rejected", { status: queued.status, errorCode });
    res.status(queued.status || 502).json({ error: inboxReplyErrorMessage(queued.data) });
    return;
  }
  const reply = queued.data as InboxReplyResult;
  const conversationId = reply.conversation_id || req.params.id;
  try {
    await dispatchOutbound(conversationId, reply.message_id);
  } catch (error) {
    const statusCode = typeof error === "object" && error && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 502;
    res.status(statusCode).json({ error: error instanceof Error ? error.message : "تعذر الوصول إلى مسار إرسال الرسائل." });
    return;
  }
  clinicEvents.emitClinicEvent(session.clinicId, "inbox.message_sent", { conversationId, messageId: reply.message_id, content });
  res.status(201).json({ id: reply.message_id ?? null, conversation_id: conversationId, content, direction: "outgoing", sender_type: "clinic", message_status: "sent" });
});

export default router;
