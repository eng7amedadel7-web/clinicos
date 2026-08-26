# ClinicOS / MERUNA SYSTEM — Base44 dev environment

Arabic-first clinic operations SaaS. pnpm workspace monorepo.

## Architecture

- **`artifacts/clinicos`** (`@workspace/clinicos`) — Vite + React 19 frontend. Dev server on `PORT` (3000 in Base44). `allowedHosts: true`, binds `0.0.0.0`. Calls the API via relative `/api/*` paths; in dev these are proxied to the API server (see `vite.config.ts` `server.proxy`).
- **`artifacts/api-server`** (`@workspace/api-server`) — Express 5 API. `dev` script = esbuild bundle (`build.mjs`) then `node dist/index.mjs` (no live reload; restart the `api` service after API code changes). Listens on `PORT` (5000). Auth + data go through the **Supabase REST API** (`src/lib/supabase.ts`), NOT the local Drizzle DB.
- **`lib/db`** (`@workspace/db`) — Drizzle/Postgres helpers + `drizzle-kit push`. The schema in `lib/db/src/schema` is currently empty; the real DB schema lives in **`supabase/migrations/*.sql`** (Supabase-hosted Postgres). The API server does not import `@workspace/db` at runtime, so `DATABASE_URL` is not required to boot.
- **`lib/api-client-react`** / **`lib/api-zod`** — Orval-generated React Query hooks + Zod schemas from `lib/api-spec/openapi.yaml`.

## Running in Base44

```
docker compose -f docker-compose.base44.yml up -d --build
```

- `setup` one-shot service runs `pnpm install --frozen-lockfile` (store kept in `.pnpm-store/` inside the repo so it's shared across containers).
- `web` (Vite) is the preview entry point on host port **3000**.
- `api` (Express) runs on internal port 5000; Vite proxies `/api/*` to it.
- Both app services bind-mount the repo and run from source.

## Verification

- `curl -sf -H "Host: external-preview.example.com" http://localhost:3000/` returns the app HTML.
- `curl -sf http://localhost:3000/api/healthz` returns `{"status":"ok"}` (proxied to the API).
- The login page renders even without Supabase credentials; auth/data endpoints return 503 until `SUPABASE_*` secrets are provided.

## Secrets (external — not in repo)

The API talks to a hosted Supabase project. Without these the app still boots and renders the login page, but login and all data endpoints fail (503):

- `SUPABASE_URL` — project URL
- `SUPABASE_PUBLISHABLE_KEY` — anon public key
- `SUPABASE_SECRET_KEY` — service_role secret

Optional (billing): `PADDLE_API_KEY`, `PADDLE_CLIENT_TOKEN`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_PRICE_*` (all have dev defaults).

## Gotchas

- Use **pnpm**, never npm/yarn (the root `preinstall` script enforces it).
- API server has no live reload — after editing `artifacts/api-server/src/*`, run `docker compose -f docker-compose.base44.yml restart api` then `reload_preview`.
- `pnpm-workspace.yaml` sets `minimumReleaseAge: 1440` (1 day); `--frozen-lockfile` bypasses it, but a fresh `pnpm install` without the lockfile may reject very new packages.
- The Vite `server.proxy` target defaults to `http://localhost:5000` for local dev outside compose; in compose it is overridden to `http://api:5000` via `VITE_API_PROXY_TARGET`.
