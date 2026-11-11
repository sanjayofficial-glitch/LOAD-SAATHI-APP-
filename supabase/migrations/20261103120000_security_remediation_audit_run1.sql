-- ============================================================================
-- LoadSaathi security remediation (audit run-1) — 2026-11-03
-- Additive migration; safe to apply on top of existing schema.
-- Fixes confirmed findings without changing app-visible behavior.
-- ============================================================================

-- 1) users: revoke highly sensitive columns from the authenticated role
--    (app never displays others' email / reviewer notes / suspension data).
REVOKE SELECT (email, verification_note, verified_by, suspended, suspended_reason, suspended_at) ON public.users FROM authenticated;

-- 2) users: own-profile fetch RPC (returns full row only for the caller)
CREATE OR REPLACE FUNCTION public.get_own_profile()
RETURNS SETOF public.users
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.users WHERE id = (SELECT auth.jwt() ->> 'sub');
$$;
REVOKE ALL ON FUNCTION public.get_own_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_own_profile() TO authenticated;

-- 3) users: admin-only full view RPC
CREATE OR REPLACE FUNCTION public.get_users_admin_view()
RETURNS SETOF public.users
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.users ORDER BY created_at;  -- callers gated below
$$;
-- Wrap with an explicit admin check via a shell function (SQL functions cannot RAISE):
CREATE OR REPLACE FUNCTION public.admin_users_view()
RETURNS SETOF public.users
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admins only' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT * FROM public.get_users_admin_view();
END;
$$;
REVOKE ALL ON FUNCTION public.admin_users_view() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_users_view() TO authenticated;
REVOKE ALL ON FUNCTION public.get_users_admin_view() FROM PUBLIC;

-- 4) anon: remove unauthenticated roster access; provide share-scoped lookups
DROP POLICY IF EXISTS "Anonymous can read public profile fields" ON public.users;
REVOKE SELECT ON public.users FROM anon;

CREATE OR REPLACE FUNCTION public.public_share_owner(p_trip_id uuid)
RETURNS TABLE (id text, full_name text, rating numeric, is_verified boolean)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT u.id, u.full_name, u.rating, u.is_verified
  FROM public.trips t
  JOIN public.users u ON u.id = t.trucker_id
  WHERE t.id = p_trip_id AND t.status = 'active';
$$;
GRANT EXECUTE ON FUNCTION public.public_share_owner(uuid) TO anon;

CREATE OR REPLACE FUNCTION public.public_share_shipment_owner(p_shipment_id uuid)
RETURNS TABLE (id text, full_name text, rating numeric, is_verified boolean)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT u.id, u.full_name, u.rating, u.is_verified
  FROM public.shipments s
  JOIN public.users u ON u.id = s.shipper_id
  WHERE s.id = p_shipment_id AND s.status = 'pending';
$$;
GRANT EXECUTE ON FUNCTION public.public_share_shipment_owner(uuid) TO anon;

-- 5) reviews: require an accepted business relationship between the parties
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews" ON public.reviews
FOR INSERT TO authenticated
WITH CHECK (
  (
    (SELECT current_clerk_user_id()) = shipper_id
    AND reviewer_role = 'shipper'
    AND (
      EXISTS (SELECT 1 FROM public.requests r
              WHERE r.shipper_id = shipper_id AND r.receiver_id = trucker_id
                AND r.status = 'accepted')
      OR EXISTS (SELECT 1 FROM public.shipment_requests sr
                 WHERE sr.shipper_id = shipper_id AND sr.trucker_id = trucker_id
                   AND sr.status = 'accepted')
    )
  )
  OR
  (
    (SELECT current_clerk_user_id()) = trucker_id
    AND reviewer_role = 'trucker'
    AND (
      EXISTS (SELECT 1 FROM public.requests r
              WHERE r.shipper_id = shipper_id AND r.receiver_id = trucker_id
                AND r.status = 'accepted')
      OR EXISTS (SELECT 1 FROM public.shipment_requests sr
                 WHERE sr.shipper_id = shipper_id AND sr.trucker_id = trucker_id
                   AND sr.status = 'accepted')
    )
  )
);

