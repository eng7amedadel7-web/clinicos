import { Bot, Check, CheckCheck, Clock, UserCheck, UserRound } from "lucide-react";
import type { InboxMessage } from "@/lib/inbox-api";
import { formatMessageTime } from "./inbox-icons";

export function MessageBubble({
  message,
  en,
  isOptimistic = false,
}: {
  message: InboxMessage;
  en: boolean;
  isOptimistic?: boolean;
}) {
  const isOutgoing = message.direction === "outgoing" || message.sender_type === "staff" || message.sender_type === "ai";
  const isAi = message.sender_type === "ai";
  const isStaff = message.sender_type === "staff";
  const isPatient = !isOutgoing;

  return (
    <div
      className={`flex w-full flex-col ${
        isOutgoing ? "items-end" : "items-start"
      } animate-in fade-in-50 duration-150`}
    >
      {/* Sender Badge */}
      <div className="mb-0.5 flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
        {isAi && (
          <span className="flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400">
            <Bot className="size-3" />
            {en ? "AI Assistant" : "المساعد الذكي"}
          </span>
        )}
        {isStaff && (
          <span className="flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400">
            <UserCheck className="size-3" />
            {en ? "Staff" : "الموظف"}
          </span>
        )}
        {isPatient && (
          <span className="flex items-center gap-1 font-medium text-slate-500">
            <UserRound className="size-3" />
            {en ? "Patient" : "المريض"}
          </span>
        )}
      </div>

      {/* Bubble Container */}
      <div
        className={`relative max-w-[82%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-2xs transition-all ${
          isOutgoing
            ? isAi
              ? "rounded-br-xs bg-purple-600 text-white dark:bg-purple-700"
              : "rounded-br-xs bg-primary text-primary-foreground"
            : "rounded-bl-xs bg-muted/80 text-foreground border border-border/60"
        } ${isOptimistic ? "opacity-80" : ""}`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        {/* Footer: Time & Status */}
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[9px] font-mono ${
            isOutgoing ? "text-white/80" : "text-muted-foreground"
          }`}
        >
          <span>{formatMessageTime(message.created_at, en)}</span>
          {isOutgoing && (
            <span>
              {isOptimistic ? (
                <Clock className="size-2.5 animate-spin" />
              ) : message.message_status === "read" ? (
                <CheckCheck className="size-3 text-sky-300" />
              ) : message.message_status === "delivered" ? (
                <CheckCheck className="size-3 text-white/90" />
              ) : (
                <Check className="size-3 text-white/70" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
