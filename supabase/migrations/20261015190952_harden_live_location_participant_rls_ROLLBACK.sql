-- ROLLBACK: restore permissive policies (pre-2026-10-16 baseline)
-- Source: live snapshot taken 2026-10-16 (see docs/tracking/_sql/02_capture_state.sql and README).
-- Only adjust names/values to your captured dump. No data loss.
BEGIN;

DROP POLICY IF EXISTS "Driver, participant or admin can read driver location" ON public.driver_locations;
CREATE POLICY "Anyone can read driver locations"
  ON public.driver_locations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Scoped load_locations read" ON public.load_locations;
CREATE POLICY "Anyone can read load_locations"
  ON public.load_locations FOR SELECT TO authenticated USING (true);

ALTER TABLE public.driver_locations DROP CONSTRAINT IF EXISTS check_lat_bounds;
ALTER TABLE public.driver_locations DROP CONSTRAINT IF EXISTS check_lng_bounds;

COMMIT;

-- Verify:
-- SELECT tablename, policyname, qual FROM pg_policies WHERE tablename IN ('driver_locations','load_locations') AND cmd='SELECT';
