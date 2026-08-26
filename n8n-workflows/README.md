# n8n workflows — ClinicOS

Importable workflow definitions for the parts of ClinicOS that run as n8n automations
(the API server falls back to these when no direct provider adapter is configured).

## inbox-outbound.json

Delivers inbox replies to external channels. Triggered by the API's
`dispatchOutbound()` (see `artifacts/api-server/src/lib/outbound.ts`) via the
webhook at `POST /webhook/clinicos-inbox-outbound`.

**Flow:** webhook → fetch conversation → fetch queued message → fetch channel →
fetch patient (recipient) → route by channel type → send (WhatsApp Cloud API) →
update `messages.message_status` (`sent`/`failed`) → respond.

### n8n credentials / environment

Set these in n8n (Credentials or environment variables):

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | anon key (apikey header) |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key (bypasses RLS for delivery) |
| `WHATSAPP_TOKEN` | Meta WhatsApp Cloud API access token |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business phone number id |

### Wiring from ClinicOS

Set on the API service (Base44 secrets or env):

- `N8N_INBOX_OUTBOUND_WEBHOOK` — full `https://…/webhook/clinicos-inbox-outbound` URL.
- `N8N_INBOX_OUTBOUND_TOKEN` (optional) — bearer token the workflow validates.

> Direct provider adapters (`artifacts/api-server/src/lib/channels.ts`) take
> precedence when configured (e.g. `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID`
> on the API). The workflow then only runs for channels without a direct adapter.

## Import

In n8n: **Workflows → Import from File** → select `inbox-outbound.json` →
activate. Use the produced production webhook URL as `N8N_INBOX_OUTBOUND_WEBHOOK`.
