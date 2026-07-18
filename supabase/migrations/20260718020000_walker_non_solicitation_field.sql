-- Walkers must explicitly acknowledge the non-solicitation / no-side-work
-- clause of their 1099 independent contractor agreement as part of applying.
-- Kept separate from the general contractor_agreement_consent column so the
-- specific acknowledgment is unambiguous in records and admin review.

ALTER TABLE access_requests
  ADD COLUMN non_solicitation_agreed BOOLEAN;
