-- Give admins full read access to shipments.
--
-- Context: `trips` already has a permissive `TO authenticated USING (true)`
-- SELECT policy, so the admin Command Center and /admin/trips see every trip.
-- `shipments` only had `status = 'pending' OR shipper_id = current_clerk_user_id()`,
-- which silently hides matched/cancelled loads — and any pending load whose
-- shipper is not the admin — from admin surfaces that filter by status.
--
-- This keeps the existing shipper behaviour intact and adds an admin bypass,
-- mirroring the `(select is_admin())` pattern already used on trips-like tables
-- (load_locations, user_documents, leads). Scoped to SELECT only: no write
-- access is granted or widened here.

DROP POLICY IF EXISTS "Anyone can view shipments" ON public.shipments;
CREATE POLICY "Anyone can view shipments" ON public.shipments AS PERMISSIVE FOR SELECT TO authenticated USING ((status = 'pending'::text) OR ((select current_clerk_user_id()) = shipper_id) OR (select is_admin()));
