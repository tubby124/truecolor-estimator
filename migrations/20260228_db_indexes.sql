-- Migration: Add performance indexes for orders queries
-- Run this once in the Supabase SQL editor:
--   Dashboard → SQL Editor → paste → Run
--
-- Queries these indexes help:
--   SELECT * FROM orders ORDER BY created_at DESC          (staff portal list)
--   SELECT * FROM orders WHERE customer_id = $1            (account orders)
--   SELECT * FROM orders WHERE order_number = $1           (lookup by order#)
--   SELECT * FROM orders WHERE is_archived = false         (active orders filter)
--   SELECT * FROM order_items WHERE order_id = $1          (order detail)

-- 1. Staff portal: sort all orders newest-first
CREATE INDEX IF NOT EXISTS orders_created_at_desc
  ON orders (created_at DESC);

-- 2. Customer account: fetch orders by customer
CREATE INDEX IF NOT EXISTS orders_customer_id
  ON orders (customer_id);

-- 3. Order number lookup + uniqueness guarantee (also prevents duplicate order numbers)
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_unique
  ON orders (order_number);

-- 4. Active-orders filter (staff portal hides archived)
CREATE INDEX IF NOT EXISTS orders_is_archived
  ON orders (is_archived)
  WHERE is_archived = false;

-- 5. Order items: fetch all items for an order
CREATE INDEX IF NOT EXISTS order_items_order_id
  ON order_items (order_id);
