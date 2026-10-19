-- =============================================================
-- Trucker KYC verification
--   * profile avatars (public bucket)
--   * private KYC document storage + metadata table
--   * admin-reviewable verification workflow
--   * blocks self-verification (trigger, mirrors role_guard_onboarding_safe.sql)
-- Date: 2026-10-19
-- Aadhaar is intentionally NOT collected.
-- Every statement is idempotent so this can be re-run safely.
-- =============================================================

-- -------------------------------------------------------------
-- 1. New user columns
-- -------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS verification_note text,
  ADD COLUMN IF NOT EXISTS kyc_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by text;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_verification_status_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_verification_status_check
  CHECK (verification_status IN ('none', 'pending', 'verified', 'rejected'));

-- -------------------------------------------------------------
-- 2. user_documents — one row per document type per user
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  file_size integer,
  original_size integer,
  valid_until date,
  status text NOT NULL DEFAULT 'pending',
  reviewer_note text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.user_documents
    ADD CONSTRAINT user_documents_doc_type_check CHECK (doc_type IN (
      'driving_licence',
      'driving_licence_back',
      'vehicle_rc',
      'vehicle_insurance',
      'truck_photo',
      'permit',
      'fitness',
      'puc'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.user_documents
    ADD CONSTRAINT user_documents_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS user_documents_user_id_doc_type_key
  ON public.user_documents (user_id, doc_type);
CREATE INDEX IF NOT EXISTS user_documents_user_id_idx ON public.user_documents (user_id);
CREATE INDEX IF NOT EXISTS user_documents_status_idx ON public.user_documents (status);

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own documents or admin can read all" ON public.user_documents;
CREATE POLICY "Users can read own documents or admin can read all" ON public.user_documents
  FOR SELECT TO authenticated
  USING (auth.jwt()->>'sub' = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can add own pending documents" ON public.user_documents;
CREATE POLICY "Users can add own pending documents" ON public.user_documents
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt()->>'sub' = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Users can replace own pending documents or admin any" ON public.user_documents;
CREATE POLICY "Users can replace own pending documents or admin any" ON public.user_documents
  FOR UPDATE TO authenticated
  USING (auth.jwt()->>'sub' = user_id OR public.is_admin())
  WITH CHECK ((auth.jwt()->>'sub' = user_id AND status = 'pending') OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete own documents or admin any" ON public.user_documents;
CREATE POLICY "Users can delete own documents or admin any" ON public.user_documents
  FOR DELETE TO authenticated
  USING (auth.jwt()->>'sub' = user_id OR public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_documents TO authenticated;
GRANT ALL ON public.user_documents TO service_role;
REVOKE ALL ON public.user_documents FROM anon;

-- -------------------------------------------------------------
-- 3. Storage buckets
--    avatars       -> public read (profile pictures)
--    kyc-documents -> PRIVATE, owner + admin only, signed URLs
-- -------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 2097152,
   ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('kyc-documents', 'kyc-documents', false, 5242880,
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- avatars: world-readable, owner-writable
DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;
CREATE POLICY "Avatar images are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND ((storage.foldername(name))[1] = auth.jwt()->>'sub' OR public.is_admin()));

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND ((storage.foldername(name))[1] = auth.jwt()->>'sub' OR public.is_admin()));

-- kyc-documents: never public. Owner plus admins only.
DROP POLICY IF EXISTS "KYC documents readable by owner or admin" ON storage.objects;
CREATE POLICY "KYC documents readable by owner or admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'kyc-documents' AND ((storage.foldername(name))[1] = auth.jwt()->>'sub' OR public.is_admin()));

DROP POLICY IF EXISTS "Users can upload own KYC documents" ON storage.objects;
CREATE POLICY "Users can upload own KYC documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "Users can replace own KYC documents" ON storage.objects;
CREATE POLICY "Users can replace own KYC documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'kyc-documents' AND ((storage.foldername(name))[1] = auth.jwt()->>'sub' OR public.is_admin()));

DROP POLICY IF EXISTS "Users can delete own KYC documents" ON storage.objects;
CREATE POLICY "Users can delete own KYC documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'kyc-documents' AND ((storage.foldername(name))[1] = auth.jwt()->>'sub' OR public.is_admin()));

-- -------------------------------------------------------------
-- 4. Verification guard
--    Non-admins may only move verification_status -> 'pending', and may
--    never touch is_verified / verified_at / verified_by.
--    Required documents are enforced here, so it cannot be bypassed by
--    calling the API directly instead of the submit_kyc() RPC.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_kyc_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text := COALESCE(auth.jwt()->>'role', '');
  v_is_admin boolean;
  v_missing text[];
  v_submitting boolean;
BEGIN
  -- This trigger polices API callers only. Anything that is not the anon or
  -- authenticated PostgREST role is a trusted database session (service_role,
  -- edge functions, SQL editor, psql) and is left alone.
  IF v_caller_role NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  v_is_admin := public.is_admin();

  -- -------- INSERT --------
  IF TG_OP = 'INSERT' THEN
    IF NOT v_is_admin AND (NEW.is_verified IS TRUE OR NEW.verification_status <> 'none') THEN
      RAISE EXCEPTION 'New accounts cannot be created already verified' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  -- -------- UPDATE --------
  v_submitting := (NEW.verification_status = 'pending'
                   AND NEW.verification_status IS DISTINCT FROM OLD.verification_status);

  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  -- A normal user can never set these.
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
     OR NEW.verified_by IS DISTINCT FROM OLD.verified_by THEN
    RAISE EXCEPTION 'Verification can only be granted by an administrator' USING ERRCODE = '42501';
  END IF;

  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    IF NOT v_submitting OR OLD.verification_status NOT IN ('none', 'rejected') THEN
      RAISE EXCEPTION 'Verification status can only be submitted for review' USING ERRCODE = '42501';
    END IF;

    -- Submitting requires the mandatory documents to be on file.
    SELECT array_agg(req.label) INTO v_missing
    FROM (VALUES
      ('driving_licence', 'Driving Licence'),
      ('vehicle_rc', 'Vehicle RC'),
      ('vehicle_insurance', 'Vehicle Insurance'),
      ('truck_photo', 'Truck photo with number plate')
    ) AS req(doc_type, label)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_documents d
      WHERE d.user_id = NEW.id
        AND d.doc_type = req.doc_type
        AND d.status <> 'rejected'
    );

    IF v_missing IS NOT NULL THEN
      RAISE EXCEPTION 'Please upload the required documents first: %',
        array_to_string(v_missing, ', ') USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.verification_note IS DISTINCT FROM OLD.verification_note
        OR NEW.kyc_submitted_at IS DISTINCT FROM OLD.kyc_submitted_at THEN
    RAISE EXCEPTION 'Verification details can only be changed by an administrator' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_kyc_rules ON public.users;
CREATE TRIGGER trg_enforce_kyc_rules
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_kyc_rules();

REVOKE EXECUTE ON FUNCTION public.enforce_kyc_rules() FROM PUBLIC, anon, authenticated;

-- -------------------------------------------------------------
-- 5. RPCs
-- -------------------------------------------------------------

-- Trucker marks their pack as ready for review.
-- Invoker rights: RLS keeps it to their own row and the trigger validates it.
CREATE OR REPLACE FUNCTION public.submit_kyc()
RETURNS public.users
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid text := auth.jwt()->>'sub';
  v_row public.users;
BEGIN
  IF v_uid IS NULL OR v_uid = '' THEN
    RAISE EXCEPTION 'You must be signed in to submit for verification' USING ERRCODE = '42501';
  END IF;

  UPDATE public.users
     SET verification_status = 'pending',
         kyc_submitted_at = now(),
         verification_note = NULL
   WHERE id = v_uid
   RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'User profile not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN v_row;
END;
$$;

-- Admin approves or rejects a submitted pack.
CREATE OR REPLACE FUNCTION public.review_kyc(
  p_user_id text,
  p_decision text,
  p_note text DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin text := auth.jwt()->>'sub';
  v_row public.users;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can review verification requests' USING ERRCODE = '42501';
  END IF;

  IF p_decision NOT IN ('verified', 'rejected') THEN
    RAISE EXCEPTION 'Decision must be either verified or rejected' USING ERRCODE = '22023';
  END IF;

  UPDATE public.users
     SET verification_status = p_decision,
         is_verified = (p_decision = 'verified'),
         verification_note = NULLIF(btrim(COALESCE(p_note, '')), ''),
         verified_at = now(),
         verified_by = v_admin
   WHERE id = p_user_id
   RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.user_documents
     SET status = CASE WHEN p_decision = 'verified' THEN 'approved' ELSE 'rejected' END,
         reviewer_note = NULLIF(btrim(COALESCE(p_note, '')), ''),
         reviewed_by = v_admin,
         reviewed_at = now()
   WHERE user_id = p_user_id
     AND status = 'pending';

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_kyc() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_kyc() TO authenticated;

REVOKE ALL ON FUNCTION public.review_kyc(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_kyc(text, text, text) TO authenticated;

-- -------------------------------------------------------------
-- 6. Admin queue helper: pending count for the command center badge
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pending_kyc_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE WHEN public.is_admin()
    THEN (SELECT count(*)::integer FROM public.users WHERE verification_status = 'pending')
    ELSE 0
  END;
$$;

REVOKE ALL ON FUNCTION public.pending_kyc_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pending_kyc_count() TO authenticated;

-- -------------------------------------------------------------
-- 7. Backfill legacy verification flags into the new workflow
--    Existing is_verified = true users become 'verified' so nothing
--    regresses visually after this migration.
-- -------------------------------------------------------------
UPDATE public.users
   SET verification_status = 'verified',
       verified_at = COALESCE(verified_at, now())
 WHERE is_verified IS TRUE
   AND verification_status = 'none';
