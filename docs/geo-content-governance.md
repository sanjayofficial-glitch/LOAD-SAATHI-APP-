# GEO Content Governance — LoadSaathi

**Date:** 2026-10-13

---

## Purpose

This document defines the governance model for location, route, and regional content on loadsaathi.in. It ensures all GEO content is accurate, unique, and compliant with Google's doorway-page spam policy.

---

## Content Data Model

### Location Page

```typescript
interface LocationPage {
  slug: string;                    // e.g., "rourkela"
  name: string;                    // e.g., "Rourkela"
  state: string;                   // e.g., "Odisha"
  status: "enabled" | "disabled";   // Only enabled pages are in sitemap
  description: string;             // Unique, factual description
  industries: string[];            // Verified industries
  commodities: string[];           // Verified commodities
  hubDistances: { city: string; km: number }[];  // Verified distances
  rateRanges: { type: string; range: string }[]; // Indicative only
  localFaq: { q: string; a: string }[];           // Unique FAQs
  lastReviewed: string;            // ISO date
  owner: string;                   // Content owner
}
```

### Route Page

```typescript
interface RoutePage {
  slug: string;                    // e.g., "rourkela-to-ranchi"
  from: string;                    // Origin city
  to: string;                      // Destination city
  fromState: string;
  toState: string;
  distanceKm: number;              // Verified road distance
  transitTime: string;             // Verified transit time
  dataStatus: "verified" | "corrected" | "needs_review";
  description: string;             // Unique description
  keywords: string;
  commodities: string[];           // What typically ships
  lastReviewed: string;            // ISO date
}
```

---

## Current Content Inventory

### Location Pages (14 cities)

| City | State | Status | Last Reviewed |
|------|-------|--------|---------------|
| Rourkela | Odisha | enabled | 2026-10-13 |
| Ranchi | Jharkhand | enabled | 2026-10-13 |
| Kolkata | West Bengal | enabled | 2026-10-13 |
| Bhubaneswar | Odisha | enabled | 2026-10-13 |
| Jamshedpur | Jharkhand | enabled | 2026-10-13 |
| Cuttack | Odisha | enabled | 2026-10-13 |
| Sambalpur | Odisha | enabled | 2026-10-13 |
| Angul | Odisha | enabled | 2026-10-13 |
| Jharsuguda | Odisha | enabled | 2026-10-13 |
| Burdwan | West Bengal | enabled | 2026-10-13 |
| Dhanbad | Jharkhand | enabled | 2026-10-13 |
| Balasore | Odisha | enabled | 2026-10-13 |
| Berhampur | Odisha | enabled | 2026-10-13 |
| Visakhapatnam | Andhra Pradesh | enabled | 2026-10-13 |

### Route Pages (48 corridors)

All 48 routes are in `supabase/src/data/routes.ts` with `dataStatus` field:
- `verified` — distance and transit time confirmed
- `corrected` — previously wrong, now fixed
- `needs_review` — 26 routes still need verification

---

## Anti-Doorway Safeguards

### Rules

1. **No automatic generation** — Every location/route page must be manually enabled
2. **Unique content required** — Each page must have unique description, FAQs, and commodities
3. **No "we serve every city" claims** — Coverage is limited to verified cities only
4. **No fake addresses** — Only the registered office in Rourkela is listed
5. **No placeholder rates** — Rate ranges are labeled "indicative" with disclaimer
6. **No near-duplicate pages** — Each city/route must have distinct content

### Validation Checklist (Before Publishing)

- [ ] City/route is verified as served by LoadSaathi
- [ ] Description is unique (not copied from another page)
- [ ] Industries and commodities are verified
- [ ] Distances are verified against road routing
- [ ] Rate ranges are labeled "indicative"
- [ ] FAQs are unique to this location/route
- [ ] `lastReviewed` date is set
- [ ] `owner` is assigned
- [ ] Page is added to sitemap (only if `status: "enabled"`)

---

## Editorial Workflow

### Adding a New Location Page

1. **Research** — Verify the city is served by LoadSaathi
2. **Create data entry** — Add to `supabase/src/data/locations.ts` with `status: "disabled"`
3. **Write unique content** — Description, industries, commodities, FAQs
4. **Verify distances** — Use OSRM routing to confirm
5. **Add rate ranges** — Only if verified; label as "indicative"
6. **Review** — Operations team reviews accuracy
7. **Enable** — Change `status: "enabled"`
8. **Add to sitemap** — Run `node scripts/generate-sitemap.mjs`
9. **Submit to Search Console** — Request indexing

### Adding a New Route Page

1. **Research** — Verify the corridor is operational
2. **Create data entry** — Add to `supabase/src/data/routes.ts` with `dataStatus: "needs_review"`
3. **Verify distance** — Use OSRM road routing
4. **Verify transit time** — Based on road conditions and typical truck speeds
5. **Write unique description** — Include commodities, industries, landmarks
6. **Review** — Operations team verifies
7. **Update status** — Change to `"verified"` or `"corrected"`
8. **Add to sitemap** — Run `node scripts/generate-sitemap.mjs`

---

## Content Review Cadence

| Content Type | Review Frequency | Owner |
|--------------|------------------|-------|
| Route distances/transit times | Quarterly | Operations |
| Rate ranges | Monthly | Operations |
| Location page content | Quarterly | Content team |
| Blog articles (rates/compliance) | Monthly | Content team |
| Blog articles (evergreen) | Quarterly | Content team |

---

## Prohibited Content

- **No fabricated reviews or testimonials**
- **No fake customer names or case studies**
- **No invented rate figures** (must be labeled "indicative" if estimates)
- **No "guaranteed" or "cheapest" claims**
- **No keyword-stuffed city/route combinations**
- **No hidden text or cloaking**
- **No doorway pages** (pages that only exist to rank for a keyword)
