export type InboxConversation = {
  id: string;
  name: string;
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
};

export type InboxChannel = { id: string; type: string; provider?: string | null; status?: string; isEnabled?: boolean; displayName?: string };
export type InboxMessage = { id: string; content: string; direction: string; created_at: string; message_status?: string | null };
export type InboxPayload = { channels: InboxChannel[]; conversations: InboxConversation[]; selectedConversationId: string | null; messages: InboxMessage[] };

export async function getInboxPayload(conversationId: string | null, signal?: AbortSignal): Promise<InboxPayload> {
  const query = conversationId ? `?conversationId=${encodeURIComponent(conversationId)}` : "";
  const response = await fetch(`/api/inbox${query}`, { credentials: "include", signal });
  const payload = await response.json().catch(() => null) as InboxPayload | { error?: string } | null;
  if (!response.ok) throw new Error(payload && "error" in payload && typeof payload.error === "string" ? payload.error : "تعذر تحميل صندوق الوارد.");
  return payload as InboxPayload;
}

export async function inboxAction(path: string, init: RequestInit = {}) {
  const response = await fetch(path, { credentials: "include", ...init, headers: { "Content-Type": "application/json", ...(init.headers ?? {}) } });
  const payload = await response.json().catch(() => null) as { error?: string } | InboxMessage | { mode?: "AI" | "Human" } | null;
  if (!response.ok) throw new Error(payload && "error" in payload && typeof payload.error === "string" ? payload.error : "تعذر تنفيذ العملية.");
  return payload;
}
