-- Extend leads table for the free-tier quote-email / follow-up automation.
-- Purely additive: existing columns, RLS policies, and admin Command Center
-- reads keep working unchanged. Follow-up sending runs from Vercel functions
-- with the service role key (bypasses RLS), so no policy changes are needed.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS quote_json jsonb,
  ADD COLUMN IF NOT EXISTS quoted_at timestamptz,
  ADD COLUMN IF NOT EXISTS followup_stage smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_followup_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;

-- Follow-up scheduler scans due leads; partial index keeps it tiny.
CREATE INDEX IF NOT EXISTS leads_next_followup_idx
  ON public.leads (next_followup_at)
  WHERE next_followup_at IS NOT NULL;

-- Lookup / dedup by email for follow-up sends.
CREATE INDEX IF NOT EXISTS leads_email_idx
  ON public.leads (email)
  WHERE email IS NOT NULL;
