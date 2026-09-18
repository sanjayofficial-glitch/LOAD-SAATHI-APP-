---
name: product-tour-system
description: >-
  Product tour system with driver.js. Use when building onboarding tours,
  guided tours, or feature walkthroughs. Triggers: product tour, onboarding tour,
  driver.js, user onboarding, guided tour.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# Product Tour System with driver.js

Complete onboarding tour system with 15+ role-specific tours, localStorage persistence, chained tours, and skip-missing-element safety.

## Key Files

- `src/hooks/useProductTour.ts` — Tour definitions, registry, and step builders

## Pattern

### TourSpec Structure
```ts
interface TourSpec {
  id: TourId;
  paths: string[];
  roles: UserType[];
  buildSteps: () => DriveStep[];
  chainTo?: { path: string; tourId: TourId };
}
```
- `id` — unique tour identifier
- `paths` — route paths where this tour runs
- `roles` — user types who see this tour
- `buildSteps` — returns array of driver.js steps
- `chainTo` — optional follow-up tour after completion

### Tour Registry
15+ tours defined in `TOUR_REGISTRY`:
- Entry tours: `entry.trucker`, `entry.shipper` (chain to post forms)
- Dashboard tours: `trucker.dashboard`, `shipper.dashboard`
- Form tours: `trucker.post-trip`, `shipper.post-shipment`
- Hub tours: `trucker.my-trips`, `shipper.my-shipments`
- Browse tours: `trucker.browse-shipments`, `shipper.browse-trucks`
- History tours: `trucker.history`, `shipper.history`
- Account: `account.profile`, `account.favorites`, `account.credit-score`
- Universal chrome: `chrome.universal` (sidebar, notifications, profile)

### Persistence
```ts
const key = `loadsaathi-tour-done-${userId}-${tourId}`;
localStorage.setItem(key, '1');
```
- `markTourDone(userId, tourId)` — marks tour complete
- `isTourDone(userId, tourId)` — checks if completed
- `resetTour(userId)` — clears all tour completion flags
- `consumeTourEntryFlag(userId)` — one-time entry tour trigger

### Step Builder Pattern
```ts
export function buildTruckerDashboardSteps(onNavigateToForm?: () => void): DriveStep[] {
  return [
    { element: '#trucker-dashboard-header', popover: popover('Title', 'Description', { side: 'bottom' }) },
    { element: '#trucker-stat-cards', popover: popover('Stats', '...'), skipMissingElement: true },
  ];
}
```
- `skipMissingElement: true` for optional elements
- `onNextClick` callback for navigation
- `popover()` helper with standard options

### Tour Matching
```ts
const spec = matchSpecForPath(pathname, userType);
```
Finds exact match first, then prefix match.

## Best Practices

- Always use `skipMissingElement: true` for non-critical elements
- Chain entry tours to form tours for seamless onboarding
- Use role-specific highlight classes (`driver-trucker`, `driver-shipper`)
- Store completion state in localStorage, not sessionStorage
- Provide reset mechanism for testing
