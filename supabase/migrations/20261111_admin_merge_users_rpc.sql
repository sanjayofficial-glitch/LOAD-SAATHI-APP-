-- Admin-only merge for legacy duplicate accounts (same email, two Clerk ids).
-- Mirrors the validated manual cleanup: reassigns what can be moved, deletes
-- the duplicate's request records (owner columns are immutable), then removes
-- the duplicate row. Whole operation is atomic — any refusal rolls back.
CREATE OR REPLACE FUNCTION public.admin_merge_users(p_dup_id text, p_keep_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dup_email text;
  v_keep_email text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admins only' USING ERRCODE = '42501';
  END IF;

  IF p_dup_id IS NULL OR p_keep_id IS NULL OR p_dup_id = p_keep_id THEN
    RAISE EXCEPTION 'Two different user ids are required';
  END IF;

  SELECT email INTO v_dup_email FROM public.users WHERE id = p_dup_id;
  SELECT email INTO v_keep_email FROM public.users WHERE id = p_keep_id;

  IF v_dup_email IS NULL OR v_keep_email IS NULL THEN
    RAISE EXCEPTION 'One or both users were not found';
  END IF;

  IF lower(v_dup_email) <> lower(v_keep_email) THEN
    RAISE EXCEPTION 'Users must share the same email address';
  END IF;

  -- Move activity to the kept profile.
  UPDATE public.trips SET trucker_id = p_keep_id WHERE trucker_id = p_dup_id;
  UPDATE public.notifications SET user_id = p_keep_id WHERE user_id = p_dup_id;
  UPDATE public.credit_scores SET user_id = p_keep_id WHERE user_id = p_dup_id;

  -- GPS: move only when the keeper has no live row (unique per driver); otherwise drop the stale ping.
  IF EXISTS (SELECT 1 FROM public.driver_locations WHERE driver_id = p_dup_id)
     AND NOT EXISTS (SELECT 1 FROM public.driver_locations WHERE driver_id = p_keep_id) THEN
    UPDATE public.driver_locations SET driver_id = p_keep_id WHERE driver_id = p_dup_id;
  ELSE
    DELETE FROM public.driver_locations WHERE driver_id = p_dup_id;
  END IF;

  -- Shipments: attempt reassignment; abort cleanly if any rule refuses.
  BEGIN
    UPDATE public.shipments SET shipper_id = p_keep_id WHERE shipper_id = p_dup_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Could not move shipments to the kept profile: %', SQLERRM;
  END;

  -- Request records owned by the duplicate are removed (owner columns are immutable).
  DELETE FROM public.shipment_requests WHERE shipper_id = p_dup_id OR trucker_id = p_dup_id;
  DELETE FROM public.requests WHERE shipper_id = p_dup_id OR receiver_id = p_dup_id;

  DELETE FROM public.favorites WHERE entity_type = 'user' AND entity_id = p_dup_id;

  DELETE FROM public.users WHERE id = p_dup_id;

  RETURN 'merged ' || p_dup_id || ' into ' || p_keep_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_merge_users(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_merge_users(text, text) TO authenticated;
