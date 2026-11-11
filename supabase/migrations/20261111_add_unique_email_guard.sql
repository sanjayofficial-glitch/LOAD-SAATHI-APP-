-- Prevent duplicate user rows for the same email address.
-- Cleanup (2026-11-11) removed 12 duplicate/test rows; this guard stops
-- ChooseRole / OnboardingFlow from ever creating a second row per email.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key
  ON public.users (lower(email));
