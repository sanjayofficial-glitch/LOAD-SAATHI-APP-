# Driver.js Multi-Page Product Tour — Implementation Plan

## Goal

Add an interactive, role-specific product tour using Driver.js for first-time users of LoadSaathi. The tour guides users through their dashboard and then navigates to the "post first load" page, highlighting key UI elements with async-safe element checks and theme-matched styling.

## User Decision

**Tour scope**: Multi-page guided flow (user-selected over single-dashboard MVP).

**Flow per role:**

- **Trucker**: TruckerDashboard → Layout Nav → PostTrip form
- **Shipper**: ShipperDashboard → Layout Nav → PostShipments form

## Architecture

```
App.tsx
  └─ LocationProvider
      └─ AuthProvider
          └─ ProductTourProvider        ← NEW: wraps app, holds Driver instance
              ├─ Layout.tsx              ← Add IDs to nav elements
              ├─ TruckerDashboard.tsx    ← Add IDs to dashboard elements
              ├─ ShipperDashboard.tsx    ← Add IDs to dashboard elements
              ├─ PostTrip.tsx            ← Add IDs to form elements
              └─ PostShipments.tsx       ← Add IDs to form elements
```

## File Change Summary

| File | Action | Description |
|---|---|---|
| `package.json` | **MODIFY** | Add `driver.js` dependency |
| `supabase/src/contexts/ProductTourContext.tsx` | **CREATE** | Context holding Driver instance, tour triggers, and state |
| `supabase/src/hooks/useProductTour.ts` | **CREATE** | Hook with role-specific step definitions + Driver config |
| `supabase/src/styles/product-tour.css` | **CREATE** | Custom Driver.js CSS variables for orange/blue theme |
| `supabase/src/components/Layout.tsx` | **MODIFY** | Add element IDs to nav, messages, account menu, theme toggle; add "Take a tour" dropdown item |
| `supabase/src/pages/trucker/Dashboard.tsx` | **MODIFY** | Add element IDs to key dashboard sections |
| `supabase/src/pages/shipper/Dashboard.tsx` | **MODIFY** | Add element IDs to key dashboard sections |
| `supabase/src/pages/trucker/PostTrip.tsx` | **MODIFY** | Add element IDs to form fields |
| `supabase/src/pages/shipper/PostShipments.tsx` | **MODIFY** | Add element IDs to form fields |
| `supabase/src/App.tsx` | **MODIFY** | Import ProductTour CSS + wrap with ProductTourProvider |

## Step-by-Step Plan

### Step 1: Install driver.js

```bash
pnpm add driver.js
```

This also needs the CSS import. Driver.js exports `dist/driver.css` for tours and `dist/hints.css` for hints. We only need the tour CSS.

### Step 2: Create `ProductTourContext`

**New file:** `supabase/src/contexts/ProductTourContext.tsx`

Manages:
- The active Driver.js instance (shared across page navigations via React context, not remounted)
- `startDashboardTour(userType: 'trucker' | 'shipper')` — creates a Driver instance with dashboard steps, waits for data to load
- `startFormTour(userType)` — creates a Driver instance with form-field steps
- `isTourActive` — boolean to prevent multiple instances
- `tourCompleted` — localStorage-persisted flag
- `resetTour()` — clears localStorage and allows re-triggering
- Cleanup on unmount via `driverObj.destroy()`

**Key design:** The context wraps the layout so the Driver instance survives route changes within the Layout. When the tour navigates to a new route, the Dashboard component's Driver instance is destroyed, and the Form component creates a new instance.

The context exposes:
```ts
interface ProductTourContextType {
  startDashboardTour: (userType: 'trucker' | 'shipper') => void;
  startFormTour: (userType: 'trucker' | 'shipper') => void;
  isTourActive: boolean;
  tourCompleted: boolean;
  resetTour: () => void;
}
```

