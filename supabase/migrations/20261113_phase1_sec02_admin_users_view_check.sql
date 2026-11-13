-- ============================================================================
-- LoadSaathi Phase 1 · SEC-02 — get_users_admin_view() internal admin check
-- Date: 2026-11-13
--
-- Fixes: any `anon` or `authenticated` caller could execute the SECURITY
-- DEFINER function get_users_admin_view() and dump every user row. The
-- function now enforces an admin check internally, and PUBLIC/anon execution
-- is revoked.
--
-- Safety: additive/authorization-only. No data touched. Admin UI already
-- calls admin_users_view() (which wraps this function) and keeps working.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_users_admin_view()
RETURNS SETOF public.users
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admins only' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT * FROM public.users ORDER BY created_at;
END;
$$;

-- Remove any broad grants that exist on either admin view. Explicit per-role
-- revokes are needed: a plain `REVOKE ALL … FROM PUBLIC` does NOT remove
-- grants that were made directly to anon/service_role.
REVOKE ALL ON FUNCTION public.get_users_admin_view() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_users_admin_view() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_users_admin_view() FROM service_role;
REVOKE ALL ON FUNCTION public.admin_users_view() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_users_view() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_users_view() FROM service_role;

-- Only authenticated (and thus admin-checked) callers may execute.
GRANT EXECUTE ON FUNCTION public.get_users_admin_view() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_users_view() TO authenticated;
