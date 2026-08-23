import { Router } from "express";
import { readSession } from "../lib/session";
import { supabaseRequest } from "../lib/supabase";

const router = Router();

router.get("/summary", async (req, res) => {
  const session = readSession(req);
  if (!session) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  const headers = { Authorization: `Bearer ${session.accessToken}` };
  const clinicUsers = await supabaseRequest<Record<string, unknown>[]>(
    `/rest/v1/clinic_users?select=clinic_id&auth_user_id=eq.${encodeURIComponent(session.userId)}&limit=1`,
    { headers },
  );
  const clinicId = clinicUsers.ok ? clinicUsers.data?.[0]?.clinic_id : undefined;
  const clinicFilter = clinicId
    ? `&clinic_id=eq.${encodeURIComponent(String(clinicId))}`
    : "";
  const [appointments, patients] = await Promise.all([
    supabaseRequest<Record<string, unknown>[]>(
      `/rest/v1/appointments?select=id,status,created_at&limit=5&order=created_at.desc${clinicFilter}`,
      { headers },
    ),
    supabaseRequest<Record<string, unknown>[]>(
      `/rest/v1/patients?select=id&limit=1000${clinicFilter}`,
      { headers },
    ),
  ]);

  const appointmentRows = appointments.ok ? appointments.data ?? [] : [];
  const patientRows = patients.ok ? patients.data ?? [] : [];

  res.json({
    clinic: {
      id: String(clinicId ?? "unassigned"),
      name: "Your clinic",
      status: "active",
      city: "—",
    },
    stats: [
      {
        label: "Patients",
        value: String(patientRows.length),
        helper: "Registered records",
        tone: "blue",
      },
      {
        label: "Appointments",
        value: String(appointmentRows.length),
        helper: "Recent activity",
        tone: "green",
      },
      {
        label: "Team access",
        value: "Secure",
        helper: "Owner and admin roles",
        tone: "violet",
      },
      {
        label: "Workspace",
        value: "Active",
        helper: "Supabase connected",
        tone: "amber",
      },
    ],
    recentActivity: appointmentRows.map((item, index) => ({
      id: String(item.id ?? index),
      title: "Appointment record",
      description: String(item.status ?? "Updated in Supabase"),
      createdAt: String(item.created_at ?? ""),
      tone: index % 2 === 0 ? "blue" : "green",
    })),
  });
});

export default router;