-- Tenant-scoped Paddle billing records. Provider writes happen server-side only.
create table if not exists public.clinic_subscriptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  paddle_subscription_id text not null,
  paddle_price_id text,
  plan text not null check (plan in ('starter', 'growth', 'pro')),
  billing_interval text not null check (billing_interval in ('month', 'year')),
  status text not null,
  trial_ends_at timestamptz,
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  scheduled_change jsonb not null default '{}'::jsonb check (jsonb_typeof(scheduled_change) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id),
  unique (paddle_subscription_id)
);

create table if not exists public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  paddle_customer_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id),
  unique (paddle_customer_id)
);

create table if not exists public.billing_transactions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  paddle_transaction_id text not null,
  status text not null,
  currency_code text not null default 'USD',
  total text,
  billed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (paddle_transaction_id)
);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  event_type text not null,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  occurred_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id)
);

create index if not exists clinic_subscriptions_clinic_idx on public.clinic_subscriptions (clinic_id);
create index if not exists billing_customers_clinic_idx on public.billing_customers (clinic_id);
create index if not exists billing_transactions_clinic_billed_idx on public.billing_transactions (clinic_id, billed_at desc nulls last);
create index if not exists billing_events_clinic_occurred_idx on public.billing_events (clinic_id, occurred_at desc nulls last);

alter table public.clinic_subscriptions enable row level security;
alter table public.billing_customers enable row level security;
alter table public.billing_transactions enable row level security;
alter table public.billing_events enable row level security;

revoke all on table public.clinic_subscriptions, public.billing_customers, public.billing_transactions, public.billing_events from anon, authenticated;
grant select on table public.clinic_subscriptions, public.billing_customers, public.billing_transactions, public.billing_events to authenticated;

drop policy if exists clinic_subscriptions_select on public.clinic_subscriptions;
create policy clinic_subscriptions_select
  on public.clinic_subscriptions
  for select
  to authenticated
  using (
    public.fn_has_clinic_permission(clinic_id, 'billing', 'invoices', 'read'::public.permission_action_enum)
    or public.fn_has_clinic_permission(clinic_id, 'billing', 'invoices', 'manage'::public.permission_action_enum)
  );

drop policy if exists billing_customers_select on public.billing_customers;
create policy billing_customers_select
  on public.billing_customers
  for select
  to authenticated
  using (
    public.fn_has_clinic_permission(clinic_id, 'billing', 'invoices', 'read'::public.permission_action_enum)
    or public.fn_has_clinic_permission(clinic_id, 'billing', 'invoices', 'manage'::public.permission_action_enum)
  );

drop policy if exists billing_transactions_select on public.billing_transactions;
create policy billing_transactions_select
  on public.billing_transactions
  for select
  to authenticated
  using (
    public.fn_has_clinic_permission(clinic_id, 'billing', 'invoices', 'read'::public.permission_action_enum)
    or public.fn_has_clinic_permission(clinic_id, 'billing', 'invoices', 'manage'::public.permission_action_enum)
  );

drop policy if exists billing_events_select on public.billing_events;
create policy billing_events_select
  on public.billing_events
  for select
  to authenticated
  using (
    public.fn_has_clinic_permission(clinic_id, 'billing', 'invoices', 'read'::public.permission_action_enum)
    or public.fn_has_clinic_permission(clinic_id, 'billing', 'invoices', 'manage'::public.permission_action_enum)
  );
