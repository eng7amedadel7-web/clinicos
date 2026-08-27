import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import router from "./routes";
import { paddleWebhook } from "./routes/billing";
import { logger } from "./lib/logger";
import { readSession, writeSession, clearSession, sessionNeedsRefresh, shouldThrottleRefresh, SESSION_COOKIE } from "./lib/session";
import { supabaseAuthRequest } from "./lib/supabase";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// The app calls the API same-origin in production; only dev workflows and the
// configured app origin ever need cross-origin cookie access.
const corsOrigins = (process.env.ALLOWED_ORIGINS ?? process.env.PUBLIC_APP_URL ?? "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
if (corsOrigins.length) {
  app.use(cors({ origin: corsOrigins, credentials: true }));
} else if (isProduction) {
  // Fail closed in hosted environments when the allowlist is missing.
  app.use(cors({ origin: false, credentials: true }));
} else {
  app.use(cors());
}

// Vercel's Node adapter may pre-populate req.cookies before Express middleware runs.
// cookie-parser returns early when that field exists, which skips req.secret and
// makes signed session cookies fail at res.cookie({ signed: true }).
app.use((req, _res, next) => {
  delete (req as typeof req & { cookies?: unknown }).cookies;
  delete (req as typeof req & { signedCookies?: unknown }).signedCookies;
  next();
});
app.use(cookieParser(process.env.SESSION_SECRET ?? "development-session-secret"));

// Supabase JWTs expire hourly while the session cookie lasts a week; refresh the
// stored tokens transparently before the rest of the API sees an expired token.
app.use(async (req, res, next) => {
  const session = readSession(req);
  if (!session || !sessionNeedsRefresh(session) || shouldThrottleRefresh(session.userId)) {
    next();
    return;
  }
  const refreshed = await supabaseAuthRequest<{
    access_token?: string;
    refresh_token?: string;
  }>("/auth/v1/token?grant_type=refresh_token", { refresh_token: session.refreshToken });
  if (!refreshed.ok || !refreshed.data?.access_token) {
    // A rejected refresh means the session is gone; force a fresh sign-in
    // instead of letting every route fail with confusing 401s later.
    clearSession(res);
    next();
    return;
  }
  const updated = {
    ...session,
    accessToken: refreshed.data.access_token,
    refreshToken: refreshed.data.refresh_token ?? session.refreshToken,
  };
  writeSession(res, updated);
  // Downstream middleware and routes re-read req.signedCookies, so swap in the
  // refreshed payload before the request continues.
  req.signedCookies[SESSION_COOKIE] = JSON.stringify(updated);
  next();
});

app.post("/api/billing/webhook", express.raw({ type: "application/json" }), paddleWebhook);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
