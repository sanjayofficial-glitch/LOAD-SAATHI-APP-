-- Migration: Create driver_locations table for live GPS tracking
CREATE TABLE IF NOT EXISTS public.driver_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  driver_id text NOT NULL,
  trip_id uuid,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  heading numeric,
  speed numeric,
  accuracy numeric,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT driver_locations_pkey PRIMARY KEY (id),
  CONSTRAINT driver_locations_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.users(id),
  CONSTRAINT driver_locations_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id)
);

CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON public.driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_updated_at ON public.driver_locations(updated_at DESC);

ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read driver_locations" ON public.driver_locations;

CREATE POLICY "Users can see own location or admin"
  ON public.driver_locations
  FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'sub' = driver_id OR public.is_admin());

CREATE POLICY "Driver can insert own location"
  ON public.driver_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (driver_id = auth.uid()::text);

CREATE POLICY "Driver can update own location"
  ON public.driver_locations
  FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid()::text)
  WITH CHECK (driver_id = auth.uid()::text);
