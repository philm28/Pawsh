-- Add payment tracking to walks
ALTER TABLE walks ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'paid';
ALTER TABLE walks ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- Constraint: only valid payment statuses
ALTER TABLE walks DROP CONSTRAINT IF EXISTS walks_payment_status_check;
ALTER TABLE walks ADD CONSTRAINT walks_payment_status_check
  CHECK (payment_status IN ('pending', 'paid'));
