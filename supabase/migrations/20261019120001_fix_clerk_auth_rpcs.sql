-- Fix Clerk-auth compatibility in SECURITY DEFINER RPCs.
--
-- auth.uid() casts the JWT `sub` claim to uuid and THROWS (22P02) on
-- Clerk-format user IDs ("user_3KW..."), which is what this app's JWTs carry
-- (proven empirically). Every function below replaces auth.uid()::text with
-- public.current_clerk_user_id() (which is exactly `auth.jwt() ->> 'sub'`),
-- so behavior is identical for uuid subs and WORKS for Clerk subs.
--
-- Also fixes misordered create_notification() call sites in the trip
-- lifecycle RPCs: the trip UUID was landing in the p_type argument and
-- related_trip_id was never set. Calls now match the function signature
-- (p_user_id, p_message, p_type, p_title, p_action_url, p_related_trip_id).
--
-- prevent_illegal_user_type_changes() needs NO change: its
-- COALESCE(auth.jwt()->>'sub', auth.uid()::text) short-circuits before
-- auth.uid() when a Clerk JWT is present.

CREATE OR REPLACE FUNCTION public.complete_trip(p_trip_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    trip_record RECORD;
    has_accepted boolean;
BEGIN
    SELECT * INTO trip_record FROM public.trips WHERE id = p_trip_id;

    IF trip_record IS NULL THEN
        RETURN jsonb_build_object('error', 'Trip not found');
    END IF;

    IF trip_record.trucker_id != public.current_clerk_user_id() THEN
        RETURN jsonb_build_object('error', 'Not your trip');
    END IF;

    IF trip_record.status NOT IN ('delivered', 'in_transit') THEN
        RETURN jsonb_build_object('error', 'Trip must be delivered or in transit before completion. Current status: ' || trip_record.status);
    END IF;

    has_accepted := EXISTS(
        SELECT 1 FROM public.requests
        WHERE trip_id = p_trip_id AND status = 'accepted'
    );

    UPDATE public.trips
    SET status = 'completed', updated_at = now()
    WHERE id = p_trip_id;

    IF has_accepted THEN
        UPDATE public.shipments
        SET status = 'completed'
        WHERE id IN (
            SELECT shipment_id FROM public.requests
            WHERE trip_id = p_trip_id AND status = 'accepted' AND shipment_id IS NOT NULL
        );
    END IF;

    PERFORM public.create_notification(
        public.current_clerk_user_id(),
        'Trip marked as completed!',
        'info',
        NULL,
        NULL,
        p_trip_id
    );

    RETURN jsonb_build_object('success', true, 'message', 'Trip marked as completed!');
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_trip_delivered(p_trip_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    trip_record RECORD;
BEGIN
    SELECT * INTO trip_record FROM public.trips WHERE id = p_trip_id;

    IF trip_record IS NULL THEN
        RETURN jsonb_build_object('error', 'Trip not found');
    END IF;

    IF trip_record.trucker_id != public.current_clerk_user_id() THEN
        RETURN jsonb_build_object('error', 'Not your trip');
    END IF;

    IF trip_record.status != 'in_transit' THEN
        RETURN jsonb_build_object('error', 'Trip must be in transit to mark delivered. Current status: ' || trip_record.status);
    END IF;

    UPDATE public.trips
    SET status = 'delivered', updated_at = now()
    WHERE id = p_trip_id;

    PERFORM public.create_notification(
        public.current_clerk_user_id(),
        'Trip marked as delivered!',
        'info',
        NULL,
        NULL,
        p_trip_id
    );

    RETURN jsonb_build_object('success', true, 'message', 'Trip marked as delivered!');
END;
$function$;

CREATE OR REPLACE FUNCTION public.start_trip(p_trip_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    trip_record RECORD;
BEGIN
    SELECT * INTO trip_record FROM public.trips WHERE id = p_trip_id;

    IF trip_record IS NULL THEN
        RETURN jsonb_build_object('error', 'Trip not found');
    END IF;

    IF trip_record.trucker_id != public.current_clerk_user_id() THEN
        RETURN jsonb_build_object('error', 'Not your trip');
    END IF;

    IF trip_record.status != 'active' THEN
        RETURN jsonb_build_object('error', 'Trip must be active to start. Current status: ' || trip_record.status);
    END IF;

    UPDATE public.trips
    SET status = 'in_transit', updated_at = now()
    WHERE id = p_trip_id;

    PERFORM public.create_notification(
        public.current_clerk_user_id(),
        'Trip started!',
        'info',
        NULL,
        NULL,
        p_trip_id
    );

    RETURN jsonb_build_object('success', true, 'message', 'Trip started!');
END;
$function$;

CREATE OR REPLACE FUNCTION public.insert_price_history(p_origin_city text, p_dest_city text, p_origin_state text, p_dest_state text, p_weight_tonnes numeric, p_price_per_tonne numeric, p_vehicle_type text, p_user_id text, p_user_type text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_caller text := public.current_clerk_user_id();
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

CREATE OR REPLACE FUNCTION public.insert_shipment_request(p_shipment_id uuid, p_trucker_id text, p_shipper_id text, p_price numeric, p_message text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_caller text := public.current_clerk_user_id();
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

CREATE OR REPLACE FUNCTION public.create_notification(p_user_id text, p_message text, p_type text DEFAULT 'info'::text, p_title text DEFAULT NULL::text, p_action_url text DEFAULT NULL::text, p_related_trip_id uuid DEFAULT NULL::uuid, p_related_shipment_request_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller text := public.current_clerk_user_id();
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

CREATE OR REPLACE FUNCTION public.update_shipment_coords(p_shipment_id uuid, p_origin_lat numeric, p_origin_lng numeric, p_dest_lat numeric, p_dest_lng numeric, p_distance_km numeric, p_duration_min integer)
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
  IF v_owner IS DISTINCT FROM public.current_clerk_user_id()
     AND NOT EXISTS (
       SELECT 1 FROM public.users u
       WHERE u.id = public.current_clerk_user_id() AND u.user_type = 'admin'
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

CREATE OR REPLACE FUNCTION public.update_trip_coords(p_trip_id uuid, p_origin_lat numeric, p_origin_lng numeric, p_dest_lat numeric, p_dest_lng numeric, p_distance_km numeric, p_duration_min integer)
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
  IF v_owner IS DISTINCT FROM public.current_clerk_user_id()
     AND NOT EXISTS (
       SELECT 1 FROM public.users u
       WHERE u.id = public.current_clerk_user_id() AND u.user_type = 'admin'
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
