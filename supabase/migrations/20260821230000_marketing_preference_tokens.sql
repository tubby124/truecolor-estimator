-- One-time opaque tokens for historical customer preference links.
-- Raw tokens are random server-generated values, never derived from email.
create table if not exists public.marketing_preference_tokens (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  token text not null unique,
  purpose text not null default 'historical_repermission',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint marketing_preference_tokens_purpose_check
    check (purpose in ('historical_repermission'))
);
create index if not exists marketing_preference_tokens_customer_idx
  on public.marketing_preference_tokens (customer_id, expires_at desc);
alter table public.marketing_preference_tokens enable row level security;
