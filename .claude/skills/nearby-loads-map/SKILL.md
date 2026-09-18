---
name: nearby-loads-map
description: >-
  Nearby loads discovery with radius filtering. Use when building proximity-based
  load discovery, geolocation filtering, or "nearby" features. Triggers: nearby loads,
  radius filter map, geolocation filter, load discovery.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# Nearby Loads Map with Radius Filtering

"Nearby Loads" feature that geolocates the user, filters loads by radius, sorts by distance, and displays on a map with a list.

## Key Files

- `src/components/NearbyLoadsMap.tsx` — Main component with map + list
- `src/hooks/useLiveLoadLocations.ts` — Realtime load feed
- `src/utils/geo.ts` — `haversineDistanceKm()`, `formatDistanceKm()`

## Pattern

### Component Flow
1. Fetch live loads via `useLiveLoadLocations()`
2. Get user GPS position via `navigator.geolocation.getCurrentPosition`
3. Filter loads by radius (50km, 75km, 100km options)
4. Sort nearest-first using haversine distance
5. Display on LoadSaathiMap + scrollable list

### Radius Filtering
```ts
const nearbyLoads = loads.filter(load => {
  const dist = haversineDistanceKm(userPos, load.origin_lat, load.origin_lng);
  return dist <= radiusKm;
});
```
- Default radius: 100km
- Options: 50km, 75km, 100km
- Badge color: green for ≤50% of radius, orange for further

### UI States
- `locating` — spinner with "Locating your position..."
- `ready` — show filtered + sorted loads
- `error` — show error banner, continue showing all loads as fallback

### List Cards
Each load card shows:
- Origin → destination
- Goods description + weight
- Budget per tonne (green highlight)
- Distance badge with color coding

## Best Practices

- Show all loads when GPS unavailable (graceful degradation)
- Provide "Locate me" button to retry geolocation
- Use `enableHighAccuracy: true`, 12s timeout, 30s maxAge
- Link "View all" to `/trucker/browse-shipments`
- Show empty state with helpful copy when no loads found
