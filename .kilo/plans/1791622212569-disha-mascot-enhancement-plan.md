# LoadSaathi Mascot / Guide Bot Enhancement Plan

## Goal

Transform Disha (the Freddy mascot) into a first-time-user onboarding companion and autonomous guide that:
1. Guides new users through the **full registration → role selection → profile completion → first action** flow
2. **Autonomously** interacts with users (lively, reactive, contextual) — not just on tap
3. Shows **emotional reactions** (mood changes + bubble messages) when users seem confused or do something unusual
4. Shows a **clean "How may I help you?"** bubble on tap — no weird scaling/popping
5. **Never overlaps** ScrollToTopFab, FloatingCTA, MobileTabBar, DockNav, or homepage PlatformTabs
6. **Removes GuideBotFab** (question mark) from the home screen
7. Maintains a **150px** avatar size

---

## Affected Files

| File | Role |
|---|---|
| `supabase/src/components/Disha.tsx` | Main mascot component — size, positioning, tap behavior, bubble rendering |
| `supabase/src/components/DishaContext.tsx` | Global state — pageContext, mood, tip, position, new interaction tracking |
| `supabase/src/components/DishaOnboardingTips.ts` | Auto-greetings per page context |
| `supabase/src/components/DishaHelpPanel.tsx` | "How may I help you?" panel — make it clean & contextual |
| `supabase/src/components/DishaSpeechBubble.tsx` | Speech bubble component |
| `supabase/src/components/DishaMascot.tsx` | Mood hooks, position clamping, keyboard handlers |
| `supabase/src/components/DishaGuideEngine.ts` | Guide step definitions (signup flow, auth page steps) |
| `supabase/src/components/PublicLayout.tsx` | Remove GuideBotFab on home route |
| `supabase/src/components/Layout.tsx` | Remove GuideBotFab (or keep only on specific pages) |
| `supabase/src/App.tsx` or `supabase/src/routes.tsx` | Optionally wrap auth pages in DishaProvider |
| `supabase/src/pages/auth/Register.tsx` | Add `data-guide` attributes for mascot targeting |
| `supabase/src/pages/auth/ChooseRole.tsx` | Add `data-guide` attributes |
| `supabase/src/pages/auth/OnboardingFlow.tsx` | Add `data-guide` attributes |
| `supabase/src/features/home/sections/PlatformTabs.tsx` | Add `data-avoid-disha` attribute |

---

## Task List

### Task 1: Set mascot size to ~150px

**File:** `supabase/src/components/Disha.tsx`, line 118

```ts
// FROM:
const sizeMap: Record<string, number> = { sm: 88, md: 112, lg: 160, xl: 200 }
const mascotSize = sizeMap[size] ?? 160

// TO:
const sizeMap: Record<string, number> = { sm: 88, md: 112, lg: 150, xl: 200 }
const mascotSize = sizeMap[size] ?? 150
```

### Task 2: Remove GuideBotFab (question mark icon) from the home screen

**File:** `supabase/src/components/PublicLayout.tsx`

1. Add `useLocation` import at top:
```ts
import { useLocation } from "react-router-dom";
```

2. In `PublicLayoutInner`, add:
```ts
const location = useLocation();
const isHomePage = location.pathname === '/';
```

3. At line 341, conditionally render:
```tsx
// FROM:
<GuideBotFab />

// TO:
{!isHomePage && <GuideBotFab />}
```

> **Also remove GuideBotFab from Layout.tsx (line 563)** — the authenticated Layout also renders `<GuideBotFab />`. Since Disha now handles all guidance, remove the redundant GuideBotFab from Layout.tsx as well to avoid duplicate help buttons everywhere.

### Task 3: Fix tap behavior — clean "How may I help you?" bubble

**File:** `supabase/src/components/Disha.tsx`

#### 3a. Remove the `justTriggered` scale animation

**Lines 49, 75-81, 299:**

