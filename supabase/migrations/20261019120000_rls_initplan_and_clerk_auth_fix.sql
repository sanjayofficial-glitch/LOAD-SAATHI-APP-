-- RLS initplan optimization + Clerk auth compatibility fix.
--
-- Generated mechanically from pg_policies (no hand-typed expressions):
--   1. Every `auth.jwt() ->> 'sub'` (bare or nested)  ->  (select current_clerk_user_id())
--   2. Every `auth.uid()` (bare or nested)            ->  (select current_clerk_user_id())
--      auth.uid() casts the JWT sub to uuid and THROWS on Clerk-format IDs
--      (proven: 22P02 invalid input syntax for type uuid) - gallery_images
--      admin policy was silently broken for admins.
--   3. Bare `is_admin()`                              ->  (select is_admin())
--      so the users-table lookup runs once per statement (initplan), not per row.
--
-- Semantics are byte-for-byte equivalent: current_clerk_user_id() IS
-- `SELECT auth.jwt() ->> 'sub'`. Only evaluation caching changes.

ALTER FUNCTION public.current_clerk_user_id() STABLE;

-- ============ admin_audit_log ============
DROP POLICY IF EXISTS "Admins read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins read audit log" ON public.admin_audit_log AS PERMISSIVE FOR SELECT TO authenticated USING (EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = (select current_clerk_user_id())) AND (u.user_type = 'admin'::text))));

DROP POLICY IF EXISTS "Admins write audit log" ON public.admin_audit_log;
CREATE POLICY "Admins write audit log" ON public.admin_audit_log AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = (select current_clerk_user_id())) AND (u.user_type = 'admin'::text))));

-- ============ credit_scores ============
DROP POLICY IF EXISTS "Users can view own credit scores" ON public.credit_scores;
CREATE POLICY "Users can view own credit scores" ON public.credit_scores AS PERMISSIVE FOR SELECT TO authenticated USING ((select current_clerk_user_id()) = user_id);

-- ============ driver_locations ============
DROP POLICY IF EXISTS "Driver, participant or admin can read driver location" ON public.driver_locations;
CREATE POLICY "Driver, participant or admin can read driver location" ON public.driver_locations AS PERMISSIVE FOR SELECT TO authenticated USING (((select current_clerk_user_id()) = driver_id) OR (select is_admin()) OR ((trip_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM (requests r
     JOIN trips t ON ((t.id = r.trip_id)))
  WHERE ((r.trip_id = driver_locations.trip_id) AND (r.shipper_id = (select current_clerk_user_id())) AND (r.receiver_id = driver_locations.driver_id) AND (r.status = 'accepted'::text) AND (t.trucker_id = driver_locations.driver_id) AND (t.status = ANY (ARRAY['active'::text, 'in_transit'::text])))))) OR ((is_sharing = true) AND (trip_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM ((shipment_requests sr
     JOIN shipments s ON ((s.id = sr.shipment_id)))
     JOIN trips t ON ((t.id = driver_locations.trip_id)))
  WHERE ((sr.trucker_id = driver_locations.driver_id) AND (sr.shipper_id = (select current_clerk_user_id())) AND (sr.status = 'accepted'::text) AND (s.status = ANY (ARRAY['matched'::text, 'in_transit'::text])) AND (t.trucker_id = driver_locations.driver_id) AND (t.status = ANY (ARRAY['active'::text, 'in_transit'::text])))))));

DROP POLICY IF EXISTS "Drivers can insert own location" ON public.driver_locations;
CREATE POLICY "Drivers can insert own location" ON public.driver_locations AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((select current_clerk_user_id()) = driver_id);

DROP POLICY IF EXISTS "Drivers can update own location" ON public.driver_locations;
CREATE POLICY "Drivers can update own location" ON public.driver_locations AS PERMISSIVE FOR UPDATE TO authenticated USING ((select current_clerk_user_id()) = driver_id) WITH CHECK ((select current_clerk_user_id()) = driver_id);

-- ============ favorites ============
DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
CREATE POLICY "Users can add favorites" ON public.favorites AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((select current_clerk_user_id()) = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;
CREATE POLICY "Users can delete own favorites" ON public.favorites AS PERMISSIVE FOR DELETE TO authenticated USING ((select current_clerk_user_id()) = user_id);

DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
CREATE POLICY "Users can view own favorites" ON public.favorites AS PERMISSIVE FOR SELECT TO authenticated USING ((select current_clerk_user_id()) = user_id);

-- ============ gallery_images ============
DROP POLICY IF EXISTS "Admins can manage gallery images" ON public.gallery_images;
CREATE POLICY "Admins can manage gallery images" ON public.gallery_images AS PERMISSIVE FOR ALL TO authenticated USING (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ((select current_clerk_user_id()))::text) AND (users.user_type = 'admin'::text)))) WITH CHECK (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ((select current_clerk_user_id()))::text) AND (users.user_type = 'admin'::text))));

