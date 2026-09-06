# Location Permission Fix — Implementation Plan

## Goal

Fix the GPS/location permission issue: users with location enabled still don't get prompted, denied permissions are silently ignored, and there's no UI feedback or retry mechanism.

## Root Cause

| File | Problem |
|---|---|
| `AutoGpsTracker.tsx:84` | Calls `watchPosition()` directly — this API does **not** trigger the browser permission dialog in most browsers. Only `getCurrentPosition()` with appropriate options triggers the prompt. |
| `AutoGpsTracker.tsx:132-134` | Error handler "silently ignores permission denied or timeout" — no UI feedback to user. |
| `AutoGpsTracker.tsx:167` | Renders `null` — completely invisible to users. No way to know GPS is off. |
| `GpsTracker.tsx:39` | Tracks `permissionState` locally, but it's a standalone component only used on `TruckerTripDetail` when trip is active/in_transit. No shared state across the app. |
| `NearbyLoadsMap.tsx:44-64` | Best error handling (banner + retry), but scoped to the map page only. |
| `Layout.tsx:360` | Renders `<AutoGpsTracker />` with no accompanying permission UI. |

**Browser behavior note:** `navigator.permissions.query({ name: 'geolocation' })` returns `prompt` state initially, but calling `watchPosition`/`getCurrentPosition` is what actually triggers the dialog. `watchPosition` alone often does not prompt; `getCurrentPosition` is required to surface the permission dialog.

## Design Decisions

1. **Shared context, not local state** — `GpsTracker.tsx` has working permission logic, but it's isolated. We'll extract a `useLocationPermission` hook + `LocationContext` so `AutoGpsTracker`, `GpsTracker`, and `NearbyLoadsMap` all share one source of truth.
2. **`getCurrentPosition` to trigger prompt** — The hook's `requestPermission()` will call `getCurrentPosition` once (then discard the result) to surface the browser dialog.
3. **`AutoGpsTracker` gates on `granted`** — Only calls `watchPosition` when permission is `granted`. Reacts to permission changes (e.g., user grants mid-session → tracking starts automatically).
4. **Banner only for non-admin users** — Same condition as `AutoGpsTracker`: `userProfile?.user_type !== 'admin'`.
5. **SessionStorage dismissal** — Banner dismissal persists for the session (resets on new tab/reload), same pattern as other UX state.
6. **No toast notifications** — Follows the rule that GPS errors are logged, not shown as toasts (CONTEXT.md:6.6).

## Affected Components

```
App.tsx
  └─ ThemeProvider
      └─ AuthProvider              ← add LocationContext here (after AuthProvider, inside it)
          ├─ Layout.tsx            ← render banner alongside AutoGpsTracker
          │   ├─ AutoGpsTracker.tsx ← gate on permission state
          │   └─ [NEW] LocationPermissionBanner.tsx
          ├─ GpsTracker.tsx          ← use shared context instead of local state
          └─ NearbyLoadsMap.tsx     ← optional: reuse shared hook for consistency
```

## Step-by-Step Plan

### Step 1: Create `useLocationPermission` hook

**New file:** `supabase/src/hooks/useLocationPermission.ts`

A reusable hook that:
- Checks `navigator.geolocation` availability
- Queries `navigator.permissions.query({ name: 'geolocation' })` for current state
- Returns `{ permissionState, isSupported, requestPermission, refreshPermission }`
- `requestPermission()` calls `getCurrentPosition` once to trigger the browser prompt (the only reliable way to surface the dialog)
- Listens for `permissionchange` events to stay reactive
- Handles browser errors gracefully (e.g., `query()` throws in some browsers when permission state is `unavailable`)

**Return type:**
```ts
{
  permissionState: 'prompt' | 'granted' | 'denied' | 'unavailable';
  isSupported: boolean;
  requestPermission: () => Promise<boolean>;  // triggers browser dialog, returns true if granted
  refreshPermission: () => void;             // re-query permission state
}
```

### Step 2: Create `LocationContext` for app-level shared state

**New file:** `supabase/src/contexts/LocationContext.tsx`

Wraps `useLocationPermission` and provides it at the app level:
- `LocationContext.Provider` wraps children inside `AuthProvider` (after `AuthProvider` opens, before `AppRoutes`)
- Exposes `{ locationPermission, requestLocationPermission, isLocationSupported, gpsTrackingState }`
- `gpsTrackingState` is an `atom`-like value set by `AutoGpsTracker` (e.g., `'idle' | 'active' | 'error' | 'no-trip'`) so the banner can show relevant status
- Includes a `useLocation()` convenience hook with context-undefined guard (same pattern as `useAuth()`)

