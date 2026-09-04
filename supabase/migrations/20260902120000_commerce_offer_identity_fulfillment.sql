-- Forward-only, nullable provenance. Existing rows remain intentionally
-- unclassified unless a future evidence-backed process can prove identity.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $$
BEGIN
  IF to_regclass('public.order_items') IS NULL THEN
    RAISE EXCEPTION 'commerce identity migration preflight failed: order_items is missing';
  END IF;
END $$;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS commerce_product_id text,
  ADD COLUMN IF NOT EXISTS commerce_variant_key text,
  ADD COLUMN IF NOT EXISTS merchant_offer_id text,
  ADD COLUMN IF NOT EXISTS offer_version text,
  ADD COLUMN IF NOT EXISTS configuration_fingerprint text,
  ADD COLUMN IF NOT EXISTS pricing_version text,
  ADD COLUMN IF NOT EXISTS pricing_rule_id text,
  ADD COLUMN IF NOT EXISTS fulfillment_selection text,
  ADD COLUMN IF NOT EXISTS production_sla_anchor text,
  ADD COLUMN IF NOT EXISTS policy_version text,
  ADD COLUMN IF NOT EXISTS image_asset_id text,
  ADD COLUMN IF NOT EXISTS classification_reason text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_fulfillment_selection_check' AND conrelid = 'public.order_items'::regclass) THEN
    ALTER TABLE public.order_items ADD CONSTRAINT order_items_fulfillment_selection_check
      CHECK (fulfillment_selection IS NULL OR fulfillment_selection IN ('pickup', 'shipping_quote', 'unclassified')) NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS order_items_commerce_product_id_idx
  ON public.order_items (commerce_product_id) WHERE commerce_product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS order_items_merchant_offer_id_idx
  ON public.order_items (merchant_offer_id) WHERE merchant_offer_id IS NOT NULL;

COMMENT ON COLUMN public.order_items.classification_reason IS
  'Required explanation for legacy or manual rows that do not have deterministic commerce identity; never backfill by product name.';
