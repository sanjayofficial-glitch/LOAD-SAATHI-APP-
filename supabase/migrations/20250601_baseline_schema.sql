-- ================================================================
-- LOADSAATHI — Baseline schema (idempotent)
-- Date: 2025-06-01
-- Purpose: bootstrap the core schema so the migration history can be
--          replayed from an empty database.
-- ================================================================
--
-- WHY THIS FILE EXISTS
--
-- Every migration in this folder was written against a database whose core
-- tables already existed, created by hand from final-schema.sql. Nothing in
-- this folder ever created them. So a fresh database -- a Supabase preview
-- branch, a new environment, a local `supabase db reset` -- would run
-- 20250611_schema_optimization.sql and die immediately on:
--
--   ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at ...
--   ERROR: relation "users" does not exist (SQLSTATE 42P01)
--
-- This migration closes that gap. It is a faithful copy of
-- supabase/src/integrations/supabase/final-schema.sql, which is the schema
-- the rest of the history assumes.
--
-- DELIBERATELY DIFFERENT FROM final-schema.sql
--
-- final-schema.sql is a destructive teardown-and-rebuild script. It opens by
-- dropping every table with CASCADE, and it is only ever meant to be run
-- against an empty database by hand. Copying that verbatim into a migration
-- would be a loaded gun: production has no record of this filename, so a
-- future `supabase db push` would attempt to run it and delete every row in
-- the database.
--
-- So this baseline has no DROP TABLE statements at all. Tables are created
-- with IF NOT EXISTS instead. Combined with the guards below, every statement
-- here is a no-op when replayed against a database that already has the
-- schema, which is what makes it safe to push to production.
--
-- Later migrations in this history tighten these policies, so the end state
-- after a full replay matches the hardened production schema rather than the
-- more permissive one defined below.
--
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- USERS
-- ================================================================
-- id stays text for Clerk compatibility.
CREATE TABLE IF NOT EXISTS public.users (
  id text NOT NULL,
  email text NOT NULL,
  user_type text NOT NULL CHECK (user_type = ANY (ARRAY['trucker'::text, 'shipper'::text, 'admin'::text])),
  full_name text,
  phone text,
  company_name text,
  is_verified boolean DEFAULT false,
  rating numeric DEFAULT 0 CHECK (rating >= 0::numeric AND rating <= 5::numeric),
  total_trips integer DEFAULT 0 CHECK (total_trips >= 0),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- ================================================================
-- TRIPS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.trips (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trucker_id text NOT NULL,  -- References users.id (text)
  origin_city text NOT NULL,
  destination_city text NOT NULL,
  departure_date date NOT NULL,
  available_capacity_tonnes numeric NOT NULL CHECK (available_capacity_tonnes > 0::numeric),
  price_per_tonne numeric NOT NULL CHECK (price_per_tonne > 0::numeric),
  vehicle_type text NOT NULL,
  vehicle_number text NOT NULL,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'in_transit'::text, 'delivered'::text, 'completed'::text, 'cancelled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  origin_state text,
  destination_state text,
  origin_lat numeric,
  origin_lng numeric,
  destination_lat numeric,
  destination_lng numeric,
  estimated_distance_km numeric,
  estimated_duration_min integer,
  CONSTRAINT trips_pkey PRIMARY KEY (id),
  CONSTRAINT trips_trucker_id_fkey FOREIGN KEY (trucker_id) REFERENCES public.users(id)
);

-- ================================================================
-- SHIPMENTS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.shipments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shipper_id text NOT NULL,  -- References users.id (text)
  origin_city text NOT NULL,
  destination_city text NOT NULL,
  origin_state text,
  destination_state text,
  departure_date date NOT NULL,
  goods_description text NOT NULL,
  weight_tonnes numeric NOT NULL CHECK (weight_tonnes > 0::numeric),
  pickup_address text NOT NULL,
  delivery_address text NOT NULL,
  budget_per_tonne numeric NOT NULL CHECK (budget_per_tonne > 0::numeric),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'matched'::text, 'in_transit'::text, 'delivered'::text, 'completed'::text, 'cancelled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  origin_lat numeric,
  origin_lng numeric,
  destination_lat numeric,
  destination_lng numeric,
  estimated_distance_km numeric,
  estimated_duration_min integer,
  CONSTRAINT shipments_pkey PRIMARY KEY (id),
  CONSTRAINT shipments_shipper_id_fkey FOREIGN KEY (shipper_id) REFERENCES public.users(id)
);

