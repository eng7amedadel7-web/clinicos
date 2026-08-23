import { Router } from "express";
import { readSession } from "../lib/session";
import { supabaseRequest } from "../lib/supabase";

const router = Router();
type PatientRow = { id?: string; name?: string; first_name?: string; last_name?: string; phone?: string; created_at?: string };
router.get("/patients", async (req, res) => {
  const session = readSession(req);
  if (!session) { res.status(401).json({ error: "Not authenticated." }); return; }
  const path = "/rest/v1/patients?select=id,name,first_name,last_name,phone,created_at&clinic_id=eq." + encodeURIComponent(session.clinicId) + "&deleted_at=is.null&order=created_at.desc&limit=1000";
  const result = await supabaseRequest<PatientRow[]>(path, { headers: { Authorization: `Bearer ${session.accessToken}` } });
  if (!result.ok) { res.status(result.status || 502).json({ error: "Patients could not be loaded." }); return; }
  res.json((result.data ?? []).map((patient) => ({ id: patient.id, name: patient.name || [patient.first_name, patient.last_name].filter(Boolean).join(" ") || "مريض بدون اسم", phone: patient.phone || "—", createdAt: patient.created_at || null })));
});
export default router;
