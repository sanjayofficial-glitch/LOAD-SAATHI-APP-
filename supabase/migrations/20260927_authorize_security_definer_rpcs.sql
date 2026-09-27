-- Migration: 20260927_authorize_security_definer_rpcs
-- Purpose: 12 SECURITY DEFINER functions in `public` had no authorization
--          check in their body. Being SECURITY DEFINER they bypass RLS, so any
--          signed-in user could read or write another user's data through them.
-- Applied: live project, 2026-09-27.
--
-- The hole, by function
-- ---------------------
--   calculate_credit_score(p_user_id)   read + UPSERT any user's credit_scores
--                                        row (score AND factor breakdown)
--   calculate_driver_risk(p_driver_id)  UPSERT any user's credit_scores row
--                                        with a hardcoded score = 600
--   get_route_history(p_user_id)        read any user's last 20 route/price rows
--   get_corridor_average(...)           aggregate-only market rate lookup
--   mark_notification_read(p_id)        mark any notification read
--   insert_price_history(..., p_user_id, ...)  fabricate rate history under any
--                                        user's name
--   insert_shipment_request(shipment, trucker, shipper, price, msg)
--                                        create offers impersonating a trucker
--                                        or shipper
--   update_trip_coords(p_trip_id, ...)  rewrite any trip's coordinates
--   update_shipment_coords(p_id, ...)   rewrite any shipment's coordinates
--   create_notification(p_user_id, ...) write into any user's notification bell
--   rls_auto_enable()                   returns event_trigger; not reachable
--                                        through /rest/v1/rpc at all (linter
--                                        false positive)
--
-- Trigger-chain hazard (why this is ordered the way it is)
-- ------------------------------------------------------
-- calculate_credit_score and calculate_driver_risk CANNOT simply be revoked:
--
--   reviews/trips/shipments -> trg_refresh_credit_score  -> refresh_credit_score()
--       -> PERFORM public.calculate_credit_score(<affected user>)
--   reviews/trips           -> trg_refresh_driver_risk   -> refresh_driver_risk()
--       -> PERFORM public.calculate_driver_risk(<affected user>)
--
-- refresh_credit_score and refresh_driver_risk were SECURITY INVOKER, so they
-- ran as the firing role and needed `authenticated` to hold EXECUTE on the
-- inner RPCs. Revoking first would have broken credit-score refresh on every
-- trip, shipment and review write. Step 1 promotes them to SECURITY DEFINER so
-- the chain runs as the owner, and only then are the inner RPCs revoked.
--
-- Both refresh_* functions contain only variable assignment and a PERFORM —
-- no RLS-sensitive SQL — so promoting them changes nothing about which rows
-- the aggregates cover. calculate_credit_score is already SECURITY DEFINER and
-- already writes globally, so the effective behaviour is identical.
--
-- update_shipper_rating / update_trucker_rating are left untouched: they are
-- themselves the trigger targets (EXECUTE FUNCTION update_shipper_rating()), so
-- their EXECUTE grant is required for the reviews trigger to fire at all.
--
-- App-side prerequisites (commit d5b0c58 + the follow-up in this change)
-- ---------------------------------------------------------------------
-- create_notification now requires the caller to be the recipient, an admin, or
-- a participant in p_related_trip_id / p_related_shipment_request_id. Three
-- notification flows previously passed no related id and would have been
-- rejected, so notifications.ts now forwards the request/trip id that each
-- caller already had in scope. Every flow was checked against call-site
-- ordering; notably TripDetail.tsx inserts the `requests` row before calling
-- notifyTruckerOfBookingRequest, so the shipper is already a trip participant
-- when the notification fires.

-- ============================================================
-- Step 1 — trigger helpers must not run as the caller
-- ============================================================
ALTER FUNCTION public.refresh_credit_score() SECURITY DEFINER;
ALTER FUNCTION public.refresh_driver_risk() SECURITY DEFINER;

