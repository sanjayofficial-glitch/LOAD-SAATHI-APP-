-- ============================================================================
-- LoadSaathi Phase 1 · SEC-01 — participant contact RPC (phone unlock)
-- Date: 2026-11-13
--
-- The `phone` column is revoked from direct reads (see the SEC-01 migration).
-- This function is the ONLY way a non-admin can read another user's phone,
-- and it reveals it only when a real business link exists:
--   - the caller is the target themselves, or
--   - the caller is an admin, or
--   - an ACCEPTED request / shipment_requests row links the two users.
--
-- Returns NULL (never raises) when not authorized, so the UI can hide
-- contact buttons without error-handling noise.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_participant_contact(p_target_id text)
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller text := current_clerk_user_id();
  v_phone text;
BEGIN
  IF v_caller IS NULL OR p_target_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Own number or admin can always see it.
  IF v_caller <> p_target_id AND NOT public.is_admin() THEN
    -- Must share an accepted request OR shipment_requests link.
    IF NOT EXISTS (
      SELECT 1 FROM public.requests r
      WHERE ((r.shipper_id = v_caller AND r.receiver_id = p_target_id)
          OR (r.shipper_id = p_target_id AND r.receiver_id = v_caller))
        AND r.status = 'accepted'
    ) AND NOT EXISTS (
      SELECT 1 FROM public.shipment_requests sr
      WHERE ((sr.shipper_id = v_caller AND sr.trucker_id = p_target_id)
          OR (sr.shipper_id = p_target_id AND sr.trucker_id = v_caller))
        AND sr.status = 'accepted'
    ) THEN
      RETURN NULL;
    END IF;
  END IF;

  SELECT phone INTO v_phone FROM public.users WHERE id = p_target_id;
  RETURN v_phone;
END;
$$;

REVOKE ALL ON FUNCTION public.get_participant_contact(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_participant_contact(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_participant_contact(text) FROM service_role;
GRANT EXECUTE ON FUNCTION public.get_participant_contact(text) TO authenticated;
