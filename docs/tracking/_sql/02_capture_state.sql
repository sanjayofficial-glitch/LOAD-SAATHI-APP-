-- READ-ONLY safety capture; run BEFORE any tracking/RLS work.
-- Save as a CSV and date-stamp the file:
--   docs/tracking/_sql/_snapshots/2026-10-16_pre-change.csv
-- All reads. Replace nothing.

-- 1) Policies (exact text)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('driver_locations','load_locations','trips','requests','shipment_requests','shipments')
ORDER BY tablename, policyname;

-- 2) Counts + linkage
SELECT
  (SELECT COUNT(*)::text FROM driver_locations) AS driver_rows,
  (SELECT COUNT(*)::text FROM driver_locations WHERE trip_id IS NOT NULL) AS driver_linked,
  (SELECT COUNT(*)::text FROM trips) AS trips,
  (SELECT COUNT(*)::text FROM trips WHERE status='in_transit') AS trips_in_transit,
  (SELECT COUNT(*)::text FROM requests WHERE status='accepted') AS accepted_requests,
  (SELECT COUNT(*)::text FROM shipment_requests WHERE status='accepted') AS accepted_shipment_requests;

-- 3) Linkage details (PII-safe inspection: IDs only)
SELECT dl.id, dl.driver_id, dl.trip_id, t.status AS trip_status, t.trucker_id,
       (SELECT COUNT(*) FROM requests r WHERE r.trip_id=dl.trip_id AND r.status='accepted') AS acc_reqs,
       (SELECT COUNT(*) FROM shipment_requests sr WHERE sr.trucker_id=dl.driver_id AND sr.status='accepted') AS acc_ship_reqs
FROM driver_locations dl
LEFT JOIN trips t ON t.id=dl.trip_id
ORDER BY dl.updated_at DESC NULLS LAST;

-- 4) Admin existence check
SELECT COUNT(*) AS admin_count FROM public.users WHERE user_type='admin';

-- 5) Indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('driver_locations','load_locations','trips')
  AND indexdef ILIKE '%driver_id%' OR indexdef ILIKE '%trip_id%'
ORDER BY tablename, indexname;

-- 6) Migration list (run via CLI) also pointer:
-- supabase migration list
