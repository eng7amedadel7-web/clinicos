import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Subscribe to a server-side realtime SSE stream for the given resource and
 * invalidate the matching React Query cache when the server pushes an
 * `invalidate` event (triggered by Supabase Realtime postgres_changes).
 *
 * Replaces client-side polling. If the SSE stream is unavailable (e.g. Supabase
 * not configured, network drop), `connected` stays false so callers can fall
 * back to a `refetchInterval`. The hook auto-reconnects with backoff.
 */
export function useRealtimeInvalidation(resource: string, queryKey: unknown[]): boolean {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let es: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    const connect = () => {
      es = new EventSource(`/api/realtime/${resource}`, { withCredentials: true });

      es.onopen = () => setConnected(true);

      es.addEventListener("invalidate", () => {
        queryClient.invalidateQueries({ queryKey });
      });

      es.onerror = () => {
        setConnected(false);
        es?.close();
        if (!disposed) retry = setTimeout(connect, 5_000);
      };
    };

    connect();

    return () => {
      disposed = true;
      clearTimeout(retry);
      es?.close();
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  return connected;
}
