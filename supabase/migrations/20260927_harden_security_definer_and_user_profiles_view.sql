-- Migration: 20260927_harden_security_definer_and_user_profiles_view
-- Purpose: Clear the only Supabase *ERROR*-level advisor and close the
--          "anyone with the anon key can call privileged RPCs" hole.
--
-- Background:
--   1. `user_profiles` was created SECURITY DEFINER, so the view enforced the
--      privileges of its owner instead of the caller's. The advisor reports
--      this as `security_definer_view` (level: ERROR) — the only ERROR in the
--      project.
--   2. 29 SECURITY DEFINER functions in `public` were executable by `anon`,
--      i.e. reachable at /rest/v1/rpc/<fn> with nothing but the public anon
--      key. That includes write paths: insert_trip, insert_shipment,
--      delete_trip, delete_shipment, complete_trip, start_trip,
--      upsert_team_member, delete_team_member, upsert_gallery_image,
--      delete_gallery_image, reorder_*, rls_auto_enable.
--
-- Why revoking from `anon` is safe:
--   Every application call site uses the Clerk-authenticated Supabase client
--   (`useSupabase()` / `getClient()`), which maps to the `authenticated` role.
--   A repo-wide search for `.rpc(` found no anonymous caller, and no anon-only
--   RLS policy invokes any of these functions. `authenticated` and
--   `service_role` keep EXECUTE, so signed-in behaviour is unchanged.
--
-- Deliberately NOT changed:
--   - anon SELECT on trips / shipments / users (4 public columns). Those grants
--     are required by the public /share/* pages and /api/og, added in
--     migration 20260927091955_restore_anon_share_page_reads. The
--     `pg_graphql_anon_table_exposed` WARNs that follow from it are expected
--     and stay red by design.
--   - The 37 auth_rls_initplan and 15 multiple_permissive_policies
--     performance lints. Pre-existing and unrelated to this fix.
--
-- Safety: both statements are idempotent. The revoke is applied dynamically
--         so functions added later are covered on the next run.
-- Date: 2026-09-27

-- ============================================================
-- 1. user_profiles must respect the caller's RLS, not the owner's
-- ============================================================
-- With security_invoker, reads go through the caller's privileges and the RLS
-- policies on `public.users`. `authenticated` retains full read (policy
-- "Authenticated users can read all users"). `anon` is revoked below because it
-- holds a column-level grant on only 4 of the 8 columns this view selects, and
-- no application code reads the view.
ALTER VIEW public.user_profiles SET (security_invoker = true);

REVOKE ALL ON public.user_profiles FROM anon;

-- ============================================================
-- 2. No SECURITY DEFINER function is callable by anon
-- ============================================================
-- The revoke target must be PUBLIC, not anon.
--
-- Every one of these functions carried the ACL
--   {=X/postgres, postgres=X/postgres, authenticated=X/postgres, service_role=X/postgres}
-- where the leading `=X` is an EXECUTE grant to the PUBLIC pseudo-role, which
-- every role (including anon) inherits. Revoking from `anon` alone appears to
-- succeed but changes nothing, because the privilege still arrives via PUBLIC —
-- verified with has_function_privilege('anon', ...) still returning true for all
-- 29 functions after a REVOKE ... FROM anon.
--
-- `authenticated` and `service_role` hold their own explicit EXECUTE entries, so
-- revoking PUBLIC leaves signed-in and service-role behaviour untouched. They
-- are re-granted below purely so the statement order cannot matter.
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', fn.signature);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', fn.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.signature);
    RAISE NOTICE 'restricted % to authenticated + service_role', fn.signature;
  END LOOP;
END $$;
