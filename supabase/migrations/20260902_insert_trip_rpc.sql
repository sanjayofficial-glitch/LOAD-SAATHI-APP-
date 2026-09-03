-- Migration: insert_trip SECURITY DEFINER function
-- Fixes 403 on PostTrip by bypassing RLS (auth.jwt() returns NULL with Clerk JWTs)
-- Run this in Supabase Dashboard → SQL Editor

CREATE OR REPLACE FUNCTION public.insert_trip(
  p_trucker_id text,
  p_origin_city text,
  p_origin_state text,
  p_destination_city text,
  p_destination_state text,
  p_departure_date date,
  p_available_capacity_tonnes numeric,
  p_price_per_tonne numeric,
  p_vehicle_type text,
  p_vehicle_number text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_trip jsonb;
  caller_id text;
BEGIN
  caller_id := auth.jwt() ->> 'sub';
  IF caller_id IS NULL OR caller_id != p_trucker_id THEN
    RETURN jsonb_build_object('error', 'Unauthorized: token does not match trucker_id');
  END IF;

  INSERT INTO public.trips (
    trucker_id, origin_city, origin_state, destination_city, destination_state,
    departure_date, available_capacity_tonnes, price_per_tonne,
    vehicle_type, vehicle_number, status
  ) VALUES (
    p_trucker_id, p_origin_city, p_origin_state, p_destination_city, p_destination_state,
    p_departure_date, p_available_capacity_tonnes, p_price_per_tonne,
    p_vehicle_type, p_vehicle_number, 'active'
  )
  RETURNING to_jsonb(trips.*) INTO new_trip;

  RETURN new_trip;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_trip(text, text, text, text, text, date, numeric, numeric, text, text) TO authenticated;
