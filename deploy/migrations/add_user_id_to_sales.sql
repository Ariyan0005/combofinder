-- Migration: Add user_id column to sales table
-- Run this on your VPS against the Supabase database:
--   psql "$SUPABASE_DATABASE_URL" -f deploy/migrations/add_user_id_to_sales.sql

ALTER TABLE sales ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Optional: backfill existing rows by looking up the inventory owner
-- (only needed if you have sales from a single known user and want to keep them)
-- UPDATE sales s
-- SET user_id = (
--   SELECT i.user_id FROM sale_items si
--   JOIN inventory i ON i.id = si.inventory_id
--   WHERE si.sale_id = s.id
--   LIMIT 1
-- )
-- WHERE s.user_id IS NULL;
