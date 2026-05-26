-- 2026-05-25 — Cron heartbeat table
--
-- Phase 1 harness: detect SILENT cron death. The payment-flow crons run via
-- pg_cron → pg_net → Railway endpoints. If pg_cron stops, a CRON_SECRET
-- rotates out of sync, or the endpoint 401s, the cron NEVER runs and nothing
-- errors — recovery/digest/follow-up emails just stop. pg_cron's own
-- cron.job_run_details only proves the HTTP call was *fired*, not that the
-- endpoint actually executed its work. This table is written by the route
-- itself at the end of a successful run, so a missing recent row = the
-- endpoint genuinely didn't run its logic.
--
-- Read by scripts/harness/reconcile-check.mjs (heartbeat section) and can be
-- surfaced on the staff dashboard. No PII.

create table if not exists public.cron_runs (
  id        bigint generated always as identity primary key,
  cron_name text        not null,
  ran_at    timestamptz not null default now(),
  ok        boolean     not null default true,
  detail    text
);

create index if not exists cron_runs_name_ran_idx
  on public.cron_runs (cron_name, ran_at desc);

comment on table public.cron_runs is
  'Heartbeat log written by each cron route at end of run. Missing recent row for a cron = it did not execute (silent death). Read by harness reconcile-check.';

-- Service-role only. Crons use createServiceClient() which bypasses RLS;
-- enabling RLS with no policies blocks anon/authenticated entirely.
alter table public.cron_runs enable row level security;

-- Optional housekeeping: keep the table from growing unbounded. Daily crons
-- write ~5 rows/day; this trims anything older than 90 days on each insert is
-- overkill, so leave manual/periodic. A scheduled prune can be added later.
