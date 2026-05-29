-- 2026-05-29 — GA4 secondary ingestion (Phase 9d)
--
-- Defense-in-depth so the next GSC OAuth death (or any other GSC outage)
-- isn't blinding. GA4 organic-traffic data is pulled daily, kept alongside
-- seo_gsc_snapshots, and cross-checked via the gscVsGa4Divergence rollup
-- signal (fires YELLOW when GSC clicks vs GA4 organic sessions diverge
-- >50% over a 7-day window — usually means one of the two ingestions is
-- silently broken).
--
-- Written by /api/cron/ga4-sync (mirrors gsc-sync pattern). One row per
-- (snapshot_date, page_path). Service-role-only via RLS.

create table if not exists public.analytics_ga4_snapshots (
  id                bigint generated always as identity primary key,
  snapshot_date     date        not null,
  page_path         text        not null,
  sessions          integer     not null default 0,
  engaged_sessions  integer     not null default 0,
  conversions       numeric     not null default 0,
  source_medium     text        not null default 'organic',
  fetched_at        timestamptz not null default now()
);

create unique index if not exists analytics_ga4_snapshots_unique_day_page
  on public.analytics_ga4_snapshots (snapshot_date, page_path, source_medium);

create index if not exists analytics_ga4_snapshots_date_idx
  on public.analytics_ga4_snapshots (snapshot_date desc);

comment on table public.analytics_ga4_snapshots is
  'Daily GA4 organic-traffic snapshot per page_path. Defense-in-depth alongside seo_gsc_snapshots — divergence between GSC clicks and GA4 organic sessions flags silent failure of either ingestion. Service-role only.';

alter table public.analytics_ga4_snapshots enable row level security;

-- Sync log mirrors seo_gsc_sync_log so we can audit GA4 ingestion history
-- the same way we audit GSC. Without this, we'd have only cron_runs.detail
-- (truncated to 200 chars) — too thin for forensic queries.
create table if not exists public.analytics_ga4_sync_log (
  id              bigint generated always as identity primary key,
  date_from       date        not null,
  date_to         date        not null,
  rows_inserted   integer     not null default 0,
  rows_updated    integer     not null default 0,
  status          text        not null check (status in ('ok','partial','error')),
  error_message   text,
  created_at      timestamptz not null default now()
);

create index if not exists analytics_ga4_sync_log_created_at_idx
  on public.analytics_ga4_sync_log (created_at desc);

comment on table public.analytics_ga4_sync_log is
  'Per-run audit log for /api/cron/ga4-sync. Mirrors seo_gsc_sync_log shape.';

alter table public.analytics_ga4_sync_log enable row level security;
