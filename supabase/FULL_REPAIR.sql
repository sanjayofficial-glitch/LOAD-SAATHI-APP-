-- ============================================================
-- FULL DATABASE REPAIR — LoadSaathi
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- Safe: only drops/creates policies and functions, never touches data
-- ============================================================

-- ============================================================
-- SECTION 1: DROP ALL EXISTING RLS POLICIES
-- ============================================================
-- This is safe — policies are metadata, not data

-- trips
DROP POLICY IF EXISTS "Truckers can create trips" ON public.trips;
DROP POLICY IF EXISTS "Truckers can delete own trips" ON public.trips;
DROP POLICY IF EXISTS "Truckers can update own trips" ON public.trips;
DROP POLICY IF EXISTS "Truckers can update their own trips" ON public.trips;
DROP POLICY IF EXISTS "Anyone can see active trips" ON public.trips;
DROP POLICY IF EXISTS "Anonymous can view active trips" ON public.trips;

-- shipments
DROP POLICY IF EXISTS "Shippers can create shipments" ON public.shipments;
DROP POLICY IF EXISTS "Shippers can delete own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Shippers can update own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Anyone can see pending shipments" ON public.shipments;
DROP POLICY IF EXISTS "Anonymous can view open shipments" ON public.shipments;

-- shipment_requests
DROP POLICY IF EXISTS "Truckers can create shipment requests" ON public.shipment_requests;
DROP POLICY IF EXISTS "Users can update shipment requests" ON public.shipment_requests;
DROP POLICY IF EXISTS "Users can view shipment requests" ON public.shipment_requests;

-- requests
DROP POLICY IF EXISTS "Users can create requests" ON public.requests;
DROP POLICY IF EXISTS "Users can update own requests" ON public.requests;
DROP POLICY IF EXISTS "Users can view own requests" ON public.requests;

-- messages
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;

-- notifications
DROP POLICY IF EXISTS "Users can create own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

-- reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;

-- favorites
DROP POLICY IF EXISTS "favorites_select" ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert" ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete" ON public.favorites;

-- templates
DROP POLICY IF EXISTS "Users can create templates" ON public.templates;
DROP POLICY IF EXISTS "Users can view templates" ON public.templates;
DROP POLICY IF EXISTS "Users manage own templates" ON public.templates;

-- credit_scores
DROP POLICY IF EXISTS "Users can view own credit scores" ON public.credit_scores;
DROP POLICY IF EXISTS "System can insert credit scores" ON public.credit_scores;

-- driver_locations
DROP POLICY IF EXISTS "Anyone can read driver_locations" ON public.driver_locations;
DROP POLICY IF EXISTS "Driver can insert own location" ON public.driver_locations;
DROP POLICY IF EXISTS "Driver can update own location" ON public.driver_locations;

-- price_history
DROP POLICY IF EXISTS "Anyone can read price history" ON public.price_history;
DROP POLICY IF EXISTS "Users can insert own price history" ON public.price_history;

-- ml_match_log
DROP POLICY IF EXISTS "Anyone can read ml_match_log analytics" ON public.ml_match_log;
DROP POLICY IF EXISTS "Users can insert ml_match_log" ON public.ml_match_log;

-- team_members
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Team members are public" ON public.team_members;

-- gallery_images
DROP POLICY IF EXISTS "Admins can manage gallery images" ON public.gallery_images;
DROP POLICY IF EXISTS "Gallery images are public" ON public.gallery_images;

-- users
DROP POLICY IF EXISTS "Authenticated users can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- load_locations
DROP POLICY IF EXISTS "Anyone can read load_locations" ON public.load_locations;
DROP POLICY IF EXISTS "Shipper can insert own load" ON public.load_locations;
DROP POLICY IF EXISTS "Shipper can update own load" ON public.load_locations;

