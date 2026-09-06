-- PREPARED ONLY: explicit approval is required before production application.
-- Independent of the business-table migration. Business IDs are resolved by the
-- staff-authorized server; browser roles cannot read or mutate any of this data.
CREATE TABLE IF NOT EXISTS public.social_generation_settings (
  business_id uuid PRIMARY KEY,
  daily_call_limit integer NOT NULL DEFAULT 0 CHECK (daily_call_limit >= 0),
  daily_usd_limit numeric(16,8) CHECK (daily_usd_limit >= 0 AND daily_usd_limit::text NOT IN ('NaN','Infinity','-Infinity')),
  max_cost_per_call_usd numeric(16,8) CHECK (max_cost_per_call_usd > 0 AND max_cost_per_call_usd::text NOT IN ('NaN','Infinity','-Infinity')),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
-- Preserve the existing owner's on-demand generation allowance. New businesses
-- remain default-deny; this does not authorize bulk or paid test generations.
INSERT INTO public.social_generation_settings (business_id,daily_call_limit)
  VALUES ('00000000-0000-4000-8000-000000000001',20) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS public.social_generation_daily_usage (
  business_id uuid NOT NULL,
  usage_day date NOT NULL,
  used_calls integer NOT NULL DEFAULT 0 CHECK (used_calls >= 0),
  reserved_calls integer NOT NULL DEFAULT 0 CHECK (reserved_calls >= 0),
  used_usd numeric(16,8) NOT NULL DEFAULT 0 CHECK (used_usd >= 0),
  reserved_usd numeric(16,8) NOT NULL DEFAULT 0 CHECK (reserved_usd >= 0),
  PRIMARY KEY (business_id, usage_day)
);
CREATE TABLE IF NOT EXISTS public.social_generation_jobs (
  business_id uuid NOT NULL,
  id uuid NOT NULL,
  input_hash text NOT NULL CHECK (length(input_hash) BETWEEN 16 AND 256),
  cache_key text NOT NULL CHECK (length(cache_key) BETWEEN 16 AND 256),
  status text NOT NULL CHECK (status IN ('running','completed','partial','failed','held')),
  result jsonb,
  usage jsonb NOT NULL DEFAULT '{}',
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 2),
  reserved_calls integer NOT NULL DEFAULT 0 CHECK (reserved_calls BETWEEN 0 AND 2),
  reserved_usd numeric(16,8) NOT NULL DEFAULT 0 CHECK (reserved_usd >= 0),
  usage_day date NOT NULL DEFAULT (clock_timestamp() AT TIME ZONE 'UTC')::date,
  started_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (business_id, id)
);
CREATE INDEX IF NOT EXISTS social_generation_running_business
  ON public.social_generation_jobs (business_id, started_at) WHERE status = 'running';
CREATE INDEX IF NOT EXISTS social_generation_unresolved_cache
  ON public.social_generation_jobs (business_id, cache_key) WHERE status IN ('running','held');
CREATE TABLE IF NOT EXISTS public.social_generation_cache (
  business_id uuid NOT NULL,
  cache_key text NOT NULL CHECK (length(cache_key) BETWEEN 16 AND 256),
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL DEFAULT clock_timestamp() + interval '30 days',
  PRIMARY KEY (business_id, cache_key)
);
CREATE TABLE IF NOT EXISTS public.social_generation_observations (
  business_id uuid NOT NULL,
  media_hash text NOT NULL CHECK (length(media_hash) BETWEEN 16 AND 256),
  profile_version text NOT NULL CHECK (length(profile_version) BETWEEN 1 AND 256),
  observation jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (business_id, media_hash, profile_version)
);
CREATE TABLE IF NOT EXISTS public.social_generation_hashtag_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  product_slug text,
  researched_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  candidates jsonb NOT NULL CHECK (jsonb_typeof(candidates) = 'array'),
  sources jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(sources) = 'array'),
  provenance text NOT NULL DEFAULT 'model_suggestion' CHECK (provenance IN ('researched','model_suggestion')),
  CHECK (expires_at > researched_at),
  CHECK (provenance <> 'researched' OR jsonb_array_length(sources) > 0)
);
CREATE INDEX IF NOT EXISTS social_generation_hashtags_lookup
  ON public.social_generation_hashtag_candidates (business_id, product_slug, expires_at);

