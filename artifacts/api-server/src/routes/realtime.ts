import { Router, type Request, type Response } from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readSession } from "../lib/session";

const router = Router();

/**
 * Realtime streaming over Server-Sent Events.
 *
 * Each client opens an SSE connection (cookie-authenticated). The server creates a
 * Supabase Realtime channel authenticated with the user's access token (RLS-scoped to
 * their clinic) and pushes `invalidate` events whenever the watched tables change,
 * so the client can refresh the relevant React Query cache instead of polling.
 *
 * If Supabase is not configured the endpoint responds 503 and the client falls back
 * to its normal `refetchInterval` polling.
 */
function realtimeConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = (process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY)?.trim();
  return url && key ? { url: url.replace(/\/+$/, ""), key } : null;
}

function sendSse(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

router.get("/realtime/:resource", async (req: Request, res: Response) => {
  const resource = req.params["resource"];
  if (resource !== "inbox") {
    res.status(404).json({ error: "Unknown realtime resource." });
    return;
  }

  const session = readSession(req);
  if (!session) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  const config = realtimeConfig();
  if (!config) {
    res.status(503).json({ error: "Realtime is not configured." });
    return;
  }

  // SSE headers (disable proxy buffering so events flush immediately).
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  sendSse(res, "ready", { resource });

  let client: SupabaseClient | null = null;
  let closed = false;

  try {
    client = createClient(config.url, config.key, {
      realtime: { params: { apikey: config.key } },
    });
    // Authenticate the realtime socket with the user's JWT so RLS scopes every
    // postgres_changes event to the clinics this user may access.
    await client.realtime.setAuth(session.accessToken);

    const channel = client.channel(`inbox:${session.clinicId}`);
    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: `clinic_id=eq.${session.clinicId}` },
        () => sendSse(res, "invalidate", { resource }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => sendSse(res, "invalidate", { resource }),
      )
      .subscribe();
  } catch (error) {
    req.log?.error({ err: error }, "Realtime subscription failed");
    sendSse(res, "error", { message: "Realtime subscription failed." });
  }

  // Heartbeat keeps the connection alive through proxies.
  const heartbeat = setInterval(() => {
    if (!closed) res.write(": ping\n\n");
  }, 25_000);

  req.on("close", () => {
    closed = true;
    clearInterval(heartbeat);
    try {
      client?.realtime.disconnect();
    } catch {
      /* ignore */
    }
    res.end();
  });
});

export default router;