-- pricing_config, corridor_multipliers, seasonal_multipliers, pricing_flags, fuel_prices
DROP POLICY IF EXISTS "Authenticated can read pricing_config" ON public.pricing_config;
DROP POLICY IF EXISTS "Service role full access pricing_config" ON public.pricing_config;
DROP POLICY IF EXISTS "Authenticated can read corridor_multipliers" ON public.corridor_multipliers;
DROP POLICY IF EXISTS "Service role full access corridor_multipliers" ON public.corridor_multipliers;
DROP POLICY IF EXISTS "Authenticated can read seasonal_multipliers" ON public.seasonal_multipliers;
DROP POLICY IF EXISTS "Service role full access seasonal_multipliers" ON public.seasonal_multipliers;
DROP POLICY IF EXISTS "Authenticated can read pricing_flags" ON public.pricing_flags;
DROP POLICY IF EXISTS "Service role full access pricing_flags" ON public.pricing_flags;
DROP POLICY IF EXISTS "Authenticated users can read fuel prices" ON public.fuel_prices;
DROP POLICY IF EXISTS "Service role can manage fuel prices" ON public.fuel_prices;


-- ============================================================
-- SECTION 2: CREATE NEW RLS POLICIES (Clerk-safe)
-- ============================================================
-- Pattern: auth.jwt() ->> 'sub' = user_id_column
-- Admin bypass: users.user_type = 'admin'

-- ---------- users ----------
CREATE POLICY "Authenticated users can read all users"
  ON public.users FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'sub' = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'sub' = id)
  WITH CHECK (auth.jwt() ->> 'sub' = id);

CREATE POLICY "Admins can update any user"
  ON public.users FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.jwt() ->> 'sub' AND user_type = 'admin')
  )
  WITH CHECK (true);

-- ---------- trips ----------
CREATE POLICY "Anyone can view active trips"
  ON public.trips FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anonymous can view active trips"
  ON public.trips FOR SELECT TO anon USING (status = 'active');

CREATE POLICY "Truckers can create trips"
  ON public.trips FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'sub' = trucker_id);

CREATE POLICY "Truckers can update own trips"
  ON public.trips FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'sub' = trucker_id)
  WITH CHECK (auth.jwt() ->> 'sub' = trucker_id);

CREATE POLICY "Truckers can delete own trips"
  ON public.trips FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'sub' = trucker_id);

-- ---------- shipments ----------
CREATE POLICY "Anyone can view shipments"
  ON public.shipments FOR SELECT TO authenticated
  USING (status = 'pending' OR auth.jwt() ->> 'sub' = shipper_id);

CREATE POLICY "Anonymous can view pending shipments"
  ON public.shipments FOR SELECT TO anon USING (status = 'pending');

CREATE POLICY "Shippers can create shipments"
  ON public.shipments FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'sub' = shipper_id);

CREATE POLICY "Shippers can update own shipments"
  ON public.shipments FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'sub' = shipper_id)
  WITH CHECK (auth.jwt() ->> 'sub' = shipper_id);

CREATE POLICY "Shippers can delete own shipments"
  ON public.shipments FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'sub' = shipper_id);

-- ---------- shipment_requests ----------
CREATE POLICY "Users can view shipment requests"
  ON public.shipment_requests FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'sub' = trucker_id OR auth.jwt() ->> 'sub' = shipper_id);

CREATE POLICY "Truckers can create shipment requests"
  ON public.shipment_requests FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'sub' = trucker_id);

CREATE POLICY "Users can update shipment requests"
  ON public.shipment_requests FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'sub' = trucker_id OR auth.jwt() ->> 'sub' = shipper_id)
  WITH CHECK (true);

-- ---------- requests ----------
CREATE POLICY "Users can view own requests"
  ON public.requests FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'sub' = shipper_id OR auth.jwt() ->> 'sub' = receiver_id);

CREATE POLICY "Users can create requests"
  ON public.requests FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'sub' = shipper_id);

CREATE POLICY "Users can update own requests"
  ON public.requests FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'sub' = shipper_id OR auth.jwt() ->> 'sub' = receiver_id)
  WITH CHECK (true);

