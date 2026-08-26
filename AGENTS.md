# ClinicOS — Base44 dev notes

Arabic-first clinic operations SaaS. pnpm monorepo: a Vite/React 19 frontend
(`@workspace/clinicos`) + an Express 5 API (`@workspace/api-server`). All auth &
data go through **Supabase** (GoTrue auth + PostgREST). The `@workspace/db`
(Drizzle) package is present but its schema is empty and the API server does NOT
import it — `DATABASE_URL` is NOT required to boot.

## Running here
- `docker compose -f docker-compose.base44.yml up -d` — install-deps (one-shot) → api → web.
- Web entry on host port **3000** (Vite dev, port 5173 in container).
- API on internal port 5000; the Vite dev server proxies `/api` → `http://api:5000`
  (single-origin, cookie-based sessions). Proxy target via `API_PROXY_TARGET`.
- API `dev` script = esbuild bundle + `node dist/index.mjs` (no watch). Backend
  changes need `docker compose -f docker-compose.base44.yml restart api`.

## Required env / secrets
- API: `PORT` (5000), `SESSION_SECRET` (inline dev default), `NODE_ENV=development`.
- Supabase (external, via `/run/base44/app.env`): `SUPABASE_URL`,
  `SUPABASE_PUBLISHABLE_KEY` (anon), `SUPABASE_SECRET_KEY` (service role).
  Without these the API boots but auth/data routes return 503.
- Paddle (optional): `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_CLIENT_TOKEN`.
- Outbound inbox messaging: `N8N_INBOX_OUTBOUND_WEBHOOK` (+ `_TOKEN`).

## Architecture notes
- Frontend fetches use relative `/api/...` with `credentials: "include"`.
- `/` is a public marketing page (no auth). `/login`, `/register` public. Everything
  under `/dashboard`, `/patients`, etc. is gated by a session cookie set on login.
- Realtime: `/api/realtime/:resource` SSE endpoint subscribes to Supabase Realtime
  (RLS-scoped via the user's access token) and pushes `invalidate` events. Client
  `useRealtimeInvalidation` (src/lib/use-realtime.ts) invalidates React Query cache
  and falls back to polling when SSE is down. Used by the inbox.
- Code-splitting: route pages are `React.lazy`-loaded with a Suspense fallback.
- pnpm lockfile must NOT be installed with `--frozen-lockfile` here (overrides
  mismatch with the corepack pnpm version); install-deps uses `--no-frozen-lockfile`.

## Verify it works
- `curl -sf -H "Host: x.preview" http://localhost:3000/` → 200 HTML.
- `curl -sf http://localhost:3000/api/healthz` → `{"status":"ok"}`.
- `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/realtime/inbox` → 401 (auth wired).
