-- Migration: Ensure compatibilities table has correct schema
-- Run on VPS: psql $DATABASE_URL -f deploy/migrations/fix_compatibilities_schema.sql

-- 1. Create categories table if it doesn't exist (needed for brands FK)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Create compatibilities table if it doesn't exist
CREATE TABLE IF NOT EXISTS compatibilities (
  id SERIAL PRIMARY KEY,
  model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  combo_type TEXT NOT NULL,
  quality_grade TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. If category_id column exists in compatibilities but is NOT NULL, make it nullable
--    (previous agent may have added it as required)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'compatibilities' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE compatibilities ALTER COLUMN category_id DROP NOT NULL;
    RAISE NOTICE 'Made category_id nullable in compatibilities';
  ELSE
    RAISE NOTICE 'No category_id column in compatibilities — nothing to fix';
  END IF;
END $$;

-- 4. Ensure category_id in brands table is nullable (should already be)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE brands ALTER COLUMN category_id DROP NOT NULL;
    RAISE NOTICE 'Ensured brands.category_id is nullable';
  END IF;
END $$;
