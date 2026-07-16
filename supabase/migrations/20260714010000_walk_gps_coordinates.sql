-- GPS Tier 1: capture the walker's coordinates once at check-in and once at
-- check-out (not continuous tracking — see the code comments in WalkerToday.tsx
-- for why continuous background tracking isn't reliable in a web app).

ALTER TABLE walks
  ADD COLUMN check_in_lat DOUBLE PRECISION,
  ADD COLUMN check_in_lng DOUBLE PRECISION,
  ADD COLUMN check_out_lat DOUBLE PRECISION,
  ADD COLUMN check_out_lng DOUBLE PRECISION;
