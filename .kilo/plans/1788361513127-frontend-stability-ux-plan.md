# LoadSaathi Frontend Stability & UX Plan

> **Scope:** P0 crash fixes → P1 form overhaul → P2 polish.  
> **Database:** Ready — no schema changes needed.  
> **Files referenced:** `supabase/src/` unless noted.

---

## P0 — Stability / Crash Prevention (this week)

### 1. Fix AutoGpsTracker schema mismatch
**File:** `supabase/src/components/AutoGpsTracker.tsx`

**Verified bugs:**
- Line 102: writes `user_type` — column does not exist in `driver_locations`.
- Line 108: writes `last_seen_at` — column does not exist in `driver_locations`.
- Line 131: `enableHighAccuracy: false` — inaccurate GPS for truckers.

**Changes:**
- Remove `user_type` and `last_seen_at` from the `upsert` payload.
- Change `enableHighAccuracy` to `true` when `ut === 'trucker'`, keep `false` for `shipper`.
- Wrap the upsert in `try/catch` and call `showError` on failure instead of `console.error`.

### 2. Fix driver_locations RLS privacy leak
**File:** `supabase/migrations/20260713_driver_locations.sql`

**Verified bug:**
- Line 22-26: `USING (true)` exposes all trucker GPS to every authenticated user.

**Changes:**
```sql
CREATE POLICY "Users can see own location or admin"
  ON public.driver_locations FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'sub' = driver_id OR public.is_admin());
```
Requires `public.is_admin()` to exist. If not, use `EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND user_type = 'admin')`.

### 3. Add global unhandledrejection handler
**File:** `supabase/src/main.tsx`

**Verified gap:** No listener for unhandled promise rejections.

**Changes:**
- Add `window.addEventListener('unhandledrejection', ...)` before `mountApp()`.
- Log to `logger.error` and optionally call `posthog.captureException`.

### 4. Standardize Realtime channel cleanup
**Files:** `Chat.tsx`, `ChatList.tsx`, `Layout.tsx`, `NotificationBell.tsx`

**Verified issue:** `removeChannel` is called without `await` in cleanup functions, which can leave channels subscribed after unmount.

**Changes:**
- Make cleanup async via an IIFE or `void` pattern, and `await supabase.removeChannel(channel)`.
- Track channel by name string where possible; `removeChannel` in Supabase JS v2.99 accepts `RealtimeChannel | string`.

### 5. Add missing error states to dashboards
**Files:** `TruckerDashboard.tsx`, `ShipperDashboard.tsx`

**Verified gap:** Both catch errors and show a toast, but render nothing on error (blank screen).

**Changes:**
- Add an `error` state variable.
- When `error` is set, render `<ErrorState title="Failed to load dashboard" description={error.message} retry={fetchDashboardData} />`.
- Reuse existing `ErrorState` component.

### 6. Add try/catch + type guard around RPC JSON.parse
**Files:** `PostTrip.tsx`, `PostShipments.tsx`

**Verified issue:** Line 103 in PostTrip and line 101 in PostShipments do `JSON.parse(data)` without guarding.

**Changes:**
```ts
const tripData = typeof data === 'string' ? safeJsonParse(data) : data;
```
Add a `safeJsonParse` helper in `lib/utils.ts` that returns `null` on parse failure.

---

## P1 — Form Overhaul & UX Hardening (next 2 weeks)

### 7. Migrate PostTrip and PostShipments to React Hook Form + Zod
**Files:** `PostTrip.tsx`, `PostShipments.tsx`

**Current state:** Both use `useState` with inline validation on submit.

**Target pattern:**
```tsx
const form = useForm<TripFormValues>({
  resolver: zodResolver(tripSchema),
  defaultValues: { origin_city: '', ... },
});
```
- Create `tripSchema` and `shipmentSchema` in a new `src/lib/validations.ts` using Zod.
- Replace manual `formData` state with `form.watch()` / `form.setValue()`.
- Show per-field errors with `<FormMessage>` from shadcn/ui.
- Disable submit button while `form.formState.isSubmitting`.

### 8. Add optimistic UI for message send
**File:** `Chat.tsx`

**Current state:** Message appears only after server confirms.

**Changes:**
- On send, append a temp message with `id: 'temp-' + Date.now()` and `status: 'sending'`.
- Replace with the real message on success, or show error state on failure.
- Add `MessageStatus` component with single/double checkmarks.

### 9. Add empty states to browse pages
**Files:** `BrowseShipments.tsx`, `BrowseTrips.tsx`, `TruckerHub.tsx`, `MyShipments.tsx`

**Verified gap:** `BrowseShipments.tsx` and `BrowseTrips.tsx` do not render `<EmptyState>` when results are empty.