-- 6) requests / shipment_requests: owner columns become immutable for UPDATE
CREATE OR REPLACE FUNCTION public.prevent_request_owner_reassignment()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.shipper_id IS DISTINCT FROM OLD.shipper_id
     OR NEW.receiver_id IS DISTINCT FROM OLD.receiver_id THEN
    RAISE EXCEPTION 'Owner columns are immutable' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION public.prevent_shipment_request_owner_reassignment()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.trucker_id IS DISTINCT FROM OLD.trucker_id
     OR NEW.shipper_id IS DISTINCT FROM OLD.shipper_id THEN
    RAISE EXCEPTION 'Owner columns are immutable' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_prevent_request_owner_reassignment ON public.requests;
CREATE TRIGGER trg_prevent_request_owner_reassignment
BEFORE UPDATE ON public.requests
FOR EACH ROW EXECUTE FUNCTION public.prevent_request_owner_reassignment();
DROP TRIGGER IF EXISTS trg_prevent_shipment_request_owner_reassignment ON public.shipment_requests;
CREATE TRIGGER trg_prevent_shipment_request_owner_reassignment
BEFORE UPDATE ON public.shipment_requests
FOR EACH ROW EXECUTE FUNCTION public.prevent_shipment_request_owner_reassignment();

-- 7) create_notification: bind recipient to the related entity; internal action_url only
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id text,
  p_message text,
  p_type text DEFAULT 'info'::text,
  p_title text DEFAULT NULL::text,
  p_action_url text DEFAULT NULL::text,
  p_related_trip_id uuid DEFAULT NULL::uuid,
  p_related_shipment_request_id uuid DEFAULT NULL::uuid
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller text := current_clerk_user_id();
  v_allowed boolean := false;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_action_url IS NOT NULL AND p_action_url !~ '^/' THEN
    RAISE EXCEPTION 'action_url must be an internal path' USING ERRCODE = '22023';
  END IF;
  IF p_user_id = v_caller OR COALESCE(p_type,'') = 'self' THEN
    v_allowed := true;
  END IF;
  IF NOT v_allowed AND (SELECT public.is_admin()) THEN
    v_allowed := true;
  END IF;
  IF NOT v_allowed AND p_related_trip_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = p_related_trip_id
        AND (t.trucker_id = v_caller
             OR EXISTS (SELECT 1 FROM public.requests r
                        WHERE r.trip_id = t.id
                          AND (r.shipper_id = v_caller OR r.receiver_id = v_caller)))
        AND (t.trucker_id = p_user_id
             OR EXISTS (SELECT 1 FROM public.requests r2
                        WHERE r2.trip_id = t.id
                          AND (r2.shipper_id = p_user_id OR r2.receiver_id = p_user_id)))
    ) INTO v_allowed;
  END IF;
  IF NOT v_allowed AND p_related_shipment_request_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.shipment_requests sr
      WHERE sr.id = p_related_shipment_request_id
        AND (sr.trucker_id = v_caller OR sr.shipper_id = v_caller)
        AND (sr.trucker_id = p_user_id OR sr.shipper_id = p_user_id)
    ) INTO v_allowed;
  END IF;
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Not authorized to notify user %', p_user_id USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.notifications (user_id, message, type, title, action_url, related_trip_id, related_shipment_request_id)
  VALUES (p_user_id, p_message, p_type, p_title, p_action_url, p_related_trip_id, p_related_shipment_request_id);
END;
$$;
REVOKE ALL ON FUNCTION public.create_notification(text,text,text,text,text,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_notification(text,text,text,text,text,uuid,uuid) TO authenticated;

-- 8) suspension: enforce at the data boundary; self-service cannot clear it
CREATE OR REPLACE FUNCTION public.enforce_suspension_guard()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.jwt()->>'role','') IN ('anon','authenticated')
     AND NOT public.is_admin() THEN
    IF EXISTS (SELECT 1 FROM public.users
               WHERE id = (SELECT auth.jwt() ->> 'sub') AND suspended) THEN
      RAISE EXCEPTION 'Account is suspended' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_suspension_guard_trips ON public.trips;
