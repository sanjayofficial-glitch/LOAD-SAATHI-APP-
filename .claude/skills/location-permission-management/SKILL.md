---
name: location-permission-management
description: >-
  Geolocation permission flow with Permissions API, sessionStorage caching,
  and graceful fallbacks. Use when building location-aware apps with permission
  handling. Triggers: geolocation permission, location permission react, gps permission flow.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# Location Permission Management

Complete geolocation permission flow with Permissions API, sessionStorage caching, and graceful fallbacks for iOS/older browsers.

## Key Files

- `src/hooks/useLocationPermission.ts` — Hook returning permission state and request method
- `src/components/LocationPermissionBanner.tsx` — Dismissible banner with enable button
- `src/contexts/LocationContext.tsx` — Location state management

## Pattern

### Hook States
```ts
const { permissionState, isSupported, requestPermission, refreshPermission } = useLocationPermission();
```
States:
- `prompt` — user hasn't decided yet
- `granted` — permission granted
- `denied` — permission denied (OS-level decision)
- `unavailable` — geolocation not supported or Permissions API unavailable

### Permissions API Integration
```ts
navigator.permissions.query({ name: 'geolocation' })
  .then(status => {
    permissionStatusRef.current = status;
    setPermissionState(status.state);
    status.addEventListener('change', handleChange);
  });
```
Falls back to `prompt` if Permissions API unavailable (iOS Safari pre-16, older WebViews, non-HTTPS).

### Request Permission
```ts
const granted = await requestPermission();
```
Single `getCurrentPosition` call with categorized errors:
- `PERMISSION_DENIED` → `denied` state (cached as final)
- `POSITION_UNAVAILABLE` → `prompt` state (allows retry)
- `TIMEOUT` → `prompt` state (allows retry)
- `unknown` → `prompt` state (allows retry)

### Caching
- SessionStorage key: `loadsaathi-location-permission-cache`
- Caches last known permission state
- Used to restore state after page refresh

## Best Practices

- Show banner only when permission is `prompt` or `denied` (not `granted` or `unavailable`)
- Exclude admin users from permission prompts
- Provide settings tooltip for denied users
- Detach change listeners on unmount to prevent memory leaks
- Use `enableHighAccuracy: false` for general location, `true` for trucker tracking
