-- Migration: 20260927_tighten_overly_permissive_rls_policies
-- Purpose: Clear the `rls_policy_always_true` advisor findings, several of
--          which were genuine privilege-escalation holes rather than noise.
-- Applied: live project, 2026-09-27.
--
-- Why this is a security fix, not lint cosmetics
-- ---------------------------------------------
-- 1. Six "Service role full access" policies were created without a role
--    clause, so PostgreSQL bound them to the PUBLIC pseudo-role:
--        roles = {public}, cmd = ALL, USING (true), WITH CHECK (true)
--    A policy named "Service role" that actually applies to PUBLIC grants
--    every role — including anon and every signed-in user — unrestricted
--    ALL access. Combined with the table-level grants, ANY signed-in user
--    could rewrite live pricing: corridor_multipliers, pricing_config,
--    pricing_flags, pricing_surcharge_config, route_return_factor and
--    seasonal_multipliers. On a freight marketplace that is direct revenue
--    manipulation.
--
-- 2. Five "System can ..." policies were granted to `authenticated` with
--    WITH CHECK (true), so any signed-in user could insert arbitrary rows:
--      - credit_scores  -> set your own credit score to 900
--      - notifications  -> create notifications in other users' inboxes
--      - price_history  -> pollute the history that feeds rate analytics
--      - ml_match_log   -> poison the ML matching log
--
-- 3. requests / shipment_requests had a correctly scoped USING clause but
--    WITH CHECK (true). USING decides which rows you may read-modify, while
--    WITH CHECK validates the row *after* the write, so a participant could
--    update their own row and reassign shipper_id / receiver_id to another
--    user — taking over or redirecting someone else's booking.
--
-- 4. team_members "Admins can manage team members" is FOR ALL with
--    WITH CHECK (true). For INSERT only WITH CHECK is evaluated (USING is
--    not), so any signed-in user could insert a team member, which then
--    renders on the public About page via "Team members are public".
--
-- 5. users "Admins can update any user" had WITH CHECK (true), letting an
--    admin-scoped UPDATE land any column value.
--
-- Why this cannot break the application
-- -------------------------------------
-- A repo-wide scan for `.insert(`, `.update(`, `.upsert(` and `.delete(`
-- chains reaching these thirteen tables returns ZERO direct writes — every
-- reference is a SELECT. All mutations go through SECURITY DEFINER functions
-- (insert_trip, insert_shipment, insert_shipment_request,
-- insert_price_history, create_notification, calculate_credit_score,
-- update_trip_coords, update_shipment_coords, upsert_team_member,
-- delete_team_member, upsert_gallery_image, delete_gallery_image,
-- reorder_gallery_images, reorder_team_members) which run as the owner and
-- bypass RLS entirely. Reads are preserved because each table keeps its
-- existing SELECT policy.
--
-- Left alone on purpose: pg_net lives in the public schema
-- (advisor `extension_in_public`). It is Supabase-managed and is depended on
-- by Database Webhooks and pg_cron; relocating it can silently break
-- scheduled jobs. That WARN is accepted.

-- ============================================================
-- 1. "Service role full access" -> actually TO service_role
-- ============================================================
-- service_role bypasses RLS by design, so USING (true) here is correct and
-- is the pattern Supabase documents. Recreating with an explicit role clause
-- removes the PUBLIC grant while leaving service_role (edge functions,
-- service-role clients) fully able to read and write.
DO $$
DECLARE
  t text;
  p text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'corridor_multipliers', 'pricing_config', 'pricing_flags',
    'pricing_surcharge_config', 'route_return_factor', 'seasonal_multipliers'
  ] LOOP
    SELECT policyname INTO p
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = t
      AND cmd = 'ALL'
      AND roles = '{public}';

    IF p IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p, t);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
        p, t
      );
      RAISE NOTICE 'restricted % (%) to service_role', t, p;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 2. "System can ..." -> service_role, not authenticated
-- ============================================================
-- Recreated rather than dropped so service-role callers keep working while
-- signed-in users lose the unrestricted path. With CHECK (true) is retained
-- deliberately: it is meaningless for service_role, which is the point.
DROP POLICY IF EXISTS "System can insert credit scores" ON public.credit_scores;
CREATE POLICY "System can insert credit scores" ON public.credit_scores
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can update credit scores" ON public.credit_scores;
CREATE POLICY "System can update credit scores" ON public.credit_scores
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert ml_match_log" ON public.ml_match_log;
CREATE POLICY "System can insert ml_match_log" ON public.ml_match_log
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert price history" ON public.price_history;
CREATE POLICY "System can insert price history" ON public.price_history
  FOR INSERT TO service_role WITH CHECK (true);

-- ============================================================
-- 3. Requests: keep ownership columns immutable
-- ============================================================
-- WITH CHECK must re-assert the same predicate as USING, otherwise a
-- participant can rewrite shipper_id / receiver_id mid-flight.
-- auth.jwt() is wrapped in (SELECT ...) so it is evaluated once per statement
-- rather than once per row (advisor auth_rls_initplan).
DROP POLICY IF EXISTS "Users can update own requests" ON public.requests;
CREATE POLICY "Users can update own requests" ON public.requests
  FOR UPDATE TO authenticated
  USING (
    (SELECT (auth.jwt() ->> 'sub')) = shipper_id
    OR (SELECT (auth.jwt() ->> 'sub')) = receiver_id
  )
  WITH CHECK (
    (SELECT (auth.jwt() ->> 'sub')) = shipper_id
    OR (SELECT (auth.jwt() ->> 'sub')) = receiver_id
  );

DROP POLICY IF EXISTS "Users can update shipment requests" ON public.shipment_requests;
CREATE POLICY "Users can update shipment requests" ON public.shipment_requests
  FOR UPDATE TO authenticated
  USING (
    (SELECT (auth.jwt() ->> 'sub')) = trucker_id
    OR (SELECT (auth.jwt() ->> 'sub')) = shipper_id
  )
  WITH CHECK (
    (SELECT (auth.jwt() ->> 'sub')) = trucker_id
    OR (SELECT (auth.jwt() ->> 'sub')) = shipper_id
  );

-- ============================================================
-- 4. team_members: gate INSERT on the admin check
-- ============================================================
-- INSERT evaluates only WITH CHECK, so the previous WITH CHECK (true) let any
-- signed-in user add themselves to the public team roster. The separate
-- "Team members are public" SELECT policy is untouched, so the About page
-- still renders.
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
CREATE POLICY "Admins can manage team members" ON public.team_members
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT (auth.jwt() ->> 'sub'))
        AND u.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT (auth.jwt() ->> 'sub'))
        AND u.user_type = 'admin'
    )
  );

-- ============================================================
-- 5. users: admin UPDATE must stay admin-gated after the write
-- ============================================================
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
CREATE POLICY "Admins can update any user" ON public.users
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT (auth.jwt() ->> 'sub'))
        AND u.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT (auth.jwt() ->> 'sub'))
        AND u.user_type = 'admin'
    )
  );