**Changes:**
- When `shipments.length === 0 && !isLoading`, render `<EmptyState>` with role-appropriate CTA.
- Same for `TruckerHub.tsx` and `MyShipments.tsx` when list is empty.

### 10. Standardize auth client pattern
**Files:** `PostTrip.tsx`, `Chat.tsx`, `ChatList.tsx`, `NotificationBell.tsx`, `Layout.tsx`, all dashboard pages

**Current state:** 3 patterns in use:
1. `useClerkAuth().getToken` + `createClerkSupabaseClient` (PostTrip, Chat, ChatList, NotificationBell, Layout)
2. `useSupabase().getAuthenticatedClient` (PostShipments)
3. `useAuth().getSupabaseToken` (some dashboard pages)

**Decision:** Standardize on `useSupabase().getAuthenticatedClient` because it already handles token caching, client creation, and realtime auth in one place.

**Changes:**
- Replace `useClerkAuth().getToken({ template: 'supabase' })` + `createClerkSupabaseClient(...)` with `const { getAuthenticatedClient } = useSupabase(); const supabase = await getAuthenticatedClient();`
- Remove unused `createClerkSupabaseClient` imports where replaced.

### 11. Add skip-to-content link and form ARIA
**Files:** `PublicLayout.tsx`, `Layout.tsx`, all form pages

**Changes:**
- Add `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>` at the top of `PublicLayout` and `Layout`.
- Add `aria-invalid={!!errors.fieldName}` and `aria-describedby` linking to error message IDs on all form inputs.

---

## P2 — Polish & Performance (next month)

### 12. Strip/replace console statements
**Files:** All `.tsx` files in `supabase/src/`

**Current state:** 60+ `console.error/warn/log` calls found.

**Changes:**
- Replace with `logger.error/warn/info` from `lib/logger.ts`.
- Strip `console.*` from production via Vite build config (`define: { 'console.log': '()=>{}' }` in `vite.config.ts` for production).

### 13. Verify and remove dead code
**Files:** `GpsTracker.tsx`, `data/socialLinks` (if duplicated)

**Current state:**
- `GpsTracker.tsx` is used by `TruckerTripDetail.tsx` — keep.
- `IndexSkeleton` is used by `Index.tsx` — keep.
- Check for duplicate social link data in `data/socialLinks` vs `FooterSocialLinks`.

**Changes:**
- Remove duplicate if found.
- Move `ruvector.db` out of repo root if present.

### 14. Replace Three.js globe with lightweight alternative
**File:** `Index.tsx`

**Current state:** Three.js globe adds ~300KB external bundle.

**Changes:**
- Replace with CSS-only animated gradient or remove if not critical.
- Remove Three.js CDN script tag from `Index.tsx`.

### 15. Debounce smart match score calculation
**File:** `BrowseShipments.tsx`, `useSmartMatch.ts`

**Current state:** `calculateMatchScore` runs on every filter change for all items.

**Changes:**
- Debounce filter input by 300ms.
- Memoize score calculation with `useMemo` keyed on `[shipments, myActiveTrip]`.

### 16. Add date range selector to dashboards
**Files:** `TruckerDashboard.tsx`, `ShipperDashboard.tsx`

**Changes:**
- Add tabs: "Last 7 days", "Last 30 days", "Last 90 days".
- Pass date range to `price_history` query via `.gte('created_at', startDate)`.

---

## Validation Plan

For each P0 item:
1. Reproduce the crash or leak in dev (`pnpm run dev`).
2. Apply fix.
3. Verify:
   - GPS tracker no longer throws column errors in Supabase logs.
   - RLS policy blocks cross-user location reads.
   - `unhandledrejection` fires and logs correctly.
   - Realtime channels unsubscribe on unmount (verify in Network tab → WS frames).
   - Dashboards show `<ErrorState>` on simulated fetch failure.

For P1 items:
1. Run `pnpm run typecheck` and `pnpm run lint`.
2. Manually test form validation, optimistic chat, empty states, and auth pattern standardization.
3. Verify no console errors in production build (`pnpm run build && pnpm run preview`).

---

## Open Questions / Decisions

| Question | Recommendation |
|---|---|
| `public.is_admin()` function exists? | If not, inline the admin check in the RLS policy. |
| Should `useSupabase` hook replace all direct `getSupabaseToken` calls? | Yes — reduces duplication and centralizes retry logic. |
| Should we keep `GpsTracker.tsx` alongside `AutoGpsTracker.tsx`? | Deprecate `GpsTracker.tsx` once `AutoGpsTracker` is stable; remove after one sprint. |
| Should `driver_locations` keep `accuracy` column? | Yes — keep for future GPS accuracy display. |
