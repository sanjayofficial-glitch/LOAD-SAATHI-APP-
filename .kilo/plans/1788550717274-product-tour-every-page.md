# Product Tour — Per-Page Tours with Show-Once Persistence

## Goal
- Each authenticated page gets its own first-time product tour.
- Each tour fires **at most once per user, ever**, even after logout/login.
- Any close path (X button, ESC, click outside, "Done") counts as "seen" and prevents replay.
- The current entry sequence (dashboard tour → auto-navigate → form tour) is preserved as a single one-time chain.
- A minimal "chrome" tour (sidebar / notifications / profile) fires once across the whole app, on the first authenticated page the user ever visits.

## Out of scope
- Public pages (landing, marketing, tools) — no tour.
- Admin pages — no tour (admin gets a doc, not a tour).
- Mobile app (Capacitor) — only the web app; the same code path applies to mobile webview.
- Per-page tour for `EditTrip`, `EditShipment`, `TruckerTripDetail`, `ShipmentDetail`, `TripDetail` — these are reached only via context, not first-time discovery.

## Key files
All under `supabase/src/`:
- `hooks/useProductTour.ts` — registry, persistence, driver config
- `contexts/ProductTourContext.tsx` — driver lifecycle, auto-start
- `pages/auth/OnboardingFlow.tsx` — sets the entry-sequence flag
- `pages/trucker/Dashboard.tsx`, `pages/shipper/Dashboard.tsx` — remove inline auto-start
- `components/Layout.tsx` — universal chrome tour

No new files.

## Decisions (locked)
1. **Entry sequence preserved**: dashboard tour on first visit auto-navigates to post-trip / post-shipment and runs the form tour. Both halves are flagged done together.
2. **Centralized trigger**: a single `useEffect` in `ProductTourProvider` watches `location.pathname` + `userId` + `userType` and decides which tour to fire.
3. **Close semantics**: any close path marks the tour done. No manual restart.
4. **Chrome tour**: 3–4 steps, fires once on the user's first authenticated page visit (any path, not just dashboard).
5. **Per-page scope** (one tour each, shown once): trucker.dashboard, trucker.post-trip, trucker.my-trips, trucker.browse-shipments, trucker.history, shipper.dashboard, shipper.post-shipment, shipper.my-shipments, shipper.browse-trucks, shipper.history, account.profile, account.favorites, account.credit-score, messaging.messages.
6. **Skip on missing elements**: existing `filterPresentSteps` + `skipMissingElement` + `waitForElement: 3000` already handle async rendering. Keep them.

## Data model

### localStorage keys (all namespaced by user)
- `loadsaathi-onboarded-<userId>` — existing, do not touch.
- `loadsaathi-tour-entry-<userId>` — replaces `loadsaathi-tour-start-<userId>`. Set by `OnboardingFlow` on `completeOnboarding()`. Consumed once. Marks BOTH the entry dashboard tour AND the chained form tour as one atomic "entry sequence."
- `loadsaathi-tour-done-<userId>-<tourId>` — per-tour done flag, where `tourId` is a stable string. New scheme.

### Tour registry
```ts
// in hooks/useProductTour.ts
export type TourId =
  | 'entry.trucker' | 'entry.shipper'  // entry-sequence virtual IDs
  | 'chrome.universal'
  | 'trucker.dashboard' | 'trucker.post-trip' | 'trucker.my-trips'
  | 'trucker.browse-shipments' | 'trucker.history'
  | 'shipper.dashboard' | 'shipper.post-shipment' | 'shipper.my-shipments'
  | 'shipper.browse-trucks' | 'shipper.history'
  | 'account.profile' | 'account.favorites' | 'account.credit-score'
  | 'messaging.messages';

export interface TourSpec {
  id: TourId;
  paths: string[];        // route patterns (use useLocation().pathname exact match first, then prefix match)
  roles: UserType[];      // 'trucker' | 'shipper' | 'both'
  buildSteps: () => DriveStep[];
  /** Optional: navigate after this tour's last step. Used for entry-sequence chain. */
  chainTo?: { path: string; tourId: TourId };
}
```