```ts
// Remove line 49:
// const [justTriggered, setJustTriggered] = useState(false)

// Change handleClick (lines 75-81):
const handleClick = useCallback(() => {
  if (dismissed) return
  setOpenHelp(true)
  setMood('listening')
  // Show "How may I help you?" message in the bubble
  setTip({
    message: "How may I help you? I can guide you through posting a load, finding trucks, or answer questions about the platform.",
    mood: 'listening',
    when: 'help-open',
  })
  setShowBubble(true)
}, [dismissed, setOpenHelp, setMood, setTip, setShowBubble])

// Remove from className (line 299):
// justTriggered && 'scale-110',
```

#### 3b. Replace the help panel with a clean, contextual "How may I help you?" panel

**File:** `supabase/src/components/DishaHelpPanel.tsx`

Replace the preset `TIPS` array with context-aware help options that reference actual page buttons/features. The panel already accepts `open`/`onClose`/`mood`/`accent` props. Restructure the content to show:

1. A clean header: "How may I help you?" with a friendly icon
2. Context-aware quick actions based on `pageContext`:
   - `public-landing`: "Post a shipment", "Find trucks", "Check pricing", "How it works"
   - `shipper`: "Post a load", "Browse trucks", "View my shipments", "Credit score"
   - `trucker`: "Post a trip", "Browse loads", "My trips", "Check earnings"
   - `auth`: "Need help signing up?", "Forgot password?", "Choose your role"
   - Default: "Browse features", "How it works", "Contact support"

Pass `pageContext` to the help panel. In `Disha.tsx` line 316:
```tsx
<DishaHelpPanel 
  open={openHelp} 
  onClose={handleCloseHelp} 
  mood={mood} 
  accent={accent}
  pageContext={pageContext}
/>
```

### Task 4: Fix mascot positioning — no overlap with floating buttons

**File:** `supabase/src/components/Disha.tsx`

#### 4a. Change the default anchor position

**Line 114:**
```ts
// FROM:
const bubblePositionClasses = effectiveAnchor === 'free' ? '' : 'bottom-6 right-4 z-[70]'

// TO:
// Reserve space on the right side where FloatingCTA/ScrollToTopFab live.
// Move mascot to bottom-left (safe zone) with high z-index above the dock/nav.
const bubblePositionClasses = effectiveAnchor === 'free' 
  ? '' 
  : 'bottom-24 left-6 z-[80] md:bottom-6 md:left-6'
```

This moves the mascot to the **bottom-left**, which:
- Avoids `FloatingCTA` (right-4, z-[95])
- Avoids `ScrollToTopFab` (right-4, z-[90])
- Avoids `GuideBotFab` (bottom-20 right-4 — now removed)
- On mobile, `bottom-24` (96px) clears the `MobileTabBar` (z-[100], ~80px tall, bottom-2)
- On desktop, `bottom-6` clears the `DockNav` (bottom-3, z-[100])

#### 4b. Ensure mascot z-index is above all nav but below modals

**Line 201:**
```ts
// FROM:
style={{ zIndex: guideState?.isActive ? 10000 : 9999 }}

// TO:
style={{ zIndex: guideState?.isActive ? 10000 : 9999 }}
```

This is already correct — mascot (z-9999) is above DockNav (z-[100]), MobileTabBar (z-[100]), FloatingCTA (z-[95]), ScrollToTopFab (z-[90]).

#### 4c. Add collision avoidance for dynamic page content

Add a `useEffect` in `Disha.tsx` that checks for elements with `data-avoid-disha` and nudges the mascot away:

```ts
// Add inside DishaInner component (after existing useEffects)
useEffect(() => {
  if (dismissed || minimized || guideState?.isActive) return;
  
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
    // Move to opposite side if overlapping
    move(0, -60); // nudge upward
  }
}, [position, guideState?.isActive, minimized, dismissed, move]);
```

Add `data-disha-mascot` attribute to the mascot div (line 283).

