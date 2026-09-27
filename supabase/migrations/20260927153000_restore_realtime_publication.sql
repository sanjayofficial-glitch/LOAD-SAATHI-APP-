-- ================================================================
-- Restore realtime publication for core marketplace tables
-- Date: 2026-09-27
-- ================================================================
-- WHY
--
-- The app subscribes to ten tables via Supabase Realtime
-- postgres_changes, but supabase_realtime only contained three:
-- admin_audit_log, driver_locations and load_locations. Everything
-- else was silently dead, because Postgres does not error on a
-- subscription to a table that was never added to the publication --
-- it just never delivers an event.
--
-- Dead as a result:
--   messages      -> real-time chat (subscribed in 5 places)
--   notifications -> the notification bell never lights up
--   trips         -> admin monitoring dashboard
--   shipments     -> admin monitoring dashboard
--   requests      -> admin monitoring dashboard
--
-- HOW IT HAPPENED
--
-- final-schema.sql adds these tables with
--   ALTER PUBLICATION supabase_realtime ADD TABLE ...
-- but that script aborts partway through on an invalid trigger
-- definition, so every statement after that point never ran,
-- including these six lines. Later migrations created the tables
-- but nothing ever added them to the publication.
--
-- WHY THE LOOP
--
-- ALTER PUBLICATION ... ADD TABLE is not idempotent. Running it a
-- second time fails with "relation is already member of
-- publication", which is exactly what happens the moment this
-- migration is applied to more than one database. Each table is
-- therefore checked against pg_publication_tables first, so this
-- migration is a safe no-op on any database that already has them.
--
-- This only changes event delivery. It grants no privileges, alters
-- no policies and touches no data.
-- ================================================================

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'trips',
    'shipments',
    'requests',
    'shipment_requests',
    'messages',
    'notifications'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
      RAISE NOTICE 'added % to supabase_realtime', tbl;
    ELSE
      RAISE NOTICE '% already in supabase_realtime, skipped', tbl;
    END IF;
  END LOOP;
END $$;
