-- Add business_type column to users table
-- Default all existing users to 'mobile_repair' (backward-compatible)
-- Email registration does not require a phone number. Existing phone values
-- are preserved while the old NOT NULL constraint is relaxed.
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'mobile_repair';

-- Update existing users explicitly (redundant with DEFAULT but explicit)
UPDATE users SET business_type = 'mobile_repair' WHERE business_type IS NULL OR business_type = '';
