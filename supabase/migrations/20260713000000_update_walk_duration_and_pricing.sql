-- Change walk duration tiers from 30/60 min to 30/45 min, and update default pricing
-- ($35 for a 30-min walk, $50 for a 45-min walk)

-- Drop the existing duration_minutes check constraint (auto-named, look it up dynamically)
DO $$
DECLARE
  cname TEXT;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'walks'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%duration_minutes%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE walks DROP CONSTRAINT %I', cname);
  END IF;
END $$;

-- Move any existing 60-min walks to 45-min (should be none/test-data only, but keep data consistent)
UPDATE walks SET duration_minutes = 45 WHERE duration_minutes = 60;

-- Add the new constraint allowing 30 or 45 minutes
ALTER TABLE walks ADD CONSTRAINT walks_duration_minutes_check CHECK (duration_minutes IN (30, 45));

-- Rename the price_60min setting to price_45min and update both defaults
UPDATE app_settings SET key = 'price_45min', value = '50.00', updated_at = NOW() WHERE key = 'price_60min';
UPDATE app_settings SET value = '35.00', updated_at = NOW() WHERE key = 'price_30min';

-- In case a fresh DB never had these rows seeded, make sure they exist
INSERT INTO app_settings (key, value) VALUES
  ('price_30min', '35.00'),
  ('price_45min', '50.00')
ON CONFLICT (key) DO NOTHING;
