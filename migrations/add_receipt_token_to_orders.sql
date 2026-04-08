-- Add receipt_token to orders for guest receipt access (no login required)
-- Token is a UUID that acts as a signed, unforgeable link to download a receipt PDF
-- Used by: /api/receipt/[oid]/pdf?token=[receipt_token]  (order-confirmed + shareable links)

ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_token UUID;
UPDATE orders SET receipt_token = gen_random_uuid() WHERE receipt_token IS NULL;
ALTER TABLE orders ALTER COLUMN receipt_token SET DEFAULT gen_random_uuid();
ALTER TABLE orders ALTER COLUMN receipt_token SET NOT NULL;
