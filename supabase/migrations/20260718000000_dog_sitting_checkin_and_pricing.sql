/*
  # Add 30-minute check-in sitting tier, update overnight pricing

  1. Changes
    - Widen `dog_sitting_bookings.visit_type` check constraint to allow 'checkin'
      alongside the existing 'day' and 'overnight' values.
    - No price columns live in the schema itself (price_cents is set per-row at
      booking time by the book-dog-sitting edge function), so existing historical
      rows are unaffected. New bookings will use the updated rates:
        - checkin: $35 (new)
        - day: $100 (unchanged)
        - overnight: $125 (was $150)
*/

ALTER TABLE dog_sitting_bookings DROP CONSTRAINT IF EXISTS dog_sitting_bookings_visit_type_check;

ALTER TABLE dog_sitting_bookings
  ADD CONSTRAINT dog_sitting_bookings_visit_type_check
  CHECK (visit_type IN ('checkin', 'day', 'overnight'));
