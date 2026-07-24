-- One browser submission must create at most one quote request, even when the
-- client retries after a network or downstream email failure.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $$
BEGIN
  IF to_regclass('public.quote_requests') IS NULL THEN
    RAISE EXCEPTION 'quote request idempotency preflight failed: public.quote_requests is missing';
  END IF;
END $$;

ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS submission_key uuid,
  ADD COLUMN IF NOT EXISTS staff_notification_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS customer_confirmation_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS notification_last_error text;

DO $$
DECLARE
  v_column_matches integer;
BEGIN
  SELECT count(*) INTO v_column_matches
  FROM pg_catalog.pg_attribute a
  WHERE a.attrelid = 'public.quote_requests'::regclass
    AND a.attnum > 0
    AND NOT a.attisdropped
    AND NOT a.attnotnull
    AND (
      (a.attname = 'submission_key' AND pg_catalog.format_type(a.atttypid, a.atttypmod) = 'uuid') OR
      (a.attname IN ('staff_notification_sent_at', 'customer_confirmation_sent_at')
        AND pg_catalog.format_type(a.atttypid, a.atttypmod) = 'timestamp with time zone') OR
      (a.attname = 'notification_last_error'
        AND pg_catalog.format_type(a.atttypid, a.atttypmod) = 'text')
    );

  IF v_column_matches <> 4 THEN
    RAISE EXCEPTION
      'quote request idempotency postcondition failed: expected four nullable delivery columns with exact types, found %',
      v_column_matches;
  END IF;
END $$;

-- Supabase CLI executes migration statements through a pipeline, where
-- CREATE INDEX CONCURRENTLY is not legal. Production must first run the
-- rerunnable scripts/db/prepare-quote-request-idempotency-index.sh. That script
-- adds the nullable column and builds this index concurrently outside the CLI
-- migration. A fresh/empty database may build it transactionally during reset.
DO $$
DECLARE
  v_quote_count bigint;
  v_index_exists boolean;
BEGIN
  SELECT count(*) INTO v_quote_count FROM public.quote_requests;
  SELECT to_regclass('public.quote_requests_submission_key_uidx') IS NOT NULL
    INTO v_index_exists;

  IF NOT v_index_exists AND v_quote_count > 0 THEN
    RAISE EXCEPTION
      'quote request idempotency preflight failed: precreate quote_requests_submission_key_uidx concurrently before Supabase db push (rows=%)',
      v_quote_count;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS quote_requests_submission_key_uidx
  ON public.quote_requests (submission_key)
  WHERE submission_key IS NOT NULL;

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
      'quote request idempotency postcondition failed: expected one valid partial unique submission_key index, found %',
      v_matches;
  END IF;
END $$;

COMMENT ON COLUMN public.quote_requests.submission_key IS
  'Browser-generated idempotency key. Retries with the same key return the existing quote instead of creating another lead.';
COMMENT ON COLUMN public.quote_requests.staff_notification_sent_at IS
  'Resend provider acceptance time for the idempotent new-quote staff notification.';
COMMENT ON COLUMN public.quote_requests.customer_confirmation_sent_at IS
  'Resend provider acceptance time for the idempotent customer quote confirmation.';
COMMENT ON COLUMN public.quote_requests.notification_last_error IS
  'Sanitized last notification error; cleared once both required emails are accepted.';

-- Required staff/customer notifications use a provider-correlated ledger.
-- The quote row remains the lead source of truth; this table distinguishes a
-- confirmed send from an ambiguous provider response and prevents a retry
-- after Resend's 24-hour idempotency window from sending a second message.
CREATE TABLE IF NOT EXISTS public.quote_request_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE RESTRICT,
  channel text NOT NULL CHECK (channel IN ('staff', 'customer')),
  status text NOT NULL DEFAULT 'prepared'
    CHECK (status IN (
      'prepared', 'sending', 'pending_confirmation', 'sent', 'failed',
      'delivery_failed'
    )),
  provider_message_id text,
  first_attempt_at timestamptz,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  last_error text,
  resolution text,
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quote_request_deliveries_quote_channel_uidx UNIQUE (quote_id, channel),
  CONSTRAINT quote_request_deliveries_sent_state_check CHECK (
    status <> 'sent' OR
    (provider_message_id IS NOT NULL AND sent_at IS NOT NULL)
  )
);

