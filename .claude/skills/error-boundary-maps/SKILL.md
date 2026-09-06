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

# Error Boundaries + Maps

## What This Skill Captures

This skill documents LoadSaathi's error boundary implementation with a map-specific
variant. It covers fallback UI, retry logic, and the integration points between
React error boundaries and Leaflet map components. It is designed to catch Leaflet
context loss, missing tile data, and coordinate geocoding failures without crashing
the entire page.

## Key Files and Paths

- `src/components/ErrorBoundary.tsx` — Generic React error boundary.
- `src/components/MapErrorBoundary.tsx` — Map-specific boundary with retry UI.
- `src/components/LiveMap.tsx` — Live truck map component.
- `src/components/RouteMap.tsx` — Route visualization map.
- `src/components/GpsTracker.tsx` — Real-time GPS tracking component.

## Core Patterns

### Generic ErrorBoundary

`ErrorBoundary` wraps sections of the app. On a render error it:

1. Logs the error via `src/lib/logger.ts`.
2. Renders a fallback UI with a "Retry" button.
3. Calls `resetErrorBoundary()` to unmount the fallback and re-render children.

Props include `fallback` (custom UI) and `onError` (callback for analytics).

### MapErrorBoundary

`MapErrorBoundary` extends the generic pattern for Leaflet maps:

- Requires a `minHeight` prop (LoadSaathi uses `min(200px, 30vh)`).
- Shows "Map unavailable" with a Retry button.
- Retry button calls `window.location.reload()` when geocoding or OSRM data
  is missing and the map cannot render.
- Catches errors from tile loading, marker crashes, and Leaflet context loss.

### Usage in Map Components

Wrap map containers in `MapErrorBoundary`:

```tsx
<MapErrorBoundary minHeight="min(200px, 30vh)">
  <LiveMap trips={trips} />
</MapErrorBoundary>
```

This pattern is used in `LiveMap`, `RouteMap`, and any custom map widget.

### Combined with Skeleton Loading

Map boundaries are paired with skeleton loaders during initial data fetch. The
skeleton covers the loading state; the boundary covers runtime crashes.

### React 19 Compatibility

React 19 changes error boundary semantics slightly around concurrent rendering.
`MapErrorBoundary` uses class components to ensure stable error catching across
React versions. Do not convert it to a function component.

### Common Caught Errors

- Leaflet `context loss` when a tile layer fails to initialize.
- Marker crashes when `latlng` is `null` after a failed geocode.
- `Failed to fetch` on tile images when the network drops.
- `TypeError` from React Leaflet when props are undefined during lazy load.

## Best Practices

- Place `MapErrorBoundary` as close to the Leaflet root as possible to isolate
  map crashes from the rest of the page.
- Always pass a `minHeight` so the fallback does not collapse the layout.
- Log map errors with structured context (route ID, coordinates) for debugging.
- Use the generic `ErrorBoundary` for non-map sections (forms, lists, dashboards).
- Combine boundaries with Suspense for data-fetching errors on the same component.

## Trigger Phrases

- "error boundary react"
- "map error handling"
- "react 19 error boundary"
- "leaflet error"

## Testing Map Boundaries

To test MapErrorBoundary, throw an error inside a Leaflet onError handler or
temporarily pass an invalid tile URL. The fallback should render without affecting
other page content. Verify the Retry button resets the boundary state.

## Common Pitfalls

- Do not place MapErrorBoundary outside the map container div; it must wrap the
  Leaflet root to catch context errors.
- Avoid using window.location.reload() in development hot-reload environments;
  it can mask the underlying issue. In production it is the safest recovery path.
- Do not swallow errors silently; always log them before rendering the fallback.
