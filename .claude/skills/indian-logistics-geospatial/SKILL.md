---
name: indian-logistics-geospatial
description: >-
  OSRM routing + Nominatim geocoding + carbon emissions for Indian logistics.
  Use when building routing, geocoding, or emissions calculations for India.
  Triggers: OSRM routing, geocode India, logistics routing, route optimization,
  carbon emissions fleet.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# Indian Logistics Geospatial Toolkit

Specialized geospatial utilities for Indian trucking logistics: OSRM routing, Nominatim geocoding, route optimization, and carbon emissions.

## Key Files

- `src/utils/osrm.ts` — OSRM public API client with LRU cache and route optimization
- `src/utils/geocode.ts` — Nominatim client with rate limiting and caching
- `src/utils/emissions.ts` — Carbon calculation with Indian vehicle classification
- `src/utils/geo.ts` — Haversine distance and formatting utilities

## Pattern

### OSRM Routing
```ts
const route = await getRoute(originLng, originLat, destLng, destLat);
// Returns: { distance_km, duration_min, geometry? }
```
- LRU cache: 10-minute TTL, 500 entry max, batch eviction
- Cache key: rounded to 4 decimal places (~11m precision)
- Uses public OSRM API: `router.project-osrm.org`
- Returns GeoJSON geometry for route visualization

### Route Optimization
```ts
const result = await optimizeRoute(waypoints);
// Returns: { waypoints, segments, totalDistanceKm, totalDurationMin, optimized }
```
- Nearest-neighbor heuristic for multi-waypoint routes
- First waypoint is fixed start; rest are reordered
- Each segment routed via `getRoute()` for accurate road distances

### Geocoding
```ts
const coords = await geocodeCity('Mumbai', 'India');
// Returns: { lat, lon } | null
```
- 24-hour cache for successful geocodes
- Nominatim rate limit: 1 request per second (1100ms throttle)
- Defaults to India country context
- Does NOT cache null results (allows retries for misspellings)

### Emissions Calculation
```ts
const result = calculateEmissions({ distanceKm: 500, vehicleType: '22ft', loadTonnes: 12 });
// Returns: { distanceKm, factorKgPerKm, totalKg, tonnesCO2e, intensityKgPerTonneKm, vehicleClass }
```
- Indian vehicle classification via regex:
  - Heavy: Tata Signa/Prima/Ultra, LPT, tipper, tractor, trailer
  - Medium: Eicher, 407, Furio, Loadking
  - Light: ACE, Intra, Jeeto, Bolero, pickup
- BharatBenz special case: 1015/1215/1217/1415/1617 are medium, rest heavy
- Factors: light=0.32, medium=0.68, heavy=0.92 kg CO2e/km

## Best Practices

- Always geocode before OSRM to ensure city names resolve
- Use LRU cache to minimize API calls and respect rate limits
- Round coordinates to 4 decimals for cache stability
- Show "Map unavailable" fallback when geocoding fails