-- ---------- messages ----------
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'sub' = sender_id OR auth.jwt() ->> 'sub' = recipient_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'sub' = sender_id);

CREATE POLICY "Recipients can mark messages as read"
  ON public.messages FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'sub' = recipient_id)
  WITH CHECK (auth.jwt() ->> 'sub' = recipient_id);

-- ---------- notifications ----------
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can mark own notifications read"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'sub' = user_id)
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- ---------- reviews ----------
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (
    (reviewer_role = 'shipper' AND auth.jwt() ->> 'sub' = shipper_id)
    OR
    (reviewer_role = 'trucker' AND auth.jwt() ->> 'sub' = trucker_id)
  );

-- ---------- favorites ----------
CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can add favorites"
  ON public.favorites FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own favorites"
  ON public.favorites FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'sub' = user_id);

-- ---------- templates ----------
CREATE POLICY "Users can view own templates"
  ON public.templates FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can create templates"
  ON public.templates FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own templates"
  ON public.templates FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'sub' = user_id)
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own templates"
  ON public.templates FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'sub' = user_id);

-- ---------- credit_scores ----------
CREATE POLICY "Users can view own credit scores"
  ON public.credit_scores FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "System can insert credit scores"
  ON public.credit_scores FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update credit scores"
  ON public.credit_scores FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- ---------- driver_locations ----------
CREATE POLICY "Anyone can read driver locations"
  ON public.driver_locations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Drivers can insert own location"
  ON public.driver_locations FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'sub' = driver_id);

CREATE POLICY "Drivers can update own location"
  ON public.driver_locations FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'sub' = driver_id)
  WITH CHECK (auth.jwt() ->> 'sub' = driver_id);

-- ---------- price_history ----------
CREATE POLICY "Anyone can read price history"
  ON public.price_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert price history"
  ON public.price_history FOR INSERT TO authenticated
  WITH CHECK (true);

-- ---------- ml_match_log ----------
CREATE POLICY "Anyone can read ml_match_log"
  ON public.ml_match_log FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert ml_match_log"
  ON public.ml_match_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- ---------- load_locations ----------
CREATE POLICY "Anyone can read load_locations"
  ON public.load_locations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Shippers can insert own load"
  ON public.load_locations FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'sub' = shipper_id);

CREATE POLICY "Shippers can update own load"
  ON public.load_locations FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'sub' = shipper_id)
  WITH CHECK (auth.jwt() ->> 'sub' = shipper_id);

-- ---------- team_members ----------
CREATE POLICY "Team members are public"
  ON public.team_members FOR SELECT USING (true);

CREATE POLICY "Admins can manage team members"
  ON public.team_members FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.jwt() ->> 'sub' AND user_type = 'admin')
  )
  WITH CHECK (true);

-- ---------- gallery_images ----------
CREATE POLICY "Gallery images are public"
  ON public.gallery_images FOR SELECT USING (true);

CREATE POLICY "Admins can manage gallery images"
  ON public.gallery_images FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.jwt() ->> 'sub' AND user_type = 'admin')
  )
  WITH CHECK (true);

-- ---------- pricing_config ----------
CREATE POLICY "Authenticated can read pricing_config"
  ON public.pricing_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role full access pricing_config"
  ON public.pricing_config FOR ALL USING (true) WITH CHECK (true);

-- ---------- corridor_multipliers ----------
CREATE POLICY "Authenticated can read corridor_multipliers"
  ON public.corridor_multipliers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role full access corridor_multipliers"
  ON public.corridor_multipliers FOR ALL USING (true) WITH CHECK (true);

-- ---------- seasonal_multipliers ----------
CREATE POLICY "Authenticated can read seasonal_multipliers"
  ON public.seasonal_multipliers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role full access seasonal_multipliers"
  ON public.seasonal_multipliers FOR ALL USING (true) WITH CHECK (true);

-- ---------- pricing_flags ----------
CREATE POLICY "Authenticated can read pricing_flags"
  ON public.pricing_flags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role full access pricing_flags"
  ON public.pricing_flags FOR ALL USING (true) WITH CHECK (true);

