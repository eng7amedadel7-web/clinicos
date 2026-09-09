import type { InboxMessageState as InboxMessage } from "@workspace/api-client-react";

// Inbox reads are contract-driven: fetchers and types come from the OpenAPI
// codegen. The aliases keep the names the inbox components already import.
// inboxAction (note/snooze/unsnooze/outcome/mode/messages POSTs) is not in
// the spec yet and stays hand-written until it is.
export {
  getConversationOperations,
  getInboxPayload,
  listSavedReplies as getSavedReplies,
} from "@workspace/api-client-react";
export type {
  ConversationOperation,
  InboxChannelState as InboxChannel,
  InboxConversationState as InboxConversation,
  InboxMessageState as InboxMessage,
  InboxPayload,
  SavedReply,
} from "@workspace/api-client-react";

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