-- ================================================================
-- REQUESTS  (shipper asks to join a trucker's trip)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL,
  shipper_id text NOT NULL,  -- References users.id (text)
  receiver_id text NOT NULL,  -- References users.id (text) - the trucker
  goods_description text NOT NULL,
  weight_tonnes numeric NOT NULL CHECK (weight_tonnes > 0::numeric),
  pickup_address text,
  delivery_address text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])),
  shipment_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT requests_pkey PRIMARY KEY (id),
  CONSTRAINT requests_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id),
  CONSTRAINT requests_shipper_id_fkey FOREIGN KEY (shipper_id) REFERENCES public.users(id),
  CONSTRAINT requests_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id),
  CONSTRAINT requests_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(id)
);

-- ================================================================
-- SHIPMENT_REQUESTS  (trucker offers to shippers)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.shipment_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL,
  trucker_id text NOT NULL,  -- References users.id (text)
  shipper_id text NOT NULL,  -- References users.id (text)
  proposed_price_per_tonne numeric,
  message text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'cancelled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shipment_requests_pkey PRIMARY KEY (id),
  CONSTRAINT shipment_requests_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(id),
  CONSTRAINT shipment_requests_trucker_id_fkey FOREIGN KEY (trucker_id) REFERENCES public.users(id),
  CONSTRAINT shipment_requests_shipper_id_fkey FOREIGN KEY (shipper_id) REFERENCES public.users(id)
);

-- ================================================================
-- REVIEWS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL,
  trucker_id text NOT NULL,  -- References users.id (text)
  shipper_id text NOT NULL,  -- References users.id (text)
  reviewer_role text NOT NULL DEFAULT 'shipper' CHECK (reviewer_role IN ('shipper', 'trucker')),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_shipper_id_fkey FOREIGN KEY (shipper_id) REFERENCES public.users(id),
  CONSTRAINT reviews_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id),
  CONSTRAINT reviews_trucker_id_fkey FOREIGN KEY (trucker_id) REFERENCES public.users(id),
  CONSTRAINT unique_trip_role_review UNIQUE (trip_id, reviewer_role, shipper_id)
);

-- Recalculate trucker rating from shipper reviews
CREATE OR REPLACE FUNCTION public.update_trucker_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_rating numeric;
  target_trucker_id text;
BEGIN
  target_trucker_id := COALESCE(NEW.trucker_id, OLD.trucker_id);
  SELECT ROUND(AVG(rating)::numeric, 1) INTO avg_rating
  FROM public.reviews
  WHERE trucker_id = target_trucker_id
    AND reviewer_role = 'shipper';
  UPDATE public.users
  SET rating = COALESCE(avg_rating, 0)
  WHERE id = target_trucker_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recalculate shipper rating from trucker reviews
CREATE OR REPLACE FUNCTION public.update_shipper_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_rating numeric;
  target_shipper_id text;
BEGIN
  target_shipper_id := COALESCE(NEW.shipper_id, OLD.shipper_id);
  SELECT ROUND(AVG(rating)::numeric, 1) INTO avg_rating
  FROM public.reviews
  WHERE shipper_id = target_shipper_id
    AND reviewer_role = 'trucker';
  UPDATE public.users
  SET rating = COALESCE(avg_rating, 0)
  WHERE id = target_shipper_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_reviews_update_rating ON public.reviews;
