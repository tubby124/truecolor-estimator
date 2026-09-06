\set ON_ERROR_STOP on
-- EMPTY LOCAL DISPOSABLE DATABASE ONLY. No external/provider calls.
-- psql -X "$TEST_DB_URL" -f scripts/social/sql/generation-regression.sql
BEGIN;
DO $$ BEGIN
  IF to_regclass('public.social_generation_jobs') IS NOT NULL THEN
    RAISE EXCEPTION 'Use an empty disposable database; generation tables already exist';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END $$;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
\ir ../../../migrations/20260906_social_generation.sql
-- A rerun must revoke historical column grants too, not just table grants.
GRANT SELECT (result), UPDATE (status) ON public.social_generation_jobs TO authenticated;
\ir ../../../migrations/20260906_social_generation.sql
CREATE FUNCTION pg_temp.check_that(ok boolean, message text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION '%', message; END IF; END $$;

SET LOCAL ROLE service_role;
DO $$
DECLARE
  a uuid := '00000000-0000-4000-8000-000000000003';
  b uuid := '00000000-0000-4000-8000-000000000002';
  j1 uuid := '00000000-0000-4000-8000-000000000101';
  j2 uuid := '00000000-0000-4000-8000-000000000102';
  j3 uuid := '00000000-0000-4000-8000-000000000103';
  r jsonb;
BEGIN
  PERFORM pg_temp.check_that((SELECT daily_call_limit=20 FROM public.social_generation_settings
    WHERE business_id='00000000-0000-4000-8000-000000000001'),'Owner on-demand allowance not seeded');
  r := public.claim_social_generation(a,j1,repeat('a',64),repeat('a',64),2,0.2);
  PERFORM pg_temp.check_that(r->>'status' = 'budget','Fresh business must default to zero paid allowance');
  PERFORM pg_temp.check_that(NOT EXISTS (SELECT FROM public.social_generation_jobs),'Budget refusal created a job');
  UPDATE public.social_generation_settings SET daily_call_limit=6,daily_usd_limit=1,max_cost_per_call_usd=0.1 WHERE business_id=a;
  INSERT INTO public.social_generation_settings (business_id,daily_call_limit,daily_usd_limit,max_cost_per_call_usd) VALUES (b,2,1,0.1);
  r := public.claim_social_generation(a,j1,repeat('a',64),repeat('a',64),2,0);
  PERFORM pg_temp.check_that(r->>'status' = 'budget','USD budget requires positive max cost reservation');
  r := public.claim_social_generation(a,j1,repeat('a',64),repeat('a',64),2,0.1);
  PERFORM pg_temp.check_that(r->>'status' = 'budget','Reservation below two-call maximum accepted');
  UPDATE public.social_generation_settings SET max_cost_per_call_usd=NULL WHERE business_id=a;
  r := public.claim_social_generation(a,j1,repeat('a',64),repeat('a',64),2,0.2);
  PERFORM pg_temp.check_that(r->>'status' = 'budget','Dollar ceiling accepted unconfigured cost bound');
  UPDATE public.social_generation_settings SET max_cost_per_call_usd=0.1 WHERE business_id=a;
  r := public.claim_social_generation(a,j1,repeat('a',64),repeat('a',64),2,0.2);
  PERFORM pg_temp.check_that(r->>'status' = 'claimed','First claim failed');
  r := public.claim_social_generation(a,j1,repeat('a',64),repeat('a',64),2,0.2);
  PERFORM pg_temp.check_that(r->>'status' = 'existing','Stable ID did not reuse running job');
  r := public.claim_social_generation(a,gen_random_uuid(),repeat('a',64),repeat('a',64),2,0.2);
  PERFORM pg_temp.check_that(r->>'status' = 'existing' AND r->'job'->>'id'=j1::text,'Different ID duplicated exact running content');
  PERFORM pg_temp.check_that((SELECT reserved_calls=2 FROM public.social_generation_daily_usage WHERE business_id=a),'Stable ID reserved twice');
  r := public.claim_social_generation(a,j1,repeat('b',64),repeat('a',64),2,0.2);
  PERFORM pg_temp.check_that(r->>'status' = 'conflict','Same ID accepted changed input');
  r := public.claim_social_generation(a,j1,repeat('a',64),repeat('b',64),2,0.2);
  PERFORM pg_temp.check_that(r->>'status' = 'conflict','Same ID accepted changed cache key');
  r := public.claim_social_generation(a,j2,repeat('b',64),repeat('b',64),2,0.2);
  PERFORM pg_temp.check_that(r->>'status' = 'claimed','Second concurrency slot unavailable');
  r := public.claim_social_generation(a,j3,repeat('c',64),repeat('c',64),2,0.2);
  PERFORM pg_temp.check_that(r->>'status' = 'busy','Third concurrent job admitted');
  r := public.finish_social_generation(b,j1,'completed','{"private":"B"}','{}',1,1,0.1);
  PERFORM pg_temp.check_that(r->>'status' = 'missing','Cross-business settlement found job');
  r := public.finish_social_generation(a,j1,'completed','{"private":"A"}','{"model":"mock"}',1,1,0.1);
  PERFORM pg_temp.check_that(r->>'status' = 'updated','Settlement failed');
  r := public.finish_social_generation(a,j1,'failed',NULL,'{}',2,2,0.2);
  PERFORM pg_temp.check_that(r->>'status' = 'existing' AND r->'job'->>'status' = 'completed','Terminal job overwritten');
  PERFORM pg_temp.check_that((SELECT used_calls=1 AND reserved_calls=2 AND used_usd=0.1 AND reserved_usd=0.2 FROM public.social_generation_daily_usage WHERE business_id=a),'Settlement double charged or released wrong reservation');
  UPDATE public.social_generation_settings SET daily_call_limit=0,daily_usd_limit=0 WHERE business_id=a;
  r := public.claim_social_generation(a,j3,repeat('a',64),repeat('a',64),2,0.2);
  PERFORM pg_temp.check_that(r->>'status' = 'cached' AND r->'job'->'result'->>'private'='A'
    AND (r->'job'->>'reserved_calls')::int=0,'Exact cache reuse must bypass paid budget with zero calls');
  r := public.claim_social_generation(b,j1,repeat('a',64),repeat('a',64),2,0.2);
  PERFORM pg_temp.check_that(r->>'status' = 'claimed' AND r->'job'->'result'='null'::jsonb,'Cache or request ID leaked between businesses');
  r := public.finish_social_generation(b,j1,'partial','{"instagram":"saved draft"}','{}',1,1,NULL);
  PERFORM pg_temp.check_that(r->>'status'='updated' AND r->'job'->'usage'->>'costKnown'='false','Unknown cost lost');
  PERFORM pg_temp.check_that((SELECT used_calls=1 AND reserved_calls=0 AND reserved_usd=0.2 FROM public.social_generation_daily_usage WHERE business_id=b),'Unknown cost released upper bound');
  PERFORM pg_temp.check_that(NOT EXISTS (SELECT FROM public.social_generation_cache WHERE business_id=b),'Partial response cached as complete');
  r := public.claim_social_generation(b,j1,repeat('a',64),repeat('a',64),2,0.2);
  PERFORM pg_temp.check_that(r->'job'->'result'->>'instagram'='saved draft','Partial response not resumable');
  r := public.claim_social_generation(b,gen_random_uuid(),repeat('a',64),repeat('a',64),2,0.2);
  PERFORM pg_temp.check_that(r->>'status'='claimed' AND (r->'job'->>'reserved_calls')::int=1,'Partial same-key resume must use last available call');
  BEGIN
    PERFORM public.finish_social_generation(b,(r->'job'->>'id')::uuid,'failed',NULL,'{}',2,2,0.2);
    RAISE EXCEPTION 'One-call reservation permitted retry';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  PERFORM public.finish_social_generation(b,(r->'job'->>'id')::uuid,'failed',NULL,'{}',1,1,0.1);
  r := public.claim_social_generation(b,j2,repeat('b',64),repeat('b',64),2,0.2);
  PERFORM pg_temp.check_that(r->>'status'='budget','Exhausted daily calls exceeded');
  UPDATE public.social_generation_settings SET daily_call_limit=20,daily_usd_limit=0.3 WHERE business_id=b;
  r := public.claim_social_generation(b,j2,repeat('b',64),repeat('b',64),2,0.2);
  PERFORM pg_temp.check_that(r->>'status'='budget','Unknown-cost reservation did not stop dollar ceiling');
  UPDATE public.social_generation_settings SET daily_call_limit=20,daily_usd_limit=1 WHERE business_id=b;
  r := public.claim_social_generation(b,j2,repeat('b',64),repeat('b',64),2,0.2);
  r := public.finish_social_generation(b,j2,'held','{"reason":"ambiguous timeout"}','{}',1,1,NULL);
  PERFORM pg_temp.check_that((SELECT reserved_calls=2 AND reserved_usd=0.4 FROM public.social_generation_daily_usage WHERE business_id=b),'Ambiguous hold released budget');
  UPDATE public.social_generation_jobs SET started_at=clock_timestamp()-interval '6 minutes' WHERE business_id=a AND id=j2;
  r := public.claim_social_generation(a,j2,repeat('b',64),repeat('b',64),2,0.2);
  PERFORM pg_temp.check_that(r->>'status'='existing' AND r->'job'->>'status'='held','Expired lease retried rather than held');
  r := public.claim_social_generation(a,gen_random_uuid(),repeat('b',64),repeat('b',64),2,0.2);
  PERFORM pg_temp.check_that(r->>'status'='existing' AND r->'job'->>'status'='held' AND r->'job'->>'id'=j2::text,'Fresh ID bypassed held exact-content job');
  PERFORM pg_temp.check_that((SELECT reserved_calls=2 FROM public.social_generation_daily_usage WHERE business_id=a),'Expired lease released uncertain allowance');
  r := public.finish_social_generation(a,j2,'completed','{}','{}',1,1,0.1);
  PERFORM pg_temp.check_that(r->>'status'='existing' AND r->'job'->>'status'='held','Late response overwrote held job');
  INSERT INTO public.social_generation_observations (business_id,media_hash,profile_version,observation)
    VALUES (a,repeat('f',64),'v1','{"subject":"sign"}'),(b,repeat('f',64),'v1','{"subject":"poster"}');
  PERFORM pg_temp.check_that((SELECT count(*)=2 FROM public.social_generation_observations),'Observation tenant key collision');
  BEGIN
    PERFORM public.claim_social_generation(a,gen_random_uuid(),'short',repeat('x',64),2,0.1);
    RAISE EXCEPTION 'Short hash accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN
    PERFORM public.claim_social_generation(a,gen_random_uuid(),repeat('x',64),repeat('x',64),3,0.1);
    RAISE EXCEPTION 'More than one retry accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN
    INSERT INTO public.social_generation_hashtag_candidates (business_id,researched_at,expires_at,candidates,provenance)
      VALUES (a,clock_timestamp(),clock_timestamp()+interval '1 day','["#Saskatoon"]','researched');
    RAISE EXCEPTION 'Research claim without evidence accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
DO $$
DECLARE c uuid := gen_random_uuid(); j uuid := gen_random_uuid(); r jsonb;
BEGIN
  INSERT INTO public.social_generation_settings (business_id,daily_call_limit,daily_usd_limit,max_cost_per_call_usd)
    VALUES (c,1,1,0.1);
  r := public.claim_social_generation(c,j,repeat('c',64),repeat('c',64),2,0.2);
  PERFORM pg_temp.check_that(r->>'status'='claimed' AND (r->'job'->>'reserved_calls')::int=1
    AND (r->'job'->>'reserved_usd')::numeric=0.1,'Daily limit1 must reserve exactly one call');
  PERFORM public.finish_social_generation(c,j,'failed',NULL,'{}',1,1,0.1);
  UPDATE public.social_generation_settings SET daily_call_limit=20,daily_usd_limit=0.25 WHERE business_id=c;
  r := public.claim_social_generation(c,gen_random_uuid(),repeat('d',64),repeat('d',64),2,0.2);
  PERFORM pg_temp.check_that(r->>'status'='claimed' AND (r->'job'->>'reserved_calls')::int=1
    AND (r->'job'->>'reserved_usd')::numeric=0.1,'Dollar ceiling should admit one bounded call');
  r := public.claim_social_generation(c,gen_random_uuid(),repeat('e',64),repeat('e',64),2,0.2);
  PERFORM pg_temp.check_that(r->>'status'='budget','Dollar ceiling admitted unaffordable call');
END $$;
RESET ROLE;
DO $$
DECLARE r text; t text; f text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
    FOREACH t IN ARRAY ARRAY['social_generation_settings','social_generation_daily_usage','social_generation_jobs',
      'social_generation_cache','social_generation_observations','social_generation_hashtag_candidates'] LOOP
      PERFORM pg_temp.check_that(NOT has_table_privilege(r,'public.'||t,'SELECT,INSERT,UPDATE,DELETE'),r||' has access to '||t);
      PERFORM pg_temp.check_that(NOT has_any_column_privilege(r,'public.'||t,'SELECT,INSERT,UPDATE,REFERENCES'),r||' has column access to '||t);
      PERFORM pg_temp.check_that((SELECT relrowsecurity FROM pg_class WHERE oid=('public.'||t)::regclass),'Missing RLS on '||t);
    END LOOP;
    FOREACH f IN ARRAY ARRAY['claim_social_generation(uuid,uuid,text,text,integer,numeric)',
      'finish_social_generation(uuid,uuid,text,jsonb,jsonb,integer,integer,numeric)'] LOOP
      PERFORM pg_temp.check_that(NOT has_function_privilege(r,'public.'||f,'EXECUTE'),r||' can execute '||f);
      PERFORM pg_temp.check_that(has_function_privilege('service_role','public.'||f,'EXECUTE'),'Service cannot execute '||f);
    END LOOP;
  END LOOP;
END $$;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  BEGIN
    PERFORM public.claim_social_generation(gen_random_uuid(),gen_random_uuid(),repeat('a',64),repeat('a',64),2,0.1);
    RAISE EXCEPTION 'Browser claimed paid job';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM * FROM public.social_generation_jobs;
    RAISE EXCEPTION 'Browser read generation jobs';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
\echo 'Social generation SQL regression passed (rolled back).'
