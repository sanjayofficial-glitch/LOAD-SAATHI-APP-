---
name: trip-map-markers
description: >-
  Map markers with fallback geocoding for trips. Use when showing trips on maps
  with live GPS positions, stored coordinates, or geocoded fallbacks.
  Triggers: map markers, fallback geocoding, trip markers, live vs static markers.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# Trip Map Markers with Fallback Geocoding

Hook that merges live GPS positions with stored coordinates and on-demand geocoding for trips missing lat/lng.

## Key Files

- `src/hooks/useTripMapMarkers.ts` — Main hook for building trip map markers
- `src/utils/geocode.ts` — `geocodeCity()` for fallback resolution

## Pattern

### Hook
```tsx
const trucks = useTripMapMarkers(trips, driverLocations, enabled);
```
Returns `TruckLocation[]` with 3-tier resolution per trip:

1. **Live GPS** — if driver is broadcasting, use live position (marker moves in realtime)
2. **Stored coords** — use `origin_lat`/`origin_lng` from trip record
3. **Geocoded fallback** — geocode `origin_city` using Nominatim (cached per session)

### Deduplication
- Dedup by `trucker_id` — only one marker per trucker even if multiple trips
- Live positions take precedence over posted trips
- Static fallback markers set `is_live: false`

### Geocoding Strategy
- Only geocode trips with missing coordinates
- Track attempted cities in `attemptedCitiesRef` to avoid retries
- Cache resolved coordinates in state
- Run geocoding in parallel via `Promise.all`

## Best Practices

- Show "posted trip, no live GPS" label for static markers
- Prefer live positions over stored/geocoded ones
- Cache geocode results per session to minimize API calls
- Show stale timestamp for static markers
