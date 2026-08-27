import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import router from "./routes";
import { paddleWebhook } from "./routes/billing";
import { logger } from "./lib/logger";
import { readSession, writeSession, clearSession, sessionNeedsRefresh, shouldThrottleRefresh, SESSION_COOKIE } from "./lib/session";
import { supabaseAuthRequest } from "./lib/supabase";

const app: Express = express();

// The API always runs behind exactly one trusted proxy hop (the Vercel edge,
// or a local dev proxy), which owns X-Forwarded-For; without this, every
// request shares the proxy IP and rate limits would collapse into one bucket.
// Exactly one hop keeps clients from spoofing extra forwarded entries.
app.set("trust proxy", 1);

app.use(
  helmet({
    // The SPA is served from the same origin in production; the API only emits JSON,
    // so no CSP directive is needed here — the hosting layer sets document headers.
    contentSecurityPolicy: false,
  }),
);

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
const sessionSecret = process.env.SESSION_SECRET?.trim();
if (isProduction && !sessionSecret) {
  // A known default secret would let anyone forge the signed session cookie,
  // which is the sole source of clinic scoping for every API route.
  throw new Error("SESSION_SECRET must be set in production; refusing to start with a guessable cookie secret.");
}
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
app.use(cookieParser(sessionSecret ?? "development-session-secret"));

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

// Per-IP limits. The in-memory store is per serverless instance, so these are a
// coarse abuse guard (brute force, email flooding), not a hard global ceiling.
const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in a few minutes." },
});
const recoveryLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many recovery requests. Please try again later." },
});
const publicQueueLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});
const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/forgot-password", recoveryLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/public/queue", publicQueueLimiter);
app.use("/api", apiLimiter);

app.use("/api", router);

export default app;
