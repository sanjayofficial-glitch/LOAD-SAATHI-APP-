# 001 — Give the load Accept button a success beat

- **Status**: DONE (2026-10-19). Deviation: accept guard written as `if (acceptBeat || !current) return;` to satisfy `noUncheckedIndexedAccess`.
- **Commit**: 0694273
- **Severity**: HIGH
- **Category**: Missed opportunity (delight budget / feedback)
- **Estimated scope**: 1 file (`supabase/src/components/LoadCardStack.tsx`), ~30 lines added; no CSS needed

## Problem

The Accept button is the single highest-emotion action in the trucker flow — one tap commits
them to a load. Today tapping it gives **zero acknowledgment of the decision**:
`handleAcceptLoad` in the parent navigates instantly and the card simply disappears
(`supabase/src/pages/trucker/BrowseShipments.tsx:219-221`):

```tsx
// supabase/src/pages/trucker/BrowseShipments.tsx:219 — current
const handleAcceptLoad = async (shipment: Shipment) => {
  navigate(`/trucker/shipments/${shipment.id}`);
};
```

The card itself (`supabase/src/components/LoadCardStack.tsx:86-91`) is a plain Button:

```tsx
// supabase/src/components/LoadCardStack.tsx:86 — current
<Button
  onClick={() => onAccept(current)}
  className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-bold"
>
  <Check className="h-5 w-5 mr-2" /> Accept
</Button>
```

Why it matters: this is a rare, high-stakes decision moment — exactly where the app's
delight budget is allowed to spend. A success confirmation makes the app feel trustworthy;
an instant navigation feels like a link click.

## Target

On Accept tap the card shows a ~500 ms success overlay — green tint + a check badge that
pops with the house spring — then calls `onAccept` (which navigates). All buttons are
disabled during the beat so the action can't be double-fired.

- Overlay appears with the house `animate-materialize` (180 ms).
- The Check badge pops with the house `animate-badge-pop` (badgePop, 0.28s,
  `var(--ease-spring-soft)` = `cubic-bezier(0.34, 1.36, 0.64, 1)`).
- Delay before `onAccept`: **500 ms** (one readable beat — deliberate-phase timing; the
  system response after *release* stays snappy, this is a held confirmation phase).
- Buttons disabled for the duration of the beat.

## Repo conventions to follow

- Reuse existing utility classes — do NOT invent new keyframes:
  - `.animate-materialize` — surface-arrival (defined `supabase/src/globals.css:544`)
  - `.animate-badge-pop` — badge check pop (defined `supabase/src/globals.css:547`)
- Reduced motion: the overlay still renders (state indication), the CSS animations are
  already decorative and additive — no JS branching needed.
- Exemplar of a success pop using these same classes: `App.tsx:43` uses
  `toastOptions={{ className: 'animate-materialize' }}`.

## Steps

1. In `supabase/src/components/LoadCardStack.tsx`, add state next to `currentIndex`
   (line 15):

   ```tsx
   const [acceptBeat, setAcceptBeat] = useState(false);

   const handleAccept = () => {
     if (acceptBeat) return; // guard double-tap
     setAcceptBeat(true);
     window.setTimeout(() => onAccept(current), 500);
   };
   ```

   Replace `onClick={() => onAccept(current)}` on the Accept button (line 87) with
   `onClick={handleAccept}`.

2. Make the `<Card>` (line 40) the positioning context and disable buttons during the
   beat:

   ```tsx
   <Card
     key={currentIndex}
     className={`relative border-orange-100 dark:border-orange-800 shadow-xl overflow-hidden animate-materialize ${
       acceptBeat ? 'ring-2 ring-green-500 border-transparent' : ''
     }`}
   >
   ```

   Add `disabled={acceptBeat}` to all three nav buttons (Previous / Accept / Next,
   lines 77-101).

3. Insert the success overlay as the first child inside `<CardContent>`
   (before line 42's header row):

   ```tsx
   {acceptBeat && (
     <div
       aria-hidden="true"
       className="absolute inset-0 z-10 grid place-items-center rounded-[inherit] bg-green-600/10 animate-materialize pointer-events-none"
     >
       <div className="grid h-16 w-16 place-items-center rounded-full bg-green-600 text-white shadow-xl animate-badge-pop">
         <Check className="h-8 w-8" />
       </div>
     </div>
   )}
   ```

## Boundaries

- Do NOT touch `supabase/src/pages/trucker/BrowseShipments.tsx` — the beat lives entirely
  in `LoadCardStack.tsx`.
- Do NOT add framer-motion imports to this file — plain CSS classes only.
- Do NOT change the card layout, the stack navigation logic, or `goNext`/`goPrev`.
- The timeout must fire `onAccept` exactly once. If the component unmounts during the
  beat, a leaked timeout navigating is acceptable (route still resolves) — do not add
  effect-based cleanup that could suppress the navigation.
- If the code at the cited lines doesn't match (drift since commit 0694273), STOP and
  report instead of improvising.

## Verification

- **Mechanical**: `pnpm typecheck` and `pnpm lint` pass; `pnpm build` succeeds.
- **Feel check** (run `pnpm dev`, open Find Loads as a trucker with available loads):
  - Tap Accept → the card rings green, a check badge pops from small→1.18→1 (soft
    overshoot), then the app navigates to the load detail. Nothing feels like a dead click.
  - Tap Accept repeatedly — only one beat runs, buttons are inert during it.
  - In DevTools Animations panel set playback to 10% and confirm: overlay materializes
    first, badge pop overlaps it, total beat ≈ 500 ms before navigation.
  - Toggle `prefers-reduced-motion` (Rendering panel): the green tint + check still show
    (no movement ~ hallucinated motion), navigation still happens on schedule.
- **Done when**: Accept produces the visible success beat, `onAccept` fires once after
  ~500 ms, and nav buttons can't be pressed mid-beat.
