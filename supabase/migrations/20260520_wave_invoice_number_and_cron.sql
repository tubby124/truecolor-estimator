-- 2026-05-20 — Payment-flow architecture follow-ups
--
-- 1. Add wave_invoice_number column on orders so the staff portal can show
--    "Wave #991" alongside our TC-2026-0083 order number without an extra
--    Wave API call per row. Populated by manual-order/route.ts on creation.
--
-- 2. Wire pg_cron to call /api/cron/daily-payment-digest daily at 13:00 UTC
--    (= 7 AM MDT / 6 AM MST). Replaces the need for a Railway scheduled-run.
--    Cron pulls CRON_SECRET from Supabase Vault — must be set ONCE by Hasan:
--      Dashboard → Project Settings → Vault → "Add new secret"
--      Name: tc_cron_secret  ·  Value: <same CRON_SECRET as Railway env>

-- ── Part 1: wave_invoice_number column ────────────────────────────────────

alter table public.orders
  add column if not exists wave_invoice_number text;

create index if not exists orders_wave_invoice_number_idx
  on public.orders (wave_invoice_number)
  where wave_invoice_number is not null;

comment on column public.orders.wave_invoice_number is
  'Wave invoice friendly number (e.g. "991") — surfaced in staff UI. Distinct from wave_invoice_id (base64 internal ID).';

-- ── Part 2: pg_cron daily payment digest ──────────────────────────────────

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Unschedule any prior version with the same name (re-runnable migration safety)
do $$
declare
  jid bigint;
begin
  select jobid into jid from cron.job where jobname = 'truecolor-daily-payment-digest';
  if jid is not null then
    perform cron.unschedule(jid);
  end if;
end$$;

-- Schedule the digest. Vault secret 'tc_cron_secret' must be set separately
-- (see comment at top of file). Cron will 401 silently until it's set —
-- not destructive.
select cron.schedule(
  'truecolor-daily-payment-digest',
  '0 13 * * *',
  $cron$
  select net.http_get(
    url := 'https://truecolorprinting.ca/api/cron/daily-payment-digest',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || coalesce(
        (select decrypted_secret from vault.decrypted_secrets where name = 'tc_cron_secret' limit 1),
        ''
      )
    ),
    timeout_milliseconds := 30000
  );
  $cron$
);
