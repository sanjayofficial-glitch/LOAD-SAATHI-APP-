-- =====================================================================
-- Security Hardening — Standalone Script
-- Paste entire contents into Supabase Dashboard > SQL Editor > Run
-- =====================================================================


-- ─── 1. GALLERY IMAGES: admin-only writes ───────────────────────────

DROP POLICY IF EXISTS "Authenticated can manage gallery images" ON public.gallery_images;

CREATE POLICY "Admins can manage gallery images"
ON public.gallery_images
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.jwt()->>'sub' AND user_type = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.jwt()->>'sub' AND user_type = 'admin'
  )
);


-- ─── 2. TEAM MEMBERS: admin-only writes ─────────────────────────────

DROP POLICY IF EXISTS "Authenticated can manage team members" ON public.team_members;

CREATE POLICY "Admins can manage team members"
ON public.team_members
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.jwt()->>'sub' AND user_type = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.jwt()->>'sub' AND user_type = 'admin'
  )
);


-- ─── 3. USER PROFILES VIEW (excludes email/phone PII) ──────────────

CREATE OR REPLACE VIEW public.user_profiles
WITH (security_barrier = true)
AS
SELECT
  id,
  full_name,
  user_type,
  is_verified,
  rating,
  total_trips,
  company_name,
  created_at
FROM public.users;

GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;


-- ─── 4. REVIEWS: allow truckers to create reviews ──────────────────

DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;

CREATE POLICY "Users can create reviews"
ON public.reviews
FOR INSERT TO authenticated
WITH CHECK (
  (reviewer_role = 'shipper' AND auth.jwt()->>'sub' = shipper_id)
  OR
  (reviewer_role = 'trucker' AND auth.jwt()->>'sub' = trucker_id)
);


-- ─── 5. PUBLIC SHARE PAGES: anonymous SELECT for active trips/shipments

CREATE POLICY "Anonymous can view active trips"
ON public.trips
FOR SELECT TO anon
USING (status = 'active');

CREATE POLICY "Anonymous can view open shipments"
ON public.shipments
FOR SELECT TO anon
USING (status = 'pending');


-- ─── 6. MESSAGES: UPDATE policy for mark-as-read ───────────────────

DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;

CREATE POLICY "Recipients can mark messages as read"
ON public.messages
FOR UPDATE TO authenticated
USING (auth.jwt()->>'sub' = recipient_id)
WITH CHECK (auth.jwt()->>'sub' = recipient_id);


-- ─── 7a. RATING FUNCTION: update_trucker_rating ────────────────────

CREATE OR REPLACE FUNCTION public.update_trucker_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
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
$fn$;


-- ─── 7b. RATING FUNCTION: update_shipper_rating ────────────────────

CREATE OR REPLACE FUNCTION public.update_shipper_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
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
$fn$;


-- ─── 7c. RATING TRIGGERS ───────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_reviews_update_trucker_rating ON public.reviews;
DROP TRIGGER IF EXISTS trg_reviews_update_shipper_rating ON public.reviews;

CREATE TRIGGER trg_reviews_update_trucker_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_trucker_rating();

CREATE TRIGGER trg_reviews_update_shipper_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_shipper_rating();


-- ─── 8. VERIFY: create_notification() SECURITY DEFINER exists ───────

DO $verify$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'create_notification'
      AND p.prosecdef = true
  ) THEN
    RAISE WARNING 'create_notification() SECURITY DEFINER function does not exist';
  ELSE
    RAISE NOTICE 'create_notification() confirmed exists and is SECURITY DEFINER';
  END IF;
END
$verify$;
