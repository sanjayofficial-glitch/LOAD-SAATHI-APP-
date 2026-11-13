-- ============================================================================
-- LoadSaathi Phase 1 · SEC-01 — restrict `users` table reads
-- Date: 2026-11-13
--
-- Fixes: the blanket policy "Authenticated users can read all users"
-- (USING (true)) plus a table-level SELECT grant made every signed-in user's
-- email, phone, KYC document URLs, verification internals and suspension
-- records readable by any other signed-in user.
--
-- Changes:
--   1. Drop the blanket read-all policy and the table-level SELECT grant.
--   2. Rows are readable only by the owner or an admin (full profile), plus a
--      marketplace-profile policy for discovery.
--   3. Re-grant SELECT only on the SAFE columns, so the marketplace-profile
--      policy cannot leak email / phone / KYC internals. Own full profile
--      reads still work via get_own_profile() (RPC); admin full reads via
--      admin_users_view() (RPC).
--
-- Safety: no data changed; no columns dropped; INSERT/UPDATE grants remain
-- (users can still create and edit their own profile). Frontend code must be
-- deployed BEFORE this migration (it no longer selects the revoked columns).
-- ============================================================================

-- 1) Remove the blanket read-all policy.
DROP POLICY IF EXISTS "Authenticated users can read all users" ON public.users;

-- 2a) Full profile: owner or admin only.
DROP POLICY IF EXISTS "users select own or admin" ON public.users;
CREATE POLICY "users select own or admin" ON public.users
  FOR SELECT TO authenticated
  USING ((SELECT current_clerk_user_id()) = id OR (SELECT is_admin()));

-- 2b) Marketplace profile: rows visible to all authenticated users, but only
--      the safe columns granted in (3) are readable.
DROP POLICY IF EXISTS "users select marketplace profile" ON public.users;
CREATE POLICY "users select marketplace profile" ON public.users
  FOR SELECT TO authenticated
  USING (true);

-- 3) Replace the table-level SELECT grant with a safe-column-only grant.
--     (Column-level REVOKE alone is insufficient while a table-level SELECT
--     grant exists — the table grant overrides it.)
REVOKE SELECT ON public.users FROM authenticated;
GRANT SELECT (
  id, user_type, full_name, company_name, rating, total_trips,
  is_verified, verification_status, avatar_url, created_at, updated_at
) ON public.users TO authenticated;

-- Defense in depth: also remove any explicit column-level grants on the
-- sensitive columns.
REVOKE SELECT (email) ON public.users FROM authenticated;
REVOKE SELECT (phone) ON public.users FROM authenticated;
REVOKE SELECT (rc_document_url) ON public.users FROM authenticated;
REVOKE SELECT (insurance_document_url) ON public.users FROM authenticated;
REVOKE SELECT (verification_note) ON public.users FROM authenticated;
REVOKE SELECT (verified_by) ON public.users FROM authenticated;
REVOKE SELECT (verified_at) ON public.users FROM authenticated;
REVOKE SELECT (kyc_submitted_at) ON public.users FROM authenticated;
REVOKE SELECT (suspended) ON public.users FROM authenticated;
REVOKE SELECT (suspended_reason) ON public.users FROM authenticated;
REVOKE SELECT (suspended_at) ON public.users FROM authenticated;
REVOKE SELECT (mentor_id) ON public.users FROM authenticated;
REVOKE SELECT (mentor_requested) ON public.users FROM authenticated;
REVOKE SELECT (sms_opt_in) ON public.users FROM authenticated;
