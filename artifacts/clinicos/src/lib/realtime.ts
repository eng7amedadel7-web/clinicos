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

// Map event types to specific React Query keys for targeted, zero-flicker background refetching
function getQueryKeysForEvent(eventType: string): string[][] {
  const keys: string[][] = [["dashboard"]];

  if (eventType.startsWith("inbox.")) {
    keys.push(["inbox"], ["inbox-operations"]);
  } else if (eventType.startsWith("appointment.")) {
    keys.push(["appointments"], ["calendar"], ["operations"], ["appointment-journey"]);
  } else if (eventType.startsWith("patient.")) {
    keys.push(["patients"], ["patient-360"]);
  } else if (eventType.startsWith("operations.")) {
    keys.push(["operations"], ["tasks"]);
  } else if (eventType.startsWith("queue.")) {
    keys.push(["queue"], ["appointments"], ["operations"]);
  } else if (eventType.startsWith("voice.")) {
    keys.push(["voice"], ["operations", "voice-agent"]);
  } else {
    keys.push(["inbox"], ["inbox-operations"], ["appointments"], ["patients"], ["operations"], ["calendar"]);
  }

  return keys;
}

// Debounced batch query invalidator (60ms window) to prevent UI thrashing during rapid events
function createBatchInvalidator(queryClient: QueryClient) {
  const pendingKeys = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (eventType: string) => {
    const keys = getQueryKeysForEvent(eventType);
    for (const key of keys) {
      pendingKeys.add(JSON.stringify(key));
    }

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      for (const serializedKey of pendingKeys) {
        try {
          const queryKey = JSON.parse(serializedKey) as string[];
          void queryClient.invalidateQueries({ queryKey });
        } catch {
          // ignore parsing error
        }
      }
      pendingKeys.clear();
      timer = null;
    }, 60);
  };
}

export function useRealtimeSync(clinicId?: string): RealtimeStatus {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const batchInvalidateRef = useRef(createBatchInvalidator(queryClient));

  useEffect(() => {
    batchInvalidateRef.current = createBatchInvalidator(queryClient);
  }, [queryClient]);

  // Primary Liveness Layer: Server-Sent Events (SSE) Stream
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

            // Broadcast to all UI listeners (notifications, counters, pages)
            realtimeHub.emit(eventPayload);

            // Invalidate targeted queries silently in background
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
          "patient.created",
          "patient.updated",
          "patient.deleted",
          "operations.waitlist_updated",
          "operations.followup_updated",
          "operations.noshow_updated",
          "queue.link_issued",
          "queue.ticket_updated",
          "voice.knowledge_updated",
          "invalidate",
        ];

        for (const eventName of domainEvents) {
          source.addEventListener(eventName, (e: MessageEvent) => handleIncomingEvent(eventName, e));
        }

        source.addEventListener("heartbeat", () => setStatus("live"));

        source.onerror = () => {
          if (source) {
            source.close();
            source = null;
          }
          if (!isCleanedUp) {
            setStatus("connecting");
            reconnectTimeout = setTimeout(connectSSE, retryDelay);
            retryDelay = Math.min(retryDelay * 1.5, 15000);
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

  // Secondary Liveness Layer: Direct Supabase Realtime channel (if configured/available)
  useEffect(() => {
    if (!clinicId) return;

    const controller = new AbortController();
    let client: SupabaseClient | null = null;
    let disposed = false;

    const connectSupabase = async () => {
      const config = await loadRealtimeConfig(controller.signal);
      if (disposed || !config || config.clinicId !== clinicId) return;

      try {
        client = createClient(config.url, config.anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          realtime: { params: { eventsPerSecond: 10 } },
        });
        client.realtime.setAuth(config.accessToken);

        const channel = client.channel(`clinic-inbox:${config.clinicId}`);
        const onDatabaseChange = (table: string) => {
          if (!disposed) {
            batchInvalidateRef.current(`table.${table}`);
          }
        };

        channel.on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `clinic_id=eq.${config.clinicId}` }, () => onDatabaseChange("messages"));
        channel.on("postgres_changes", { event: "*", schema: "public", table: "conversations", filter: `clinic_id=eq.${config.clinicId}` }, () => onDatabaseChange("conversations"));
        channel.on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `clinic_id=eq.${config.clinicId}` }, () => onDatabaseChange("appointments"));

        channel.subscribe((channelStatus) => {
          if (disposed) return;
          if (channelStatus === "SUBSCRIBED") setStatus("live");
        });
      } catch {
        // SSE remains the primary authoritative sync channel
      }
    };

    void connectSupabase();

    return () => {
      disposed = true;
      controller.abort();
      void client?.removeAllChannels();
      client = null;
    };
  }, [clinicId]);

  return status;
}

export function useRealtimeSubscription(handler: (event: ClinicRealtimeEvent) => void) {
  useEffect(() => {
    return realtimeHub.subscribe(handler);
  }, [handler]);
}
