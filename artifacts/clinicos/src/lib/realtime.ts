import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";

export type RealtimeStatus = "connecting" | "live" | "error";

export const RealtimeStatusContext = createContext<RealtimeStatus>("connecting");

export function useRealtimeStatus() {
  return useContext(RealtimeStatusContext);
}

export type ClinicRealtimeEvent = {
  type: string;
  data: Record<string, unknown>;
  at: string;
};

type RealtimeListener = (event: ClinicRealtimeEvent) => void;

class RealtimeEventHub {
  private listeners = new Set<RealtimeListener>();

  subscribe(listener: RealtimeListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: ClinicRealtimeEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("[RealtimeHub] Listener error:", err);
      }
    }
  }
}

export const realtimeHub = new RealtimeEventHub();

type RealtimeConfig = {
  url: string;
  anonKey: string;
  accessToken: string;
  clinicId: string;
};

type DatabaseChange = {
  eventType?: "INSERT" | "UPDATE" | "DELETE";
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
};

async function loadRealtimeConfig(signal: AbortSignal): Promise<RealtimeConfig | null> {
  try {
    const response = await fetch("/api/auth/realtime-token", {
      credentials: "include",
      cache: "no-store",
      signal,
    });
    if (!response.ok) return null;
    const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    if (!payload || typeof payload !== "object") return null;
    if (
      typeof payload.url !== "string" ||
      typeof payload.anonKey !== "string" ||
      typeof payload.accessToken !== "string" ||
      typeof payload.clinicId !== "string"
    ) {
      return null;
    }
    return payload as unknown as RealtimeConfig;
  } catch {
    return null;
  }
}

function getQueryKeysForEvent(eventType: string): string[][] {
  const keys: string[][] = [
    ["dashboard"],
    ["operations", "summary"],
  ];

  if (eventType.startsWith("inbox.")) {
    keys.push(["inbox"], ["inbox-operations"], ["inbox-saved-replies"], ["ai-reception-stats"]);
  } else if (eventType.startsWith("appointment.")) {
    keys.push(
      ["appointments"],
      ["calendar"],
      ["calendar-appointments"],
      ["booking-options"],
      ["operations"],
      ["appointment-journey"],
      ["operations", "waitlist"],
      ["operations", "follow-ups"],
      ["operations", "no-shows"],
    );
  } else if (eventType.startsWith("patient.")) {
    keys.push(["patients"], ["patient-360"], ["booking-options"]);
  } else if (eventType.startsWith("operations.")) {
    keys.push(
      ["operations"],
      ["operations", "waitlist"],
      ["operations", "follow-ups"],
      ["operations", "no-shows"],
      ["tasks"],
    );
  } else if (eventType.startsWith("queue.")) {
    keys.push(["queue"], ["appointments"], ["operations"]);
  } else if (eventType.startsWith("voice.")) {
    keys.push(["voice"], ["operations", "voice-agent"], ["ai-reception-stats"]);
  } else if (eventType.startsWith("settings.") || eventType.startsWith("template.")) {
    keys.push(["settings"], ["templates"], ["inbox-saved-replies"]);
  } else {
    keys.push(
      ["inbox"],
      ["inbox-operations"],
      ["appointments"],
      ["calendar-appointments"],
      ["patients"],
      ["operations"],
      ["calendar"],
      ["tasks"],
      ["voice"],
      ["queue"],
      ["ai-reception-stats"],
      ["templates"],
      ["billing"],
    );
  }

  return keys;
}

function createBatchInvalidator(queryClient: QueryClient) {
  const pendingKeys = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (eventType: string) => {
    for (const key of getQueryKeysForEvent(eventType)) {
      pendingKeys.add(JSON.stringify(key));
    }
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      for (const serializedKey of pendingKeys) {
        try {
          void queryClient.invalidateQueries({ queryKey: JSON.parse(serializedKey) as string[] });
        } catch {
          // ignore parsing error
        }
      }
      pendingKeys.clear();
      timer = null;
    }, 50);
  };
}

function eventForDatabaseChange(table: string, payload: DatabaseChange): ClinicRealtimeEvent {
  const row = payload.new ?? {};
  const eventType = payload.eventType ?? "UPDATE";

  if (table === "messages" && eventType === "INSERT") {
    const incoming = String(row.direction ?? "").toLowerCase() === "incoming";
    return {
      type: incoming ? "inbox.message_received" : "inbox.message_sent",
      data: {
        conversationId: typeof row.conversation_id === "string" ? row.conversation_id : undefined,
        messageId: typeof row.id === "string" ? row.id : undefined,
        content: typeof row.content === "string" ? row.content : undefined,
      },
      at: new Date().toISOString(),
    };
  }
  if (table === "appointments" && eventType === "INSERT") {
    return { type: "appointment.booked", data: {}, at: new Date().toISOString() };
  }
  if (table === "appointments" && String(row.appointment_status ?? "").toLowerCase() === "cancelled") {
    return { type: "appointment.cancelled", data: {}, at: new Date().toISOString() };
  }

  const eventByTable: Record<string, string> = {
    appointment_checkins: "appointment.updated",
    appointment_slots: "appointment.updated",
    appointment_waitlists: "operations.waitlist_updated",
    appointments: "appointment.updated",
    branches: "invalidate",
    channels: "inbox.invalidate",
    conversations: "inbox.invalidate",
    doctors: "invalidate",
    follow_up_cases: "operations.followup_updated",
    messages: "inbox.invalidate",
    no_show_cases: "operations.noshow_updated",
    patients: "patient.updated",
    saved_replies: "template.updated",
    services: "invalidate",
    voice_agent_call_logs: "voice.call_completed",
    voice_agent_configurations: "voice.updated",
    voice_knowledge_sources: "voice.knowledge_updated",
    voice_operational_settings: "voice.updated",
  };

  return { type: eventByTable[table] ?? "invalidate", data: {}, at: new Date().toISOString() };
}

