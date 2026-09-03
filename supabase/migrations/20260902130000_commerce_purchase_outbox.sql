-- Universal, server-authoritative purchase event ledger.
--
-- This is deliberately held by default: recording a paid transition must be
-- durable and reconcilable before any analytics or advertising destination is
-- allowed to consume it. Existing payment-path-specific workers remain
-- untouched; a future approved dispatcher may consume only released rows.

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $$
BEGIN
  IF to_regclass('public.orders') IS NULL THEN
    RAISE EXCEPTION 'commerce purchase outbox preflight failed: orders is missing';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.commerce_purchase_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  business_event_key text NOT NULL,
  transaction_id text NOT NULL,
  paid_at timestamptz NOT NULL,
  order_total numeric(12,2) NOT NULL CHECK (order_total >= 0),
  tax_total numeric(12,2) NOT NULL CHECK (tax_total >= 0),
  status text NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'processing', 'sent', 'retry', 'dead', 'void')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT commerce_purchase_outbox_order_uidx UNIQUE (order_id),
  CONSTRAINT commerce_purchase_outbox_event_uidx UNIQUE (business_event_key)
);

CREATE INDEX IF NOT EXISTS commerce_purchase_outbox_reconciliation_idx
  ON public.commerce_purchase_outbox (status, paid_at, created_at);

ALTER TABLE public.commerce_purchase_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.commerce_purchase_outbox FROM public, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.commerce_purchase_outbox TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_confirmed_commerce_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.paid_at IS NULL
     OR NEW.status NOT IN ('payment_received', 'in_production', 'ready_for_pickup', 'complete') THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.commerce_purchase_outbox (
    order_id,
    business_event_key,
    transaction_id,
    paid_at,
    order_total,
    tax_total
  ) VALUES (
    NEW.id,
    'purchase:' || NEW.id::text,
    NEW.id::text,
    NEW.paid_at,
    ROUND(COALESCE(NEW.total, 0)::numeric, 2),
    ROUND((COALESCE(NEW.gst, 0) + COALESCE(NEW.pst, 0))::numeric, 2)
  )
  ON CONFLICT (order_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_enqueue_confirmed_commerce_purchase ON public.orders;
CREATE TRIGGER orders_enqueue_confirmed_commerce_purchase
AFTER INSERT OR UPDATE OF status, paid_at ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_confirmed_commerce_purchase();

-- Read-only reconciliation surface. Historical rows are intentionally not
-- backfilled: missing rows stay visible instead of being silently represented
-- as newly observed purchases.
CREATE OR REPLACE VIEW public.commerce_purchase_reconciliation AS
SELECT
  o.id AS order_id,
  o.order_number,
  o.paid_at,
  ROUND(COALESCE(o.total, 0)::numeric, 2) AS order_total,
  ROUND((COALESCE(o.gst, 0) + COALESCE(o.pst, 0))::numeric, 2) AS tax_total,
  e.id AS outbox_id,
  e.business_event_key,
  e.status AS outbox_status,
  e.order_total AS outbox_order_total,
  e.tax_total AS outbox_tax_total,
  CASE
    WHEN e.id IS NULL THEN 'missing_outbox'
    WHEN e.paid_at <> o.paid_at THEN 'paid_at_mismatch'
    WHEN e.order_total <> ROUND(COALESCE(o.total, 0)::numeric, 2) THEN 'total_mismatch'
    WHEN e.tax_total <> ROUND((COALESCE(o.gst, 0) + COALESCE(o.pst, 0))::numeric, 2) THEN 'tax_mismatch'
    ELSE 'matched'
  END AS reconciliation_status
FROM public.orders o
LEFT JOIN public.commerce_purchase_outbox e ON e.order_id = o.id
WHERE o.paid_at IS NOT NULL
  AND o.status IN ('payment_received', 'in_production', 'ready_for_pickup', 'complete');

REVOKE ALL ON TABLE public.commerce_purchase_reconciliation FROM public, anon, authenticated;
GRANT SELECT ON TABLE public.commerce_purchase_reconciliation TO service_role;

COMMENT ON TABLE public.commerce_purchase_outbox IS
  'Universal paid-order event ledger. Rows begin held and may not be delivered externally without a separate approved release gate.';
COMMENT ON VIEW public.commerce_purchase_reconciliation IS
  'Read-only paid-order versus universal purchase-outbox reconciliation; legacy omissions remain visible.';
