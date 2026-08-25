export type OperationsStatValue = number | null;

export type OperationsSummary = {
  generatedAt: string;
  stats: {
    appointmentsToday: OperationsStatValue;
    activePatients: OperationsStatValue;
    conversationsNeedingStaff: OperationsStatValue;
    openFollowUps: OperationsStatValue;
    openNoShows: OperationsStatValue;
    activeWaitlist: OperationsStatValue;
    connectedChannels: OperationsStatValue;
  };
  todayAppointments: Array<Record<string, unknown> & { id?: string; patientName?: string; scheduled_at?: string; appointment_status?: string; booking_number?: string | null }>;
  recentConversations: Array<Record<string, unknown> & { id?: string; patientName?: string; last_activity_at?: string; last_patient_message?: string | null; priority?: string | null; is_handoff?: boolean }>;
  recovery: {
    followUps: Array<Record<string, unknown> & { id?: string; patientName?: string; next_due_at?: string | null; status?: string | null }>;
    noShows: Array<Record<string, unknown> & { id?: string; patientName?: string; risk_level?: string | null; last_activity_at?: string | null }>;
  };
  waitlist: Array<Record<string, unknown> & { id?: string; patientName?: string; priority?: number | null }>;
  systemStatus: Record<string, "ready" | "unavailable">;
};

export type OperationsItem = Record<string, unknown> & { id?: string; patientName?: string; patient?: { name?: string; first_name?: string; last_name?: string } | null; status?: string | null; case_status?: string | null; next_due_at?: string | null; last_activity_at?: string | null; priority?: number | null };

export type OperationsList = { total: number; items: OperationsItem[] };

async function operationsRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const payload = await response.json().catch(() => null) as { error?: string } | T | null;
  if (!response.ok) throw new Error(payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string" ? payload.error : "تعذر تنفيذ العملية.");
  return payload as T;
}

export async function getOperationsList(kind: "waitlist" | "follow-ups" | "no-shows", signal?: AbortSignal): Promise<OperationsList> {
  return operationsRequest<OperationsList>(`/api/operations/${kind}`, { signal });
}

export async function runOperationsAction(path: string, body: Record<string, unknown> = {}) {
  return operationsRequest<unknown>(path, { method: "POST", body: JSON.stringify(body) });
}

export async function getOperationsSummary(signal?: AbortSignal): Promise<OperationsSummary> {
  const response = await fetch("/api/operations/summary", { credentials: "include", signal });
  const payload = await response.json().catch(() => null) as { error?: string } | OperationsSummary | null;
  if (!response.ok) {
    throw new Error(payload && "error" in payload && typeof payload.error === "string" ? payload.error : "تعذر تحميل ملخص العمليات.");
  }
  return payload as OperationsSummary;
}
