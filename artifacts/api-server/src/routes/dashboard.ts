import { Router } from "express";
import { readSession } from "../lib/session";
import { supabaseRequest } from "../lib/supabase";

const router = Router();

type AppointmentRow = {
  id?: string;
  patient_id?: string;
  appointment_status?: string;
  scheduled_at?: string;
  created_at?: string;
};

type PatientRow = {
  id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
};

type ClinicRow = {
  id?: string;
  name?: string;
  status?: string;
  location_config?: Record<string, unknown>;
};

function cityFrom(clinic: ClinicRow) {
  const city = clinic.location_config?.city;
  return typeof city === "string" && city.trim() ? city : "—";
}

function statusLabel(status: string | undefined) {
  const labels: Record<string, string> = {
    scheduled: "مجدول",
    confirmed: "مؤكد",
    checked_in: "وصل",
    completed: "مكتمل",
    cancelled: "ملغي",
    no_show: "لم يحضر",
    pending: "بانتظار التأكيد",
  };
  return labels[status ?? ""] ?? status ?? "تم تحديث الموعد";
}

function patientDisplayName(patient: PatientRow | undefined) {
  if (!patient) return "مريض بدون اسم";
  const fullName = [patient.first_name, patient.last_name].filter(Boolean).join(" ").trim();
  return patient.name?.trim() || fullName || "مريض بدون اسم";
}

router.get("/summary", async (req, res) => {
  const session = readSession(req);
  if (!session) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  const clinicFilter = `clinic_id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null`;
  const headers = { Authorization: `Bearer ${session.accessToken}` };
  const [clinicResult, appointmentsResult, patientsResult, staffResult, doctorsResult, servicesResult] = await Promise.all([
    supabaseRequest<ClinicRow[]>(
      `/rest/v1/clinics?select=id,name,status,location_config&id=eq.${encodeURIComponent(session.clinicId)}&deleted_at=is.null&limit=1`,
      { headers },
    ),
    supabaseRequest<AppointmentRow[]>(
      `/rest/v1/appointments?select=id,patient_id,appointment_status,scheduled_at,created_at&${clinicFilter}&order=scheduled_at.desc&limit=5`,
      { headers },
    ),
    supabaseRequest<PatientRow[]>(
      `/rest/v1/patients?select=id,name,first_name,last_name&${clinicFilter}&limit=1000`,
      { headers },
    ),
    supabaseRequest<Record<string, unknown>[]>(
      `/rest/v1/clinic_staff?select=id&${clinicFilter}&limit=1000`,
      { headers },
    ),
    supabaseRequest<Record<string, unknown>[]>(
      `/rest/v1/doctors?select=id&${clinicFilter}&is_active=eq.true&limit=1000`,
      { headers },
    ),
    supabaseRequest<Record<string, unknown>[]>(
      `/rest/v1/services?select=id&${clinicFilter}&is_active=eq.true&limit=1000`,
      { headers },
    ),
  ]);

  const clinic = clinicResult.ok ? clinicResult.data?.[0] : undefined;
  if (!clinic?.id) {
    res.status(403).json({ error: "The selected clinic is not available to this account." });
    return;
  }

  const appointments = appointmentsResult.ok ? appointmentsResult.data ?? [] : [];
  const patients = patientsResult.ok ? patientsResult.data ?? [] : [];
  const patientMap = new Map(patients.map((patient) => [String(patient.id), patient]));

  res.json({
    clinic: {
      id: clinic.id,
      name: clinic.name ?? "",
      status: clinic.status ?? "active",
      city: cityFrom(clinic),
    },
    stats: [
      {
        label: "المرضى",
        value: String(patients.length),
        helper: "سجلات العيادة النشطة",
        tone: "blue",
      },
      {
        label: "المواعيد الأخيرة",
        value: String(appointments.length),
        helper: "آخر سجلات الحجز",
        tone: "green",
      },
      {
        label: "أعضاء الفريق",
        value: String(staffResult.ok ? staffResult.data?.length ?? 0 : 0),
        helper: "المستخدمون المرتبطون بالعيادة",
        tone: "violet",
      },
      {
        label: "الخدمات النشطة",
        value: String(servicesResult.ok ? servicesResult.data?.length ?? 0 : 0),
        helper: `${doctorsResult.ok ? doctorsResult.data?.length ?? 0 : 0} أطباء نشطين`,
        tone: "amber",
      },
    ],
    recentActivity: appointments.map((appointment, index) => ({
      id: String(appointment.id ?? index),
      title: patientDisplayName(patientMap.get(String(appointment.patient_id))),
      description: statusLabel(appointment.appointment_status),
      createdAt: appointment.scheduled_at ?? appointment.created_at ?? "",
      tone: index % 2 === 0 ? "blue" : "green",
    })),
  });
});

export default router;
