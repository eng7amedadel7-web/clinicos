import { Router } from "express";
import { readSession } from "../lib/session";
import { supabaseRequest } from "../lib/supabase";

const router = Router();
type PatientRow = { id?: string; name?: string; first_name?: string; last_name?: string; phone?: string; created_at?: string };
type PatientInput = { name?: unknown; phone?: unknown; email?: unknown; notes?: unknown };

function sessionHeaders(accessToken: string, extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...extra };
}

function input(body: PatientInput) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  return { name, phone, email, notes };
}

router.get("/patients", async (req, res) => {
  const session = readSession(req);
  if (!session) { res.status(401).json({ error: "Not authenticated." }); return; }
  const path = "/rest/v1/patients?select=id,name,first_name,last_name,phone,created_at&clinic_id=eq." + encodeURIComponent(session.clinicId) + "&deleted_at=is.null&order=created_at.desc&limit=1000";
  const result = await supabaseRequest<PatientRow[]>(path, { headers: { Authorization: `Bearer ${session.accessToken}` } });
  if (!result.ok) { res.status(result.status || 502).json({ error: "Patients could not be loaded." }); return; }
  res.json((result.data ?? []).map((patient) => ({ id: patient.id, name: patient.name || [patient.first_name, patient.last_name].filter(Boolean).join(" ") || "مريض بدون اسم", phone: patient.phone || "—", createdAt: patient.created_at || null })));
});

router.post("/patients", async (req, res) => {
  const session = readSession(req);
  if (!session) { res.status(401).json({ error: "Not authenticated." }); return; }
  const data = input(req.body ?? {});
  if (!data.name) { res.status(400).json({ error: "اسم المريض مطلوب." }); return; }
  const result = await supabaseRequest<PatientRow[]>("/rest/v1/patients", {
    method: "POST",
    headers: sessionHeaders(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify({ clinic_id: session.clinicId, name: data.name, phone: data.phone || null, email: data.email || null, notes: data.notes || null, status: "active" }),
  });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر حفظ المريض." }); return; }
  res.status(201).json(result.data?.[0] ?? null);
});

router.patch("/patients/:id", async (req, res) => {
  const session = readSession(req);
  if (!session) { res.status(401).json({ error: "Not authenticated." }); return; }
  const data = input(req.body ?? {});
  if (!data.name) { res.status(400).json({ error: "اسم المريض مطلوب." }); return; }
  const path = "/rest/v1/patients?id=eq." + encodeURIComponent(req.params.id) + "&clinic_id=eq." + encodeURIComponent(session.clinicId) + "&deleted_at=is.null";
  const result = await supabaseRequest<PatientRow[]>(path, {
    method: "PATCH",
    headers: sessionHeaders(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify({ name: data.name, phone: data.phone || null, email: data.email || null, notes: data.notes || null }),
  });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر تحديث المريض." }); return; }
  if (!result.data?.length) { res.status(404).json({ error: "المريض غير موجود." }); return; }
  res.json(result.data[0]);
});

router.delete("/patients/:id", async (req, res) => {
  const session = readSession(req);
  if (!session) { res.status(401).json({ error: "Not authenticated." }); return; }
  const path = "/rest/v1/patients?id=eq." + encodeURIComponent(req.params.id) + "&clinic_id=eq." + encodeURIComponent(session.clinicId) + "&deleted_at=is.null";
  const result = await supabaseRequest<PatientRow[]>(path, {
    method: "PATCH",
    headers: sessionHeaders(session.accessToken, { Prefer: "return=representation" }),
    body: JSON.stringify({ deleted_at: new Date().toISOString(), deleted_by: session.userId, status: "archived" }),
  });
  if (!result.ok) { res.status(result.status || 502).json({ error: "تعذر أرشفة المريض." }); return; }
  if (!result.data?.length) { res.status(404).json({ error: "المريض غير موجود." }); return; }
  res.status(204).end();
});

export default router;
