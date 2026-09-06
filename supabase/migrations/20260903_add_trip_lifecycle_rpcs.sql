-- Migration: Add trip lifecycle RPCs (start_trip, mark_trip_delivered, complete_trip)
-- Date: 2026-09-03
-- Purpose: FULL_REPAIR.sql:933-935 GRANTS these functions to authenticated,
--          but their definitions were never committed to the workspace and
--          were not in the deployed schema as of the 2026-09-02 RLS audit.
--          Without these, TruckerTripDetail.tsx's "Start Trip" / "Mark
--          Delivered" / "Complete Trip" buttons fail silently.
--
--          Contract (from TruckerTripDetail.tsx:131, 184, 240):
--            1. Caller must be the trip's trucker (auth.jwt()->>'sub' = trucker_id).
--            2. RPC returns either a JSON string OR an object that may carry
--               an `error` field. After JSON.parse, code checks result.error.
--            3. On success, trips.status transitions:
--               active -> in_transit  (start_trip)
--               in_transit -> delivered  (mark_trip_delivered)
--               delivered -> completed  (complete_trip)
--            4. Linked shipments (via requests with status='accepted') are
--               moved in lock-step to keep ShipmentDetail views consistent.

CREATE OR REPLACE FUNCTION public.start_trip(p_trip_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id text;
  v_trip public.trips%ROWTYPE;
  v_updated_shipments integer := 0;
BEGIN
  v_caller_id := auth.jwt()->>'sub';
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_trip FROM public.trips WHERE id = p_trip_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trip not found');
  END IF;

  IF v_trip.trucker_id <> v_caller_id AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized for this trip');
  END IF;

  IF v_trip.status <> 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trip is not in active state');
  END IF;

  UPDATE public.trips
    SET status = 'in_transit', updated_at = now()
    WHERE id = p_trip_id;

  UPDATE public.shipments
    SET status = 'in_transit'
    WHERE id IN (
      SELECT shipment_id FROM public.requests
      WHERE trip_id = p_trip_id
        AND status = 'accepted'
        AND shipment_id IS NOT NULL
    );

  GET DIAGNOSTICS v_updated_shipments = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'trip_id', p_trip_id,
    'status', 'in_transit',
    'updated_shipments', v_updated_shipments
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_trip_delivered(p_trip_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id text;
  v_trip public.trips%ROWTYPE;
  v_updated_shipments integer := 0;
BEGIN
  v_caller_id := auth.jwt()->>'sub';
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_trip FROM public.trips WHERE id = p_trip_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trip not found');
  END IF;

  IF v_trip.trucker_id <> v_caller_id AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized for this trip');
  END IF;

  IF v_trip.status <> 'in_transit' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trip must be in_transit before marking delivered');
  END IF;

  UPDATE public.trips
    SET status = 'delivered', updated_at = now()
    WHERE id = p_trip_id;

  UPDATE public.shipments
    SET status = 'delivered'
    WHERE id IN (
      SELECT shipment_id FROM public.requests
      WHERE trip_id = p_trip_id
        AND status = 'accepted'
        AND shipment_id IS NOT NULL
    );

  GET DIAGNOSTICS v_updated_shipments = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'trip_id', p_trip_id,
    'status', 'delivered',
    'updated_shipments', v_updated_shipments
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_trip(p_trip_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id text;
  v_trip public.trips%ROWTYPE;
  v_updated_shipments integer := 0;
BEGIN
  v_caller_id := auth.jwt()->>'sub';
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_trip FROM public.trips WHERE id = p_trip_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trip not found');
  END IF;

  IF v_trip.trucker_id <> v_caller_id AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized for this trip');
  END IF;

  IF v_trip.status <> 'delivered' AND v_trip.status <> 'in_transit' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trip must be delivered or in_transit to complete');
  END IF;

  UPDATE public.trips
    SET status = 'completed', updated_at = now()
    WHERE id = p_trip_id;

  UPDATE public.shipments
    SET status = 'completed'
    WHERE id IN (
      SELECT shipment_id FROM public.requests
      WHERE trip_id = p_trip_id
        AND status = 'accepted'
        AND shipment_id IS NOT NULL
    );

  GET DIAGNOSTICS v_updated_shipments = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'trip_id', p_trip_id,
    'status', 'completed',
    'updated_shipments', v_updated_shipments
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_trip(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_trip_delivered(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_trip(uuid) TO authenticated;