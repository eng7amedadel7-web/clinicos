import { useRef, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Bell,
  BellOff,
  Bot,
  CalendarCheck,
  Check,
  CheckCheck,
  Clock,
  Clock3,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useClinicNotifications, type ClinicAlert } from "@/lib/notifications-context";
import { usePreferences } from "@/lib/preferences";
import { getOperationsSummary } from "@/lib/operations-api";

function AlertIcon({ type }: { type: ClinicAlert["type"] }) {
  switch (type) {
    case "handoff":
      return <UserRound className="size-3.5 text-amber-600" />;
    case "message":
      return <MessageCircle className="size-3.5 text-sky-600" />;
    case "appointment":
      return <CalendarCheck className="size-3.5 text-emerald-600" />;
    default:
      return <Bell className="size-3.5 text-muted-foreground" />;
  }
}

function AlertTone({ type }: { type: ClinicAlert["type"] }) {
  switch (type) {
    case "handoff":
      return "border-amber-200/80 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30";
    case "message":
      return "border-sky-200/80 bg-sky-50 dark:border-sky-900/40 dark:bg-sky-950/30";
    case "appointment":
      return "border-emerald-200/80 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30";
    default:
      return "border-border bg-card";
  }
}

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { language, t, selectedBranchId } = usePreferences();
  const en = language === "en";
  const { recentAlerts, unreadHandoffs, unreadMessages, markAllAsRead, clearAlerts, isMuted, toggleMute } =
    useClinicNotifications();

  const totalUnread = unreadHandoffs + unreadMessages;
  const panelRef = useRef<HTMLDivElement>(null);

  const summaryQuery = useQuery({
    queryKey: ["operations", "summary", "notifications-panel", selectedBranchId],
    queryFn: ({ signal }) =>
      getOperationsSummary(signal, selectedBranchId === "all" ? undefined : selectedBranchId),
    staleTime: 30_000,
  });

  const stats = summaryQuery.data?.stats;
  const operationalItems = [
    {
      id: "inbox",
      label: en ? "Needs staff" : "تحتاج موظف",
      count: (stats?.conversationsNeedingStaff ?? 0) + unreadHandoffs,
      href: "/inbox",
      icon: MessageCircle,
      tone: "text-amber-600 bg-amber-500/10",
    },
    {
      id: "follow-ups",
      label: en ? "Follow-ups" : "متابعات مستحقة",
      count: stats?.openFollowUps ?? 0,
      href: "/follow-ups",
      icon: Sparkles,
      tone: "text-indigo-600 bg-indigo-500/10",
    },
    {
      id: "no-shows",
      label: en ? "No-shows" : "حالات عدم حضور",
      count: stats?.openNoShows ?? 0,
      href: "/no-shows",
      icon: ShieldCheck,
      tone: "text-rose-600 bg-rose-500/10",
    },
    {
      id: "waitlist",
      label: en ? "Waitlist" : "قائمة الانتظار",
      count: stats?.activeWaitlist ?? 0,
      href: "/waitlist",
      icon: Clock3,
      tone: "text-emerald-600 bg-emerald-500/10",
    },
  ].filter((item) => item.count > 0);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="absolute end-0 top-full z-50 mt-2 w-84 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card shadow-2xl animate-in slide-in-from-top-2 duration-150 overflow-hidden"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-primary" />
          <strong className="text-xs font-bold text-foreground">
            {en ? "Notifications & Tasks" : "الإشعارات والمهام"}
          </strong>
          {totalUnread > 0 && (
            <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[9px] font-black text-white animate-pulse">
              {totalUnread}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Mute Toggle */}
          <button
            onClick={toggleMute}
            title={isMuted ? (en ? "Unmute sounds" : "تفعيل الصوت") : (en ? "Mute sounds" : "كتم الصوت")}
            className="grid size-6 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {isMuted ? <VolumeX className="size-3.5 text-destructive" /> : <Volume2 className="size-3.5" />}
          </button>

          {/* Mark all read */}
          {totalUnread > 0 && (
            <button
              onClick={markAllAsRead}
              title={en ? "Mark all as read" : "تحديد الكل كمقروء"}
              className="grid size-6 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <CheckCheck className="size-3.5" />
            </button>
          )}

          {/* Clear all */}
          {recentAlerts.length > 0 && (
            <button
              onClick={clearAlerts}
              title={en ? "Clear all" : "مسح الكل"}
              className="grid size-6 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="grid size-6 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Operational items summary chips */}
      {operationalItems.length > 0 && (
        <div className="border-b border-border/60 bg-muted/20 p-2.5">
          <p className="mb-2 text-[10px] font-semibold text-muted-foreground">
            {en ? "Action items" : "إجراءات تتطلب الانتباه"}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {operationalItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center justify-between gap-1.5 rounded-lg border border-border/50 bg-background/80 px-2.5 py-1.5 text-[11px] font-medium transition hover:border-primary/50 hover:bg-background"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Icon className="size-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${item.tone}`}>
                    {item.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="max-h-[320px] overflow-y-auto divide-y divide-border/40">
        {recentAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
            <Bell className="size-7 stroke-1 text-muted-foreground/30" />
            <p className="text-xs font-semibold text-foreground">{en ? "All caught up!" : "لا توجد تنبيهات جديدة"}</p>
            <p className="text-[10px] text-muted-foreground">
              {en ? "New alerts will arrive here in real-time." : "التنبيهات الجديدة ستصل فوراً عبر النظام."}
            </p>
          </div>
        ) : (
          recentAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 border-r-2 p-3 transition ${
                alert.read
                  ? "border-transparent bg-card opacity-70"
                  : `border-primary ${AlertTone({ type: alert.type })}`
              }`}
            >
              {/* Icon */}
              <div
                className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border ${AlertTone({ type: alert.type })}`}
              >
                <AlertIcon type={alert.type} />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-foreground leading-tight">{alert.title}</p>
                {alert.description && (
                  <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground leading-relaxed">
                    {alert.description}
                  </p>
                )}
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground font-mono">
                    <Clock className="size-2.5" />
                    {alert.time}
                  </span>
                  {alert.link && (
                    <Link
                      href={alert.link}
                      onClick={onClose}
                      className="text-[9px] font-bold text-primary hover:underline"
                    >
                      {en ? "Open →" : "→ فتح"}
                    </Link>
                  )}
                </div>
              </div>

              {/* Unread dot */}
              {!alert.read && (
                <span className="mt-1 size-2 shrink-0 rounded-full bg-primary animate-pulse" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border/80 bg-muted/30 px-3 py-2 text-center">
        <p className="text-[10px] text-muted-foreground">
          {en
            ? "Live alerts delivered via SSE & Audio Chimes"
            : "التنبيهات الفورية مفعّلة عبر الاتصال الحي والتنبيه الصوتي"}
        </p>
      </div>
    </div>
  );
}

export function NotificationsBell() {
  const { unreadHandoffs, unreadMessages, recentAlerts } = useClinicNotifications();
  const [open, setOpen] = useState(false);
  const total = unreadHandoffs + unreadMessages + (recentAlerts.some((a) => !a.read) ? 1 : 0);

  return (
    <div className="relative">
      <button
        id="btn-notifications-bell"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className="toolbar-button relative"
        data-testid="button-notifications"
      >
        <Bell size={17} />
        {total > 0 && (
          <span className="toolbar-badge animate-pulse">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>
      {open && <NotificationsPanel onClose={() => setOpen(false)} />}
    </div>
  );
}

