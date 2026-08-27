import {
  ArrowLeft,
  ArrowRight,
  Bot,
  ChevronLeft,
  ChevronRight,
  Info,
  MessageSquareShare,
  PanelRightClose,
  PanelRightOpen,
  Send,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  User,
  UserCheck,
} from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { InboxConversation, InboxMessage, SavedReply } from "@/lib/inbox-api";
import { ChannelIcon } from "./inbox-icons";
import { MessageBubble } from "./message-bubble";

function interpolateTemplate(template: string, patientName?: string): string {
  if (!template) return "";
  let res = template;
  const name = patientName || "عزيزي المراجع";
  res = res.replace(/\{\{\s*patient_name\s*\}\}/gi, name);
  res = res.replace(/\{\{\s*clinic_name\s*\}\}/gi, "العيادة");
  res = res.replace(/\{\{\s*appointment_time\s*\}\}/gi, "المحدد");
  return res;
}

export function ChatWindow({
  conversation,
  messages,
  optimisticMessages = [],
  onBackMobile,
  onSendMessage,
  isSending,
  channelOnline,
  onToggleMode,
  isTogglingMode,
  savedReplies,
  patientSheetOpen,
  onTogglePatientSheet,
  en,
}: {
  conversation: InboxConversation | null;
  messages: InboxMessage[];
  optimisticMessages?: InboxMessage[];
  onBackMobile?: () => void;
  onSendMessage: (text: string) => boolean | void | Promise<boolean | void>;
  isSending: boolean;
  channelOnline: boolean;
  onToggleMode: (mode: "AI" | "Human") => void;
  isTogglingMode: boolean;
  savedReplies: SavedReply[] | Array<{ id: string; title: string; content: string }>;
  patientSheetOpen: boolean;
  onTogglePatientSheet: () => void;
  en: boolean;
}) {
  const [replyText, setReplyText] = useState("");
  const [cannedRepliesOpen, setCannedRepliesOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const allMessages = [...messages, ...optimisticMessages];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  async function handleSend() {
    const text = replyText.trim();
    if (!text || isSending) return;
    const accepted = await onSendMessage(text);
    if (accepted !== false) setReplyText("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/10">
        <Bot className="size-12 stroke-1 text-muted-foreground/30 mb-3" />
        <h3 className="text-sm font-bold text-foreground">
          {en ? "No conversation selected" : "لم يتم تحديد أي محادثة"}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          {en
            ? "Select a conversation from the list to view incoming messages and reply in real time."
            : "اختر محادثة من القائمة لعرض الرسائل الواردة والرد مباشرة."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full bg-background" dir={en ? "ltr" : "rtl"}>
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border/80 px-4 py-2.5 bg-card/90 backdrop-blur shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile Back Button */}
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className="grid size-8 place-items-center rounded-lg border border-border bg-muted/40 text-foreground md:hidden hover:bg-muted"
              aria-label={en ? "Back to chats" : "العودة للمحادثات"}
            >
              {en ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
            </button>
          )}

          {/* Avatar */}
          <div className="relative size-8 shrink-0 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-xs">
            {conversation.name ? conversation.name.charAt(0) : <User className="size-4" />}
            <span className="absolute -bottom-0.5 -right-0.5 grid size-3.5 place-items-center rounded-full bg-background ring-1 ring-border">
              <ChannelIcon type={conversation.channelType} className="size-2.5" />
            </span>
          </div>

          {/* Name & Phone */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-xs font-bold text-foreground">{conversation.name}</h3>
              <span className="flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                <ChannelIcon type={conversation.channelType} className="size-2.5" />
                <span className="capitalize">{conversation.channel || conversation.channelType}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px]">
              <span className={`size-1.5 rounded-full ${channelOnline ? "bg-emerald-500" : "bg-slate-400"}`} />
              <span className={channelOnline ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                {channelOnline ? (en ? "Online" : "متصل") : (en ? "Channel unavailable" : "القناة غير متاحة")}
              </span>
            </div>
            {conversation.phone && (
              <p className="text-[10px] text-muted-foreground font-mono truncate" dir="ltr">
                {conversation.phone}
              </p>
            )}
          </div>
        </div>

        {/* Right Tools: Mode Switcher & Patient Sheet Toggle */}
        <div className="flex items-center gap-2">
          {/* AI vs Human Mode Toggle */}
          <button
            onClick={() => onToggleMode(conversation.mode === "AI" ? "Human" : "AI")}
            disabled={isTogglingMode}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition shadow-2xs ${
              conversation.mode === "AI"
                ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300"
                : "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300"
            }`}
          >
            {conversation.mode === "AI" ? (
              <>
                <Bot className="size-3.5" />
                <span>{en ? "AI Active" : "مساعد ذكي"}</span>
              </>
            ) : (
              <>
                <UserCheck className="size-3.5" />
                <span>{en ? "Human Staff" : "موظف بشري"}</span>
              </>
            )}
          </button>

          {/* Patient Sheet Toggle */}
          <button
            onClick={onTogglePatientSheet}
            aria-label={en ? "Toggle patient details" : "عرض بيانات المريض"}
            className={`grid size-8 place-items-center rounded-lg border transition ${
              patientSheetOpen
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Info className="size-4" />
          </button>
        </div>
      </div>

      {/* Messages Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/15">
        {allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
            <Sparkles className="size-8 stroke-1 text-muted-foreground/30 mb-2" />
            <p className="text-xs font-semibold text-foreground">
              {en ? "Start of conversation" : "بداية المحادثة"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {en ? "Messages sent will be delivered instantly." : "الرسائل المرسلة ستصل للمريض فوراً."}
            </p>
          </div>
        ) : (
          allMessages.map((msg, index) => (
            <MessageBubble
              key={msg.id || index}
              message={msg}
              en={en}
              isOptimistic={msg.id.startsWith("optimistic-")}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Canned Replies Row & Popover */}
      <div className="relative border-t border-border/50 bg-muted/20 px-3 py-1.5 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setCannedRepliesOpen((v) => !v)}
            className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition ${
              cannedRepliesOpen
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
            data-testid="button-open-templates-popover"
          >
            <MessageSquareShare className="size-3" />
            <span>{en ? "Templates" : "القوالب الجاهزة"}</span>
          </button>

          {savedReplies.length > 0 ? (
            savedReplies.slice(0, 5).map((reply, i) => {
              const rawBody = "body_template" in reply ? reply.body_template : reply.content;
              const title = "template_key" in reply ? reply.template_key : reply.title;
              const interpolated = interpolateTemplate(rawBody, conversation.name);
              return (
                <button
                  key={reply.id || i}
                  onClick={() => setReplyText((prev) => (prev ? `${prev} ${interpolated}` : interpolated))}
                  className="shrink-0 max-w-[140px] truncate rounded-md border border-border/60 bg-card px-2 py-1 text-[10px] font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground transition"
                  title={interpolated}
                  data-testid={`quick-reply-btn-${reply.id || i}`}
                >
                  {title}
                </button>
              );
            })
          ) : (
            <span className="text-[10px] text-muted-foreground px-1">
              {en ? "No saved replies configured" : "لا توجد ردود محفوظة"}
            </span>
          )}
        </div>

        {/* Searchable Template Picker Dropdown */}
        {cannedRepliesOpen && (
          <div className="absolute bottom-full mb-1 inset-x-3 z-30 max-h-72 overflow-hidden rounded-xl border border-border bg-card shadow-xl p-3 flex flex-col gap-2 animate-rise">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="text-xs font-bold text-foreground">
                {en ? "Select Reply Template" : "اختر قالباً جاهزاً"}
              </span>
              <button
                onClick={() => setCannedRepliesOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto max-h-56 space-y-1.5">
              {savedReplies.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  {en ? "No templates available" : "لا توجد قوالب متاحة"}
                </p>
              ) : (
                savedReplies.map((reply, i) => {
                  const rawBody = "body_template" in reply ? reply.body_template : reply.content;
                  const title = "template_key" in reply ? reply.template_key : reply.title;
                  const interpolated = interpolateTemplate(rawBody, conversation.name);
                  return (
                    <button
                      key={reply.id || i}
                      onClick={() => {
                        setReplyText((prev) => (prev ? `${prev} ${interpolated}` : interpolated));
                        setCannedRepliesOpen(false);
                      }}
                      className="w-full text-right p-2 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/80 hover:border-primary/40 transition flex flex-col gap-0.5"
                    >
                      <span className="text-xs font-bold text-foreground">{title}</span>
                      <span className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {interpolated}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Textarea & Send Input */}
      <div className="p-3 border-t border-border/80 bg-card shrink-0">
        <div className="relative flex items-end gap-2 rounded-xl border border-border/80 bg-muted/30 p-1.5 focus-within:border-primary focus-within:bg-background transition">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              en
                ? "Type a message... (Press Enter to send, Shift+Enter for newline)"
                : "اكتب ردك هنا... (اضغط Enter للإرسال، Shift+Enter لسطر جديد)"
            }
            rows={2}
            className="w-full resize-none bg-transparent px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none max-h-32"
          />

          <button
            onClick={handleSend}
            disabled={!replyText.trim() || isSending || !channelOnline}
            title={channelOnline ? (en ? "Send message" : "إرسال الرسالة") : (en ? "Connect this channel before sending" : "وصّل القناة قبل الإرسال")}
            aria-label={en ? "Send message" : "إرسال الرسالة"}
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            <Send className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
