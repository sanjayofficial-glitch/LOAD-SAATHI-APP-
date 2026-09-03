# Mobile UI Optimization & Navigation Restructure Plan

## Context

Based on code analysis, the app has two layouts:

- **Public pages** (`PublicLayout`): Fixed header with logo + theme toggle + Sign In/Get Started (desktop) or hamburger (mobile). `MobileTabBar` with 4 tabs (Home/Features/Pricing/Contact) + Menu button. `MobileMenu` (full-screen overlay) opened by hamburger.
- **Authenticated pages** (`Layout`): Fixed header with logo + theme toggle + message bell + account dropdown + hamburger (tablet). `DockNav` (desktop only, hidden on mobile). `MobileTabBar` with 3 tabs (Dashboard/Find/Chat) + center action (Post Trip/Post Load) + Menu button. Menu is a `Sheet` bottom sheet.

### Current Mobile Nav State

| Layout | Bottom Tabs | Center Action | Menu Items |
|--------|-------------|---------------|------------|
| Public | Home, Features, Pricing, Contact | (none) | How It Works, Fare Calculator, Freight Rate Calculator, Return Load Calculator, About, FAQ, Blog, Gallery |
| Auth (Shipper) | Dashboard, Find Trucks, Chat | Post Load | ALL navItems (Dashboard, Post Load, Find Trucks, My Loads, Favorites, History) + Profile + Credit Score |
| Auth (Trucker) | Dashboard, Find Goods, Chat | Post Trip | ALL navItems (Dashboard, Post Trip, Find Goods, My Trips, Favorites, History) + Profile + Credit Score |
| Auth (Admin) | Command Center, Dashboard, Messages | (none) | ALL navItems + Profile + Credit Score |

## Problems Found

### 1. Critical: BrowseShipments.tsx Has No Component Body
`supabase/src/pages/trucker/BrowseShipments.tsx` — 61 lines of imports only, no component definition, no default export. Causes TypeScript errors and crashes when `/trucker/browse-shipments` route is loaded (`routes.tsx:46`).

### 2. Mobile Menu Duplicates Bottom Tab Items
`Layout.tsx:306-316` — `mobileMenuItems` includes ALL `navItems` which duplicates Dashboard, Find Goods/Trucks, Post Trip/Load, Chat, My Trips/Loads from the bottom tab bar. User explicitly: "when the user tap on C line menu he should not show already shown in the navigation bar icon."

### 3. No Center Action on Public Mobile Nav
`PublicLayout.tsx:258` — `MobileTabBar` receives no `centerAction` prop. Public-page mobile users have no prominent CTA. User wants a center action button.

### 4. MobileTabBar Not Hidden When MobileMenu Opens (Public)
`PublicLayout.tsx:258` — `MobileTabBar` does NOT receive `visible={mobileMenuOpen}`. When the full-screen `MobileMenu` overlay opens, the bottom tab bar remains visible underneath. Auth layout (`Layout.tsx:451`) correctly passes `visible={mobileNavOpen}`.

### 5. Authenticated Users Can't Access Calculators/Contact/About on Mobile
Calculator/tools are only in the **public** page menu (`PublicLayout.tsx:52-61`) and `MobileMenu.tsx`. Logged-in users navigating to authenticated pages lose access to Fare Calculator, Contact, About, etc. — must use header dropdown or navigate back to public pages.

### 6. Viewport Meta Allows Excessive Zoom
`index.html:28` — `maximum-scale=5.0, user-scalable=yes`. Enables double-tap-to-zoom which can disrupt button taps on mobile Safari. Should cap at 1.0.

### 7. Footer Hidden on Mobile for Both Layouts
`Layout.tsx:465` and `PublicLayout.tsx:178` — Footer is `hidden lg:block`. Mobile users can't access legal links, social links, or secondary nav. User wants footer links accessible on mobile for logged-in users.

## Plan

### Phase 1: Critical Crash Fix

**Task 1.1**: Restore `BrowseShipments.tsx`
- File: `supabase/src/pages/trucker/BrowseShipments.tsx`
- Add functional component body using existing imports
- Component must: export default, fetch shipments via Supabase, have search/filter, show match scores via `calculateMatchScore`
- Pattern from similar pages: `TruckerHub.tsx`, `BrowseTrips.tsx`
- Validate: `pnpm typecheck` passes, route `/trucker/browse-shipments` loads

