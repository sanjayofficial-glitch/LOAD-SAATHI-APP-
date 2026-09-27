-- Migration: 20260927_restore_anon_share_page_reads
-- Purpose: Restore anonymous (anon role) read access needed by the public
--          share pages and their Open Graph image generator (api/og.tsx).
--
-- Background:
--   20260918_* migrations revoked anon privileges to silence Supabase advisors.
--   Side effect: /share/trip/:id and /share/shipment/:id (and /api/og fetches)
--   started failing with 42501 permission denied, because anon also lost the
--   table grants for public rows.
--
-- What this restores (least privilege):
--   1. SELECT on public.trips     — restricted by RLS policy to status='active'
--   2. SELECT on public.shipments — restricted by RLS policy to status='pending'
--   3. SELECT on four public profile columns of public.users only
--      (id, full_name, rating, is_verified) — used by share-page embeds
--   4. RLS policy on public.users so anon sees only those columns
--
-- Explicitly NOT granted (still revoked on purpose):
--   - anon SELECT on gallery_images (20260918_revoke_anon_privileges)
--   - anon EXECUTE on functions (20260918_revoke_anon_privileges)
--   - anon DML on any table (20260918_revoke_anon_dml_all_tables)
--   - anon SELECT on user_profiles (no app code reads it)
--   - email/phone and all other users columns remain unreadable by anon
--
-- Safety: GRANT is idempotent; the policy creation is guarded. Row visibility
--         is still enforced by RLS policies, so no extra rows are exposed.
-- Date: 2026-09-27
-- Applied: yes (live project) — this file mirrors the live state.

-- ============================================================
-- 1. Table-level grants: public share pages + og image generator
-- ============================================================
GRANT SELECT ON public.trips TO anon;
GRANT SELECT ON public.shipments TO anon;

-- ============================================================
-- 2. Column-level grant: only public profile fields on users
-- ============================================================
GRANT SELECT (id, full_name, rating, is_verified) ON public.users TO anon;

-- ============================================================
-- 3. RLS policy: anon can read users rows (column grant limits fields)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Anonymous can read public profile fields'
  ) THEN
    CREATE POLICY "Anonymous can read public profile fields" ON public.users
      FOR SELECT TO anon USING (true);
  END IF;
END $$;
