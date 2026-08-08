# Product Roadmap

This document outlines LoadSaathi's current status and planned direction.

> **Status:** Pre-launch / early launch. The platform is feature-complete for
> an MVP and undergoing market validation on the East India freight corridor.

## Where We Are

### ✅ Shipped (MVP)

| Area | Features |
|------|----------|
| **Authentication** | Clerk sign-up/sign-in, role selection, profile management |
| **Core Marketplace** | Post trips (trucker), post shipments (shipper), browse & search |
| **Matching** | 7-factor AI match scoring displayed as match % |
| **Requests** | Request/accept/reject flows + in-app chat & negotiation |
| **GPS Tracking** | Live location sharing, route visualization, geofence alerts |
| **Trust** | Bidirectional reviews, verification badges |
| **Credit Scores** | 300–900 digital freight credit score + insights |
| **AI Pricing** | Gemini-powered price prediction + demand forecasts |
| **Admin** | Dashboard, user management, moderation, gallery, team manager |
| **Marketing/SEO** | 60+ indexed pages, blog, routes, locations, guides, llms.txt |
| **Analytics** | PostHog, Vercel Analytics, Google Analytics |
| **Mobile** | Android app via Capacitor (debug build ready) |

### 🚧 In Progress

- Escrow-backed payments (milestone-based release + dispute resolution)
- Google Play Store release
- Push notifications (web + Android)
- ML match-model validation (`match-ml` + `ml_match_log`)

## Planned

### Phase 1 — Launch Readiness

- [ ] Production signing + Play Store release
- [ ] Escrow/payment integration (Razorpay/Stripe for India)
- [ ] SMS/WhatsApp notifications for truckers (low-connectivity users)
- [ ] Hindi + Odia localization
- [ ] FTL (full truckload) support
- [ ] Load board API for partner integrations

### Phase 2 — Growth & Scale

- [ ] Pan-India corridor expansion (North India, South India)
- [ ] Fleet management tools for large operators
- [ ] Multi-stop route optimization
- [ ] Dynamic pricing engine (v2)
- [ ] Insurance marketplace integration
- [ ] Fuel & toll card partnerships
- [ ] Credit-scored financing for truckers (working capital loans)

### Phase 3 — Network Effects

- [ ] Referral/affiliate program for truckers
- [ ] Transporter community & driver app
- [ ] AI route-demand heatmaps (seasonal forecasting)
- [ ] EV/trucker electrification corridor readiness
- [ ] Export/import (EXIM) freight module

## Metrics We Track

- **Matching:** match rate, time-to-match, request acceptance rate
- **Trust:** credit score distribution, review rates, dispute rate
- **Efficiency:** empty-return-km reduction, fill rate
- **Growth:** active shippers, active truckers, loads/week, GMV

## How to Contribute Ideas

- Open a [Feature Request](../../.github/ISSUE_TEMPLATE/feature_request.yml)
- Email **support@loadsaathi.in**

---

_This roadmap is maintained by the LoadSaathi team and updated as priorities
shift. Last updated: August 2026._