### Phase 2: Authenticated Mobile Navigation Restructure (Layout.tsx)

**Task 2.1**: Deduplicate mobile menu items
- File: `supabase/src/components/Layout.tsx:306-316`
- Filter `mobileMenuItems` to EXCLUDE items already in bottom tabs (`mobileTabs`) and center action (`mobileCenterAction`)
- Result: Menu shows Favorites, History, Profile, Credit Score only — for the items already in navItems but not in tabs

**Task 2.2**: Add Industry-Standard Items to Authenticated Mobile Menu
- File: `supabase/src/components/Layout.tsx:306-316`
- Add to `mobileMenuItems` array:
  - Contact (phone icon, path `/contact`)
  - About (info icon, path `/about`)
  - Fare Calculator (calculator icon, path `/fare-calculator`)
  - Cricket Score (trophy icon, path `/cricket-score`) — as specifically requested
- These appear AFTER navItems-minus-tabs, BEFORE Profile/Credit Score
- Import: `Phone`, `Info`, `Calculator`, `Trophy` from lucide-react

**Task 2.3**: Add My Trips/Loads to Mobile Menu (if not already covered)
- For truckers: My Trips (`/trucker/my-trips`) is in navItems but also in bottom tabs? No — check: bottom tabs are Dashboard, Find Goods, Chat (no My Trips). Center action is Post Trip. So My Trips SHOULD be in the menu.
- For shippers: My Loads (`/shipper/my-shipments`) is NOT in bottom tabs (Dashboard, Find Trucks, Chat) nor center action (Post Load). Should be in menu.
- After Task 2.1 filtering, My Trips/Loads will remain in menu since they're not in tabs.

**Task 2.4**: Add Mobile Footer Links Section to Authenticated Menu
- File: `Layout.tsx:306-316` (same `mobileMenuItems` useMemo)
- After Profile + Credit Score, add a footer section with:
  - Privacy (`/privacy`)
  - Terms (`/terms`)
  - Safety Trust (`/safety-trust`)
- These should be visually separated (divider or different styling)

**Task 2.5**: Pass `visible` prop correctly (verify existing)
- `Layout.tsx:451` already passes `visible={mobileNavOpen}` to `MobileTabBar`
- Confirm DockNav at line 439 has `visible={mobileNavOpen}` ✓

### Phase 3: Public Mobile Navigation Improvements (PublicLayout.tsx)

**Task 3.1**: Add Center Action to Public Mobile Nav
- File: `supabase/src/components/PublicLayout.tsx:258`
- Add `centerAction` prop to `MobileTabBar`:
  - If not logged in: "Get Started" → `/register` (gradient button)
  - If logged in: "Track Load" → user's dashboard path
  - Use `ArrowRight` or `MapPin` icon
  - Import `Rocket` or keep `Sparkles` for Get Started icon

**Task 3.2**: Fix MobileTabBar Visibility When MobileMenu Open
- File: `supabase/src/components/PublicLayout.tsx:258`
- Add `visible={mobileMenuOpen}` to `<MobileTabBar>` component
- This hides the bottom tab bar when the full-screen menu overlay is active

