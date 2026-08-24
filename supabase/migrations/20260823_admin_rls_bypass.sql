-- Migration: Add admin bypass RLS policies
-- Date: 2026-08-23
-- Purpose: Allow admin users to read/write all tables for the admin panel

-- Helper: returns true if the current JWT user is an admin
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

-- ===================== USERS =====================
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE TO authenticated USING (auth.jwt()->>'sub' = id OR public.is_admin());

-- ===================== TRIPS =====================
DROP POLICY IF EXISTS "Truckers can update own trips" ON public.trips;
CREATE POLICY "Truckers can update own trips" ON public.trips
  FOR UPDATE TO authenticated USING (auth.jwt()->>'sub' = trucker_id OR public.is_admin());

DROP POLICY IF EXISTS "Truckers can delete own trips" ON public.trips;
CREATE POLICY "Truckers can delete own trips" ON public.trips
  FOR DELETE TO authenticated USING (auth.jwt()->>'sub' = trucker_id OR public.is_admin());

-- ===================== SHIPMENTS =====================
DROP POLICY IF EXISTS "Anyone can see pending or own shipments" ON public.shipments;
CREATE POLICY "Anyone can see pending or own shipments" ON public.shipments
  FOR SELECT TO authenticated USING (status = 'pending' OR auth.jwt()->>'sub' = shipper_id OR public.is_admin());

DROP POLICY IF EXISTS "Shippers can update own shipments" ON public.shipments;
CREATE POLICY "Shippers can update own shipments" ON public.shipments
  FOR UPDATE TO authenticated USING (auth.jwt()->>'sub' = shipper_id OR public.is_admin());

DROP POLICY IF EXISTS "Shippers can delete own shipments" ON public.shipments;
CREATE POLICY "Shippers can delete own shipments" ON public.shipments
  FOR DELETE TO authenticated USING (auth.jwt()->>'sub' = shipper_id OR public.is_admin());

-- ===================== REQUESTS =====================
DROP POLICY IF EXISTS "Users can see relevant requests" ON public.requests;
CREATE POLICY "Users can see relevant requests" ON public.requests
  FOR SELECT TO authenticated USING (
    auth.jwt()->>'sub' = shipper_id OR
    auth.jwt()->>'sub' = receiver_id OR
    trip_id IN (SELECT id FROM trips WHERE trucker_id = auth.jwt()->>'sub')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Shippers can update own requests" ON public.requests;
CREATE POLICY "Shippers can update own requests" ON public.requests
  FOR UPDATE TO authenticated USING (auth.jwt()->>'sub' = shipper_id OR public.is_admin());

DROP POLICY IF EXISTS "Truckers can update received requests" ON public.requests;
CREATE POLICY "Truckers can update received requests" ON public.requests
  FOR UPDATE TO authenticated USING (auth.jwt()->>'sub' = receiver_id OR public.is_admin());

-- ===================== SHIPMENT REQUESTS =====================
DROP POLICY IF EXISTS "Users can see relevant shipment requests" ON public.shipment_requests;
CREATE POLICY "Users can see relevant shipment requests" ON public.shipment_requests
  FOR SELECT TO authenticated USING (
    auth.jwt()->>'sub' = shipper_id OR
    auth.jwt()->>'sub' = trucker_id OR
    shipment_id IN (SELECT id FROM shipments WHERE shipper_id = auth.jwt()->>'sub')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Truckers can update own shipment requests" ON public.shipment_requests;
CREATE POLICY "Truckers can update own shipment requests" ON public.shipment_requests
  FOR UPDATE TO authenticated USING (auth.jwt()->>'sub' = trucker_id OR public.is_admin());

DROP POLICY IF EXISTS "Shippers can update received shipment requests" ON public.shipment_requests;
CREATE POLICY "Shippers can update received shipment requests" ON public.shipment_requests
  FOR UPDATE TO authenticated USING (
    shipment_id IN (SELECT id FROM shipments WHERE shipper_id = auth.jwt()->>'sub')
    OR public.is_admin()
  );

-- ===================== MESSAGES =====================
DROP POLICY IF EXISTS "Users can see their messages" ON public.messages;
CREATE POLICY "Users can see their messages" ON public.messages
  FOR SELECT TO authenticated USING (
    auth.jwt()->>'sub' = sender_id OR
    auth.jwt()->>'sub' = recipient_id
    OR public.is_admin()
  );

-- ===================== NOTIFICATIONS =====================
DROP POLICY IF EXISTS "Users can see their notifications" ON public.notifications;
CREATE POLICY "Users can see their notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.jwt()->>'sub' = user_id OR public.is_admin());
