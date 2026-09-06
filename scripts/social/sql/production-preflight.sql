-- READ ONLY. Run only against the verified True Color target when DB access is available.
-- This is NOT a migration and contains no customer rows or approval identifiers.
BEGIN READ ONLY;
SELECT current_database() AS database_name, current_user AS database_role, version() AS postgres_version;
SELECT c.relname AS table_name, a.attname AS column_name, format_type(a.atttypid,a.atttypmod) AS sql_type
FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND a.attnum>0 AND NOT a.attisdropped
  AND ((c.relname='social_posts' AND a.attname IN('id','platforms','schedule_time','approval_hash','updated_at'))
    OR (c.relname IN('social_post_results','social_accounts') AND a.attname IN('id','post_id','platform')))
ORDER BY c.relname,a.attname;
SELECT c.relname AS table_name, con.conname, pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN('social_posts','social_post_results','social_accounts','social_campaigns')
ORDER BY c.relname,con.conname;
SELECT status,count(*) AS posts FROM public.social_posts GROUP BY status ORDER BY status;
SELECT count(*) AS results_without_post FROM public.social_post_results r
LEFT JOIN public.social_posts p ON p.id=r.post_id WHERE r.post_id IS NOT NULL AND p.id IS NULL;
SELECT count(*) AS posts_without_campaign FROM public.social_posts p
LEFT JOIN public.social_campaigns c ON c.id=p.campaign_id WHERE p.campaign_id IS NOT NULL AND c.id IS NULL;
SELECT tablename,policyname,roles,cmd,qual,with_check FROM pg_policies
WHERE (schemaname='public' AND tablename IN('social_posts','social_post_results','social_campaigns','social_accounts','gbp_connections'))
   OR (schemaname='storage' AND tablename='objects')
ORDER BY schemaname,tablename,policyname;
COMMIT;
