-- Migration: security (users.user_type escalation guard) + trip-specific location reads
-- Date: 2026-10-17
-- Depends on: 20261015190952_harden_live_location_participant_rls

BEGIN;

-- 1) Prevent non-admin self-escalation of user_type on users table.
CREATE OR REPLACE FUNCTION public.prevent_user_type_change_if_not_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF NEW.user_type IS DISTINCT FROM OLD.user_type THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.jwt()->>'sub'
        AND u.user_type = 'admin'
    ) THEN
      RAISE EXCEPTION 'Only administrators may change user_type' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_user_type_change_if_not_admin ON public.users;
CREATE TRIGGER trg_prevent_user_type_change_if_not_admin
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_type_change_if_not_admin();

-- 2) Re-define driver_locations read policy with EXACT active trip requirement.
DROP POLICY IF EXISTS "Driver, participant or admin can read driver location" ON public.driver_locations;

CREATE POLICY "Driver, participant or admin can read driver location"
  ON public.driver_locations
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt()->>'sub' = driver_id
    OR public.is_admin()
    OR (
      driver_locations.trip_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.requests r
        JOIN public.trips t ON t.id = r.trip_id
        WHERE r.trip_id = driver_locations.trip_id
          AND r.shipper_id = auth.jwt()->>'sub'
          AND r.receiver_id = driver_locations.driver_id
          AND r.status = 'accepted'
          AND t.trucker_id = driver_locations.driver_id
          AND t.status IN ('active','in_transit')
      )
    )
    OR (
      driver_locations.is_sharing = TRUE
      AND driver_locations.trip_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.shipment_requests sr
        JOIN public.shipments s ON s.id = sr.shipment_id
        JOIN public.trips t ON t.id = driver_locations.trip_id
        WHERE sr.trucker_id = driver_locations.driver_id
          AND sr.shipper_id = auth.jwt()->>'sub'
          AND sr.status = 'accepted'
          AND s.status IN ('matched','in_transit')
          AND t.trucker_id = driver_locations.driver_id
          AND t.status IN ('active','in_transit')
      )
    )
  );

COMMIT;
