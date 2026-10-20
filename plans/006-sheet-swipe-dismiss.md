# 006 — Wire useSwipeDismiss into the house Sheet component

- **Status**: DONE (2026-10-19). Material adaptation (reviewed + approved): the hook's pointer handlers are attached to `SheetContent` (gated by a containment check on the handle) instead of the handle itself — the hook calls `setPointerCapture` on Content, so events retarget there and handle-only listeners would never fire. Also: grab handle bottom-side only, auto-rendered Close button bumps to `z-20` only while the handle shows. `useSwipeDismiss.ts` untouched. Device feel-check still pending (see plan's Feel check).
- **Commit**: 0694273
- **Severity**: LOW
- **Category**: Gesture seams (recovering built-but-unused infrastructure)
- **Estimated scope**: 2 files (`supabase/src/components/ui/sheet.tsx` + its consumers unchanged), ~25 lines

## Problem

The app ships a hand-built, physics-complete drag-to-dismiss hook — grab offset, velocity
history, momentum projection, rubber-banding, velocity-continuity on release
(`supabase/src/hooks/useSwipeDismiss.ts:40`) — with **zero consumers**. The same is true
of `vaul` (installed, unused). Every sheet in the app (`ui/sheet.tsx`, the Radix-based
house `Drawer`/`Sheet`) opens/closes with fixed CSS animations and cannot be swiped
away on mobile — which for a logistics app used by truckers on phones is a genuine
gesture seam: the natural gesture is drag-to-dismiss, and today it does nothing.

```tsx
// supabase/src/components/ui/sheet.tsx:35 — current content class (no drag machinery)
"fixed z-50 gap-4 bg-background p-6 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-300 ease-ios will-change-[transform]",
```

## Target

Add an opt-in `swipeToDismiss`-capable variant to the house Sheet: when the sheet is open
*and* a consumer opts in, dragging down on the sheet's edge/header dismisses it through
Radix's normal close path (so `onOpenChange(false)` fires and the exit animation runs),
with the drag following the finger 1:1 and rubber-banding upward if dragged the wrong
way.

Mechanics of the wiring:

- Use `useSwipeDismiss({ direction: 'down', onDismiss })` attached to a small drag
  handle rendered at the top of the sheet (grab area, not the scrollable body — the hook
  explicitly warns to attach to the handle/header, `useSwipeDismiss.ts:37-38`).
- While dragging, the hook sets inline `transform` on its attached element; on commit it
  calls `onDismiss` → `onOpenChange(false)`.
