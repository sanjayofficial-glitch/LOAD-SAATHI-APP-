-- 2026-10-26 — Notification system overhaul.
--
-- Four problems fixed in one place:
--
-- 1. DB-01 (AUDIT_REPORT): mark_all_notifications_read() / mark_notification_read()
--    existed only in FULL_REPAIR.sql, never in a migration, so a fresh
--    `supabase db reset` left NotificationBell calling RPCs that do not exist.
--    Both are redefined here with Clerk-safe identity (current_clerk_user_id())
--    and explicit grants (authenticated only — anon loses EXECUTE).
--
-- 2. SEC-03 (AUDIT_REPORT): policy "Users can create notifications FOR OTHERS"
--    was created WITH CHECK (true) and never dropped, so any authenticated
--    client could insert rows straight into anyone's bell, bypassing
--    create_notification()'s authorization. Dropped; cross-user inserts now
--    only happen through create_notification() (app) or the triggers below
--    (server, same transaction as the state change that justified them).
--
-- 3. Delivery was client-fired: the sender's browser sent the notification
--    AFTER the status write, so a refresh/crash in between lost it — and two
--    call sites were passing requests.id into a column FK'd to
--    shipment_requests.id, which fails the foreign key and silently drops the
--    notification (the accept/decline-to-shipper notifications never landed).
--    Triggers below now create the notification in the same transaction as
--    the state change, for every path (PostgREST, RPC, admin, CLI).
--
-- 4. Nothing reached a user who was not looking at the page. push_subscriptions
--    stores Web Push endpoints; supabase/functions/push-notifier sends them
--    when a Database Webhook fires on notifications INSERT (see docs/notifications.md).

-- ============================================================
-- 1. Read/mark RPCs (DB-01)
-- ============================================================

CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller text := public.current_clerk_user_id();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  UPDATE public.notifications
     SET is_read = true, updated_at = now()
   WHERE id = p_notification_id
     AND user_id = v_caller;
  RETURN jsonb_build_object('success', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller text := public.current_clerk_user_id();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  UPDATE public.notifications
     SET is_read = true, updated_at = now()
   WHERE user_id = v_caller
     AND is_read = false;
  RETURN jsonb_build_object('success', true);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.mark_notification_read(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_all_notifications_read() FROM PUBLIC, anon;

-- ============================================================
-- 2. Close the "insert for anyone" hole (SEC-03)
-- ============================================================

DROP POLICY IF EXISTS "Users can create notifications for others" ON public.notifications;

-- ============================================================
-- 3. Web Push subscriptions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint),
  CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view own push subscriptions" ON public.push_subscriptions
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((select public.current_clerk_user_id()) = user_id);

DROP POLICY IF EXISTS "Users can register own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can register own push subscriptions" ON public.push_subscriptions
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((select public.current_clerk_user_id()) = user_id);

DROP POLICY IF EXISTS "Users can refresh own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can refresh own push subscriptions" ON public.push_subscriptions
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((select public.current_clerk_user_id()) = user_id)
  WITH CHECK ((select public.current_clerk_user_id()) = user_id);

DROP POLICY IF EXISTS "Users can remove own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can remove own push subscriptions" ON public.push_subscriptions
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((select public.current_clerk_user_id()) = user_id);

REVOKE ALL ON public.push_subscriptions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated, service_role;

-- ============================================================
-- 4. Server-side notifications
--
-- Every helper is SECURITY DEFINER (owned by the migration role) so the
-- notification write never depends on the caller's RLS, and every trigger
-- function swallows its own errors: a failed notification must NEVER roll
-- back a booking, an offer or a trip status change.
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_user(
  p_user_id text,
  p_message text,
  p_type text,
  p_title text,
  p_action_url text,
  p_related_trip_id uuid DEFAULT NULL,
  p_related_shipment_request_id uuid DEFAULT NULL
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.notifications
    (user_id, message, type, title, action_url, related_trip_id, related_shipment_request_id)
  VALUES
    (p_user_id, p_message, p_type, p_title, p_action_url, p_related_trip_id, p_related_shipment_request_id);
EXCEPTION WHEN OTHERS THEN
  -- Never let a notification failure escape into the caller's transaction.
  RAISE WARNING 'notify_user(%) failed: %', p_user_id, SQLERRM;
END;
$function$;

-- Only the triggers below may call it. The owner keeps EXECUTE implicitly,
-- so trigger functions (SECURITY DEFINER, same owner) still work.
REVOKE EXECUTE ON FUNCTION public.notify_user(text, text, text, text, text, uuid, uuid)
  FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------
-- 4a. Shipper books a seat on a trucker's trip (INSERT on requests)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_request_created_notify()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_shipper text;
  v_origin text;
  v_dest text;
BEGIN
  SELECT COALESCE(NULLIF(u.full_name, ''), 'A shipper')
    INTO v_shipper
    FROM public.users u WHERE u.id = NEW.shipper_id;

  SELECT t.origin_city, t.destination_city
    INTO v_origin, v_dest
    FROM public.trips t WHERE t.id = NEW.trip_id;

  PERFORM public.notify_user(
    NEW.receiver_id,
    format('📦 New booking! %s wants to ship %st of "%s" on your trip from %s → %s.',
           COALESCE(v_shipper, 'A shipper'),
           NEW.weight_tonnes,
           NEW.goods_description,
           COALESCE(v_origin, ''),
           COALESCE(v_dest, '')),
    'booking',
    'New booking request',
    '/trucker/trips/' || NEW.trip_id,
    NEW.trip_id
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'trg_request_created_notify failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_request_created_notify ON public.requests;
CREATE TRIGGER trg_request_created_notify
  AFTER INSERT ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_request_created_notify();

-- ------------------------------------------------------------
-- 4b. Trucker accepts/declines (UPDATE of status on requests)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_request_decided_notify()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_trucker_id text;
  v_name text;
  v_phone text;
  v_origin text;
  v_dest text;
  v_message text;
  v_title text;
BEGIN
  IF NEW.status NOT IN ('accepted', 'declined') THEN
    RETURN NEW;
  END IF;

  SELECT t.trucker_id, t.origin_city, t.destination_city
    INTO v_trucker_id, v_origin, v_dest
    FROM public.trips t WHERE t.id = NEW.trip_id;

  SELECT COALESCE(NULLIF(u.full_name, ''), 'The trucker'),
         COALESCE(NULLIF(u.phone, ''), 'N/A')
    INTO v_name, v_phone
    FROM public.users u WHERE u.id = v_trucker_id;

  IF NEW.status = 'accepted' THEN
    v_title := 'Booking accepted';
    v_message := format('✅ Request Accepted! %s is ready for your trip from %s → %s. Contact them at %s.',
                        COALESCE(v_name, 'The trucker'),
                        COALESCE(v_origin, ''),
                        COALESCE(v_dest, ''),
                        COALESCE(v_phone, 'N/A'));
  ELSE
    v_title := 'Booking declined';
    v_message := format('❌ %s declined your booking request for %s → %s.',
                        COALESCE(v_name, 'The trucker'),
                        COALESCE(v_origin, ''),
                        COALESCE(v_dest, ''));
  END IF;

  PERFORM public.notify_user(
    NEW.shipper_id,
    v_message,
    'booking_update',
    v_title,
    '/shipper/my-shipments',
    NEW.trip_id
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'trg_request_decided_notify failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_request_decided_notify ON public.requests;
CREATE TRIGGER trg_request_decided_notify
  AFTER UPDATE OF status ON public.requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.trg_request_decided_notify();

-- ------------------------------------------------------------
-- 4c. Trucker offers on a shipment (INSERT on shipment_requests)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_offer_created_notify()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_trucker text;
  v_origin text;
  v_dest text;
  v_weight numeric;
BEGIN
  SELECT COALESCE(NULLIF(u.full_name, ''), 'A trucker')
    INTO v_trucker
    FROM public.users u WHERE u.id = NEW.trucker_id;

  SELECT s.origin_city, s.destination_city, s.weight_tonnes
    INTO v_origin, v_dest, v_weight
    FROM public.shipments s WHERE s.id = NEW.shipment_id;

  PERFORM public.notify_user(
    NEW.shipper_id,
    format('🚛 %s offered ₹%s/t for your %st load from %s → %s.',
           COALESCE(v_trucker, 'A trucker'),
           to_char(NEW.proposed_price_per_tonne, 'FM999,999,990'),
           COALESCE(v_weight::text, ''),
           COALESCE(v_origin, ''),
           COALESCE(v_dest, '')),
    'offer',
    'New offer on your load',
    '/shipper/shipments/' || NEW.shipment_id,
    NULL,
    NEW.id
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'trg_offer_created_notify failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_offer_created_notify ON public.shipment_requests;
CREATE TRIGGER trg_offer_created_notify
  AFTER INSERT ON public.shipment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_offer_created_notify();

-- ------------------------------------------------------------
-- 4d. Shipper accepts/declines an offer (UPDATE of status on shipment_requests)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_offer_decided_notify()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_shipper text;
  v_phone text;
  v_origin text;
  v_dest text;
  v_message text;
  v_title text;
BEGIN
  IF NEW.status NOT IN ('accepted', 'declined') THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(u.full_name, ''), 'The shipper'),
         COALESCE(NULLIF(u.phone, ''), 'N/A')
    INTO v_shipper, v_phone
    FROM public.users u WHERE u.id = NEW.shipper_id;

  SELECT s.origin_city, s.destination_city
    INTO v_origin, v_dest
    FROM public.shipments s WHERE s.id = NEW.shipment_id;

  IF NEW.status = 'accepted' THEN
    v_title := 'Offer accepted';
    v_message := format('✅ Offer Accepted! %s accepted your offer for %s → %s. Contact them at %s.',
                        COALESCE(v_shipper, 'The shipper'),
                        COALESCE(v_origin, ''),
                        COALESCE(v_dest, ''),
                        COALESCE(v_phone, 'N/A'));
  ELSE
    v_title := 'Offer declined';
    v_message := format('❌ Offer Declined. %s declined your offer for the load from %s → %s.',
                        COALESCE(v_shipper, 'The shipper'),
                        COALESCE(v_origin, ''),
                        COALESCE(v_dest, ''));
  END IF;

  PERFORM public.notify_user(
    NEW.trucker_id,
    v_message,
    'offer_update',
    v_title,
    '/trucker/dashboard',
    NULL,
    NEW.id
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'trg_offer_decided_notify failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_offer_decided_notify ON public.shipment_requests;
CREATE TRIGGER trg_offer_decided_notify
  AFTER UPDATE OF status ON public.shipment_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.trg_offer_decided_notify();

-- ------------------------------------------------------------
-- 4e. Trip lifecycle (UPDATE of status on trips)
--
-- start_trip / mark_trip_delivered / complete_trip RPCs all land here, so
-- every accepted shipper is told in the same transaction that moves the trip.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_trip_status_notify()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_trucker_id text;
  v_name text;
  v_origin text;
  v_dest text;
  v_title text;
  v_message text;
  v_recipient text;
BEGIN
  IF NEW.status NOT IN ('in_transit', 'delivered', 'completed') THEN
    RETURN NEW;
  END IF;

  SELECT t.trucker_id, t.origin_city, t.destination_city
    INTO v_trucker_id, v_origin, v_dest
    FROM public.trips t WHERE t.id = NEW.id;

  SELECT COALESCE(NULLIF(u.full_name, ''), 'Your trucker')
    INTO v_name
    FROM public.users u WHERE u.id = v_trucker_id;

  IF NEW.status = 'in_transit' THEN
    v_title := 'Trip started';
    v_message := format('🚛 Trip Started! %s is on the way from %s → %s. Track your shipment live.',
                        COALESCE(v_name, 'Your trucker'), v_origin, v_dest);
  ELSIF NEW.status = 'delivered' THEN
    v_title := 'Package delivered';
    v_message := format('📍 Package Delivered! %s has delivered your goods from %s → %s. Please confirm and rate.',
                        COALESCE(v_name, 'Your trucker'), v_origin, v_dest);
  ELSE
    v_title := 'Trip completed';
    v_message := format('🏁 Trip Completed! %s has completed the trip from %s → %s. Please rate your experience.',
                        COALESCE(v_name, 'Your trucker'), v_origin, v_dest);
  END IF;

  FOR v_recipient IN
    SELECT DISTINCT r.shipper_id
      FROM public.requests r
     WHERE r.trip_id = NEW.id
       AND r.status = 'accepted'
       AND r.shipper_id IS NOT NULL
  LOOP
    PERFORM public.notify_user(
      v_recipient,
      v_message,
      'trip_update',
      v_title,
      '/shipper/my-shipments',
      NEW.id
    );
  END LOOP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'trg_trip_status_notify failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_trip_status_notify ON public.trips;
CREATE TRIGGER trg_trip_status_notify
  AFTER UPDATE OF status ON public.trips
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.trg_trip_status_notify();

-- ------------------------------------------------------------
-- 4f. New review (INSERT on reviews)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_review_created_notify()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_reviewer_id text;
  v_reviewer text;
  v_recipient text;
  v_action_url text;
BEGIN
  IF NEW.reviewer_role = 'shipper' THEN
    v_reviewer_id := NEW.shipper_id;
    v_recipient := NEW.trucker_id;
    v_action_url := '/trucker/dashboard';
  ELSE
    v_reviewer_id := NEW.trucker_id;
    v_recipient := NEW.shipper_id;
    v_action_url := '/shipper/dashboard';
  END IF;

  IF v_recipient IS NULL OR v_recipient = v_reviewer_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(u.full_name, ''), 'Someone')
    INTO v_reviewer
    FROM public.users u WHERE u.id = v_reviewer_id;

  PERFORM public.notify_user(
    v_recipient,
    format('⭐ %s left you a new review! Check your profile to see your updated rating.',
           COALESCE(v_reviewer, 'Someone')),
    'review',
    'New review',
    v_action_url,
    NEW.trip_id
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'trg_review_created_notify failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_review_created_notify ON public.reviews;
CREATE TRIGGER trg_review_created_notify
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_review_created_notify();
