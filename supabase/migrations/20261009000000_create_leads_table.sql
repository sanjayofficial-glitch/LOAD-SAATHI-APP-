-- Migration: 20261009000000_create_leads_table
-- Purpose: Capture phone-number leads from the WhatsApp floating button and
--          the public contact form so they show up in the admin command
--          center. Anonymous visitors can INSERT but never read; only
--          admins (public.is_admin()) can SELECT.
-- Background: The floating WhatsApp button opened wa.me directly, so
--          interested leads left no trace in the app. The lead-leak fix
--          (Phase C) inserts a row best-effort before navigating away.
-- Safety:
--   - New table, no existing reads/writes are touched.
--   - RLS enabled immediately; anon gets INSERT only (guarded REVOKE of
--     every other privilege, matching 20260918_revoke_anon_dml_all_tables).
--   - SELECT restricted to authenticated admins via public.is_admin().
--   - phone is optional at capture time (the app logs the click before any
--     number is entered) and validated as a 10-digit Indian mobile whenever
--     a real number is provided.
--   - Worst case (table unreadable / insert failing) is a silent no-op in
--     the app: the WhatsApp navigation still proceeds.
-- Date: 2026-10-09.
-- Applied: not yet applied (pending deploy).

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL DEFAULT '' CHECK (phone = '' OR phone ~ '^[6-9][0-9]{9}$'),
  name text,
  source text NOT NULL DEFAULT 'whatsapp_fab'
    CHECK (char_length(source) BETWEEN 1 AND 64),
  page_path text CHECK (page_path IS NULL OR char_length(page_path) <= 512),
  user_id text,
  message text CHECK (message IS NULL OR char_length(message) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.leads IS
  'Phone leads captured from the WhatsApp FAB and public contact form. Anonymous INSERT-only; admin SELECT.';

CREATE INDEX leads_created_at_idx ON public.leads (created_at DESC);
CREATE INDEX leads_source_idx ON public.leads (source);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Anon: revoke default ALL privileges; keep INSERT only (defense-in-depth,
-- RLS is the primary gate).
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='leads' AND privilege_type='SELECT') THEN REVOKE SELECT ON public.leads FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='leads' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.leads FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='leads' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.leads FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='leads' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.leads FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='leads' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.leads FROM anon; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public' AND table_name='leads' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.leads FROM anon; END IF; END $$;

-- Authenticated: revoke the rest of the default ALL grant, but KEEP SELECT.
-- Admins read leads through the RLS policy (public.is_admin()); non-admin
-- authenticated users hold the privilege yet see zero rows under RLS.
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='authenticated' AND table_schema='public' AND table_name='leads' AND privilege_type='UPDATE') THEN REVOKE UPDATE ON public.leads FROM authenticated; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='authenticated' AND table_schema='public' AND table_name='leads' AND privilege_type='DELETE') THEN REVOKE DELETE ON public.leads FROM authenticated; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='authenticated' AND table_schema='public' AND table_name='leads' AND privilege_type='TRUNCATE') THEN REVOKE TRUNCATE ON public.leads FROM authenticated; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='authenticated' AND table_schema='public' AND table_name='leads' AND privilege_type='REFERENCES') THEN REVOKE REFERENCES ON public.leads FROM authenticated; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE grantee='authenticated' AND table_schema='public' AND table_name='leads' AND privilege_type='TRIGGER') THEN REVOKE TRIGGER ON public.leads FROM authenticated; END IF; END $$;

GRANT INSERT ON public.leads TO anon;
GRANT INSERT, SELECT ON public.leads TO authenticated;

-- RLS policies
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
CREATE POLICY "Anyone can submit a lead" ON public.leads
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read leads" ON public.leads;
CREATE POLICY "Admins can read leads" ON public.leads
  FOR SELECT TO authenticated USING (public.is_admin());