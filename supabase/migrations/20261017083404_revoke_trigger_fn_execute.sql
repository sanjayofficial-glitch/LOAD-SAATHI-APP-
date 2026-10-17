-- Migration: revoke_trigger_fn_execute
-- Date applied: 2026-10-17 (version 20261017083404)
--
-- Lock down direct EXECUTE on public trigger functions.
-- Trigger functions are only ever invoked by their triggers; the default
-- PUBLIC grant let anon/authenticated call them via /rest/v1/rpc/, which
-- trips the security advisor and widens the RPC surface. Trigger firing
-- does not check EXECUTE, so revoking changes no runtime behaviour.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT format('public.%I(%s)', p.proname, pg_get_function_identity_arguments(p.oid)) AS sig
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.prorettype = 'trigger'::regtype
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated, PUBLIC', r.sig);
  END LOOP;
END $$;
