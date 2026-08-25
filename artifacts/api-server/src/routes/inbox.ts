import { Router } from "express";
import { requireClinicPermission, respondToPermissionError } from "../lib/permissions";
import { supabaseRequest } from "../lib/supabase";

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

router.patch("/inbox/:id/mode", async (req, res) => {
  let session;
  try { session = await requireClinicPermission(req, "inbox", "conversations", "update"); } catch (error) { respondToPermissionError(res, error); return; }
  const mode = req.body?.mode === "AI" ? "AI" : req.body?.mode === "Human" ? "Human" : "";
  if (!mode) { res.status(400).json({ error: "وضع المحادثة غير صالح." }); return; }
  const result = await supabaseRequest<Conversation[]>(`/rest/v1/conversations?id=eq.${encodeURIComponent(req.params.id)}&${clinicFilter(session.clinicId)}`, {
    method: "PATCH", headers: headers(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify({ ai_status: mode === "AI" ? "active" : "paused", is_handoff: mode === "Human" }),
  });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر حفظ وضع المحادثة." }); return; }
  if (!result.data?.length) { res.status(404).json({ error: "المحادثة غير موجودة." }); return; }
  res.json({ mode });
});

router.post("/inbox/:id/messages", async (req, res) => {
  let session;
  try { session = await requireClinicPermission(req, "inbox", "messages", "create"); } catch (error) { respondToPermissionError(res, error); return; }
  const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
  if (!content) { res.status(400).json({ error: "نص الرسالة مطلوب." }); return; }
  const conversationResult = await supabaseRequest<Conversation[]>(`/rest/v1/conversations?select=id,patient_id&${clinicFilter(session.clinicId)}&id=eq.${encodeURIComponent(req.params.id)}&limit=1`, { headers: headers(session.accessToken) });
  if (!conversationResult.ok) { res.status(conversationResult.status || 502).json({ error: "تعذر التحقق من المحادثة." }); return; }
  const conversation = conversationResult.data?.[0];
  if (!conversation?.id) { res.status(404).json({ error: "المحادثة غير موجودة." }); return; }
  const result = await supabaseRequest<Message[]>("/rest/v1/messages", {
    method: "POST", headers: headers(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify({ clinic_id: session.clinicId, conversation_id: conversation.id, patient_id: conversation.patient_id || null, content, direction: "outgoing", sender_type: "staff", sent_by_staff_id: session.userId, message_status: "sent" }),
  });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر إرسال الرسالة." }); return; }
  res.status(201).json(result.data?.[0] ?? null);
});

export default router;