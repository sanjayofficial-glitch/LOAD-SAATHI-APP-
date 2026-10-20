# Animation Plans

Six implementation plans from the motion-opportunities sweep (2026-10-19, commit `0694273`).
Every plan is self-contained — an executor needs zero conversation context.

| # | Plan | Severity | Status |
|---|------|----------|--------|
| 001 | Accept beat (success confirmation on load Accept) | HIGH | ✅ DONE |
| 002 | Fare result materialize + stagger + count-up | MEDIUM | ✅ DONE |
| 003 | Directional card swap (deck next/prev) | MEDIUM | ✅ DONE |
| 004 | Chat: static history, animated arrivals, offline banner slide | MEDIUM | ✅ DONE |
| 005 | EmptyState reuse in deck (rare-moment delight) | LOW | ✅ DONE |
| 006 | Sheet swipe-to-dismiss wiring (`useSwipeDismiss` finally used) | LOW | ✅ DONE |

## Recommended execution order

1. **001** Accept beat — highest leverage (the money moment for truckers).
2. **003** Directional swap — same file as 001 (`LoadCardStack.tsx`); do after 001 and
   respect its overlay/`relative`/`acceptBeat` changes when merging classNames.
3. **005** EmptyState reuse — also `LoadCardStack.tsx`; tiny, do last of the three to
   avoid line-drift confusion with the bigger edits (001, 003).
4. **002** Fare calculator — independent file (`FareCalculator.tsx`); the count-up step
   is marked optional but recommended.
5. **004** Chat arrivals + offline banner (touches `Chat.tsx` + `globals.css`).
6. **006** Sheet swipe-dismiss (additive component capability; no consumer changes).

## Dependencies / merge notes

- **001 → 003 → 005** all touch `supabase/src/components/LoadCardStack.tsx`. After each
  plan, file:lines in the next plan may shift — the anchored code snippets govern, not
  line numbers. Never drop Plan 001's additions while applying 003.
- **004** touches `Chat.tsx` twice (bubble markup line ~272, offline banner line ~305)
  and appends CSS to `globals.css` **after** `.animate-badge-pop` (~line 549).
- **006** is additive-only to `ui/sheet.tsx`; consumers must compile unchanged.

## Verification convention

Every plan ends with mechanical checks (`pnpm typecheck`, `pnpm lint`, `pnpm build`) and
a feel-check section. Do the feel checks on a real device where gestures are involved
(006), via DevTools Animations panel slowdown for entrances (001, 002, 003, 004), and
with `prefers-reduced-motion` toggled (all).

## After execution

Update each plan's **Status** row to DONE (and note deviations), or run
`improve-animations reconcile` to re-check plans against the current code.
