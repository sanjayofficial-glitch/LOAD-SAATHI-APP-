# 003 — Load card swap: directional 160ms slide-fade

- **Status**: DONE (2026-10-19). No deviations. Initial mount of the deck now plays `card-swap-next` instead of `materialize` (acceptable: first-card entrance is equivalent in weight).
- **Commit**: 0694273
- **Severity**: MEDIUM
- **Category**: Spatial consistency
- **Estimated scope**: 1 file (`supabase/src/components/LoadCardStack.tsx`), ~20 lines

## Problem

Next/Previous swaps the card by remounting on `key={currentIndex}` with the house
`animate-materialize` — a non-directional scale-pop:

```tsx
// supabase/src/components/LoadCardStack.tsx:40 — current
<Card key={currentIndex} className="border-orange-100 dark:border-orange-800 shadow-xl overflow-hidden animate-materialize">
```

At "next" tap frequency the pop gives no sense of *which way* you're going through the
deck. Direction should be legible: forward slides left, back slides right. This is a
tens-per-day surface, so the motion must be small and fast — near-imperceptible, just
enough to preserve orientation.

## Target

Directional entrance on every card swap: entering card starts at
`translateX(±12px)` + `opacity: 0`, animates to identity.

- Forward (Next): enters from the right → from `translateX(12px)`.
- Back (Previous): enters from the left → from `translateX(-12px)`.
- **160 ms**, `var(--ease-out-quint)` (`cubic-bezier(0.22, 1, 0.36, 1)`), `ease-out`
  family (entrance), transform+opacity only.
- Wrap-around (cycling past either end) counts as "forward".

## Repo conventions to follow

- Durations/easings tokens: `--dur-fast` (120 ms) / `--dur-press` (80 ms) exist; 160 ms
  sits between `fast` and `base` — inline it in the keyframe/animation definition as a
  one-off (documented below) since no existing token equals 160 ms; use
  `var(--ease-out-quint)`.
- Exemplar restart pattern: `supabase/src/hooks/usePageFade.ts:20-27` (remove class →
  force reflow → re-add). We restart via React `key` instead — simpler and remounts are
  already the mechanism here.
- Keep `animate-materialize` semantics: this plan *replaces* the pop with directional
  slide on this card only. Do not touch the global `materializeIn` keyframes.

## Steps

1. In `supabase/src/components/LoadCardStack.tsx`, track direction next to
   `currentIndex` (line 15):

   ```tsx
   const [direction, setDirection] = useState<1 | -1>(1);

   const goNext = () => {
     setDirection(1);
     setCurrentIndex((i) => (i + 1) % shipments.length);
   };

   const goPrev = () => {
     setDirection(-1);
     setCurrentIndex((i) => (i - 1 + shipments.length) % shipments.length);
   };
   ```

   Replace the existing `goNext`/`goPrev` bodies (lines 19-25).

2. Add two one-off keyframes + classes at the top of the component (or better: append to
   the component file's adjacent style addendum — **preferred: keep in TSX via a
   `<style>` tag is NOT house style**; instead append to `supabase/src/globals.css`,
   inside the existing utilities layer section, after `.animate-materialize` at line
   549):

   ```css
   /* Directional card-swap entrance (LoadCardStack deck). Small, fast,
      directional — orientation at tens-per-day frequency. */
   @keyframes cardSwapNext {
     from { opacity: 0; transform: translateX(12px); }
     to { opacity: 1; transform: translateX(0); }
   }
   @keyframes cardSwapPrev {
     from { opacity: 0; transform: translateX(-12px); }
     to { opacity: 1; transform: translateX(0); }
   }
   .animate-card-swap-next {
     animation: cardSwapNext 160ms var(--ease-out-quint) both;
   }
   .animate-card-swap-prev {
     animation: cardSwapPrev 160ms var(--ease-out-quint) both;
   }

   @media (prefers-reduced-motion: reduce) {
     .animate-card-swap-next,
     .animate-card-swap-prev {
       animation-name: materializeIn;
       animation-duration: 180ms;
     }
   }
   ```

   (Fallback on reduced motion = the existing house materialize — gentle, no direction.)

3. Swap the Card's animation class conditionally (line 40):

   ```tsx
   <Card
     key={currentIndex}
     className={`border-orange-100 dark:border-orange-800 shadow-xl overflow-hidden ${
       direction === 1 ? 'animate-card-swap-next' : 'animate-card-swap-prev'
     }`}
   >
   ```

## Boundaries

- Do NOT touch `goNext`/`goPrev` math beyond adding `setDirection` — wrap-around behavior
  stays identical.
- Do NOT touch the Accept button or overlay (Plan 001 owns that); the two plans touch the
  same file — apply Plan 001 first, keep its `acceptBeat` state and `relative` Card class
  when editing line 40 (merge the className strings, do not drop `relative` or the
  conditional ring).
- Do NOT animate the counter Badge or nav buttons.
- If cited code drifted (commit 0694273), STOP and report.

## Verification

- **Mechanical**: `pnpm typecheck`, `pnpm lint`, `pnpm build` pass.
- **Feel check** (`pnpm dev`, Find Loads, card view with ≥2 loads):
  - Next: card slides subtly in from the right (12px, 160ms) — perceptible direction,
    not a whoosh.
  - Previous: slides in from the left.
  - Rapid Next-spam: animation restarts cleanly each tap (key remount), never stacks or
    skips; no flash of blank card.
  - DevTools Animations at 10%: entrance is 160 ms, curve decelerating, no bounce.
  - `prefers-reduced-motion` on: swap falls back to the soft materialize (no direction —
    acceptable; motion preference wins over orientation cue).
- **Done when**: Next/Previous produce consistent directional entrances and neither
  Plan 001's overlay nor this animation breaks the other.
