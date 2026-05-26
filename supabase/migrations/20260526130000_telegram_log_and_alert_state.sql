-- 2026-05-26 — telegram_log + dashboard_alert_state
--
-- telegram_log: row per Telegram notification attempt. Today every Telegram
-- send is fire-and-forget with .catch(() => {}) — if the bot token rotates,
-- every notification disappears silently. This table captures every attempt
-- (success + failure) so /staff/lifecycle can show "Telegram delivery health".
--
-- dashboard_alert_state: per-category last-fired timestamp so the
-- dashboard-alerts cron doesn't re-Telegram every hour for the same problem.

create table if not exists public.telegram_log (
  id             uuid primary key default gen_random_uuid(),
  sent_at        timestamptz not null default now(),
  chat_id        text,
  category       text,        -- order_placed, orphan_alert, wave_drift, cron_stale, etc.
  ok             boolean not null,
  status_code    int,
  error          text,
  message_preview text         -- first ~200 chars of the message body for context
);

create index if not exists telegram_log_sent_at_idx on public.telegram_log (sent_at desc);
create index if not exists telegram_log_category_idx on public.telegram_log (category, sent_at desc);

create table if not exists public.dashboard_alert_state (
  category       text primary key,
  last_fired_at  timestamptz not null,
  last_count     int,
  last_detail    text
);

comment on table public.telegram_log is
  'Every Telegram notification attempt. Written by src/lib/notifications/telegram.ts. Fail-quiet.';
comment on table public.dashboard_alert_state is
  'Per-category last-fired tracker for /api/cron/dashboard-alerts. Prevents repeat-alerting every hour.';
