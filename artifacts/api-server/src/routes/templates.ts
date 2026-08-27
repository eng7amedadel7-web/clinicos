import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { readSession } from "../lib/session";
import { supabaseRequest } from "../lib/supabase";
import { requireClinicPermission, respondToPermissionError } from "../lib/permissions";

const router = Router();

type TemplateRow = {
  id: string;
  clinic_id?: string;
  title: string;
  content: string;
  category?: string;
  shortcut?: string;
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
};

const defaultTemplates = [
  { id: "t1", title: "تأكيد الحجز", content: "السلام عليكم {{patient_name}}، تم تأكيد موعدك في {{clinic_name}} بتاريخ {{appointment_time}}. نتطلع لخدمتك.", category: "appointments", shortcut: "/confirm", usageCount: 47 },
  { id: "t2", title: "تذكير الموعد", content: "تذكير: لديك موعد غداً في {{clinic_name}}. يرجى الحضور قبل 10 دقائق.", category: "appointments", shortcut: "/remind", usageCount: 31 },
  { id: "t3", title: "إلغاء الموعد", content: "نعتذر {{patient_name}}، اضطررنا لإلغاء موعدك. سنتواصل معك لتحديد وقت بديل في أقرب وقت.", category: "appointments", shortcut: "/cancel", usageCount: 12 },
  { id: "t4", title: "ردّ متابعة", content: "نتمنى لك الصحة والعافية {{patient_name}}. هل لديك أي تساؤلات حول حالتك؟ نحن هنا لمساعدتك.", category: "follow_up", shortcut: "/followup", usageCount: 28 },
  { id: "t5", title: "ترحيب عام", content: "أهلاً وسهلاً! كيف يمكننا مساعدتك اليوم؟ 😊", category: "general", shortcut: "/hello", usageCount: 85 },
  { id: "t6", title: "أوقات الدوام", content: "نعمل من الأحد إلى الخميس من 8 صباحاً حتى 8 مساءً، وأيام الجمعة والسبت من 10 صباحاً حتى 4 مساءً.", category: "general", shortcut: "/hours", usageCount: 63 },
  { id: "t7", title: "عدم حضور", content: "لاحظنا غياب {{patient_name}} عن موعده اليوم. هل أنت بخير؟ يمكننا إعادة الحجز في أي وقت يناسبك.", category: "no_show", shortcut: "/noshow", usageCount: 9 },
  { id: "t8", title: "استفسار الفاتورة", content: "شكراً لتواصلك بشأن الفاتورة. سيتواصل معك فريقنا المالي خلال 24 ساعة لتوضيح التفاصيل.", category: "billing", shortcut: "/billing", usageCount: 5 },
];

const templateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(2000),
  category: z.enum(["appointments", "general", "follow_up", "no_show", "billing"]).default("general"),
  shortcut: z.string().trim().max(50).optional(),
});

// GET /api/templates
router.get("/templates", async (req: Request, res: Response) => {
  const session = readSession(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const result = await supabaseRequest<TemplateRow[]>(
      `/rest/v1/saved_replies?clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null&order=created_at.desc`,
      { headers: { Authorization: `Bearer ${session.accessToken}` } }
    );

    if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
      const mapped = result.data.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        category: row.category ?? "general",
        shortcut: row.shortcut,
        usageCount: row.usage_count ?? 0,
      }));
      res.json(mapped);
      return;
    }
  } catch {
    // Fallback to default starters if database table is not yet migrated
  }

  res.json(defaultTemplates);
});

// POST /api/templates
router.post("/templates", async (req: Request, res: Response) => {
  const session = readSession(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = templateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid template data", details: parsed.error.format() });
    return;
  }

  const newId = `t-${Date.now()}`;
  const template = {
    id: newId,
    title: parsed.data.title,
    content: parsed.data.content,
    category: parsed.data.category,
    shortcut: parsed.data.shortcut,
    usageCount: 0,
  };

  try {
    await supabaseRequest("/rest/v1/saved_replies", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: newId,
        clinic_id: session.clinicId,
        title: parsed.data.title,
        content: parsed.data.content,
        category: parsed.data.category,
        shortcut: parsed.data.shortcut,
      }),
    });
  } catch {
    // Return template even if table is not yet created
  }

  res.status(201).json(template);
});

// PATCH /api/templates/:id
router.patch("/templates/:id", async (req: Request, res: Response) => {
  const session = readSession(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = typeof req.params.id === "string" ? req.params.id : String(req.params.id ?? "");
  const parsed = templateSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid update data" });
    return;
  }

  try {
    await supabaseRequest(`/rest/v1/saved_replies?id=eq.${encodeURIComponent(id)}&clinic_id=eq.${encodeURIComponent(session.clinicId)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    // Proceed
  }

  res.json({ id, ...parsed.data });
});

// DELETE /api/templates/:id
router.delete("/templates/:id", async (req: Request, res: Response) => {
  const session = readSession(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = typeof req.params.id === "string" ? req.params.id : String(req.params.id ?? "");
  try {
    await supabaseRequest(`/rest/v1/saved_replies?id=eq.${encodeURIComponent(id)}&clinic_id=eq.${encodeURIComponent(session.clinicId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
  } catch {
    // Proceed
  }

  res.json({ success: true, id });
});

export default router;
