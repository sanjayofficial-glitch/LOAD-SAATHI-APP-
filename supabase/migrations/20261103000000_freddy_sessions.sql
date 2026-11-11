-- Migration: 20261103000000_freddy_sessions
-- Purpose: Server-side conversation memory for the Freddy chat
--          (edge function agent-router). One row per (Clerk user, client
--          session UUID) holding the recent message list as JSONB.
-- Background: Chat context previously lived only in the client's
--          localStorage (sent as `history` on every request), so
--          conversations did not survive clearing storage or switching
--          devices, and the backend `sessionId` was a no-op in production.
-- Safety:
--   - New table; no existing reads/writes are touched.
--   - RLS enabled immediately; ownership keyed on auth.uid()::text, the
--     same Clerk-identity pattern as favorites (20260714_favorites.sql).
--   - anon gets no privileges at all; authenticated gets SELECT/INSERT/
--     UPDATE only, and RLS is the gate.
--   - Payload is bounded in the edge function (MAX_STORED_MESSAGES) before
--     it reaches the database.
-- Date: 2026-11-03.

-- Enable the uuid-ossp extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.freddy_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  session_id uuid NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, session_id)
);

COMMENT ON TABLE public.freddy_sessions IS
  'Freddy chat conversation memory (agent-router). Owner-only RLS via Clerk user id.';

COMMENT ON COLUMN public.freddy_sessions.user_id IS
  'Clerk user ID (matched against auth.uid()::text in RLS)';

COMMENT ON COLUMN public.freddy_sessions.session_id IS
  'Client-side session UUID; paired with user_id for ownership';

COMMENT ON COLUMN public.freddy_sessions.messages IS
  'JSON array of {role: "user"|"assistant", content: string} messages';

CREATE INDEX IF NOT EXISTS idx_freddy_sessions_user
  ON public.freddy_sessions (user_id, updated_at DESC);

ALTER TABLE public.freddy_sessions ENABLE ROW LEVEL SECURITY;

-- anon: no access at all (defense-in-depth; RLS is the primary gate).
REVOKE ALL ON public.freddy_sessions FROM anon;
-- authenticated: SELECT/INSERT/UPDATE only — no DELETE via REST.
REVOKE ALL ON public.freddy_sessions FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.freddy_sessions TO authenticated;

DROP POLICY IF EXISTS "Users manage own freddy sessions" ON public.freddy_sessions;
CREATE POLICY "Users manage own freddy sessions" ON public.freddy_sessions
  FOR ALL USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_freddy_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_freddy_sessions_updated_at ON public.freddy_sessions;
CREATE TRIGGER trigger_freddy_sessions_updated_at
  BEFORE UPDATE ON public.freddy_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_freddy_sessions_updated_at();

