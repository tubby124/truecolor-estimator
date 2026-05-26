-- 2026-05-26 — Webhook event log
--
-- Records every inbound webhook call to /api/webhooks/wave so we can answer
-- "did Wave actually fire?" and "did the event match an order?" from the
-- /staff/lifecycle dashboard — without waiting for Telegram alerts or manually
-- checking Railway logs.
--
-- event_source  : currently only "wave", extensible to "resend", "clover", etc.
-- event_type    : the resourceType+status from the payload (e.g. "invoice.paid")
-- resource_id   : the Wave invoice ID (or equivalent) from the payload
-- matched_order_id : set when we found an orders row for this resource_id
-- ok            : true = event was fully processed, false = signature fail / parse error / no match
-- detail        : short human-readable note (e.g. "order TC-0042 → payment_received", or error msg)

create table if not exists public.webhook_events (
  id               bigint generated always as identity primary key,
  received_at      timestamptz not null default now(),
  event_source     text        not null,   -- "wave" | "resend" | ...
  event_type       text        not null,   -- "invoice.paid" | "email.delivered" | ...
  resource_id      text,                   -- wave_invoice_id, resend message_id, etc.
  matched_order_id uuid,                   -- FK to orders.id if we found a match
  ok               boolean     not null default true,
  detail           text
);

create index if not exists webhook_events_source_received_idx
  on public.webhook_events (event_source, received_at desc);

create index if not exists webhook_events_received_idx
  on public.webhook_events (received_at desc);

comment on table public.webhook_events is
  'Audit log of every inbound webhook. ok=false rows = silent failures worth investigating. Read by /staff/lifecycle WaveWebhookPanel.';

alter table public.webhook_events enable row level security;
-- service role only (crons + webhook routes use createServiceClient which bypasses RLS)
