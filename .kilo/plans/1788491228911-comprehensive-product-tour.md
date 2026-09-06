# Unified Plan: Product Tour + Performance

## Goal
1. Fix the Driver.js tour loop bug and expand onboarding into a complete guided flow: Dashboard → Post → Hub → Browse → Chat.
2. Reduce shipper dashboard LCP from ~4,866 ms toward the 2,500 ms threshold by fixing icon fragmentation, deferring non-critical scripts, and adding preload hints.
3. Keep the app lag-free during tour transitions by guarding all auto-starts with `tourCompleted` and avoiding new runtime dependencies.

## Part A — Tour Bug Fix & Expansion

### A1. Root Cause
- `TruckerDashboard.tsx:180-184` and `ShipperDashboard.tsx:162-166` call `startDashboardTour()` whenever `loading` becomes false.
- Guard is `if (loading || isTourActive || !userProfile) return;` — missing `!tourCompleted`.
- Closing the tour sets `isTourActive = false` but leaves `tourCompleted = false`, so navigating back re-triggers the effect infinitely.

### A2. One-Time Guard Everywhere
Add `!tourCompleted` to **all** page-level auto-start guards:
- `TruckerDashboard.tsx:181`
- `ShipperDashboard.tsx:163`
- `PostTrip.tsx:46` (handoff guard too)
- `PostShipments.tsx:45` (handoff guard too)
- New tour pages: Hub, Browse, Chat (same pattern)

### A3. Close Skips Completion
Wire driver `onCloseClick` to call `markDone()` at the context level so manually skipping the tour marks onboarding complete immediately.

### A4. Expanded Flow
Sequential chained tour for first-time users:
1. **Dashboard** → last step navigates to Post form
2. **Post Trip / Post Shipment** → last step navigates to Hub
3. **My Trips / My Shipments** (NEW) → last step navigates to Browse
4. **Browse Shipments / Browse Trucks** (NEW) → last step navigates to Chat
5. **Chat / Messages** (NEW) → last step calls `markDone()`

Each page reads `consumeTourNextPath()` on mount. If role matches AND `!tourCompleted`, it starts its section tour. Last step calls `setTourNextPath(nextPath, role)` and navigates via `window.__loadsaathiNav`.

### A5. New Step Builders
In `useProductTour.ts`, add:
- `buildTruckerHubSteps(onNavigateToBrowse)`
- `buildShipperHubSteps(onNavigateToBrowse)`
- `buildTruckerBrowseSteps(onNavigateToChat)`
- `buildShipperBrowseSteps(onNavigateToChat)`
- `buildChatSteps(onDone)`

### A6. Context API
In `ProductTourContext.tsx`:
- Export `startHubTour(role)` and `startBrowseTour(role)`.
- `startDriver` accepts optional `onClose?: () => void` wired into driver config.

### A7. DOM IDs
Add stable IDs to pages missing them:
- `TruckerHub.tsx`: `#trucker-hub-header`, `#trucker-hub-list`, `#trucker-hub-filters`
- `MyShipments.tsx`: `#shipper-hub-header`, `#shipper-hub-list`, `#shipper-hub-filters`
- `BrowseShipments.tsx`: `#trucker-browse-header`, `#trucker-browse-search`, `#trucker-browse-filters`, `#trucker-browse-list`
- `BrowseTrips.tsx`: `#shipper-browse-header`, `#shipper-browse-search`, `#shipper-browse-filters`, `#shipper-browse-list`
- `ChatList.tsx`: `#chat-list-header`, `#chat-list-conversations`, `#chat-list-compose`

### A8. Dropdown Behavior
- `tourCompleted === false`: full chained flow from dashboard
- `tourCompleted === true`: dashboard tour only, no auto-advance

---

## Part B — Performance Improvements

### B1. Icon Fragmentation Fix
**Problem:** 80+ individual icon JS modules (`heart-*.js`, `shield-check-*.js`, etc.) are being split into separate chunks, causing 100+ requests and deep dependency tree.

**Fix:** Add a `vendor-icons` manual chunk in `vite.config.ts`:
```ts
vendor-icons: ["lucide-react"]
```
This bundles all lucide-react icons into a single shared chunk, cutting ~70 icon-related requests.

### B2. Critical Preload Hints
In `index.html`, add `modulepreload` for the two largest initial chunks identified in the audit:
```html
<link rel="modulepreload" href="/assets/index-BalSG6b3.js">
<link rel="modulepreload" href="/assets/App-DRQiwwQ4.js">
```
Use the actual build output filenames after `pnpm run build`. These hints let the browser fetch critical JS in parallel with HTML/CSS, reducing render delay.

### B3. Defer Non-Critical Third-Party Scripts
Move analytics/tracking scripts to load after `window.load` or on first user interaction:
- PostHog (`posthog-js`)
- Google Analytics
- Any other non-essential trackers

Implementation: wrap their initialization in a deferred loader, e.g.:
```ts
window.addEventListener('load', () => {
  // init analytics here
});
```
This removes 380+ ms of main-thread contention during the critical path.

### B4. Lazy Load Heavy Below-the-Fold Components
Ensure non-critical dashboard widgets are code-split and lazy-loaded:
- Credit score charts
- Earnings charts
- Admin/monitoring panels

Use `React.lazy()` + `Suspense` for any widget not needed for initial render. This reduces the initial JS bundle size.

### B5. Driver.js Tour Performance Guard
- Tour step builders are pure functions — zero runtime cost until invoked.
- `!tourCompleted` guard prevents tour effects from running after completion.
- No new npm packages added.

---

## Implementation Order

1. **Tour bug fix first** (A2, A3) — stops the loop immediately.
2. **Tour expansion** (A4–A8) — adds new sections and step builders.
3. **Performance: icon chunk** (B1) — single vite.config.ts change, biggest LCP win.
4. **Performance: preload + defer** (B2, B3) — index.html + analytics loader.
5. **Performance: lazy load audit** (B4) — quick scan for non-critical heavy components.

---

## Validation
1. `pnpm run build` passes
2. `pnpm run lint` passes (0 new errors)
3. `pnpm run typecheck` passes (0 new errors)
4. Tour smoke test:
   - New user → dashboard tour auto-starts
   - Close tour anywhere → `tour-done` set → no restart on navigation
   - Dropdown replay → full chained flow when not done, dashboard-only when done
5. Performance smoke test:
   - Run Lighthouse on `/shipper/dashboard`
   - Target: LCP < 2,500 ms, Requests < 60
   - Verify icon chunk consolidation in Network tab
