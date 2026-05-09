-- Daily snapshots of Google Search Console data for truecolorprinting.ca
-- Pulled by /api/cron/gsc-sync (daily) — used by /staff/seo dashboard + skill recommendations.
-- Uniqueness: one row per (date, query, page) — re-runs of the same day overwrite via upsert.

CREATE TABLE IF NOT EXISTS seo_gsc_snapshots (
  id             bigserial PRIMARY KEY,
  snapshot_date  date        NOT NULL,
  query          text        NOT NULL,
  page           text        NOT NULL,
  country        text        NOT NULL DEFAULT 'all',
  device         text        NOT NULL DEFAULT 'all',
  clicks         int4        NOT NULL DEFAULT 0,
  impressions    int4        NOT NULL DEFAULT 0,
  ctr            float4      NOT NULL DEFAULT 0,
  position       float4      NOT NULL DEFAULT 0,
  fetched_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS seo_gsc_snapshots_unique
  ON seo_gsc_snapshots (snapshot_date, query, page, country, device);

CREATE INDEX IF NOT EXISTS seo_gsc_snapshots_date_idx     ON seo_gsc_snapshots (snapshot_date DESC);
CREATE INDEX IF NOT EXISTS seo_gsc_snapshots_position_idx ON seo_gsc_snapshots (position);
CREATE INDEX IF NOT EXISTS seo_gsc_snapshots_page_idx     ON seo_gsc_snapshots (page);
CREATE INDEX IF NOT EXISTS seo_gsc_snapshots_query_idx    ON seo_gsc_snapshots (query);

-- RLS: service-role only (staff dashboard reads via service client).
ALTER TABLE seo_gsc_snapshots ENABLE ROW LEVEL SECURITY;

-- Track last successful sync so the dashboard can show freshness + the cron can resume from gaps.
CREATE TABLE IF NOT EXISTS seo_gsc_sync_log (
  id              bigserial PRIMARY KEY,
  ran_at          timestamptz NOT NULL DEFAULT now(),
  date_from       date        NOT NULL,
  date_to         date        NOT NULL,
  rows_inserted   int4        NOT NULL DEFAULT 0,
  rows_updated    int4        NOT NULL DEFAULT 0,
  status          text        NOT NULL DEFAULT 'ok',
  error_message   text
);

CREATE INDEX IF NOT EXISTS seo_gsc_sync_log_ran_at_idx ON seo_gsc_sync_log (ran_at DESC);
ALTER TABLE seo_gsc_sync_log ENABLE ROW LEVEL SECURITY;