**File changes:**
- `supabase/src/App.tsx`: Wrap `<AuthProvider>` children with `<LocationProvider>`
- `supabase/src/contexts/AuthContext.tsx`: No changes (stays as-is)

### Step 3: Create `LocationPermissionBanner` component

**New file:** `supabase/src/components/LocationPermissionBanner.tsx`

A sticky top banner (same pattern as `OfflineBanner`) that appears when:
- `permissionState === 'prompt'` → "Enable location to share your position on the live map" + [Enable Location] + [Maybe Later]
- `permissionState === 'denied'` → "Location access is off. Enable it in browser settings to use live tracking." + [Open Settings] + [Dismiss]
- `permissionState === 'granted'` but GPS has an error → subtle status indicator (optional)

**Features:**
- Dismissible via `sessionStorage` key `loadsaathi-location-banner-dismissed` (resets on new session/new tab)
- "Enable Location" calls `requestLocationPermission()` from `LocationContext`
- "Open Settings" shows a tooltip with platform-specific instructions (Chrome/Firefox/Mobile)
- Styled consistent with `OfflineBanner` (yellow/orange gradient for warning, dark mode compatible)
- Only renders for non-admin users (checked via `useAuth().userProfile`)

### Step 4: Update `AutoGpsTracker.tsx`

**Modify:** `supabase/src/components/AutoGpsTracker.tsx`

Current flow: `useEffect` → checks user type → calls `watchPosition` unconditionally → silently ignores errors.

**New flow:**
1. Import and use `useLocation()` from `LocationContext`
2. Read `locationPermission` state from context
3. **Gate `watchPosition` on `permissionState === 'granted'`** — don't start if `prompt` or `denied`
4. **React to permission changes** — `useEffect` with `permissionState` dependency: when user grants permission mid-session, start tracking; when denied, stop
5. **Set GPS tracking state** in context — `setGpsTrackingState('active')` when tracking, `'no-location'` when permission denied
6. Keep existing error handling for `watchPosition` errors (network GPS failures, etc.) but surface them through context state
7. Keep the 30s throttle, trip context refresh, and `driver_locations` upsert logic exactly as-is

**Key change at line 82-84:**
```ts
// OLD:
if (!navigator.geolocation) return;
watchIdRef.current = navigator.geolocation.watchPosition(...)

// NEW:
if (!navigator.geolocation) return;
if (permissionState !== 'granted') return;  // ← gate on permission
watchIdRef.current = navigator.geolocation.watchPosition(...)
```

**Key change at line 132-134:**
```ts
// OLD:
// Silently ignore permission denied or timeout
logger.warn('AutoGpsTracker geolocation error', ...)

// NEW:
if (err.code === err.PERMISSION_DENIED) {
  setGpsTrackingState('no-location');  // banner shows "denied" message
  logger.warn('AutoGpsTracker permission denied', ...)
} else {
  setGpsTrackingState('error');
  logger.warn('AutoGpsTracker geolocation error', ...)
}
```

### Step 5: Update `Layout.tsx`

**Modify:** `supabase/src/components/Layout.tsx`

**Changes:**
1. Import `LocationPermissionBanner`
2. Replace `{userProfile?.user_type !== 'admin' && <AutoGpsTracker />}` with both components:
```tsx
{userProfile?.user_type !== 'admin' && (
  <>
    <LocationPermissionBanner />
    <AutoGpsTracker />
  </>
)}
```
3. Banner goes **above** the `<nav>` (z-index `z-[60]` like `OfflineBanner`, or `z-[55]` below nav but above content).

### Step 6: Update `GpsTracker.tsx` (optional but recommended)

**Modify:** `supabase/src/components/GpsTracker.tsx`

Replace the local permission tracking (lines 39, 130-136) with the shared context:
```tsx
// OLD:
const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
// ...navigator.permissions.query() inline

// NEW:
const { locationPermission, requestLocationPermission } = useLocation();
const permissionState = locationPermission === 'unavailable' ? null : locationPermission;
```

Update the "Start Tracking" button (line 237-243):
```tsx
// OLD:
onClick={startTracking}

// NEW:
onClick={() => {
  if (permissionState === 'prompt') {
    requestLocationPermission().then((granted) => {
      if (granted) startTracking();
    });
  } else {
    startTracking();
  }
}}
```

