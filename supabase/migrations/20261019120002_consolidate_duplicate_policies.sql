-- Consolidate duplicate permissive policies (advisor lint: multiple_permissive_policies).
--
-- gallery_images / team_members: the FOR ALL admin policy overlapped the public
--   SELECT policy for authenticated readers. Split the admin policy into
--   INSERT/UPDATE/DELETE so SELECT is served by exactly one policy.
-- users: "own profile" and "admin any" UPDATE policies merged into a single
--   OR policy - identical effective access, one policy per action.
--
-- Semantics preserved: permissive policies OR together; splitting FOR ALL and
-- OR-merging both keep the same effective access matrix.

-- ============ gallery_images ============
DROP POLICY IF EXISTS "Admins can manage gallery images" ON public.gallery_images;
CREATE POLICY "Admins can insert gallery images" ON public.gallery_images AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can update gallery images" ON public.gallery_images AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can delete gallery images" ON public.gallery_images AS PERMISSIVE FOR DELETE TO authenticated
  USING ((select is_admin()));

-- ============ team_members ============
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
CREATE POLICY "Admins can insert team members" ON public.team_members AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can update team members" ON public.team_members AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can delete team members" ON public.team_members AS PERMISSIVE FOR DELETE TO authenticated
  USING ((select is_admin()));

-- ============ users (UPDATE) ============
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile or admin any" ON public.users AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((select current_clerk_user_id()) = id) OR (select is_admin()))
  WITH CHECK (((select current_clerk_user_id()) = id) OR (select is_admin()));