-- Per-business settings lock serializes claims AND settlement, including the
-- first concurrent claims (INSERT ON CONFLICT waits for the competing insert).
CREATE OR REPLACE FUNCTION public.claim_social_generation(
  p_business_id uuid, p_request_id uuid, p_input_hash text, p_cache_key text,
  p_reserved_calls integer, p_reserved_usd numeric
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  v_settings public.social_generation_settings%ROWTYPE;
  v_job public.social_generation_jobs%ROWTYPE;
  v_cache public.social_generation_cache%ROWTYPE;
  v_usage public.social_generation_daily_usage%ROWTYPE;
  v_calls integer;
  v_usd numeric;
  v_per_call_usd numeric;
  v_day date := (clock_timestamp() AT TIME ZONE 'UTC')::date;
BEGIN
  IF p_business_id IS NULL OR p_request_id IS NULL
    OR p_input_hash IS NULL OR length(p_input_hash) NOT BETWEEN 16 AND 256
    OR p_cache_key IS NULL OR length(p_cache_key) NOT BETWEEN 16 AND 256
    OR p_reserved_calls IS NULL OR p_reserved_calls NOT BETWEEN 1 AND 2
    OR p_reserved_usd IS NULL OR p_reserved_usd < 0
    OR p_reserved_usd::text IN ('NaN','Infinity','-Infinity') THEN
    RAISE EXCEPTION 'Invalid generation claim' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.social_generation_settings (business_id) VALUES (p_business_id) ON CONFLICT DO NOTHING;
  SELECT * INTO v_settings FROM public.social_generation_settings WHERE business_id = p_business_id FOR UPDATE;
  -- An expired process may have paid the provider. Hold it and retain its budget;
  -- neither the same request ID nor a subsequent claim retries that work.
  UPDATE public.social_generation_jobs SET status = 'held', updated_at = clock_timestamp(),
    usage = usage || jsonb_build_object('holdReason','lease_expired')
    WHERE business_id = p_business_id AND status = 'running'
      AND started_at < clock_timestamp() - interval '5 minutes';
  SELECT * INTO v_job FROM public.social_generation_jobs WHERE business_id = p_business_id AND id = p_request_id;
  IF FOUND THEN
    IF v_job.input_hash <> p_input_hash OR v_job.cache_key <> p_cache_key THEN
      RETURN jsonb_build_object('status','conflict','job',to_jsonb(v_job));
    END IF;
    RETURN jsonb_build_object('status','existing','job',to_jsonb(v_job));
  END IF;
  -- Separate request IDs must still share identical in-flight work. A held
  -- response blocks automatic re-generation until explicit reconciliation.
  -- Partial terminal jobs are deliberately excluded so missing copy can resume.
  SELECT * INTO v_job FROM public.social_generation_jobs
    WHERE business_id = p_business_id AND cache_key = p_cache_key AND status IN ('running','held')
    ORDER BY (status = 'held') DESC, started_at LIMIT 1;
  IF FOUND THEN RETURN jsonb_build_object('status','existing','job',to_jsonb(v_job)); END IF;
  SELECT * INTO v_cache FROM public.social_generation_cache
    WHERE business_id = p_business_id AND cache_key = p_cache_key AND expires_at > clock_timestamp();
  IF FOUND THEN
    INSERT INTO public.social_generation_jobs (business_id,id,input_hash,cache_key,status,result,usage,usage_day)
      VALUES (p_business_id,p_request_id,p_input_hash,p_cache_key,'completed',v_cache.result,
        '{"cacheHit":true,"providerCalls":0}'::jsonb,v_day) RETURNING * INTO v_job;
    RETURN jsonb_build_object('status','cached','job',to_jsonb(v_job));
  END IF;
  IF (SELECT count(*) FROM public.social_generation_jobs WHERE business_id = p_business_id AND status = 'running') >= 2 THEN
    RETURN jsonb_build_object('status','busy');
  END IF;
  INSERT INTO public.social_generation_daily_usage (business_id,usage_day) VALUES (p_business_id,v_day) ON CONFLICT DO NOTHING;
  SELECT * INTO v_usage FROM public.social_generation_daily_usage WHERE business_id = p_business_id AND usage_day = v_day;
  v_calls := least(p_reserved_calls, v_settings.daily_call_limit - v_usage.used_calls - v_usage.reserved_calls);
  v_per_call_usd := p_reserved_usd / p_reserved_calls;
  IF v_settings.daily_usd_limit IS NOT NULL THEN
    IF v_settings.max_cost_per_call_usd IS NULL OR v_per_call_usd < v_settings.max_cost_per_call_usd THEN
      RETURN jsonb_build_object('status','budget');
    END IF;
    v_calls := least(v_calls, floor((v_settings.daily_usd_limit - v_usage.used_usd - v_usage.reserved_usd) / v_per_call_usd));
  END IF;
  -- The last available call can generate a draft, with no retry allowance.
  -- Round reservations upwards to the ledger precision, never below the bound.
  v_usd := ceil(v_per_call_usd * v_calls * 100000000) / 100000000;
  IF v_calls < 1 OR (v_settings.daily_usd_limit IS NOT NULL
    AND v_usage.used_usd + v_usage.reserved_usd + v_usd > v_settings.daily_usd_limit) THEN
    RETURN jsonb_build_object('status','budget');
  END IF;
  UPDATE public.social_generation_daily_usage
    SET reserved_calls = reserved_calls + v_calls, reserved_usd = reserved_usd + v_usd
    WHERE business_id = p_business_id AND usage_day = v_day;
  INSERT INTO public.social_generation_jobs (business_id,id,input_hash,cache_key,status,reserved_calls,reserved_usd,usage_day)
    VALUES (p_business_id,p_request_id,p_input_hash,p_cache_key,'running',v_calls,v_usd,v_day)
    RETURNING * INTO v_job;
  RETURN jsonb_build_object('status','claimed','job',to_jsonb(v_job));
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_social_generation(
  p_business_id uuid, p_request_id uuid, p_status text, p_result jsonb,
  p_usage jsonb, p_attempts integer, p_actual_calls integer, p_actual_usd numeric DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE v_job public.social_generation_jobs%ROWTYPE;
BEGIN
  IF p_business_id IS NULL OR p_request_id IS NULL OR p_status IS NULL
    OR p_status NOT IN ('completed','partial','failed','held')
    OR p_attempts IS NULL OR p_attempts NOT BETWEEN 0 AND 2
    OR p_actual_calls IS NULL OR p_actual_calls NOT BETWEEN 0 AND 2
    OR p_actual_calls > p_attempts
    OR (p_actual_usd IS NOT NULL AND (p_actual_usd < 0 OR p_actual_usd::text IN ('NaN','Infinity','-Infinity')))
    OR (p_status IN ('completed','partial') AND p_result IS NULL)
    OR (p_usage IS NOT NULL AND jsonb_typeof(p_usage) <> 'object') THEN
    RAISE EXCEPTION 'Invalid generation settlement' USING ERRCODE = '22023';
  END IF;
  PERFORM 1 FROM public.social_generation_settings WHERE business_id = p_business_id FOR UPDATE;
  SELECT * INTO v_job FROM public.social_generation_jobs WHERE business_id = p_business_id AND id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','missing'); END IF;
  IF v_job.status <> 'running' THEN RETURN jsonb_build_object('status','existing','job',to_jsonb(v_job)); END IF;
  IF p_actual_calls > v_job.reserved_calls OR p_attempts > v_job.reserved_calls THEN
    RAISE EXCEPTION 'Provider calls exceed job reservation' USING ERRCODE = '22023';
  END IF;
  -- Unknown dollar cost is never reported as zero. It retains the upper-bound
  -- reservation even for successful jobs. Holds retain ALL reserved allowances
  -- until explicit operator reconciliation; a timeout cannot release spend.
  IF p_status <> 'held' THEN
    UPDATE public.social_generation_daily_usage SET
      reserved_calls = reserved_calls - v_job.reserved_calls,
      used_calls = used_calls + p_actual_calls,
      reserved_usd = reserved_usd - CASE WHEN p_actual_usd IS NULL THEN 0 ELSE v_job.reserved_usd END,
      used_usd = used_usd + coalesce(p_actual_usd,0)
      WHERE business_id = p_business_id AND usage_day = v_job.usage_day;
  END IF;
  UPDATE public.social_generation_jobs SET status = p_status, result = p_result,
    usage = coalesce(p_usage,'{}') || jsonb_build_object('providerCalls',p_actual_calls,'actualUsd',p_actual_usd,
      'costKnown',p_actual_usd IS NOT NULL,'reservationHeld',p_status = 'held' OR p_actual_usd IS NULL),
    attempts = p_attempts, updated_at = clock_timestamp()
    WHERE business_id = p_business_id AND id = p_request_id AND status = 'running' RETURNING * INTO v_job;
  IF p_status = 'completed' THEN
    INSERT INTO public.social_generation_cache (business_id,cache_key,result)
      VALUES (p_business_id,v_job.cache_key,p_result)
      ON CONFLICT (business_id,cache_key) DO UPDATE SET result = excluded.result,
        created_at = clock_timestamp(), expires_at = clock_timestamp() + interval '30 days';
  END IF;
  RETURN jsonb_build_object('status','updated','job',to_jsonb(v_job));
END;
$$;

-- Defence in depth: RLS + no browser grants. Service policy also works in local
-- test roles without Supabase's usual BYPASSRLS attribute.
DO $$
DECLARE v_table text; v_columns text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['social_generation_settings','social_generation_daily_usage',
    'social_generation_jobs','social_generation_cache','social_generation_observations','social_generation_hashtag_candidates'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',v_table);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated',v_table);
    SELECT string_agg(quote_ident(attname),', ' ORDER BY attnum) INTO v_columns
      FROM pg_catalog.pg_attribute WHERE attrelid = format('public.%I',v_table)::regclass AND attnum > 0 AND NOT attisdropped;
    EXECUTE format('REVOKE SELECT (%s), INSERT (%s), UPDATE (%s), REFERENCES (%s) ON TABLE public.%I FROM PUBLIC, anon, authenticated',
      v_columns,v_columns,v_columns,v_columns,v_table);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO service_role',v_table);
    EXECUTE format('DROP POLICY IF EXISTS social_generation_service ON public.%I',v_table);
    EXECUTE format('CREATE POLICY social_generation_service ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',v_table);
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_social_generation(uuid,uuid,text,text,integer,numeric) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.finish_social_generation(uuid,uuid,text,jsonb,jsonb,integer,integer,numeric) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_social_generation(uuid,uuid,text,text,integer,numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_social_generation(uuid,uuid,text,jsonb,jsonb,integer,integer,numeric) TO service_role;
