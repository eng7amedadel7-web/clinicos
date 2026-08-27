export type InboxConversation = {
  id: string;
  patient_id?: string;
  name: string;
  phone?: string;
  channel: string;
  channelId?: string | null;
  channelType: string;
  channelProvider?: string | null;
  channelStatus?: string;
  mode: "AI" | "Human";
  lastActivityAt: string | null;
  lastMessage?: string | null;
  assignedStaffId?: string | null;
  needsStaff?: boolean;
  status?: string;
  priority?: string;
};

export type InboxChannel = {
  id: string;
  type: string;
  provider?: string | null;
  status?: string;
  isEnabled?: boolean;
  displayName?: string;
};

export type InboxMessage = {
  id: string;
  conversation_id?: string;
  content: string;
  direction: "incoming" | "outgoing" | string;
  sender_type?: "patient" | "staff" | "ai" | "system" | string;
  created_at: string;
  message_status?: string | null;
};

export type InboxPayload = {
  channels: InboxChannel[];
  channelCounts?: Record<string, number>;
  conversations: InboxConversation[];
  selectedConversationId: string | null;
  messages: InboxMessage[];
};

export type SavedReply = {
  id: string;
  template_key: string;
  language: string;
  body_template: string;
  enabled?: boolean;
};

export type ConversationOperation = {
  id: string;
  event_type: string;
  actor_type?: string;
  metadata?: {
    content?: string;
    outcome?: string;
    note?: string;
    snoozed_until?: string;
    reason?: string;
    [key: string]: unknown;
  };
  occurred_at?: string;
  created_at?: string;
};

export async function getInboxPayload(conversationId: string | null, signal?: AbortSignal): Promise<InboxPayload> {
  const query = conversationId ? `?conversationId=${encodeURIComponent(conversationId)}` : "";
  const response = await fetch(`/api/inbox${query}`, { credentials: "include", signal });
  const payload = (await response.json().catch(() => null)) as InboxPayload | { error?: string } | null;
  if (!response.ok) throw new Error(payload && "error" in payload && typeof payload.error === "string" ? payload.error : "تعذر تحميل صندوق الوارد.");
  return payload as InboxPayload;
}

export async function getSavedReplies(language: "ar" | "en" = "ar", signal?: AbortSignal): Promise<SavedReply[]> {
  const response = await fetch(`/api/inbox/saved-replies?language=${language}`, { credentials: "include", signal });
  const payload = (await response.json().catch(() => [])) as SavedReply[] | { error?: string };
  if (!response.ok || !Array.isArray(payload)) return [];
  return payload;
}

export async function getConversationOperations(conversationId: string, signal?: AbortSignal): Promise<ConversationOperation[]> {
  const response = await fetch(`/api/inbox/${encodeURIComponent(conversationId)}/operations`, { credentials: "include", signal });
  const payload = (await response.json().catch(() => [])) as ConversationOperation[] | { error?: string };
  if (!response.ok || !Array.isArray(payload)) return [];
  return payload;
}

export async function inboxAction(path: string, init: RequestInit = {}) {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const payload = (await response.json().catch(() => null)) as { error?: string } | InboxMessage | { mode?: "AI" | "Human" } | null;
  if (!response.ok) throw new Error(payload && "error" in payload && typeof payload.error === "string" ? payload.error : "تعذر تنفيذ العملية.");
  return payload;
}

