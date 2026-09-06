-- Prepared migration only: production application requires explicit owner approval.
CREATE TABLE IF NOT EXISTS public.social_batches (
  id uuid PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.social_businesses(id),
  month text NOT NULL CHECK (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, id)
);
CREATE TABLE IF NOT EXISTS public.social_batch_chunks (
  business_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  request_id uuid NOT NULL,
  payload_hash text NOT NULL CHECK (length(payload_hash) = 64),
  post_ids uuid[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, request_id),
  FOREIGN KEY (business_id, batch_id) REFERENCES public.social_batches(business_id,id)
);
CREATE UNIQUE INDEX IF NOT EXISTS social_posts_monthly_creative_destination
  ON public.social_posts (business_id,batch_id,creative_id,platforms) WHERE batch_id IS NOT NULL;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='social_posts_monthly_business_batch_fk') THEN
  ALTER TABLE public.social_posts ADD CONSTRAINT social_posts_monthly_business_batch_fk FOREIGN KEY(business_id,batch_id) REFERENCES public.social_batches(business_id,id);
 END IF;
END $$;
CREATE INDEX IF NOT EXISTS social_posts_monthly_review ON public.social_posts(business_id,batch_id,created_at,id);
ALTER TABLE public.social_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_batch_chunks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.social_batches, public.social_batch_chunks FROM anon, authenticated;
GRANT ALL ON public.social_batches, public.social_batch_chunks TO service_role;

CREATE OR REPLACE FUNCTION public.save_social_batch_chunk(
  p_business_id uuid, p_batch_id uuid, p_month text, p_created_by uuid,
  p_request_id uuid, p_payload_hash text, p_posts jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE prior public.social_batch_chunks%ROWTYPE; saved_ids uuid[]; result jsonb;
BEGIN
  IF jsonb_typeof(p_posts) <> 'array' OR jsonb_array_length(p_posts) NOT BETWEEN 1 AND 30 THEN
    RAISE EXCEPTION 'Invalid chunk' USING ERRCODE='22023';
  END IF;
  -- Serialize matching request IDs before checking the durable request receipt.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_business_id::text || p_request_id::text,0));
  SELECT * INTO prior FROM public.social_batch_chunks WHERE business_id=p_business_id AND request_id=p_request_id;
  IF FOUND THEN
    IF prior.payload_hash <> p_payload_hash OR prior.batch_id <> p_batch_id THEN
      RAISE EXCEPTION 'Request changed' USING ERRCODE='22023';
    END IF;
    SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.id),'[]'::jsonb) INTO result FROM public.social_posts p WHERE p.business_id=p_business_id AND p.id=ANY(prior.post_ids);
    RETURN result;
  END IF;
  INSERT INTO public.social_batches(id,business_id,month,created_by) VALUES(p_batch_id,p_business_id,p_month,p_created_by) ON CONFLICT(id) DO NOTHING;
  IF NOT EXISTS(SELECT 1 FROM public.social_batches WHERE id=p_batch_id AND business_id=p_business_id AND month=p_month) THEN
    RAISE EXCEPTION 'Batch unavailable or month changed' USING ERRCODE='22023';
  END IF;
  -- Only whitelisted draft columns are imported; input cannot approve or publish.
  WITH inserted AS (
    INSERT INTO public.social_posts(id,business_id,batch_id,creative_id,caption_raw,caption_instagram,caption_facebook,caption_gbp,hashtags,image_url,platforms,schedule_time,fact_fingerprint,product_slug,product_configuration,generation_job_id,offer_id,gbp_payload,approval_version,status,source,post_number)
    SELECT x.id,p_business_id,p_batch_id,x.creative_id,x.caption_raw,x.caption_instagram,x.caption_facebook,x.caption_gbp,x.hashtags,x.image_url,x.platforms,x.schedule_time,x.fact_fingerprint,x.product_slug,x.product_configuration,x.generation_job_id,x.offer_id,x.gbp_payload,2,'draft','batch',1
    FROM jsonb_to_recordset(p_posts) AS x(id uuid,creative_id uuid,caption_raw text,caption_instagram text,caption_facebook text,caption_gbp text,hashtags text,image_url text,platforms text[],schedule_time timestamptz,fact_fingerprint text,product_slug text,product_configuration jsonb,generation_job_id uuid,offer_id uuid,gbp_payload jsonb)
    RETURNING id
  ) SELECT array_agg(id) INTO saved_ids FROM inserted;
  INSERT INTO public.social_batch_chunks(business_id,batch_id,request_id,payload_hash,post_ids) VALUES(p_business_id,p_batch_id,p_request_id,p_payload_hash,saved_ids);
  SELECT jsonb_agg(to_jsonb(p) ORDER BY p.id) INTO result FROM public.social_posts p WHERE p.business_id=p_business_id AND p.id=ANY(saved_ids);
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.save_social_batch_chunk(uuid,uuid,text,uuid,uuid,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_social_batch_chunk(uuid,uuid,text,uuid,uuid,text,jsonb) TO service_role;
