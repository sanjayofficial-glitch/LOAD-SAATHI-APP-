# LoadSaathi — Live Tracking: Current-State Audit

Audit method: read-only queries against the live Supabase project via MCP + code grep. No production changes made.

## Schema / tables
- `driver_locations`: one row per driver (`UNIQUE(driver_id)`), holds lat/lng/heading/speed/accuracy/updated_at/trip_id/*org cities/vehicle/capacity/is_sharing/last_seen_at. FKs to `users(id)` and `trips(id)`.
- `load_locations`: shipper load demand rows (origin/dest coords), `status DEFAULT active`.
- `trips` (13 rows): `origin_lat/lng`, `dest_lat/lng`, status enum includes `active/in_transit/delivered/completed/cancelled`.
- `requests` / `shipment_requests`: participant linkage for shipper↔trucker.

## Live RLS (verified, broader than repo migrations)
- `driver_locations`: policy `Anyone can read driver locations` SELECT `USING (true)` → any authenticated user can see all truck GPS.
- `driver_locations` insert/update: owner only (`jwt sub = driver_id`).
- `load_locations`: `Anyone can read load_locations` SELECT `USING (true)`.
- `trips`: auth SELECT `USING (true)` + anon only active.
- `requests`/`shipment_requests`: correctly participant-scoped today.
- Roles: 1 admin, 30 shippers, 21 truckers.

## Live data counts (2026-10-16)
- `driver_locations`: 16 rows; 2 have `trip_id` set; 16 have `is_sharing=true`; 0 histories stored.
- `trips`: 6 active, 1 in_transit.
- `requests`: 7 total, 4 accepted.
- `shipment_requests`: 4 total, all accepted.
- Linked GPS rows:
  - `user_3GS...` trip `2c965...` (status active) → **0** accepted requests, **0** accepted shipment_requests → under participant RLS nobody but driver/admin can see it.
  - `user_3GJ...` trip `808b0...` (status active) → **1** accepted request on that trip, 4 accepted shipment_requests → tracking still visible to the assigned shipper.

## Code behaviour (actual, not docs)
- `AutoGpsTracker.tsx`: tracks trucker **+ shipper** every 30s, upsert on `driver_id`; merges trip context; does **not** overwrite `trips.origin_lat/lng` (doc claim false — actually safer). Gates on `locationPermission === 'granted'`. Writes even when `activeTripRef` is null (leaks parked positions).
- `useLiveDriverLocations.ts`: fetches last 5 min, subscribes to all `driver_locations` rows (RLS-controlled). Cleanup on unmount.
- `useLiveLoadLocations.ts`: `select('*')` on active loads; subscribes to all.
- TripDetail/ShipmentDetail: write-free reads, realtime subscribe on `driver_id=eq.{trucker}`.

## Known risks for a participant-only RLS change
1. Broadcast UIs (Browse Trips map, LiveTruckMap) lose parked/non-assigned truck markers.
2. A truck with no accepted request/shipment_request disappears from shipper tracking.
3. Realtime events are also subject to RLS — a hidden row will stop delivering.
4. Table locks during the DDL are short but in-flight 30s upserts can fail; drivers retry next cycle.
5. 14 of 16 GPS rows have null trip linkage (intended to be parkerd, not tracked).
6. Gear tokens: `VITE_*` missing breaks prerender (AUDIT TEST-13). Zero test files.

## What this plan must NOT touch
- Trip origin/destination planned coordinates — must stay fixed.
- Existing booking/matching logic.
- Service-role key exposure (must remain server-only).
- Completed/cancelled trip access beyond last-known position shown only to participants.
