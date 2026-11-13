-- ============================================================================
-- LoadSaathi Phase 1 · SEC-01 rollback — restore the blanket read-all policy
-- and the table-level SELECT grant on `users` for `authenticated`.
--
-- EMERGENCY USE ONLY. Re-applies the vulnerable state.
-- ============================================================================

GRANT SELECT ON public.users TO authenticated;

DROP POLICY IF EXISTS "users select own or admin" ON public.users;
DROP POLICY IF EXISTS "users select marketplace profile" ON public.users;

DROP POLICY IF EXISTS "Authenticated users can read all users" ON public.users;
CREATE POLICY "Authenticated users can read all users" ON public.users
  FOR SELECT TO authenticated USING (true);
