# LoadSaathi — Mobile UI Guide (Shippers & Truckers)

**Scope:** Signed-in, post-sign-up mobile experience for the two user audiences. Admin Center and admin-only screens are explicitly out of scope. Desktop is untouched.

**Important honesty note:** No LoadSaathi source repository was found in this workspace (no repo in past projects, AI Drive, or Google Drive — only design documents, diagram archives, and a financial model). This guide is therefore built from:
- The public site (loadsaathi.in) and its five previewed product screens: Dashboard, AI Matching, Chat, Credit Score, Reviews.
- The "LOADSAATHI — FULL AUTH & ONBOARDING ARCHITECTURE" document (route tree, profile tabs, flows).
- The "Disha UI/UX Integration Guidelines" design-system document (colors, touch targets, motion, mobile patterns).

Routes listed below come from the architecture document, not from reading application source code. Everything behind sign-in is marked **unverified** where relevant. No code was changed and no lint/type-check/test commands were run, because there is no codebase to run them against.

---

## 1. Screens found, grouped by role

Evidence source: route tree in the auth & onboarding architecture document; homepage previews.

### Shared (both roles)
| Screen | Route (per architecture doc) | Status |
|---|---|---|
| Landing / homepage | `/` | ✅ Verified (public site) |
| Sign in | `/login` (Clerk) | ✅ Route documented |
| Sign up | `/register` (Clerk) | ✅ Route documented |
| Post-login role router | `/auth-sync` | ✅ Route documented |
| Role selection (Shipper / Trucker) | `/choose-role` | ✅ Route documented |
| Messages list | `/messages` | ✅ Route documented |
| Chat conversation | `/chat/:requestId` | ✅ Route documented (homepage previews Chat) |
| Profile — tabs: Overview, Reviews (trucker only), Personal Info, Security (incl. role switcher) | `/profile` | ✅ Route documented |

### Shipper
| Screen | Route | Status |
|---|---|---|
| Dashboard | `/shipper/dashboard` | ✅ Route documented (homepage previews Dashboard) |
| Post shipment | `/shipper/post-shipment` | ✅ Route documented |
| My shipments | `/shipper/my-shipments` | ✅ Route documented |
| Shipment detail | `/shipper/shipments/:id` | ✅ Route documented |
| Edit shipment | `/shipper/shipments/:shipmentId/edit` | ✅ Route documented |
| Shipment history | `/shipper/history` | ✅ Route documented |
| Browse trucks (shared) | `/browse-trucks` | ✅ Route documented (homepage previews AI Matching) |
| Trip detail (shared) | `/trips/:tripId` | ✅ Route documented |
| Notifications | **No route found** | ⚠️ Not present in documented route tree — do not build without product confirmation |
| Payments / payment history | **No route found** | ⚠️ Not in route tree (homepage previews Credit Score, which may cover reputation) |
| Tracking screen | **No route found** | ⚠️ Homepage previews a tracking-style screen, but no dedicated route is documented |

### Trucker
| Screen | Route | Status |
|---|---|---|
| Dashboard | `/trucker/dashboard` | ✅ Route documented |
| Browse shipments (find loads / bid) | `/trucker/browse-shipments` | ✅ Route documented |
| Post trip | `/trucker/post-trip` | ✅ Route documented |
| My trips | `/trucker/my-trips` | ✅ Route documented |
| Trip detail | `/trucker/trips/:tripId` | ✅ Route documented |
| Edit trip | `/trucker/trips/:tripId/edit` | ✅ Route documented |
| Trip history | `/trucker/history` | ✅ Route documented |
| Reviews (in Profile tab) | `/profile` → Reviews tab | ✅ Documented; trucker-only |
| Credit score | **No dedicated route found** | ⚠️ Homepage previews "Credit Score"; treat as dashboard/profile element, not a standalone page, until code is checked |
| Earnings | **No route found** | ⚠️ Not verified — do not invent |
| Vehicle / fleet profile | **No route found** | ⚠️ Not verified — trip posting may capture vehicle details |
| Notifications | **No route found** | ⚠️ Same as shipper |

### Admin (out of scope)
`/admin/monitoring`, `/admin/dashboard`, `/admin/users`, `/admin/moderation` — documented but excluded.

