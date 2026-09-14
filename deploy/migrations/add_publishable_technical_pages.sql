-- Publishable compatibility, ISP, and pinout metadata.
-- This migration is additive and safe to run against existing data.

ALTER TABLE compatibilities
  ADD COLUMN IF NOT EXISTS part_type TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS compatibilities_model_id_idx
  ON compatibilities (model_id);
CREATE INDEX IF NOT EXISTS compatibilities_published_idx
  ON compatibilities (is_published);
CREATE INDEX IF NOT EXISTS compatibilities_part_type_idx
  ON compatibilities (part_type);

ALTER TABLE schematics
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS model_id INTEGER REFERENCES models(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS component TEXT,
  ADD COLUMN IF NOT EXISTS pin_number TEXT,
  ADD COLUMN IF NOT EXISTS pin_name TEXT,
  ADD COLUMN IF NOT EXISTS voltage TEXT,
  ADD COLUMN IF NOT EXISTS ground TEXT,
  ADD COLUMN IF NOT EXISTS signal_info TEXT,
  ADD COLUMN IF NOT EXISTS test_point_info TEXT,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS schematics_slug_idx
  ON schematics (slug);
CREATE INDEX IF NOT EXISTS schematics_model_id_idx
  ON schematics (model_id);
CREATE INDEX IF NOT EXISTS schematics_published_idx
  ON schematics (is_published);
CREATE INDEX IF NOT EXISTS schematics_type_idx
  ON schematics (schematic_type);