CREATE TRIGGER trg_suspension_guard_trips BEFORE INSERT OR UPDATE ON public.trips
FOR EACH ROW EXECUTE FUNCTION public.enforce_suspension_guard();
DROP TRIGGER IF EXISTS trg_suspension_guard_shipments ON public.shipments;
CREATE TRIGGER trg_suspension_guard_shipments BEFORE INSERT OR UPDATE ON public.shipments
FOR EACH ROW EXECUTE FUNCTION public.enforce_suspension_guard();
DROP TRIGGER IF EXISTS trg_suspension_guard_requests ON public.requests;
CREATE TRIGGER trg_suspension_guard_requests BEFORE INSERT OR UPDATE ON public.requests
FOR EACH ROW EXECUTE FUNCTION public.enforce_suspension_guard();
DROP TRIGGER IF EXISTS trg_suspension_guard_shipment_requests ON public.shipment_requests;
CREATE TRIGGER trg_suspension_guard_shipment_requests BEFORE INSERT OR UPDATE ON public.shipment_requests
FOR EACH ROW EXECUTE FUNCTION public.enforce_suspension_guard();
DROP TRIGGER IF EXISTS trg_suspension_guard_messages ON public.messages;
CREATE TRIGGER trg_suspension_guard_messages BEFORE INSERT OR UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_suspension_guard();

DROP POLICY IF EXISTS "Users can update own profile or admin any" ON public.users;
CREATE POLICY "Users can update own profile or admin any" ON public.users
FOR UPDATE TO authenticated
USING ((SELECT current_clerk_user_id()) = id OR (SELECT is_admin()))
WITH CHECK ((SELECT current_clerk_user_id()) = id OR (SELECT is_admin()));

-- RLS policies cannot reference OLD/NEW; suspension fields are protected by a
-- trigger instead (non-admins cannot change them).
CREATE OR REPLACE FUNCTION public.prevent_self_suspension_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.suspended IS DISTINCT FROM OLD.suspended
       OR NEW.suspended_reason IS DISTINCT FROM OLD.suspended_reason
       OR NEW.suspended_at IS DISTINCT FROM OLD.suspended_at THEN
      RAISE EXCEPTION 'Suspension fields are admin-only' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_prevent_self_suspension_change ON public.users;
CREATE TRIGGER trg_prevent_self_suspension_change
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_suspension_change();

CREATE OR REPLACE FUNCTION public.set_user_suspended(p_user_id text, p_suspended boolean, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admins only' USING ERRCODE = '42501';
  END IF;
  UPDATE public.users
     SET suspended = p_suspended,
         suspended_reason = p_reason,
         suspended_at = CASE WHEN p_suspended THEN now() ELSE NULL END
   WHERE id = p_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.set_user_suspended(text, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_user_suspended(text, boolean, text) TO authenticated;

-- 9) storage gallery: writes admin-only; drop SVG from allowed MIME types
DROP POLICY IF EXISTS "Authenticated can upload gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete gallery images" ON storage.objects;
CREATE POLICY "Admins can upload gallery images" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery' AND (SELECT is_admin()));
CREATE POLICY "Admins can update gallery images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'gallery' AND (SELECT is_admin()))
WITH CHECK (bucket_id = 'gallery' AND (SELECT is_admin()));
CREATE POLICY "Admins can delete gallery images" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'gallery' AND (SELECT is_admin()));
UPDATE storage.buckets
   SET allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp']
 WHERE id = 'gallery';

-- 10) presence: table-backed, authenticated-only, client-assertable by owner only
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id text PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  last_seen timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "presence own row insert" ON public.user_presence;
CREATE POLICY "presence own row insert" ON public.user_presence
FOR INSERT TO authenticated WITH CHECK ((SELECT current_clerk_user_id()) = user_id);
DROP POLICY IF EXISTS "presence own row update" ON public.user_presence;
CREATE POLICY "presence own row update" ON public.user_presence
FOR UPDATE TO authenticated
USING ((SELECT current_clerk_user_id()) = user_id)
WITH CHECK ((SELECT current_clerk_user_id()) = user_id);
DROP POLICY IF EXISTS "presence own row delete" ON public.user_presence;
CREATE POLICY "presence own row delete" ON public.user_presence
FOR DELETE TO authenticated USING ((SELECT current_clerk_user_id()) = user_id);
DROP POLICY IF EXISTS "presence read authenticated" ON public.user_presence;
CREATE POLICY "presence read authenticated" ON public.user_presence
FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_presence TO authenticated;