**Do not build:** notifications center, earnings page, fleet page, standalone tracking page — none are confirmed to exist. If product wants them, that is a new-feature decision, not a mobile fix.

---

## 2. Mobile usability issues found (audit)

Based on the design docs and typical desktop-first implementation patterns of this stack (Vite 6 + React 19, sidebar layout with a 320–400 px assistant panel):

1. **Sidebar navigation on mobile** — the documented desktop layout is a two-region workspace with a persistent panel. On ≤ 430 px this either overflows or forces horizontal scrolling.
2. **Disha assistant panel** — 320–400 px web panel plus ≥ 60 % workspace requirement cannot coexist on a phone. Guidelines already prescribe a bottom-sheet (Peek / Half / Full) for mobile — this must actually be implemented.
3. **Dense data grids** — dashboards, my-shipments, browse-shipments, and history are list/table-driven; wide tables become unreadable on 320 px without card reflow.
4. **Multi-column forms** — post-shipment and post-trip forms with pickup/destination/cargo/weight/timing fields will cramp or scroll horizontally at 320 px if using desktop column grids.
5. **No mobile navigation pattern documented for core destinations** — the design doc only covers the Disha assistant's nav; Home/Loads/Messages/Profile need an explicit mobile pattern (the island bar below).
6. **Profile tabs** — four tabs (Overview, Reviews, Personal Info, Security) must become swipeable/scrollable segmented control on mobile, not cramped equal-width tabs.
7. **Keyboard overlap risk** — chat input and form fields at the bottom will be covered by the mobile keyboard without `visualViewport` handling.
8. **Touch targets** — guidelines require ≥ 44 × 44 px; desktop-sized buttons/links (typically 32–36 px) fail this.

---

## 3. Mobile-specific design specification

### 3.1 Island navigation bar (the core change)

A floating, rounded "island" bar near the bottom of the screen, shown **only at mobile breakpoints** (≤ 768 px). Desktop keeps its existing sidebar/navigation untouched.

**Destinations per role (4 items, using only confirmed routes):**

| Slot | Shipper | Trucker |
|---|---|---|
| 1 — Home | `/shipper/dashboard` | `/trucker/dashboard` |
| 2 — Loads / Shipments | `/shipper/my-shipments` (label "Shipments") | `/trucker/browse-shipments` (label "Find Loads") |
| 3 — Messages | `/messages` | `/messages` |
| 4 — Profile | `/profile` | `/profile` |

Rationale per role:
- **Shipper:** posting a shipment is the primary action → surfaced as a floating action button (FAB) or prominent dashboard card, not a 5th tab, keeping the island at 4 items.
- **Trucker:** "Find Loads" (browse-shipments) is the revenue path → gets slot 2. My Trips, Post Trip, and History are reachable from the trucker dashboard as cards/shortcuts, matching "keep secondary destinations in the existing menu pattern."

**Active state:** filled icon + label in Orange `#FF6B1A` with a small dot or pill background; inactive icons in Navy `#0B1F3A` at reduced opacity. Use `aria-current="page"` on the active link.

**Component snippet (React + plain CSS, no new dependencies):**

```tsx
// MobileIslandNav.tsx — render only inside the mobile layout
const NAV: Record<string, {to: string; label: string; icon: JSX.Element}[]> = {
  shipper: [
    { to: "/shipper/dashboard",      label: "Home",      icon: <HomeIcon /> },
    { to: "/shipper/my-shipments",   label: "Shipments", icon: <BoxIcon /> },
    { to: "/messages",               label: "Messages",  icon: <ChatIcon /> },
    { to: "/profile",                label: "Profile",   icon: <UserIcon /> },
  ],
  trucker: [
    { to: "/trucker/dashboard",       label: "Home",       icon: <HomeIcon /> },
    { to: "/trucker/browse-shipments",label: "Find Loads", icon: <SearchIcon /> },
    { to: "/messages",                label: "Messages",   icon: <ChatIcon /> },
    { to: "/profile",                 label: "Profile",    icon: <UserIcon /> },
  ],
};

export function MobileIslandNav({ role }: { role: "shipper" | "trucker" }) {
  return (
    <nav className="island-nav" aria-label="Primary">
      {NAV[role].map(({ to, label, icon }) => (
        <a key={to} href={to} aria-current={isActive(to) ? "page" : undefined}>
          {icon}
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}
```

