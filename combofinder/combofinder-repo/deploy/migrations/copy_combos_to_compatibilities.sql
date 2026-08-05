-- Emergency data copy: combos → compatibilities
-- Run this directly on VPS if migration didn't copy data automatically:
--   psql $DATABASE_URL -f deploy/migrations/copy_combos_to_compatibilities.sql

DO $$
DECLARE
  combos_exists BOOLEAN;
  rows_copied   INTEGER;
BEGIN
  -- Check if combos table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'combos'
  ) INTO combos_exists;

  IF NOT combos_exists THEN
    RAISE NOTICE 'combos table does not exist — nothing to copy.';
    RETURN;
  END IF;

  -- Copy only the guaranteed columns; optional cols will be NULL
  INSERT INTO compatibilities (model_id, name, combo_type, created_at)
  SELECT
    model_id,
    name,
    COALESCE(combo_type, 'Compatible'),
    COALESCE(created_at, NOW())
  FROM combos
  WHERE model_id IS NOT NULL
    AND name IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM compatibilities c
      WHERE c.model_id = combos.model_id AND c.name = combos.name
    );

  GET DIAGNOSTICS rows_copied = ROW_COUNT;
  RAISE NOTICE 'Done! Copied % rows from combos to compatibilities.', rows_copied;
END $$;