ALTER TABLE public.quote_request_deliveries
  ADD COLUMN IF NOT EXISTS resolution text,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by text;

ALTER TABLE public.quote_request_deliveries
  DROP CONSTRAINT IF EXISTS quote_request_deliveries_provider_id_check,
  DROP CONSTRAINT IF EXISTS quote_request_deliveries_status_check,
  DROP CONSTRAINT IF EXISTS quote_request_deliveries_resolution_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.quote_request_deliveries'::regclass
      AND conname = 'quote_request_deliveries_quote_channel_uidx'
  ) THEN
    ALTER TABLE public.quote_request_deliveries
      ADD CONSTRAINT quote_request_deliveries_quote_channel_uidx
      UNIQUE (quote_id, channel);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.quote_request_deliveries'::regclass
      AND conname = 'quote_request_deliveries_sent_state_check'
  ) THEN
    ALTER TABLE public.quote_request_deliveries
      ADD CONSTRAINT quote_request_deliveries_sent_state_check CHECK (
        status <> 'sent' OR
        (provider_message_id IS NOT NULL AND sent_at IS NOT NULL)
      ) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.quote_request_deliveries'::regclass
      AND conname = 'quote_request_deliveries_status_check'
  ) THEN
    ALTER TABLE public.quote_request_deliveries
      ADD CONSTRAINT quote_request_deliveries_status_check CHECK (
        status IN (
          'prepared', 'sending', 'pending_confirmation', 'sent', 'failed',
          'delivery_failed'
        )
      ) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.quote_request_deliveries'::regclass
      AND conname = 'quote_request_deliveries_resolution_check'
  ) THEN
    ALTER TABLE public.quote_request_deliveries
      ADD CONSTRAINT quote_request_deliveries_resolution_check CHECK (
        resolution IS NULL OR resolution IN (
          'provider_rejected',
          'post_acceptance_failed',
          'manual_confirmed_sent',
          'manual_confirmed_not_sent'
        )
      ) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.quote_request_deliveries'::regclass
      AND conname = 'quote_request_deliveries_provider_id_check'
  ) THEN
    ALTER TABLE public.quote_request_deliveries
      ADD CONSTRAINT quote_request_deliveries_provider_id_check CHECK (
        provider_message_id IS NULL OR
        (
          length(provider_message_id) <= 300 AND
          provider_message_id ~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]*$'
        )
      ) NOT VALID;
  END IF;
END $$;

ALTER TABLE public.quote_request_deliveries
  VALIDATE CONSTRAINT quote_request_deliveries_status_check;
ALTER TABLE public.quote_request_deliveries
  VALIDATE CONSTRAINT quote_request_deliveries_sent_state_check;
ALTER TABLE public.quote_request_deliveries
  VALIDATE CONSTRAINT quote_request_deliveries_resolution_check;
ALTER TABLE public.quote_request_deliveries
  VALIDATE CONSTRAINT quote_request_deliveries_provider_id_check;

CREATE UNIQUE INDEX IF NOT EXISTS quote_request_deliveries_provider_message_uidx
  ON public.quote_request_deliveries (provider_message_id)
  WHERE provider_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS quote_request_deliveries_quote_created_idx
  ON public.quote_request_deliveries (quote_id, created_at DESC);

ALTER TABLE public.quote_request_deliveries ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.quote_request_deliveries IS
  'Service-only provider delivery ledger for the two required initial quote emails.';
COMMENT ON COLUMN public.quote_request_deliveries.resolution IS
  'Provider or staff reconciliation outcome; null while no terminal reconciliation is recorded.';