-- ---------- fuel_prices ----------
CREATE POLICY "Authenticated users can read fuel prices"
  ON public.fuel_prices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can manage fuel prices"
  ON public.fuel_prices FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================
-- SECTION 3: FIX INVOKER FUNCTIONS → SECURITY DEFINER
-- ============================================================

DROP FUNCTION IF EXISTS public.calculate_credit_score(text);
CREATE OR REPLACE FUNCTION public.calculate_credit_score(p_user_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score integer;
  v_factors jsonb;
  v_total_trips integer;
  v_completed integer;
  v_avg_rating numeric;
BEGIN
  SELECT total_trips INTO v_total_trips FROM public.users WHERE id = p_user_id;
  v_total_trips := COALESCE(v_total_trips, 0);

  SELECT count(*) INTO v_completed
  FROM public.trips
  WHERE trucker_id = p_user_id AND status IN ('completed', 'delivered');

  SELECT COALESCE(AVG(rating), 0) INTO v_avg_rating
  FROM public.reviews WHERE trucker_id = p_user_id;

  v_score := 500;
  IF v_total_trips > 0 THEN
    v_score := v_score + ((v_completed::numeric / v_total_trips::numeric) * 150)::integer;
  END IF;
  v_score := v_score + (v_avg_rating * 60)::integer;
  v_score := v_score + LEAST(v_total_trips * 5, 100);
  v_score := GREATEST(300, LEAST(900, v_score));

  v_factors := jsonb_build_object(
    'completion_rate', COALESCE((v_completed::numeric / NULLIF(v_total_trips, 0)::numeric * 100), 0),
    'avg_rating', v_avg_rating,
    'total_trips', v_total_trips,
    'score_breakdown', jsonb_build_object(
      'base', 500,
      'completion_bonus', ((v_completed::numeric / NULLIF(v_total_trips, 0)::numeric) * 150)::integer,
      'rating_bonus', (v_avg_rating * 60)::integer,
      'experience_bonus', LEAST(v_total_trips * 5, 100)
    )
  );

  INSERT INTO public.credit_scores (user_id, score, factors, calculated_at)
  VALUES (p_user_id, v_score, v_factors, now())
  ON CONFLICT (user_id) DO UPDATE
  SET score = v_score, factors = v_factors, calculated_at = now();

  RETURN jsonb_build_object('score', v_score, 'factors', v_factors);
END;
$$;


DROP FUNCTION IF EXISTS public.calculate_driver_risk(text);
CREATE OR REPLACE FUNCTION public.calculate_driver_risk(p_driver_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_risk_score integer;
  v_flags jsonb := '[]'::jsonb;
  v_total integer;
  v_cancelled integer;
  v_late integer;
BEGIN
  SELECT count(*) INTO v_total FROM public.trips WHERE trucker_id = p_driver_id;
  SELECT count(*) INTO v_cancelled FROM public.trips WHERE trucker_id = p_driver_id AND status = 'cancelled';

  v_risk_score := 0;
  IF v_total > 0 AND (v_cancelled::numeric / v_total::numeric) > 0.2 THEN
    v_risk_score := v_risk_score + 30;
    v_flags := v_flags || '"high_cancellation_rate"';
  END IF;

  INSERT INTO public.credit_scores (user_id, score, risk_score, risk_flags, risk_calculated_at)
  VALUES (p_driver_id, 600, v_risk_score, v_flags, now())
  ON CONFLICT (user_id) DO UPDATE
  SET risk_score = v_risk_score, risk_flags = v_flags, risk_calculated_at = now();

  RETURN jsonb_build_object('risk_score', v_risk_score, 'flags', v_flags);
END;
$$;


DROP FUNCTION IF EXISTS public.get_corridor_average(text, text);
CREATE OR REPLACE FUNCTION public.get_corridor_average(p_origin text, p_destination text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg numeric;
  v_count integer;
BEGIN
  SELECT AVG(price_per_tonne), count(*) INTO v_avg, v_count
  FROM public.price_history
  WHERE origin_city ILIKE '%' || p_origin || '%'
    AND destination_city ILIKE '%' || p_destination || '%';

  RETURN jsonb_build_object(
    'average_price', COALESCE(v_avg, 0),
    'sample_size', COALESCE(v_count, 0)
  );
END;
$$;


DROP FUNCTION IF EXISTS public.get_route_history(text, text);
DROP FUNCTION IF EXISTS public.get_route_history(text);
CREATE OR REPLACE FUNCTION public.get_route_history(p_user_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    FROM (
      SELECT origin_city, destination_city, price_per_tonne, created_at
      FROM public.price_history
      WHERE user_id = p_user_id
      ORDER BY created_at DESC
      LIMIT 20
    ) t
  );
END;
$$;


CREATE OR REPLACE FUNCTION public.current_clerk_user_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.jwt() ->> 'sub';
$$;


-- ============================================================
-- SECTION 4: NEW RPC FUNCTIONS (bypass RLS for writes)
-- ============================================================

-- Insert shipment request (trucker offers to carry)
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
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.shipment_requests (shipment_id, trucker_id, shipper_id, proposed_price_per_tonne, message, status)
  VALUES (p_shipment_id, p_trucker_id, p_shipper_id, p_price, p_message, 'pending')
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id, 'status', 'pending');
END;
$$;


-- Delete trip (trucker only)
CREATE OR REPLACE FUNCTION public.delete_trip(p_trip_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trucker_id text;
BEGIN
  SELECT trucker_id INTO v_trucker_id FROM public.trips WHERE id = p_trip_id;
  IF v_trucker_id IS NULL THEN
    RAISE EXCEPTION 'Trip not found';
  END IF;
  IF v_trucker_id != (auth.jwt() ->> 'sub') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.trips WHERE id = p_trip_id;
  RETURN jsonb_build_object('success', true);
END;
$$;


-- Delete shipment (shipper only)
CREATE OR REPLACE FUNCTION public.delete_shipment(p_shipment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shipper_id text;
BEGIN
  SELECT shipper_id INTO v_shipper_id FROM public.shipments WHERE id = p_shipment_id;
  IF v_shipper_id IS NULL THEN
    RAISE EXCEPTION 'Shipment not found';
  END IF;
  IF v_shipper_id != (auth.jwt() ->> 'sub') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.shipments WHERE id = p_shipment_id;
  RETURN jsonb_build_object('success', true);
END;
$$;


-- Update trip coordinates (after geocoding)
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
SET search_path = public
AS $$
BEGIN
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
$$;


-- Update shipment coordinates (after geocoding)
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
SET search_path = public
AS $$
BEGIN
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
$$;


-- Insert price history
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
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.price_history (origin_city, destination_city, origin_state, destination_state, weight_tonnes, price_per_tonne, vehicle_type, user_id, user_type)
  VALUES (p_origin_city, p_dest_city, p_origin_state, p_dest_state, p_weight_tonnes, p_price_per_tonne, p_vehicle_type, p_user_id, p_user_type)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id);
END;
$$;


-- Mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, updated_at = now()
  WHERE id = p_notification_id
    AND user_id = (auth.jwt() ->> 'sub');

  RETURN jsonb_build_object('success', true);
END;
$$;


-- Mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, updated_at = now()
  WHERE user_id = (auth.jwt() ->> 'sub')
    AND is_read = false;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- Upsert team member (admin)
CREATE OR REPLACE FUNCTION public.upsert_team_member(
  p_id uuid DEFAULT NULL,
  p_name text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_photo_url text DEFAULT NULL,
  p_linkedin text DEFAULT NULL,
  p_twitter text DEFAULT NULL,
  p_instagram text DEFAULT NULL,
  p_quote text DEFAULT NULL,
  p_sort_order integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.jwt() ->> 'sub' AND user_type = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_id IS NOT NULL THEN
    UPDATE public.team_members
    SET name = COALESCE(p_name, name),
        role = COALESCE(p_role, role),
        phone = COALESCE(p_phone, phone),
        photo_url = COALESCE(p_photo_url, photo_url),
        linkedin = COALESCE(p_linkedin, linkedin),
        twitter = COALESCE(p_twitter, twitter),
        instagram = COALESCE(p_instagram, instagram),
        quote = COALESCE(p_quote, quote),
        sort_order = p_sort_order
    WHERE id = p_id
    RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.team_members (name, role, phone, photo_url, linkedin, twitter, instagram, quote, sort_order)
    VALUES (p_name, p_role, p_phone, p_photo_url, p_linkedin, p_twitter, p_instagram, p_quote, p_sort_order)
    RETURNING id INTO v_id;
  END IF;

  RETURN jsonb_build_object('id', v_id);
END;
$$;


-- Delete team member (admin)
CREATE OR REPLACE FUNCTION public.delete_team_member(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.jwt() ->> 'sub' AND user_type = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.team_members WHERE id = p_id;
  RETURN jsonb_build_object('success', true);
END;
$$;


-- Reorder team members (admin)
CREATE OR REPLACE FUNCTION public.reorder_team_members(p_ids uuid[], p_orders integer[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.jwt() ->> 'sub' AND user_type = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  FOR i IN 1..array_length(p_ids, 1) LOOP
    UPDATE public.team_members SET sort_order = p_orders[i] WHERE id = p_ids[i];
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- Upsert gallery image (admin)
CREATE OR REPLACE FUNCTION public.upsert_gallery_image(
  p_id uuid DEFAULT NULL,
  p_storage_path text DEFAULT NULL,
  p_title text DEFAULT NULL,
  p_caption text DEFAULT NULL,
  p_category text DEFAULT 'general',
  p_sort_order integer DEFAULT 0,
  p_width integer DEFAULT NULL,
  p_height integer DEFAULT NULL,
  p_file_size integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.jwt() ->> 'sub' AND user_type = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_id IS NOT NULL THEN
    UPDATE public.gallery_images
    SET storage_path = COALESCE(p_storage_path, storage_path),
        title = COALESCE(p_title, title),
        caption = COALESCE(p_caption, caption),
        category = COALESCE(p_category, category),
        sort_order = p_sort_order,
        width = COALESCE(p_width, width),
        height = COALESCE(p_height, height),
        file_size = COALESCE(p_file_size, file_size)
    WHERE id = p_id
    RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.gallery_images (storage_path, title, caption, category, sort_order, width, height, file_size)
    VALUES (p_storage_path, p_title, p_caption, p_category, p_sort_order, p_width, p_height, p_file_size)
    RETURNING id INTO v_id;
  END IF;

  RETURN jsonb_build_object('id', v_id);
END;
$$;


-- Delete gallery image (admin)
CREATE OR REPLACE FUNCTION public.delete_gallery_image(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.jwt() ->> 'sub' AND user_type = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.gallery_images WHERE id = p_id;
  RETURN jsonb_build_object('success', true);
END;
$$;


-- Reorder gallery images (admin)
CREATE OR REPLACE FUNCTION public.reorder_gallery_images(p_ids uuid[], p_orders integer[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.jwt() ->> 'sub' AND user_type = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  FOR i IN 1..array_length(p_ids, 1) LOOP
    UPDATE public.gallery_images SET sort_order = p_orders[i] WHERE id = p_ids[i];
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ============================================================
-- SECTION 5: GRANT PERMISSIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION public.insert_trip TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_shipment TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_shipment_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_trip TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_shipment TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_trip_coords TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_shipment_coords TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_price_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_trip TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_trip TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_trip_delivered TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_trucker_rating TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_shipper_rating TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_credit_score TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_driver_risk TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_corridor_average TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_route_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_clerk_user_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_team_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_team_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_team_members TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_gallery_image TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_gallery_image TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_gallery_images TO authenticated;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