-- ============ leads ============
DROP POLICY IF EXISTS "Admins can read leads" ON public.leads;
CREATE POLICY "Admins can read leads" ON public.leads AS PERMISSIVE FOR SELECT TO authenticated USING ((select is_admin()));

-- ============ load_locations ============
DROP POLICY IF EXISTS "Scoped load_locations read" ON public.load_locations;
CREATE POLICY "Scoped load_locations read" ON public.load_locations AS PERMISSIVE FOR SELECT TO authenticated USING ((status = 'active'::text) OR (shipper_id = (select current_clerk_user_id())) OR (select is_admin()));

DROP POLICY IF EXISTS "Shippers can insert own load" ON public.load_locations;
CREATE POLICY "Shippers can insert own load" ON public.load_locations AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((select current_clerk_user_id()) = shipper_id);

DROP POLICY IF EXISTS "Shippers can update own load" ON public.load_locations;
CREATE POLICY "Shippers can update own load" ON public.load_locations AS PERMISSIVE FOR UPDATE TO authenticated USING ((select current_clerk_user_id()) = shipper_id) WITH CHECK ((select current_clerk_user_id()) = shipper_id);

-- ============ messages ============
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;
CREATE POLICY "Recipients can mark messages as read" ON public.messages AS PERMISSIVE FOR UPDATE TO authenticated USING ((select current_clerk_user_id()) = recipient_id) WITH CHECK ((select current_clerk_user_id()) = recipient_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((select current_clerk_user_id()) = sender_id);

DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages AS PERMISSIVE FOR SELECT TO authenticated USING (((select current_clerk_user_id()) = sender_id) OR ((select current_clerk_user_id()) = recipient_id));

-- ============ notifications ============
DROP POLICY IF EXISTS "Users can mark own notifications read" ON public.notifications;
CREATE POLICY "Users can mark own notifications read" ON public.notifications AS PERMISSIVE FOR UPDATE TO authenticated USING ((select current_clerk_user_id()) = user_id) WITH CHECK ((select current_clerk_user_id()) = user_id);

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications AS PERMISSIVE FOR SELECT TO authenticated USING ((select current_clerk_user_id()) = user_id);

-- ============ requests ============
DROP POLICY IF EXISTS "Users can create requests" ON public.requests;
CREATE POLICY "Users can create requests" ON public.requests AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((select current_clerk_user_id()) = shipper_id);

DROP POLICY IF EXISTS "Users can update own requests" ON public.requests;
CREATE POLICY "Users can update own requests" ON public.requests AS PERMISSIVE FOR UPDATE TO authenticated USING (((select current_clerk_user_id()) = shipper_id) OR ((select current_clerk_user_id()) = receiver_id)) WITH CHECK (((select current_clerk_user_id()) = shipper_id) OR ((select current_clerk_user_id()) = receiver_id));

DROP POLICY IF EXISTS "Users can view own requests" ON public.requests;
CREATE POLICY "Users can view own requests" ON public.requests AS PERMISSIVE FOR SELECT TO authenticated USING (((select current_clerk_user_id()) = shipper_id) OR ((select current_clerk_user_id()) = receiver_id));

-- ============ reviews ============
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews" ON public.reviews AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((reviewer_role = 'shipper'::text) AND ((select current_clerk_user_id()) = shipper_id)) OR ((reviewer_role = 'trucker'::text) AND ((select current_clerk_user_id()) = trucker_id)));

-- ============ shipment_requests ============
DROP POLICY IF EXISTS "Truckers can create shipment requests" ON public.shipment_requests;
CREATE POLICY "Truckers can create shipment requests" ON public.shipment_requests AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((select current_clerk_user_id()) = trucker_id);

DROP POLICY IF EXISTS "Users can update shipment requests" ON public.shipment_requests;
CREATE POLICY "Users can update shipment requests" ON public.shipment_requests AS PERMISSIVE FOR UPDATE TO authenticated USING (((select current_clerk_user_id()) = trucker_id) OR ((select current_clerk_user_id()) = shipper_id)) WITH CHECK (((select current_clerk_user_id()) = trucker_id) OR ((select current_clerk_user_id()) = shipper_id));

DROP POLICY IF EXISTS "Users can view shipment requests" ON public.shipment_requests;
CREATE POLICY "Users can view shipment requests" ON public.shipment_requests AS PERMISSIVE FOR SELECT TO authenticated USING (((select current_clerk_user_id()) = trucker_id) OR ((select current_clerk_user_id()) = shipper_id));

-- ============ shipments ============
DROP POLICY IF EXISTS "Anyone can view shipments" ON public.shipments;
CREATE POLICY "Anyone can view shipments" ON public.shipments AS PERMISSIVE FOR SELECT TO authenticated USING ((status = 'pending'::text) OR ((select current_clerk_user_id()) = shipper_id));

DROP POLICY IF EXISTS "Shippers can create shipments" ON public.shipments;
CREATE POLICY "Shippers can create shipments" ON public.shipments AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((select current_clerk_user_id()) = shipper_id);

DROP POLICY IF EXISTS "Shippers can delete own shipments" ON public.shipments;
CREATE POLICY "Shippers can delete own shipments" ON public.shipments AS PERMISSIVE FOR DELETE TO authenticated USING ((select current_clerk_user_id()) = shipper_id);

DROP POLICY IF EXISTS "Shippers can update own shipments" ON public.shipments;
CREATE POLICY "Shippers can update own shipments" ON public.shipments AS PERMISSIVE FOR UPDATE TO authenticated USING ((select current_clerk_user_id()) = shipper_id) WITH CHECK ((select current_clerk_user_id()) = shipper_id);

-- ============ team_members ============
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
CREATE POLICY "Admins can manage team members" ON public.team_members AS PERMISSIVE FOR ALL TO authenticated USING (EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = (select current_clerk_user_id())) AND (u.user_type = 'admin'::text)))) WITH CHECK (EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = (select current_clerk_user_id())) AND (u.user_type = 'admin'::text))));