DROP TRIGGER IF EXISTS trg_reviews_update_trucker_rating ON public.reviews;
DROP TRIGGER IF EXISTS trg_reviews_update_shipper_rating ON public.reviews;

CREATE TRIGGER trg_reviews_update_trucker_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  WHEN (NEW.reviewer_role IS NOT DISTINCT FROM 'shipper' OR OLD.reviewer_role IS NOT DISTINCT FROM 'shipper')
  EXECUTE FUNCTION public.update_trucker_rating();

CREATE TRIGGER trg_reviews_update_shipper_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  WHEN (NEW.reviewer_role IS NOT DISTINCT FROM 'trucker' OR OLD.reviewer_role IS NOT DISTINCT FROM 'trucker')
  EXECUTE FUNCTION public.update_shipper_rating();

-- ================================================================
-- MESSAGES
-- ================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id text NOT NULL,  -- References users.id (text)
  recipient_id text NOT NULL,  -- References users.id (text)
  content text NOT NULL,
  request_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  shipment_request_id uuid,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id),
  CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id),
  CONSTRAINT messages_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.requests(id),
  CONSTRAINT messages_shipment_request_id_fkey FOREIGN KEY (shipment_request_id) REFERENCES public.shipment_requests(id)
);

-- ================================================================
-- NOTIFICATIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,  -- References users.id (text)
  message text NOT NULL,
  is_read boolean DEFAULT false,
  related_trip_id uuid,
  related_shipment_request_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  type text,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT notifications_related_trip_id_fkey FOREIGN KEY (related_trip_id) REFERENCES public.trips(id),
  CONSTRAINT notifications_related_shipment_request_id_fkey FOREIGN KEY (related_shipment_request_id) REFERENCES public.shipment_requests(id)
);

-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_trucker_id ON public.trips(trucker_id);
CREATE INDEX IF NOT EXISTS idx_trips_origin_city ON public.trips(origin_city);
CREATE INDEX IF NOT EXISTS idx_trips_destination_city ON public.trips(destination_city);
CREATE INDEX IF NOT EXISTS idx_trips_status_origin_dest ON public.trips(status, origin_city, destination_city);
CREATE INDEX IF NOT EXISTS idx_trips_departure_date ON public.trips(departure_date);

CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_shipper_id ON public.shipments(shipper_id);
CREATE INDEX IF NOT EXISTS idx_shipments_origin_city ON public.shipments(origin_city);
CREATE INDEX IF NOT EXISTS idx_shipments_destination_city ON public.shipments(destination_city);
CREATE INDEX IF NOT EXISTS idx_shipments_status_origin_dest ON public.shipments(status, origin_city, destination_city);
CREATE INDEX IF NOT EXISTS idx_shipments_departure_date ON public.shipments(departure_date);

CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_trip_id ON public.requests(trip_id);
CREATE INDEX IF NOT EXISTS idx_requests_shipper_id ON public.requests(shipper_id);

CREATE INDEX IF NOT EXISTS idx_shipment_requests_status ON public.shipment_requests(status);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_shipment_id ON public.shipment_requests(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_trucker_id ON public.shipment_requests(trucker_id);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_shipper_id ON public.shipment_requests(shipper_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);

-- ================================================================
-- REALTIME
-- ================================================================
-- Guarded because ADD TABLE is not idempotent: replaying it errors with
-- "relation is already member of publication". Checked per table so this
-- stays a no-op on a database that already publishes them.
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'trips', 'shipments', 'requests', 'shipment_requests', 'messages', 'notifications'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Returns true when the current JWT user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.jwt()->>'sub' AND user_type = 'admin'
  );
$$;

-- ================================================================
-- POLICIES
-- Superseded and tightened by the 20260927_* migrations; kept here so a
-- from-empty replay ends up with a working, if less strict, policy set.
-- ================================================================

-- ---------- USERS ----------
-- Users create their own profile during role selection
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT TO authenticated WITH CHECK (auth.jwt()->>'sub' = id);