### `entry.trucker` and `entry.shipper` virtual specs
- `entry.trucker`: paths `['/trucker/dashboard']`, roles `['trucker']`, builds dashboard steps with `chainTo: { path: '/trucker/post-trip', tourId: 'trucker.post-trip' }` (and the dashboard's last step's `onNextClick` navigates AND marks the entry flag done).
- `entry.shipper`: same shape for shipper.
- When `entry.trucker` is "done," the flag `loadsaathi-tour-done-<uid>-trucker.post-trip` is ALSO set, so the chained form tour is permanently suppressed. Conversely if the user closes mid-chain, BOTH flags are set.

### Tour activation rules (in provider)
On every render where `userId`, `userType`, and `pathname` are known:

1. If a tour is already active, do nothing.
2. Find the spec for the current `pathname` whose role matches `userType` (exact path first, then prefix).
3. If no spec, do nothing.
4. If `isTourDone(userId, spec.id)`, do nothing.
5. Defer 350ms (so target elements render), then start the tour.
6. `driverConfig` is set with `onDestroyed` AND `onCloseClick` callbacks that call `markTourDone(userId, spec.id)`. If `spec.chainTo` is defined and the user reached the last step (not closed early), the callback instead calls `markTourDone(userId, spec.id)` AND `markTourDone(userId, spec.chainTo.tourId)` AND calls the navigation helper (the same `window.__loadsaathiNav` pattern that already exists). If the user closed early, both are still marked done (per decision 3).

### Chrome tour special case
- A second `useEffect` in the provider runs once per (userId × pathname) when the user is authenticated. It checks `isTourDone(userId, 'chrome.universal')`; if not done, it starts the chrome tour on the FIRST authenticated page the user lands on (any path, not just dashboard). On close, marks the chrome tour done.
- Implementation: run inside the same `useEffect` that handles per-page tours, but with a separate gate. To avoid double-firing (chrome + page tour simultaneously), the chrome tour and the per-page tour are started sequentially: chrome first, per-page after. Each marks done on close.

## Driver config
`driverConfig(userType, opts)` gains:
- `onDestroyed: () => { markTourDone(...); /* chain if needed */ }`
- `onCloseClick: () => { markTourDone(...); /* chain if needed */ }`
- Existing `onHighlighted` / `onDeselected` left intact.

The callbacks need access to `userId`, the current spec, and the navigate helper. Closure approach: build a per-tour config via a factory `buildDriverConfig(spec, userId, navigate)` in `ProductTourProvider.startTour()`.

## Page-by-page tour content
Existing step builders are reused as-is for the four pages that already have them. New step builders (each adds 3–5 steps) for the other pages. All new builders share the same `popover()` helper and the same selector conventions.

### New target IDs to add to JSX
Each page needs stable `id="..."` attributes. Naming follows the existing `#trucker-dashboard-header` style (kebab-case, role-prefixed).

| Page | IDs to add |
|---|---|
| `TruckerHub.tsx` | `id="trucker-hub-header"` on the page H1; `id="trucker-hub-tabs"` on the tabs root; `id="trucker-hub-list"` on the trip list root |
| `BrowseShipments.tsx` | `id="browse-shipments-header"`; `id="browse-shipments-filters"`; `id="browse-shipments-list"` |
| `TruckerHistory.tsx` | `id="trucker-history-header"`; `id="trucker-history-list"` |
| `MyShipments.tsx` | `id="shipper-hub-header"`; `id="shipper-hub-tabs"`; `id="shipper-hub-list"` |
| `BrowseTrips.tsx` | `id="browse-trucks-header"`; `id="browse-trucks-filters"`; `id="browse-trucks-list"` |
| `ShipperHistory.tsx` | `id="shipper-history-header"`; `id="shipper-history-list"` |
| `Profile.tsx` | `id="profile-header"`; `id="profile-form"` |
| `Favorites.tsx` | `id="favorites-header"`; `id="favorites-list"` |
| `CreditScore.tsx` | `id="credit-score-header"`; `id="credit-score-gauge"` |
| `ChatList.tsx` | `id="messages-header"`; `id="messages-list"` |
| `Layout.tsx` | `id="app-sidebar"` on the aside/sidebar wrapper; `id="app-notifications"` on the `NotificationBell` wrapper; `id="app-profile-menu"` on the user dropdown trigger |

