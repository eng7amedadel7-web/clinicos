-- Public queue links are opaque, server-resolved access grants for an existing booking.
-- The canonical booking id in the current schema is appointments.public_id.
create table if not exists public.public_queue_links (
  id uuid primary key default gen_random_uuid(),
  booking_id text not null references public.appointments(public_id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null default (now() + interval '7 days'),
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz,
  constraint public_queue_links_token_hash_length check (length(token_hash) = 64)
);

create unique index if not exists public_queue_links_one_active_per_booking
  on public.public_queue_links (booking_id)
  where revoked_at is null;

create index if not exists public_queue_links_active_lookup
  on public.public_queue_links (token_hash, expires_at)
  where revoked_at is null;

alter table public.public_queue_links enable row level security;

comment on table public.public_queue_links is
  'Opaque public queue access links. booking_id references appointments.public_id; raw tokens are never stored.';
comment on column public.public_queue_links.booking_id is
  'Canonical booking identifier from appointments.public_id; never accepted as a tenant selector from the browser.';
comment on column public.public_queue_links.token_hash is
  'SHA-256 hash of the opaque URL token.';

revoke all on table public.public_queue_links from public, anon, authenticated;
grant all on table public.public_queue_links to service_role;
