# LoadSaathi SEO/GEO Implementation Plan — Phases 2-10

**Date:** August 2, 2026
**Status:** Ready to execute
**Pending:** Phone number for LocalBusiness schema (placeholder `"TBD"` until provided)

---

## Phase 1: Fix Broken Deployment (User Action Required)

**Cannot be done by AI agent — you must run:**

```bash
pnpm install && pnpm run build
```

Then redeploy to Vercel. The error `Failed to fetch dynamically imported module: App-CRk4e75d.js` is caused by a stale `index.html` referencing a deleted JS bundle (Vite build hash mismatch).

---

## Phase 2: Enhanced Schema Markup (`index.html`)

**File:** `index.html` (lines 66-79)

Replace the minimal `WebSite` schema with a comprehensive `@graph` array:

| Schema Type | Key Fields |
|---|---|
| `Organization` | name, URL, logo, social profiles (X, Facebook, Instagram, LinkedIn), founder Sanjaya Sahu |
| `LocalBusiness` | freight marketplace in Rourkela, Odisha; geo coordinates; opening hours; priceRange; sameAs |
| `WebSite` | name, URL, potentialAction (SearchAction) |
| `WebPage` | breadcrumb references, isPartOf |
| `FAQPage` | 3-4 high-value questions with answers |

---

## Phase 3: robots.txt + sitemap.xml Updates

### `public/robots.txt`
- Add explicit `Allow` rules for AI crawlers: `GPTBot`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`, `anthropic-ai`, `Bytespider`, `Google-Extended`
- Add `Disallow` for admin/auth/app-dashboard paths
- Add `Sitemap: https://loadsaathi.in/sitemap.xml`

### `public/sitemap.xml`
- Add new URLs for location pages (`/location/rourkela`, `/location/ranchi`, `/location/kolkata`, `/location/bhubaneswar`, `/location/jamshedpur`)
- Add new URLs for pillar pages (`/guide/ptl-vs-ftl`, `/guide/freight-rates-east-india`, `/guide/shipping-steel`)
- Update `lastmod` dates

---

## Phase 4: Homepage Content (`src/pages/Index.tsx`)

**File:** `src/pages/Index.tsx` (1039 lines)

| Section | Action |
|---|---|
| "What is LoadSaathi?" | Add 3-paragraph explainer between hero and tabs |
| Corridor Cards | Add distance/time badges and CTA links to route detail pages |
| "Why Ship on LoadSaathi?" | Full value proposition section with copy |
| "Why Drive on LoadSaathi?" | Full value proposition section with copy |
| "Trusted Across East India" | Section with corridor map visualization |
| FAQ Schema | Add via SeoMeta jsonLd prop (3 questions) |
| Internal Links | Homepage → corridors, blog, location pages |

User chose: **"Full writeout"** — complete publication-ready copy for all new sections.

---

## Phase 5: About Page Enhancement (`src/pages/public/About.tsx`)

**File:** `src/pages/public/About.tsx` (213 lines)

- Add `AboutPage` JSON-LD schema via SeoMeta
- Enhance founder story section with Sanjaya Sahu narrative
- Add "Our Mission" and "How LoadSaathi Works" sections
- Add internal links to features, blog, corridors

---

## Phase 6: RouteDetail Enrichment (`src/pages/public/RouteDetail.tsx`)

**File:** `src/pages/public/RouteDetail.tsx` (129 lines)

- Add `Service` JSON-LD schema for each corridor (`serviceType: "Freight Transportation"`, `areaServed`, `provider`)
- Add `FAQPage` schema with 2-3 route-specific questions
- Add "Related Routes" section (ensure all 25 corridors link to each other)
- Add "How to Ship on This Route" CTA section

---

## Phase 7: Location Page Stubs

### New Files
- `src/pages/public/locations/LocationPage.tsx` — generic template with SeoMeta, city name, hero, "Freight Routes from [City]", "Industries Served", CTA
- `src/pages/public/locations/index.ts` — exports all location slugs

### Routes to Add in `App.tsx`
- `/location/:city` — dynamic route using LocationPage

### Initial Cities
`rourkela`, `ranchi`, `kolkata`, `bhubaneswar`, `jamshedpur`

---

## Phase 8: Pillar Page Stubs

### New Files
- `src/pages/public/guides/GuidePage.tsx` — generic template with SeoMeta, article-style layout, internal links
- `src/pages/public/guides/index.ts`

### Routes to Add in `App.tsx`
- `/guide/:slug` — dynamic route using GuidePage

### Initial Guides
- `ptl-vs-ftl`
- `freight-rates-east-india`
- `shipping-steel`

---

## Phase 9: Blog Schema Enhancement

**File:** `src/pages/blog/BlogArticle.tsx` (295 lines)

- Article schema already exists (good!) — verify it includes `image` field
- Add `BreadcrumbList` schema to the existing breadcrumbs
- Ensure `wordCount` calculation is accurate

---

## Phase 10: Internal Linking + Navigation Updates

### `src/components/PublicLayout.tsx`
- Add "Freight Routes" link to footer nav
- Add "Guides" link to footer nav

### `public/llms.txt`
- Add new page URLs (locations, guides) with descriptions
- Update existing entries if needed

### `public/sitemap.xml`
- Final pass: ensure all new pages are included

---

## Execution Order

| Step | Phase | Files Modified |
|---|---|---|
| 1 | Phase 2 | `index.html` |
| 2 | Phase 3 | `public/robots.txt`, `public/sitemap.xml` |
| 3 | Phase 4 | `src/pages/Index.tsx` |
| 4 | Phase 5 | `src/pages/public/About.tsx` |
| 5 | Phase 6 | `src/pages/public/RouteDetail.tsx` |
| 6 | Phase 7 | New files + `src/App.tsx` |
| 7 | Phase 8 | New files + `src/App.tsx` |
| 8 | Phase 9 | `src/pages/blog/BlogArticle.tsx` |
| 9 | Phase 10 | `src/components/PublicLayout.tsx`, `public/llms.txt`, `public/sitemap.xml` |
