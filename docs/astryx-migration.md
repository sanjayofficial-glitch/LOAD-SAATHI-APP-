# Astryx Migration Status

Goal: migrate the UI surface to Astryx components + the LoadSaathi brand theme, keeping
lint/typecheck/tests/build green after every batch.

## Theme
- `src/themes/loadsaathi/` — brand theme (extends neutral; orange accent chain, light+dark).
- Built artifacts committed next to source (`loadsaathi.js/css/d.ts`). After editing source, rebuild:
  `pnpm exec astryx theme build ./src/themes/loadsaathi/loadsaathiTheme.ts`
- Default theme: `loadsaathi` (see `astryx-themes.ts`). `theme use <slug>` to switch.

## Converted pages (Astryx Button/Card in use)
- [x] `public/Pricing.tsx` — plan cards (orange/default + elevation), CTAs, fee breakdown, FAQ, final CTA
- [x] `public/FAQ.tsx` — CTA buttons
- [x] `public/Features.tsx` — feature cards, FAQ cards, CTA
- [x] `public/HowItWorks.tsx` — step cards, CTA
- [x] `public/Contact.tsx` — form card, info/business-hours/enterprise cards, submit + CTA buttons

## Remaining queue (by priority)
1. Public marketing: `About`, `Data`, `SafetyTrust`, `Comparison` (+ `/compare/*`), `Gallery`, `GuidePage`, `All`, `Terms`, `Privacy`, `RouteDetail`, `SharedTrip/SharedShipment`, commercial (`TruckLoadBooking`, `ReturnLoad`, `PtlTransport`, `LtlTransport`, `FreightMarketplace`), tools (`FareCalculator`, `FreightRateCalculator`, +18 more).
2. Marketplace lists: `BrowseTrips`, `BrowseShipments` (cards → table rows on desktop).
3. Auth/onboarding: `Login`, `Register`, `ChooseRole`, `OnboardingFlow`, `ForgotPassword`.
4. Shipper/Trucker flows: `Dashboard`, `PostShipments/PostTrip`, `EditShipment/EditTrip`, `MyShipments`, `ShipmentDetail`, `TripDetail`, `TruckerHub`, `Verification`, history/earnings.
5. Messaging: `Chat`, `ChatList`.
6. Account: `Profile`, `Favorites`, `CreditScore`.
7. Admin: `UserManagement`, `VerificationQueue`, `Moderation`, `AuditLog`, `ApiKeys`, `TeamManager`, `GalleryManager`, `AdminListings`, command-center panels.
8. Shared: `NotFound`, `BlogArticle/BlogList`.

## Conventions used
- Import components from their own entries: `@astryxdesign/core/Button`, `.../Card`.
- Buttons: `label` required; `variant` primary/secondary/ghost/destructive; `href` renders a real link; `type="submit"` for forms; `icon`/`endContent` for leading/trailing.
- Cards: prefer `variant="muted"` for de-emphasised, `variant="orange"` for brand emphasis, `elevation` only when floating; keep `padding` token-based.
- Keep `SeoMeta`, `noscript`, single H1, and JSON-LD intact on public pages.

## Verification after each batch
```
pnpm lint && pnpm typecheck && pnpm test && pnpm build:dev
```
Before deploy: full `pnpm build` (prerender + smoke) + `pnpm exec astryx doctor --built dist`.
