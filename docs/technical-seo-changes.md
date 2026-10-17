# Technical SEO Changes — LoadSaathi

**Date:** 2026-10-13  
**Branch:** seo-geo-aeo-aao-fixes

---

## What Changed

### 1. Analytics PII Removal
**File:** `supabase/src/utils/analytics.ts`

- Removed `name` and `phone` from `trackQuoteRequested` — these are PII and must never be sent to analytics platforms
- Added `lead_id` parameter as a privacy-safe alternative
- Added 15 new event types for complete funnel tracking:
  - `quote_form_start`, `quote_form_submit`, `quote_form_success`
  - `post_load_start`, `post_load_submit`, `post_load_success`
  - `transporter_signup_start`, `transporter_signup_complete`, `shipper_signup_complete`
  - `click_phone`, `click_email`
  - `view_service_page`, `view_location_page`, `view_route_page`, `view_guide`
  - `view_pricing_or_rate_guide`, `internal_cta_click`

### 2. SeoMeta DateModified Fix
**File:** `supabase/src/components/SeoMeta.tsx`

- Removed hardcoded `dateModified = "2026-09-18"` default
- Now only sets `article:modified_time` when a real date is explicitly provided
- Prevents stale/misleading modification dates on pages that haven't been updated

### 3. Robots.txt — Crawl Budget Optimization
**File:** `public/robots.txt`

Added disallow rules for noindex duplicate/utility pages:
```
Disallow: /share/
Disallow: /screens/
Disallow: /transport/
```

These pages are noindex but were still crawlable, wasting crawl budget.

### 4. Sitemap Lastmod from Content Timestamps
**File:** `scripts/generate-sitemap.mjs`

- Blog articles now use their `lastUpdated` field for `<lastmod>`
- Route pages use `RATES_UPDATED_AT` (2026-10-01) as fallback
- Static pages use build date (appropriate for pages that change on deploy)
- Previously all pages used the build date, which was not meaningful for freshness

### 5. DirectAnswer Component for AEO
**Files:** `supabase/src/components/DirectAnswer.tsx` (new), `supabase/src/pages/public/locations/LocationPage.tsx`, `supabase/src/pages/public/RouteDetail.tsx`

- Created reusable `DirectAnswer` component that renders a concise, visible HTML answer immediately after the H1
- Location pages now show a direct answer with city, state, industries, corridors, and indicative rates
- Route pages now show a direct answer with distance, transit time, and rate bands
- Both include qualifier text ("Indicative rates only...") to set expectations

### 6. Location Page Rate Qualifiers
**File:** `supabase/src/pages/public/locations/LocationPage.tsx`

- Added "Indicative rates only" disclaimer above rate ranges
- Added link to freight rate calculator for precise estimates
- Rate ranges are now clearly labeled as indicative, not live quotes

### 7. Image Lazy Loading
**File:** `supabase/src/pages/blog/BlogArticle.tsx`

- Changed cover image from `loading="eager"` to `loading="lazy"`
- Added explicit `width` and `height` attributes to prevent CLS

---

## URL Rules

| Rule | Implementation |
|------|---------------|
| Canonical domain | `https://loadsaathi.in` (apex, no www) |
| www → apex | 301 redirect in `api/agent.js` |
| Trailing slash | 301 redirect to no-trailing-slash |
| Duplicate pairs | 301 redirect (e.g., `/freight-intelligence` → `/data`) |
| `/transport/:city` | 301 redirect to `/location/:city` |
| Unknown slugs | 404 with `noindex` |

## Sitemap Rules

- Only canonical, indexable, 200-status public URLs
- Excludes: /share/*, /screens/*, /transport/*, auth pages, /api/, redirect sources
- `<lastmod>` derived from content timestamps (blog: lastUpdated, routes: RATES_UPDATED_AT)
- Single sitemap file (212 URLs, under 50K limit)

## Robots Rules

- `User-agent: *` — Allow all, disallow auth/private/noindex pages
- AI crawlers (GPTBot, PerplexityBot, ClaudeBot, etc.) — explicit Allow
- Sitemap referenced at `https://loadsaathi.in/sitemap.xml`

---

## Manual Search Console Validation Checklist

1. **Submit sitemap** — Search Console → Sitemaps → `sitemap.xml`
2. **Request indexing** for key pages:
   - `/` (homepage)
   - `/routes` (route index)
   - `/blog` (blog index)
   - `/ptl-transport`, `/ltl-transport` (commercial pages)
3. **Check coverage** — Search Console → Pages → verify all 212 URLs are indexed
4. **Check enhancements** — Search Console → Enhancements → verify:
   - BreadcrumbList rich results
   - FAQ rich results
   - Article rich results
5. **Check Core Web Vitals** — Search Console → Core Web Vitals → verify mobile/desktop
6. **Check mobile usability** — Search Console → Mobile Usability

---

## Rollback Steps

1. `git revert` the merge commit for `seo-geo-aeo-aao-fixes`
2. Redeploy to Vercel
3. Verify sitemap regenerates correctly: `node scripts/generate-sitemap.mjs`
4. Verify no PII in analytics: check PostHog event stream
5. Verify DirectAnswer renders: check `/location/rourkela` and `/routes/rourkela-to-ranchi`

---

## Assumptions That Need Confirmation

| # | Assumption | Impact |
|---|-----------|--------|
| 1 | Author names (Rajesh Kumar, Amit Verma, Priya Sharma, Vikram Singh) are real people | If not, Article schema may violate Google guidelines |
| 2 | `foundingDate: "2025"` in Organization schema is correct | If wrong, schema is inaccurate |
| 3 | `areaServed` includes Bihar and Chhattisgarh | If not served, remove from schema |
| 4 | Rate figures on location pages are indicative estimates | If they are real, remove "indicative" qualifier |
| 5 | `RATES_UPDATED_AT = "2026-10-01"` is accurate | If wrong, sitemap lastmod is wrong |