- Because Radix still animates exit on `data-state=closed`, clear the drag transform the
  way the hook does (`requestAnimationFrame(() => clearTransform())` after dismiss —
  already built into the hook's `finish` path at lines 172-184).

Scope discipline: this plan makes the capability exist at the component layer. Consumers
adopt it gradually; no page content changes.

## Repo conventions to follow

- The hook's own docs specify the attachment rules — read
  `supabase/src/hooks/useSwipeDismiss.ts:31-40` before drafting the API.
- Sheet tokens already use `--dur-*`/`--ease-ios` (`ease-ios` class, line 35) — no new
  tokens needed.
- Exemplar for Radix+drag integration: none exists yet in codebase; the plan below is
  minimal and additive. Do not over-engineer (no velocity-based manual exit animation —
  the hook's built-in commit animation runs, then Radix exit takes over; a ~1-frame seam
  is acceptable and to be feel-checked).

## Steps

1. In `supabase/src/components/ui/sheet.tsx`, extend the SheetContent props:

   ```tsx
   interface SheetContentProps
     extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> {
     /** Render a grab handle and enable drag-to-dismiss (mobile-first sheets). */
     swipeToDismiss?: boolean;
     onOpenChangeProxy?: never; // placeholder removed below
   }
   ```

   — Final form (implement exactly this):

   ```tsx
   interface SheetContentProps
     extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> {
     swipeToDismiss?: boolean;
   }
   ```

   Since SheetContent is invoked inside the Sheet compound (typically
   `<Sheet><SheetTrigger/><SheetContent>…</SheetContent></Sheet>` where `Sheet` owns
   `open`/`onOpenChange`), the content needs access to the close callback. Check how
   this repo's Sheet passes `onOpenChange` — read the file first. If SheetContent
   doesn't receive it, use Radix's close event instead: `onEscapeKeyDown`-style
   callbacks don't cover swipes, so the clean route is:

   - `Sheet` (root) already receives `onOpenChange`; pass a `closeSheet` callback down
     via context or via props — the simplest correct wiring in a compound component is a
     forwardRef + context. Implement:

     ```tsx
     const SheetCloseCtx = React.createContext<() => void>(() => {});
     // In Sheet root (where SheetPrimitive.Root renders with onOpenChange):
     <SheetCloseCtx.Provider value={() => onOpenChange?.(false)}>
       <SheetPrimitive.Root open={open} onOpenChange={onOpenChange} {...rest}>
     ```

     (Adapt to the actual prop names in the file — read first; if `Sheet` is a thin
     re-export without open-state, wire the provider inside the existing `Sheet`
     wrapper with its existing props.)

2. Add the drag handle content, in `SheetContent`, gated by the opt-in:

   ```tsx
   const SheetContent = React.forwardRef<
     React.ElementRef<typeof SheetPrimitive.Content>,
     SheetContentProps
   >(({ className, children, swipeToDismiss, ...props }, forwardedRef) => {
     const close = React.useContext(SheetCloseCtx);
     const dismiss = React.useCallback(() => close(), [close]);

     const { ref: dragRef, handlers } = useSwipeDismiss({
       direction: 'down',
       onDismiss: dismiss,
       threshold: 0.3,
     });

     return (
       <SheetPrimitive.Content
         ref={mergeRefs(forwardedRef, dragRef)}
         className={cn(sheetVariants(), className)}
         {...props}
       >
         {swipeToDismiss && (
           <div
             aria-hidden="true"
             {...handlers}
             className="press absolute left-0 right-0 top-0 z-10 flex h-8 cursor-grab touch-none items-center justify-center"
           >
             <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
           </div>
         )}
         {children}
       </SheetPrimitive.Content>
     );
   });
   ```

   Notes for the executor:
   - `useSwipeDismiss` import: `import { useSwipeDismiss } from '@/hooks/useSwipeDismiss';`
   - `mergeRefs` may not exist in the repo — if absent, implement inline:

     ```tsx
     const setRefs = (node: HTMLElement | null) => {
       forwardedRef.current = node;
       dragRef.current = node;
     };
     ```
   - **Hard requirement**: the handle must not overlap the sheet's close button
     (positioned per the file's existing styles); `z-10` keeps it above content but
     below focus overlays — verify visually.
   - `touch-none` on the handle is required so pointer events aren't hijacked by scroll.

3. Opt-in flag moves nothing visually without adoption. Do NOT change any consumer.

## Boundaries

- Do NOT change default sheet behavior for existing consumers — zero-diff unless
  `swipeToDismiss` is passed.
- Do NOT wire `vaul` in this plan (it stays an unused dependency; a future plan may
  migrate to it — out of scope).
- Do NOT add the handle to side/left variants — `direction: 'down'` fits the centered
  bottom sheet case; for `side` variants other than bottom, gate the handle:
  render it only for the bottom-placement usage (check the existing variant classes;
  if the component supports sides, only enable when the variant is bottom).
- Do NOT modify `useSwipeDismiss.ts` — if the hook needs tweaks to work with Radix
  (e.g. pointer capture conflicts), STOP and report with specifics instead of changing
  the hook.
- If Sheet's actual implementation differs materially (compound exports differ, no
  `onOpenChange` reachability), STOP and report.

## Verification

- **Mechanical**: `pnpm typecheck`, `pnpm lint`, `pnpm build` pass. Existing sheet
  consumers compile unchanged (no props added anywhere).
- **Feel check** (temporarily opt-in on any one sheet for the feel check, then revert
  the consumer before finishing):
  - Drag the handle down on a real phone or DevTools touch emulation: sheet tracks the
    finger 1:1 with slight resistance upward (rubber-band) when dragged up.
  - Flick down past threshold: sheet animates out with velocity continuity (no
    snap-to-zero start), then Radix exit finishes cleanly.
  - Small drag released: sheet springs back to place, stays open.
  - Transform cleared after dismissal (no residual offset on reopen).
  - `prefers-reduced-motion`: drag still works (gesture, not animation); the release
   动画 is handled by the hook's existing transition; reduced-motion overlays remain
    untouched elsewhere.
- **Done when**: a sheet with `swipeToDismiss` drags/flicks/falls-back correctly and
  every existing consumer renders byte-identically (no visual diff).
