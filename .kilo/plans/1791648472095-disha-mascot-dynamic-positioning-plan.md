# Disha Mascot: Dynamic Element Tracking & Contextual Engagement

## Goal
Fix Disha mascot to dynamically track UI element coordinates, animate smoothly to targets, greet first-time visitors, and provide contextual guidance during form filling/registration — addressing complaints that the mascot is "stuck bottom-left" and "not interacting with the screen."

## Root Causes (verified in source)

| Issue | File:Line | Problem |
|---|---|---|
| AuthLayout size | `Components/AuthLayout.tsx:10` | Renders `size="sm"` (88px) instead of 150px |
| GuideBotFab conflict | `Components/PublicLayout.tsx:344` | `{!isHomePage && <GuideBotFab />}` — shows on all non-home public pages, conflicts with Disha |
| Stale guide position | `Components/Disha.tsx:60-66` | `useEffect` calls `move()` with instant jump; no scroll listener recalculates `guideTargetPosition` when viewport changes |
| Discarded calculation | `Components/DishaGuideEngine.ts:270-272` | `calculatePosition()` return value ignored in `advanceToStep()` |
| Greeting disabled | `Components/DishaOnboardingTips.ts:6` | `AUTO_OPEN_TIPS = false` |
| No auth-page tips | `Components/DishaOnboardingTips.ts:32-37` | `actionPages` excludes `'auth'` |
| No smooth animation | `Components/Disha.tsx:249-264` | `freddyStyle` applies fixed `top`/`left` instantly — no framer-motion transition |
| No scroll recalc | Global | No `scroll`/`resize` listener anywhere in the mascot system |

## Affected Files

1. `supabase/src/components/Disha.tsx` — smooth animation, scroll listener, bubble positioning
2. `supabase/src/components/DishaGuideEngine.ts` — expose `recalculateTargetPosition()`, use `calculatePosition` return value
3. `supabase/src/components/DishaContext.tsx` — wire recompute on scroll
4. `supabase/src/components/DishaOnboardingTips.ts` — enable `AUTO_OPEN_TIPS`, add auth greeting, include `'auth'` in `actionPages`
5. `supabase/src/components/AuthLayout.tsx` — change `size="sm"` to `size="lg"` (150px)
6. `supabase/src/components/PublicLayout.tsx` — remove `{!isHomePage && <GuideBotFab />}` entirely
7. `supabase/src/hooks/useMascotFormWatcher.ts` — improve polling frequency
8. `supabase/src/components/DishaGuideProvider.tsx` — add scroll listener for guide target recalc
9. `supabase/src/pages/auth/Register.tsx` — add `data-guide="submit"` to submit button
10. `supabase/src/pages/auth/OnboardingFlow.tsx` — add `data-guide="complete-onboarding"` (already done, verify)

## Task List

### Task 1: Enable 150px mascot size on auth pages

**File:** `supabase/src/components/AuthLayout.tsx` (line 10)

Change `size="sm"` to `size="lg"`:
```tsx
<Disha accent="orange" size="lg" />
```
This renders at 150px (per `sizeMap` in `Disha.tsx:138`).

### Task 2: Remove GuideBotFab entirely from PublicLayout

**File:** `supabase/src/components/PublicLayout.tsx`

1. Remove import: line 34 `import GuideBotFab from "./GuideBotFab";`
2. Remove conditional render: line 344 `{!isHomePage && <GuideBotFab />}`
3. Remove `isHomePage` / `useLocation` if now unused (check if `isHomePage` used elsewhere)

`GuideBotFab` is redundant with Disha's built-in tap handler — its removal eliminates visual conflict.

### Task 3: Fix guide engine position calculation

**File:** `supabase/src/components/DishaGuideEngine.ts` (lines 269-272)

In `advanceToStep()`, the `calculatePosition()` result is discarded:
```ts
// CURRENT (broken):
const targetInfo = findTargetElement(step.target);
if (targetInfo.element && targetInfo.rect) {
  calculatePosition(targetInfo.rect, step.position);  // result discarded
  notify();
}
```

Fix: Call `notify()` after `calculatePosition` so the subscriber picks up the new step's target:
```ts
const targetInfo = findTargetElement(step.target);
if (targetInfo.element && targetInfo.rect) {
  calculatePosition(targetInfo.rect, step.position);
  notify();
} else {
  // Fallback: still notify so Disha can hide or reposition to default
  notify();
}
```

