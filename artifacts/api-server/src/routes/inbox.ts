import { Router } from "express";
import { requireClinicPermission, respondToPermissionError } from "../lib/permissions";
import { supabaseRequest } from "../lib/supabase";
import { dispatchOutbound } from "../lib/outbound";

const router = Router();
type Conversation = { id?: string; patient_id?: string; clinic_id?: string; channel_id?: string; channel_conversation_id?: string; last_patient_message?: string | null; assigned_staff_id?: string | null; ai_status?: string; is_handoff?: boolean; is_archived?: boolean; last_activity_at?: string; status?: string; priority?: string; };
type Patient = { id?: string; name?: string; first_name?: string; last_name?: string; };
type Channel = { id?: string; type?: string; provider?: string; status?: string; is_enabled?: boolean; config?: Record<string, unknown> };
type Message = { id?: string; conversation_id?: string; content?: string; direction?: string; sender_type?: string; created_at?: string; message_status?: string; };

const headers = (token: string, extra: Record<string, string> = {}) => ({
  Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...extra,
});
const clinicFilter = (clinicId: string) => `clinic_id=eq.${encodeURIComponent(clinicId)}&deleted_at=is.null`;
const patientName = (patient?: Patient) => patient?.name || [patient?.first_name, patient?.last_name].filter(Boolean).join(" ") || "محادثة بدون اسم";

async function assertConversation(session: { clinicId: string; accessToken: string }, conversationId: string) {
  const result = await supabaseRequest<Conversation[]>(`/rest/v1/conversations?select=id&${clinicFilter(session.clinicId)}&id=eq.${encodeURIComponent(conversationId)}&limit=1`, { headers: headers(session.accessToken) });
  if (!result.ok) throw Object.assign(new Error("تعذر التحقق من المحادثة."), { statusCode: result.status || 502 });
  if (!result.data?.length) throw Object.assign(new Error("المحادثة غير موجودة في هذه العيادة."), { statusCode: 404 });
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
    supabaseRequest<Conversation[]>(`/rest/v1/conversations?select=id,patient_id,channel_id,channel_conversation_id,last_patient_message,assigned_staff_id,ai_status,is_handoff,last_activity_at,status,priority&${clinicFilter(session.clinicId)}&is_archived=eq.false&order=last_activity_at.desc&limit=100`, { headers: headers(session.accessToken) }),
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
  const conversations = (conversationsResult.data ?? []).map((conversation) => {
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
  const conversationId = typeof req.query.conversationId === "string" ? req.query.conversationId : conversations[0]?.id;
  let messages: Message[] = [];
  if (conversationId) {
    const messageResult = await supabaseRequest<Message[]>(`/rest/v1/messages?select=id,conversation_id,content,direction,sender_type,created_at,message_status&conversation_id=eq.${encodeURIComponent(conversationId)}&clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null&order=created_at.asc&limit=200`, { headers: headers(session.accessToken) });
    if (!messageResult.ok) { res.status(messageResult.status || 502).json({ error: "تعذر تحميل رسائل المحادثة." }); return; }
    messages = messageResult.data ?? [];
  }
  res.json({
    channels: (channelsResult.data ?? []).filter((channel) => ["whatsapp", "instagram", "messenger", "telegram"].includes(channel.type || "")).map((channel) => ({ id: channel.id, type: channel.type, provider: channel.provider, status: channel.status, isEnabled: channel.is_enabled !== false, displayName: channelDisplayName(channel) })),
    conversations,
    selectedConversationId: conversationId || null,
    messages,
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
  try { session = await requireClinicPermission(req, "inbox", "conversations", "handoff"); } catch (error) { respondToPermissionError(res, error); return; }
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
  res.json({ mode });
});

router.post("/inbox/:id/messages", async (req, res) => {
  let session;
  try { session = await requireClinicPermission(req, "inbox", "conversations", "handoff"); } catch (error) { respondToPermissionError(res, error); return; }
  const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
  if (!content) { res.status(400).json({ error: "نص الرسالة مطلوب." }); return; }
  const queued = await supabaseRequest<{ conversation_id?: string; message_id?: string }>("/rest/v1/rpc/fn_send_inbox_reply", {
    method: "POST", headers: headers(session.accessToken), body: JSON.stringify({ p_conversation_id: req.params.id, p_content: content }),
  });
  if (!queued.ok) { res.status(queued.status || 502).json({ error: "تعذر تجهيز الرسالة للإرسال." }); return; }
  const conversationId = queued.data?.conversation_id || req.params.id;
  try {
    await dispatchOutbound(conversationId);
  } catch (error) {
    const statusCode = typeof error === "object" && error && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 502;
    res.status(statusCode).json({ error: error instanceof Error ? error.message : "تعذر الوصول إلى مسار إرسال الرسائل." });
    return;
  }
  res.status(201).json({ id: queued.data?.message_id ?? null, conversation_id: conversationId, content, direction: "outgoing", sender_type: "staff", message_status: "queued" });
});

export default router;