```css
/* Mobile-only: desktop layout is never touched */
.island-nav { display: none; }

@media (max-width: 768px) {
  .island-nav {
    display: flex;
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(12px + env(safe-area-inset-bottom, 0px)); /* respects home-indicator / gesture bars */
    width: min(calc(100% - 32px), 420px);
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.92);        /* #F8FAFC base, slight translucency */
    backdrop-filter: blur(12px);
    border: 1px solid #D9E2EC;
    border-radius: 32px;                           /* the "island" pill shape */
    box-shadow: 0 8px 24px rgba(11, 31, 58, 0.18);
    justify-content: space-between;
    z-index: 50;
  }
  .island-nav a {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-width: 56px;
    min-height: 48px;                              /* ≥ 44×44 touch target (design guideline) */
    justify-content: center;
    font-size: 11px;
    color: #0B1F3A;
    opacity: 0.65;
    border-radius: 24px;
  }
  .island-nav a[aria-current="page"] {
    opacity: 1;
    color: #FF6B1A;
    background: rgba(255, 107, 26, 0.12);
  }
  .island-nav a:focus-visible {
    outline: 2px solid #FF6B1A;
    outline-offset: 2px;
  }

  /* Island must never cover page content */
  .app-main { padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px)); }
}
```

### 3.2 Safe areas & keyboard rules

- Always offset the island by `env(safe-area-inset-bottom)` — covers iPhone home indicator and Android gesture bars.
- Page containers get bottom padding (`≈ 88px + inset`) so lists, forms, and CTAs scroll fully above the island.
- **Chat (`/chat/:requestId`)** and forms: hide the island while the keyboard is open, using the VisualViewport API:

```ts
// Hide island when the on-screen keyboard opens
const vv = window.visualViewport;
vv?.addEventListener("resize", () => {
  const keyboardOpen = window.innerHeight - vv.height > 150;
  document.querySelector(".island-nav")
    ?.classList.toggle("island-nav--hidden", keyboardOpen);
});
```

```css
.island-nav--hidden { transform: translate(-50%, 150%); transition: transform 200ms ease-out; }
```

- Chat composer: `position: sticky; bottom: 0;` inside the chat column (above the island), so the input and send button stay one-thumb reachable. Send button ≥ 44 px.
- Use `100dvh` (not `100vh`) for any full-height chat/dashboard shells so the layout tracks the keyboard.

### 3.3 Screen-by-screen reflow rules (confirmed routes only)

**`/choose-role`** — full-width stacked role cards (Shipper / Trucker), each ≥ 120 px tall with icon, one-line description, and 44 px+ tap area. No side-by-side columns below 400 px.

**`/shipper/post-shipment` & `/trucker/post-trip`** — single-column form; group fields into visual sections (Route → Cargo → Timing → Price); full-width inputs at 48 px height; sticky primary action ("Post Shipment") above the island nav; numeric keypads via `inputMode` for weight/price.

**`/shipper/my-shipments`, `/shipper/history`, `/trucker/my-trips`, `/trucker/history`** — replace desktop tables with stacked cards: route ("Pickup → Drop") as the headline, status badge (DishaStatusBadge colors), date, price. Collapse secondary fields behind card expansion. No horizontal scroll at 320 px.

**`/shipper/shipments/:id`, `/trucker/trips/:tripId`, `/trips/:tripId`** — vertically stacked info blocks: status first, then route/timeline, cargo, price, counterparty card with "Message" button; primary action (Accept / Bid / Message) as a full-width sticky button above the island.

**`/trucker/browse-shipments` (AI Matching)** — filter chips in a horizontally scrollable row (this is acceptable horizontal motion — it is a scrubber, not reading content); matched loads as cards with route, price, and match-reason highlighted; load details stacked as in the detail rule above.

**`/messages` & `/chat/:requestId`** — conversation rows at 64 px min height; chat bubbles max-width 80 %; composer sticky at bottom; island hidden while typing (3.2).

**`/profile`** — the four tabs become a scrollable segmented control; Overview stats as a 2×2 card grid; Personal Info form single-column; Security rows as tappable list items.

**Dashboard previews (Credit Score, Reviews, Dashboard)** — present reputation/credit and reviews as summary cards (score ring + rating stars + recent review snippet), not data grids; deep-link to `/profile` Reviews tab.

