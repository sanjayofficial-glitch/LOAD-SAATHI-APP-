-- Migration: Fix driver_locations RLS privacy leak
-- Date: 2026-09-02
-- Purpose: Restrict SELECT on driver_locations to the driver themselves or admins.
--          The previous policy exposed every trucker's GPS to every authenticated user.

DROP POLICY IF EXISTS "Anyone can read driver_locations" ON public.driver_locations;

CREATE POLICY "Users can see own location or admin"
  ON public.driver_locations
  FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'sub' = driver_id OR public.is_admin());
