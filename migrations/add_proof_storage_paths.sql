-- Migration: Support multiple proof files per order
-- Run this once in the Supabase SQL Editor for project dczbgraekmzirxknjvwe:
--   Dashboard → SQL Editor → paste → Run
--
-- Adds an unbounded array of proof storage paths per order.
-- The legacy proof_storage_path column is kept for backwards compatibility
-- and will always contain the most recently uploaded proof path.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_storage_paths text[] DEFAULT NULL;
