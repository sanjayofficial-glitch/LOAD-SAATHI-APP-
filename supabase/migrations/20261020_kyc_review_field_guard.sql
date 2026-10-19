-- Migration: 20261020_kyc_review_field_guard
-- Follow-up to 20261019_kyc_verification.
--
-- The row level security policies on public.user_documents already stop a
-- trucker from writing status = 'approved' (both the INSERT and UPDATE
-- policies force status = 'pending' for a non-admin caller). They do not say
-- anything about the reviewer columns, so a trucker could write their own
-- reviewer_note / reviewed_by / reviewed_at onto their own row.
--
-- That is not privilege escalation — status is still pinned to 'pending' and
-- nothing displays the note until a reviewer rejects the document — but the
-- reviewer columns must belong to the reviewer alone, so they are gated here.
--
-- Why a trigger and not a column GRANT: the table-level UPDATE grant given to
-- authenticated makes any column-level REVOKE a silent no-op in Postgres. This
-- mirrors public.enforce_kyc_rules() from the previous migration.
--
-- The check is deliberately one-directional: a caller may CLEAR a stale review
-- (the re-upload path sets reviewer_note/reviewed_by/reviewed_at back to NULL),
-- but may never SET or reword one.
--
-- Idempotent: safe to run repeatedly.

CREATE OR REPLACE FUNCTION public.enforce_document_review_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text := COALESCE(auth.jwt()->>'role', '');
BEGIN
  -- Only police API callers. service_role, edge functions, the SQL editor and
  -- psql are trusted sessions and are left alone.
  IF v_caller_role NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  -- The owner records review outcomes through public.review_kyc().
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.reviewer_note IS NOT NULL
       OR NEW.reviewed_by IS NOT NULL
       OR NEW.reviewed_at IS NOT NULL THEN
      RAISE EXCEPTION 'Review results can only be recorded by an administrator'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE: clearing is allowed, writing or rewording is not.
  IF (NEW.reviewer_note IS NOT NULL AND NEW.reviewer_note IS DISTINCT FROM OLD.reviewer_note)
     OR (NEW.reviewed_by IS NOT NULL AND NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by)
     OR (NEW.reviewed_at IS NOT NULL AND NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at) THEN
    RAISE EXCEPTION 'Review results can only be recorded by an administrator'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_document_review_fields ON public.user_documents;

CREATE TRIGGER trg_enforce_document_review_fields
  BEFORE INSERT OR UPDATE ON public.user_documents
  FOR EACH ROW EXECUTE FUNCTION public.enforce_document_review_fields();

-- Trigger functions fire regardless of EXECUTE, so revoking keeps the RPC
-- surface closed without changing runtime behaviour.
REVOKE EXECUTE ON FUNCTION public.enforce_document_review_fields() FROM PUBLIC, anon, authenticated;