### Task 5: Add `data-avoid-disha` to PlatformTabs (fix Tab 2 overlap)

**File:** `supabase/src/features/home/sections/PlatformTabs.tsx`

**Line 65:**
```tsx
// FROM:
<section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative overflow-hidden">

// TO:
<section data-avoid-disha className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative overflow-hidden">
```

Also add `data-avoid-disha` to any other homepage sections that are at the bottom of the viewport and could overlap the mascot.

### Task 6: Wrap auth pages in DishaProvider for first-time user guidance

**File:** `supabase/src/routes.tsx`

The auth pages (`/login`, `/register`, `/choose-role`, `/onboarding`) are currently standalone routes (lines 113-117). They need `DishaProvider` + `DishaGuideProvider` to render the mascot.

**Option A (simpler): Create an AuthLayout wrapper**

Create `supabase/src/components/AuthLayout.tsx`:
```tsx
import { Suspense } from "react";
import { DishaProvider, Disha } from "./Disha";
import { DishaGuideProvider } from "./DishaGuideProvider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <DishaProvider>
      <DishaGuideProvider>
        {children}
        <Disha accent="orange" size="sm" />
      </DishaGuideProvider>
    </DishaProvider>
  );
}
```

**Option B (modify routes.tsx):** Wrap auth routes:
```tsx
// In routes.tsx, add import:
import AuthLayout from "./components/AuthLayout";

// Wrap auth routes:
{/* FROM: */}
<Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
<Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />
<Route path="/choose-role" element={<ErrorBoundary><ChooseRole /></ErrorBoundary>} />
<Route path="/onboarding" element={<ErrorBoundary><OnboardingFlow /></ErrorBoundary>} />
<Route path="/forgot-password" element={<ErrorBoundary><ForgotPassword /></ErrorBoundary>} />

{/* TO: */}
<Route element={<AuthLayout />}>  {/* or wrap each individually */}
  <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
  <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />
  <Route path="/choose-role" element={<ErrorBoundary><ChooseRole /></ErrorBoundary>} />
  <Route path="/onboarding" element={<ErrorBoundary><OnboardingFlow /></ErrorBoundary>} />
  <Route path="/forgot-password" element={<ErrorBoundary><ForgotPassword /></ErrorBoundary>} />
</Route>
```

### Task 7: Add `data-guide` attributes to auth page form elements

The guide engine (`DishaGuideEngine.ts` lines 573-646) already has a `signup` flow targeting selectors like `[name="email"]`, `[data-guide="email"]`, etc. But the auth pages don't have matching `data-guide` attributes on their form elements.

**File:** `supabase/src/pages/auth/Register.tsx`

Add `data-guide` attributes to:
- Email input (line 309 area): `data-guide="email"`
- Password input: `data-guide="password"`
- First name input: `data-guide="fullName"`
- Phone (choose-role): `data-guide="phone"`

**File:** `supabase/src/pages/auth/ChooseRole.tsx`

Add `data-guide` attributes to:
- Shipper button (line 171): `data-guide="role-shipper"`
- Trucker button (line 190): `data-guide="role-trucker"`
- Mentor checkbox (line 205): `data-guide="mentor"`

**File:** `supabase/src/pages/auth/OnboardingFlow.tsx`

Add `data-guide` attributes to:
- Name input (line 300): `data-guide="fullName"`
- Phone input (line 320): `data-guide="phone"`
- Company input (line 368): `data-guide="company"`
- Save button (line 377): `data-guide="complete-onboarding"`

### Task 8: Auto-start the signup guide flow for first-time users

**File:** `supabase/src/components/DishaGuideEngine.ts`

The `signup` flow already exists (lines 573-646) with `autoStart: true` and `oncePerUser: true`. It targets `/register`, `/choose-role`, `/onboarding`, `/forgot-password`.

