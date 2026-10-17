# Runsheet — Live Tracking & RLS Upgrade (phased)

All steps below are **read-then-verify**. Nothing in production until Blocker gates pass.

## Blocker 0 — Header safety checks
- [ ] Read `docs/tracking/README.md`.
- [ ] Record PII: no `users` email/phone dumps saved to git.
- [ ] Open a Supabase dev branch scoped to a dummy project.
- [ ] Verify `.env` is not committed in the current diff: `git status --short | grep '\.env$'`.

## Blocker 1 — Fix build (local + CI)
- [ ] Copy `.env.example` → `.env`; fill **non-secret** VITE_ values.
- [ ] Make `src/config/env.ts::validateEnv()` throw at build-start with a clear message.
- [ ] Run: `pnpm typecheck` (should pass) and `pnpm lint`.
- [ ] Only run `pnpm build` once env is present.
- **Risk:** low — local files only. No DB.

## Blocker 2 — Add minimal tests
- [ ] `supabase/src/test/throttle.test.ts` — verify 30s write throttle.
- [ ] `supabase/src/test/dedup.test.ts` — last-5-min dedup reducer.
- [ ] `supabase/src/test/stale.test.ts` — 120s stale badge logic.
- [ ] Add to `pnpm test` in CI.
- **Risk:** low — new tests only.

## Blocker 3 — Apply participant RLS on DEV BRANCH (not prod)
Prerequisite: Blocker 1 passes.

```sql
-- capture first (read-only)
SELECT * FROM pg_policies WHERE tablename='driver_locations';
SELECT * FROM pg_policies WHERE tablename='load_locations';
SELECT * FROM pg_policies WHERE tablename='trips';
```

Then apply the migration on the **branch** project_ref:
- Drop the permissive read policy with its exact quoted name.
- Create participant-scoped read policy:
```sql
CREATE POLICY "Driver, participant or admin can read driver location"
  ON public.driver_locations FOR SELECT TO authenticated
  USING (
    auth.jwt()->>'sub' = driver_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.trip_id = driver_locations.trip_id
        AND r.shipper_id = auth.jwt()->>'sub'
        AND r.receiver_id = driver_locations.driver_id
        AND r.status='accepted'
    )
    OR (
      driver_locations.is_sharing = TRUE
      AND EXISTS (
        SELECT 1
        FROM public.shipment_requests sr
        JOIN public.shipments s ON s.id = sr.shipment_id
        WHERE sr.trucker_id = driver_locations.driver_id
          AND sr.shipper_id = auth.jwt()->>'sub'
          AND sr.status='accepted'
          AND s.status IN ('matched','in_transit')
      )
    )
  );
```
- Also add bounds checks:
```sql
ALTER TABLE public.driver_locations
  ADD CONSTRAINT check_lat_bounds CHECK (lat BETWEEN -90 AND 90),
  ADD CONSTRAINT check_lng_bounds CHECK (lng BETWEEN -180 AND 180);
```
- Create a rollback file from the exact pre-state captured in `01-rollback-and-backup.md`.

## Blocker 4 — Verify on the dev branch (must all pass)
- [ ] Admin token → admin screens read all truckers (requires `users.user_type='admin'`).
- [ ] Logged-in trucker A (with accepted request) → sees only their row.
- [ ] Logged-in shipper matching A → sees row A, **cannot** see trucker B (another active trip) nor any parked truck.
- [ ] Shipped user with no active booking → 0 rows returned.
- [ ] Complete A’s trip → shipper can no longer read Row A via participants (publish last known only).
- [ ] TripDetail/ShipmentDetail live subscription keeps flowing for the participant only.
- [ ] Browse Trips chip still renders an empty map for non-participant (no crash).
- [ ] Admin command map unchanged for super users.
- [ ] RLS upload path: driver upsert succeeds with 30s throttle.

## Blocker 5 — Ship to production (only after 3+4 pass)
Sequenced (manual, never a code merge until verified):
1. Apply the same migration via `apply_migration` in low traffic.
2. Watch logs for `permission denied` errors over 10–15 minutes.
3. Keep the rollback file open. If any red signal → apply rollback immediately.
4. After 1 hour of stable logs + UI checks → proceed to code changes.

## Blocker 6 — Code edits (after Blocker 5)
Only now are `AutoGpsTracker`, `useLiveLoadLocations`, `TripDetail`, and `ShipmentDetail` edits safe:
- AutoGpsTracker: gate on active trip; refresh every 60s; `is_sharing` toggled on stop.
- useLiveLoadLocations: replace `select('*')` with explicit columns.
- Stale badge when `now - lastUpdated > 120s`.
- Throttle; no route recalc per fix.
- Rerun `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## Blocker 7 — Doc fix (separate PR)
Rewrite `CONTEXT.md`/`architecture.md` claim `UPDATE trips SET origin_lat=lat` since it’s not in code. Use `driver_locations` for live GPS.

## Stop / no-go triggers
- Any DB upsert returning `42501` for the assigned driver → abort RLS and rollback.
- New empty maps for authenticated roles after a code edit → abort.
- Build or typecheck failing after edit → stop and report.
- If tests not wired, do not stack code changes on RLS changes.

## Rollback timeline
- Policy-only rollback runs within 1 minute.
- Front-end rollback (Vercel revert) can be issued in parallel.
- Never `db push` from a stale branch without `migration repair`.

## Reminders
- Do not modify production policies in Studio console.
- Do not commit `.env` or dump state with PII in public git.
- Every file edited must be recorded in the change log (`git diff --stat`).
- If you stop at any point, leave prod exactly as it was.