### 3.4 Global mobile rules

- Palette stays exactly: Navy `#0B1F3A`, Orange `#FF6B1A`, White `#F8FAFC`, Light Gray `#D9E2EC`.
- Touch targets ≥ 44 × 44 px everywhere (per Disha guidelines).
- Spacing: 16 px screen gutters, 12 px card padding minimum, 8 px minimum between adjacent tap targets.
- Motion: 200–300 ms ease-out for micro-transitions; respect `prefers-reduced-motion` (per guidelines).
- Typography: base 16 px on mobile (prevents iOS input zoom); no text below 11 px.
- Disha assistant on mobile: bottom-sheet only (Peek / Half / Full per guidelines); it must stack above the island nav without overlapping it, or occupy the Peek avatar row above the island.
- All changes scoped inside `@media (max-width: 768px)` (or the project's existing mobile breakpoint, whichever it uses — needs code confirmation).

---

## 4. Testing performed

**Not performed — no codebase access.** The 320 px / 375 px / 430 px checks, island-navigation interaction tests, form/chat keyboard tests, and desktop regression comparison require the actual application running (sign-in via Clerk, Supabase-backed data). Nothing in this guide has been executed or visually verified against the live signed-in app.

**Recommended test script once the repo is available:**
1. Signed-in shipper: visit dashboard, post-shipment (complete a form), my-shipments, shipment detail, messages + chat (type with keyboard open), profile — at 320, 375, 430 px.
2. Signed-in trucker: dashboard, browse-shipments + filters, trip detail, my-trips, post-trip, messages + chat, profile — same widths.
3. Confirm island highlights the active destination on each; confirm island hides on keyboard open in chat; confirm no content is obscured above the island.
4. Desktop ≥ 1024 px: screenshot sidebar/dashboards before and after; must be pixel-identical.
5. Run `npm run lint`, `npm run typecheck` (or `tsc --noEmit`), `npm test`.

---

## 5. Commands run and results

| Command | Result |
|---|---|
| Repository search (past projects, AI Drive, Google Drive, web) | **No codebase found** — only design docs, diagram archives, and a financial model. No lint/type-check/test commands were runnable. |
| Crawl of loadsaathi.in | Homepage rendered with minimal extractable text; five previewed screens confirmed from site content. |
| Design-document reads (auth architecture, Disha UI/UX guidelines) | Route tree, profile tabs, palette, and mobile rules extracted — used as the basis of this guide. |

---

## 6. Remaining limitations, assumptions, and follow-up checks

1. **No code verified.** All routes come from the internal architecture document. Actual component names, CSS approach (Tailwind? CSS modules?), and existing breakpoints are unknown. Follow-up: share the repo (GitHub link or zip) and this guide can be implemented and tested directly.
2. **Sign-in-dependent screens unverified.** Dashboards, forms, chat, and profile were never loaded in a signed-in state; their real field lists, statuses, and actions may differ from the architecture doc.
3. **Notifications, payments, earnings, fleet, and standalone tracking have no documented routes** and were deliberately excluded rather than invented.
4. **Credit Score appears on the homepage preview but has no documented route** — assumed to be dashboard/profile content, pending code confirmation.
5. **Bidding flow** ("browse shipments to bid on") is implied by the route name but the bid interaction itself is undocumented — verify before styling bid buttons.
6. **Breakpoint choice (768 px)** is an assumption; adopt whatever the codebase already uses.
7. **Keyboard-hide behavior** via VisualViewport needs real-device testing (iOS Safari and Android Chrome).

---

## 7. Immediate recommendations (no code required)

1. Add the island nav exactly as specified in 3.1 — it uses only confirmed routes.
2. Add bottom safe-area padding app-wide on mobile.
3. Convert all list tables to stacked cards at mobile widths.
4. Make post-shipment / post-trip forms single-column with sticky submit.
5. Hide the island during keyboard input in chat.
6. Keep desktop completely untouched — every rule above is inside a mobile media query.

---

## 8. Implementation notes (2026-11-04) — shipped in `supabase/src`

The guide above was originally written without codebase access. The repository is
now available at `supabase/src` (React 19 + TS + Tailwind + shadcn), and the
mobile-first language work has been implemented:

1. **Hindi-first language system** — `supabase/src/i18n/` (`languages.ts`,
   `dictionary.ts`, `LanguageContext.tsx`, `useT.ts`). Default language is Hindi
   (Devanagari); English and Odia are one tap away via `LanguageSwitcher`
   (segmented pill in the app header). Selection persists in localStorage
   (`loadsaathi-lang`) and sets `<html lang>`.
2. **Natural, spoken Hindi** — navigation, dashboards, empty states, and quick
   actions are written the way truckers/shippers speak (e.g. "ट्रिप डालें",
   "लोड खोजें", "कुल कमाई"), not formal translations. Odia equivalents are
   provided alongside.
3. **Icons (icons8)** — `public/icons8/*.png` (free PNG, no plan needed) used
   for the mobile tab bar, center action, quick-action buttons, and quick links.
   Auto-inverted in dark mode via `components/icons/I8.tsx`.
4. **Illustrations (icons8, free)** — `public/illustrations/*.png` used in the
   trucker + shipper dashboard first-run/empty states (`EmptyState` gained an
   `image` prop).
5. **Mobile layout upgrades** — dashboards now use a 2-column stat grid on
   phones, 56px+ action buttons, translated tab labels, and a compact header
   language switcher (the duplicate header Messages icon is hidden on mobile
   because Chat is already a tab).
6. **Native-touch CSS** — `interactive-widget=resizes-content` added to the
   viewport meta; controls get `user-select: none`/`-webkit-touch-callout`;
   inputs are 16px on coarse pointers (iOS zoom prevention).

Not shipped (out of scope): full-page i18n of every marketing page, admin
routes, and deep content pages — the dictionary covers the app chrome and both
role dashboards, which is where users spend their time.

## 9. Round-two enhancements (2026-11-04) — all shipped

1. **More free illustrations (icons8)** — now 13 total: rocket (onboarding
   welcome), shipping box / truck (role cards), chat bubble (messages empty),
   clock (history empty), search (no-results in Browse screens), delivered
   boxes / box / chat (My Shipments tabs), heart (Favorites), shield (credit
   score fallback), truck delivery / shipping box (dashboard first-run).
2. **Animated CountUp stats** — dashboard numbers count up (ease-out,
   reduced-motion aware) via `components/ui/CountUp.tsx`.
3. **Forms are now Hindi-first with a sticky mobile submit** — Post Trip and
   Post Shipment labels/CTAs translate (हिंदी/EN/ଓଡ଼ିଆ), inputs are 48px on
   mobile, and the submit action sticks above the tab bar while scrolling.
4. **Chat quick replies** — one-tap chips (भाड़ा कितना होगा? / लोड कब
   तैयार है? / गाड़ी अभी कहाँ है?) send instantly; send button enlarged to
   48×48.
5. **First-run tour verified + always reachable** — onboarding already sets
   the tour entry flag (dashboard tour → form tour). Added a "Take a tour"
   button in the mobile menu that replays it anytime.
6. **Theme toggle now always visible** in the header (was mobile-hidden).
7. **Map rendering** — `preferCanvas` enabled for smoother pan/zoom on
   phones. Basemaps stay keyless OSM/Esri (CARTO now requires a key).

## 10. Suggestions round (2026-11-04) — shipped

1. **Hindi-first spread to core screens** — Trucker Hub (tabs + Accept/
   Decline/Edit/Delete/Mark Delivered/Trip Completed), Browse Shipments &
   Browse Trips (search, sort, filters, View), TripDetail (Book Space /
   Send Booking Request / live location / reviews), ShipmentDetail (Send
   Offer / Rate Trucker), Profile tabs + Get verified. Hub empty states got
   illustrations (forklift / box / chat bubble).
2. **Voice input** — new `hooks/useSpeechToText.ts` (Web Speech, hi-IN):
   mic button on the Post Load goods field ("बोलकर भरें") and a mic button
   in chat that fills the composer.
3. **Offline drafts** — Post Trip and Post Load now save to sessionStorage
   (debounced), restore after an accidental refresh with a toast, and clear
   on successful submit.
4. **Deferred (need human/ops):** real-device QA, Odia proofreading, push
   notification translations (VAPID key not configured), public `/hi`
   homepage expansion, and a full contrast/focus audit.

*Prepared 2026-11-04.*
