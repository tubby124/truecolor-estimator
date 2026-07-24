-- Durable, idempotent delivery state for payable quote emails.
--
-- Pricing may be prepared before provider delivery, but a quote becomes
-- qualified/quoted only when Resend acceptance is committed. Exact retries
-- reuse one rendered payload and one provider idempotency window.

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $$
BEGIN
  IF to_regclass('public.quote_requests') IS NULL OR
     to_regclass('public.quote_measurement_event_outbox') IS NULL THEN
    RAISE EXCEPTION 'quote send delivery migration preflight failed: required quote tables are missing';
  END IF;
  IF to_regprocedure(
    'public.set_structured_quote_pricing(uuid,integer,integer,integer,integer,text,jsonb)'
  ) IS NULL THEN
    RAISE EXCEPTION 'quote send delivery migration preflight failed: structured quote pricing RPC is missing';
  END IF;
  IF to_regprocedure('public.structured_quote_pst_base_cents(jsonb)') IS NULL THEN
    RAISE EXCEPTION 'quote send delivery migration preflight failed: legacy PST helper is missing';
  END IF;
END $$;

-- Keep the legacy helper/RPC contract operational for a migration-first deploy
-- and for an immediate application rollback. New v2 revisions are explicitly
-- marked in their stored line items; unmarked old-app revisions continue using
-- full-subtotal PST, including outstanding Pay Now links.
ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS quote_tax_formula_version text
  DEFAULT 'legacy_full_pst';

CREATE OR REPLACE FUNCTION public.structured_quote_pst_base_cents_v2(
  p_line_items jsonb
)
RETURNS integer
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = ''
AS $$
  SELECT COALESCE(sum(
    round((item->>'qty')::numeric * (item->>'unitPrice')::numeric * 100)::integer
  ) FILTER (
    WHERE item->>'taxClass' NOT IN ('design_service', 'rush_service')
  ), 0)::integer
  FROM jsonb_array_elements(p_line_items) AS lines(item)
$$;

-- Compatibility dispatcher used by existing set/materialize functions.
-- Only a fully marked v2 payload takes the v2 branch; every legacy or mixed
-- payload retains the original full-subtotal calculation.
CREATE OR REPLACE FUNCTION public.structured_quote_pst_base_cents(
  p_line_items jsonb
)
RETURNS integer
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = ''
AS $$
  SELECT CASE
    WHEN jsonb_array_length(p_line_items) > 0 AND NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_line_items) AS versioned(item)
      WHERE versioned.item->>'taxFormulaVersion' IS DISTINCT FROM 'sk_print_only_v2'
    )
      THEN public.structured_quote_pst_base_cents_v2(p_line_items)
    ELSE (
      SELECT COALESCE(sum(
        round((item->>'qty')::numeric * (item->>'unitPrice')::numeric * 100)::integer
      ), 0)::integer
      FROM jsonb_array_elements(p_line_items) AS legacy(item)
    )
  END
$$;

UPDATE public.quote_requests
SET quote_tax_formula_version = 'legacy_full_pst'
WHERE quote_tax_formula_version IS NULL;

ALTER TABLE public.quote_requests
  ALTER COLUMN quote_tax_formula_version SET DEFAULT 'legacy_full_pst',
  ALTER COLUMN quote_tax_formula_version SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.quote_requests'::regclass
      AND conname = 'quote_requests_tax_formula_version_check'
  ) THEN
    ALTER TABLE public.quote_requests
      ADD CONSTRAINT quote_requests_tax_formula_version_check CHECK (
        quote_tax_formula_version IN ('legacy_full_pst', 'sk_print_only_v2')
      ) NOT VALID;
  END IF;
END $$;

ALTER TABLE public.quote_requests
  VALIDATE CONSTRAINT quote_requests_tax_formula_version_check;

