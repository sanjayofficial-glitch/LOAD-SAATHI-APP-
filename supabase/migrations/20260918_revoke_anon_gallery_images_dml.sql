-- Revoke remaining anon DML/DDL on gallery_images
-- Anonymous users no longer have SELECT (reverted in prior migration),
-- so they should not have write access either.

-- 1. Revoke INSERT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE grantee = 'anon' AND table_schema = 'public' AND table_name = 'gallery_images' AND privilege_type = 'INSERT'
  ) THEN
    REVOKE INSERT ON public.gallery_images FROM anon;
    RAISE NOTICE 'Revoked INSERT on gallery_images from anon';
  END IF;
END $$;

-- 2. Revoke UPDATE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE grantee = 'anon' AND table_schema = 'public' AND table_name = 'gallery_images' AND privilege_type = 'UPDATE'
  ) THEN
    REVOKE UPDATE ON public.gallery_images FROM anon;
    RAISE NOTICE 'Revoked UPDATE on gallery_images from anon';
  END IF;
END $$;

-- 3. Revoke DELETE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE grantee = 'anon' AND table_schema = 'public' AND table_name = 'gallery_images' AND privilege_type = 'DELETE'
  ) THEN
    REVOKE DELETE ON public.gallery_images FROM anon;
    RAISE NOTICE 'Revoked DELETE on gallery_images from anon';
  END IF;
END $$;

-- 4. Revoke TRUNCATE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE grantee = 'anon' AND table_schema = 'public' AND table_name = 'gallery_images' AND privilege_type = 'TRUNCATE'
  ) THEN
    REVOKE TRUNCATE ON public.gallery_images FROM anon;
    RAISE NOTICE 'Revoked TRUNCATE on gallery_images from anon';
  END IF;
END $$;

-- 5. Revoke REFERENCES (foreign key grant)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE grantee = 'anon' AND table_schema = 'public' AND table_name = 'gallery_images' AND privilege_type = 'REFERENCES'
  ) THEN
    REVOKE REFERENCES ON public.gallery_images FROM anon;
    RAISE NOTICE 'Revoked REFERENCES on gallery_images from anon';
  END IF;
END $$;

-- 6. Revoke TRIGGER
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE grantee = 'anon' AND table_schema = 'public' AND table_name = 'gallery_images' AND privilege_type = 'TRIGGER'
  ) THEN
    REVOKE TRIGGER ON public.gallery_images FROM anon;
    RAISE NOTICE 'Revoked TRIGGER on gallery_images from anon';
  END IF;
END $$;

-- Verify: anon should have ZERO privileges on gallery_images
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM information_schema.role_table_grants
  WHERE grantee = 'anon' AND table_schema = 'public' AND table_name = 'gallery_images';

  IF v_count = 0 THEN
    RAISE NOTICE '✓ anon has no remaining privileges on gallery_images';
  ELSE
    RAISE WARNING 'anon still has % privilege(s) on gallery_images — manual review needed', v_count;
  END IF;
END $$;
