-- ROLLBACK TEMPLATE (EDIT FROM 02_capture_state.sql OUTPUT BEFORE APPLYING)
-- Replace every <PREVIOUS_VALUE> with what you captured on the dev/production state.

-- Brake-trip-switch: keep only DDL via apply_migration, not via Studio.

BEGIN;

-- === driver_locations SELECT ===
-- DROP POLICY IF EXISTS "Driver, participant or admin can read driver location" ON public.driver_locations;
-- CREATE POLICY "Anyone can read driver locations"
--   ON public.driver_locations FOR SELECT TO authenticated USING (true);

-- === load_locations SELECT ===. 
-- DROP POLICY IF EXISTS "Scoped read load_locations" ON public.load_locations;
-- CREATE POLICY "Anyone can read load_locations"
--   ON public.load_locations FOR SELECT TO authenticated USING (true);

-- === CHECK constraints added by the pass ===
-- ALTER TABLE public.driver_locations DROP CONSTRAINT IF EXISTS check_lat_bounds;
-- ALTER TABLE public.driver_locations DROP CONSTRAINT IF EXISTS check_lng_bounds;

COMMIT;

-- After rollback, validate:
-- SELECT policyname, qual FROM pg_policies WHERE tablename='driver_locations' AND cmd='SELECT';
-- qual MUST return present like BOTH directions before rollback, or (true) for permissive scheme.
-- If ANY auth request still returns 0 rows unexpectedly, DO NOT stack new work — investigate RLS existence.
