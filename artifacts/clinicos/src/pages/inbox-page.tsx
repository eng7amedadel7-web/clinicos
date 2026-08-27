import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bot,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  Filter,
  Info,
  Layers,
  MessageCircle,
  MessageSquare,
  MessageSquareShare,
  MessagesSquare,
  PanelRightClose,
  PanelRightOpen,
  Phone,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Tag,
  ToggleLeft,
  ToggleRight,
  Trash2,
  User,
  UserCheck,
  UserRound,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  getConversationOperations,
  getInboxPayload,
  getSavedReplies,
  inboxAction,
  type ConversationOperation,
  type InboxChannel,
  type InboxConversation,
  type InboxMessage,
  type SavedReply,
} from "@/lib/inbox-api";
import { usePreferences } from "@/lib/preferences";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Brand SVG Icons
function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.07c-.24.68-1.39 1.3-1.92 1.38-.5.08-1.14.11-3.69-.95-2.99-1.24-4.9-4.29-5.05-4.49-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.79-.37.2 0 .39.003.56.01.18.01.42-.07.66.5.25.6.84 2.06.91 2.21.08.15.13.33.02.53-.1.2-.15.32-.3.5-.15.18-.31.39-.45.52-.15.15-.31.31-.13.61.18.3 1.13 1.86 2.43 3.01 1.67 1.48 3.08 1.94 3.51 2.16.43.21.68.18.93-.11.25-.28 1.07-1.25 1.36-1.68.29-.43.58-.36.97-.21.39.15 2.47 1.16 2.89 1.37.42.21.7.32.81.49.09.21.09 1.2-.15 1.88z" />
    </svg>
  );
}

function InstagramIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function MessengerIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.518 3.735 7.207v3.535l3.39-1.86c.928.257 1.91.396 2.925.396 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.066 12.438l-2.684-2.863-5.238 2.863 5.762-6.115 2.754 2.863 5.168-2.863-5.762 6.115z" />
    </svg>
  );
}

function TelegramIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
    </svg>
  );
}

