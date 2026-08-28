import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requireClinicPermission, respondToPermissionError } from "../lib/permissions";
import { supabaseRequest } from "../lib/supabase";
import { clinicEvents } from "../lib/events";
import { logger } from "../lib/logger";

const router = Router();

type Session = { clinicId: string; userId: string; accessToken: string };

function headers(session: Session, extra: Record<string, string> = {}) {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...extra,
  };
}

// 1. Template CSV Generator for download
router.get("/organization/import/templates/:type", async (req: Request, res: Response) => {
  const type = req.params.type;

  if (type === "patients") {
    const csvContent = "\uFEFFالاسم الكامل,رقم الهاتف,البريد الإلكتروني,الجنس,تاريخ الميلاد,ملاحظات طبية\nد. أحمد مصطفى,+966501234567,ahmed@example.com,ذكر,1990-05-15,يعاني من حساسية البنسلين\nسارة عبد الله,+966559876543,sara@example.com,أنثى,1995-11-20,متابعة أسنان دورية";
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=patients-sample-template.csv");
    res.send(csvContent);
    return;
  }

  if (type === "services") {
    const csvContent = "\uFEFFاسم الخدمة,السعر (ر.س),المدة (بالدقائق),التفاصيل\nكشف عام باطنة,150,30,فحص سريري شامل مع قياس الضغط والحرارة\nتنظيف وتلميع أسنان,250,45,تنظيف جير وتلميع وقائي\nاستشارة جلدية وليزر,200,20,تقييم نوع البشرة وجلسات العناية";
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=services-sample-template.csv");
    res.send(csvContent);
    return;
  }

  if (type === "appointments") {
    const csvContent = "\uFEFFاسم المريض,رقم الهاتف,التاريخ والوقت,اسم الخدمة,الملاحظات\nمحمد خالد,+966500112233,2026-09-01T10:00:00,كشف عام باطنة,حجز موعد أولي\nنورة الشهري,+966544332211,2026-09-01T11:30:00,تنظيف وتلميع أسنان,جلسة متابعة";
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=appointments-sample-template.csv");
    res.send(csvContent);
    return;
  }

  res.status(404).json({ error: "نوع القالب غير معروف." });
});

// 2. POST /organization/import/preview - Parses raw text/CSV rows and returns detected columns
router.post("/organization/import/preview", async (req: Request, res: Response) => {
  let session: Session | null = null;
  try {
    session = await requireClinicPermission(req, "Patients", "patients", "create");
  } catch (error) {
    respondToPermissionError(res, error);
    return;
  }
  if (!session) return;

  const { content, type } = req.body;
  if (typeof content !== "string" || !content.trim()) {
    res.status(400).json({ error: "محتوى الملف فارغ أو غير صالح." });
    return;
  }

  try {
    // Parse CSV lines
    const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      res.status(400).json({ error: "الملف لا يحتوي على أي بيانات." });
      return;
    }

    const parseLine = (line: string) => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim().replace(/^["']|["']$/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ""));
      return result;
    };

    const headers = parseLine(lines[0]);
    const rawRows = lines.slice(1).map(parseLine).filter((r) => r.some((cell) => cell.length > 0));

    const preview = rawRows.slice(0, 5).map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h || `column_${i + 1}`] = row[i] || "";
      });
      return obj;
    });

    res.json({
      headers,
      totalRows: rawRows.length,
      preview,
      detectedType: type || "patients",
    });
  } catch (err) {
    res.status(400).json({ error: "تعذر قراءة محتوى الملف. تأكد من سلامة التنسيق." });
  }
});

// 3. POST /organization/import/execute - Executes batch ingestion directly into Supabase
const executeSchema = z.object({
  type: z.enum(["patients", "services", "appointments", "pdf_knowledge"]),
  records: z.array(z.record(z.any())).min(1),
  knowledgeTitle: z.string().optional(),
});

