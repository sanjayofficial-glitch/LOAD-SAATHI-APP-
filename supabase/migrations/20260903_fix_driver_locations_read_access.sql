-- Migration: Restore driver_locations read access for shippers + truckers
-- Date: 2026-09-03
-- Purpose: The 20260902 migration restricted SELECT to "driver sees own OR admin",
--          which broke shipper-side live tracking (ShipmentDetail / TripDetail)
--          and the trucker dashboard multi-truck map. Realtime applies RLS, so
--          non-owners also stopped receiving postgres_changes events.
--
--          We split SELECT into two OR'd policies:
--          1. Driver + admin can see the row (preserves privacy for parked trucks).
--          2. Anyone authenticated can see rows linked to a trip that is currently
--             in_transit — this is the minimum needed for shippers to track the
--             trucker they matched with once the trip has started.
--
--          INSERT/UPDATE policies from apply-all-missing.sql (WITH CHECK (true))
--          are left untouched.

DROP POLICY IF EXISTS "Users can see own location or admin" ON public.driver_locations;

CREATE POLICY "Driver or admin can see own location"
  ON public.driver_locations
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt()->>'sub' = driver_id
    OR public.is_admin()
  );

CREATE POLICY "Anyone can see in-transit trip locations"
  ON public.driver_locations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = driver_locations.trip_id
        AND trips.status = 'in_transit'
    )
  );