function StatusPill({ children, tone = "teal" }: { children: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    teal: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    amber: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
    blue: "bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60",
    purple: "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60",
    gray: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tones[tone] ?? tones.blue}`}>
      {children}
    </span>
  );
}

function formatRelativeTime(dateString: string | null | undefined, en: boolean) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return en ? "Just now" : "الآن";
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return en ? `${mins}m ago` : `منذ ${mins} د`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return en ? `${hours}h ago` : `منذ ${hours} س`;
  }
  if (diffInSeconds < 172800) {
    return en ? "Yesterday" : "أمس";
  }
  return date.toLocaleDateString(en ? "en-US" : "ar-EG", { month: "short", day: "numeric" });
}

function formatMessageTime(dateString: string | null | undefined, en: boolean) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(en ? "en-US" : "ar-EG", { hour: "numeric", minute: "2-digit", hour12: true });
}

function useInboxLiveUpdates(selectedId: string | null) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") return;
    const query = selectedId ? `?conversationId=${encodeURIComponent(selectedId)}` : "";
    const source = new EventSource(`/api/inbox/stream${query}`, { withCredentials: true });
    source.onopen = () => setConnected(true);

    const handleInvalidate = () => {
      setConnected(true);
      void queryClient.invalidateQueries({ queryKey: ["inbox"] });
      if (selectedId) {
        void queryClient.invalidateQueries({ queryKey: ["inbox-operations", selectedId] });
      }
    };

    source.addEventListener("invalidate", handleInvalidate);
    source.addEventListener("inbox.message_received", handleInvalidate);
    source.addEventListener("inbox.message_sent", handleInvalidate);
    source.addEventListener("inbox.handoff_requested", handleInvalidate);
    source.addEventListener("inbox.mode_changed", handleInvalidate);
    source.addEventListener("heartbeat", () => setConnected(true));
    source.onerror = () => setConnected(false);

    return () => {
      setConnected(false);
      source.close();
    };
  }, [queryClient, selectedId]);

  return connected;
}

// Built-in clinic quick replies fallback
const DEFAULT_PRESET_REPLIES = [
  {
    id: "hours-location",
    title: "ساعات العمل والموقع",
    content: "أهلاً بك! نسعد بخدمتك في عيادة MERUNA. مواعيد العمل من السبت إلى الخميس: 10:00 ص - 9:00 م. الموقع: الفرع الرئيسي، برج الأطباء، الدور الرابع.",
  },
  {
    id: "booking-confirm",
    title: "تأكيد موعد كشف",
    content: "تم تسجيل رغبتك في حجز موعد. يرجى تزويدنا بالاسم الثلاثي ورقم الهاتف والموعد المفضل للتأكيد فوراً.",
  },
  {
    id: "price-list",
    title: "الاستفسار عن الأسعار",
    content: "سعر الكشف الأولي هو 250 ر.س شامل الفحص السريري والاستشارة الطبية، وتوجد باقات متابعة دورية مخفضة.",
  },
  {
    id: "fasting-instructions",
    title: "تعليمات ما قبل التحاليل",
    content: "نرجو الصيام لمدة 8 إلى 12 ساعة قبل موعد الفحص المخبري مع شرب الماء فقط عند الحاجة.",
  },
  {
    id: "doctor-busy",
    title: "تحويل للطبيب المختص",
    content: "تم تحويل استفسارك إلى الطبيب المختص وسيتم الرد عليك في أقرب وقت ممكن خلال ساعات العمل.",
  },
];

export default function InboxPage() {
  const queryClient = useQueryClient();
  const { language } = usePreferences();
  const en = language === "en";

  // Navigation & Selection state
  const [selectedId, setSelectedId] = useState<string | null>(() => new URLSearchParams(window.location.search).get("conversationId"));
  const [search, setSearch] = useState("");
  const [channelType, setChannelType] = useState<string>("all");
  const [channelId, setChannelId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "needs-staff" | "ai" | "snoozed">("all");
  const [replyText, setReplyText] = useState("");
  const [showPatientPanel, setShowPatientPanel] = useState(true);
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  // Dialog States
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [snoozeDialogOpen, setSnoozeDialogOpen] = useState(false);
  const [snoozeDuration, setSnoozeDuration] = useState<"1h" | "4h" | "24h" | "48h">("24h");
  const [snoozeReason, setSnoozeReason] = useState("");
  const [outcomeDialogOpen, setOutcomeDialogOpen] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState("حجز موعد بنجاح");
  const [outcomeNote, setOutcomeNote] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamConnected = useInboxLiveUpdates(selectedId);

  // Queries
  const inboxQuery = useQuery({
    queryKey: ["inbox", selectedId],
    queryFn: ({ signal }) => getInboxPayload(selectedId, signal),
    staleTime: 15_000,
    refetchInterval: streamConnected ? 5 * 60_000 : 25_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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

  // Mutations
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
    onSuccess: () => {
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["inbox", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["inbox-operations", selectedId] });
      setTimeout(() => scrollToBottom(), 100);
    },
    onError: (err) => {
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

  // Auto select first conversation if needed or synchronize with URL
  useEffect(() => {
    if (!selectedId && data?.selectedConversationId) {
      setSelectedId(data.selectedConversationId);
    }
  }, [data?.selectedConversationId, selectedId]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [data?.messages, selectedId]);

  // Channels List Definition
  const channels = useMemo(() => {
    return [
      {
        key: "all",
        label: en ? "All Channels" : "كل القنوات",
        icon: <Layers className="size-4" />,
        color: "text-slate-600 dark:text-slate-300",
        activeBg: "bg-primary text-primary-foreground",
      },
      {
        key: "whatsapp",
        label: en ? "WhatsApp" : "واتساب",
        icon: <WhatsAppIcon className="size-4" />,
        color: "text-emerald-600 dark:text-emerald-400",
        activeBg: "bg-emerald-600 text-white shadow-emerald-600/30",
      },
      {
        key: "instagram",
        label: en ? "Instagram" : "إنستغرام",
        icon: <InstagramIcon className="size-4" />,
        color: "text-pink-600 dark:text-pink-400",
        activeBg: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white",
      },
      {
        key: "messenger",
        label: en ? "Messenger" : "ماسنجر",
        icon: <MessengerIcon className="size-4" />,
        color: "text-sky-600 dark:text-sky-400",
        activeBg: "bg-sky-600 text-white shadow-sky-600/30",
      },
      {
        key: "telegram",
        label: en ? "Telegram" : "تليجرام",
        icon: <TelegramIcon className="size-4" />,
        color: "text-cyan-600 dark:text-cyan-400",
        activeBg: "bg-cyan-600 text-white shadow-cyan-600/30",
      },
    ];
  }, [en]);

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

  // If active filter makes currently selected conversation hidden, switch selection gracefully
  useEffect(() => {
    if (visibleConversations.length > 0) {
      if (!selectedId || !visibleConversations.some((c) => c.id === selectedId)) {
        selectConversation(visibleConversations[0].id);
      }
    }
  }, [visibleConversations, selectedId]);

  function selectConversation(id: string) {
    setSelectedId(id);
    window.history.replaceState({}, "", `/inbox?conversationId=${encodeURIComponent(id)}`);
  }

  function handleSendMessage() {
    const content = replyText.trim();
    if (!selected || !content || sendMutation.isPending) return;
    sendMutation.mutate({ id: selected.id, content });
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

  const getChannelIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "whatsapp":
        return <WhatsAppIcon className="size-3.5 text-emerald-600" />;
      case "instagram":
        return <InstagramIcon className="size-3.5 text-pink-600" />;
      case "messenger":
        return <MessengerIcon className="size-3.5 text-sky-600" />;
      case "telegram":
        return <TelegramIcon className="size-3.5 text-cyan-600" />;
      default:
        return <MessageSquare className="size-3.5 text-slate-500" />;
    }
  };

  const savedReplies = (savedRepliesQuery.data && savedRepliesQuery.data.length > 0)
    ? savedRepliesQuery.data
    : DEFAULT_PRESET_REPLIES;

  return (
    <TooltipProvider delayDuration={200}>
      <section className="flex h-[calc(100vh-5.2rem)] w-full flex-col overflow-hidden" dir="rtl">
        {/* Page Top Header */}
        <div className="mb-3 flex shrink-0 items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <MessagesSquare className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-foreground md:text-2xl">
                  {en ? "Unified Inbox" : "صندوق الوارد الموحد"}
                </h1>
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                  {data?.conversations?.length ?? 0} {en ? "conversations" : "محادثة"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {en
                  ? "Manage multi-channel patient communications, automated AI replies, and staff handoffs."
                  : "إدارة محادثات المرضى عبر القنوات المختلفة، والرد الآلي الذكي، وتحويلات الفريق الطبي."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live SSE Status Badge */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-xs transition ${
                    inboxQuery.isFetching
                      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
                      : streamConnected
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  <span
                    className={`size-2 rounded-full ${
                      inboxQuery.isFetching
                        ? "bg-amber-500 animate-spin"
                        : streamConnected
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-slate-400"
                    }`}
                  />
                  <span>
                    {inboxQuery.isFetching
                      ? en ? "Syncing..." : "جارٍ المزامنة..."
                      : streamConnected
                      ? en ? "Live Connected" : "متصل لحظياً"
                      : en ? "Offline" : "تحديث دوري"}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {streamConnected
                  ? en ? "Real-time updates active via server-sent events." : "التحديث اللحظي مفعل عبر بث الخادم المباشر."
                  : en ? "Connecting to real-time events stream..." : "الاتصال جارٍ بمحرك التحديثات اللحظية..."}
              </TooltipContent>
            </Tooltip>

            <button
              onClick={() => inboxQuery.refetch()}
              disabled={inboxQuery.isFetching}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs transition hover:bg-muted active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${inboxQuery.isFetching ? "animate-spin" : ""}`} />
              <span>{en ? "Refresh" : "تحديث"}</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {inboxQuery.isLoading ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-border bg-card">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary animate-pulse">
                <MessagesSquare className="size-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">{en ? "Loading conversations..." : "جارٍ تحميل محادثات العيادة..."}</p>
              <p className="text-xs text-muted-foreground">{en ? "Connecting channels and active sessions" : "جاري ربط القنوات وجلسات المرضى"}</p>
            </div>
          </div>
        ) : null}

        {/* Error State */}
        {inboxQuery.isError ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <AlertTriangle className="mb-3 size-10 text-destructive" />
            <h3 className="text-base font-bold text-foreground">{en ? "Could not load inbox" : "تعذر تحميل صندوق الوارد"}</h3>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              {inboxQuery.error instanceof Error ? inboxQuery.error.message : en ? "A temporary network error occurred." : "حدث خطأ مؤقت في الاتصال."}
            </p>
            <button
              onClick={() => inboxQuery.refetch()}
              className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md transition hover:bg-primary/90"
            >
              <RefreshCw className="size-3.5" />
              <span>{en ? "Retry Loading" : "إعادة المحاولة"}</span>
            </button>
          </div>
        ) : null}

        {/* Main Inbox 3-Column Studio */}
        {data && !inboxQuery.isError ? (
          <div className="flex flex-1 min-h-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {/* COLUMN 1: Channels Rail (Far Right in RTL) */}
            <aside className="flex w-16 shrink-0 flex-col items-center border-l border-border bg-muted/30 py-3">
              <span className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">
                {en ? "Channels" : "القنوات"}
              </span>

              <div className="flex flex-1 flex-col gap-2">
                {channels.map((channel) => {
                  const isActive = channelType === channel.key;
                  const count =
                    channel.key === "all"
                      ? data.conversations.length
                      : data.conversations.filter((c) => c.channelType === channel.key).length;

                  return (
                    <Tooltip key={channel.key}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            setChannelType(channel.key);
                            setChannelId(null);
                          }}
                          className={`relative flex size-11 flex-col items-center justify-center rounded-xl transition ${
                            isActive
                              ? `${channel.activeBg} shadow-md scale-105`
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {channel.icon}
                          {count > 0 ? (
                            <span
                              className={`absolute -top-1 -left-1 flex size-4.5 items-center justify-center rounded-full text-[9px] font-black ${
                                isActive
                                  ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-white"
                                  : "bg-primary text-primary-foreground"
                              }`}
                            >
                              {count}
                            </span>
                          ) : null}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span>{channel.label}</span>
                          <span className="opacity-70">({count})</span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              {/* Bot Info pill */}
              <div className="mt-auto flex flex-col items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="grid size-9 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Sparkles className="size-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p className="text-xs font-bold">{en ? "AI Auto-reply is Active" : "الرد الذكي مفعل تلقائياً"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </aside>

            {/* COLUMN 2: Conversations List & Search & Status Filter */}
            <div className="flex w-80 shrink-0 flex-col border-l border-border bg-card md:w-88">
              {/* Search & Channel accounts header */}
              <div className="border-b border-border p-3 space-y-2.5">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={en ? "Search by patient name, phone, message..." : "ابحث بالاسم، الهاتف، أو نص الرسالة..."}
                    className="w-full rounded-xl border border-input bg-muted/40 py-2 pr-8 pl-8 text-xs placeholder:text-muted-foreground/70 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {search ? (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  ) : null}
                </div>

                {/* Sub-accounts filter for channel if applicable */}
                {channelType !== "all" ? (
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      onClick={() => setChannelId(null)}
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                        channelId === null
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "border border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {en ? "All Accounts" : "جميع الحسابات"}
                    </button>
                    {data.channels
                      .filter((ch) => ch.type === channelType)
                      .map((ch) => {
                        const isSelected = channelId === ch.id;
                        return (
                          <button
                            key={ch.id}
                            onClick={() => setChannelId(ch.id)}
                            className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold transition ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-muted/20 text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                ch.status === "connected" || ch.isEnabled ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                            />
                            <span className="truncate max-w-[110px]">{ch.displayName || ch.type}</span>
                          </button>
                        );
                      })}
                  </div>
                ) : null}

                {/* Filter Tabs */}
                <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted/50 p-1 text-[10px] font-bold text-muted-foreground">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`rounded-lg py-1.5 transition ${
                      statusFilter === "all" ? "bg-card text-foreground shadow-xs" : "hover:text-foreground"
                    }`}
                  >
                    {en ? "All" : "الكل"}
                  </button>
                  <button
                    onClick={() => setStatusFilter("needs-staff")}
                    className={`rounded-lg py-1.5 transition ${
                      statusFilter === "needs-staff" ? "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 shadow-xs" : "hover:text-foreground"
                    }`}
                  >
                    {en ? "Needs Staff" : "تتطلب موظف"}
                  </button>
                  <button
                    onClick={() => setStatusFilter("ai")}
                    className={`rounded-lg py-1.5 transition ${
                      statusFilter === "ai" ? "bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 shadow-xs" : "hover:text-foreground"
                    }`}
                  >
                    {en ? "AI Bot" : "مساعد ذكي"}
                  </button>
                  <button
                    onClick={() => setStatusFilter("snoozed")}
                    className={`rounded-lg py-1.5 transition ${
                      statusFilter === "snoozed" ? "bg-card text-foreground shadow-xs" : "hover:text-foreground"
                    }`}
                  >
                    {en ? "Snoozed" : "مؤجلة"}
                  </button>
                </div>
              </div>

              {/* Conversations List Scroll Area */}
              <div className="flex-1 overflow-y-auto divide-y divide-border/50">
                {visibleConversations.map((item) => {
                  const isSelected = selectedId === item.id;
                  const initials = (item.name || "م").trim().slice(0, 2);

                  return (
                    <button
                      key={item.id}
                      onClick={() => selectConversation(item.id)}
                      className={`group relative flex w-full gap-3 p-3.5 text-right transition hover:bg-muted/50 ${
                        isSelected
                          ? "bg-primary/6 border-r-3 border-primary dark:bg-primary/10"
                          : ""
                      }`}
                    >
                      {/* Avatar with Channel Badge */}
                      <div className="relative shrink-0">
                        <div className="grid size-10.5 place-items-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 font-bold text-slate-700 shadow-xs dark:from-slate-800 dark:to-slate-900 dark:text-slate-200">
                          <span className="text-xs">{initials}</span>
                        </div>
                        <span className="absolute -bottom-1 -left-1 grid size-5 place-items-center rounded-full border-2 border-card bg-card shadow-xs">
                          {getChannelIcon(item.channelType)}
                        </span>
                      </div>

                      {/* Info & Last message */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <strong className="truncate text-xs font-bold text-foreground">
                            {item.name}
                          </strong>
                          <span className="shrink-0 text-[10px] text-muted-foreground/80 font-medium">
                            {formatRelativeTime(item.lastActivityAt, en)}
                          </span>
                        </div>

                        <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground leading-snug">
                          {item.lastMessage || (en ? "No message content" : "بدون نص")}
                        </p>

                        {/* Status Pills */}
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          {item.needsStaff ? (
                            <StatusPill tone="amber">
                              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                              {en ? "Needs Staff" : "تحتاج موظفاً"}
                            </StatusPill>
                          ) : item.mode === "AI" ? (
                            <StatusPill tone="purple">
                              <Bot className="size-2.5" />
                              {en ? "AI Bot" : "مساعد ذكي"}
                            </StatusPill>
                          ) : (
                            <StatusPill tone="blue">
                              <UserRound className="size-2.5" />
                              {en ? "Staff Handled" : "بواسطة موظف"}
                            </StatusPill>
                          )}

                          {item.status === "snoozed" ? (
                            <StatusPill tone="gray">
                              <Clock className="size-2.5" />
                              {en ? "Snoozed" : "مؤجلة"}
                            </StatusPill>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {visibleConversations.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center p-6 text-center text-muted-foreground">
                    <MessageSquare className="mb-2 size-8 stroke-1 text-muted-foreground/40" />
                    <p className="text-xs font-bold text-foreground">{en ? "No conversations found" : "لا توجد محادثات مطابقة"}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground/80">
                      {search
                        ? en ? "Try adjusting your search terms" : "جرب تغيير مصطلح البحث"
                        : en ? "No messages in this filter" : "لا توجد رسائل مسجلة في هذا القسم"}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* COLUMN 3: Active Conversation Studio & Messages */}
            {selected ? (
              <div className="flex flex-1 min-w-0 flex-col bg-background">
                {/* Chat Top Bar */}
                <div className="flex shrink-0 items-center justify-between border-b border-border bg-card/80 px-5 py-3 backdrop-blur-sm">
                  {/* Patient Info Header */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary font-bold text-xs">
                        {selected.name.slice(0, 2)}
                      </div>
                      <span className="absolute -bottom-1 -left-1 grid size-4.5 place-items-center rounded-full border-2 border-card bg-card shadow-xs">
                        {getChannelIcon(selected.channelType)}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-foreground">{selected.name}</strong>
                        {selected.needsStaff ? (
                          <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                            {en ? "Needs Human Action" : "طلب تدخل بشري"}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="capitalize">{selected.channelType}</span>
                        <span>•</span>
                        <span className="text-muted-foreground/80 font-medium">
                          {selected.channel || (en ? "Direct Channel" : "قناة مباشرة")}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          {en ? "Online" : "متصل"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & AI/Human Mode Switcher */}
                  <div className="flex items-center gap-2">
                    {/* Interactive AI / Human Mode Switch Button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() =>
                            modeMutation.mutate({
                              id: selected.id,
                              mode: selected.mode === "AI" ? "Human" : "AI",
                            })
                          }
                          disabled={modeMutation.isPending}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                            selected.mode === "AI"
                              ? "border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950/50 dark:text-purple-300"
                              : "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300"
                          }`}
                        >
                          {selected.mode === "AI" ? (
                            <>
                              <Bot className="size-4 text-purple-600 dark:text-purple-400 animate-pulse" />
                              <span>{en ? "AI Auto-Reply" : "المساعد الذكي (نشط)"}</span>
                              <ToggleRight className="size-4 text-purple-600 dark:text-purple-400" />
                            </>
                          ) : (
                            <>
                              <UserRound className="size-4 text-sky-600 dark:text-sky-400" />
                              <span>{en ? "Staff Mode" : "استلام الموظف"}</span>
                              <ToggleLeft className="size-4 text-sky-600 dark:text-sky-400" />
                            </>
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {selected.mode === "AI"
                          ? en ? "Click to switch to human receptionist mode" : "اضغط للتحويل إلى الاستلام اليدوي للموظف"
                          : en ? "Click to enable automated AI responses" : "اضغط لتفعيل المساعد الذكي التلقائي"}
                      </TooltipContent>
                    </Tooltip>

                    {/* Quick Operations Bar */}
                    <button
                      onClick={() => setNoteDialogOpen(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:bg-muted"
                    >
                      <FileText className="size-3.5 text-muted-foreground" />
                      <span className="hidden lg:inline">{en ? "Note" : "ملاحظة"}</span>
                    </button>

                    <button
                      onClick={() => setSnoozeDialogOpen(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:bg-muted"
                    >
                      <Clock3 className="size-3.5 text-muted-foreground" />
                      <span className="hidden lg:inline">{en ? "Snooze" : "تأجيل"}</span>
                    </button>

                    <button
                      onClick={() => setOutcomeDialogOpen(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:bg-muted"
                    >
                      <CheckCircle2 className="size-3.5 text-muted-foreground" />
                      <span className="hidden lg:inline">{en ? "Outcome" : "النتيجة"}</span>
                    </button>

                    {/* Toggle Patient Info Side Panel */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setShowPatientPanel((prev) => !prev)}
                          className={`rounded-xl border border-border p-2 text-foreground shadow-xs transition hover:bg-muted ${
                            showPatientPanel ? "bg-muted text-primary" : "bg-card"
                          }`}
                        >
                          {showPatientPanel ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {showPatientPanel ? (en ? "Hide patient details" : "إخفاء تفاصيل المريض") : (en ? "Show patient details" : "إظهار تفاصيل المريض")}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Chat Middle Area: Messages Stream */}
                <div className="flex flex-1 min-h-0">
                  {/* Messages Feed */}
                  <div className="flex flex-1 flex-col justify-between overflow-hidden bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 md:p-6">
                      {/* Security & Confidentiality Notice */}
                      <div className="mx-auto max-w-md rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-center text-[10px] text-muted-foreground backdrop-blur-xs">
                        🔒 {en ? "Encrypted HIPAA-ready communication log" : "سجل محادثات مشفر ومقيد بضوابط الخصوصية الطبية للعيادة"}
                      </div>

                      {/* Messages rendering */}
                      {data.messages && data.messages.length > 0 ? (
                        data.messages.map((message) => {
                          const isOutgoing = message.direction === "outgoing" || message.sender_type === "staff" || message.sender_type === "ai";
                          const isAI = message.sender_type === "ai" || (!message.sender_type && isOutgoing && selected.mode === "AI");

                          return (
                            <div
                              key={message.id}
                              className={`flex items-end gap-2.5 ${isOutgoing ? "flex-row-reverse justify-start" : "flex-row justify-start"}`}
                            >
                              {/* Message sender avatar */}
                              {!isOutgoing ? (
                                <div className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  {selected.name.slice(0, 1)}
                                </div>
                              ) : (
                                <div
                                  className={`grid size-7 shrink-0 place-items-center rounded-full text-white text-[10px] ${
                                    isAI ? "bg-purple-600 shadow-xs" : "bg-primary shadow-xs"
                                  }`}
                                >
                                  {isAI ? <Bot className="size-3.5" /> : <UserRound className="size-3.5" />}
                                </div>
                              )}

                              {/* Speech Bubble */}
                              <div
                                className={`group relative max-w-[80%] rounded-2xl px-4 py-3 shadow-xs md:max-w-[70%] ${
                                  isOutgoing
                                    ? isAI
                                      ? "rounded-bl-xs bg-gradient-to-br from-purple-700 to-indigo-800 text-white"
                                      : "rounded-bl-xs bg-[#16384c] text-white dark:bg-[#1f4a64]"
                                    : "rounded-br-xs border border-border/80 bg-card text-foreground dark:bg-card"
                                }`}
                              >
                                {/* Header tag for Outgoing AI / Staff */}
                                {isOutgoing ? (
                                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold opacity-80">
                                    {isAI ? (
                                      <>
                                        <Sparkles className="size-3" />
                                        <span>{en ? "AI Smart Assistant" : "المساعد الذكي للعيادة"}</span>
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="size-3" />
                                        <span>{en ? "Clinic Receptionist" : "موظف الاستقبال"}</span>
                                      </>
                                    )}
                                  </div>
                                ) : null}

                                {/* Content */}
                                <p className="text-xs leading-relaxed whitespace-pre-wrap select-text">{message.content}</p>

                                {/* Footer Timestamp & Status */}
                                <div
                                  className={`mt-1.5 flex items-center justify-end gap-1.5 text-[9px] ${
                                    isOutgoing ? "text-white/70" : "text-muted-foreground"
                                  }`}
                                >
                                  <span>{formatMessageTime(message.created_at, en)}</span>
                                  {isOutgoing ? (
                                    <span>
                                      {message.message_status === "delivered" ? (
                                        <CheckCheck className="size-3" />
                                      ) : (
                                        <Check className="size-3" />
                                      )}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex h-56 flex-col items-center justify-center text-center text-muted-foreground">
                          <MessageSquare className="mb-2 size-8 text-muted-foreground/30" />
                          <p className="text-xs font-bold text-foreground">{en ? "No messages in this chat" : "لا توجد رسائل سابقة في هذا السجل"}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {en ? "Start the conversation by sending a reply below." : "يمكنك بدء التواصل عبر كتابة رد بالأسفل."}
                          </p>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Bottom Composer */}
                    <div className="border-t border-border bg-card p-3 md:p-4">
                      {/* Quick Canned Replies Bar */}
                      <div className="mb-2.5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-primary">
                          <Zap className="size-3.5" />
                          <span>{en ? "Quick Replies:" : "ردود سريعة:"}</span>
                        </span>
                        {savedReplies.slice(0, 4).map((reply) => {
                          const replyTextValue = "body_template" in reply ? reply.body_template : reply.content;
                          const replyTitle = "template_key" in reply ? reply.template_key : reply.title;
                          return (
                            <button
                              key={reply.id}
                              onClick={() => setReplyText(replyTextValue)}
                              className="shrink-0 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-[10px] font-semibold text-foreground transition hover:border-primary/40 hover:bg-primary/5 active:scale-95"
                            >
                              {replyTitle}
                            </button>
                          );
                        })}
                      </div>

                      {/* Input Box & Action Buttons */}
                      <div className="flex items-end gap-2">
                        <div className="relative flex-1">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            rows={2}
                            placeholder={
                              en
                                ? "Write your message to the patient (Press Enter to send)..."
                                : "اكتب رسالتك للمريض هنا (اضغط Enter للإرسال، Shift+Enter لسطر جديد)..."
                            }
                            className="w-full resize-none rounded-2xl border border-input bg-muted/30 px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <button
                          onClick={handleSendMessage}
                          disabled={!replyText.trim() || sendMutation.isPending}
                          className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                        >
                          {sendMutation.isPending ? (
                            <RefreshCw className="size-4 animate-spin" />
                          ) : (
                            <Send className="size-4" />
                          )}
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground px-1">
                        <span>
                          {en
                            ? "Messages are dispatched via secured clinic webhooks & logged to patient record."
                            : "يتم توجيه الرسائل عبر مسار الربط المعتمد للعيادة وحفظها مباشرة في سجل المريض."}
                        </span>
                        <span>{replyText.length > 0 ? `${replyText.length} حرف` : ""}</span>
                      </div>
                    </div>
                  </div>

                  {/* COLUMN 4 (Collapsible): Patient Quick 360 Side Panel */}
                  {showPatientPanel ? (
                    <aside className="w-72 shrink-0 border-r border-border bg-card/60 p-4 space-y-4 overflow-y-auto hidden xl:block">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-bold text-foreground">
                          {en ? "Patient Overview" : "بطاقة المريض"}
                        </strong>
                        <Link
                          href={`/patient-360?id=${encodeURIComponent(selected.patient_id || selected.id)}`}
                          className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                        >
                          <span>{en ? "Patient 360" : "الملف الكامل"}</span>
                          <ExternalLink className="size-3" />
                        </Link>
                      </div>

                      {/* Patient Avatar Card */}
                      <div className="rounded-2xl border border-border bg-card p-3.5 text-center shadow-xs">
                        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-lg font-black text-primary">
                          {selected.name.slice(0, 2)}
                        </div>
                        <h4 className="mt-2 text-xs font-bold text-foreground">{selected.name}</h4>
                        <p className="text-[10px] text-muted-foreground">
                          {selected.phone || (en ? "No phone recorded" : "رقم الهاتف غير مسجل")}
                        </p>

                        <div className="mt-3 flex items-center justify-center gap-2">
                          {selected.phone ? (
                            <a
                              href={`tel:${selected.phone}`}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/40 py-1.5 text-[10px] font-bold text-foreground transition hover:bg-muted"
                            >
                              <Phone className="size-3" />
                              <span>{en ? "Call" : "اتصال"}</span>
                            </a>
                          ) : null}

                          <Link
                            href={`/patient-360?id=${encodeURIComponent(selected.patient_id || selected.id)}`}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-1.5 text-[10px] font-bold text-primary transition hover:bg-primary/20"
                          >
                            <UserRound className="size-3" />
                            <span>{en ? "Profile" : "الملف"}</span>
                          </Link>
                        </div>
                      </div>

                      {/* Channel & AI status details */}
                      <div className="space-y-2 rounded-2xl border border-border bg-card p-3.5 text-xs shadow-xs">
                        <strong className="text-[11px] font-bold text-foreground block">
                          {en ? "Channel Settings" : "بيانات الاتصال"}
                        </strong>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{en ? "Platform" : "المنصة"}</span>
                          <span className="font-semibold text-foreground capitalize flex items-center gap-1">
                            {getChannelIcon(selected.channelType)}
                            {selected.channelType}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{en ? "AI Auto-reply" : "المساعد الذكي"}</span>
                          <span className="font-semibold text-foreground">
                            {selected.mode === "AI" ? (en ? "Active" : "مفعّل") : (en ? "Paused" : "متوقف")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{en ? "Status" : "الحالة"}</span>
                          <span className="font-semibold text-foreground">
                            {selected.needsStaff ? (en ? "Staff Attention" : "يحتاج متابعة") : (en ? "Normal" : "طبيعية")}
                          </span>
                        </div>
                      </div>

                      {/* Recent Operations Log for this conversation */}
                      <div className="space-y-2 rounded-2xl border border-border bg-card p-3.5 text-xs shadow-xs">
                        <strong className="text-[11px] font-bold text-foreground block">
                          {en ? "Activity & Notes" : "سجل الأحداث والملاحظات"}
                        </strong>

                        {operationsQuery.data && operationsQuery.data.length > 0 ? (
                          <div className="space-y-2">
                            {operationsQuery.data.slice(0, 4).map((op) => (
                              <div key={op.id} className="rounded-lg bg-muted/40 p-2 text-[10px]">
                                <div className="flex items-center justify-between font-bold text-foreground">
                                  <span>
                                    {op.event_type.includes("note")
                                      ? "📝 ملاحظة داخلية"
                                      : op.event_type.includes("snooze")
                                      ? "⏰ تأجيل"
                                      : "🎯 نتيجة"}
                                  </span>
                                  <span className="text-[9px] font-normal text-muted-foreground">
                                    {formatRelativeTime(op.occurred_at || op.created_at, en)}
                                  </span>
                                </div>
                                <p className="mt-1 text-muted-foreground">
                                  {op.metadata?.content || op.metadata?.outcome || op.metadata?.reason || "—"}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground text-center py-2">
                            {en ? "No internal notes recorded." : "لا توجد ملاحظات داخلية بعد."}
                          </p>
                        )}
                      </div>
                    </aside>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-10 text-center text-muted-foreground">
                <MessagesSquare className="mb-3 size-12 stroke-1 text-muted-foreground/30" />
                <h3 className="text-sm font-bold text-foreground">{en ? "No Conversation Selected" : "لم يتم اختيار محادثة"}</h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  {en ? "Select a conversation from the list to view the chat history and reply." : "اختر محادثة من القائمة لعرض سجل الرسائل والرد على المريض."}
                </p>
              </div>
            )}
          </div>
        ) : null}

        {/* DIALOG 1: Add Internal Note */}
        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <FileText className="size-4 text-primary" />
                <span>{en ? "Add Internal Note" : "إضافة ملاحظة داخلية"}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <p className="text-xs text-muted-foreground">
                {en
                  ? "Internal notes are visible only to clinic staff and doctors, not to the patient."
                  : "الملاحظات الداخلية تظهر فقط لموظفي العيادة والأطباء ولا يراها المريض."}
              </p>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
                placeholder={en ? "Write medical / administrative note here..." : "اكتب ملاحظتك الطبية أو الإدارية هنا..."}
                className="w-full rounded-xl border border-input bg-background p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <DialogFooter className="flex gap-2 sm:justify-start">
              <button
                onClick={handleSaveNote}
                disabled={!noteContent.trim() || operationMutation.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:opacity-50"
              >
                <Check className="size-3.5" />
                <span>{en ? "Save Note" : "حفظ الملاحظة"}</span>
              </button>
              <DialogClose asChild>
                <button className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted">
                  {en ? "Cancel" : "إلغاء"}
                </button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 2: Snooze Conversation */}
        <Dialog open={snoozeDialogOpen} onOpenChange={setSnoozeDialogOpen}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Clock3 className="size-4 text-amber-600" />
                <span>{en ? "Snooze Conversation" : "تأجيل متابعة المحادثة"}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <p className="text-xs text-muted-foreground">
                {en ? "Temporarily snooze this conversation until:" : "تأجيل تنبيه هذه المحادثة حتى موعد محدد:"}
              </p>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: "1h", label: en ? "1 Hour" : "ساعة واحدة" },
                  { key: "4h", label: en ? "4 Hours" : "4 ساعات" },
                  { key: "24h", label: en ? "24 Hours" : "24 ساعة" },
                  { key: "48h", label: en ? "48 Hours" : "يومان" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSnoozeDuration(item.key as typeof snoozeDuration)}
                    className={`rounded-xl border py-2 text-center text-xs font-bold transition ${
                      snoozeDuration === item.key
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <input
                value={snoozeReason}
                onChange={(e) => setSnoozeReason(e.target.value)}
                placeholder={en ? "Reason (optional)..." : "سبب التأجيل (اختياري)..."}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <DialogFooter className="flex gap-2 sm:justify-start">
              <button
                onClick={handleSnooze}
                disabled={operationMutation.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs transition hover:bg-primary/90"
              >
                <Clock className="size-3.5" />
                <span>{en ? "Confirm Snooze" : "تأكيد التأجيل"}</span>
              </button>
              <DialogClose asChild>
                <button className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted">
                  {en ? "Cancel" : "إلغاء"}
                </button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 3: Record Conversation Outcome */}
        <Dialog open={outcomeDialogOpen} onOpenChange={setOutcomeDialogOpen}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>{en ? "Record Conversation Outcome" : "تسجيل نتيجة المحادثة"}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <p className="text-xs text-muted-foreground">
                {en ? "Select the final resolution / outcome for this case:" : "حدد النتيجة النهائية لحالة التواصل مع المريض:"}
              </p>

              <div className="grid grid-cols-2 gap-2">
                {[
                  "حجز موعد بنجاح",
                  "استفسار طبي مكتمل",
                  "متابعة دورية",
                  "تحويل لزيارة العيادة",
                  "لم يتم التوصل لاتفاق",
                  "شكوى مسجلة",
                ].map((outcome) => (
                  <button
                    key={outcome}
                    type="button"
                    onClick={() => setSelectedOutcome(outcome)}
                    className={`rounded-xl border p-2 text-right text-xs font-bold transition ${
                      selectedOutcome === outcome
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {outcome}
                  </button>
                ))}
              </div>

              <textarea
                value={outcomeNote}
                onChange={(e) => setOutcomeNote(e.target.value)}
                rows={3}
                placeholder={en ? "Additional details / summary (optional)..." : "ملاحظات وتفاصيل إضافية (اختياري)..."}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <DialogFooter className="flex gap-2 sm:justify-start">
              <button
                onClick={handleRecordOutcome}
                disabled={operationMutation.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
              >
                <Check className="size-3.5" />
                <span>{en ? "Record Outcome" : "حفظ النتيجة"}</span>
              </button>
              <DialogClose asChild>
                <button className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted">
                  {en ? "Cancel" : "إلغاء"}
                </button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </TooltipProvider>
  );
}