If a target ID is conditionally rendered (e.g. only when the user has data), the step is marked `skipMissingElement: true` — existing helper `filterPresentSteps` already handles this.

### New step builders (file `hooks/useProductTour.ts`)
For each page above, one new exported function following the pattern of `buildTruckerDashboardSteps()`. 3–5 steps each, short copy that explains one feature per step. No code, just popover titles + descriptions.

### Chrome tour
`buildUniversalChromeSteps()` — 3 steps:
1. `#app-sidebar` — "The sidebar is your map of LoadSaathi. Tap any item to jump there."
2. `#app-notifications` — "The bell is where new requests, offers and messages show up."
3. `#app-profile-menu` — "Your profile, credit score and sign-out live here."

## Edit list (file-by-file)

### `supabase/src/hooks/useProductTour.ts` (rewrite)
- Add `TourId`, `TourSpec`, `TOUR_REGISTRY` (with all entries).
- Replace `tourDoneKey`, `isTourDone`, `markTourDone`, `resetTour` to be per-tour-id.
- Keep `truckerNextPath`, `shipperNextPath` constants; remove the `setTourNextPath` / `consumeTourNextPath` helpers (replaced by registry `chainTo`).
- Remove `setTourStartFlag` / `consumeTourStartFlag`; replaced by `loadsaathi-tour-entry-<userId>` consumed by provider when path matches entry spec.
- Keep `buildTruckerDashboardSteps`, `buildShipperDashboardSteps`, `buildTruckerFormSteps`, `buildShipperFormSteps` as-is. They are referenced by registry entries.
- Add new `buildXxxSteps()` functions for each new tour.
- Add `buildUniversalChromeSteps()`.
- Refactor `driverConfig(userType, opts)` → `buildDriverConfig(spec, userId, navigate, onChain)` returning a `Config` with `onDestroyed` and `onCloseClick` wired to `markTourDone`. Existing `onHighlighted`/`onDeselected` preserved.
- Keep `filterPresentSteps`, `popover`, and `UserType` export.

### `supabase/src/contexts/ProductTourContext.tsx` (rewrite)
- `import { useLocation, useNavigate } from 'react-router-dom'`.
- `ProductTourProvider`:
  - Read `pathname` from `useLocation()`.
  - Read `navigate` from `useNavigate()`.
  - Hold the `driverRef` and `isTourActive` state as today.
  - Add `pendingTourRef` so a chain navigation can pick up the next tour spec at the destination.
  - Replace the current "auto-start on `consumeTourStartFlag`" `useEffect` (lines 176–189) with a new `useEffect` keyed on `[userId, userType, pathname, isTourActive, authLoading]`:
    1. Bail on `authLoading`, missing user/role, or `isTourActive`.
    2. Pick the first registry entry whose `paths` includes `pathname` (exact match) and whose `roles` includes `userType`.
    3. If none, try prefix match.
    4. If `isTourDone(userId, spec.id)`, bail.
    5. After a 350ms timeout (to allow element render), build the config and call `driver().drive()`.
  - Add a second `useEffect` for the chrome tour: when user is authenticated, `pathname` is non-empty, chrome not done, no per-page tour active, after 600ms timeout start the chrome tour.
  - Remove `startDashboardTour` / `startFormTour` exports; replace with `startTour(spec, onChain?)` internal helper.
  - Keep `useProductTourContext` and `useProductTour` exports with the same shape (`startTour`, `isTourActive`, `tourCompleted`, `resetTour`, `tryConsumeAutoStartFlag`, `markDone`, `setStartFlag`, `consumeFormNextPath` → marked deprecated but still callable from the two dashboards during the deprecation window).
  - `resetTour(userId)` now clears all per-user done flags (iterate keys with prefix `loadsaathi-tour-done-<userId>-`).

### `supabase/src/pages/auth/OnboardingFlow.tsx`
- In `completeOnboarding()`, replace `loadsaathi-tour-start-<user.id>` with `loadsaathi-tour-entry-<user.id>`.
- Leave the `onboardedKey` write as-is.

### `supabase/src/pages/trucker/Dashboard.tsx`
- Remove the inline `useEffect` that calls `startDashboardTour('trucker')` (lines ~180–184).
- Remove `useProductTour` import if no other use.

