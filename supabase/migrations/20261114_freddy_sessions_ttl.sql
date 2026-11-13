-- Migration: 20261114_freddy_sessions_ttl
-- Purpose: Retention (TTL) for Freddy conversation memory (public.freddy_sessions).
-- Chat transcripts are PII; sessions idle more than 30 days are purged daily.
-- Uses pg_cron (already in use in this project — see 20260927_tighten_overly_permissive_rls_policies.sql).
-- If pg_cron is unavailable in a given environment, the job is skipped so this
-- migration never breaks a fresh or reduced project. Enable it there by
-- running `CREATE EXTENSION IF NOT EXISTS pg_cron;` first, then re-running the DO block.
-- Safety: DELETE is scoped to freddy_sessions only; no other table is touched.
-- Date: 2026-11-14.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'freddy-sessions-ttl',
      '0 3 * * *',
      $sql$
        DELETE FROM public.freddy_sessions
        WHERE updated_at < now() - interval '30 days'
      $sql$
    );
  END IF;
END $$;
