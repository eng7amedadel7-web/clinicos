import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getConversationOperations,
  getInboxPayload,
  getSavedReplies,
  inboxAction,
  type InboxMessage,
} from "@/lib/inbox-api";
import { usePreferences } from "@/lib/preferences";
import { useRealtimeStatus, useRealtimeSubscription } from "@/lib/realtime";
import { InboxSidebar } from "@/components/inbox/inbox-sidebar";
import { ChatWindow } from "@/components/inbox/chat-window";
import { PatientSheet } from "@/components/inbox/patient-sheet";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WorkflowBuilderModal } from "@/components/workflow-builder-modal";

function useInboxLiveUpdates(selectedId: string | null) {
  const queryClient = useQueryClient();

  useRealtimeSubscription((event) => {
    if (event.type.startsWith("inbox.") || event.type === "invalidate") {
      void queryClient.invalidateQueries({ queryKey: ["inbox"] });
      if (selectedId) {
        void queryClient.invalidateQueries({ queryKey: ["inbox-operations", selectedId] });
      }
    }
  });

  return true;
}
export default function InboxPage() {
  const queryClient = useQueryClient();
  const { language } = usePreferences();
  const en = language === "en";

  // Navigation & Selection state
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get("conversationId")
  );
  const [search, setSearch] = useState("");
  const [channelType, setChannelType] = useState<string>("all");
  const [channelId, setChannelId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "needs-staff" | "ai" | "snoozed">("all");
  const [patientSheetOpen, setPatientSheetOpen] = useState(false);

  // Optimistic Messages State
  const [optimisticMessages, setOptimisticMessages] = useState<InboxMessage[]>([]);

  // Dialog States
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [snoozeDialogOpen, setSnoozeDialogOpen] = useState(false);
  const [snoozeDuration, setSnoozeDuration] = useState<"1h" | "4h" | "24h" | "48h">("24h");
  const [snoozeReason, setSnoozeReason] = useState("");
  const [outcomeDialogOpen, setOutcomeDialogOpen] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState("حجز موعد بنجاح");
  const [outcomeNote, setOutcomeNote] = useState("");
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);

  const realtimeStatus = useRealtimeStatus();

  // Queries
  const inboxQuery = useQuery({
    queryKey: ["inbox", selectedId],
    queryFn: ({ signal }) => getInboxPayload(selectedId, signal),
    staleTime: Infinity,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  const savedRepliesQuery = useQuery({
    queryKey: ["inbox-saved-replies", en ? "en" : "ar"],
    queryFn: ({ signal }) => getSavedReplies(en ? "en" : "ar", signal),
    staleTime: 10 * 60_000,
  });

  const operationsQuery = useQuery({
    queryKey: ["inbox-operations", selectedId],
    queryFn: ({ signal }) => (selectedId ? getConversationOperations(selectedId, signal) : Promise.resolve([])),
    enabled: Boolean(selectedId),
    staleTime: 30_000,
  });

  // Mutations with Optimistic Updates
  const modeMutation = useMutation({
    mutationFn: ({ id, mode }: { id: string; mode: "AI" | "Human" }) =>
      inboxAction(`/api/inbox/${encodeURIComponent(id)}/mode`, { method: "PATCH", body: JSON.stringify({ mode }) }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      toast.success(
        variables.mode === "AI"
          ? en ? "AI Assistant mode activated" : "تم تفعيل وضع المساعد الذكي"
          : en ? "Switched to Human Staff mode" : "تم التحويل إلى وضع الموظف البشري"
      );
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : en ? "Failed to change mode" : "تعذر تغيير وضع المحادثة");
    },
  });

  const sendMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      inboxAction(`/api/inbox/${encodeURIComponent(id)}/messages`, { method: "POST", body: JSON.stringify({ content }) }),
    onMutate: async ({ content }) => {
      // Optimistic append
      const optMsg: InboxMessage = {
        id: `optimistic-${Date.now()}`,
        content,
        direction: "outgoing",
        sender_type: "staff",
        created_at: new Date().toISOString(),
        message_status: "sending",
      };
      setOptimisticMessages((prev) => [...prev, optMsg]);
      return { optMsg };
    },
    onSuccess: (data, variables, context) => {
      const persisted = data && typeof data === "object" && "id" in data ? data as InboxMessage : null;
      if (persisted?.id) {
        queryClient.setQueryData<{ messages: InboxMessage[] }>(["inbox", variables.id], (current) => {
          if (!current || current.messages.some((message) => message.id === persisted.id)) return current;
          return {
            ...current,
            messages: [...current.messages, { ...persisted, conversation_id: persisted.conversation_id ?? variables.id }],
          };
        });
      }
      setOptimisticMessages((prev) => prev.filter((message) => message.id !== context?.optMsg.id));
      void queryClient.invalidateQueries({ queryKey: ["inbox", variables.id] });
      void queryClient.invalidateQueries({ queryKey: ["inbox-operations", variables.id] });
    },
    onError: (err, variables, context) => {
      setOptimisticMessages((prev) => prev.map((message) => (
        message.id === context?.optMsg.id ? { ...message, message_status: "failed" } : message
      )));
      void queryClient.invalidateQueries({ queryKey: ["inbox", variables.id] });
      toast.error(err instanceof Error ? err.message : en ? "Failed to send message" : "تعذر إرسال الرسالة");
    },
  });

  const operationMutation = useMutation({
    mutationFn: ({ id, action, body }: { id: string; action: "note" | "snooze" | "unsnooze" | "outcome"; body: Record<string, unknown> }) =>
      inboxAction(`/api/inbox/${encodeURIComponent(id)}/${action}`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inbox", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["inbox-operations", selectedId] });
      if (variables.action === "note") toast.success(en ? "Internal note saved" : "تم حفظ الملاحظة الداخلية");
      if (variables.action === "snooze") toast.success(en ? "Conversation snoozed" : "تم تأجيل المحادثة");
      if (variables.action === "outcome") toast.success(en ? "Outcome recorded" : "تم تسجيل نتيجة المحادثة");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : en ? "Operation failed" : "تعذر تنفيذ الإجراء");
    },
  });

  const data = inboxQuery.data;

  // Auto select first conversation if available on desktop
  useEffect(() => {
    if (!selectedId && data?.selectedConversationId) {
      setSelectedId(data.selectedConversationId);
    }
  }, [data?.selectedConversationId, selectedId]);

  // Filtered Conversations
  const visibleConversations = useMemo(() => {
    if (!data?.conversations) return [];
    return data.conversations.filter((item) => {
      const matchesChannel = channelId
        ? item.channelId === channelId
        : channelType === "all" || item.channelType === channelType;

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "needs-staff"
          ? item.needsStaff
          : statusFilter === "ai"
          ? item.mode === "AI"
          : statusFilter === "snoozed"
          ? item.status === "snoozed"
          : true;

      const needle = search.trim().toLowerCase();
      const matchesSearch =
        !needle ||
        `${item.name} ${item.channel} ${item.lastMessage ?? ""} ${item.phone ?? ""}`.toLowerCase().includes(needle);

      return matchesChannel && matchesStatus && matchesSearch;
    });
  }, [data?.conversations, channelId, channelType, statusFilter, search]);

  const selected = data?.conversations.find((item) => item.id === selectedId) ?? null;
  const selectedChannelOnline = selected?.channelStatus === "connected";

  function handleSelectConversation(id: string) {
    setSelectedId(id);
    window.history.replaceState({}, "", `/inbox?conversationId=${encodeURIComponent(id)}`);
  }

  async function handleSendMessage(content: string): Promise<boolean> {
    if (!selected || !content || sendMutation.isPending || !selectedChannelOnline) return false;
    try {
      await sendMutation.mutateAsync({ id: selected.id, content });
      return true;
    } catch {
      return false;
    }
  }

  function handleSaveNote() {
    if (!selected || !noteContent.trim()) return;
    operationMutation.mutate(
      { id: selected.id, action: "note", body: { content: noteContent.trim() } },
      {
        onSuccess: () => {
          setNoteContent("");
          setNoteDialogOpen(false);
        },
      }
    );
  }

  function handleSnooze() {
    if (!selected) return;
    const hoursMap = { "1h": 1, "4h": 4, "24h": 24, "48h": 48 };
    const hours = hoursMap[snoozeDuration] || 24;
    const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    operationMutation.mutate(
      {
        id: selected.id,
        action: "snooze",
        body: { until, reason: snoozeReason.trim() || (en ? `Snoozed for ${hours}h` : `تأجيل لمدة ${hours} ساعة`) },
      },
      {
        onSuccess: () => {
          setSnoozeReason("");
          setSnoozeDialogOpen(false);
        },
      }
    );
  }

  function handleRecordOutcome() {
    if (!selected || !selectedOutcome.trim()) return;
    operationMutation.mutate(
      {
        id: selected.id,
        action: "outcome",
        body: { outcome: selectedOutcome.trim(), note: outcomeNote.trim() || null },
      },
      {
        onSuccess: () => {
          setOutcomeNote("");
          setOutcomeDialogOpen(false);
        },
      }
    );
  }

  const savedReplies = savedRepliesQuery.data ?? [];

  return (
    <div className="flex h-full w-full flex-1 overflow-hidden" dir="rtl">
      <div className="flex flex-1 min-h-0 overflow-hidden border border-border/80 bg-card rounded-xl shadow-xs">
        {/* SIDEBAR: Hidden on mobile when a chat is open */}
        <div
          className={`h-full shrink-0 border-l border-border transition-all md:flex md:w-72 lg:w-80 ${
            selectedId ? "hidden md:flex" : "flex w-full"
          }`}
        >
          <InboxSidebar
            conversations={visibleConversations}
            totalCount={data?.conversations.length ?? 0}
            selectedId={selectedId}
            onSelectConversation={handleSelectConversation}
            search={search}
            onSearchChange={setSearch}
            channelType={channelType}
            onChannelTypeChange={setChannelType}
            channelId={channelId}
            onChannelIdChange={setChannelId}
            channelsList={data?.channels ?? []}
            channelCounts={data?.channelCounts}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            realtimeStatus={realtimeStatus}
            onRefresh={() => inboxQuery.refetch()}
            isRefreshing={inboxQuery.isFetching}
            en={en}
          />
        </div>

        {/* CHAT WINDOW: Hidden on mobile when no chat is open */}
        <div
          className={`flex flex-1 min-w-0 h-full flex-col ${
            !selectedId ? "hidden md:flex" : "flex"
          }`}
        >
          <ChatWindow
            conversation={selected}
            messages={data?.messages ?? []}
            optimisticMessages={optimisticMessages}
            onBackMobile={() => setSelectedId(null)}
            onSendMessage={handleSendMessage}
            isSending={sendMutation.isPending}
            channelOnline={selectedChannelOnline}
            onToggleMode={(mode) => selected && modeMutation.mutate({ id: selected.id, mode })}
            isTogglingMode={modeMutation.isPending}
            savedReplies={savedReplies}
            patientSheetOpen={patientSheetOpen}
            onTogglePatientSheet={() => setPatientSheetOpen((v) => !v)}
            en={en}
          />
        </div>

        {/* PATIENT PROFILE DRAWER */}
        <PatientSheet
          isOpen={patientSheetOpen}
          onClose={() => setPatientSheetOpen(false)}
          conversation={selected}
          operations={operationsQuery.data ?? []}
          onOpenNoteDialog={() => setNoteDialogOpen(true)}
          onOpenSnoozeDialog={() => setSnoozeDialogOpen(true)}
          onOpenOutcomeDialog={() => setOutcomeDialogOpen(true)}
          en={en}
        />
      </div>

      {/* Internal Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{en ? "Add Internal Staff Note" : "إضافة ملاحظة داخلية للموظفين"}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={en ? "Write a private note visible only to clinic staff..." : "اكتب ملاحظة خاصة يراها فريق العيادة فقط..."}
              rows={3}
              className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button className="quiet-button">{en ? "Cancel" : "إلغاء"}</button>
            </DialogClose>
            <button
              onClick={handleSaveNote}
              disabled={!noteContent.trim() || operationMutation.isPending}
              className="primary-button"
            >
              {en ? "Save Note" : "حفظ الملاحظة"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Snooze Dialog */}
      <Dialog open={snoozeDialogOpen} onOpenChange={setSnoozeDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{en ? "Snooze Conversation" : "تأجيل المحادثة مؤقتاً"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-bold text-foreground mb-1 block">{en ? "Duration" : "مدة التأجيل"}</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(["1h", "4h", "24h", "48h"] as const).map((dur) => (
                  <button
                    key={dur}
                    onClick={() => setSnoozeDuration(dur)}
                    className={`rounded-lg border py-1.5 font-bold transition ${
                      snoozeDuration === dur ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-bold text-foreground mb-1 block">{en ? "Reason (optional)" : "سبب التأجيل (اختياري)"}</label>
              <input
                type="text"
                value={snoozeReason}
                onChange={(e) => setSnoozeReason(e.target.value)}
                placeholder={en ? "e.g. Waiting for lab results" : "مثال: بانتظار صدور نتيجة التحليل"}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button className="quiet-button">{en ? "Cancel" : "إلغاء"}</button>
            </DialogClose>
            <button onClick={handleSnooze} disabled={operationMutation.isPending} className="primary-button">
              {en ? "Snooze" : "تأجيل الآن"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Outcome Dialog */}
      <Dialog open={outcomeDialogOpen} onOpenChange={setOutcomeDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{en ? "Record Conversation Outcome" : "تسجيل نتيجة المحادثة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-bold text-foreground mb-1 block">{en ? "Outcome" : "النتيجة"}</label>
              <select
                value={selectedOutcome}
                onChange={(e) => setSelectedOutcome(e.target.value)}
                className="w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="حجز موعد بنجاح">{en ? "Appointment Booked Successfully" : "حجز موعد بنجاح"}</option>
                <option value="استفسار عام مكتمل">{en ? "General Inquiry Resolved" : "استفسار عام مكتمل"}</option>
                <option value="متابعة مطلوبة لاحقاً">{en ? "Follow-up Needed Later" : "متابعة مطلوبة لاحقاً"}</option>
                <option value="غير مهتم">{en ? "Not Interested" : "غير مهتم"}</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-foreground mb-1 block">{en ? "Note (optional)" : "ملاحظة إضافية"}</label>
              <input
                type="text"
                value={outcomeNote}
                onChange={(e) => setOutcomeNote(e.target.value)}
                placeholder={en ? "Additional details..." : "تفاصيل إضافية..."}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button className="quiet-button">{en ? "Cancel" : "إلغاء"}</button>
            </DialogClose>
            <button onClick={handleRecordOutcome} disabled={operationMutation.isPending} className="primary-button">
              {en ? "Save Outcome" : "تسجيل النتيجة"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Automated Follow-Up Workflow Triggers Modal */}
      <WorkflowBuilderModal isOpen={workflowModalOpen} onClose={() => setWorkflowModalOpen(false)} />
    </div>
  );
}