-- ============================================================
-- Step 2 — internal-only RPCs: no EXECUTE for anon or authenticated
-- ============================================================
-- service_role keeps access, and postgres (the owner) is unaffected, so the
-- trigger chain in Step 1 continues to work.
REVOKE EXECUTE ON FUNCTION public.calculate_credit_score(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_driver_risk(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_route_history(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_corridor_average(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_notification_read(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- These two are still the reviews/trips trigger targets, so the authenticated
-- grant must stay. Only the PUBLIC grant is dropped.
REVOKE EXECUTE ON FUNCTION public.refresh_credit_score() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_driver_risk() FROM PUBLIC;

-- ============================================================
-- Step 3 — bind the write path to the caller
-- ============================================================

-- price_history rows are attributed to a user; the caller may only file their
-- own. Both app call sites already pass their own id, so this is a no-op for
-- the app and closes the impersonation path.
CREATE OR REPLACE FUNCTION public.insert_price_history(
  p_origin_city text,
  p_dest_city text,
  p_origin_state text,
  p_dest_state text,
  p_weight_tonnes numeric,
  p_price_per_tonne numeric,
  p_vehicle_type text,
  p_user_id text,
  p_user_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_caller text := auth.uid()::text;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_user_id IS DISTINCT FROM v_caller THEN
    RAISE EXCEPTION 'Not authorized: price history can only be filed for the calling user';
  END IF;

  INSERT INTO public.price_history
    (origin_city, destination_city, origin_state, dest_state,
     weight_tonnes, price_per_tonne, vehicle_type, user_id, user_type)
  VALUES
    (p_origin_city, p_dest_city, p_origin_state, p_dest_state,
     p_weight_tonnes, p_price_per_tonne, p_vehicle_type, v_caller, p_user_type)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id);
END;
$function$;

-- A trucker may only raise an offer against a real shipment, only as themselves,
-- and the shipper_id must be the shipment's actual owner.
CREATE OR REPLACE FUNCTION public.insert_shipment_request(
  p_shipment_id uuid,
  p_trucker_id text,
  p_shipper_id text,
  p_price numeric,
  p_message text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_caller text := auth.uid()::text;
  v_owner text;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_trucker_id IS DISTINCT FROM v_caller THEN
    RAISE EXCEPTION 'Not authorized: offers may only be raised by the calling trucker';
  END IF;

  SELECT shipper_id INTO v_owner FROM public.shipments WHERE id = p_shipment_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Shipment % not found', p_shipment_id;
  END IF;

  IF p_shipper_id IS DISTINCT FROM v_owner THEN
    RAISE EXCEPTION 'Not authorized: p_shipper_id does not match the shipment owner';
  END IF;

  INSERT INTO public.shipment_requests
    (shipment_id, trucker_id, shipper_id, proposed_price_per_tonne, message, status)
  VALUES
    (p_shipment_id, v_caller, v_owner, p_price, p_message, 'pending')
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id, 'status', 'pending');
END;
$function$;

-- Coordinate back-fill is only valid for a record the caller owns. Admin keeps
-- access so support can repair rows. Returns an error object rather than
-- raising, matching the existing style of the other trip RPCs.
CREATE OR REPLACE FUNCTION public.update_trip_coords(
  p_trip_id uuid,
  p_origin_lat numeric,
  p_origin_lng numeric,
  p_dest_lat numeric,
  p_dest_lng numeric,
  p_distance_km numeric,
  p_duration_min integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner text;
BEGIN
  SELECT trucker_id INTO v_owner FROM public.trips WHERE id = p_trip_id;

  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('error', 'Trip not found');
  END IF;

  IF v_owner IS DISTINCT FROM auth.uid()::text
     AND NOT EXISTS (
       SELECT 1 FROM public.users u
       WHERE u.id = auth.uid()::text AND u.user_type = 'admin'
     )
  THEN
    RETURN jsonb_build_object('error', 'Not your trip');
  END IF;

  UPDATE public.trips
  SET origin_lat = p_origin_lat,
      origin_lng = p_origin_lng,
      destination_lat = p_dest_lat,
      destination_lng = p_dest_lng,
      estimated_distance_km = p_distance_km,
      estimated_duration_min = p_duration_min,
      updated_at = now()
  WHERE id = p_trip_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_shipment_coords(
  p_shipment_id uuid,
  p_origin_lat numeric,
  p_origin_lng numeric,
  p_dest_lat numeric,
  p_dest_lng numeric,
  p_distance_km numeric,
  p_duration_min integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner text;
BEGIN
  SELECT shipper_id INTO v_owner FROM public.shipments WHERE id = p_shipment_id;

  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('error', 'Shipment not found');
  END IF;

  IF v_owner IS DISTINCT FROM auth.uid()::text
     AND NOT EXISTS (
       SELECT 1 FROM public.users u
       WHERE u.id = auth.uid()::text AND u.user_type = 'admin'
     )
  THEN
    RETURN jsonb_build_object('error', 'Not your shipment');
  END IF;

  UPDATE public.shipments
  SET origin_lat = p_origin_lat,
      origin_lng = p_origin_lng,
      destination_lat = p_dest_lat,
      destination_lng = p_dest_lng,
      estimated_distance_km = p_distance_km,
      estimated_duration_min = p_duration_min,
      updated_at = now()
  WHERE id = p_shipment_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- Cross-user notification is legitimate (a trucker notifying a shipper), so the
-- guard is participation rather than identity: the caller must be the
-- recipient, an admin, or a party to the related trip or shipment request.
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id text,
  p_message text,
  p_type text DEFAULT 'info'::text,
  p_title text DEFAULT NULL::text,
  p_action_url text DEFAULT NULL::text,
  p_related_trip_id uuid DEFAULT NULL::uuid,
  p_related_shipment_request_id uuid DEFAULT NULL::uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller text := auth.uid()::text;
  v_allowed boolean := false;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_user_id = v_caller THEN
    v_allowed := true;
  END IF;

  IF NOT v_allowed AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = v_caller AND u.user_type = 'admin'
  ) THEN
    v_allowed := true;
  END IF;

  IF NOT v_allowed AND p_related_trip_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.trips t
      WHERE t.id = p_related_trip_id
        AND (
          t.trucker_id = v_caller
          OR EXISTS (
            SELECT 1 FROM public.requests r
            WHERE r.trip_id = t.id
              AND (r.shipper_id = v_caller OR r.receiver_id = v_caller)
          )
        )
    ) INTO v_allowed;
  END IF;

  IF NOT v_allowed AND p_related_shipment_request_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.shipment_requests sr
      WHERE sr.id = p_related_shipment_request_id
        AND (sr.trucker_id = v_caller OR sr.shipper_id = v_caller)
    ) INTO v_allowed;
  END IF;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to notify user %', p_user_id;
  END IF;

  INSERT INTO public.notifications (
    user_id, message, type, title, action_url,
    related_trip_id, related_shipment_request_id
  ) VALUES (
    p_user_id, p_message, p_type, p_title, p_action_url,
    p_related_trip_id, p_related_shipment_request_id
  );
END;
$function$;

-- ============================================================
-- Step 4 — ml_match_log is internal; only the match-ml function writes it
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read ml_match_log" ON public.ml_match_log;
