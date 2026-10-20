# 002 — Fare Calculator result: materialize entrance + staggered breakdown

- **Status**: DONE (2026-10-19). Review deviation: the keyed remount was narrowed from the whole result block to the result `<Card>` only — the block-level key would have wiped `QuoteLeadCard`'s user-typed form state on every re-calculation. Count-up re-fires only when the total value changes. Known accepted warning: `react-hooks/exhaustive-deps` spread element from the plan's own `useCountUp` snippet.
- **Commit**: 0694273
- **Severity**: MEDIUM
- **Category**: Missed opportunity (preventing a jarring change)
- **Estimated scope**: 1 file (`supabase/src/pages/public/FareCalculator.tsx`), ~15 lines

## Problem

The fare result block renders instantly via a conditional render — the quote teleports in:

```tsx
// supabase/src/pages/public/FareCalculator.tsx:487 — current
{result && (
  <>
    <Card className="mt-6 shadow-xl border-green-100 dark:border-green-900/30 overflow-hidden animate-fade-in-up">
```

The card already has `animate-fade-in-up`, but the animation fires **only on first mount
of the whole page component** in some cases, and if the user re-runs a calculation the
card never re-animates (React keeps it mounted; nothing restarts). There is also no
entrance on the breakdown rows — six rows appear at once.

## Target

1. The result card re-animates on **every new calculation** (key the block by the result
   identity so React remounts it).
2. Breakdown rows stagger in 60 ms apart using the house `.reveal` tokens
   (`revealStyle(index)` from `supabase/src/lib/motion.ts:142` — inline style helper that
   emits `--reveal-i` / `--reveal-delay` consumed by `.reveal[data-reveal="in"]`).
3. Optional but recommended: the headline ₹ count-up ~600 ms on each new result (the
   "aha" of the calculator; occasional frequency, marketing-adjacent page). Implement
   with a tiny `useCountUp` hook described below — plain rAF, transform/opacity-free,
   numbers only.

## Repo conventions to follow

- Tokens: durations/easings already exist — `--dur-reveal` (420 ms),
  `--ease-out-quint` (`cubic-bezier(0.22, 1, 0.36, 1)`), `--ease-ios`
  (`cubic-bezier(0.32, 0.72, 0, 1)`). Do not invent new ones.
- Stagger exemplar: `.reveal[data-reveal="in"]` transition-delay formula
  `calc(var(--reveal-i, 0) * 60ms + var(--reveal-delay, 0ms))` at
  `supabase/src/globals.css:339` — the stagger step is the house 60 ms.
- `revealStyle()` is already exported from `supabase/src/lib/motion.ts:142` and used
  with `.reveal` in list components.
- This is a **public marketing-adjacent page** — durations up to ~600 ms are acceptable
  per the house budget table (marketing / explanatory can be longer).

## Steps

1. Remount on every calculation. In `supabase/src/pages/public/FareCalculator.tsx`,
   the `{result && (<>` at line 487 — change the fragment to a keyed wrapper (use the
   `totalEstimate` + `dataPoints` identity, or whichever fields uniquely identify one
   calculation run):

   ```tsx
   {result && (
     <div key={`${result.totalEstimate}-${result.dataPoints}`}>
       {/* existing block, unchanged inside */}
     </div>
   )}
   ```

   If the fields exist on `FareResult`, prefer `generatedAt`-like uniqueness; otherwise
   the two fields above are sufficient.

2. Add `revealStyle` to the imports from `@/lib/motion`:

   ```tsx
   import { revealStyle } from "@/lib/motion";
   ```

3. In the breakdown (lines 557-564), stagger the rows:

   ```tsx
   <div className="space-y-2 text-sm">
     {result.breakdown.map((item, i) => (
       <div
         key={item.label}
         className="flex justify-between reveal"
         data-reveal="in"
         style={revealStyle(i)}
       >
         <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
         <span className="font-medium text-gray-900 dark:text-white">₹{item.value.toLocaleString("en-IN")}</span>
       </div>
     ))}
   </div>
   ```

   `.reveal[data-reveal="in"]` includes the 60ms×i delay automatically; elements are
   visible-by-default and `data-reveal="in"` is the settled state — no flash risk.

4. Stagger the two range cards (Low End / High End, lines 521-532) the same way with
   `revealStyle(1)` and `revealStyle(2)` and `data-reveal="in"`.

5. **Count-up on the headline** (optional, include it): add a small hook inline in the
   same file:

   ```tsx
   function useCountUp(target: number, duration = 600, deps: unknown[] = []) {
     const [value, setValue] = useState(target);
     useEffect(() => {
       const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
       if (reduce) { setValue(target); return; }
       const start = performance.now();
       let raf = 0;
       const tick = (now: number) => {
         const t = Math.min((now - start) / duration, 1);
         const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
         setValue(Math.round(target * eased));
         if (t < 1) raf = requestAnimationFrame(tick);
       };
       raf = requestAnimationFrame(tick);
       return () => cancelAnimationFrame(raf);
     }, [target, duration, ...deps]);
     return value;
   }
   ```

   In the headline block (line 513):

   ```tsx
   const headline = useCountUp(result.totalEstimate, 600);
   <p className="text-5xl sm:text-6xl font-black text-orange-600 dark:text-orange-400">
     ₹{headline.toLocaleString("en-IN")}
   </p>
   ```

   Note: the hook must be declared at top level of the component body (declare once,
   call unconditionally — pass `result?.totalEstimate ?? 0` when result is null).

## Boundaries

- Do NOT touch the CSS files — everything reuses existing tokens/utilities.
- Do NOT animate the trend badge, diesel badges, or the chart component.
- Do NOT modify the calc logic, `setResult` calls, or any `trackEvent` calls.
- The stagger must never block interaction — `.reveal` uses CSS transitions, always safe.
- If cited code drifted (commit 0694273), STOP and report.

## Verification

- **Mechanical**: `pnpm typecheck`, `pnpm lint`, `pnpm build` pass.
- **Feel check** (`pnpm dev` → open /fare-calculator, run a calculation):
  - First calculation: card fades up, headline counts up ~600 ms, breakdown rows appear
    one after another top-to-bottom.
  - Change weight/route and re-calculate: the card **re-animates** (does not stay stale).
  - Spamming Calculate rapidly: rows never appear blank; no interation blocked (rows are
    plain divs; delays are transition-delays only).
  - DevTools Animations at 10%: verify rows start 60 ms apart and settle with
    `--ease-out-quint`.
  - `prefers-reduced-motion` on: count-up jumps to final value instantly (no tweening
    numbers at the user); rows appear without movement.
- **Done when**: every fresh calculation re-animates the card with staggered breakdown
  and the count-up headline.