CREATE OR REPLACE FUNCTION public.set_structured_quote_pricing_v2(
  p_quote_id uuid,
  p_total_cents integer,
  p_subtotal_cents integer,
  p_gst_cents integer,
  p_pst_cents integer,
  p_description text,
  p_line_items jsonb
)
RETURNS TABLE (
  converted_order_id uuid,
  order_repriced boolean,
  quote_revision integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_gst_rate numeric(8,6);
  v_pst_rate numeric(8,6);
  v_versioned_items jsonb;
  v_pricing record;
BEGIN
  IF jsonb_typeof(p_line_items) <> 'array' OR jsonb_array_length(p_line_items) = 0 THEN
    RAISE EXCEPTION 'STRUCTURED_QUOTE_ITEMS_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  SELECT gst_rate, pst_rate
  INTO v_gst_rate, v_pst_rate
  FROM public.truecolor_tax_config
  WHERE id = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUOTE_TAX_CONFIG_MISSING' USING ERRCODE = 'P0001';
  END IF;

  IF p_gst_cents <> round(p_subtotal_cents * v_gst_rate)::integer OR
     p_pst_cents <> round(
       public.structured_quote_pst_base_cents_v2(p_line_items) * v_pst_rate
     )::integer THEN
    RAISE EXCEPTION 'QUOTE_TAX_FORMULA_MISMATCH' USING ERRCODE = 'P0001';
  END IF;

  SELECT jsonb_agg(
    versioned.item ||
      jsonb_build_object('taxFormulaVersion', 'sk_print_only_v2')
    ORDER BY versioned.ordinality
  )
  INTO v_versioned_items
  FROM jsonb_array_elements(p_line_items)
    WITH ORDINALITY AS versioned(item, ordinality);

  SELECT *
  INTO v_pricing
  FROM public.set_structured_quote_pricing(
    p_quote_id,
    p_total_cents,
    p_subtotal_cents,
    p_gst_cents,
    p_pst_cents,
    p_description,
    v_versioned_items
  );

  RETURN QUERY SELECT
    v_pricing.converted_order_id,
    v_pricing.order_repriced,
    v_pricing.quote_revision;
END;
$$;

CREATE TABLE IF NOT EXISTS public.quote_send_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE RESTRICT,
  quote_revision integer NOT NULL CHECK (quote_revision > 0),
  request_fingerprint text NOT NULL CHECK (request_fingerprint ~ '^[0-9a-f]{64}$'),
  recipient text NOT NULL,
  subject text NOT NULL,
  reply_body text NOT NULL,
  status text NOT NULL DEFAULT 'prepared'
    CHECK (status IN (
      'prepared', 'sending', 'pending_confirmation', 'sent', 'failed',
      'delivery_failed'
    )),
  pay_url text,
  rendered_html text,
  rendered_text text,
  provider_window_started_at timestamptz,
  provider_message_id text,
  last_error text,
  sent_at timestamptz,
  resolution text,
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quote_send_deliveries_rendered_payload_check CHECK (
    (
      pay_url IS NULL AND rendered_html IS NULL AND rendered_text IS NULL AND
      provider_window_started_at IS NULL
    ) OR (
      pay_url IS NOT NULL AND rendered_html IS NOT NULL AND rendered_text IS NOT NULL AND
      provider_window_started_at IS NOT NULL
    )
  ),
  CONSTRAINT quote_send_deliveries_sent_state_check CHECK (
    status <> 'sent' OR (provider_message_id IS NOT NULL AND sent_at IS NOT NULL)
  ),
  CONSTRAINT quote_send_deliveries_resolution_check CHECK (
    resolution IS NULL OR resolution IN (
      'provider_rejected',
      'post_acceptance_failed',
      'expired_unarmed',
      'manual_confirmed_sent',
      'manual_confirmed_not_sent'
    )
  ),
  CONSTRAINT quote_send_deliveries_quote_revision_uidx UNIQUE (quote_id, quote_revision),
  CONSTRAINT quote_send_deliveries_fingerprint_uidx UNIQUE (quote_id, request_fingerprint)
);

ALTER TABLE public.quote_send_deliveries
  DROP CONSTRAINT IF EXISTS quote_send_deliveries_status_check,
  DROP CONSTRAINT IF EXISTS quote_send_deliveries_resolution_check,
  DROP CONSTRAINT IF EXISTS quote_send_deliveries_provider_id_check;

ALTER TABLE public.quote_send_deliveries
  ADD CONSTRAINT quote_send_deliveries_status_check CHECK (
    status IN (
      'prepared', 'sending', 'pending_confirmation', 'sent', 'failed',
      'delivery_failed'
    )
  ) NOT VALID,
  ADD CONSTRAINT quote_send_deliveries_resolution_check CHECK (
    resolution IS NULL OR resolution IN (
      'provider_rejected',
      'post_acceptance_failed',
      'expired_unarmed',
      'manual_confirmed_sent',
      'manual_confirmed_not_sent'
    )
  ) NOT VALID,
  ADD CONSTRAINT quote_send_deliveries_provider_id_check CHECK (
    provider_message_id IS NULL OR (
      length(provider_message_id) <= 300 AND
      provider_message_id ~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]*$'
    )
  ) NOT VALID;

