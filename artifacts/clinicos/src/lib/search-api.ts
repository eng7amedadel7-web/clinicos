export type SearchPatient = { id: string; name: string; phone: string };
export type SearchAppointment = { id: string; name: string; scheduledAt: string | null; status: string };
export type SearchConversation = { id: string; patientName: string; lastMessage?: string | null; channelType?: string };

async function safeJson<T>(path: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const response = await fetch(path, { credentials: "include", signal });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getSearchPatients(signal?: AbortSignal): Promise<SearchPatient[]> {
  const data = await safeJson<Array<Record<string, unknown>>>("/api/patients", signal);
  if (!Array.isArray(data)) return [];
  return data.map((row) => ({
    id: String(row.id ?? ""),
    name: typeof row.name === "string" && row.name.trim() ? row.name : "مريض بدون اسم",
    phone: typeof row.phone === "string" ? row.phone : "—",
  })).filter((row) => row.id);
}

export async function getSearchAppointments(signal?: AbortSignal): Promise<SearchAppointment[]> {
  const data = await safeJson<{ appointments?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>>("/api/appointments", signal);
  const rows = Array.isArray(data) ? data : Array.isArray(data?.appointments) ? data.appointments : [];
  return rows.map((row) => ({
    id: String(row.id ?? ""),
    name: typeof row.name === "string" && row.name.trim() ? row.name : "مريض بدون اسم",
    scheduledAt: typeof row.scheduledAt === "string" ? row.scheduledAt : null,
    status: typeof row.status === "string" ? row.status : "scheduled",
  })).filter((row) => row.id);
}

export async function getSearchConversations(signal?: AbortSignal): Promise<SearchConversation[]> {
  const data = await safeJson<{ conversations?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>>("/api/inbox", signal);
  const rows = Array.isArray(data) ? data : Array.isArray(data?.conversations) ? data.conversations : [];
  return rows.map((row) => {
    const patientObj = row.patient as Record<string, unknown> | undefined;
    const name = typeof row.patientName === "string" ? row.patientName : typeof patientObj?.name === "string" ? patientObj.name : "محادثة مريض";
    return {
      id: String(row.id ?? ""),
      patientName: name,
      lastMessage: typeof row.lastPatientMessage === "string" ? row.lastPatientMessage : typeof row.last_patient_message === "string" ? row.last_patient_message : null,
      channelType: typeof row.channelType === "string" ? row.channelType : typeof row.channel_type === "string" ? row.channel_type : undefined,
    };
  }).filter((row) => row.id);
}

export function appointmentDateLabel(value: string | null, language: "ar" | "en"): string {
  if (!value) return language === "ar" ? "بدون موعد" : "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return language === "ar" ? "بدون موعد" : "No date";
  return new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

