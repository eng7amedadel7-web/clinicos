import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bot, CheckCircle2, Clock3, FileText, Filter, RefreshCw, Search, Send, ToggleRight, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { getInboxPayload, inboxAction, type InboxChannel, type InboxConversation, type InboxMessage } from "@/lib/inbox-api";
import { usePreferences } from "@/lib/preferences";

function StatusPill({ children, tone = "teal" }: { children: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    teal: "bg-[#d9f0e8] text-[#176b58] dark:bg-[#123528] dark:text-[#7fd0b4]",
    amber: "bg-[#fff0d8] text-[#9a6513] dark:bg-[#3a2c14] dark:text-[#e0b46a]",
    blue: "bg-[#dcecf5] text-[#22617d] dark:bg-[#143242] dark:text-[#8cc3dd]",
    purple: "bg-[#e8e1f4] text-[#65518b] dark:bg-[#2a2440] dark:text-[#bcaede]",
  };
  return <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${tones[tone] ?? tones.blue}`}>{children}</span>;
}

function getChannels(en: boolean): Array<{ key: string; label: string; icon: string }> {
  return [
    { key: "all", label: en ? "All" : "الكل", icon: "✦" },
    { key: "whatsapp", label: en ? "WhatsApp" : "واتساب", icon: "WA" },
    { key: "instagram", label: en ? "Instagram" : "إنستغرام", icon: "IG" },
    { key: "messenger", label: en ? "Messenger" : "ماسنجر", icon: "MS" },
    { key: "telegram", label: en ? "Telegram" : "تليجرام", icon: "TG" },
  ];
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ar-EG");
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
    };

    source.addEventListener("invalidate", handleInvalidate);
    source.addEventListener("inbox.message_received", handleInvalidate);
    source.addEventListener("inbox.message_sent", handleInvalidate);
    source.addEventListener("inbox.handoff_requested", handleInvalidate);
    source.addEventListener("inbox.mode_changed", handleInvalidate);
    source.addEventListener("heartbeat", () => setConnected(true));
    source.onerror = () => {
      setConnected(false);
    };

    return () => {
      setConnected(false);
      source.close();
    };
  }, [queryClient, selectedId]);

  return connected;
}

export default function InboxPage() {
  const queryClient = useQueryClient();
  const { language } = usePreferences();
  const en = language === "en";
  const channels = getChannels(en);
  const [selectedId, setSelectedId] = useState<string | null>(() => new URLSearchParams(window.location.search).get("conversationId"));
  const [search, setSearch] = useState("");
  const [channelType, setChannelType] = useState("all");
  const [channelId, setChannelId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const streamConnected = useInboxLiveUpdates(selectedId);
  const inboxQuery = useQuery({
    queryKey: ["inbox", selectedId],
    queryFn: ({ signal }) => getInboxPayload(selectedId, signal),
    staleTime: 15_000,
    refetchInterval: streamConnected ? 5 * 60_000 : 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
  });
  const modeMutation = useMutation({
    mutationFn: ({ id, mode }: { id: string; mode: "AI" | "Human" }) => inboxAction(`/api/inbox/${encodeURIComponent(id)}/mode`, { method: "PATCH", body: JSON.stringify({ mode }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inbox"] }),
  });
  const sendMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => inboxAction(`/api/inbox/${encodeURIComponent(id)}/messages`, { method: "POST", body: JSON.stringify({ content }) }),
    onSuccess: () => {
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["inbox", selectedId] });
    },
  });
  const operationMutation = useMutation({
    mutationFn: ({ id, action, body }: { id: string; action: "note" | "snooze" | "outcome"; body: Record<string, unknown> }) => inboxAction(`/api/inbox/${encodeURIComponent(id)}/${action}`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inbox", selectedId] }),
  });
  const data = inboxQuery.data;

  useEffect(() => {
    if (!selectedId && data?.selectedConversationId) setSelectedId(data.selectedConversationId);
  }, [data?.selectedConversationId, selectedId]);

  const selected = data?.conversations.find((item) => item.id === selectedId) ?? null;
  const visible = (data?.conversations ?? []).filter((item) => {
    const matchesChannel = channelId ? item.channelId === channelId : channelType === "all" || item.channelType === channelType;
    const needle = search.trim().toLowerCase();
    return matchesChannel && (!needle || `${item.name} ${item.channel} ${item.lastMessage ?? ""}`.toLowerCase().includes(needle));
  });

  function selectConversation(id: string) {
    setSelectedId(id);
    window.history.replaceState({}, "", `/inbox?conversationId=${encodeURIComponent(id)}`);
  }

  function send() {
    const content = reply.trim();
    if (!selected || !content || sendMutation.isPending) return;
    sendMutation.mutate({ id: selected.id, content });
  }

  function addNote() {
    if (!selected) return;
    const content = window.prompt(en ? "Write an internal note" : "اكتب الملاحظة الداخلية")?.trim();
    if (content) operationMutation.mutate({ id: selected.id, action: "note", body: { content } });
  }

  function snooze() {
    if (!selected) return;
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    operationMutation.mutate({ id: selected.id, action: "snooze", body: { until, reason: en ? "Snoozed one day from Inbox" : "تأجيل يوم واحد من Inbox" } });
  }

  function recordOutcome() {
    if (!selected) return;
    const outcome = window.prompt(en ? "Write the conversation outcome" : "اكتب نتيجة المحادثة")?.trim();
    if (outcome) operationMutation.mutate({ id: selected.id, action: "outcome", body: { outcome } });
  }

  return <section className="w-full" dir="rtl">
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-1.5 text-[11px] font-bold text-[hsl(var(--primary))]">{en ? "Communication / inbox" : "التواصل / inbox"}</p>
        <h1 className="text-[27px] font-extrabold tracking-tight md:text-[31px]">{en ? "Inbox" : "صندوق الوارد"}</h1>
        <p className="mt-1 text-[13px] text-[hsl(var(--muted-foreground))]">{inboxQuery.isFetching ? (en ? "Silently refreshing data..." : "تحديث صامت للبيانات...") : `${visible.length} ${en ? "of" : "من"} ${(data?.conversations ?? []).length} ${en ? "real conversations" : "محادثات حقيقية"}`}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-bold ${inboxQuery.isFetching ? "bg-[#fff0d8] text-[#9a6513] dark:bg-[#3a2c14] dark:text-[#e0b46a]" : streamConnected ? "bg-[#d9f0e8] text-[#176b58] dark:bg-[#123528] dark:text-[#7fd0b4]" : "bg-[#e8edf0] text-[#607785] dark:bg-[#10222f] dark:text-[#a8bfc9]"}`}><span className="size-1.5 rounded-full bg-current" /> {inboxQuery.isFetching ? (en ? "Updating" : "جارٍ التحديث") : streamConnected ? (en ? "Live connected" : "متصل لحظيًا") : (en ? "Connected" : "متصل")}</span>
        <button onClick={() => inboxQuery.refetch()} disabled={inboxQuery.isFetching} className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-[11px] font-bold"><RefreshCw size={14} className={inboxQuery.isFetching ? "animate-spin" : ""} /> {en ? "Refresh" : "تحديث"}</button>
      </div>
    </div>
    {inboxQuery.isLoading ? <div className="surface flex min-h-[580px] items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">{en ? "Loading real conversations..." : "جارٍ تحميل المحادثات الحقيقية..."}</div> : null}
    {inboxQuery.isError ? <div className="surface flex min-h-[400px] flex-col items-center justify-center p-10 text-center"><AlertTriangle className="mb-3 text-[#a64036] dark:text-[#eb9a90]" /><p className="text-sm font-bold">{en ? "Could not load inbox" : "تعذر تحميل صندوق الوارد"}</p><p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{inboxQuery.error instanceof Error ? inboxQuery.error.message : (en ? "A temporary error occurred." : "حدث خطأ مؤقت.")}</p><button className="primary-button mt-5" onClick={() => inboxQuery.refetch()}><RefreshCw size={15} /> {en ? "Retry" : "إعادة المحاولة"}</button></div> : null}
    {data && !inboxQuery.isError ? <div className="grid min-h-[650px] overflow-hidden rounded-2xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] shadow-[var(--shadow-sm)] lg:grid-cols-[72px_320px_1fr]">
      <aside className="order-1 flex gap-2 border-b border-[hsl(var(--border)/.65)] bg-[hsl(var(--muted)/.32)] p-2 lg:order-none lg:flex-col lg:border-b-0 lg:border-l lg:p-2.5">
        <p className="hidden px-1 py-2 text-center text-[9px] font-black text-[hsl(var(--muted-foreground))] lg:block">{en ? "Channels" : "قنوات"}</p>
        {channels.map((channel) => {
          const count = channel.key === "all" ? data.conversations.length : data.conversations.filter((item) => item.channelType === channel.key).length;
          return <button key={channel.key} onClick={() => { setChannelType(channel.key); setChannelId(null); }} className={`flex min-w-[58px] flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-bold transition lg:flex-none ${channelType === channel.key ? "bg-[hsl(var(--primary))] text-white shadow-[0_5px_15px_hsl(var(--primary)/.2)]" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"}`} aria-label={en ? `Open ${channel.label}` : `فتح ${channel.label}`}><span className="grid size-8 place-items-center rounded-lg border border-current/15 text-[9px] font-black">{channel.icon}</span><span className="hidden truncate lg:block">{channel.label}</span><span className="text-[9px] opacity-70">{count}</span></button>;
        })}
      </aside>
      <div className="order-2 border-b border-[hsl(var(--border)/.65)] lg:order-none lg:border-b-0 lg:border-l">
        <div className="flex items-center justify-between border-b border-[hsl(var(--border)/.65)] p-4"><strong className="text-sm">{en ? "Conversations" : "المحادثات"} <span className="mr-1 text-[10px] text-[hsl(var(--primary))]">{visible.length}</span></strong><span className="text-[9px] font-bold text-[hsl(var(--muted-foreground))]">{channelType === "all" ? (en ? "All channels" : "كل القنوات") : channelType}</span></div>
        <div className="p-3"><div className="relative"><Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" /><input value={search} onChange={(event) => setSearch(event.target.value)} data-testid="input-inbox-search" placeholder={en ? "Search conversations" : "ابحث في المحادثات"} className="w-full rounded-lg bg-[hsl(var(--muted))] py-2 pr-8 text-[11px] outline-none" /></div>{channelType !== "all" ? <div className="mt-2 flex gap-1.5 overflow-auto pb-1">{data.channels.filter((channel) => channel.type === channelType).map((channel) => <button key={channel.id} onClick={() => setChannelId(channel.id)} className={`shrink-0 rounded-lg border px-2 py-1 text-[9px] font-bold ${channelId === channel.id ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.08)] text-[hsl(var(--primary))]" : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"}`} title={channel.status || (en ? "Unspecified" : "غير محدد")}>{channel.displayName || channel.type} · {channel.status || (en ? "Unspecified" : "غير محدد")}</button>)}</div> : null}</div>
        <div className="max-h-[560px] overflow-auto">{visible.map((item) => <button key={item.id} data-testid={`button-conversation-${item.id}`} onClick={() => selectConversation(item.id)} className={`flex w-full gap-3 border-b border-[hsl(var(--border)/.45)] px-4 py-3 text-right transition hover:bg-[hsl(var(--muted)/.45)] ${selectedId === item.id ? "bg-[hsl(var(--primary)/.06)]" : ""}`}><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#dcecf5] text-[11px] font-bold text-[#22617d] dark:bg-[#143242] dark:text-[#8cc3dd]">{item.name.slice(0, 2)}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-[11px]">{item.name}</strong><small className="whitespace-nowrap text-[9px] text-[hsl(var(--muted-foreground))]">{formatDate(item.lastActivityAt)}</small></span><span className="mt-1 block truncate text-[10px] text-[hsl(var(--muted-foreground))]">{item.lastMessage || item.channel}</span><span className="mt-1.5 flex items-center gap-1.5"><StatusPill tone={item.needsStaff ? "amber" : item.mode === "AI" ? "purple" : "blue"}>{item.needsStaff ? (en ? "Needs staff" : "تحتاج موظفاً") : item.mode === "AI" ? "AI" : (en ? "Team" : "فريق")}</StatusPill><span className="text-[9px] text-[hsl(var(--muted-foreground))]">{item.channelType}</span></span></span></button>)}{visible.length === 0 ? <div className="p-10 text-center text-xs text-[hsl(var(--muted-foreground))]">{en ? "No conversations in this section." : "لا توجد محادثات في هذا القسم."}</div> : null}</div>
      </div>
      {selected ? <div className="order-3 flex min-h-[580px] flex-col lg:order-none"><div className="flex items-center justify-between border-b border-[hsl(var(--border)/.65)] px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-[#dcecf5] text-[11px] font-bold text-[#22617d] dark:bg-[#143242] dark:text-[#8cc3dd]">{selected.name.slice(0, 2)}</span><div><strong className="block text-xs">{selected.name}</strong><span className="text-[10px] text-[hsl(var(--muted-foreground))]">{selected.channelType} · {selected.channelProvider || (en ? "Unspecified provider" : "مزود غير محدد")} · {selected.channelStatus || (en ? "Unspecified" : "غير محدد")}</span></div></div><button data-testid="button-toggle-conversation-mode" onClick={() => modeMutation.mutate({ id: selected.id, mode: selected.mode === "AI" ? "Human" : "AI" })} disabled={modeMutation.isPending} className="flex items-center gap-1.5 rounded-lg bg-[hsl(var(--muted))] px-2.5 py-1.5 text-[10px] font-bold">{selected.mode === "AI" ? <Bot size={13} /> : <UserRound size={13} />}{selected.mode === "AI" ? (en ? "AI Assistant" : "المساعد الذكي") : (en ? "Team" : "الفريق")}<ToggleRight size={15} /></button></div><div className="flex flex-wrap gap-2 border-b border-[hsl(var(--border)/.65)] px-5 py-3"><button onClick={addNote} disabled={operationMutation.isPending} className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold"><FileText size={13} /> {en ? "Note" : "ملاحظة"}</button><button onClick={snooze} disabled={operationMutation.isPending} className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold"><Clock3 size={13} /> {en ? "Snooze 24h" : "تأجيل 24 ساعة"}</button><button onClick={recordOutcome} disabled={operationMutation.isPending} className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold"><CheckCircle2 size={13} /> {en ? "Record outcome" : "تسجيل نتيجة"}</button></div><div className="flex-1 space-y-3 overflow-auto bg-[hsl(var(--background)/.45)] p-5">{data.messages.length ? data.messages.map((message) => <div key={message.id} className={`${message.direction === "outgoing" ? "ml-auto bg-[hsl(var(--primary))] text-white" : "mr-auto border bg-[hsl(var(--card))]"} max-w-[75%] rounded-2xl p-3 text-[11px] leading-6`}>{message.content}<small className="mt-1 block text-[9px] opacity-60">{formatDate(message.created_at)} · {message.message_status || ""}</small></div>) : <div className="p-10 text-center text-xs text-[hsl(var(--muted-foreground))]">{en ? "No messages yet" : "لا توجد رسائل بعد"}</div>}</div><div className="border-t border-[hsl(var(--border)/.65)] p-4"><div className="mb-2 text-[10px] text-[hsl(var(--muted-foreground))]">{en ? "The reply will be saved in the conversation log; external sending to the channel is handled via a secure server route." : "سيُحفظ الرد داخل سجل المحادثة؛ ربط الإرسال الخارجي بالقناة يتم عبر مسار خادم محمي."}</div><div className="flex gap-2"><input data-testid="input-inbox-reply" value={reply} onChange={(event) => setReply(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") send(); }} placeholder={en ? "Write your reply here..." : "اكتب ردك هنا..."} className="flex-1 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2.5 text-xs outline-none" /><button data-testid="button-send-reply" onClick={send} disabled={sendMutation.isPending || !reply.trim()} className="grid size-10 place-items-center rounded-xl bg-[hsl(var(--primary))] text-white disabled:opacity-50"><Send size={16} /></button></div>{sendMutation.isError ? <p className="mt-2 text-[10px] font-bold text-[#a64036] dark:text-[#eb9a90]">{sendMutation.error instanceof Error ? sendMutation.error.message : (en ? "Could not save reply." : "تعذر حفظ الرد.")}</p> : null}</div></div> : <div className="order-3 grid min-h-[580px] place-items-center p-10 text-sm text-[hsl(var(--muted-foreground))] lg:order-none">{en ? "Select a conversation from the list" : "اختر محادثة من القائمة"}</div>}
    </div> : null}
  </section>;
}
