-- Monthly walk bundles, credit tracking, account freezes, and dog sitting bookings.
--
-- Bundle tiers (hardcoded in app + edge functions, not DB-configurable yet):
--   bundle_5:  5 x 45-min walk credits/mo  — $240/mo ($48/credit)
--   bundle_10: 10 x 45-min walk credits/mo — $450/mo ($45/credit)
--   bundle_20: 20 x 45-min walk credits/mo — $800/mo ($40/credit)
--
-- Credit rollover: unused credits from a grant expire 14 days after that grant.
-- Freezing a subscription (up to 30 days) forfeits all current unexpired credit lots.
-- Dog sitting can be paid in cash, credits (converted via the client's tier rate), or a mix.

CREATE TABLE client_bundle_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('bundle_5', 'bundle_10', 'bundle_20')),
  status TEXT NOT NULL DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'active', 'past_due', 'paused', 'canceled')),
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  paused_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE client_bundle_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_bundle_subscription" ON client_bundle_subscriptions
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Every credit grant is its own "lot" so its individual 14-day rollover expiry can be tracked.
CREATE TABLE credit_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  remaining INTEGER NOT NULL CHECK (remaining >= 0),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('subscription_grant', 'admin_adjustment')),
  stripe_invoice_id TEXT UNIQUE,
  voided_at TIMESTAMPTZ,
  voided_reason TEXT
);

ALTER TABLE credit_lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_credit_lots" ON credit_lots
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE TABLE account_freezes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE account_freezes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_freezes" ON account_freezes
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE TABLE dog_sitting_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  visit_type TEXT NOT NULL CHECK (visit_type IN ('day', 'overnight')),
  scheduled_date DATE NOT NULL,
  price_cents INTEGER NOT NULL,
  credits_used INTEGER NOT NULL DEFAULT 0,
  cash_charged_cents INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  stripe_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  client_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dog_sitting_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_dog_sitting" ON dog_sitting_bookings
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "insert_own_dog_sitting" ON dog_sitting_bookings
  FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "update_own_dog_sitting" ON dog_sitting_bookings
  FOR UPDATE TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());
