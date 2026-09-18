-- Migration: Fix auth_rls_initplan performance
-- Wraps auth.jwt() ->> 'sub' in SELECT subqueries so PostgreSQL evaluates
-- the JWT lookup once per query, not once per row.
--
-- 37 policies across 15 tables need fixing.
-- Policies using `true`, no auth.jwt(), or anon-only roles are NOT touched.
-- Policies already using (SELECT ...) are NOT touched.

BEGIN;

-- ============================================================
-- 1. admin_audit_log (2 policies)
-- ============================================================
DROP POLICY IF EXISTS "Admins read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins read audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.jwt() ->> 'sub'::text)
        AND u.user_type = 'admin'::text
    )
  );

DROP POLICY IF EXISTS "Admins write audit log" ON public.admin_audit_log;
CREATE POLICY "Admins write audit log" ON public.admin_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.jwt() ->> 'sub'::text)
        AND u.user_type = 'admin'::text
    )
  );

-- ============================================================
-- 2. credit_scores (2 policies — skip "System can insert/update" which use 'true')
-- ============================================================
DROP POLICY IF EXISTS "Users can view own credit scores" ON public.credit_scores;
CREATE POLICY "Users can view own credit scores" ON public.credit_scores
  FOR SELECT TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub'::text) = user_id);

-- ============================================================
-- 3. driver_locations (2 policies — skip "Anyone can read" which uses 'true')
-- ============================================================
DROP POLICY IF EXISTS "Drivers can insert own location" ON public.driver_locations;
CREATE POLICY "Drivers can insert own location" ON public.driver_locations
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'sub'::text) = driver_id);

DROP POLICY IF EXISTS "Drivers can update own location" ON public.driver_locations;
CREATE POLICY "Drivers can update own location" ON public.driver_locations
  FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub'::text) = driver_id)
  WITH CHECK ((SELECT auth.jwt() ->> 'sub'::text) = driver_id);

-- ============================================================
-- 4. favorites (3 policies)
-- ============================================================
DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
CREATE POLICY "Users can add favorites" ON public.favorites
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'sub'::text) = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;
CREATE POLICY "Users can delete own favorites" ON public.favorites
  FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub'::text) = user_id);

DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
CREATE POLICY "Users can view own favorites" ON public.favorites
  FOR SELECT TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub'::text) = user_id);

-- ============================================================
-- 5. load_locations (2 policies — skip "Anyone can read" which uses 'true')
-- ============================================================
DROP POLICY IF EXISTS "Shippers can insert own load" ON public.load_locations;
CREATE POLICY "Shippers can insert own load" ON public.load_locations
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'sub'::text) = shipper_id);

DROP POLICY IF EXISTS "Shippers can update own load" ON public.load_locations;
CREATE POLICY "Shippers can update own load" ON public.load_locations
  FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub'::text) = shipper_id)
  WITH CHECK ((SELECT auth.jwt() ->> 'sub'::text) = shipper_id);

-- ============================================================
-- 6. messages (3 policies)
-- ============================================================
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;
CREATE POLICY "Recipients can mark messages as read" ON public.messages
  FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub'::text) = recipient_id)
  WITH CHECK ((SELECT auth.jwt() ->> 'sub'::text) = recipient_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'sub'::text) = sender_id);

DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT TO authenticated
  USING (
    ((SELECT auth.jwt() ->> 'sub'::text) = sender_id)
    OR
    ((SELECT auth.jwt() ->> 'sub'::text) = recipient_id)
  );

-- ============================================================
-- 7. notifications (2 policies — skip "System can create" which uses 'true')
-- ============================================================
DROP POLICY IF EXISTS "Users can mark own notifications read" ON public.notifications;
CREATE POLICY "Users can mark own notifications read" ON public.notifications
  FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub'::text) = user_id)
  WITH CHECK ((SELECT auth.jwt() ->> 'sub'::text) = user_id);

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub'::text) = user_id);

-- ============================================================
-- 8. requests (3 policies)
-- ============================================================
DROP POLICY IF EXISTS "Users can create requests" ON public.requests;
CREATE POLICY "Users can create requests" ON public.requests
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'sub'::text) = shipper_id);

DROP POLICY IF EXISTS "Users can update own requests" ON public.requests;
CREATE POLICY "Users can update own requests" ON public.requests
  FOR UPDATE TO authenticated
  USING (
    ((SELECT auth.jwt() ->> 'sub'::text) = shipper_id)
    OR
    ((SELECT auth.jwt() ->> 'sub'::text) = receiver_id)
  )
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own requests" ON public.requests;
CREATE POLICY "Users can view own requests" ON public.requests
  FOR SELECT TO authenticated
  USING (
    ((SELECT auth.jwt() ->> 'sub'::text) = shipper_id)
    OR
    ((SELECT auth.jwt() ->> 'sub'::text) = receiver_id)
  );