### Step 7 (optional): Update `NearbyLoadsMap.tsx`

**Modify:** `supabase/src/components/NearbyLoadsMap.tsx`

Replace the inline `navigator.geolocation.getCurrentPosition` call (line 49) with the shared `useLocationPermission` hook for consistency. The existing error banner pattern (lines 169-183) is good — just wire it to the shared permission state so denied permissions show the right message.

## File Change Summary

| File | Action | Lines Affected |
|---|---|---|
| `supabase/src/hooks/useLocationPermission.ts` | **CREATE** | — |
| `supabase/src/contexts/LocationContext.tsx` | **CREATE** | — |
| `supabase/src/components/LocationPermissionBanner.tsx` | **CREATE** | — |
| `supabase/src/components/AutoGpsTracker.tsx` | **MODIFY** | 1, 19-40 (add permission check), 82-85 (gate), 132-135 (error handling) |
| `supabase/src/components/Layout.tsx` | **MODIFY** | 46 (import), 360-361 (render banner) |
| `supabase/src/contexts/AuthContext.tsx` | **MODIFY** | Add `LocationProvider` wrapper inside `AuthProvider` render |
| `supabase/src/App.tsx` | **MODIFY** | Add `LocationProvider` import + wrapper |
| `supabase/src/components/GpsTracker.tsx` | **MODIFY** | 5, 39, 130-136, 237-243 |
| `supabase/src/components/NearbyLoadsMap.tsx` | **MODIFY (optional)** | 43-65 (use shared hook) |

## Edge Cases & Risks

| Scenario | Handling |
|---|---|
| **Browser doesn't support `navigator.permissions`** | Hook falls back to trying `getCurrentPosition` directly; `permissionState` stays `null` and banner doesn't show |
| **User denies permission, then changes browser settings** | `permissionchange` event fires → `AutoGpsTracker` reactivates automatically |
| **User opens app in Android WebView (Capacitor)** | `navigator.permissions.query` may return `unavailable`; `getCurrentPosition` still works and can trigger WebView-level permission prompt |
| **Permission already granted on first load** | `permissionState` is `'granted'` → banner doesn't show → `AutoGpsTracker` starts tracking immediately |
| **Tab in background** | `watchPosition` still runs but writes are throttled (30s). Banner doesn't show for background tabs since it's a DOM element. Acceptable. |
| **SSR / no `window` object** | All permission checks guarded with `typeof window !== 'undefined'` |
| **User dismisses banner mid-session** | `sessionStorage` stores dismissal; banner won't reappear until new session (new tab or browser restart) |
| **Admin user** | None of the new components render (same as current behavior for `AutoGpsTracker`) |
| **Shipper user (not just trucker)** | `AutoGpsTracker` currently tracks both trucker+shipper (line 40). Banner shows for both. This is intentional — shippers also share location for reverse-matching. |

## Validation Checklist

- [ ] First-time user (trucker/shipper) sees permission banner on login
- [ ] "Enable Location" triggers browser permission dialog (via `getCurrentPosition`)
- [ ] After granting, banner disappears and `AutoGpsTracker` starts tracking
- [ ] After denying, banner shows "denied" state with settings instructions
- [ ] GPS auto-starts when user grants permission mid-session (via `permissionchange`)
- [ ] Banner dismissal persists during session (sessionStorage)
- [ ] Banner does not reappear on page navigation within same session
- [ ] Admin users never see the banner
- [ ] `AutoGpsTracker` doesn't call `watchPosition` when permission is denied/prompt
- [ ] `AutoGpsTracker` error handler properly categorizes permission_denied vs timeout vs unavailable
- [ ] `GpsTracker` on trip detail page uses shared context
- [ ] Works on Android WebView (Capacitor)
- [ ] Works on desktop Chrome/Firefox/Safari
- [ ] TypeScript compiles with no errors (`pnpm run typecheck`)
- [ ] Linter passes (`pnpm run lint`)
- [ ] Build succeeds (`pnpm run build`)

## Out of Scope

- Nochanges to `driver_locations` Supabase schema or RLS policies
- No changes to OSRM or geocoding utilities
- No changes to the `NearbyLoadsMap` "Try again" button behavior (unless optional Step 7 is implemented)
- No new PostHog events (existing logger calls suffice)
