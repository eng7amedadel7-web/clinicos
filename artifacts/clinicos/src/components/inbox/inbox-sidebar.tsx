import {
  Layers,
  MessagesSquare,
  RefreshCw,
  Search,
  User,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { InboxChannel, InboxConversation } from "@/lib/inbox-api";
import { ChannelIcon, formatRelativeTime } from "./inbox-icons";

export function InboxSidebar({
  conversations,
  totalCount,
  selectedId,
  onSelectConversation,
  search,
  onSearchChange,
  channelType,
  onChannelTypeChange,
  channelId,
  onChannelIdChange,
  channelsList,
  channelCounts,
  statusFilter,
  onStatusFilterChange,
  streamConnected,
  onRefresh,
  isRefreshing,
  en,
}: {
  conversations: InboxConversation[];
  totalCount: number;
  selectedId: string | null;
  onSelectConversation: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  channelType: string;
  onChannelTypeChange: (value: string) => void;
  channelId: string | null;
  onChannelIdChange: (value: string | null) => void;
  channelsList: InboxChannel[];
  channelCounts?: Record<string, number>;
  statusFilter: "all" | "needs-staff" | "ai" | "snoozed";
  onStatusFilterChange: (status: "all" | "needs-staff" | "ai" | "snoozed") => void;
  streamConnected: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  en: boolean;
}) {
  const channelPills = [
    { key: "all", label: en ? "All" : "الكل", type: undefined },
    { key: "whatsapp", label: en ? "WhatsApp" : "واتساب", type: "whatsapp" },
    { key: "instagram", label: en ? "Instagram" : "إنستغرام", type: "instagram" },
    { key: "messenger", label: en ? "Messenger" : "ماسنجر", type: "messenger" },
    { key: "telegram", label: en ? "Telegram" : "تليجرام", type: "telegram" },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-card" dir={en ? "ltr" : "rtl"}>
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border/70 px-3.5 py-2.5 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary font-bold">
            <MessagesSquare className="size-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-foreground">
              {en ? "Chats" : "المحادثات"}
            </h2>
            <span className="text-[9px] text-muted-foreground">
              {conversations.length} {en ? "of" : "من"} {totalCount}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold border ${
              streamConnected
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60"
            }`}
          >
            {streamConnected ? <Wifi className="size-2.5" /> : <WifiOff className="size-2.5" />}
            <span>{streamConnected ? (en ? "Live" : "مباشر") : (en ? "Polling" : "تحديث دوري")}</span>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label={en ? "Refresh" : "تحديث"}
            className="grid size-6 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search Box */}
      <div className="p-2 border-b border-border/50">
        <div className="relative">
          <Search className="absolute right-2.5 top-2.5 size-3.5 text-muted-foreground rtl:right-2.5 ltr:left-2.5 rtl:left-auto ltr:right-auto" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={en ? "Search conversations..." : "ابحث في المحادثات أو الهاتف..."}
            className="w-full rounded-lg border border-border/60 bg-muted/40 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none rtl:pr-8 rtl:pl-2 ltr:pl-8 ltr:pr-2 transition"
          />
        </div>
      </div>

      {/* Channel Filters */}
      <div className="flex items-center gap-1 overflow-x-auto px-2 py-1.5 border-b border-border/40 scrollbar-none">
        {channelPills.map((pill) => {
          const isActive = channelType === pill.key && !channelId;
          const count = pill.key === "all" ? totalCount : channelCounts?.[pill.key] ?? 0;
          return (
            <button
              key={pill.key}
              onClick={() => {
                onChannelTypeChange(pill.key);
                onChannelIdChange(null);
              }}
              className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {pill.type ? <ChannelIcon type={pill.type} className="size-2.5" /> : <Layers className="size-2.5" />}
              <span>{pill.label}</span>
              <span className={`rounded-full px-1 text-[9px] ${isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background/70 text-muted-foreground"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Status Filter Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1.5 border-b border-border/40 bg-muted/20 text-[10px]">
        <button
          onClick={() => onStatusFilterChange("all")}
          className={`rounded-md py-1 font-semibold transition ${
            statusFilter === "all" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {en ? "All" : "الكل"}
        </button>
        <button
          onClick={() => onStatusFilterChange("needs-staff")}
          className={`rounded-md py-1 font-semibold transition ${
            statusFilter === "needs-staff" ? "bg-amber-500 text-white shadow-2xs" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {en ? "Handoff" : "تدخل"}
        </button>
        <button
          onClick={() => onStatusFilterChange("ai")}
          className={`rounded-md py-1 font-semibold transition ${
            statusFilter === "ai" ? "bg-purple-600 text-white shadow-2xs" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {en ? "AI" : "الذكي"}
        </button>
        <button
          onClick={() => onStatusFilterChange("snoozed")}
          className={`rounded-md py-1 font-semibold transition ${
            statusFilter === "snoozed" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {en ? "Snoozed" : "مؤجل"}
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/30">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <MessagesSquare className="size-8 stroke-1 text-muted-foreground/40 mb-2" />
            <p className="text-xs font-bold text-foreground">{en ? "No conversations found" : "لا توجد محادثات مطابقة"}</p>
            <p className="text-[10px] mt-0.5 text-muted-foreground">{en ? "Try clearing search or filters" : "جرّب تغيير خيارات البحث أو التصفية"}</p>
          </div>
        ) : (
          conversations.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <button
                key={item.id}
                onClick={() => onSelectConversation(item.id)}
                className={`flex w-full items-start gap-2.5 p-3 text-start transition cursor-pointer border-l-2 ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:bg-muted/50"
                }`}
              >
                {/* Avatar */}
                <div className="relative mt-0.5 size-8 shrink-0 rounded-full bg-slate-200 dark:bg-slate-800 grid place-items-center text-slate-700 dark:text-slate-300 font-bold text-xs">
                  {item.name ? item.name.charAt(0) : <User className="size-4" />}
                  <span className="absolute -bottom-0.5 -right-0.5 grid size-3.5 place-items-center rounded-full bg-background ring-1 ring-border">
                    <ChannelIcon type={item.channelType} className="size-2.5" />
                  </span>
                </div>

                {/* Content Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`truncate text-xs font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {item.name}
                    </p>
                    <span className="shrink-0 text-[9px] text-muted-foreground font-mono">
                      {formatRelativeTime(item.lastActivityAt, en)}
                    </span>
                  </div>

                  <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                    {item.lastMessage || (en ? "No messages yet" : "لا توجد رسائل بعد")}
                  </p>

                  <div className="mt-1 flex items-center gap-1.5">
                    {item.needsStaff && (
                      <span className="rounded bg-amber-500/10 px-1 py-0.2 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                        {en ? "Needs Staff" : "يحتاج تدخل"}
                      </span>
                    )}
                    {item.mode === "AI" ? (
                      <span className="rounded bg-purple-500/10 px-1 py-0.2 text-[9px] font-bold text-purple-600 dark:text-purple-400">
                        {en ? "AI Auto" : "رد ذكي"}
                      </span>
                    ) : (
                      <span className="rounded bg-sky-500/10 px-1 py-0.2 text-[9px] font-bold text-sky-600 dark:text-sky-400">
                        {en ? "Human" : "بشري"}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