### `supabase/src/pages/shipper/Dashboard.tsx`
- Same removal as trucker.

### `supabase/src/pages/trucker/PostTrip.tsx`
- Add `id="post-trip-header"`, `id="post-trip-origin"`, `id="post-trip-destination"`, `id="date"`, `id="capacity"`, `id="price"`, `id="vehicleType"`, `id="post-trip-submit"`. (Most likely already present from the existing tour step builders — verify.)

### `supabase/src/pages/shipper/PostShipments.tsx`
- Same set of IDs: `id="post-shipment-header"`, `id="post-shipment-origin"`, `id="post-shipment-destination"`, `id="date"`, `id="weight"`, `id="goods"`, `id="budget"`, `id="post-shipment-submit"`. (Verify.)

### Other pages — add IDs only
For pages listed in the "New target IDs to add" table above, add the IDs at the existing JSX root nodes. No behavioral changes.

### `supabase/src/components/Layout.tsx`
- Wrap the sidebar aside in `id="app-sidebar"`.
- Wrap `NotificationBell` in a `div id="app-notifications"`.
- Wrap the user dropdown trigger in `div id="app-profile-menu"`.

## Risks

1. **`useLocation` in a provider above a `Suspense` boundary**: the router is mounted in `App.tsx` (verify in the build); `useLocation` will be safe because routes are wrapped by `BrowserRouter` (verify). If not, hoist the provider into a place that has access to the router.
2. **Chain race**: when the dashboard tour's `onNextClick` navigates to the form, the form's `pathname` changes from `/trucker/dashboard` to `/trucker/post-trip`. The provider's main `useEffect` re-runs, finds the `trucker.post-trip` spec, sees the flag is already done (entry sequence marked both done together on success), and bails. If the chain is broken because the user closed mid-tour, both flags are also set together on close, so the chained tour does not fire. Tested by the close-event callback running on `onDestroyed`.
3. **Existing dashboard auto-start during transition**: removed. Make sure the two dashboard `useEffect`s are deleted, not commented out.
4. **`filterPresentSteps` for tour steps with `skipMissingElement`**: existing behavior, no change. But for new builders, the implementation agent must mark steps `skipMissingElement: true` if the target may not exist on first paint.
5. **Stale done flags across role changes**: a user is always one role (per `AuthContext` and `users.user_type`); no risk.
6. **`localStorage` quota / private mode**: existing `try/catch` pattern in the current code, preserve it.
7. **Tour content in routes a user never reaches**: no risk; they only fire when the user lands on that path.
8. **Concurrent tour starts**: prevented by the `isTourActive` gate and the 350ms defer.

## Validation steps (in order, after implementation)
1. `pnpm run typecheck` — must pass.
2. `pnpm run lint` — must pass.
3. `pnpm run build` — must pass.
4. Manual test, fresh sign-up:
   - New shipper signs up → completes onboarding → land on dashboard → chrome tour starts → close → form tour on dashboard starts → close (or complete) → land on post-shipment form → no tour. Re-login → no tour.
5. Manual test, fresh sign-up, trucker:
   - Same flow, mirrored.
6. Manual test, existing user (already onboarded but never seen tours):
   - Visit each page for the first time → tour fires once. Visit again → no tour. Logout + login → no tour.
7. Manual test, chrome tour:
   - Fresh user opens `/shipper/my-shipments` directly (e.g. via deep link) → chrome tour fires. Per-page tour also fires. Each fires once.
8. Manual test, missing elements:
   - If a target element is async-loaded, `skipMissingElement` skips that step silently.
9. Manual test, `pnpm run build` succeeds with all new IDs in place.
10. `pnpm test` — no existing tests for the tour, but the existing test suite must still pass.

## Out-of-scope checks (caller will perform after build)
- Confirm `BrowserRouter` wraps `ProductTourProvider` in the actual app entrypoint.
- Confirm no other component auto-fires a tour (re-grep the codebase for `startDashboardTour`, `startFormTour`, `driver(`).
- Confirm the two `useProductTour` import sites in the dashboards are the only consumers and have been removed.

## Open questions
None.
