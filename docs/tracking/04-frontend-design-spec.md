# LoadSaathi — Frontend: Live Truck Tracking Design Spec

Follows the previously approved architecture: low-cost, trip-based, no paid SDKs, foreground-first, privacy-first.

## 0. Guiding principles
- **One source of truth:** `driver_locations` (one row per driver) + existing `trips` planned origin/destination.
- **Team A (driver) submits freely; Team B (shipper/admin) view only when entitled.**
- **Never invent GPS** — only smooth existing fixes; never claim precise ETA.
- **Safe fallback:** if any data layer fails, show last known location + stale badge; do not crash.
- **Reuse:** Leaflet (`TruckMarker`, existing map components), existing hooks, existing CSS tokens, shadcn UI.

## 1. Screens & responsibility

### A. Driver portal (trucker + shipper for reverse logistics)
- **Invisible `AutoGpsTracker` component** (mounted in `Layout`) does:
  - Show text guidance + permission gate from `LocationPermissionBanner` (existing) before tracking starts.
  - Track **only when `activeTripRef.current` exists** (`status` ∈ `active`/`in_transit`).
  - Send one row: `{ driver_id, lat, lng, heading, speed, accuracy, trip_id, origin_city, dest_city, vehicle_type, capacity, trip_status, is_sharing, last_seen_at }`.
  - Fire-and-forget every 30 s with a throttled write; on unmount or trip end, issue `is_sharing=false, trip_id=null`.
- **Visible mini-map / status**: “Tracking active – last sent 10s ago”, green dot if sharing, amber if throttled, red if permission denied/no-trip. No new map.
- **Start/stop controls tied to trip status** — not a separate toggle (avoid accidental whole-fleet tracking). Still allow the existing permission banner to hint.

### B. Shipper tracking page (per ShipmentDetail)
- **Map surface (Leaflet)**:
  - Pickup pin (blue)
  - Destination pin (green)
  - Assigned truck marker (orange) + heading cone (when heading exists)
  - Planned route overlay (reuse cached OSRM/`trips` coords — draw once, do not recalc on GPS fix).
- **Info strip**:
  - Shipment + trip status badge
  - Driver name + rating
  - “Last updated: 12s ago”; “Not tracking since …” when stale for > 120 s
- **Trip stages strip** (reuse existing event statuses): Accepted → En route → Pickup → In transit → Delivered
- **Controls**: “Refresh location” (optional), “Message driver” (existing chat)

### C. Marketplace / Browse
- **Browse Trips (shipper side)**: keep the truck map, but only **assigned or in-transit** markers may appear after privacy pass. Show a copy line: *“Live location is shared only with the shipper of an accepted shipment.”* to avoid surprises.
- **Browse Shipments (trucker side)**: keep load markers; no change to `load_locations` except RLS scoping on the client query.

### D. Admin command center map
- Keep existing layout; only reads if `is_admin()` true. Add a small “Privacy: entitled only” badge.

## 2. Component reuse map (no new heavy components)
- `components/maps/TruckMarker.tsx`, `LoadSaathiMap.tsx`, `RouteMap` → reuse as-is; pass `lastUpdated`.
- `shadcn`: `Badge`, `Card`, `Separator`, `Tooltip`, `Alert` for statuses; `Skeleton` for loading map.
- `components/LocationPermissionBanner.tsx` (existing) → reuse permission UX.
- Hooks: `useLiveDriverLocations` (browse), `useLiveLoadLocations`; new fit: a small `useTripTracking(tripId)` with trip-scoped fetch + subscription.

## 3. Stale-state design
- **Window:** `now - lastUpdated >= 120s`.
- **Visuals:** truck marker gray scale (opacity 0.35), a faded “last known” arc trail from previous positions (optional, stored client-only, not in DB); red text label “Last seen X mins ago — signal lost”.
- **ETA:** only shown when `!stale`; label clearly says “rough / (ORS) estimate — (approx X h Y m)”.

## 4. Empty/permission/error states
- `permission-denied`: offline-style card + CTA open browser settings, helper checklist.
- `no-trip`: driver state label “Waiting for an accepted shipment.”
- `offline`: last known location retained (do not blank), small toast/backoff notice; respect retry.
- `rate-limit`: silent retry with exponential backoff, no full-screen error.

## 5. Color/tokens (reuse existing)
- No new palette. Map pins: pickup `primary`, destination `success`, truck `warning`, stale `muted`.
- Use existing spacing/shadow scales from `tailwind.config.ts`.
- Dark mode: inherited from `theme` provider.

## 6. Mobile (Capacitor + web)
- Map controls bottom-center, large 44px touch targets.
- Tracking indicator stays as a collapsible pill at top.
- Offline state uses optimistic last-known; no hard refresh.
- **Background tracking not promised:** UI copy says “tracking active while app is open.”

## 7. Data-binding checklist (must match RLS rewrite later)
- Truck coordinates come from `driver_locations` **only**.
- Planned `origin_lat/lng` / `dest_lat/lng` come from `trips` / `shipments` unchanged.
- `last_seen_at` rounds to the nearest second in UI; exact ISO stays in data attributes.
- Role-gated components check auth context, not route names.

## 8. Accessibility / motion
- Use existing `data-reduce-motion` respect; disable marker animations for reduced-motion users.
- Screen-reader label on truck marker: “Truck … last updated 12 seconds ago”.
- Color + icon + label for every status; no color-only meaning (reusing WCAG requirement from md-review).

## 9. Acceptance criteria (UI-only, before backend swap)
1. Calm map, no jumps, no invented GPS.
2. Stale badge appears when 2 minutes without update.
3. Permission error is clear to a driver.
4. Non-entitled shipper gets no marker; no error toast — clean empty state.
5. Plan origin dest markers are always present while tracking.
6. No route recalculation on each fix (measurable: network tab has no routing requests mid-tracking).
7. Light/dark modes + mobile widths render without clipping.

## Do-not-do list
- Do not add MapLibre, paid map tiles, tracking SDK, or a new backend.
- Do not show any truck other than the assigned driver’s.
- Do not auto-start tracking for non-drivers.
- Do not pretend background/GDP reliability; copy must be honest.
- Do not break `useLiveLoadLocations` or marketplace browse (subset only).

## Next actions (you need to approve)
- [ ] Implement Option B (new `useTripTracking` + stale indicators) — code only.
- [ ] Preserve the existing visual tokens; minimal changes to Layout map regions.
- [ ] Use existing shadcn components for alerts/state.
- Then wire up participant RLS (from the migration plan).

No files/DB have been changed by this write; this is a design spec placed in `docs/tracking/`.
