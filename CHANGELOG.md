# Changelog

All notable changes to LoadSaathi are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Branded Android launcher icons and white splash screens (regenerated from
  `public/logo-512.png` — no more black icon backgrounds)
- Monochrome icon layer for Android 13+ themed icons
- `values/colors.xml` (was referenced by `styles.xml` but missing, causing
  fresh build failures)
- Android 12+ splash screen configuration (`windowSplashScreen*` items)
- Professional repository documentation suite (`docs/`, `CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md`, `SECURITY.md`, `LICENSE`, `CHANGELOG.md`)

## [0.0.0] — Initial Development (pre-launch)

This project is under active pre-launch development. The changelog will be
maintained rigorously once the first tagged release is cut.

### Early Milestones

- **Web platform (Vercel):** React 19 + TypeScript + Vite SPA
- **Authentication:** Clerk sign-up/sign-in, role selection (shipper/trucker)
- **Database:** Supabase PostgreSQL with RLS, Realtime subscriptions
- **Trip & Shipment posting:** Geocoding, OSRM routing, price estimation
- **Smart Matching:** Multi-factor AI scoring engine
- **Requests & Negotiation:** Request/accept flows, in-app chat
- **GPS Tracking:** Live location sharing, geofence alerts
- **Credit Scores:** 300–900 digital freight credit score
- **AI Price Prediction:** Gemini-powered pricing insights
- **Reviews:** Bidirectional post-trip ratings
- **Favorites & Templates:** Save trips/shipments and reusable templates
- **Admin Suite:** Dashboard, user management, moderation, gallery, team manager
- **SEO/GEO:** 60+ indexed URLs, sitemap, JSON-LD schemas, llms.txt, blog
- **Analytics:** PostHog, Vercel Analytics, Google Analytics
- **Mobile:** Capacitor Android wrapper

---

_Changelog entries are added per meaningful change. For a full commit history,
see `git log`._
