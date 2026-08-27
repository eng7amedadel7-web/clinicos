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

export type VoiceAgentCall = {
  id: string;
  provider: string;
  provider_call_id?: string | null;
  direction: "inbound" | "outbound" | "test";
  call_status: "queued" | "ringing" | "in_progress" | "completed" | "missed" | "failed" | "cancelled";
  outcome?: string | null;
  duration_seconds?: number | null;
  started_at?: string | null;
  ended_at?: string | null;
  call_summary?: string | null;
  created_at: string;
  patientName?: string;
};

export type VoiceAgentData = {
  configuration: { display_name: string; status: string; language_code: string; dialect_code?: string | null } | null;
  operationalSettings: { default_language: string; availability: string; default_call_behavior: string } | null;
  calls: VoiceAgentCall[];
  total: number;
};

async function operationsRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const payload = await response.json().catch(() => null) as { error?: string } | T | null;
  if (!response.ok) throw new Error(payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string" ? payload.error : "تعذر تنفيذ العملية.");
  return payload as T;
}

export async function getOperationsList(kind: "waitlist" | "follow-ups" | "no-shows", signal?: AbortSignal, branchId?: string): Promise<OperationsList> {
  const suffix = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
  return operationsRequest<OperationsList>(`/api/operations/${kind}${suffix}`, { signal });
}

export async function runOperationsAction(path: string, body: Record<string, unknown> = {}) {
  return operationsRequest<unknown>(path, { method: "POST", body: JSON.stringify(body) });
}

export async function getVoiceAgentData(signal?: AbortSignal): Promise<VoiceAgentData> {
  return operationsRequest<VoiceAgentData>("/api/operations/voice-agent", { signal });
}

export type VoiceApiRecord = Record<string, unknown>;

function voiceQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)); });
  const suffix = query.toString();
  return suffix ? `?${suffix}` : "";
}

export async function getVoiceOverview(signal?: AbortSignal): Promise<VoiceApiRecord> {
  return operationsRequest<VoiceApiRecord>("/api/operations/voice-agent/overview", { signal });
}

export async function getVoiceCallsPage(params: Record<string, string | number | undefined> = {}, signal?: AbortSignal): Promise<VoiceApiRecord> {
  return operationsRequest<VoiceApiRecord>(`/api/operations/voice-agent/calls${voiceQuery(params)}`, { signal });
}

export async function getVoiceBookingsPage(params: Record<string, string | number | undefined> = {}, signal?: AbortSignal): Promise<VoiceApiRecord> {
  return operationsRequest<VoiceApiRecord>(`/api/operations/voice-agent/bookings${voiceQuery(params)}`, { signal });
}

export async function getVoiceClinic(signal?: AbortSignal): Promise<VoiceApiRecord> {
  return operationsRequest<VoiceApiRecord>("/api/operations/voice-agent/clinic", { signal });
}

export async function getVoiceAgentSnapshot(signal?: AbortSignal): Promise<VoiceApiRecord> {
  return operationsRequest<VoiceApiRecord>("/api/operations/voice-agent/agent", { signal });
}

export async function getVoiceKnowledgeSources(signal?: AbortSignal): Promise<VoiceApiRecord> {
  return operationsRequest<VoiceApiRecord>("/api/operations/voice-agent/knowledge", { signal });
}

export async function getVoicePhoneChannels(signal?: AbortSignal): Promise<VoiceApiRecord> {
  return operationsRequest<VoiceApiRecord>("/api/operations/voice-agent/phone", { signal });
}

export async function getVoicePerformance(params: Record<string, string | number | undefined> = {}, signal?: AbortSignal): Promise<VoiceApiRecord> {
  return operationsRequest<VoiceApiRecord>(`/api/operations/voice-agent/performance${voiceQuery(params)}`, { signal });
}

export async function getVoiceUsage(signal?: AbortSignal): Promise<VoiceApiRecord> {
  return operationsRequest<VoiceApiRecord>("/api/operations/voice-agent/usage", { signal });
}

export async function getVoiceBilling(signal?: AbortSignal): Promise<VoiceApiRecord> {
  return operationsRequest<VoiceApiRecord>("/api/operations/voice-agent/billing", { signal });
}

export async function getVoiceSettings(signal?: AbortSignal): Promise<VoiceApiRecord> {
  return operationsRequest<VoiceApiRecord>("/api/operations/voice-agent/settings", { signal });
}

export async function getOperationsSummary(signal?: AbortSignal, branchId?: string): Promise<OperationsSummary> {
  const suffix = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
  const response = await fetch(`/api/operations/summary${suffix}`, { credentials: "include", signal });
  const payload = await response.json().catch(() => null) as { error?: string } | OperationsSummary | null;
  if (!response.ok) {
    throw new Error(payload && "error" in payload && typeof payload.error === "string" ? payload.error : "تعذر تحميل ملخص العمليات.");
  }
  return payload as OperationsSummary;
}
