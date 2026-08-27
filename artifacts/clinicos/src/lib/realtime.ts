import { createContext, useContext, useEffect, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";

export type RealtimeStatus = "connecting" | "live" | "error";

export const RealtimeStatusContext = createContext<RealtimeStatus>("connecting");

export function useRealtimeStatus() {
  return useContext(RealtimeStatusContext);
}

type RealtimeConfig = {
  url: string;
  anonKey: string;
  accessToken: string;
  clinicId: string;
};

async function loadRealtimeConfig(signal: AbortSignal): Promise<RealtimeConfig> {
  const response = await fetch("/api/auth/realtime-token", {
    credentials: "include",
    cache: "no-store",
    signal,
  });
  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok || !payload || typeof payload !== "object") {
    throw new Error("Realtime authentication failed");
  }
  if (
    typeof payload.url !== "string" ||
    typeof payload.anonKey !== "string" ||
    typeof payload.accessToken !== "string" ||
    typeof payload.clinicId !== "string"
  ) {
    throw new Error("Realtime configuration is incomplete");
  }
  return payload as unknown as RealtimeConfig;
}

function invalidateInbox(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["inbox"] });
  void queryClient.invalidateQueries({ queryKey: ["inbox-operations"] });
}

export function useRealtimeSync(clinicId?: string): RealtimeStatus {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>("connecting");

  useEffect(() => {
    if (!clinicId) {
      setStatus("connecting");
      return;
    }

    const controller = new AbortController();
    let client: SupabaseClient | null = null;
    let disposed = false;

    const connect = async () => {
      try {
        const config = await loadRealtimeConfig(controller.signal);
        if (disposed || config.clinicId !== clinicId) return;

        client = createClient(config.url, config.anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          realtime: { params: { eventsPerSecond: 10 } },
        });
        client.realtime.setAuth(config.accessToken);

        const channel = client.channel(`clinic-inbox:${config.clinicId}`);
        const onDatabaseChange = () => {
          if (!disposed) invalidateInbox(queryClient);
        };
        channel.on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages", filter: `clinic_id=eq.${config.clinicId}` },
          onDatabaseChange,
        );
        channel.on(
          "postgres_changes",
          { event: "*", schema: "public", table: "conversations", filter: `clinic_id=eq.${config.clinicId}` },
          onDatabaseChange,
        );
        channel.subscribe((channelStatus) => {
          if (disposed) return;
          if (channelStatus === "SUBSCRIBED") setStatus("live");
          if (channelStatus === "CHANNEL_ERROR" || channelStatus === "TIMED_OUT" || channelStatus === "CLOSED") {
            setStatus("error");
          }
        });

        const tokenRefreshInterval = window.setInterval(async () => {
          try {
            const nextConfig = await loadRealtimeConfig(controller.signal);
            if (!disposed && nextConfig.clinicId === config.clinicId) {
              client?.realtime.setAuth(nextConfig.accessToken);
            }
          } catch {
            // The live channel remains authoritative; auth errors are surfaced by its status callback.
          }
        }, 45 * 60_000);

        return () => {
          disposed = true;
          window.clearInterval(tokenRefreshInterval);
          void client?.removeChannel(channel);
          client = null;
        };
      } catch (error) {
        if (!disposed && !(error instanceof DOMException && error.name === "AbortError")) {
          setStatus("error");
        }
        return undefined;
      }
    };

    let cleanup: (() => void) | undefined;
    void connect().then((dispose) => {
      cleanup = dispose;
      if (disposed) cleanup?.();
    });

    return () => {
      disposed = true;
      controller.abort();
      cleanup?.();
      void client?.removeAllChannels();
      client = null;
    };
  }, [clinicId, queryClient]);

  return status;
}
