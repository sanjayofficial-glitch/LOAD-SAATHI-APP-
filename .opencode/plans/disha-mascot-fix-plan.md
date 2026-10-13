# Disha/Freddy Mascot System — Comprehensive Fix Plan

## Problem Summary

The mascot system has 7 major categories of issues:
1. **Bubble disconnected from mascot** — appears at wrong position, not anchored to mascot
2. **Guide "Next" button broken** — hides bubble instead of advancing step
3. **No interaction awareness** — mascot doesn't react to typing, clicking, form filling
4. **Mobile responsiveness** — too large, blocks UI, no responsive sizing
5. **UI overlap** — covers buttons/forms, no intelligent avoidance
6. **Missing animations** — some moods map to non-existent animations
7. **Code quality bugs** — dead code, memory leaks, performance issues

---

## Phase 1: Fix Bubble Positioning (Critical)

### Problem
- In guide mode, bubble positions near guide target, NOT near mascot
- In free mode, bubble uses hardcoded `bottom-24 left-6` classes
- `bubbleSide` always defaults to `'top'` regardless of viewport space
- Speech bubble arrow misalignment on left/right sides

### Solution

**File: `Disha.tsx`**
- Compute bubble position relative to mascot's actual rendered position (not guide target)
- Use `getBoundingClientRect()` on mascot element to get real-time position
- Position bubble above mascot by default, but flip to bottom if mascot is near top of viewport
- Position bubble left/right if mascot is near screen edge
- Remove hardcoded `bottom-24 left-6` classes — always position relative to mascot

**File: `DishaSpeechBubble.tsx`**
- Fix `left`/`right` side arrow alignment — remove `translate-x-1/2` that causes misalignment
- Add `max-w-[min(28rem,calc(100vw-2rem))]` for mobile overflow prevention
- Add `pointer-events-auto` to bubble container (not just buttons)

---

## Phase 2: Fix Guide Step Advancement (Critical)

### Problem
- "Next" button calls `setShowBubble(false)` instead of `guideEngine.nextStep()`
- Guide engine's `recalculatePosition()` discards the result (dead code)
- `handleClick` uses substring matching on CSS selectors (false positives)

### Solution

**File: `Disha.tsx`**
- Wire "Next" button to call `guideEngine.nextStep()` from context
- Add `nextStep` and `dismissStep` to `DishaContextValue`
- Expose these from `DishaContext`

**File: `DishaGuideEngine.ts`**
- Fix `recalculatePosition()` to actually store and return the computed position
- Fix `handleClick` to use exact element matching instead of substring: `document.querySelector(step.target) === element`
- Add `stepNumber` computed property to `GuideStep` (derived from flow steps array)

**File: `DishaContext.tsx`**
- Add `nextStep: () => void` and `dismissStep: () => void` to context value
- Clean up `setTimeout` in `triggerErrorReaction`/`triggerSuccessReaction` with refs

---

## Phase 3: Add Interaction Awareness (High Priority)

### Problem
- Mascot doesn't react to user typing, clicking, form filling
- `useMascotFormWatcher` has duplicate listener bugs and only polls when guide is NOT active
- No reaction to button clicks, navigation, or successful actions

### Solution

**File: `useMascotFormWatcher.ts`**
- Fix duplicate listener bug: use `AbortController` or cleanup function for interval
- Remove `processedFields` guard that prevents re-attaching to dynamically added elements
- Add `input` event listener (not just `focus`/`blur`) for real-time typing detection
- Trigger reactions on: first keystroke, validation success, validation error, field completion
- Add `data-mascot-watch` attribute to form fields for automatic detection

**File: `DishaContext.tsx`**
- Add `triggerReaction(name: string)` method that maps reaction names to moods + messages
- Add reaction triggers for: `field-focus`, `field-complete`, `validation-error`, `validation-success`, `button-click`, `navigation`
- Increase mood reset timer from 600ms to 2000ms so reactions are visible

**File: `Disha.tsx`**
- Add `useEffect` that listens for `click` events on `document` to detect button clicks
- Show contextual tips when user hesitates on a field for >5 seconds
- Add "thinking" reaction when user starts typing, "celebrate" when field is valid

---

## Phase 4: Mobile Responsiveness (High Priority)

### Problem
- Mascot size fixed at 150px (lg) — too big for mobile
- No auto-sizing based on viewport
- Bubble `max-w-[28rem]` overflows on small screens
- Overlap avoidance only moves up 60px — not intelligent

### Solution

**File: `Disha.tsx`**
- Auto-select mascot size based on viewport width:
  - `< 360px`: `sm` (88px)
  - `360-768px`: `md` (112px)
  - `> 768px`: `lg` (150px)
- Add `useMediaQuery` hook to detect mobile viewport
- Reduce mascot size by 20% during active guide (to avoid blocking target element)

**File: `DishaSpeechBubble.tsx`**
- Change `max-w-[28rem]` to `max-w-[min(28rem,calc(100vw-2rem))]`
- Reduce padding on mobile: `px-3 py-2` instead of `px-4 py-3`
- Use `text-xs` instead of `text-sm` on mobile

**File: `DishaGuideEngine.ts`**
- Make `MASCOT_SIZE` dynamic — accept as parameter from `Disha` component's `size` prop
- Add mobile-specific positioning: on small screens, position mascot below target instead of beside it

---

## Phase 5: UI Overlap Avoidance (High Priority)

### Problem
- Mascot blocks form fields and buttons
- Overlap check only fires on scroll/position change, not on resize or DOM changes
- `move(0, -60)` always moves up — no intelligent direction selection
- `zIndex: 9999/10000` may overlay modals/dialogs

### Solution