-- ============ templates ============
DROP POLICY IF EXISTS "Users can create templates" ON public.templates;
CREATE POLICY "Users can create templates" ON public.templates AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((select current_clerk_user_id()) = user_id);

DROP POLICY IF EXISTS "Users can delete own templates" ON public.templates;
CREATE POLICY "Users can delete own templates" ON public.templates AS PERMISSIVE FOR DELETE TO authenticated USING ((select current_clerk_user_id()) = user_id);

DROP POLICY IF EXISTS "Users can update own templates" ON public.templates;
CREATE POLICY "Users can update own templates" ON public.templates AS PERMISSIVE FOR UPDATE TO authenticated USING ((select current_clerk_user_id()) = user_id) WITH CHECK ((select current_clerk_user_id()) = user_id);

DROP POLICY IF EXISTS "Users can view own templates" ON public.templates;
CREATE POLICY "Users can view own templates" ON public.templates AS PERMISSIVE FOR SELECT TO authenticated USING ((select current_clerk_user_id()) = user_id);

-- ============ trips ============
DROP POLICY IF EXISTS "Truckers can create trips" ON public.trips;
CREATE POLICY "Truckers can create trips" ON public.trips AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((select current_clerk_user_id()) = trucker_id);

DROP POLICY IF EXISTS "Truckers can delete own trips" ON public.trips;
CREATE POLICY "Truckers can delete own trips" ON public.trips AS PERMISSIVE FOR DELETE TO authenticated USING ((select current_clerk_user_id()) = trucker_id);

DROP POLICY IF EXISTS "Truckers can update own trips" ON public.trips;
CREATE POLICY "Truckers can update own trips" ON public.trips AS PERMISSIVE FOR UPDATE TO authenticated USING ((select current_clerk_user_id()) = trucker_id) WITH CHECK ((select current_clerk_user_id()) = trucker_id);

-- ============ user_documents ============
DROP POLICY IF EXISTS "Users can add own pending documents" ON public.user_documents;
CREATE POLICY "Users can add own pending documents" ON public.user_documents AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((select current_clerk_user_id()) = user_id) AND (status = 'pending'::text));

DROP POLICY IF EXISTS "Users can delete own documents or admin any" ON public.user_documents;
CREATE POLICY "Users can delete own documents or admin any" ON public.user_documents AS PERMISSIVE FOR DELETE TO authenticated USING (((select current_clerk_user_id()) = user_id) OR (select is_admin()));

DROP POLICY IF EXISTS "Users can read own documents or admin can read all" ON public.user_documents;
CREATE POLICY "Users can read own documents or admin can read all" ON public.user_documents AS PERMISSIVE FOR SELECT TO authenticated USING (((select current_clerk_user_id()) = user_id) OR (select is_admin()));

DROP POLICY IF EXISTS "Users can replace own pending documents or admin any" ON public.user_documents;
CREATE POLICY "Users can replace own pending documents or admin any" ON public.user_documents AS PERMISSIVE FOR UPDATE TO authenticated USING (((select current_clerk_user_id()) = user_id) OR (select is_admin())) WITH CHECK ((((select current_clerk_user_id()) = user_id) AND (status = 'pending'::text)) OR (select is_admin()));

-- ============ users ============
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
CREATE POLICY "Admins can update any user" ON public.users AS PERMISSIVE FOR UPDATE TO authenticated USING (EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = (select current_clerk_user_id())) AND (u.user_type = 'admin'::text)))) WITH CHECK (EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = (select current_clerk_user_id())) AND (u.user_type = 'admin'::text))));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((select current_clerk_user_id()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users AS PERMISSIVE FOR UPDATE TO authenticated USING ((select current_clerk_user_id()) = id) WITH CHECK ((select current_clerk_user_id()) = id AND (user_type IS NOT DISTINCT FROM OLD.user_type OR user_type = ANY (ARRAY['shipper'::text, 'trucker'::text])));
