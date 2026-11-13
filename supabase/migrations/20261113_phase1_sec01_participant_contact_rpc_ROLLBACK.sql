-- ============================================================================
-- LoadSaathi Phase 1 · SEC-01 rollback — drop the participant-contact RPC.
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_participant_contact(text);
