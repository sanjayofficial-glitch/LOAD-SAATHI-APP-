---
name: error-boundary-maps
description: >-
  Error boundaries with map-specific error recovery and retry UI.
  Use when adding error boundaries to React apps, handling map crashes,
  or building fallback UI for Leaflet/map components. Triggers: error boundary react,
  map error handling, react 19 error boundary, leaflet error.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# Error Boundaries + Map Error Recovery

Error boundary pattern with map-specific fallback UI and retry mechanisms for Leaflet components.

## Key Files

- `src/components/ErrorBoundary.tsx` — Generic React error boundary
- `src/components/MapErrorBoundary.tsx` — Map-specific error boundary with retry

## Pattern

### Generic ErrorBoundary
```tsx
<ErrorBoundary fallback={<div>Something went wrong</div>}>
  <App />
</ErrorBoundary>
```
Catches render errors, shows fallback UI, can reset state.

### MapErrorBoundary
```tsx
<MapErrorBoundary minHeight="min(200px, 30vh)">
  <MapContainer>...</MapContainer>
</MapErrorBoundary>
```
Specialized for map components:
- Accepts `minHeight` prop for fallback sizing
- Shows "Map unavailable for these cities" with Retry button
- Retry button calls `window.location.reload()` to re-run geocoding/OSRM
- Used in LiveMap, RouteMap, NearbyLoadsMap

### Usage Pattern
```tsx
<MapErrorBoundary minHeight="min(500px, 55dvh)">
  <div style={{ minHeight: 'min(200px, 30vh)', height }}>
    <MapContainer center={center} zoom={5}>
      {/* map content */}
    </MapContainer>
  </div>
</MapErrorBoundary>
```

## Best Practices

- Wrap all Leaflet maps in MapErrorBoundary
- Use Skeleton loading states during initial map data fetch
- Provide retry mechanism for geocoding/OSRM failures
- Maintain aspect ratio in fallback state with minHeight
- Log errors to monitoring service in catch blocks
