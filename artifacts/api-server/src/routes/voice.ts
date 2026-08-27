import { Router, type Request, type Response } from "express";
import { requireClinicPermission, respondToPermissionError, type ClinicPermissionAction } from "../lib/permissions";
import { supabaseRequest, type SupabaseResponse } from "../lib/supabase";
import type { SessionPayload } from "../lib/session";

const router = Router();
type Row = Record<string, unknown>;

function headers(session: SessionPayload, extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json", ...extra };
}

function queryValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeLimit(value: unknown, fallback = 30) {
  const parsed = Number.parseInt(queryValue(value), 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 100) : fallback;
}

function jsonError(res: Response, result: SupabaseResponse<unknown>, fallback: string) {
  res.status(result.status || 502).json({ error: fallback });
}

async function protect(req: Request, res: Response, action: ClinicPermissionAction = "read") {
  try {
    return await requireClinicPermission(req, "Voice", "overview", action);
  } catch (error) {
    respondToPermissionError(res, error);
    return null;
  }
}

async function rpc<T>(session: SessionPayload, name: string, body: Record<string, unknown>) {
  return supabaseRequest<T>(`/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: headers(session),
    body: JSON.stringify({ ...body, p_clinic_id: session.clinicId }),
  });
}

async function edge<T>(session: SessionPayload, name: string, body: Record<string, unknown>) {
  return supabaseRequest<T>(`/functions/v1/${name}`, {
    method: "POST",
    headers: headers(session),
    body: JSON.stringify({ ...body, clinic_id: session.clinicId }),
  });
}

const voiceKnowledgeFields = "id,title,source_kind,processing_status,approval_status,metadata,created_at,updated_at,approved_at";
const voiceChannelFields = "id,type,provider,status,is_enabled,phone_number_id,config,updated_at";

router.get("/operations/voice-agent/overview", async (req, res) => {
  const session = await protect(req, res);
  if (!session) return;
  const [dashboard, snapshot, access] = await Promise.all([
    rpc<Row>(session, "get_voice_dashboard_projection", {}),
    rpc<Row>(session, "get_voice_snapshot", {}),
    rpc<Row>(session, "get_voice_access", {}),
  ]);
  const failed = [dashboard, snapshot, access].find((result) => !result.ok);
  if (failed) {
    jsonError(res, failed, "تعذر تحميل مساحة Voice Agent.");
    return;
  }
  res.json({ dashboard: dashboard.data, snapshot: snapshot.data, access: access.data });
});

router.get("/operations/voice-agent/calls", async (req, res) => {
  const session = await protect(req, res);
  if (!session) return;
  const result = await rpc<Row>(session, "list_voice_call_projections", {
    p_limit: safeLimit(req.query.limit),
    p_before_at: queryValue(req.query.beforeAt) || null,
    p_before_id: queryValue(req.query.beforeId) || null,
    p_status: queryValue(req.query.status) || null,
    p_intent: queryValue(req.query.intent) || null,
    p_branch_id: queryValue(req.query.branchId) || null,
    p_range: queryValue(req.query.range) || "30d",
    p_query: queryValue(req.query.query) || null,
  });
  if (!result.ok) { jsonError(res, result, "تعذر تحميل سجل مكالمات Voice."); return; }
  res.json(result.data ?? { items: [], page: { has_more: false, next_cursor: null } });
});

router.get("/operations/voice-agent/bookings", async (req, res) => {
  const session = await protect(req, res);
  if (!session) return;
  const result = await rpc<Row>(session, "list_voice_booking_projections", {
    p_limit: safeLimit(req.query.limit),
    p_before_at: queryValue(req.query.beforeAt) || null,
    p_before_id: queryValue(req.query.beforeId) || null,
    p_status: queryValue(req.query.status) || null,
    p_source: queryValue(req.query.source) || null,
    p_doctor_id: queryValue(req.query.doctorId) || null,
    p_branch_id: queryValue(req.query.branchId) || null,
    p_service_id: queryValue(req.query.serviceId) || null,
    p_range: queryValue(req.query.range) || "30d",
    p_query: queryValue(req.query.query) || null,
  });
  if (!result.ok) { jsonError(res, result, "تعذر تحميل حجوزات Voice."); return; }
  res.json(result.data ?? { items: [], page: { has_more: false, next_cursor: null } });
});

router.get("/operations/voice-agent/calls/:id", async (req, res) => {
  const session = await protect(req, res);
  if (!session) return;
  const result = await rpc<Row>(session, "get_voice_call_projection_detail", { p_public_id: req.params.id });
  if (!result.ok) { jsonError(res, result, "تعذر تحميل تفاصيل المكالمة."); return; }
  res.json(result.data ?? null);
});

router.get("/operations/voice-agent/bookings/:id", async (req, res) => {
  const session = await protect(req, res);
  if (!session) return;
  const result = await rpc<Row>(session, "get_voice_booking_projection_detail", { p_public_id: req.params.id });
  if (!result.ok) { jsonError(res, result, "تعذر تحميل تفاصيل الحجز."); return; }
  res.json(result.data ?? null);
});

router.get("/operations/voice-agent/clinic", async (req, res) => {
  const session = await protect(req, res);
  if (!session) return;
  const result = await rpc<Row>(session, "get_voice_dashboard_projection", {});
  if (!result.ok) { jsonError(res, result, "تعذر تحميل بيانات العيادة الصوتية."); return; }
  const projection = (result.data ?? {}) as Row;
  res.json({ clinic: projection.clinic ?? null, setup: projection.setup ?? null, readiness: projection.readiness ?? null, asOf: projection.as_of ?? null });
});

router.get("/operations/voice-agent/agent", async (req, res) => {
  const session = await protect(req, res);
  if (!session) return;
  const [snapshot, access] = await Promise.all([rpc<Row>(session, "get_voice_snapshot", {}), rpc<Row>(session, "get_voice_access", {})]);
  const failed = [snapshot, access].find((result) => !result.ok);
  if (failed) { jsonError(res, failed, "تعذر تحميل إعداد الوكيل الصوتي."); return; }
  res.json({ snapshot: snapshot.data, access: access.data });
});

router.put("/operations/voice-agent/agent", async (req, res) => {
  const session = await protect(req, res, "update");
  if (!session) return;
  const payload = req.body && typeof req.body === "object" ? req.body as Row : {};
  const result = await rpc<Row>(session, "save_voice_agent_configuration", {
    p_channel_id: typeof payload.channelId === "string" ? payload.channelId : null,
    p_display_name: typeof payload.displayName === "string" ? payload.displayName.trim().slice(0, 120) : "MERUNA Voice Agent",
    p_status: typeof payload.status === "string" ? payload.status : "inactive",
    p_language_code: typeof payload.languageCode === "string" ? payload.languageCode : "ar-SA",
    p_dialect_code: typeof payload.dialectCode === "string" ? payload.dialectCode : null,
    p_voice_profile: typeof payload.voiceProfile === "string" ? payload.voiceProfile : null,
    p_configuration: payload.configuration && typeof payload.configuration === "object" ? payload.configuration : {},
  });
  if (!result.ok) { jsonError(res, result, "تعذر حفظ إعداد الوكيل الصوتي."); return; }
  res.json(result.data ?? null);
});

router.get("/operations/voice-agent/knowledge", async (req, res) => {
  const session = await protect(req, res);
  if (!session) return;
  const params = new URLSearchParams({ select: voiceKnowledgeFields, clinic_id: `eq.${session.clinicId}`, order: "updated_at.desc", limit: "100" });
  params.set("archived_at", "is.null");
  const result = await supabaseRequest<Row[]>(`/rest/v1/voice_knowledge_sources?${params.toString()}`, { headers: headers(session) });
  if (!result.ok) { jsonError(res, result, "تعذر تحميل مصادر معرفة Voice."); return; }
  res.json({ items: result.data ?? [], total: result.data?.length ?? 0 });
});

router.post("/operations/voice-agent/knowledge/faq", async (req, res) => {
  const session = await protect(req, res, "update");
  if (!session) return;
  const payload = req.body && typeof req.body === "object" ? req.body as Row : {};
  const question = typeof payload.question === "string" ? payload.question.trim().slice(0, 2000) : "";
  const answer = typeof payload.answer === "string" ? payload.answer.trim().slice(0, 5000) : "";
  if (!question || !answer) { res.status(400).json({ error: "السؤال والإجابة مطلوبان." }); return; }
  const result = await edge<Row>(session, "meruna-voice-knowledge", { action: "save_faq", source_id: typeof payload.sourceId === "string" ? payload.sourceId : null, question, answer, category: typeof payload.category === "string" ? payload.category.trim().slice(0, 120) : "General", enabled: payload.enabled !== false });
  if (!result.ok) { jsonError(res, result, "تعذر حفظ سؤال المعرفة."); return; }
  res.json(result.data ?? null);
});

router.post("/operations/voice-agent/knowledge/:id/review", async (req, res) => {
  const session = await protect(req, res, "update");
  if (!session) return;
  const decision = req.body?.decision === "rejected" ? "rejected" : req.body?.decision === "approved" ? "approved" : "";
  if (!decision) { res.status(400).json({ error: "قرار المراجعة غير صالح." }); return; }
  const result = await edge<Row>(session, "meruna-voice-knowledge", { action: "review", source_id: req.params.id, decision });
  if (!result.ok) { jsonError(res, result, "تعذر تحديث مراجعة مصدر المعرفة."); return; }
  res.json(result.data ?? null);
});

router.post("/operations/voice-agent/knowledge/:id/archive", async (req, res) => {
  const session = await protect(req, res, "update");
  if (!session) return;
  const result = await edge<Row>(session, "meruna-voice-knowledge", { action: "archive", source_id: req.params.id });
  if (!result.ok) { jsonError(res, result, "تعذر أرشفة مصدر المعرفة."); return; }
  res.json(result.data ?? null);
});

router.get("/operations/voice-agent/phone", async (req, res) => {
  const session = await protect(req, res);
  if (!session) return;
  const params = new URLSearchParams({ select: voiceChannelFields, clinic_id: `eq.${session.clinicId}`, type: "eq.voice", order: "updated_at.desc", limit: "10" });
  params.set("deleted_at", "is.null");
  const result = await supabaseRequest<Row[]>(`/rest/v1/channels?${params.toString()}`, { headers: headers(session) });
  if (!result.ok) { jsonError(res, result, "تعذر تحميل حالة قناة الهاتف."); return; }
  res.json({ channels: result.data ?? [], total: result.data?.length ?? 0 });
});

router.post("/operations/voice-agent/phone/test", async (req, res) => {
  const session = await protect(req, res, "update");
  if (!session) return;
  const result = await edge<Row>(session, "meruna-voice-phone", { action: "status" });
  if (!result.ok) { jsonError(res, result, "تعذر اختبار جاهزية قناة الهاتف."); return; }
  res.json(result.data ?? null);
});

router.get("/operations/voice-agent/performance", async (req, res) => {
  const session = await protect(req, res);
  if (!session) return;
  const result = await rpc<Row>(session, "get_voice_performance_projection", {
    p_range: queryValue(req.query.range) || "7d",
    p_branch_id: queryValue(req.query.branchId) || null,
    p_intent: queryValue(req.query.intent) || null,
    p_outcome: queryValue(req.query.outcome) || null,
  });
  if (!result.ok) { jsonError(res, result, "تعذر تحميل تحليل أداء الوكيل الصوتي."); return; }
  res.json(result.data ?? null);
});

router.get("/operations/voice-agent/usage", async (req, res) => {
  const session = await protect(req, res);
  if (!session) return;
  const result = await edge<Row>(session, "meruna-voice-usage", { action: "dashboard" });
  if (!result.ok) { jsonError(res, result, "تعذر تحميل استخدام Voice."); return; }
  res.json(result.data ?? null);
});

router.get("/operations/voice-agent/billing", async (req, res) => {
  const session = await protect(req, res);
  if (!session) return;
  const result = await edge<Row>(session, "meruna-voice-billing", { action: "snapshot" });
  if (!result.ok) { jsonError(res, result, "تعذر تحميل ملخص فوترة Voice."); return; }
  res.json(result.data ?? null);
});

router.get("/operations/voice-agent/settings", async (req, res) => {
  const session = await protect(req, res);
  if (!session) return;
  const result = await edge<Row>(session, "meruna-voice-settings", { action: "snapshot" });
  if (!result.ok) { jsonError(res, result, "تعذر تحميل إعدادات Voice."); return; }
  res.json(result.data ?? null);
});

router.put("/operations/voice-agent/settings", async (req, res) => {
  const session = await protect(req, res, "update");
  if (!session) return;
  const payload = req.body && typeof req.body === "object" ? req.body as Row : {};
  const result = await edge<Row>(session, "meruna-voice-settings", {
    action: "save",
    general: payload.general && typeof payload.general === "object" ? payload.general : {},
    notifications: payload.notifications && typeof payload.notifications === "object" ? payload.notifications : {},
  });
  if (!result.ok) { jsonError(res, result, "تعذر حفظ إعدادات Voice."); return; }
  res.json(result.data ?? null);
});

export default router;
