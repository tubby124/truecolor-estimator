#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL to the direct Postgres connection string}"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required" >&2
  exit 1
fi

# Phase 1 is metadata-only and rerunnable. The application does not write
# submission_key until the corresponding app release is deployed.
psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
SET lock_timeout = '5s';
SET statement_timeout = '30s';

ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS submission_key uuid;

DO $$
BEGIN
  IF EXISTS (
    SELECT submission_key
    FROM public.quote_requests
    WHERE submission_key IS NOT NULL
    GROUP BY submission_key
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'quote request idempotency index preflight failed: duplicate submission_key values';
  END IF;
END $$;
SQL

# This psql invocation contains exactly one statement and is not wrapped in a
# transaction. Supabase CLI migrations use a statement pipeline that cannot run
# CREATE INDEX CONCURRENTLY, so production runs this before `supabase db push`.
PGOPTIONS="${PGOPTIONS:-} -c lock_timeout=5s -c statement_timeout=0" \
  psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -c \
  "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS quote_requests_submission_key_uidx ON public.quote_requests (submission_key) WHERE submission_key IS NOT NULL"

psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE
  v_matches integer;
BEGIN
  SELECT count(*) INTO v_matches
  FROM pg_catalog.pg_index i
  JOIN pg_catalog.pg_class idx ON idx.oid = i.indexrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = idx.relnamespace
  WHERE n.nspname = 'public'
    AND idx.relname = 'quote_requests_submission_key_uidx'
    AND i.indrelid = 'public.quote_requests'::regclass
    AND i.indisunique
    AND i.indisvalid
    AND i.indisready
    AND i.indnkeyatts = 1
    AND pg_catalog.pg_get_indexdef(i.indexrelid, 1, true) = 'submission_key'
    AND regexp_replace(
      pg_catalog.pg_get_expr(i.indpred, i.indrelid),
      '\s+',
      '',
      'g'
    ) IN ('(submission_keyISNOTNULL)', 'submission_keyISNOTNULL');

  IF v_matches <> 1 THEN
    RAISE EXCEPTION
      'quote request idempotency index postcondition failed: matches=%',
      v_matches;
  END IF;
END $$;
SQL

echo "quote_requests_submission_key_uidx is valid, ready, unique, and partial"