-- Users update their own profile; admins update anyone
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE TO authenticated USING (auth.jwt()->>'sub' = id OR public.is_admin());

-- Authenticated users read all users, needed for JOINs that show names
DROP POLICY IF EXISTS "Authenticated users can read all users" ON public.users;
CREATE POLICY "Authenticated users can read all users" ON public.users
  FOR SELECT TO authenticated USING (true);

-- Public share pages embed a public profile. The column-level GRANT at the
-- bottom restricts anon to id, full_name, rating, is_verified.
DROP POLICY IF EXISTS "Anonymous can read public profile fields" ON public.users;
CREATE POLICY "Anonymous can read public profile fields" ON public.users
  FOR SELECT TO anon USING (true);

-- ---------- TRIPS ----------
DROP POLICY IF EXISTS "Anyone can see active trips" ON public.trips;
CREATE POLICY "Anyone can see active trips" ON public.trips
  FOR SELECT TO authenticated USING (true);

-- Anonymous visitors of /share/trip/:id only see active trips
DROP POLICY IF EXISTS "Anonymous can view active trips" ON public.trips;
CREATE POLICY "Anonymous can view active trips" ON public.trips
  FOR SELECT TO anon USING (status = 'active');

DROP POLICY IF EXISTS "Truckers can create trips" ON public.trips;
CREATE POLICY "Truckers can create trips" ON public.trips
  FOR INSERT TO authenticated WITH CHECK (auth.jwt()->>'sub' = trucker_id);

DROP POLICY IF EXISTS "Truckers can update own trips" ON public.trips;
CREATE POLICY "Truckers can update own trips" ON public.trips
  FOR UPDATE TO authenticated USING (auth.jwt()->>'sub' = trucker_id OR public.is_admin());

DROP POLICY IF EXISTS "Truckers can delete own trips" ON public.trips;
CREATE POLICY "Truckers can delete own trips" ON public.trips
  FOR DELETE TO authenticated USING (auth.jwt()->>'sub' = trucker_id OR public.is_admin());

-- ---------- SHIPMENTS ----------
-- Pending shipments, or your own, so a shipper can see matched/completed
DROP POLICY IF EXISTS "Anyone can see pending or own shipments" ON public.shipments;
CREATE POLICY "Anyone can see pending or own shipments" ON public.shipments
  FOR SELECT TO authenticated USING (status = 'pending' OR auth.jwt()->>'sub' = shipper_id OR public.is_admin());

-- Anonymous visitors of /share/shipment/:id only see pending shipments
DROP POLICY IF EXISTS "Anonymous can view pending shipments" ON public.shipments;
CREATE POLICY "Anonymous can view pending shipments" ON public.shipments
  FOR SELECT TO anon USING (status = 'pending');

DROP POLICY IF EXISTS "Shippers can create shipments" ON public.shipments;
CREATE POLICY "Shippers can create shipments" ON public.shipments
  FOR INSERT TO authenticated WITH CHECK (auth.jwt()->>'sub' = shipper_id);

DROP POLICY IF EXISTS "Shippers can update own shipments" ON public.shipments;
CREATE POLICY "Shippers can update own shipments" ON public.shipments
  FOR UPDATE TO authenticated USING (auth.jwt()->>'sub' = shipper_id OR public.is_admin());

DROP POLICY IF EXISTS "Shippers can delete own shipments" ON public.shipments;
CREATE POLICY "Shippers can delete own shipments" ON public.shipments
  FOR DELETE TO authenticated USING (auth.jwt()->>'sub' = shipper_id OR public.is_admin());