export function useRealtimeSync(clinicId?: string): RealtimeStatus {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const batchInvalidateRef = useRef(createBatchInvalidator(queryClient));

  useEffect(() => {
    batchInvalidateRef.current = createBatchInvalidator(queryClient);
  }, [queryClient]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") return;

    let source: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = 1000;
    let isCleanedUp = false;

    const connectSSE = () => {
      if (isCleanedUp) return;

      try {
        source = new EventSource("/api/inbox/stream", { withCredentials: true });

        source.onopen = () => {
          retryDelay = 1000;
          setStatus("live");
        };

        const handleIncomingEvent = (type: string, e: MessageEvent) => {
          try {
            const data = e.data ? (JSON.parse(e.data) as Record<string, unknown>) : {};
            const eventPayload: ClinicRealtimeEvent = {
              type,
              data,
              at: new Date().toISOString(),
            };

            realtimeHub.emit(eventPayload);
            batchInvalidateRef.current(type);
          } catch {
            batchInvalidateRef.current(type);
          }
        };

        const domainEvents = [
          "inbox.message_received",
          "inbox.message_sent",
          "inbox.handoff_requested",
          "inbox.mode_changed",
          "inbox.note_added",
          "inbox.snoozed",
          "inbox.unsnoozed",
          "inbox.outcome_set",
          "appointment.booked",
          "appointment.updated",
          "appointment.cancelled",
          "appointment.checked_in",
          "appointment.called",
          "appointment.completed",
          "patient.created",
          "patient.updated",
          "patient.deleted",
          "operations.waitlist_updated",
          "operations.followup_updated",
          "operations.noshow_updated",
          "queue.ticket_created",
          "queue.link_issued",
          "queue.ticket_updated",
          "voice.call_started",
          "voice.call_completed",
          "voice.knowledge_updated",
          "settings.updated",
          "template.created",
          "template.updated",
          "template.deleted",
          "invalidate",
        ];

        for (const eventName of domainEvents) {
          source.addEventListener(eventName, (e: MessageEvent) => handleIncomingEvent(eventName, e));
        }

        source.addEventListener("heartbeat", () => setStatus("live"));
        source.addEventListener("connected", () => setStatus("live"));

        source.onerror = () => {
          if (source) {
            source.close();
            source = null;
          }
          if (!isCleanedUp) {
            setStatus("connecting");
            reconnectTimeout = setTimeout(connectSSE, retryDelay);
            retryDelay = Math.min(retryDelay * 1.5, 10000);
          }
        };
      } catch (err) {
        console.error("[Realtime] Failed to initialize SSE stream", err);
        setStatus("error");
      }
    };

    connectSSE();

    return () => {
      isCleanedUp = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (source) {
        source.close();
        source = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!clinicId) return;

    const controller = new AbortController();
    let client: SupabaseClient | null = null;
    let channel: ReturnType<SupabaseClient["channel"]> | null = null;
    let disposed = false;

    const connectSupabase = async () => {
      const config = await loadRealtimeConfig(controller.signal);
      if (disposed || !config || config.clinicId !== clinicId) return;

      try {
        client = createClient(config.url, config.anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          realtime: { params: { eventsPerSecond: 15 } },
        });
        client.realtime.setAuth(config.accessToken);

        channel = client.channel(`clinic-realtime:${config.clinicId}`);

        const handleChange = (table: string, payload: DatabaseChange) => {
          if (disposed) return;
          const event = eventForDatabaseChange(table, payload);
          realtimeHub.emit(event);
          batchInvalidateRef.current(event.type);
        };

        const tables = [
          "appointment_checkins",
          "appointment_slots",
          "appointment_waitlists",
          "appointments",
          "branches",
          "channels",
          "conversations",
          "doctors",
          "follow_up_cases",
          "messages",
          "no_show_cases",
          "patients",
          "saved_replies",
          "services",
          "voice_agent_call_logs",
          "voice_agent_configurations",
          "voice_knowledge_sources",
          "voice_operational_settings",
        ] as const;

        for (const table of tables) {
          channel.on(
            "postgres_changes",
            { event: "*", schema: "public", table, filter: `clinic_id=eq.${config.clinicId}` },
            (payload) => handleChange(table, payload as DatabaseChange),
          );
        }

        channel.subscribe((channelStatus) => {
          if (disposed) return;
          if (channelStatus === "SUBSCRIBED") setStatus("live");
        });
      } catch {
        // SSE remains authoritative
      }
    };

    void connectSupabase();

    return () => {
      disposed = true;
      controller.abort();
      void client?.removeAllChannels();
      client = null;
      channel = null;
    };
  }, [clinicId]);

  return status;
}

export function useRealtimeSubscription(handler: (event: ClinicRealtimeEvent) => void) {
  useEffect(() => realtimeHub.subscribe(handler), [handler]);
}
