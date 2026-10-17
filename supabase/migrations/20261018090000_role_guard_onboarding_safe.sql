-- Migration: allow first-time onboarding/shipper-trucker role switching,
-- while blocking ordinary users from gaining admin privileges.
-- Date: 2026-10-18

BEGIN;

CREATE OR REPLACE FUNCTION public.prevent_illegal_user_type_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text := COALESCE(auth.jwt()->>'role', '');
  v_caller_uid text := COALESCE(auth.jwt()->>'sub', auth.uid()::text);
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Normal accounts may only start as non-admin roles.
    IF NEW.user_type = 'admin' AND v_caller_role <> 'service_role' AND
       NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_caller_uid AND user_type = 'admin') THEN
      RAISE EXCEPTION 'Administrative role cannot be granted during account creation' USING ERRCODE = '42501';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.user_type IS DISTINCT FROM OLD.user_type THEN
      -- No ordinary account may set itself to, or pivot out of, admin.
      IF NEW.user_type = 'admin' AND v_caller_role <> 'service_role' AND
         NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_caller_uid AND user_type = 'admin') THEN
        RAISE EXCEPTION 'Administrative role changes require an administrator account' USING ERRCODE = '42501';
      END IF;

      -- Non-admin callers may only hold shipper or trucker roles.
      IF v_caller_role <> 'service_role' AND
         NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_caller_uid AND user_type = 'admin') AND
         NEW.user_type NOT IN ('shipper', 'trucker') THEN
        RAISE EXCEPTION 'User role must be shipper or trucker' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_user_type_change_if_not_admin ON public.users;
DROP TRIGGER IF EXISTS trg_prevent_illegal_user_type_changes ON public.users;

CREATE TRIGGER trg_prevent_illegal_user_type_changes
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_illegal_user_type_changes();

DROP FUNCTION IF EXISTS public.prevent_user_type_change_if_not_admin();

COMMIT;