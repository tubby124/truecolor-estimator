-- Add pending_discount_code to customers table
-- Stores a single staff-assigned discount code that auto-applies at checkout
-- Cleared automatically after the order is placed (via /api/orders)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS pending_discount_code TEXT NULL;

-- Partial index — most rows will be NULL so only index the active ones
CREATE INDEX IF NOT EXISTS idx_customers_pending_discount
  ON customers(pending_discount_code)
  WHERE pending_discount_code IS NOT NULL;
