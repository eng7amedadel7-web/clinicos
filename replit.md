# ClinicOS

ClinicOS is an Arabic-first clinic operations workspace for appointments, patient records, AI reception, voice calls, follow-ups, and no-show prevention.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/clinicos/src/components/app-shell.tsx` — persistent RTL workspace shell and navigation.
- `artifacts/clinicos/src/pages/dashboard.tsx` — operational overview focused on today's schedule and action-required items.
- `artifacts/clinicos/src/pages/operations-pages.tsx` — interactive frontend-first operations surfaces.
- `artifacts/clinicos/src/index.css` — ClinicOS theme tokens, typography, and responsive styling.

## Architecture decisions

- The first release is frontend-first with local demo state so the core workflow can be validated before connecting production services.
- The primary dashboard is operational rather than analytics-heavy: it surfaces what the reception team needs to do next.
- The app is Arabic-first and RTL, with navigation organized around operations, communication, and clinic management.

## Product

The current frontend includes the operational dashboard, appointment management, patient search and profiles, inbox with AI/human handling, tasks, waitlist, follow-ups, AI receptionist controls, voice-agent call views, clinic management pages, and settings.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
