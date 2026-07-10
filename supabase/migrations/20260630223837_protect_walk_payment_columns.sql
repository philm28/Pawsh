-- Prevent direct client-side writes to payment columns on walks.
-- Only the service role (edge functions) is allowed to modify payment_status
-- and stripe_session_id. auth.role() returns 'service_role' when the service
-- role key is used; 'authenticated' for normal JWT sessions.
CREATE OR REPLACE FUNCTION guard_walk_payment_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.payment_status IS DISTINCT FROM NEW.payment_status OR
      OLD.stripe_session_id IS DISTINCT FROM NEW.stripe_session_id) THEN
    IF auth.role() != 'service_role' THEN
      RAISE EXCEPTION 'payment_status and stripe_session_id may only be modified by the system';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_walk_payment_fields ON walks;

CREATE TRIGGER protect_walk_payment_fields
  BEFORE UPDATE ON walks
  FOR EACH ROW EXECUTE FUNCTION guard_walk_payment_columns();
