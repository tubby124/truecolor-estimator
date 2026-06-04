-- Manual rollback for migration 20260603193000_order_payments_ledger.sql
--
-- NOT applied automatically — this directory is outside supabase/migrations/ so
-- Supabase CLI never picks it up. Run by hand (psql or Supabase SQL editor) only
-- after:
--   1. Disabling NEXT_PUBLIC_FEATURE_PAYMENT_LEDGER in every environment
--   2. Confirming no /api/staff/orders/[id]/payments routes are being called
--   3. Backing up any real ledger rows you want to preserve
--
-- cascade drop wipes payment history — make sure you've exported it first.

drop index if exists public.order_payments_payer_email_idx;
drop index if exists public.order_payments_wave_invoice_payment_id_unique;
drop index if exists public.order_payments_external_reference_unique;
drop index if exists public.order_payments_status_idx;
drop index if exists public.order_payments_order_id_recorded_at_idx;

drop table if exists public.order_payments cascade;
