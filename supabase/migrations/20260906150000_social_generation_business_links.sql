-- PREPARED ONLY. Explicit production approval required.
-- Apply after business 120000, monthly 130000, and migrations/20260906_social_generation.sql.
-- Keep all social feature flags off until the complete package passes readback.
SET lock_timeout = '5s';
SET statement_timeout = '30s';

-- Generation can be tested independently, but the integrated hosted platform
-- requires a real business for every cache, job, observation and usage row.
DO $$
DECLARE table_name text; constraint_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'social_generation_settings', 'social_generation_daily_usage',
    'social_generation_jobs', 'social_generation_cache',
    'social_generation_observations', 'social_generation_hashtag_candidates'
  ] LOOP
    constraint_name := table_name || '_business_fk';
    IF NOT EXISTS (
      SELECT FROM pg_constraint
      WHERE conrelid = format('public.%I', table_name)::regclass
        AND conname = constraint_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (business_id) REFERENCES public.social_businesses(id)',
        table_name, constraint_name
      );
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT FROM pg_constraint WHERE conrelid = 'public.social_posts'::regclass
      AND conname = 'social_posts_business_generation_job_fk'
  ) THEN
    ALTER TABLE public.social_posts
      ADD CONSTRAINT social_posts_business_generation_job_fk
      FOREIGN KEY (business_id, generation_job_id)
      REFERENCES public.social_generation_jobs(business_id, id);
  END IF;
END $$;

-- No existing row is rewritten, approved, published or deleted. Unexpected
-- orphan references abort application for review rather than being repaired.