ALTER TABLE public.quote_send_deliveries
  VALIDATE CONSTRAINT quote_send_deliveries_status_check;
ALTER TABLE public.quote_send_deliveries
  VALIDATE CONSTRAINT quote_send_deliveries_resolution_check;
ALTER TABLE public.quote_send_deliveries
  VALIDATE CONSTRAINT quote_send_deliveries_provider_id_check;

CREATE UNIQUE INDEX IF NOT EXISTS quote_send_deliveries_provider_message_uidx
  ON public.quote_send_deliveries (provider_message_id)
  WHERE provider_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS quote_send_deliveries_quote_created_idx
  ON public.quote_send_deliveries (quote_id, created_at DESC);

CREATE INDEX IF NOT EXISTS quote_send_deliveries_active_idx
  ON public.quote_send_deliveries (quote_id, provider_window_started_at)
  WHERE status IN ('prepared', 'sending', 'pending_confirmation');

ALTER TABLE public.quote_send_deliveries ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.quote_send_deliveries IS
  'Service-only idempotency, reconciliation, and provider-acceptance ledger for payable quote emails.';
COMMENT ON COLUMN public.quote_send_deliveries.request_fingerprint IS
  'SHA-256 of one logical quote email intent; exact retries reuse one revision and provider key.';
COMMENT ON COLUMN public.quote_send_deliveries.provider_window_started_at IS
  'Start of the Resend idempotency window; set atomically when the rendered payload is first armed.';

-- Enforce the delivery lock at the quote revision boundary, not just inside the
-- route-specific prepare RPC. This also covers legacy/direct callers of
-- set_structured_quote_pricing.
CREATE OR REPLACE FUNCTION public.guard_quote_revision_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.quote_send_deliveries d
    WHERE d.quote_id = OLD.id
      AND d.status IN ('prepared', 'sending', 'pending_confirmation')
  ) THEN
    RAISE EXCEPTION 'QUOTE_SEND_IN_FLIGHT' USING ERRCODE = 'P0001';
  END IF;

  NEW.quote_tax_formula_version := CASE
    WHEN jsonb_typeof(NEW.quote_line_items) = 'array' AND
         jsonb_array_length(NEW.quote_line_items) > 0 AND
         NOT EXISTS (
           SELECT 1
           FROM jsonb_array_elements(NEW.quote_line_items) AS versioned(item)
           WHERE versioned.item->>'taxFormulaVersion'
             IS DISTINCT FROM 'sk_print_only_v2'
         )
      THEN 'sk_print_only_v2'
    ELSE 'legacy_full_pst'
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quote_requests_guard_revision_delivery
  ON public.quote_requests;
CREATE TRIGGER quote_requests_guard_revision_delivery
BEFORE UPDATE OF quote_revision ON public.quote_requests
FOR EACH ROW
WHEN (OLD.quote_revision IS DISTINCT FROM NEW.quote_revision)
EXECUTE FUNCTION public.guard_quote_revision_delivery();

