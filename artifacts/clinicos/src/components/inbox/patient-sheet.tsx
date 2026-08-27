import {
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Phone,
  Tag,
  User,
  X,
} from "lucide-react";
import { Link } from "wouter";
import type { ConversationOperation, InboxConversation } from "@/lib/inbox-api";
import { ChannelIcon } from "./inbox-icons";

export function PatientSheet({
  isOpen,
  onClose,
  conversation,
  operations,
  onOpenNoteDialog,
  onOpenSnoozeDialog,
  onOpenOutcomeDialog,
  en,
}: {
  isOpen: boolean;
  onClose: () => void;
  conversation: InboxConversation | null;
  operations: ConversationOperation[];
  onOpenNoteDialog: () => void;
  onOpenSnoozeDialog: () => void;
  onOpenOutcomeDialog: () => void;
  en: boolean;
}) {
  if (!isOpen || !conversation) return null;

  return (
    <aside
      className="flex w-72 shrink-0 flex-col border-r border-border bg-card shadow-sm animate-in slide-in-from-left-4 duration-200"
      dir={en ? "ltr" : "rtl"}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 bg-muted/20">
        <h3 className="text-xs font-bold text-foreground">
          {en ? "Patient Profile" : "بيانات المريض"}
        </h3>
        <button
          onClick={onClose}
          aria-label={en ? "Close sheet" : "إغلاق اللوحة"}
          className="grid size-6 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/40 border border-border/50">
          <div className="size-12 rounded-full bg-primary/10 text-primary grid place-items-center text-base font-bold mb-2">
            {conversation.name ? conversation.name.charAt(0) : <User className="size-6" />}
          </div>
          <h4 className="font-bold text-foreground text-sm">{conversation.name}</h4>
          {conversation.phone && (
            <p className="text-muted-foreground font-mono text-[11px] mt-0.5" dir="ltr">
              {conversation.phone}
            </p>
          )}

          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-background border px-2 py-0.5 text-[10px] font-medium">
              <ChannelIcon type={conversation.channelType} className="size-3" />
              <span className="capitalize">{conversation.channel || conversation.channelType}</span>
            </span>
            {conversation.patient_id && (
              <Link
                href={`/patients/${conversation.patient_id}`}
                className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold hover:underline"
              >
                <span>{en ? "Patient 360" : "الملف الشامل"}</span>
                <ExternalLink className="size-2.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {en ? "Quick Actions" : "إجراءات سريعة"}
          </p>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <button
              onClick={onOpenNoteDialog}
              className="flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-card p-2 text-[10px] font-semibold text-foreground transition hover:border-primary hover:bg-muted/40"
            >
              <FileText className="size-3.5 text-amber-600" />
              <span>{en ? "Note" : "ملاحظة"}</span>
            </button>
            <button
              onClick={onOpenSnoozeDialog}
              className="flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-card p-2 text-[10px] font-semibold text-foreground transition hover:border-primary hover:bg-muted/40"
            >
              <Clock className="size-3.5 text-sky-600" />
              <span>{en ? "Snooze" : "تأجيل"}</span>
            </button>
            <button
              onClick={onOpenOutcomeDialog}
              className="flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-card p-2 text-[10px] font-semibold text-foreground transition hover:border-primary hover:bg-muted/40"
            >
              <Tag className="size-3.5 text-emerald-600" />
              <span>{en ? "Outcome" : "النتيجة"}</span>
            </button>
          </div>
        </div>

        {/* Operations History / Internal Notes Timeline */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {en ? "Activity & Notes" : "سجل العمليات والملاحظات"}
          </p>
          {operations.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/80 py-2 text-center bg-muted/20 rounded-lg">
              {en ? "No internal notes yet" : "لا توجد ملاحظات داخلية بعد"}
            </p>
          ) : (
            <div className="space-y-2 divide-y divide-border/30">
              {operations.map((op) => (
                <div key={op.id} className="pt-2 text-[11px]">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                    <span className="font-bold text-foreground capitalize">
                      {op.event_type.replace(/_/g, " ")}
                    </span>
                  </div>
                  {op.metadata?.content && (
                    <p className="text-muted-foreground bg-muted/40 p-1.5 rounded text-[10px] leading-relaxed">
                      {String(op.metadata.content)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
