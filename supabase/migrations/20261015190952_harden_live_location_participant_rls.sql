-- Migration: harden live location + participant-scoped reads
-- Date: 2026-10-16
-- Goal: Replace permissive USING (true) with least-privilege policies without breaking anonymous marketplace reads.
-- Status policy preserved: anon still reads active trips/shipments.

-- NOTE: This migration is intended to be applied FIRST to a Supabase dev branch, verified, then production in low traffic.

BEGIN;

-- 1) Tighten driver_locations SELECT: driver own + admin + matched-shipper-participant only.
DROP POLICY IF EXISTS "Anyone can read driver locations" ON public.driver_locations;
DROP POLICY IF EXISTS "Driver or admin can see own location" ON public.driver_locations;
DROP POLICY IF EXISTS "Anyone can see in-transit trip locations" ON public.driver_locations;

CREATE POLICY "Driver, participant or admin can read driver location"
  ON public.driver_locations
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt()->>'sub' = driver_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.trip_id = driver_locations.trip_id
        AND r.shipper_id = auth.jwt()->>'sub'
        AND r.receiver_id = driver_locations.driver_id
        AND r.status = 'accepted'
    )
    OR (
      driver_locations.is_sharing = TRUE
      AND EXISTS (
        SELECT 1
        FROM public.shipment_requests sr
        JOIN public.shipments s ON s.id = sr.shipment_id
        WHERE sr.trucker_id = driver_locations.driver_id
          AND sr.shipper_id = auth.jwt()->>'sub'
          AND sr.status = 'accepted'
          AND s.status IN ('matched','in_transit')
      )
    )
  );

-- 2) Tighten load_locations SELECT: active + owner + admin.
DROP POLICY IF EXISTS "Anyone can read load_locations" ON public.load_locations;

CREATE POLICY "Scoped load_locations read"
  ON public.load_locations
  FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    OR shipper_id = auth.jwt()->>'sub'
    OR public.is_admin()
  );

-- 3) Coordinate bounds (allow NULL lat/lng for parked trucks? enforce only when set)
-- We enforce when values present to avoid strict/NULL issues.
ALTER TABLE public.driver_locations
  ADD CONSTRAINT check_lat_bounds CHECK (lat IS NULL OR lat BETWEEN -90 AND 90),
  ADD CONSTRAINT check_lng_bounds CHECK (lng IS NULL OR lng BETWEEN -180 AND 180);

COMMIT;

-- Follow-up (no DB changes; code handled separately):
--  a) Read counters must account for trip status in client UI.
--  b) Only track when active trip exists.

-- To verify after apply:
-- SELECT policyname, qual FROM pg_policies WHERE tablename='driver_locations' AND cmd='SELECT';