Add a `recalculatePosition()` function to the engine return object:
```ts
function recalculatePosition() {
  if (!currentState.isActive) return;
  const step = getCurrentStep();
  if (!step) return;
  const targetInfo = findTargetElement(step.target);
  if (targetInfo.rect) {
    const pos = calculatePosition(targetInfo.rect, step.position);
    notify(); // triggers subscriber to call getCurrentTargetPosition()
  }
}
```
Export it in the return object (line 464-485) and in `useGuideEngine()` hook.

### Task 4: Add scroll/resize listener for guide target recalc

**File:** `supabase/src/components/DishaGuideProvider.tsx` (after line 47)

Add a `useEffect` that listens to `scroll` and `resize` events and calls `guideEngine.recalculatePosition()` when the guide is active:
```ts
useEffect(() => {
  if (!state.isActive) return;
  const handleScroll = () => guideEngine.recalculatePosition();
  const handleResize = () => guideEngine.recalculatePosition();
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });
  return () => {
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', handleResize);
  };
}, [state.isActive, state.currentStepIndex]);
```

This ensures the mascot's target position is recalculated on scroll — no more stale positioning.

### Task 5: Smooth animation for guide-mode mascot movement

**File:** `supabase/src/components/Disha.tsx` (lines 249-264)

Replace the instant `move()` call with framer-motion animation:

In `DishaInner`, add a `motionPosition` state:
```ts
const [motionPos, setMotionPos] = useState<{ x: number; y: number }>(position);
```

In the existing `useEffect` (line 60-66), replace `move(...)` with:
```ts
setMotionPos({ x: guideTargetPosition.x, y: guideTargetPosition.y });
```

Change `freddyStyle` to use `motionPos` when in free/guide mode:
```ts
const freddyStyle = isFreeOrGuide && effectivePosition ? {
  position: 'fixed' as const,
  top: effectivePosition.y - mascotHalf,
  left: effectivePosition.x - mascotHalf,
  bottom: 'auto',
} : {};
```

Wrap the mascot `motion.div` (line 343) with framer-motion `animate`:
```tsx
<motion.div
  animate={isFreeOrGuide && effectivePosition ? {
    top: effectivePosition.y - mascotHalf,
    left: effectivePosition.x - mascotHalf,
  } : undefined}
  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
  ...
>
```

Use `position: 'fixed'` in `freddyStyle` instead of `absolute` so the spring animation works correctly against the viewport (not a scroll container).

### Task 6: Enable first-time visitor greetings

**File:** `supabase/src/components/DishaOnboardingTips.ts`

1. Change `AUTO_OPEN_TIPS = false` to `true`
2. Add `'auth'` to `actionPages` array (line 32-37)
3. Add greeting entries for auth pages:
```ts
const greeting: Record<string, { message: string; mood: DishaMood }> = {
  // ... existing entries ...
  auth: {
    message: "Hi! I'm Freddy 👋 Ready to help you get set up. Tap any highlighted field for tips!",
    mood: 'playful',
  },
}
```
4. Fix the greeting lookup: `pageContext` returns `'public_landing'` in the greeting object but the type is `'public-landing'` — fix the key to match.

### Task 7: Improve context-aware messaging

**File:** `supabase/src/components/DishaOnboardingTips.ts`

Replace generic idle messages with page-context-aware messages:

```ts
const pageContextMessages: Record<string, Array<{ message: string; mood: DishaMood }>> = {
  'public-landing': [
    { message: "Ready to ship? Tap 'I Want to Ship Goods' to post your first load.", mood: 'excited' },
    { message: "Have a truck? Tap 'I Have Truck Space' to start earning.", mood: 'playful' },
  ],
  'shipper': [
    { message: "Tip: Use filters to narrow down trucks by route and capacity!", mood: 'thinking' },
    { message: "Your credit score unlocks better rates — check it in your profile!", mood: 'playful' },
  ],
  'trucker': [
    { message: "Tip: Post a trip to get matched with shippers automatically!", mood: 'excited' },
    { message: "Browse loads by route to find profitable trips near you.", mood: 'listening' },
  ],
  'auth': [
    { message: "Take your time — I'll guide you through each step.", mood: 'listening' },
    { message: "Questions? Just tap me and I'll help out!", mood: 'idle' },
  ],
}
```