CREATE OR REPLACE FUNCTION public.claim_quote_request_delivery(
  p_quote_id uuid,
  p_channel text
)
RETURNS TABLE (
  delivery_id uuid,
  delivery_status text,
  provider_message_id text,
  first_attempt_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_delivery record;
BEGIN
  IF p_channel NOT IN ('staff', 'customer') THEN
    RAISE EXCEPTION 'QUOTE_REQUEST_DELIVERY_INVALID_CHANNEL' USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.quote_requests q WHERE q.id = p_quote_id
  ) THEN
    RAISE EXCEPTION 'QUOTE_REQUEST_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.quote_request_deliveries (quote_id, channel)
  VALUES (p_quote_id, p_channel)
  ON CONFLICT (quote_id, channel) DO NOTHING;

  SELECT d.* INTO v_delivery
  FROM public.quote_request_deliveries d
  WHERE d.quote_id = p_quote_id AND d.channel = p_channel
  FOR UPDATE;

  IF v_delivery.status IN ('sent', 'delivery_failed') THEN
    RETURN QUERY
    SELECT
      v_delivery.id,
      v_delivery.status,
      v_delivery.provider_message_id,
      v_delivery.first_attempt_at;
    RETURN;
  END IF;

  -- Resend guarantees idempotency for 24 hours. After 23 hours, a sending or
  -- ambiguous attempt must be reconciled by its signed webhook/provider ID
  -- instead of issuing another email.
  IF v_delivery.status IN ('sending', 'pending_confirmation') AND
     v_delivery.first_attempt_at < now() - interval '23 hours' THEN
    UPDATE public.quote_request_deliveries
    SET
      status = 'pending_confirmation',
      updated_at = now()
    WHERE id = v_delivery.id
    RETURNING * INTO v_delivery;

    RETURN QUERY
    SELECT
      v_delivery.id,
      v_delivery.status,
      v_delivery.provider_message_id,
      v_delivery.first_attempt_at;
    RETURN;
  END IF;

  UPDATE public.quote_request_deliveries AS d
  SET
    status = 'sending',
    first_attempt_at = COALESCE(d.first_attempt_at, now()),
    last_attempt_at = now(),
    updated_at = now()
  WHERE d.id = v_delivery.id
  RETURNING * INTO v_delivery;

  RETURN QUERY
  SELECT
    v_delivery.id,
    v_delivery.status,
    v_delivery.provider_message_id,
    v_delivery.first_attempt_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_quote_request_delivery(
  p_delivery_id uuid,
  p_provider_message_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_delivery record;
BEGIN
  IF length(COALESCE(p_provider_message_id, '')) > 300 OR
     COALESCE(p_provider_message_id, '') !~
       '^[A-Za-z0-9][A-Za-z0-9._:@/-]*$' THEN
    RAISE EXCEPTION 'QUOTE_REQUEST_DELIVERY_INVALID_PROVIDER_ID' USING ERRCODE = 'P0001';
  END IF;

  SELECT d.* INTO v_delivery
  FROM public.quote_request_deliveries d
  WHERE d.id = p_delivery_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUOTE_REQUEST_DELIVERY_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;
  IF v_delivery.status IN ('failed', 'delivery_failed') THEN
    RAISE EXCEPTION 'QUOTE_REQUEST_DELIVERY_ALREADY_FAILED' USING ERRCODE = 'P0001';
  END IF;
  IF v_delivery.provider_message_id IS NOT NULL AND
     v_delivery.provider_message_id <> p_provider_message_id THEN
    RAISE EXCEPTION 'QUOTE_REQUEST_DELIVERY_PROVIDER_ID_MISMATCH' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.quote_request_deliveries
  SET
    status = 'sent',
    provider_message_id = COALESCE(provider_message_id, p_provider_message_id),
    sent_at = COALESCE(sent_at, now()),
    resolution = CASE
      WHEN resolution = 'manual_confirmed_sent' THEN resolution
      ELSE NULL
    END,
    last_error = NULL,
    updated_at = now()
  WHERE id = p_delivery_id
  RETURNING * INTO v_delivery;

  UPDATE public.quote_requests
  SET
    staff_notification_sent_at = CASE
      WHEN v_delivery.channel = 'staff'
        THEN COALESCE(staff_notification_sent_at, v_delivery.sent_at)
      ELSE staff_notification_sent_at
    END,
    customer_confirmation_sent_at = CASE
      WHEN v_delivery.channel = 'customer'
        THEN COALESCE(customer_confirmation_sent_at, v_delivery.sent_at)
      ELSE customer_confirmation_sent_at
    END
  WHERE id = v_delivery.quote_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUOTE_REQUEST_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;
  RETURN v_delivery.status;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_quote_request_delivery_failure(
  p_delivery_id uuid,
  p_outcome text,
  p_error text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_status text;
BEGIN
  IF p_outcome NOT IN ('rejected', 'unknown') THEN
    RAISE EXCEPTION 'QUOTE_REQUEST_DELIVERY_INVALID_OUTCOME' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.quote_request_deliveries
  SET
    status = CASE
      WHEN provider_message_id IS NOT NULL OR status = 'sent'
        THEN 'delivery_failed'
      WHEN p_outcome = 'rejected' THEN 'failed'
      ELSE 'pending_confirmation'
    END,
    resolution = CASE
      WHEN provider_message_id IS NOT NULL OR status = 'sent'
        THEN 'post_acceptance_failed'
      WHEN p_outcome = 'rejected' THEN 'provider_rejected'
      ELSE resolution
    END,
    resolved_at = CASE
      WHEN provider_message_id IS NOT NULL OR status = 'sent' THEN now()
      WHEN p_outcome = 'rejected' THEN now()
      ELSE resolved_at
    END,
    resolved_by = CASE
      WHEN provider_message_id IS NOT NULL OR status = 'sent' THEN 'provider'
      WHEN p_outcome = 'rejected' THEN 'provider'
      ELSE resolved_by
    END,
    last_error = CASE
      WHEN provider_message_id IS NOT NULL OR status = 'sent'
        THEN left(COALESCE(p_error, 'Email delivery failed after acceptance'), 1000)
      ELSE left(COALESCE(p_error, 'Email delivery was not confirmed'), 1000)
    END,
    updated_at = now()
  WHERE id = p_delivery_id
  RETURNING status INTO v_status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUOTE_REQUEST_DELIVERY_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;
  RETURN v_status;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_quote_request_deliveries(
  p_quote_id uuid
)
RETURNS TABLE (
  delivery_id uuid,
  channel text,
  delivery_status text,
  provider_message_id text,
  first_attempt_at timestamptz,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  last_error text,
  resolution text,
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    d.id,
    d.channel,
    d.status,
    d.provider_message_id,
    d.first_attempt_at,
    d.last_attempt_at,
    d.sent_at,
    d.last_error,
    d.resolution,
    d.resolved_at,
    d.resolved_by,
    d.created_at,
    d.updated_at
  FROM public.quote_request_deliveries d
  WHERE d.quote_id = p_quote_id
  ORDER BY d.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.resolve_stale_quote_request_delivery(
  p_quote_id uuid,
  p_delivery_id uuid,
  p_resolution text,
  p_provider_message_id text,
  p_actor text
)
RETURNS TABLE (
  delivery_status text,
  delivery_channel text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_delivery record;
  v_completed_status text;
BEGIN
  IF p_resolution NOT IN ('confirm_sent', 'confirm_not_sent') OR
     btrim(COALESCE(p_actor, '')) = '' OR length(p_actor) > 320 THEN
    RAISE EXCEPTION 'QUOTE_REQUEST_DELIVERY_INVALID_RESOLUTION' USING ERRCODE = 'P0001';
  END IF;

  SELECT d.*
  INTO v_delivery
  FROM public.quote_request_deliveries d
  WHERE d.id = p_delivery_id
    AND d.quote_id = p_quote_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUOTE_REQUEST_DELIVERY_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF p_resolution = 'confirm_sent' THEN
    IF v_delivery.status NOT IN ('sending', 'pending_confirmation') OR
       length(COALESCE(p_provider_message_id, '')) > 300 OR
       COALESCE(p_provider_message_id, '') !~
         '^[A-Za-z0-9][A-Za-z0-9._:@/-]*$' THEN
      RAISE EXCEPTION 'QUOTE_REQUEST_DELIVERY_INVALID_RESOLUTION' USING ERRCODE = 'P0001';
    END IF;

    v_completed_status := public.complete_quote_request_delivery(
      p_delivery_id,
      p_provider_message_id
    );
    UPDATE public.quote_request_deliveries
    SET
      resolution = 'manual_confirmed_sent',
      resolved_at = now(),
      resolved_by = p_actor,
      updated_at = now()
    WHERE id = p_delivery_id;

    RETURN QUERY SELECT v_completed_status, v_delivery.channel::text;
    RETURN;
  END IF;

  IF v_delivery.status NOT IN ('sending', 'pending_confirmation') THEN
    RAISE EXCEPTION 'QUOTE_REQUEST_DELIVERY_INVALID_RESOLUTION' USING ERRCODE = 'P0001';
  END IF;
  IF v_delivery.first_attempt_at IS NULL OR
     v_delivery.first_attempt_at >= now() - interval '23 hours' THEN
    RAISE EXCEPTION 'QUOTE_REQUEST_DELIVERY_RESOLUTION_NOT_STALE' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.quote_request_deliveries
  SET
    status = 'failed',
    resolution = 'manual_confirmed_not_sent',
    resolved_at = now(),
    resolved_by = p_actor,
    last_error = 'Staff confirmed no provider delivery after the safe retry window',
    updated_at = now()
  WHERE id = p_delivery_id;

  RETURN QUERY SELECT 'failed'::text, v_delivery.channel::text;
END;
$$;

DO $$
DECLARE
  v_resolution_columns integer;
  v_required_constraints integer;
BEGIN
  SELECT count(*) INTO v_resolution_columns
  FROM pg_catalog.pg_attribute a
  WHERE a.attrelid = 'public.quote_request_deliveries'::regclass
    AND a.attnum > 0
    AND NOT a.attisdropped
    AND (
      (a.attname IN ('resolution', 'resolved_by') AND
        pg_catalog.format_type(a.atttypid, a.atttypmod) = 'text') OR
      (a.attname = 'resolved_at' AND
        pg_catalog.format_type(a.atttypid, a.atttypmod) = 'timestamp with time zone')
    );
  IF v_resolution_columns <> 3 THEN
    RAISE EXCEPTION
      'quote request delivery postcondition failed: reconciliation columns=%',
      v_resolution_columns;
  END IF;

  SELECT count(*) INTO v_required_constraints
  FROM pg_catalog.pg_constraint c
  WHERE c.conrelid = 'public.quote_request_deliveries'::regclass
    AND c.conname IN (
      'quote_request_deliveries_quote_channel_uidx',
      'quote_request_deliveries_status_check',
      'quote_request_deliveries_sent_state_check',
      'quote_request_deliveries_resolution_check',
      'quote_request_deliveries_provider_id_check'
    )
    AND c.convalidated;
  IF v_required_constraints <> 5 OR
     to_regprocedure('public.list_quote_request_deliveries(uuid)') IS NULL OR
     to_regprocedure(
       'public.resolve_stale_quote_request_delivery(uuid,uuid,text,text,text)'
     ) IS NULL THEN
    RAISE EXCEPTION
      'quote request delivery postcondition failed: constraints/functions are incomplete';
  END IF;
END $$;

REVOKE ALL ON TABLE public.quote_request_deliveries
  FROM public, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.quote_request_deliveries
  TO service_role;

REVOKE ALL ON FUNCTION public.claim_quote_request_delivery(uuid, text)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_quote_request_delivery(uuid, text)
  TO service_role;

REVOKE ALL ON FUNCTION public.complete_quote_request_delivery(uuid, text)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_quote_request_delivery(uuid, text)
  TO service_role;

REVOKE ALL ON FUNCTION public.record_quote_request_delivery_failure(uuid, text, text)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_quote_request_delivery_failure(uuid, text, text)
  TO service_role;

REVOKE ALL ON FUNCTION public.list_quote_request_deliveries(uuid)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_quote_request_deliveries(uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.resolve_stale_quote_request_delivery(
  uuid, uuid, text, text, text
) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_stale_quote_request_delivery(
  uuid, uuid, text, text, text
) TO service_role;