-- ---------- REQUESTS ----------
DROP POLICY IF EXISTS "Users can see relevant requests" ON public.requests;
CREATE POLICY "Users can see relevant requests" ON public.requests
  FOR SELECT TO authenticated USING (
    auth.jwt()->>'sub' = shipper_id OR
    auth.jwt()->>'sub' = receiver_id OR
    trip_id IN (SELECT id FROM trips WHERE trucker_id = auth.jwt()->>'sub')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Shippers can create requests" ON public.requests;
CREATE POLICY "Shippers can create requests" ON public.requests
  FOR INSERT TO authenticated WITH CHECK (auth.jwt()->>'sub' = shipper_id);

DROP POLICY IF EXISTS "Shippers can update own requests" ON public.requests;
CREATE POLICY "Shippers can update own requests" ON public.requests
  FOR UPDATE TO authenticated USING (auth.jwt()->>'sub' = shipper_id OR public.is_admin());

DROP POLICY IF EXISTS "Truckers can update received requests" ON public.requests;
CREATE POLICY "Truckers can update received requests" ON public.requests
  FOR UPDATE TO authenticated USING (auth.jwt()->>'sub' = receiver_id OR public.is_admin());

-- ---------- SHIPMENT_REQUESTS ----------
DROP POLICY IF EXISTS "Users can see relevant shipment requests" ON public.shipment_requests;
CREATE POLICY "Users can see relevant shipment requests" ON public.shipment_requests
  FOR SELECT TO authenticated USING (
    auth.jwt()->>'sub' = shipper_id OR
    auth.jwt()->>'sub' = trucker_id OR
    shipment_id IN (SELECT id FROM shipments WHERE shipper_id = auth.jwt()->>'sub')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Truckers can create shipment requests" ON public.shipment_requests;
CREATE POLICY "Truckers can create shipment requests" ON public.shipment_requests
  FOR INSERT TO authenticated WITH CHECK (auth.jwt()->>'sub' = trucker_id);

DROP POLICY IF EXISTS "Truckers can update own shipment requests" ON public.shipment_requests;
CREATE POLICY "Truckers can update own shipment requests" ON public.shipment_requests
  FOR UPDATE TO authenticated USING (auth.jwt()->>'sub' = trucker_id OR public.is_admin());

DROP POLICY IF EXISTS "Shippers can update received shipment requests" ON public.shipment_requests;
CREATE POLICY "Shippers can update received shipment requests" ON public.shipment_requests
  FOR UPDATE TO authenticated USING (
    shipment_id IN (SELECT id FROM shipments WHERE shipper_id = auth.jwt()->>'sub')
    OR public.is_admin()
  );

-- ---------- REVIEWS ----------
DROP POLICY IF EXISTS "Anyone can see reviews" ON public.reviews;
CREATE POLICY "Anyone can see reviews" ON public.reviews
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Shippers can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (
    (reviewer_role = 'shipper' AND auth.jwt()->>'sub' = shipper_id)
    OR
    (reviewer_role = 'trucker' AND auth.jwt()->>'sub' = trucker_id)
  );

-- ---------- MESSAGES ----------
DROP POLICY IF EXISTS "Users can see their messages" ON public.messages;
CREATE POLICY "Users can see their messages" ON public.messages
  FOR SELECT TO authenticated USING (
    auth.jwt()->>'sub' = sender_id OR
    auth.jwt()->>'sub' = recipient_id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.jwt()->>'sub' = sender_id);

-- ---------- NOTIFICATIONS ----------
DROP POLICY IF EXISTS "Users can see their notifications" ON public.notifications;
CREATE POLICY "Users can see their notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.jwt()->>'sub' = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can create own notifications" ON public.notifications;
CREATE POLICY "Users can create own notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.jwt()->>'sub' = user_id);

-- ================================================================
-- ANON GRANTS (public share pages)
-- ================================================================
-- RLS policies alone are not enough: anon also needs SELECT grants.
-- Kept narrow on purpose. NOT granted to anon: gallery_images, function
-- EXECUTE, or any DML -- the 20260918_* migrations revoke those and they are
-- intentionally left revoked.
GRANT SELECT ON public.trips TO anon;
GRANT SELECT ON public.shipments TO anon;
GRANT SELECT (id, full_name, rating, is_verified) ON public.users TO anon;
