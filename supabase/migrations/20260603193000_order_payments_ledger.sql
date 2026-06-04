-- 2026-06-03 — order_payments ledger for split / partial payments
--
-- Local migration draft. Do NOT run in production until code paths are reviewed
-- and staff UI/API wiring is ready.
--
-- Purpose:
--   Preserve the existing orders.status / orders.payment_method flow while adding
--   a first-class ledger for future split payments:
--     - eTransfer deposit + Clover balance
--     - cash + card
--     - overpayment detection
--     - refund / void history
--
-- Existing behavior remains source-of-truth until rollout code starts writing rows.

create table if not exists public.order_payments (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders(id) on delete cascade,
  amount              numeric(12, 2) not null check (amount > 0),
  currency            text not null default 'CAD' check (currency = 'CAD'),
  method              text not null check (method in ('clover','etransfer','cash','wave','other')),
  status              text not null default 'recorded' check (status in ('recorded','voided','refunded')),
  payer_name          text,
  payer_company       text,
  payer_email         text,
  external_reference  text,
  wave_invoice_payment_id text,
  wave_recorded_at    timestamptz,
  recorded_by         text,
  recorded_at         timestamptz not null default now(),
  notes               text,
  metadata            jsonb not null default '{}'::jsonb,
  constraint order_payments_payer_identity_check check (
    nullif(btrim(coalesce(payer_name, '')), '') is not null
    or nullif(btrim(coalesce(payer_company, '')), '') is not null
    or nullif(btrim(coalesce(payer_email, '')), '') is not null
  ),
  constraint order_payments_wave_recording_pair_check check (
    (wave_invoice_payment_id is null and wave_recorded_at is null)
    or (wave_invoice_payment_id is not null and wave_recorded_at is not null)
  )
);

create index if not exists order_payments_order_id_recorded_at_idx
  on public.order_payments (order_id, recorded_at desc);

create index if not exists order_payments_status_idx
  on public.order_payments (status, recorded_at desc);

create unique index if not exists order_payments_external_reference_unique
  on public.order_payments (method, external_reference)
  where external_reference is not null and status = 'recorded';

create unique index if not exists order_payments_wave_invoice_payment_id_unique
  on public.order_payments (wave_invoice_payment_id)
  where wave_invoice_payment_id is not null;

create index if not exists order_payments_payer_email_idx
  on public.order_payments (payer_email, recorded_at desc)
  where payer_email is not null;

alter table public.order_payments enable row level security;
-- No anon/auth policies on purpose. Service-role staff routes write/read this.

comment on table public.order_payments is
  'Ledger for split/partial order payments. Existing orders.status remains unchanged until rollout code derives paid/partial state from this ledger.';
