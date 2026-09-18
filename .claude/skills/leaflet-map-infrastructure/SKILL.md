---
name: leaflet-map-infrastructure
description: >-
  Leaflet + React map components for logistics. Use when building maps with
  react-leaflet, showing routes, live markers, or tile layer switching.
  Triggers: leaflet react, logistics map, live map, route visualization, map controls.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# Leaflet Map Infrastructure for Logistics

Reusable map component stack: tile layers, zoom controls, error boundaries, marker clustering, and dark-mode-aware tiles.

## Key Files

- `src/components/LiveMap.tsx` — Multi-truck live map with fit-bounds
- `src/components/RouteMap.tsx` — Point-to-point route map with geocoding
- `src/components/maps/ZoomControls.tsx` — Custom zoom buttons
- `src/components/maps/TileLayerSwitcher.tsx` — Toggle between tile providers
- `src/components/maps/MapSizeHandler.tsx` — Fix Leaflet sizing on mount
- `src/components/maps/MapErrorBoundary.tsx` — Map-specific error boundary
- `src/components/maps/useMapUserInteraction.ts` — Track user pan/zoom

## Pattern

### LiveMap
```tsx
<LiveMap trucks={truckLocations} height="min(500px, 55dvh)" />
```
- Dark-mode-aware tile layer (standard vs dark)
- FitBounds: multi-truck maps fit to bounds; single-truck maps follow until user interacts
- Marker popups with driver name, route, update time
- TileLayerSwitcher for manual tile override

### RouteMap
```tsx
<RouteMap
  originCity="Mumbai"
  destinationCity="Delhi"
  originLat={19.076} originLng={72.877}
  destLat={28.704} destLng={77.102}
  distanceKm={1400} durationMin={1200}
/>
```
- Geocodes cities if lat/lng not provided
- Fetches OSRM route for GeoJSON geometry
- Shows origin/destination markers with custom icons
- Falls back to dashed Polyline if no geometry

### Map Sizing
- `MapSizeHandler` ensures Leaflet recalculates size on mount
- Use `min(200px, 30vh)` as minimum height
- `height` prop controls max height

## Best Practices

- Wrap all maps in `MapErrorBoundary` with appropriate `minHeight`
- Use Skeleton loading during initial data fetch
- Disable scrollWheelZoom on scroll-heavy pages or make it conditional
- Use `zoomControl={false}` + custom ZoomControls for consistent UX
- Fix Leaflet default marker icon in Vite builds with CDN URLs
