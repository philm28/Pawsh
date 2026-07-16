-- Extend access_requests with the full walker application questionnaire.
-- These columns are only populated for requested_role = 'walker'; client
-- self-signups leave them null. Walker submissions now land as 'pending'
-- (no account created yet) instead of 'auto_approved' — approving them via
-- the existing approve-access-request function is what actually creates
-- the login and emails credentials.

ALTER TABLE access_requests
  ADD COLUMN date_of_birth DATE,
  ADD COLUMN has_transportation BOOLEAN,
  ADD COLUMN neighborhood TEXT,
  ADD COLUMN social_handle TEXT,
  ADD COLUMN consent_featured TEXT CHECK (consent_featured IN ('yes', 'no', 'prefer_not')),
  ADD COLUMN days_available TEXT[],
  ADD COLUMN time_blocks TEXT[],
  ADD COLUMN hours_per_week TEXT,
  ADD COLUMN earliest_start_date TEXT,
  ADD COLUMN dog_experience TEXT CHECK (dog_experience IN ('professional', 'personal', 'both', 'none')),
  ADD COLUMN owns_dog BOOLEAN,
  ADD COLUMN large_breed_comfort TEXT CHECK (large_breed_comfort IN ('yes', 'no', 'somewhat')),
  ADD COLUMN reactive_dog_comfort TEXT CHECK (reactive_dog_comfort IN ('yes', 'no', 'somewhat')),
  ADD COLUMN background_check_consent BOOLEAN,
  ADD COLUMN contractor_agreement_consent BOOLEAN,
  ADD COLUMN has_smartphone BOOLEAN,
  ADD COLUMN why_interested TEXT;
