---
name: realtime-gps-tracking
description: >-
  Realtime GPS tracking for fleet with Supabase. Use when building live location
  tracking, driver tracking, or fleet monitoring. Triggers: gps tracking, fleet tracking,
  realtime location, driver locations, watchposition.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# Realtime GPS Tracking for Fleet

Invisible component that auto-tracks GPS for logged-in truckers and shippers, writing positions to Supabase for live map display.

## Key Files

- `src/components/AutoGpsTracker.tsx` — Invisible component with watchPosition + throttled writes
- `src/components/GpsTracker.tsx` — Manual GPS tracking component
- `src/hooks/useLiveDriverLocations.ts` — Fetch initial + subscribe to driver_locations
- `src/hooks/useLiveLoadLocations.ts` — Subscribe to load_locations for shipper-posted loads

## Pattern

### AutoGpsTracker (Invisible)
```tsx
// Place in Layout to ensure all authenticated truckers/shippers share location
<AutoGpsTracker />
```
- Uses `navigator.geolocation.watchPosition` with 30-second throttle
- Writes to `driver_locations` table with Clerk-authenticated Supabase client
- Includes trip context: trip_id, origin_city, destination_city, vehicle_type, available_capacity_tonnes
- Refreshes trip context every 60s via interval
- Uses `upsert` with `onConflict: 'driver_id'`
- High accuracy for truckers, standard for shippers
- 60-second timeout for slow GPS fixes

### Live Location Hooks
```tsx
const { driverLocations, isLoading, refetch } = useLiveDriverLocations();
```
1. Fetch initial positions (last 5 min) via Clerk-authenticated query
2. Authorize realtime socket with Clerk JWT
3. Subscribe to `postgres_changes` on `driver_locations` (INSERT/UPDATE/DELETE)
4. Deduplicate by driver_id, keep latest
5. Auto-unsubscribe on unmount

### Key Details
- `driver_locations` table has RLS `TO authenticated`
- Must call `authorizeRealtime(getSupabaseToken)` before subscribing
- Use anonymous client for realtime, authenticated client for initial fetch
- Deduplicate initial fetch by driver_id, keep most recent `last_seen_at`

## Best Practices

- Throttle writes to 30s to manage free-tier write volume
- Refresh trip context so newly started trips appear on command center
- Use `enableHighAccuracy: true` only for trucker tracking
- Handle PERMISSION_DENIED gracefully
- Clean up watchPosition and intervals on unmount