Update the idle behavior in `Disha.tsx` (line 181-203) to use context-aware messages.

### Task 8: Add scroll listener for non-guide idle positioning

**File:** `supabase/src/components/Disha.tsx` (after line 179, inside the collision-avoidance useEffect)

Add a scroll listener that, when in non-guide mode, keeps the mascot in its safe bottom-left zone:
```ts
useEffect(() => {
  if (dismissed || minimized || guideState?.isActive) return;
  const handleScroll = () => {
    // Re-check collision avoidance on scroll
    const mascotEl = document.querySelector('[data-disha-root] [data-disha-mascot]');
    if (!mascotEl) return;
    const criticalEls = document.querySelectorAll<HTMLElement>('[data-avoid-disha]');
    const mascotRect = mascotEl.getBoundingClientRect();
    let needsReposition = false;
    criticalEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (
        mascotRect.left < rect.right && mascotRect.right > rect.left &&
        mascotRect.top < rect.bottom && mascotRect.bottom > rect.top
      ) {
        needsReposition = true;
      }
    });
    if (needsReposition) {
      move(0, -60);
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, [position, guideState?.isActive, minimized, dismissed, move]);
```

### Task 9: Improve guide bubble positioning during guide mode

**File:** `supabase/src/components/Disha.tsx` (lines 276-341)

Currently the bubble is positioned using `bubbleStyle` with a hardcoded `-140px` offset (line 256). During guide mode, the bubble should be positioned relative to the mascot's position (not the target element), with the arrow pointing toward the target.

Update `bubbleStyle` to compute the correct offset dynamically:
```ts
const bubbleStyle = isFreeOrGuide && effectivePosition ? {
  transform: `translate(${effectivePosition.x}px, ${effectivePosition.y - mascotSize - 20}px)`,
} : {};
```

This positions the bubble above the mascot, with enough offset to not overlap the avatar.

### Task 10: Add guide target position recalculation on DOM mutations

**File:** `supabase/src/components/DishaGuideProvider.tsx`

Add a `useEffect` that uses `MutationObserver` to detect DOM changes and recalculate guide positions:
```ts
useEffect(() => {
  if (!state.isActive) return;
  const observer = new MutationObserver(() => {
    guideEngine.recalculatePosition();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}, [state.isActive, state.currentStepIndex]);
```

This handles cases where form fields or CTAs are rendered late (e.g., after a fade-in animation or conditional render).

### Task 11: Widen `data-guide` selectors on auth pages

**File:** `supabase/src/pages/auth/Register.tsx` (line 394-400)

Add `data-guide="submit"` to the submit button:
```tsx
<button
  type="submit"
  data-guide="submit"
  disabled={loading || !isLoaded || !firstName || !email || !password}
  ...
>
```

This matches the guide engine's fallback selector `button[type="submit"]` and provides a specific hook.

## Z-Index & Collision Matrix (unchanged)

| Element | z-index | Interaction |
|---|---|---|
| DockNav | z-[100] | Bottom navigation — mascot below |
| MobileTabBar | z-[100] | Mobile bottom bar — mascot below |
| **Disha mascot** | z-[9999] | Bottom-left safe zone, animates to targets |
| **Disha bubble** | z-[80] | Above mascot when guide active |
| **Disha spotlight** | z-[9998] | Overlay during guide steps |
| **Disha arrow** | z-[9997] | SVG overlay pointing to targets |
| Disha help panel | z-[200] | Modal when opened via tap |

## Validation Checklist

- [ ] Auth pages render mascot at 150px (`size="lg"`)
- [ ] GuideBotFab removed from ALL public pages
- [ ] Mascot smoothly animates (spring) to target elements during guide flows
- [ ] Mascot position recalculates on scroll when guide is active
- [ ] Mascot position recalculates on DOM mutations (late-rendered elements)
- [ ] First-time visitor sees greeting bubble on landing, auth, shipper, trucker pages
- [ ] Idle messages are context-aware per page type
- [ ] Collision avoidance (`data-avoid-disha`) triggers on scroll
- [ ] Guide flows start on auth pages (signup flow targets email/password/name fields)
- [ ] Submit button on Register has `data-guide="submit"`
- [ ] Build compiles: `pnpm run build`
- [ ] Type-check passes: `npx tsc --noEmit`
