-- ============================================================================
-- LoadSaathi Phase 1 · SEC-02 rollback — restore the original unguarded
-- SQL function and the original grants (including anon execution).
--
-- EMERGENCY USE ONLY. Re-applies the vulnerable state; keeps the app
-- working if the hardened function ever breaks an admin flow.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_users_admin_view()
RETURNS SETOF public.users
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.users ORDER BY created_at;
$$;

REVOKE ALL ON FUNCTION public.get_users_admin_view() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_users_admin_view() TO anon;
GRANT EXECUTE ON FUNCTION public.get_users_admin_view() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_admin_view() TO service_role;

GRANT EXECUTE ON FUNCTION public.admin_users_view() TO anon;
GRANT EXECUTE ON FUNCTION public.admin_users_view() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_users_view() TO service_role;
