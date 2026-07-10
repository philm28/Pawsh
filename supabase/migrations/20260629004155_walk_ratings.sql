
-- Walk ratings table
CREATE TABLE walk_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_id UUID NOT NULL REFERENCES walks(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  walker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(walk_id)
);

ALTER TABLE walk_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_ratings" ON walk_ratings FOR SELECT
  TO authenticated USING (
    client_id = auth.uid() OR
    walker_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "insert_own_ratings" ON walk_ratings FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = client_id AND
    EXISTS (
      SELECT 1 FROM walks
      WHERE id = walk_id
        AND client_id = auth.uid()
        AND status = 'completed'
    )
  );

CREATE POLICY "update_own_ratings" ON walk_ratings FOR UPDATE
  TO authenticated USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);

CREATE POLICY "delete_own_ratings" ON walk_ratings FOR DELETE
  TO authenticated USING (auth.uid() = client_id);
