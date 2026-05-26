-- 2026-05-26 — email_log delivery columns
--
-- Today email_log only knows status='sent' (we only log on successful POST to
-- Resend). Resend's webhook fires on delivered/opened/clicked/bounced/complained/
-- delivery_delayed. This migration adds the columns to capture each.
--
-- Wired by src/app/api/webhooks/resend/route.ts (Round 2 harness).

alter table public.email_log
  add column if not exists provider_message_id text,
  add column if not exists delivered_at         timestamptz,
  add column if not exists opened_at            timestamptz,
  add column if not exists clicked_at           timestamptz,
  add column if not exists bounced_at           timestamptz,
  add column if not exists complained_at        timestamptz,
  add column if not exists delivery_delayed_at  timestamptz,
  add column if not exists last_event_detail    text;

-- Allow webhook to look up rows by provider message id quickly
create index if not exists email_log_provider_msg_idx
  on public.email_log (provider_message_id);