**Navigation coordination:** When the last dashboard step's "Next" button is clicked:
1. Set `localStorage.setItem('loadsaathi-tour-next', targetPath)`
2. Call `navigate(targetPath)`
3. Call `driverObj.destroy()` to clean up current instance
4. On the Form page mount, check for the localStorage flag and call `startFormTour()`

### Step 3: Create `useProductTour` hook

**New file:** `supabase/src/hooks/useProductTour.ts`

Contains role-specific step definitions and Driver.js configuration:

```ts
// Returns:
{
  truckerDashboardSteps: Array<Driver.Step>,
  shipperDashboardSteps: Array<Driver.Step>,
  truckerFormSteps: Array<Driver.Step>,
  shipperFormSteps: Array<Driver.Step>,
  driverOptions: Object,  // theme config, animation, etc.
}
```

**Theme customization (addressing user's question 1):** Override Driver.js CSS variables for:
- `--driver-popover-bg`: `theme(backgroundColor)` mapping (orange-50 for trucker, blue-50 for shipper)
- `--driver-popover-color`: text color matching LoadSaathi palette
- `--driver-highlight-box-shadow`: orange/blur ring
- Button colors: orange-600 for trucker, blue-600 for shipper
- Use `driver.js` CSS class overrides instead of inline styles (follow Tailwind-only convention)

**Async check (addressing user's question 2):** Use Driver.js `beforeNext` callback + `setInterval` polling to verify target elements exist in the DOM before advancing. If an element isn't found within 3 seconds, skip the step.

### Step 4: Create `product-tour.css`

**New file:** `supabase/src/styles/product-tour.css`

Imports `driver.js/dist/driver.css` and overrides theme variables. Applied per-role via CSS classes:
- `.driver-trucker` → orange theme
- `.driver-shipper` → blue theme

### Step 5: Add element IDs to Layout.tsx

Add `id` attributes to key navigation elements so the tour can target them:

| Element | New ID |
|---|---|
| Brand/logo link | `layout-brand` |
| Dashboard nav link | `nav-dashboard` |
| Post Trip / Post Load nav link | `nav-post` |
| Find Loads / Find Trucks nav link | `nav-find` |
| My Trips / My Loads nav link | `nav-my-trips` |
| Messages button | `layout-messages` |
| Account menu button | `layout-account-menu` |
| Theme toggle | `layout-theme-toggle` |

### Step 6: Add element IDs to TruckerDashboard.tsx

| Element | New ID |
|---|---|
| Header h1 | `trucker-dashboard-header` |
| Stats grid container | `trucker-stat-cards` |
| NearbyLoadsMap wrapper | `nearby-loads-map` |
| "Post New Trip" button | Add `id="trucker-post-trip-btn"` to the Link or Button |
| Quick Actions card | `trucker-quick-actions` |
| Credit Score section | `trucker-credit-score` |
| Live Fleet map card | `live-fleet-map` |

### Step 7: Add element IDs to ShipperDashboard.tsx

| Element | New ID |
|---|---|
| Header h1 | `shipper-dashboard-header` |
| LiveTruckMap wrapper | `live-truck-map` |
| Stats grid container | `shipper-stat-cards` |
| "Post New Load" button | Add `id="shipper-post-load-btn"` |
| Quick Actions card | `shipper-quick-actions` |

### Step 8: Add element IDs to PostTrip.tsx

| Element | New ID |
|---|---|
| Form card header | `post-trip-header` |
| Origin Location selector | `post-trip-origin` |
| Destination Location selector | `post-trip-destination` |
| Capacity input | `post-trip-capacity` |
| Price input | `post-trip-price` |
| Vehicle type selector | `post-trip-vehicle-type` |
| Submit button | `post-trip-submit` |

### Step 9: Add element IDs to PostShipments.tsx

| Element | New ID |
|---|---|
| Form card header | `post-shipment-header` |
| Origin Location selector | `post-shipment-origin` |
| Destination Location selector | `post-shipment-destination` |
| Weight input | `post-shipment-weight` |
| Budget input | `post-shipment-budget` |
| Goods description textarea | `post-shipment-goods` |
| Submit button | `post-shipment-submit` |

### Step 10: Wire up tour trigger

**Option A — Auto-trigger after onboarding:**
- In `OnboardingFlow.tsx` `completeOnboarding()`: set `localStorage.setItem('loadsaathi-tour-start', '1')` before navigating
- In each dashboard component's `useEffect`: check for the flag, and if set + data loaded, call `startDashboardTour(userType)`

**Option B — Manual trigger only:**
- Add "Take a product tour" to the Layout dropdown menu (below Profile Settings, above Sign Out)

**Decision:** Implement **both** — auto-trigger after onboarding + manual trigger in dropdown. This matches the user's intent ("for a first time user") while giving returning users an easy way to access the tour.

### Step 11: Import CSS and Provider in App.tsx

1. Import `product-tour.css` in `main.tsx` or `App.tsx`
2. Wrap app with `<ProductTourProvider>` inside `<AuthProvider>` (after auth so we have `userProfile`)

## Async Safety Strategy

The dashboards load data asynchronously (`loading` state → skeleton → content). The tour must wait for:
1. `loading === false` in the dashboard component
2. All target elements are present in the DOM

Implementation:
- Tour starts in `useEffect` that depends on `loading === false`
- Use Driver.js `onHighlightedElement` callback (fires when element is found)
- Use `beforeNext` callback to poll for the next step's element with a 3-second timeout
- If an element isn't found, skip to the next step (graceful degradation)

## Edge Cases & Risks

| Scenario | Handling |
|---|---|
| User navigates away mid-tour | `ProductTourProvider` cleanup destroys Driver instance |
| Elements not yet rendered | `beforeNext` polling with 3s timeout → skip step |
| User already onboarded (return visitor) | Check localStorage flag — only auto-start if never seen |
| Mobile viewport | Driver.js handles responsive — highlight box adjusts automatically |
| Tour started but data never loads | Timeout + skip mechanism prevents stuck state |
| Component conditionally renders (e.g. Live Fleet only when trucks online) | Use `beforeNext` to check existence; if missing, skip gracefully |
| User opens tour manually mid-session | `isTourActive` guard prevents duplicate instances |
| Capacitor/Android WebView | Driver.js is pure DOM/CSS, works in WebView |
| Dark mode | CSS variables respect `theme` context via Tailwind classes |
| User dismisses mid-tour | `onReset` or `onClear` callback marks as "seen" in localStorage |

## Validation Checklist

- [ ] `pnpm add driver.js` succeeds
- [ ] `pnpm run typecheck` passes with no new errors
- [ ] `pnpm run lint` passes with no new warnings
- [ ] `pnpm run build` succeeds
- [ ] Trucker tour: 8 steps on dashboard + 7 steps on PostTrip page
- [ ] Shipper tour: 7 steps on dashboard + 6 steps on PostShipments page
- [ ] Auto-trigger fires after onboarding completion (first time only)
- [ ] "Take a product tour" dropdown item opens the tour
- [ ] Multi-page navigation works (dashboard → Post Trip form)
- [ ] Tour respects loading state (starts only after data loads)
- [ ] Elements not in DOM are gracefully skipped (no crash)
- [ ] Tour can be restarted via dropdown after completion
- [ ] Dark mode styling works for tour popovers
- [ ] Tour is role-specific (trucker sees orange, shipper sees blue)
- [ ] Works on Android WebView (Capacitor)
- [ ] Tour cleans up on component unmount (no memory leaks)

## Out of Scope

- Driver.js hint popups (only guided tour/popover steps)
- Persistent tutorial overlay (non-modal walkthrough)
- Analytics event tracking for tour interactions (PostHog already tracks auth events; tour events can be added later)
- Tour progress saving (restarting mid-tour is not supported — user completes or starts over)
