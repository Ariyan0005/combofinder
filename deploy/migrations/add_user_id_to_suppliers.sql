-- Add user_id column to suppliers table for per-user data isolation
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS suppliers_user_id_idx ON suppliers(user_id);
