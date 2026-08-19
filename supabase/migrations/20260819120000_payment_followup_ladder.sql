-- Payment follow-up ladder: count touches, allow staff to pause chasing
ALTER TABLE orders ADD COLUMN IF NOT EXISTS followup_count INT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS followup_paused_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS followup_paused_reason TEXT;

-- Fast scan of the unpaid queue (cron runs hourly)
CREATE INDEX IF NOT EXISTS orders_pending_payment_created_idx
  ON orders (created_at)
  WHERE status = 'pending_payment' AND is_archived = false;