router.post("/organization/import/execute", async (req: Request, res: Response) => {
  let session: Session | null = null;
  try {
    session = await requireClinicPermission(req, "Patients", "patients", "create");
  } catch (error) {
    respondToPermissionError(res, error);
    return;
  }
  if (!session) return;

  const parsed = executeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "البيانات المرسلة غير مكتملة أو غير صالحة.", details: parsed.error.format() });
    return;
  }

  const { type, records, knowledgeTitle } = parsed.data;
  let importedCount = 0;
  const errors: string[] = [];

  // A. Import Patients
  if (type === "patients") {
    const patientRows = records.map((r) => {
      const name = r.name || r["الاسم"] || r["الاسم الكامل"] || r["اسم المريض"] || r.fullName || "";
      const phone = r.phone || r["رقم الهاتف"] || r["الجوال"] || r["الهاتف"] || r.mobile || null;
      const email = r.email || r["البريد"] || r["البريد الإلكتروني"] || null;
      const notes = r.notes || r["ملاحظات"] || r["ملاحظات طبية"] || r.medical_history || null;

      return {
        clinic_id: session.clinicId,
        name: String(name).trim() || "مريض بدون اسم",
        phone: phone ? String(phone).trim() : null,
        email: email ? String(email).trim() : null,
        notes: notes ? String(notes).trim() : null,
        status: "active",
      };
    }).filter((p) => p.name && p.name !== "مريض بدون اسم");

    if (patientRows.length === 0) {
      res.status(400).json({ error: "لم يتم العثور على أسماء صالحة للمرضى في البيانات المستوردة." });
      return;
    }

    // Insert in batches of 50
    const chunkSize = 50;
    for (let i = 0; i < patientRows.length; i += chunkSize) {
      const chunk = patientRows.slice(i, i + chunkSize);
      const insertResult = await supabaseRequest<Array<Record<string, unknown>>>("/rest/v1/patients", {
        method: "POST",
        headers: headers(session),
        body: JSON.stringify(chunk),
      });

      if (insertResult.ok) {
        importedCount += (insertResult.data?.length || chunk.length);
      } else {
        errors.push(`فشلت الدفعة ${Math.floor(i / chunkSize) + 1}: ${insertResult.status}`);
      }
    }

    if (importedCount > 0) {
      clinicEvents.emitClinicEvent(session.clinicId, "patient.created", {
        count: importedCount,
        batch: true,
      });
    }
  }

  // B. Import Services
  else if (type === "services") {
    const serviceRows = records.map((r) => {
      const name = r.name || r["اسم الخدمة"] || r["الخدمة"] || r.title || "";
      const priceRaw = r.price || r["السعر"] || r["السعر (ر.س)"] || 0;
      const durationRaw = r.duration || r["المدة"] || r["المدة (بالدقائق)"] || 30;
      const description = r.description || r["التفاصيل"] || r["الوصف"] || null;

      const price = Number(priceRaw) || 0;
      const durationMinutes = Number(durationRaw) || 30;

      return {
        clinic_id: session.clinicId,
        name: String(name).trim() || "خدمة عامة",
        price,
        duration_minutes: durationMinutes,
        description: description ? String(description).trim() : null,
        is_active: true,
      };
    }).filter((s) => s.name);

    if (serviceRows.length === 0) {
      res.status(400).json({ error: "لم يتم العثور على خدمات صالحة في البيانات." });
      return;
    }

    const insertResult = await supabaseRequest<Array<Record<string, unknown>>>("/rest/v1/services", {
      method: "POST",
      headers: headers(session),
      body: JSON.stringify(serviceRows),
    });

    if (insertResult.ok) {
      importedCount = insertResult.data?.length || serviceRows.length;
      clinicEvents.emitClinicEvent(session.clinicId, "settings.updated", { servicesImported: importedCount });
    } else {
      errors.push("تعذر إدراج الخدمات في قاعدة البيانات.");
    }
  }

  // C. Import PDF Knowledge Base
  else if (type === "pdf_knowledge") {
    const title = knowledgeTitle || "وثيقة ولوائح العيادة المستوردة";
    const textContent = records.map((r) => r.text || r.content || JSON.stringify(r)).join("\n\n");

    const insertResult = await supabaseRequest<Array<Record<string, unknown>>>("/rest/v1/voice_knowledge_sources", {
      method: "POST",
      headers: headers(session),
      body: JSON.stringify({
        clinic_id: session.clinicId,
        title,
        source_kind: "file_upload",
        processing_status: "ready",
        approval_status: "approved",
        metadata: {
          imported_at: new Date().toISOString(),
          content_length: textContent.length,
          preview_snippet: textContent.slice(0, 300),
        },
      }),
    });

    if (insertResult.ok) {
      importedCount = 1;
      clinicEvents.emitClinicEvent(session.clinicId, "voice.knowledge_updated", { title });
    } else {
      errors.push("تعذر حفظ الوثيقة في قاعدة المعرفة.");
    }
  }

  // D. Import Appointments
  else if (type === "appointments") {
    // Check if primary branch exists
    const branchRes = await supabaseRequest<Array<{ id: string }>>(
      `/rest/v1/branches?select=id&clinic_id=eq.${encodeURIComponent(session.clinicId)}&limit=1`,
      { headers: headers(session) }
    );
    const branchId = branchRes.data?.[0]?.id || null;

    const appointmentRows = records.map((r) => {
      const patientName = r.patient_name || r["اسم المريض"] || r.name || "مريض";
      const scheduledAt = r.date || r["التاريخ والوقت"] || r.scheduled_at || new Date().toISOString();
      const notes = r.notes || r["الملاحظات"] || null;

      return {
        clinic_id: session.clinicId,
        branch_id: branchId,
        patient_name: String(patientName).trim(),
        scheduled_at: scheduledAt,
        status: "confirmed",
        notes: notes ? String(notes).trim() : null,
      };
    });

    const insertResult = await supabaseRequest<Array<Record<string, unknown>>>("/rest/v1/appointments", {
      method: "POST",
      headers: headers(session),
      body: JSON.stringify(appointmentRows),
    });

    if (insertResult.ok) {
      importedCount = insertResult.data?.length || appointmentRows.length;
      clinicEvents.emitClinicEvent(session.clinicId, "appointment.booked", { count: importedCount, batch: true });
    } else {
      errors.push("تعذر حفظ المواعيد في قاعدة البيانات.");
    }
  }

  logger.info({ clinicId: session.clinicId, type, importedCount }, "[Import] Data batch imported to Supabase");

  res.json({
    success: importedCount > 0,
    type,
    importedCount,
    errors,
  });
});

export default router;