**Task 3.3**: Remove Duplicate Items from MobileMenu
- File: `supabase/src/components/MobileMenu.tsx:11-19`
- Current `menuItems`: Features, Fare Calculator, How It Works, Pricing, About, FAQ, Contact
- If we add center action "Get Started" to MobileTabBar, remove Features/Pricing/Contact from MobileMenu (they're in the tab bar)
- New MobileMenu items: How It Works, Fare Calculator, About, FAQ, Blog, Gallery (items not in tabs)
- Wait — Blog and Gallery are not in the current MobileMenu list but ARE in `publicMobileMenuItems`. Need to align MobileMenu with `publicMobileMenuItems` minus tab items.

**Task 3.4**: Add Footer Links to Public MobileMenu
- File: `supabase/src/components/MobileMenu.tsx`
- After the main menu items, add a footer section with:
  - Privacy, Terms, Cookie Settings
- This replaces the missing footer on mobile for public pages

### Phase 4: Viewport & CSS Fixes

**Task 4.1**: Fix Viewport Meta Tag
- File: `index.html:28`
- Change `maximum-scale=5.0` to `maximum-scale=1.0`
- Keep `user-scalable=yes` for accessibility compliance
- Full: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes, viewport-fit=cover`

**Task 4.2**: Add Safe Area Bottom Padding to MobileTabBar Container
- File: `supabase/src/components/MobileTabBar.tsx:101`
- The bar has `safe-area-bottom` class but verify it's sufficient
- Current: `pb-[max(env(safe-area-inset-bottom),1rem)]` in the Sheet content
- Need to verify the bottom nav bar itself has proper bottom inset on iOS

**Task 4.3**: Add Contact/About Link to PublicLayout Header for Logged-in Users
- File: `supabase/src/components/PublicLayout.tsx:145-161`
- Currently logged-in users only see "Dashboard" link in header
- Add "Contact" and "About" links in header for logged-in users (small, subtle)

### Phase 5: Mobile UI Alignment Fixes

**Task 5.1**: Fix PlatformTabs Aspect Ratio on Mobile
- File: `supabase/src/features/home/sections/PlatformTabs.tsx:90`
- Replace `aspect-[16/9] max-h-[700px]` with responsive:
  - Mobile: `max-h-[500px]`
  - Desktop: `aspect-[16/9] max-h-[700px]`

**Task 5.2**: Show Hero Stats on Mobile
- File: `supabase/src/features/home/sections/HeroSection.tsx:74`
- Replace `hidden lg:block` stats card with a mobile-friendly horizontal scroll or compact grid

**Task 5.3**: Fix SectionNav Mobile Touch
- File: `supabase/src/features/home/sections/SectionNav.tsx:82`
- Add `touch-action: manipulation` via Tailwind `touch-pan-x` class
- Increase min button size to `min-h-10 min-w-10`

**Task 5.4**: Fix FAQ Details Element Mobile
- File: `supabase/src/features/home/sections/FaqSection.tsx:23`
- Add `touch-action: manipulation` to `<details>` and `<summary>`
- Ensure `cursor-pointer` is present

### Phase 6: Testing & Validation

**Task 6.1**: Mobile Responsiveness Audit
- Chrome DevTools mobile (iPhone SE, Pixel 5)
- Verify no horizontal scroll, touch targets ≥44px

**Task 6.2**: Navigation Flow Testing
- Public → open menu → verify bottom tab bar hidden
- Authenticated → open menu → verify no duplicate items in menu
- Authenticated → tap center action → opens Post Trip/Load
- Authenticated → menu → Contact/About/Calculators accessible

**Task 6.3**: Build & Typecheck
- `pnpm typecheck` — no errors
- `pnpm build` — no new errors, bundle size unchanged
- `pnpm lint` — no new warnings

## Files to Modify

| File | Task(s) |
|------|---------|
| `supabase/src/pages/trucker/BrowseShipments.tsx` | 1.1 — Restore component |
| `index.html` | 4.1 — Fix viewport meta |
| `supabase/src/components/Layout.tsx` | 2.1, 2.2, 2.4 — Deduplicate menu, add tools/contact/about/cricket score, add footer links |
| `supabase/src/components/PublicLayout.tsx` | 3.1, 3.2, 3.3 — Add center action, fix MobileTabBar visibility, add footer links to mobile menu |
| `supabase/src/components/MobileMenu.tsx` | 3.3, 3.4 — Remove duplicates, add footer links |
| `supabase/src/features/home/sections/PlatformTabs.tsx` | 5.1 — Fix aspect ratio |
| `supabase/src/features/home/sections/HeroSection.tsx` | 5.2 — Show stats on mobile |
| `supabase/src/features/home/sections/SectionNav.tsx` | 5.3 — Fix mobile touch |
| `supabase/src/features/home/sections/FaqSection.tsx` | 5.4 — Fix details element |

## Key Decisions

1. **Bottom tab bar = primary actions only**; Menu/Sheet = secondary + industry-standard items (Contact, About, Calculators, Cricket Score, Legal)
2. **Menu never duplicates tab items** — explicit user requirement
3. **Center action on public pages** = Get Started (logged out) / Track Load (logged in)
4. **Cricket Score** added as requested by user — icon: `Trophy` from lucide-react
5. **Keep user-scalable=yes** for accessibility, just cap `maximum-scale=1.0`
