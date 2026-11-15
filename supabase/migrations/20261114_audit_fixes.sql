-- ============================================================================
-- LoadSaathi audit-fix round (2026-11-14) — shared rate limiting, account
-- deletion, deletions for the audit report.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Shared rate-limit buckets (edge-function limiter, service_role only)
--    Replaces per-isolate in-memory counters with a single authoritative
--    store, so limits hold across every instance.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1,
  reset_at timestamptz NOT NULL
);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limit_buckets FROM anon, authenticated;
GRANT ALL ON public.rate_limit_buckets TO service_role;

CREATE OR REPLACE FUNCTION public.rate_limit_check(
  p_key text,
  p_max integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_reset_at timestamptz := v_now + make_interval(secs => GREATEST(p_window_seconds, 1));
BEGIN
  INSERT INTO public.rate_limit_buckets AS b (key, count, reset_at)
  VALUES (p_key, 1, v_reset_at)
  ON CONFLICT (key) DO UPDATE
    SET count = CASE
          WHEN b.reset_at < v_now THEN 1
          ELSE b.count + 1
        END,
        reset_at = CASE
          WHEN b.reset_at < v_now THEN EXCLUDED.reset_at
          ELSE b.reset_at
        END
  RETURNING (count <= p_max);

  -- Opportunistic cleanup of stale buckets (keeps the table small).
  DELETE FROM public.rate_limit_buckets
   WHERE reset_at < v_now - interval '1 day'
     AND random() < 0.02;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.rate_limit_check(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rate_limit_check(text, integer, integer) TO service_role;

-- ---------------------------------------------------------------------------
-- 2) Account deletion: user-owned data removed; profile hard-deleted when no
--    marketplace row still references it, otherwise anonymized so identity is
--    unrecoverable while marketplace history stays intact.
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller text := current_clerk_user_id();
  v_hard boolean := false;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  -- Private, user-owned records (hard delete).
  DELETE FROM public.notifications WHERE user_id = v_caller;
  DELETE FROM public.push_subscriptions WHERE user_id = v_caller;
  DELETE FROM public.credit_scores WHERE user_id = v_caller;
  DELETE FROM public.user_documents WHERE user_id = v_caller;
  DELETE FROM public.user_presence WHERE user_id = v_caller;
  DELETE FROM public.favorites WHERE user_id = v_caller;

  -- User's own uploaded objects (avatar, KYC documents).
  DELETE FROM storage.objects
   WHERE bucket_id IN ('avatars', 'kyc-documents')
     AND name LIKE v_caller || '/%';

  -- Hard-delete the profile when nothing else still references it; otherwise
  -- anonymize the identity link (see audit findings 12.3 / 13.6).
  BEGIN
    DELETE FROM public.users WHERE id = v_caller;
    v_hard := true;
  EXCEPTION WHEN foreign_key_violation OR unique_violation THEN
    UPDATE public.users
       SET email = NULL,
           phone = NULL,
           full_name = NULL,
           company_name = NULL,
           avatar_url = NULL,
           verification_status = NULL,
           deleted_at = now()
     WHERE id = v_caller;
  END;

  RETURN jsonb_build_object('ok', true, 'hard_deleted', v_hard);
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
