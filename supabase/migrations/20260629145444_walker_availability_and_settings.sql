-- Walker availability: days of week + time ranges
CREATE TABLE walker_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL DEFAULT '08:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  UNIQUE(walker_id, day_of_week)
);

ALTER TABLE walker_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_walker_availability" ON walker_availability
  FOR SELECT TO authenticated
  USING (
    walker_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "insert_own_availability" ON walker_availability
  FOR INSERT TO authenticated
  WITH CHECK (walker_id = auth.uid());

CREATE POLICY "update_own_availability" ON walker_availability
  FOR UPDATE TO authenticated
  USING (walker_id = auth.uid())
  WITH CHECK (walker_id = auth.uid());

CREATE POLICY "delete_own_availability" ON walker_availability
  FOR DELETE TO authenticated
  USING (walker_id = auth.uid());

-- App settings: admin-configurable key/value pairs
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_app_settings" ON app_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_update_settings" ON app_settings
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_insert_settings" ON app_settings
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Default pricing
INSERT INTO app_settings (key, value) VALUES
  ('price_30min', '25.00'),
  ('price_60min', '45.00')
ON CONFLICT (key) DO NOTHING;

-- Enable realtime for walks table
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE walks;
EXCEPTION WHEN others THEN
  NULL;
END $$;
