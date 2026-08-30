-- Migration: add shop_address and shop_logo columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS shop_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shop_logo TEXT;