CREATE OR REPLACE FUNCTION public.prepare_structured_quote_send(
  p_quote_id uuid,
  p_total_cents integer,
  p_subtotal_cents integer,
  p_gst_cents integer,
  p_pst_cents integer,
  p_description text,
  p_line_items jsonb,
  p_request_fingerprint text,
  p_recipient text,
  p_subject text,
  p_reply_body text
)
RETURNS TABLE (
  delivery_id uuid,
  quote_revision integer,
  delivery_status text,
  provider_message_id text,
  delivery_created_at timestamptz,
  provider_window_started_at timestamptz,
  pay_url text,
  rendered_html text,
  rendered_text text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_delivery record;
  v_pricing record;
BEGIN
  IF p_request_fingerprint !~ '^[0-9a-f]{64}$' OR
     btrim(COALESCE(p_recipient, '')) = '' OR length(p_recipient) > 320 OR
     btrim(COALESCE(p_subject, '')) = '' OR length(p_subject) > 200 OR
     btrim(COALESCE(p_reply_body, '')) = '' OR length(p_reply_body) > 20000 THEN
    RAISE EXCEPTION 'QUOTE_SEND_INVALID_INTENT' USING ERRCODE = 'P0001';
  END IF;

  PERFORM 1
  FROM public.quote_requests q
  WHERE q.id = p_quote_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUOTE_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  -- The exact logical retry always wins, even if it was prepared long ago and
  -- never armed. No provider request was possible while status stayed prepared.
  SELECT d.*
  INTO v_delivery
  FROM public.quote_send_deliveries d
  WHERE d.quote_id = p_quote_id
    AND d.request_fingerprint = p_request_fingerprint;

  IF FOUND THEN
    RETURN QUERY
    SELECT
      v_delivery.id,
      v_delivery.quote_revision,
      v_delivery.status,
      v_delivery.provider_message_id,
      v_delivery.created_at,
      v_delivery.provider_window_started_at,
      v_delivery.pay_url,
      v_delivery.rendered_html,
      v_delivery.rendered_text;
    RETURN;
  END IF;

  -- A never-rendered claim cannot have reached Resend. Expiring it after a
  -- short lease safely prevents a crashed worker from permanently blocking a
  -- genuinely different quote revision.
  UPDATE public.quote_send_deliveries d
  SET
    status = 'failed',
    resolution = 'expired_unarmed',
    resolved_at = now(),
    resolved_by = 'system',
    last_error = 'Prepared delivery lease expired before rendering',
    updated_at = now()
  WHERE d.quote_id = p_quote_id
    AND d.status = 'prepared'
    AND d.pay_url IS NULL
    AND d.provider_window_started_at IS NULL
    AND d.created_at < now() - interval '15 minutes';

  IF EXISTS (
    SELECT 1
    FROM public.quote_send_deliveries d
    WHERE d.quote_id = p_quote_id
      AND d.status IN ('prepared', 'sending', 'pending_confirmation')
  ) THEN
    RAISE EXCEPTION 'QUOTE_SEND_IN_FLIGHT' USING ERRCODE = 'P0001';
  END IF;

  -- The nested pricing function and the delivery insert share this transaction.
  -- Any later failure rolls the revision back. Its revision trigger is the
  -- database-wide in-flight guard for direct and route-specific callers.
  SELECT *
  INTO v_pricing
  FROM public.set_structured_quote_pricing_v2(
    p_quote_id,
    p_total_cents,
    p_subtotal_cents,
    p_gst_cents,
    p_pst_cents,
    p_description,
    p_line_items
  );

  INSERT INTO public.quote_send_deliveries (
    quote_id,
    quote_revision,
    request_fingerprint,
    recipient,
    subject,
    reply_body
  )
  VALUES (
    p_quote_id,
    v_pricing.quote_revision,
    p_request_fingerprint,
    btrim(p_recipient),
    btrim(p_subject),
    p_reply_body
  )
  RETURNING * INTO v_delivery;

  RETURN QUERY
  SELECT
    v_delivery.id,
    v_delivery.quote_revision,
    v_delivery.status,
    v_delivery.provider_message_id,
    v_delivery.created_at,
    v_delivery.provider_window_started_at,
    v_delivery.pay_url,
    v_delivery.rendered_html,
    v_delivery.rendered_text;
END;
$$;

CREATE OR REPLACE FUNCTION public.arm_structured_quote_send(
  p_delivery_id uuid,
  p_pay_url text,
  p_rendered_html text,
  p_rendered_text text
)
RETURNS TABLE (
  delivery_status text,
  provider_message_id text,
  pay_url text,
  rendered_html text,
  rendered_text text,
  provider_window_started_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_delivery record;
BEGIN
  IF p_pay_url !~ '^https://' OR
     btrim(COALESCE(p_rendered_html, '')) = '' OR
     btrim(COALESCE(p_rendered_text, '')) = '' THEN
    RAISE EXCEPTION 'QUOTE_SEND_INVALID_RENDER' USING ERRCODE = 'P0001';
  END IF;

  SELECT d.*
  INTO v_delivery
  FROM public.quote_send_deliveries d
  WHERE d.id = p_delivery_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUOTE_SEND_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;
  IF v_delivery.status = 'failed' THEN
    RAISE EXCEPTION 'QUOTE_SEND_ALREADY_FAILED' USING ERRCODE = 'P0001';
  END IF;

  IF v_delivery.pay_url IS NULL THEN
    UPDATE public.quote_send_deliveries
    SET
      pay_url = p_pay_url,
      rendered_html = p_rendered_html,
      rendered_text = p_rendered_text,
      provider_window_started_at = now(),
      status = 'sending',
      updated_at = now()
    WHERE id = p_delivery_id
    RETURNING * INTO v_delivery;
  END IF;

  RETURN QUERY
  SELECT
    v_delivery.status,
    v_delivery.provider_message_id,
    v_delivery.pay_url,
    v_delivery.rendered_html,
    v_delivery.rendered_text,
    v_delivery.provider_window_started_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_structured_quote_send(
  p_delivery_id uuid,
  p_provider_message_id text
)
RETURNS TABLE (
  delivery_status text,
  completion_created boolean,
  qualification_created boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_delivery record;
  v_quote record;
  v_completion_created boolean;
  v_qualification_created boolean;
BEGIN
  IF length(COALESCE(p_provider_message_id, '')) > 300 OR
     COALESCE(p_provider_message_id, '') !~
       '^[A-Za-z0-9][A-Za-z0-9._:@/-]*$' THEN
    RAISE EXCEPTION 'QUOTE_SEND_INVALID_PROVIDER_ID' USING ERRCODE = 'P0001';
  END IF;

  SELECT d.*
  INTO v_delivery
  FROM public.quote_send_deliveries d
  WHERE d.id = p_delivery_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUOTE_SEND_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;
  IF v_delivery.status IN ('failed', 'delivery_failed') THEN
    RAISE EXCEPTION 'QUOTE_SEND_ALREADY_FAILED' USING ERRCODE = 'P0001';
  END IF;
  IF v_delivery.provider_message_id IS NOT NULL AND
     v_delivery.provider_message_id <> p_provider_message_id THEN
    RAISE EXCEPTION 'QUOTE_SEND_PROVIDER_ID_MISMATCH' USING ERRCODE = 'P0001';
  END IF;

  SELECT q.quote_revision, q.qualified_at, q.lifecycle_status
  INTO v_quote
  FROM public.quote_requests q
  WHERE q.id = v_delivery.quote_id
  FOR UPDATE;
  IF NOT FOUND OR v_quote.quote_revision <> v_delivery.quote_revision THEN
    RAISE EXCEPTION 'QUOTE_SEND_REVISION_MISMATCH' USING ERRCODE = 'P0001';
  END IF;

  v_completion_created :=
    v_delivery.status <> 'sent' OR v_delivery.provider_message_id IS NULL;
  v_qualification_created := v_quote.qualified_at IS NULL;

  UPDATE public.quote_send_deliveries
  SET
    status = 'sent',
    provider_message_id = COALESCE(provider_message_id, p_provider_message_id),
    sent_at = COALESCE(sent_at, now()),
    last_error = NULL,
    updated_at = now()
  WHERE id = p_delivery_id
  RETURNING * INTO v_delivery;

  UPDATE public.quote_requests
  SET
    replied_at = v_delivery.sent_at,
    reply_body = v_delivery.reply_body,
    quoted_at = COALESCE(quote_requests.quoted_at, v_delivery.sent_at),
    qualified_at = CASE
      WHEN v_qualification_created THEN v_delivery.sent_at
      ELSE quote_requests.qualified_at
    END,
    lifecycle_status = CASE
      WHEN quote_requests.lifecycle_status IN ('won', 'archived', 'lost')
        THEN quote_requests.lifecycle_status
      WHEN quote_requests.converted_order_id IS NOT NULL
        THEN 'checkout_started'
      ELSE 'quoted'
    END
  WHERE id = v_delivery.quote_id
    AND quote_revision = v_delivery.quote_revision;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUOTE_SEND_REVISION_MISMATCH' USING ERRCODE = 'P0001';
  END IF;

  IF v_qualification_created THEN
    INSERT INTO public.quote_measurement_event_outbox (quote_id, event_name)
    VALUES (v_delivery.quote_id, 'quote_qualified')
    ON CONFLICT (quote_id, event_name) DO NOTHING;
  END IF;

  RETURN QUERY
  SELECT v_delivery.status, v_completion_created, v_qualification_created;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_structured_quote_send_failure(
  p_delivery_id uuid,
  p_outcome text,
  p_error text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_status text;
BEGIN
  IF p_outcome NOT IN ('rejected', 'unknown') THEN
    RAISE EXCEPTION 'QUOTE_SEND_INVALID_OUTCOME' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.quote_send_deliveries
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
    RAISE EXCEPTION 'QUOTE_SEND_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;
  RETURN v_status;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_stale_structured_quote_send(
  p_quote_id uuid,
  p_delivery_id uuid,
  p_resolution text,
  p_provider_message_id text,
  p_actor text
)
RETURNS TABLE (
  delivery_status text,
  qualification_created boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_delivery record;
  v_completion record;
BEGIN
  IF p_resolution NOT IN ('confirm_sent', 'confirm_not_sent') OR
     btrim(COALESCE(p_actor, '')) = '' THEN
    RAISE EXCEPTION 'QUOTE_SEND_INVALID_RESOLUTION' USING ERRCODE = 'P0001';
  END IF;

  SELECT d.*
  INTO v_delivery
  FROM public.quote_send_deliveries d
  WHERE d.id = p_delivery_id
    AND d.quote_id = p_quote_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUOTE_SEND_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF p_resolution = 'confirm_sent' THEN
    IF v_delivery.status NOT IN ('sending', 'pending_confirmation') OR
       btrim(COALESCE(p_provider_message_id, '')) = '' THEN
      RAISE EXCEPTION 'QUOTE_SEND_INVALID_RESOLUTION' USING ERRCODE = 'P0001';
    END IF;

    SELECT *
    INTO v_completion
    FROM public.complete_structured_quote_send(
      p_delivery_id,
      p_provider_message_id
    );

    UPDATE public.quote_send_deliveries
    SET
      resolution = 'manual_confirmed_sent',
      resolved_at = now(),
      resolved_by = left(p_actor, 320),
      updated_at = now()
    WHERE id = p_delivery_id;

    RETURN QUERY
    SELECT v_completion.delivery_status, v_completion.qualification_created;
    RETURN;
  END IF;

  IF v_delivery.status = 'prepared' THEN
    IF v_delivery.pay_url IS NOT NULL OR
       v_delivery.created_at >= now() - interval '15 minutes' THEN
      RAISE EXCEPTION 'QUOTE_SEND_RESOLUTION_NOT_STALE' USING ERRCODE = 'P0001';
    END IF;
  ELSIF v_delivery.status IN ('sending', 'pending_confirmation') THEN
    IF v_delivery.provider_window_started_at IS NULL OR
       v_delivery.provider_window_started_at >= now() - interval '23 hours' THEN
      RAISE EXCEPTION 'QUOTE_SEND_RESOLUTION_NOT_STALE' USING ERRCODE = 'P0001';
    END IF;
  ELSE
    RAISE EXCEPTION 'QUOTE_SEND_INVALID_RESOLUTION' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.quote_send_deliveries
  SET
    status = 'failed',
    resolution = 'manual_confirmed_not_sent',
    resolved_at = now(),
    resolved_by = left(p_actor, 320),
    last_error = 'Staff confirmed no provider delivery after the safe retry window',
    updated_at = now()
  WHERE id = p_delivery_id;

  RETURN QUERY SELECT 'failed'::text, false;
END;
$$;

REVOKE ALL ON TABLE public.quote_send_deliveries
  FROM public, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.quote_send_deliveries
  TO service_role;

REVOKE ALL ON FUNCTION public.structured_quote_pst_base_cents(jsonb)
  FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.structured_quote_pst_base_cents_v2(jsonb)
  FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_structured_quote_pricing_v2(
  uuid, integer, integer, integer, integer, text, jsonb
) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_quote_revision_delivery()
  FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepare_structured_quote_send(
  uuid, integer, integer, integer, integer, text, jsonb, text, text, text, text
) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.arm_structured_quote_send(uuid, text, text, text)
  FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_structured_quote_send(uuid, text)
  FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_structured_quote_send_failure(uuid, text, text)
  FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.resolve_stale_structured_quote_send(
  uuid, uuid, text, text, text
) FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.structured_quote_pst_base_cents(jsonb)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.structured_quote_pst_base_cents_v2(jsonb)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.set_structured_quote_pricing_v2(
  uuid, integer, integer, integer, integer, text, jsonb
) TO service_role;
GRANT EXECUTE ON FUNCTION public.prepare_structured_quote_send(
  uuid, integer, integer, integer, integer, text, jsonb, text, text, text, text
) TO service_role;
GRANT EXECUTE ON FUNCTION public.arm_structured_quote_send(uuid, text, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_structured_quote_send(uuid, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.record_structured_quote_send_failure(uuid, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.resolve_stale_structured_quote_send(
  uuid, uuid, text, text, text
) TO service_role;