-- ============================================================
-- 9. reviews (1 policy — skip "Anyone can view" which uses 'true')
-- ============================================================
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    ((reviewer_role = 'shipper'::text) AND ((SELECT auth.jwt() ->> 'sub'::text) = shipper_id))
    OR
    ((reviewer_role = 'trucker'::text) AND ((SELECT auth.jwt() ->> 'sub'::text) = trucker_id))
  );

-- ============================================================
-- 10. shipment_requests (3 policies)
-- ============================================================
DROP POLICY IF EXISTS "Truckers can create shipment requests" ON public.shipment_requests;
CREATE POLICY "Truckers can create shipment requests" ON public.shipment_requests
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'sub'::text) = trucker_id);

DROP POLICY IF EXISTS "Users can update shipment requests" ON public.shipment_requests;
CREATE POLICY "Users can update shipment requests" ON public.shipment_requests
  FOR UPDATE TO authenticated
  USING (
    ((SELECT auth.jwt() ->> 'sub'::text) = trucker_id)
    OR
    ((SELECT auth.jwt() ->> 'sub'::text) = shipper_id)
  )
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view shipment requests" ON public.shipment_requests;
CREATE POLICY "Users can view shipment requests" ON public.shipment_requests
  FOR SELECT TO authenticated
  USING (
    ((SELECT auth.jwt() ->> 'sub'::text) = trucker_id)
    OR
    ((SELECT auth.jwt() ->> 'sub'::text) = shipper_id)
  );

-- ============================================================
-- 11. shipments (4 policies — skip "Anonymous can view pending" which has no auth.jwt())
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view shipments" ON public.shipments;
CREATE POLICY "Anyone can view shipments" ON public.shipments
  FOR SELECT TO authenticated
  USING (
    (status = 'pending'::text)
    OR
    ((SELECT auth.jwt() ->> 'sub'::text) = shipper_id)
  );

DROP POLICY IF EXISTS "Shippers can create shipments" ON public.shipments;
CREATE POLICY "Shippers can create shipments" ON public.shipments
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'sub'::text) = shipper_id);

DROP POLICY IF EXISTS "Shippers can delete own shipments" ON public.shipments;
CREATE POLICY "Shippers can delete own shipments" ON public.shipments
  FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub'::text) = shipper_id);

DROP POLICY IF EXISTS "Shippers can update own shipments" ON public.shipments;
CREATE POLICY "Shippers can update own shipments" ON public.shipments
  FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub'::text) = shipper_id)
  WITH CHECK ((SELECT auth.jwt() ->> 'sub'::text) = shipper_id);

-- ============================================================
-- 12. team_members (1 policy — skip "Team members are public" which uses 'true')
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
CREATE POLICY "Admins can manage team members" ON public.team_members
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.jwt() ->> 'sub'::text)
        AND users.user_type = 'admin'::text
    )
  )
  WITH CHECK (true);

-- ============================================================
-- 13. templates (4 policies)
-- ============================================================
DROP POLICY IF EXISTS "Users can create templates" ON public.templates;
CREATE POLICY "Users can create templates" ON public.templates
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'sub'::text) = user_id);

DROP POLICY IF EXISTS "Users can delete own templates" ON public.templates;
CREATE POLICY "Users can delete own templates" ON public.templates
  FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub'::text) = user_id);

DROP POLICY IF EXISTS "Users can update own templates" ON public.templates;
CREATE POLICY "Users can update own templates" ON public.templates
  FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub'::text) = user_id)
  WITH CHECK ((SELECT auth.jwt() ->> 'sub'::text) = user_id);

DROP POLICY IF EXISTS "Users can view own templates" ON public.templates;
CREATE POLICY "Users can view own templates" ON public.templates
  FOR SELECT TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub'::text) = user_id);

-- ============================================================
-- 14. trips (3 policies — skip "Anonymous can view" and "Anyone can view active" which use 'true')
-- ============================================================
DROP POLICY IF EXISTS "Truckers can create trips" ON public.trips;
CREATE POLICY "Truckers can create trips" ON public.trips
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'sub'::text) = trucker_id);

DROP POLICY IF EXISTS "Truckers can delete own trips" ON public.trips;
CREATE POLICY "Truckers can delete own trips" ON public.trips
  FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub'::text) = trucker_id);

DROP POLICY IF EXISTS "Truckers can update own trips" ON public.trips;
CREATE POLICY "Truckers can update own trips" ON public.trips
  FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub'::text) = trucker_id)
  WITH CHECK ((SELECT auth.jwt() ->> 'sub'::text) = trucker_id);

-- ============================================================
-- 15. users (3 policies — skip "Authenticated users can read all" which uses 'true')
-- ============================================================
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
CREATE POLICY "Admins can update any user" ON public.users
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users users_1
      WHERE users_1.id = (SELECT auth.jwt() ->> 'sub'::text)
        AND users_1.user_type = 'admin'::text
    )
  )
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'sub'::text) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt() ->> 'sub'::text) = id)
  WITH CHECK ((SELECT auth.jwt() ->> 'sub'::text) = id);

COMMIT;
