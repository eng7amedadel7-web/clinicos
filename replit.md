# ClinicOS (MERUNA)

Arabic-first clinic operations SaaS: unified multi-channel inbox, AI reception, appointments, waitlists, no-show recovery, patient 360, billing, and multi-branch management from one workspace.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/clinicos run dev` — run the frontend (port 5173, proxies /api to 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm run build:vercel` — build API server + frontend for Vercel deploy
- `pnpm --filter @workspace/api-server run test` — run Vitest suites
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: see `.env.example` (minimum: `DATABASE_URL`, `SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19, Vite 7, Tailwind CSS 4, wouter, TanStack Query, Radix UI (RTL ar/en)
- API: Express 5, helmet, express-rate-limit, pino
- DB: Supabase Postgres (RLS + RPC permissions) + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (server), Vite (frontend)
- Deploy: Vercel (static frontend + single serverless function via `api/index.mjs`)

## Where things live

- Frontend app: `artifacts/clinicos` (pages in `src/pages`, shared UI in `src/components`)
- API server: `artifacts/api-server` (routes in `src/routes`, helpers in `src/lib`)
- API contract source of truth: `lib/api-spec` (OpenAPI) → codegen into `lib/api-client-react` + `lib/api-zod` (never edit generated files)
- DB schema: `lib/db/src/schema.ts` (Drizzle) — authoritative SQL changes go to `supabase/migrations/`
- Theme/design tokens: `artifacts/clinicos/src/index.css`
- Vercel entry: `api/index.mjs` (rewrites `/api/*` with `__meruna_path`)

## Architecture decisions

- Single OpenAPI contract drives both server validation (Zod) and client hooks — no hand-written fetchers.
- Permissions enforced twice: Postgres RLS and `fn_has_clinic_permission` checks in protected routes.
- Channel secrets stay server-side; the frontend never sees provider tokens. Outbound replies go through a dispatcher (WasapFlow direct → Telegram direct → n8n webhook fallback).
- Whole Express app is bundled into one Vercel function; URL path is forwarded via `__meruna_path` query param.
- Multi-tenancy is clinic-scoped: every operational query filters by clinic id derived from the session, never from the client.

## Product

- Live dashboard, waitlist, follow-ups, no-shows, patient 360, appointment journey
- Unified inbox (WhatsApp/Telegram/Instagram/Messenger) with AI/Human handoff
- AI reception + voice agent with call logs
- Multi-branch clinic settings, staff roles, channel connections (1-click WhatsApp OTP onboarding)
- Billing via Paddle (Starter/Growth/Pro) with trial lifecycle
- Super-admin provisioning panel, smart CSV/Excel import, integrations hub (public REST API, outbound webhooks, pixels)

## User preferences

- Product and UI copy are Arabic-first (RTL); English is the secondary language.
- Commit style: conventional commits (`feat(scope): ...`).

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after editing the OpenAPI spec, then `pnpm run typecheck`.
- `pnpm install` is enforced (preinstall blocks npm/yarn).
- Frontend routes are lazy-loaded; keep new pages behind `React.lazy` to protect the main bundle budget (~500 kB warning).
- Generated files (`lib/api-client-react`, `lib/api-zod`, `*.tsbuildinfo`) must not be hand-edited or committed.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
