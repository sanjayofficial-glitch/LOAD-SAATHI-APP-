# Verification Checklist — Live Tracking & Privacy

Run **after** a dev-branch/production change. Treat any ❌ as NO-GO for the next phase.

## Smoke — signed-in shipper
- [ ] Open Browse Trips → all public trips still load; map either shows assigned markers (if any) or empty with no error.
- [ ] Open ShipmentDetail for a shipment with an active trip → truck marker appears, last-updated visible, trip status correct.
- [ ] Stay on page during driver movement → marker advances ≥ once every ~30s, no spam UX errors.
- [ ] Pull the network offline for 2 min → a stale badge appears; reconnect → updates resume; no duplicate subs.
- [ ] Chat/notify still works on the same page.
- [ ] Complete or cancel the trip → sharing stops, marker freezes with stale label, no further writes.

## Privacy — signed-in shipper (negative)
- [ ] Second admin account → `is_admin()` = true → can list all locations (by design).
- [ ] Non-participant shipper → zero rows in `driver_locations`; no realtime events for it.
- [ ] Anonymous/no auth → 0 rows returned (no anon read rows).
- [ ] Shipper with an accepted request on another trip cannot view any *other* truck’s row.
- [ ] Parked (no trip) driver data: only driver + admin reads; shippers without matching booking get 0 rows.

## Driver paths
- [ ] Trucker with permission granted on first load → tracking starts; error handling doesn’t spam.
- [ ] Deny GPS permission → no location write; user gets a clear offline-labelled banner.
- [ ] Trucker with no active trip → no DB write; state shows “not tracking”.
- [ ] Trucker cancels trip mid-transmission → watch clears; no orphan channel.

## Admin surfaces
- [ ] Command Center map still lists in-transit drivers; counts unchanged (unless trip gating changed them).
- [ ] Admin `select * from driver_locations` works; no per-admin UI breakage.

## Data correctness
- [ ] `trips.origin_lat/lng` do **not** change during tracking; they retain the planned values from create/edit.
- [ ] Each active tracking driver has exactly **one** upsrted row (no duplicates).
- [ ] No history table explosion — count `driver_locations` over time stays bounded per driver.

## Post-change integrity (run after migration)
```sql
-- should be participant policy, not USING(true)
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename='driver_locations';
--.driver_locations.in_transit count still sensible
SELECT COUNT(*)::text FROM driver_locations WHERE trip_id IS NOT NULL;
```

## Recovery triggers
- `42501 permission denied` on an assigned driver write/load → **STOP**, apply rollback SQL, confirm with `SELECT policyname, qual FROM pg_policies WHERE tablename='driver_locations' AND cmd='SELECT'`.
- Empty live maps on the client once expected → compare against dev branch; if divergence, halt merge.
- Build or typecheck fails → block any further code push.
- Any unexpected realtime disconnect → inspect `supabase.channel` cleanup logs; redeploy only after local reproduction.

## Acceptance criteria (minimal for merge)
1. Admin + one assigned shipper + assigned trucker all exercise the flow with no 403/500.
2. Non-participant access returns 0 rows.
3. No uncaught console error during tracking.
4. Stale badge appears within ≤ 120 s after silence.
5. Tracking clean-up completes on unmount (verify no channels leak in devtools).
6. `pnpm typecheck && pnpm test` green (build remains separate and noted).
7. No paid service introduced in the PR (git diff + package.json check).

---

Once all boxes are green, proceed to the next blocker in `02-migration-runsheet.md`. If anything is red, revert via `01-rollback-and-backup.md` before diagnosing.
