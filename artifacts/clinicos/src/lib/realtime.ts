import { useEffect } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";

// Realtime is an optional liveness layer on top of the SSE stream. It only
// activates when the Vite env exposes a Supabase URL + anon key; otherwise the
// existing SSE invalidation remains the source of live updates.
//
// Security note: we subscribe to WAL events and use them *only* as a
// "something changed, refetch" signal. The event payload is never read and the
// subsequent refetch goes through the authenticated /api (RLS-enforced), so no
// cross-tenant row data can leak through this channel.
const REALTIME_TABLES = [
  "appointments",
  "conversations",
  "messages",
  "follow_up_cases",
  "no_show_cases",
  "patients",
  "appointment_waitlists",
] as const;

function buildClient(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 5 } },
  });
}

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const client = buildClient();
    if (!client) return;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
    };

    const channel = client.channel("clinic-live-sync");
    for (const table of REALTIME_TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => invalidate());
    }
    channel.subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [queryClient]);
}