**File: `Disha.tsx`**
- Add `ResizeObserver` to detect viewport size changes
- Add `MutationObserver` to detect DOM changes (new elements, layout shifts)
- Implement intelligent overlap avoidance:
  - Check all `[data-avoid-disha]` elements
  - If overlap detected, try moving: up, down, left, right (in order of least displacement)
  - If no direction works, minimize mascot temporarily
- Reduce `zIndex` to `z-[100]` (below modals which typically use `z-[200+]`)

**File: `DishaGuideEngine.ts`**
- Add `data-avoid-disha` attribute to all form inputs, buttons, and navigation elements
- Export a `markElementAsAvoidable(element)` utility for pages to register avoidable elements

---

## Phase 6: Fix Animations and Reactions (Medium Priority)

### Problem
- `'playful'`, `'celebrate'`, `'confused'` moods may map to non-existent Freddy animations
- Mood reset timer (600ms) too short — reactions not visible
- `setMood` and `setGuideMood` conflict (both write to same state)

### Solution

**File: `FreddyAvatar.tsx`**
- Verify all 12 mood mappings against actual Freddy animation library
- Add fallback: if animation doesn't exist, use `'idle'` + visual indicator (bounce, glow)
- Add new animations to `freddy.avatar.ts` for missing moods: `celebrate`, `confused`, `playful`

**File: `DishaContext.tsx`**
- Increase mood reset timer from 600ms to 2000ms
- Separate `guideMood` from `mood` — guide mood should override but not conflict
- Add `reactionQueue` to prevent overlapping reactions

**File: `DishaMascot.tsx`**
- Fix `useDishaKeyboard` — make Escape key actually close the bubble
- Fix `useDishaPosition` — non-free anchors should reset to bottom-right, not top-left

---

## Phase 7: Code Quality and Performance (Medium Priority)

### Problem
- `MutationObserver` on entire `document.body` — performance intensive
- 500ms polling interval in form watcher — unnecessary CPU usage
- `targetPosition` computed on every render — DOM queries in render
- Dead code: `registerPageElements`, `void registeredElements`
- Memory leaks: `setTimeout` not cleaned up in context

### Solution

**File: `DishaGuideProvider.tsx`**
- Remove `MutationObserver` — replace with `ResizeObserver` on specific containers
- Remove dead `registerPageElements` code
- Memoize `targetPosition` with `useMemo` — only recompute on guide state change

**File: `useMascotFormWatcher.ts`**
- Replace 500ms polling with `MutationObserver` on form container
- Add cleanup for all event listeners on unmount
- Use `requestIdleCallback` for non-critical watcher tasks

**File: `DishaContext.tsx`**
- Add `useRef` for `setTimeout` IDs — cleanup on unmount
- Memoize context value with proper dependencies

---

## Phase 8: Context Awareness — Page and Action Detection (Medium Priority)

### Problem
- `detectPageContext` only detects broad page types, not specific user actions
- No flows for `/messages`, `/favorites`, `/credit-score`, `/admin` pages
- `browse-shipments` and `browse-trips` flows never auto-start
- `pageContextMessages` missing entries for several contexts

### Solution

**File: `DishaContext.tsx`**
- Enhance `detectPageContext` to detect sub-states:
  - `/shipper/post-shipment` → `'shipper-post'`
  - `/trucker/post-trip` → `'trucker-post'`
  - `/messages` → `'messages'`
  - `/favorites` → `'favorites'`
- Add `pageContextMessages` entries for all contexts

**File: `DishaGuideEngine.ts`**
- Add guide flows for: `/messages`, `/favorites`, `/credit-score`
- Enable `autoStart: true` for `browse-shipments` and `browse-trips`
- Add `data-guide` attributes to key elements in these pages

**File: `DishaOnboardingTips.ts`**
- Add idle messages for `'shipper-post'`, `'trucker-post'`, `'messages'`, `'favorites'`
- Fix `showGreeting` to include `'public-landing'`

---

## Implementation Order

1. **Phase 1** (Bubble positioning) — Most visible issue
2. **Phase 2** (Guide advancement) — Core functionality broken
3. **Phase 4** (Mobile responsiveness) — Blocks user workflow
4. **Phase 5** (UI overlap) — Blocks user workflow
5. **Phase 3** (Interaction awareness) — Core value proposition
6. **Phase 6** (Animations) — Polish
7. **Phase 8** (Context awareness) — Coverage
8. **Phase 7** (Code quality) — Maintenance

## Files to Modify

| File | Phases | Effort |
|------|--------|--------|
| `Disha.tsx` | 1, 2, 3, 4, 5, 6 | Large |
| `DishaSpeechBubble.tsx` | 1, 4 | Small |
| `DishaGuideEngine.ts` | 2, 4, 5, 8 | Medium |
| `DishaContext.tsx` | 2, 3, 6, 7, 8 | Medium |
| `DishaGuideProvider.tsx` | 7 | Small |
| `FreddyAvatar.tsx` | 6 | Small |
| `DishaMascot.tsx` | 6 | Small |
| `useMascotFormWatcher.ts` | 3, 7 | Medium |
| `DishaOnboardingTips.ts` | 8 | Small |
| `freddy.avatar.ts` | 6 | Medium |

## Verification Plan

1. **Bubble positioning**: Open mascot on desktop + mobile — bubble should always be adjacent to mascot
2. **Guide advancement**: Start guide → click "Next" → step should advance, not just hide bubble
3. **Interaction awareness**: Type in a form field → mascot should show "thinking" → "celebrate" on valid input
4. **Mobile**: Open on 375px viewport → mascot should be 88px, not 150px
5. **Overlap**: Mascot should not cover form fields or buttons
6. **Animations**: All 12 moods should have distinct visual animations
