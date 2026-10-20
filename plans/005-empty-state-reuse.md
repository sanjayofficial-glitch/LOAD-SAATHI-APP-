# 005 — Empty state in LoadCardStack reuses EmptyState component

- **Status**: DONE (2026-10-19). Deviations: route `/trucker/post-trip` confirmed real (`routes.tsx:269`) so `primaryAction` kept; icon sized `h-8 w-8 sm:h-10 sm:w-10` per dominant house consumer pattern (plan's `h-4 w-4` was a placeholder).
- **Commit**: 0694273
- **Severity**: LOW
- **Category**: Missed opportunity (delight at rare moment) + cohesion
- **Estimated scope**: 1 file (`supabase/src/components/LoadCardStack.tsx`), ~20 lines net -8

## Problem

When no loads are available, `LoadCardStack` renders a bespoke, motionless div:

```tsx
// supabase/src/components/LoadCardStack.tsx:27-35 — current
if (shipments.length === 0 || !current) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
      <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">No loads available right now</p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Post a trip and shippers will send you loads.</p>
    </div>
  );
}
```

Meanwhile the app has a dedicated `EmptyState` component with a floating gradient icon
and a scale-in entrance (`supabase/src/components/EmptyState.tsx:51,55` —
`animate-scale-in` on the shell, `animate-float` + gradient on the icon) that is the
house pattern for exactly this moment.

## Target

Replace the bespoke block with the shared `EmptyState`, preserving the current copy and
the trucker context (recommend "post a trip" as the primary CTA — that is what a trucker
should do when there are no loads). Entrance: `animate-scale-in` (existing keyframe,
`globals.css` tailwind animation `scale-in 0.3s ease-out`) — rare moment, allowed.

Copy preserved verbatim; icon stays `Package` (lucide).

## Repo conventions to follow

- Exemplar usage of `EmptyState` — imitate its props pattern. Find an existing consumer
  with `primaryAction` (grep `EmptyState` in `supabase/src/pages/`) and mirror it.
- Props: `icon`, `title`, `description`, optional `primaryAction`, `accent` defaults
  to `'orange'` (`supabase/src/components/EmptyState.tsx:19,42`) — correct for trucker
  flow already; do not pass `accent` explicitly.

## Steps

1. In `supabase/src/components/LoadCardStack.tsx`, add the import (line 5, after the
   Button import):

   ```tsx
   import EmptyState from '@/components/EmptyState';
   ```

2. Replace the empty block (lines 27-35) with:

   ```tsx
   if (shipments.length === 0 || !current) {
     return (
       <EmptyState
         icon={<Package className="h-4 w-4" />}
         title="No loads available right now"
         description="Post a trip and shippers will send you loads."
         primaryAction={{ label: 'Post a Trip', to: '/trucker/post-trip' }}
       />
     );
   }
   ```

   **Verify the route first**: grep for `post-trip` in `supabase/src/App.tsx` (or the
   route definitions). If the trucker "post trip" route is different (e.g.
   `/trucker/my-trips` contains the post form, or `/post-trip` standalone), use the real
   path. If no post-trip route exists for truckers, omit `primaryAction` entirely and
   keep only icon/title/description — never invent a dead link.

3. Keep the icon sizing consistent with other `EmptyState` consumers (some pass a
   `className`-sized icon; match what existing callers pass — check one, copy it).

## Boundaries

- Do NOT modify `EmptyState.tsx` itself.
- Do NOT remove `Package` from the lucide imports (still used in the icon).
- Do NOT touch the non-empty card branch (Plans 001/003 own that code).
- If the empty block at lines 27-35 drifted since 0694273, STOP and report.

## Verification

- **Mechanical**: `pnpm typecheck`, `pnpm lint`, `pnpm build` pass.
- **Feel check** (`pnpm dev`, Find Loads with zero matching loads — narrow filters to
  empty the list in card view):
  - The empty state now shows the floating gradient Package icon (gentle
    `animate-float`), scale-in entrance, orange accents — consistent with other pages'
    empty states.
  - The action button (if added) navigates to the real post-trip location and has the
    house press feedback (`.press` inherited from Button).
  - `prefers-reduced-motion`: scale-in is decorative; content readable without animation.
- **Done when**: the empty branch renders `EmptyState` with real copy and a real (or no)
  action; no bespoke markup remains.