**Verify the flow is correct:**
- `signup.oncePerUser = true` means it only runs once per user (good for first-time)
- `signup.autoStart = true` means it starts automatically when the user lands on those pages
- The steps target form elements by name and `data-guide` attributes

**No changes needed** to the flow definition itself — just ensure `data-guide` attributes are added to the auth pages (Task 7).

### Task 9: Context-aware autonomous interactions (lively mascot)

**Files:** `supabase/src/components/Disha.tsx`, `supabase/src/components/DishaContext.tsx`, `supabase/src/components/DishaOnboardingTips.ts`

#### 9a. Add autonomous idle behaviors

In `Disha.tsx`, add an idle timer that triggers random moods and tips:

```ts
useEffect(() => {
  if (dismissed || minimized || guideState?.isActive || openHelp) return;
  
  const idleMessages = [
    { message: "Need help finding the right load?", mood: 'idle' as DishaMood },
    { message: "Tip: Use filters to narrow down routes by city!", mood: 'thinking' as DishaMood },
    { message: "Your credit score unlocks better rates — check it in profile!", mood: 'playful' as DishaMood },
  ];
  
  const interval = setInterval(() => {
    // Only show tip if user has been idle (no mouse movement) for 30s
    if (idleTracker.isIdle()) {
      const randomMsg = idleMessages[Math.floor(Math.random() * idleMessages.length)];
      setTip(randomMsg);
      setShowBubble(true);
      setTimeout(() => {
        setMood('idle');
        setShowBubble(false);
      }, 8000);
    }
  }, 30000); // check every 30s
  
  return () => clearInterval(interval);
}, [dismissed, minimized, guideState?.isActive, openHelp, setTip, setShowBubble, setMood]);
```

#### 9b. Add idle detection

Create `supabase/src/hooks/useIdleDetection.ts`:
```ts
import { useState, useEffect, useCallback } from 'react';

export function useIdleDetection(timeout = 30000) {
  const [idle, setIdle] = useState(false);
  const [lastActive, setLastActive] = useState(Date.now());

  const reset = useCallback(() => {
    setLastActive(Date.now());
    setIdle(false);
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const timer = setInterval(() => {
      if (Date.now() - lastActive > timeout) {
        setIdle(true);
      }
    }, 5000);

    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    return () => {
      clearInterval(timer);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [lastActive, reset, timeout]);

  return { idle, reset };
}
```

#### 9c. Confusion / error detection

In `DishaContext.tsx`, add a `triggerReaction` that page components can call when something goes wrong:

```ts
const triggerErrorReaction = useCallback((message: string) => {
  setMood('confused');
  setTip({ message, mood: 'confused', when: 'error' });
  setShowBubble(true);
  setTimeout(() => setMood('idle'), 5000);
}, [setMood, setTip, setShowBubble]);

const triggerSuccessReaction = useCallback((message: string) => {
  setMood('celebrate');
  setTip({ message, mood: 'celebrate', when: 'success' });
  setShowBubble(true);
  setTimeout(() => setMood('idle'), 5000);
}, [setMood, setTip, setShowBubble]);
```

Add these to the context value. Then form components can call `triggerErrorReaction("Hmm, that email doesn't look right. Try again?")` when validation fails.

### Task 10: Hide the speech bubble during guide mode, show only the mascot

**File:** `supabase/src/components/Disha.tsx`

The guide mode (`guideState?.isActive`) currently shows a spotlight + arrow + bubble. The user wants the bubble to be cleaner. When a guide step is active, the bubble should show the guide step message — but not pop like a notification.

**Lines 229-281:** Make the bubble conditional — only show during guide steps OR when `tip` is set, not both simultaneously:

```tsx
{!minimized && !dismissed && showBubble && (tip || guideStep) && (
  <motion.div ...>
    <DishaSpeechBubble ...>
      {/* Guide step takes priority, otherwise show tip */}
      {guideStep?.message || tip?.message}
      ...
    </DishaSpeechBubble>
  </motion.div>
)}
```

