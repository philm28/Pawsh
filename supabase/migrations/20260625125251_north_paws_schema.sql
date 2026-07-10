
-- profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'walker', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Allow all authenticated users to read other profiles (for walker assignment, etc.)
CREATE POLICY "select_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

-- dogs table
CREATE TABLE dogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breed TEXT,
  age INTEGER,
  weight NUMERIC,
  photo_url TEXT,
  feeding_notes TEXT,
  vet_name TEXT,
  vet_phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  behavioral_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_dogs" ON dogs FOR SELECT
  TO authenticated USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('walker', 'admin'))
  );

CREATE POLICY "insert_own_dogs" ON dogs FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY "update_own_dogs" ON dogs FOR UPDATE
  TO authenticated USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "delete_own_dogs" ON dogs FOR DELETE
  TO authenticated USING (owner_id = auth.uid());

-- walks table
CREATE TABLE walks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  walker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes IN (30, 60)),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'assigned', 'in_progress', 'completed', 'cancelled')),
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  walker_notes TEXT,
  photo_url TEXT,
  price NUMERIC DEFAULT 25.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE walks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_walks" ON walks FOR SELECT
  TO authenticated USING (
    client_id = auth.uid() OR
    walker_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "insert_walks" ON walks FOR INSERT
  TO authenticated WITH CHECK (
    client_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "update_walks" ON walks FOR UPDATE
  TO authenticated USING (
    client_id = auth.uid() OR
    walker_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    client_id = auth.uid() OR
    walker_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "delete_walks" ON walks FOR DELETE
  TO authenticated USING (
    client_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- access_requests table
CREATE TABLE access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  requested_role TEXT NOT NULL CHECK (requested_role IN ('client', 'walker')),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_access_requests" ON access_requests FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "select_access_requests" ON access_requests FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "update_access_requests" ON access_requests FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Storage bucket for walk photos and dog photos
INSERT INTO storage.buckets (id, name, public) VALUES ('walk-photos', 'walk-photos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('dog-photos', 'dog-photos', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Public read walk photos" ON storage.objects FOR SELECT
  TO public USING (bucket_id = 'walk-photos');

CREATE POLICY "Authenticated upload walk photos" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'walk-photos');

CREATE POLICY "Public read dog photos" ON storage.objects FOR SELECT
  TO public USING (bucket_id = 'dog-photos');

CREATE POLICY "Authenticated upload dog photos" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'dog-photos');

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
