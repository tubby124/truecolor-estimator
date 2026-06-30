-- 2026-06-30 — Payment attempts ledger
--
-- Durable payment-attempt evidence separate from orders.status. Redirect pages
-- read this table, but never mutate order payment status.

create table if not exists public.payment_attempts (
  id                         bigint generated always as identity primary key,
  order_id                   uuid references public.orders(id) on delete set null,
  provider                   text not null default 'clover',
  status                     text not null check (
    status in (
      'checkout_opened',
      'card_declined',
      'payment_captured',
      'webhook_missing_recovered',
      'abandoned',
      'ambiguous'
    )
  ),
  amount                     numeric(10, 2),
  clover_checkout_session_id text,
  clover_order_id            text,
  clover_payment_id          text,
  failure_code               text,
  failure_label              text,
  failure_detail             text,
  customer_message           text,
  raw_event                  jsonb,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create index if not exists payment_attempts_order_created_idx
  on public.payment_attempts (order_id, created_at desc);

create index if not exists payment_attempts_status_created_idx
  on public.payment_attempts (status, created_at desc);

create index if not exists payment_attempts_clover_session_idx
  on public.payment_attempts (clover_checkout_session_id)
  where clover_checkout_session_id is not null;

create index if not exists payment_attempts_clover_payment_idx
  on public.payment_attempts (clover_payment_id)
  where clover_payment_id is not null;

comment on table public.payment_attempts is
  'Payment-attempt ledger for Clover checkout opens, declines, captures, reconcile recoveries, and abandoned attempts. Orders.status remains the payment truth.';

alter table public.payment_attempts enable row level security;
-- service role only: API routes read/write through createServiceClient.