This already works correctly — `guideStep?.message || tip?.message` on line 247 handles priority. The main change is ensuring the bubble doesn't auto-show on page load (only show when user interacts or during guide steps).

**In `DishaOnboardingTips.ts`**, disable the auto-greeting for now (or make it opt-in via a flag):

```ts
// Line 43: Add a flag
const AUTO_OPEN_TIPS = false;  // Set to true to enable auto-greetings
// ...
if (AUTO_OPEN_TIPS && isOnboardingPage && !hasSeenTip()) { ... }
```

### Task 11: Ensure Disha only renders on the home screen with clean positioning

**File:** `supabase/src/components/PublicLayout.tsx`

In `PublicLayout`, the Disha mascot renders on ALL public pages (line 342). The user wants it on the home screen, placed well. Ensure it's:
- On the home screen: shown at bottom-left safe zone
- On other public pages: positioned to avoid content

The `pageContext` detection in `DishaContext.tsx` already returns `'public-landing'` for `/` and `'public-public'` for other public pages. Use this to adjust behavior.

In `Disha.tsx`, adjust the position based on pageContext:

```ts
const isLandingPage = pageContext === 'public-landing';

const bubblePositionClasses = effectiveAnchor === 'free' 
  ? '' 
  : isLandingPage 
    ? 'bottom-24 left-6 z-[80] md:bottom-8 md:left-6'  // Home: higher up to avoid PlatformTabs
    : 'bottom-24 left-6 z-[80] md:bottom-6 md:left-6';   // Other pages: standard
```

### Task 12: Remove Disha from profile page

**File:** `supabase/src/components/Disha.tsx`, line 54/116

The mascot already hides on profile pages:
```ts
const isProfilePage = pageContext === 'profile';
// ...
if (dismissed || isProfilePage) return null;
```

This is fine — no change needed.

---

## Z-Index Stacking (after changes)

| Element | Position | z-index | Notes |
|---|---|---|---|
| MobileTabBar | bottom-2 | z-[100] | Mobile only |
| DockNav | bottom-3 | z-[100] | Desktop only |
| Layout nav | top-0 | z-[100] | Header |
| **Disha mascot** | **bottom-24 left-6** | **z-9999** | **Bottom-left, safe zone** |
| SectionNav | sticky top | z-[90] | |
| FloatingCTA | right-4 | z-[95] | Right side, no conflict |
| ScrollToTopFab | right-4 | z-[90] | Right side, no conflict |
| Disha speech bubble | bottom-left | z-[80] | Below mascot, no conflict |
| GuideBotFab | REMOVED | — | Removed from all pages |
| Disha spotlight | overlay | z-9998 | Only during guide steps |
| Disha help panel | modal | z-[200] | Only when opened |

---

## Validation Checklist

- [ ] Mascot is 150px on all pages
- [ ] GuideBotFab (question mark) is NOT on the home page (`/`)
- [ ] GuideBotFab is removed from authenticated Layout too
- [ ] Mascot is positioned bottom-left, does not overlap ScrollToTopFab, FloatingCTA, DockNav, or MobileTabBar
- [ ] Tapping mascot shows "How may I help you?" bubble + clean help panel (no scale animation)
- [ ] Auth pages (`/register`, `/choose-role`, `/onboarding`) have Disha rendered and guide flow starts
- [ ] Form fields on auth pages have `data-guide` attributes matching guide engine selectors
- [ ] `data-avoid-disha` on PlatformTabs prevents overlap
- [ ] Mascot shows emotional reactions (confusion on errors, celebration on success)
- [ ] Mascot has autonomous idle behavior (occasional mood/tip every ~30s of inactivity)
- [ ] No speech bubble auto-pops on page load (only on tap or during guide steps)
- [ ] Build compiles: `pnpm run build`
- [ ] Type-check passes: `npx tsc --noEmit`