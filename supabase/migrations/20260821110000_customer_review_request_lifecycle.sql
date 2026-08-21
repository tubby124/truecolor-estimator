-- 2026-08-21 — durable, customer-capped review request lifecycle
--
-- A review request is a customer-level relationship, not an order-level
-- transaction. These tables ensure a repeat buyer cannot be re-solicited on
-- every order and give staff an explicit, auditable suppression control.

create table if not exists public.customer_review_state (
  customer_id                uuid primary key references public.customers(id) on delete cascade,
  last_review_request_at     timestamptz,
  last_review_order_id       uuid references public.orders(id) on delete set null,
  review_confirmed_at        timestamptz,
  suppressed_at              timestamptz,
  suppression_reason         text,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  constraint customer_review_state_suppression_reason_check
    check (suppressed_at is null or coalesce(length(trim(suppression_reason)), 0) > 0)
);

create table if not exists public.review_request_cycles (
  id                         uuid primary key default gen_random_uuid(),
  order_id                   uuid not null unique references public.orders(id) on delete cascade,
  customer_id                uuid not null references public.customers(id) on delete cascade,
  eligible_at                timestamptz not null,
  initial_sent_at            timestamptz,
  reminder_sent_at           timestamptz,
  suppressed_at              timestamptz,
  suppression_reason         text,
  provider_initial_message_id text,
  provider_reminder_message_id text,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  constraint review_request_cycles_order_customer_unique unique (order_id, customer_id),
  constraint review_request_cycles_reminder_after_initial
    check (reminder_sent_at is null or initial_sent_at is not null),
  constraint review_request_cycles_suppression_reason_check
    check (suppressed_at is null or coalesce(length(trim(suppression_reason)), 0) > 0)
);

create index if not exists customer_review_state_cadence_idx
  on public.customer_review_state (last_review_request_at desc nulls last);
create index if not exists review_request_cycles_due_idx
  on public.review_request_cycles (eligible_at)
  where initial_sent_at is null and suppressed_at is null;
create index if not exists review_request_cycles_reminder_due_idx
  on public.review_request_cycles (initial_sent_at)
  where reminder_sent_at is null and suppressed_at is null;

alter table public.customer_review_state enable row level security;
alter table public.review_request_cycles enable row level security;

-- Preserve historical review asks before enabling the new scheduler. Old rows
-- without a linked customer are intentionally ignored: we cannot safely infer
-- identity. For known customer emails, conservatively set the cadence from the
-- latest prior request (or migration time if legacy data lacks a timestamp).
insert into public.customer_review_state (
  customer_id,
  last_review_request_at,
  created_at,
  updated_at
)
select
  c.id,
  coalesce(max(el.sent_at), now()),
  now(),
  now()
from public.email_log el
join public.customers c on lower(c.email) = lower(el.to_address)
where el.subject ilike 'How did your % turn out?'
group by c.id
on conflict (customer_id) do update
set
  last_review_request_at = greatest(
    coalesce(customer_review_state.last_review_request_at, '-infinity'::timestamptz),
    excluded.last_review_request_at
  ),
  updated_at = now();

-- Retain order-linked historical evidence for staff/audit views.
insert into public.review_request_cycles (
  order_id,
  customer_id,
  eligible_at,
  initial_sent_at,
  created_at,
  updated_at
)
select
  el.order_id,
  el.customer_id,
  coalesce(el.sent_at, now()),
  el.sent_at,
  now(),
  now()
from public.email_log el
where el.subject ilike 'How did your % turn out?'
  and el.order_id is not null
  and el.customer_id is not null
on conflict (order_id) do nothing;

comment on table public.customer_review_state is
  'Per-customer review cadence and permanent suppression state. Service-role only.';
comment on table public.review_request_cycles is
  'Per-order review request timeline: initial ask and one optional reminder. Service-role only.';
