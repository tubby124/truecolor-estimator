-- 2026-05-26 — audit_events table
--
-- Universal event log. Every meaningful state transition writes a row here:
-- order.created, order.status_changed, order.refunded, customer.signed_up,
-- coupon.issued, coupon.redeemed, staff.replied, etc. Replaces the
-- inferred-from-timestamps Activity feed on /staff/lifecycle with a real
-- audit trail.
--
-- Read by src/app/staff/lifecycle/data.ts (Activity feed) + the per-customer
-- drill-down at /staff/lifecycle/customer/[email]. No PII beyond what's
-- already in orders/customers; ip + user_agent captured only where the
-- caller passes them.
--
-- Write helper: src/lib/audit/record.ts → recordAuditEvent().
-- Fail-quiet: a failed audit write must NEVER break the parent operation.

create table if not exists public.audit_events (
  id           uuid primary key default gen_random_uuid(),
  at           timestamptz not null default now(),
  -- actor that caused the event
  actor_type   text        not null check (actor_type in ('customer','staff','system','cron')),
  actor_id     text,                        -- email / staff_email / cron_name / null for system
  -- the event itself
  event_type   text        not null,        -- order.status_changed, coupon.issued, etc.
  entity_type  text        not null,        -- order, customer, quote, coupon
  entity_id    text        not null,        -- uuid or natural key
  -- structured detail (e.g. {from, to, amount, reason})
  detail       jsonb,
  -- optional request context
  ip           text,
  user_agent   text
);

create index if not exists audit_events_entity_idx
  on public.audit_events (entity_type, entity_id, at desc);

create index if not exists audit_events_at_idx
  on public.audit_events (at desc);

create index if not exists audit_events_actor_idx
  on public.audit_events (actor_type, actor_id, at desc);

-- Per-customer drill-down often filters by event_type
create index if not exists audit_events_type_idx
  on public.audit_events (event_type, at desc);

comment on table public.audit_events is
  'Universal event log. Written by src/lib/audit/record.ts. Fail-quiet — never blocks the parent operation.';
