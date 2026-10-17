# LoadSaathi SEO / GEO / AEO / AAO Audit Report

**Date:** 2026-10-13  
**Auditor:** AI SEO Engineer  
**Scope:** Full repository audit of loadsaathi.in  
**Search Console baseline:** ~8.9 average position, 1.4% CTR (7-day)

---

## Executive Summary

LoadSaathi has a **sophisticated, well-architected SEO foundation** that exceeds most Indian logistics startups. The site features:

- A dual metadata system (static `index.html` + client-side `SeoMeta.tsx` + server-side `api/agent.js` edge injection)
- Build-time sitemap generation from single-source slug registries
- Comprehensive JSON-LD structured data (Organization, LocalBusiness, WebSite, BreadcrumbList, Article, FAQPage, Service, QAPage, HowTo)
- 212 indexable URLs across 14 city pages, 48 freight routes, 71+ blog articles, 3 guides, 9 transport-service pages, and 20+ tool pages
- AI-crawler-aware robots.txt with explicit allows for GPTBot, PerplexityBot, ClaudeBot, etc.
- Content negotiation (Accept: text/markdown) for AI agents
- Build-time prerendering via headless Chrome

**The primary opportunities are not foundational — they are optimization, freshness, and content-quality issues.**

---

## 1. Tech Stack & Architecture

| Layer | Technology |
|-------|-----------|
| Framework | React 19.2 + Vite 6.4 + React Router 7.6 |
| Styling | Tailwind CSS 3.4 + tailwindcss-animate |
| Deployment | Vercel (Edge Functions + static) |
| SEO injection | `api/agent.js` (Edge Function, server-side head/body injection) |
| Client metadata | `SeoMeta.tsx` (imperative DOM, post-hydration) |
| Structured data | JSON-LD in `index.html` + dynamic generation in `agent.js` |
| Analytics | GA4 (G-GEFWPQNHT6) + GTM (GTM-WTBG3QKC) + Clarity + PostHog + Vercel Analytics |
| Content | File-based data (`blog.ts`, `routes.ts`, `locations.ts`, `guides.ts`, `transportServices.ts`) |
| Prerendering | `scripts/prerender.mjs` (headless Chrome, build-time) |
| Sitemap | `scripts/generate-sitemap.mjs` (build-time, prebuild hook) |

---

## 2. Crawlability & Indexability

### 2.1 robots.txt

**Status: PASS with minor observations**

```
User-agent: *
Allow: /
Disallow: /login, /register, /choose-role, /forgot-password, /auth-sync
Disallow: /admin/, /trucker/, /shipper/, /profile, /messages, /chat/, /favorites, /credit-score, /browse-trucks, /trips/
Disallow: /api/, /dashboard, /csp-report

# AI crawlers — explicit allow
User-agent: GPTBot / OAI-SearchBot / PerplexityBot / ClaudeBot / anthropic-ai / Bytespider / Google-Extended / CCBot
Allow: /

Sitemap: https://loadsaathi.in/sitemap.xml
```

**Strengths:**
- Clean disallow list for auth and private areas
- Explicit AI crawler allows (good for GEO)
- Sitemap reference present
- Does not block CSS, JS, images, or static resources

**Issues:**
| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| R1 | No `Disallow: /share/` — share links are noindex via meta but still crawlable, wasting crawl budget | Low | Add `Disallow: /share/` to robots.txt |
| R2 | No `Disallow: /screens/` — preview pages are noindex but crawlable | Low | Add `Disallow: /screens/` |
| R3 | No `Disallow: /transport/` — alias redirects to /location/, but crawlers may still waste time | Low | Add `Disallow: /transport/` |

### 2.2 Sitemap

**Status: PASS with observations**

- 212 URLs, generated at build time from slug registries
- All URLs are canonical HTTPS, no trailing slash
- Includes: static pages, routes, locations, transport-services, guides, blog
- Excludes: /share/*, /screens/*, auth pages, /api/, redirect sources

**Issues:**
| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| S1 | `<lastmod>` is always `new Date().toISOString().slice(0, 10)` — the build date, not the content update date. This is technically valid but not meaningful for freshness signals | Medium | Derive lastmod from actual content timestamps (e.g., `lastUpdated` fields in blog.ts, routes.ts) |
| S2 | No sitemap index — single file with 212 URLs is fine (under 50K limit), but if growth continues, split by content type | Low | Monitor; split when >10K URLs |
| S3 | Sitemap does not include image tags for pages with OG images | Low | Consider `<image:image>` for blog/route pages with unique visuals |

### 2.3 Canonicals & Redirects

**Status: PASS**

- `api/agent.js` handles: www→apex 301, trailing-slash→no-slash 301, duplicate-pair redirects (e.g., `/freight-intelligence`→`/data`), `/transport/:city`→`/location/:city` 301
- All public pages have canonical URLs in the edge-injected head
- `SeoMeta.tsx` sets canonical client-side
- No redirect chains detected

**Issues:**
| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| C1 | `canonicalRegistry.ts` has 71 hardcoded blog slugs, but `blog.ts` is the actual source. If they drift, sitemap/404s break | Medium | Generate `BLOG_SLUGS` from `blog.ts` at build time (like `generate-sitemap.mjs` already does) |
| C2 | The `COVERAGE` counts in `site.ts` (sitemapUrls: 212, freightRoutes: 48, cityPages: 14) are manually maintained and asserted by `smoke.mjs` — good, but fragile if data changes | Low | Keep as-is; the smoke test is the safety net |

---

## 3. Metadata Implementation

### 3.1 Title & Description

**Status: PASS**

- Static `index.html` has homepage title/description
- `SeoMeta.tsx` sets per-page title/description client-side
- `api/agent.js` injects per-page title/description server-side (for crawlers)
- `clampMetaDescription()` ensures 160-char limit
- Titles follow pattern: `{Page Title} | LoadSaathi`

**Issues:**
| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| M1 | `SeoMeta.tsx` uses `dateModified = "2026-09-18"` as a hardcoded default — this date is baked into every article page that doesn't explicitly pass `dateModified` | Medium | Remove the default; only set `article:modified_time` when a real date is provided |
| M2 | Some blog articles in `agent.js` BLOG_DATA have `lastUpdated` dates but the client-side `BlogArticle.tsx` may not pass them to `SeoMeta` — potential mismatch | Low | Verify client/server date consistency |
| M3 | Homepage description says "Save up to 40% on freight costs" — this is a claim that needs substantiation | Medium | Ensure the 40% figure is defensible; add "indicative" or "up to" qualifier if not already present |

### 3.2 Open Graph & Twitter Cards

**Status: PASS**

- Full OG tags (type, url, title, description, image, site_name, locale)
- Twitter card (summary_large_image, title, description, image)
- Image dimensions specified (1200x630)
- Per-page canonical URLs in OG:url

**Issues:**
| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| O1 | All pages use the same `og-image.png` — no per-page unique OG images for blog/route/location pages | Medium | Generate per-page OG images (like the SVG OG images in `public/blog/og/`) |
| O2 | `og:image:alt` uses `{title} — LoadSaathi` which is fine but could be more descriptive | Low | Consider page-specific alt text |

### 3.3 Robots Meta

**Status: PASS**

- Public pages: `index, follow` (default, not explicitly rendered)
- Auth pages: `noindex, follow` (via `agent.js` STATIC_PAGE_DATA)
- Share links: `noindex, nofollow` (via `SeoMeta.tsx`)
- Unknown slugs: `noindex, follow` (via `agent.js` fallback)
- 404 pages: `noindex` (via `404.html`)

---

## 4. Structured Data (JSON-LD)

### 4.1 Sitewide Schemas (index.html)

**Status: PASS**

- **Organization**: name, url, logo, description, foundingDate, founder, employees, sameAs (6 social profiles), contactPoint, address
- **LocalBusiness**: name, description, url, telephone, priceRange, address, geo, openingHoursSpecification, areaServed (5 states), sameAs
- **WebSite**: name, url, description, publisher, potentialAction (SearchAction)

**Issues:**
| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| J1 | `foundingDate: "2025"` — is this verified? If the company was incorporated in 2025, this is fine | Low | Confirm with business owner |
| J2 | `areaServed: ["Odisha", "Jharkhand", "West Bengal", "Bihar", "Chhattisgarh"]` — Bihar and Chhattisgarh are not reflected in the 14 city pages or 48 routes. This may overstate coverage | Medium | Either add city/route pages for Bihar and Chhattisgarh, or remove from areaServed until verified |
| J3 | `openingHoursSpecification` says 00:00-23:59 (24/7) — this is a digital platform, so technically true, but may confuse LocalBusiness interpretation | Low | Consider removing or using "Mo-Su 00:00-23:59" |

### 4.2 Dynamic Schemas (api/agent.js)

**Status: PASS**

- **BreadcrumbList**: All page types (route, blog, guide, location, transport-service, static)
- **Article**: Blog and guide pages (headline, author, datePublished, dateModified, mainEntityOfPage)
- **FAQPage**: Blog, guide, location, transport-service pages with visible FAQs
- **Service + Offer + QAPage**: Route pages (with areaServed, serviceType, offers)
- **HowTo**: Guide pages with steps
- **WebPage**: All pages
- **Organization**: /about page
- **LocalBusiness**: /contact page

**Issues:**
| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| J4 | Route page `Offer.price` is computed as `distanceKm * 100` — this is a synthetic number, not a real price. While it's labeled "Estimated freight cost," it may mislead | Medium | Consider removing the `price` field or using a real rate band from `laneRates()` |
| J5 | Route page `QAPage` answers contain specific rate figures (e.g., "₹X to ₹Y") that are computed from `laneRates()` — these are estimates, not verified rates | Medium | Add "indicative" or "estimated" qualifier in the answer text |
| J6 | `wordCount` in Article schema is computed as `readTime * 200` — this is an approximation, not actual word count | Low | Either compute actual word count or remove the field |
| J7 | Guide `HowTo` schema uses `totalTime: seoMeta.readTime` (e.g., "6 min read") — this is read time, not completion time | Low | Remove `totalTime` or use a realistic estimate |

### 4.3 Schema Validation

**Status: NEEDS VERIFICATION**

- No automated schema validation in the build pipeline
- No Rich Results Test integration

**Recommendation:** Add a build-time validation step that parses all JSON-LD and validates against schema.org expectations.

---

## 5. Content & AEO (Answer Engine Optimization)

### 5.1 Answer-First Patterns

**Status: PASS with observations**

- Location pages have a `.city-snippet-answer` paragraph immediately after the H1 (visible HTML text)
- Route pages have FAQ sections with direct answers
- Blog articles have summaries that could serve as direct answers
- `agent.js` injects long-form content blocks for crawlers

**Issues:**
| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| A1 | The `.city-snippet-answer` on location pages is a single paragraph — not structured as a clear "answer" for AI systems | Medium | Add a dedicated "Direct Answer" section with a concise 40-70 word answer, visibly rendered |
| A2 | Route pages lack a direct-answer block at the top — the first content is the meta description repeated | Medium | Add a "Direct Answer" component: "PTL and LTL freight from {from} to {to} covers {distance} km in ~{time} hours. Book part load from ₹{rate}/tonne..." |
| A3 | Blog articles lack structured "Key Takeaways" or "TL;DR" sections | Low | Add a KeyTakeaways component for articles where it adds value |

### 5.2 FAQ Content

**Status: PASS**

- 71+ blog articles, many with FAQs
- 3 guides with FAQs
- 14 location pages with local FAQs
- 9 transport-service pages with FAQs
- FAQPage schema only applied where FAQs are visibly rendered

**Issues:**
| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| A4 | Some blog FAQs contain specific rate figures (e.g., "₹1,800-2,500/tonne") that are estimates, not verified rates | Medium | Add "indicative" or "as of {date}" qualifiers |
| A5 | The `genericBlogFaq()` function generates FAQs from article summaries for articles without explicit FAQs — these are auto-generated and may not be accurate | Medium | Review auto-generated FAQs for accuracy; consider removing if they don't add value |

### 5.3 Content Freshness

**Status: NEEDS ATTENTION**

- Blog articles have `date` and `lastUpdated` fields
- Route pages have `dataStatus` field ("verified", "corrected", "needs_review")
- Many routes have `dataStatus: "needs_review"` — this is honest but may signal stale data

**Issues:**
| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| A6 | 26 of 48 routes have `dataStatus: "needs_review"` — over half the route data is flagged as unverified | High | Prioritize review of these routes; update distances, transit times, and rates |
| A7 | Blog articles have `lastUpdated` dates ranging from 2026-06 to 2026-10 — some are 4+ months old | Medium | Establish a content review cadence (quarterly for evergreen, monthly for rate-related) |
| A8 | No visible "Last updated" date on the rendered page for most content | Medium | Display `lastUpdated` visibly on blog/route/location pages |

---

## 6. GEO / Regional Pages

### 6.1 Location Pages (14 cities)

**Status: PASS with observations**

Cities: Rourkela, Ranchi, Kolkata, Bhubaneswar, Jamshedpur, Cuttack, Sambalpur, Angul, Jharsuguda, Burdwan, Dhanbad, Balasore, Berhampur, Visakhapatnam

Each city page includes:
- Name, state, description
- Industries, commodities
- Hub distances to nearby cities
- Rate ranges (FTL, PTL, LTL)
- Local FAQs
- WebPage + QAPage schema

**Issues:**
| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| G1 | Rate ranges on location pages (e.g., "₹38–55/kg" for FTL Steel from Rourkela) are **not sourced from verified transaction data** — they appear to be estimates | High | Either verify these rates against actual platform data or remove them; replace with a CTA to get a real quote |
| G2 | Hub distances on location pages differ from route page distances (e.g., Rourkela→Bhubaneswar is 310 km on location page but 340 km on route page) | High | Reconcile distances; use a single source of truth |
| G3 | No state hub pages (e.g., /location/odisha) — only city-level pages | Medium | Consider adding state hub pages that link to cities and corridors |
| G4 | No route pages for some city pairs that have location pages (e.g., Angul→Rourkela has no route page) | Low | This is fine — not all city pairs need route pages |

### 6.2 Route Pages (48 corridors)

**Status: PASS with observations**

Each route page includes:
- From/to cities and states
- Distance (km) and transit time (hours)
- Data status (verified/corrected/needs_review)
- Description and keywords
- Service + Offer + QAPage schema
- Rate bands (computed from `laneRates()`)

**Issues:**
| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| G5 | Route distances in `ROUTE_DATA` (agent.js) may differ from `routes.ts` (React app) — the comment says they mirror each other, but this is a manual sync | Medium | Use a single source of truth; generate both from one data file |
| G6 | Transit times are rounded to integers or simple decimals (e.g., "4", "7", "9.8") — these are estimates | Low | Add "approximately" or "~" qualifier in visible text |
| G7 | No reverse-route pages for some corridors (e.g., has rourkela-to-ranchi but not ranchi-to-rourkela in the sitemap) | Low | This is fine — the React app handles both directions via the same slug |

### 6.3 Anti-Doorway Safeguards

**Status: PASS**

- Only 14 city pages and 48 route pages — not hundreds of near-identical pages
- Each page has unique content (industries, commodities, FAQs, distances)
- No "we serve every city in India" claims
- No fake local addresses or offices
- No placeholder rate tables

---

## 7. Performance & UX

### 7.1 Core Web Vitals

**Status: NEEDS TESTING**

- No Lighthouse or PageSpeed Insights data in the repository
- The site uses deferred analytics loading (good)
- Manual chunk splitting in `vite.config.ts` (good)
- `hero-bg.webp` is preloaded with `fetchpriority="high"` (good)

**Issues:**
| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| P1 | No image dimensions on most images — potential CLS | Medium | Add `width`/`height` attributes to `<img>` tags |
| P2 | `hero-bg.webp` is preloaded but no `imagesrcset` for responsive loading | Low | Add responsive image srcset |
| P3 | No lazy loading on below-the-fold images | Medium | Add `loading="lazy"` to non-critical images |
| P4 | Framer Motion is bundled (vendor-motion chunk) — may cause layout shift if animations trigger reflow | Low | Ensure animations use `transform` and `opacity` only |

### 7.2 Mobile UX

**Status: PASS**

- Responsive design with Tailwind
- Mobile-specific components (MobileMenu, MobileTabBar, DockNav)
- Viewport meta tag present
- `viewport-fit=cover` for notched devices

### 7.3 Accessibility

**Status: NEEDS REVIEW**

**Issues:**
| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| A11y-1 | No accessibility audit in the repository | Medium | Run axe-core or Lighthouse accessibility audit |
| A11y-2 | Form labels — the `Label` component exists but may not be consistently associated with inputs | Medium | Verify all inputs have associated `<label>` or `aria-label` |
| A11y-3 | Image alt text — many images may have empty or missing `alt` attributes | Medium | Audit all `<img>` tags for meaningful alt text |
| A11y-4 | Color contrast — the dark theme (#050816 background) needs contrast verification | Low | Run contrast checker on key text/background combinations |

---

## 8. Conversion Tracking

### 8.1 Current State

**Status: PARTIAL**

- GA4 + GTM + Clarity + PostHog + Vercel Analytics all loaded
- Custom events tracked: `calculator_started`, `estimate_generated`, `route_view`, `quote_requested`, `tool_completed`, `whatsapp_clicked`, `register_started`, `article_view`, `whatsapp_lead_started`, `phone_added`, `phone_skipped`, `phone_nudge_clicked`
- Events sent to both PostHog and Vercel Analytics

**Issues:**
| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| T1 | No `quote_form_start` or `quote_form_submit` events — only `quote_requested` | Medium | Add form-level tracking |
| T2 | No `post_load_start` or `post_load_submit` events | Medium | Add post-load funnel tracking |
| T3 | No `transporter_signup_start` or `transporter_signup_complete` events | Medium | Add signup funnel tracking |
| T4 | No `click_phone` or `click_email` events (only `whatsapp_clicked`) | Medium | Add phone/email click tracking |
| T5 | No `view_service_page`, `view_location_page`, `view_route_page`, `view_guide` events | Medium | Add page-view events for key page types |
| T6 | `trackQuoteRequested` sends `name` and `phone` to PostHog — **this is PII** | High | Remove PII from analytics events; use a privacy-safe lead ID instead |
| T7 | No consent-aware loading — analytics load on first interaction regardless of consent | Medium | Integrate with CookieHub consent state |
| T8 | No `booking_or_order_complete` event | Medium | Add if a real completed event exists in the app |

### 8.2 Funnel Coverage

| Funnel Step | Tracked? | Event Name |
|-------------|----------|------------|
| Organic landing page | Partial | `article_view`, `route_view` |
| CTA click | Partial | `whatsapp_clicked` |
| Form start | No | — |
| Form submit | Partial | `quote_requested` |
| Qualified lead | No | — |
| Booked shipment | No | — |

---

## 9. Trust, Authorship & AAO

### 9.1 Authorship

**Status: PASS with observations**

- Blog articles have `author` and `authorBio` fields
- Authors include: Sanjaya Sahu (Founder & CEO), Priya Sharma (Product Lead), Amit Verma (Supply Chain Consultant), Rajesh Kumar (Logistics Operations Specialist), Vikram Singh (CTO), LoadSaathi Team
- Article schema includes author name and bio

**Issues:**
| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| TR1 | Author names like "Priya Sharma", "Amit Verma", "Rajesh Kumar", "Vikram Singh" — are these real people or pseudonyms? If pseudonyms, this may violate Google's authorship guidelines | High | Verify these are real, identifiable people; if not, use "LoadSaathi Team" |
| TR2 | No author profile pages | Low | Consider adding /about/team or /author/{slug} pages |
| TR3 | No "Reviewed by" or "Last reviewed by" for operational/compliance content | Medium | Add reviewer attribution for compliance-related content |

### 9.2 Trust Signals

**Status: PASS**

- /about page with company story
- /safety-trust page with trust features
- /pricing page with transparent fees
- /contact page with registered office address
- /privacy and /terms pages
- Organization and LocalBusiness schema with contact info

**Issues:**
| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| TR4 | No customer testimonials or reviews visible in the repository | Medium | If real reviews exist, add them; if not, don't fabricate |
| TR5 | No case studies with verifiable data | Medium | The blog has case-study category articles, but they may contain estimated data |
| TR6 | No "Editorial Policy" or "Correction Policy" page | Low | Consider adding for AAO trust signals |
| TR7 | No "Methodology" page explaining how rates are calculated | Medium | Add a rate methodology page for transparency |

### 9.3 Content Claims

**Status: NEEDS REVIEW**

**Issues:**
| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| CL1 | "Save up to 40% on freight costs" — this claim appears in multiple places | High | Ensure this is backed by real data; add "indicative" or "up to" qualifier |
| CL2 | "40% of Indian trucks run empty on return trips" — this is a commonly cited statistic but needs a source | Medium | Add source citation (e.g., "according to Ministry of Road Transport and Highways") |
| CL3 | "India's road freight market is worth USD 167.5 billion in 2026" — needs source | Medium | Add source citation (e.g., Mordor Intelligence) |
| CL4 | "78% of truckers reporting higher earnings after switching to digital matching" — needs source | Medium | Add source citation |
| CL5 | "12% of turnover on logistics vs 8% for large enterprises" — needs source | Medium | Add source citation |
| CL6 | "306 approved GCTs with 118 commissioned" — cited to PIB, good | Low | Keep the citation |
| CL7 | "E-freight deployments grew from 201 vehicles in FY25 to 826 in FY26" — cited to NITI Aayog/PIB, good | Low | Keep the citation |

---

## 10. Implementation Backlog

### P0 — Critical (Fix Immediately)

| # | Issue | Fix | Files |
|---|-------|-----|-------|
| P0-1 | Remove PII from analytics events (`name`, `phone` in `trackQuoteRequested`) | Replace with privacy-safe lead ID or hash | `supabase/src/utils/analytics.ts` |
| P0-2 | Verify or remove rate figures on location pages | Either source from real data or remove | `supabase/src/data/locations.ts`, `api/agent.js` LOCATION_DATA |
| P0-3 | Reconcile distance discrepancies between location pages and route pages | Use single source of truth | `supabase/src/data/locations.ts`, `supabase/src/data/routes.ts`, `api/agent.js` |
| P0-4 | Verify author names are real people | Confirm with business owner; if not, use "LoadSaathi Team" | `api/agent.js` BLOG_DATA |
| P0-5 | Add "indicative" or "estimated" qualifiers to all rate figures | Update visible text | `api/agent.js`, `supabase/src/data/routes.ts` |

### P1 — High Priority (Fix Within 2 Weeks)

| # | Issue | Fix | Files |
|---|-------|-----|-------|
| P1-1 | Add `lastmod` from actual content timestamps | Use `lastUpdated` fields from data files | `scripts/generate-sitemap.mjs` |
| P1-2 | Add Direct Answer component to location and route pages | Create reusable component | `supabase/src/pages/public/locations/LocationPage.tsx`, `supabase/src/pages/public/RouteDetail.tsx` |
| P1-3 | Add missing conversion events | Implement tracking | `supabase/src/utils/analytics.ts` |
| P1-4 | Remove hardcoded `dateModified` default in SeoMeta | Only set when explicitly provided | `supabase/src/components/SeoMeta.tsx` |
| P1-5 | Add `Disallow: /share/`, `/screens/`, `/transport/` to robots.txt | Update robots.txt | `public/robots.txt` |
| P1-6 | Add source citations to statistical claims | Update blog content | `api/agent.js` BLOG_DATA, `supabase/src/data/blog.ts` |
| P1-7 | Display `lastUpdated` visibly on content pages | Add to page templates | `supabase/src/pages/blog/BlogArticle.tsx`, `supabase/src/pages/public/RouteDetail.tsx` |
| P1-8 | Add lazy loading to below-the-fold images | Update image components | All page components |

### P2 — Medium Priority (Fix Within 1 Month)

| # | Issue | Fix | Files |
|---|-------|-----|-------|
| P2-1 | Generate per-page OG images | Create OG image generation script | `scripts/generate-og-images.mjs` |
| P2-2 | Add state hub pages | Create /location/odisha etc. | `supabase/src/pages/public/locations/` |
| P2-3 | Add accessibility audit | Run axe-core in CI | `package.json`, CI config |
| P2-4 | Add schema validation to build | Create validation script | `scripts/validate-schema.mjs` |
| P2-5 | Add author profile pages | Create /author/{slug} pages | `supabase/src/pages/public/` |
| P2-6 | Add editorial policy and correction policy pages | Create new pages | `supabase/src/pages/public/` |
| P2-7 | Add rate methodology page | Create /methodology page | `supabase/src/pages/public/` |
| P2-8 | Split BLOG_SLUGS in canonicalRegistry to be generated from blog.ts | Refactor | `supabase/src/config/canonicalRegistry.ts` |
| P2-9 | Add consent-aware analytics loading | Integrate with CookieHub | `index.html`, `supabase/src/utils/posthog.ts` |
| P2-10 | Add image dimensions to prevent CLS | Audit and fix | All components |

---

## 11. Files Inspected

| File | Purpose |
|------|---------|
| `index.html` | Static shell, base SEO, JSON-LD, analytics |
| `package.json` | Dependencies |
| `vite.config.ts` | Build config |
| `vercel.json` | Deployment config |
| `public/robots.txt` | Crawler directives |
| `public/sitemap.xml` | XML sitemap |
| `public/llms.txt` | AI agent summary |
| `scripts/generate-sitemap.mjs` | Sitemap generator |
| `scripts/prerender.mjs` | Build-time prerender |
| `scripts/smoke.mjs` | Post-build smoke test |
| `api/agent.js` | Edge Function: SEO injection, redirects, content negotiation |
| `api/site.js` | Shared site facts |
| `supabase/src/routes.tsx` | React Router config |
| `supabase/src/components/SeoMeta.tsx` | Client-side metadata |
| `supabase/src/config/site.ts` | Site facts (React) |
| `supabase/src/config/canonicalRegistry.ts` | Canonical URL registry |
| `supabase/src/data/locations.ts` | City data |
| `supabase/src/data/routes.ts` | Route data |
| `supabase/src/data/blog.ts` | Blog article data |
| `supabase/src/data/guides.ts` | Guide data |
| `supabase/src/data/transportServices.ts` | Transport service data |
| `supabase/src/pages/public/locations/LocationPage.tsx` | Location page component |
| `supabase/src/utils/analytics.ts` | Event tracking |
| `supabase/src/utils/posthog.ts` | PostHog initialization |
| `supabase/src/pages/blog/BlogArticle.tsx` | Blog article page |
| `supabase/src/pages/public/RouteDetail.tsx` | Route detail page |

---

## 12. Missing Business Data Required from Owner

The following data is needed to complete the SEO/AAO implementation:

| # | Data Needed | Priority | Used For |
|---|-------------|----------|----------|
| 1 | **Verified freight rates** — actual transaction data or rate bands per corridor | High | Location pages, route pages, rate schema |
| 2 | **Verified transit times** — actual delivery times per corridor | High | Route pages, schema |
| 3 | **Author verification** — confirm all author names are real people | High | Article schema, authorship |
| 4 | **Company founding date** — verify 2025 is correct | Medium | Organization schema |
| 5 | **Area served verification** — confirm Bihar and Chhattisgarh are served | Medium | LocalBusiness schema |
| 6 | **Customer testimonials** — real reviews with permission | Medium | Trust signals |
| 7 | **Case study data** — real shipment data with customer permission | Medium | Case study pages |
| 8 | **Rate methodology** — how rates are calculated | Medium | Methodology page |
| 9 | **Content review cadence** — how often rates/guides are updated | Medium | Freshness signals |
| 10 | **Team/reviewer details** — names and roles for attribution | Low | Authorship, reviewer schema |

---

## 13. Summary

### What's Working Well
- Sophisticated dual metadata system (client + server)
- Comprehensive structured data coverage
- Build-time sitemap generation from single-source registries
- AI-crawler-aware robots.txt
- Content negotiation for AI agents
- Build-time prerendering
- Transparent fee disclosure
- Honest data status flags on routes

### What Needs Attention
- **Rate figures are estimates, not verified data** — this is the biggest risk
- **Distance discrepancies** between location and route pages
- **PII in analytics events** — privacy risk
- **Author verification** — potential authorship guideline violation
- **Missing conversion tracking** — incomplete funnel visibility
- **No content freshness display** — lastUpdated not visible to users
- **No source citations** for statistical claims

### Top 5 Highest-Priority Fixes
1. **Remove PII from analytics events** (privacy compliance)
2. **Verify or remove rate figures** on location/route pages (accuracy)
3. **Reconcile distance discrepancies** between data sources (consistency)
4. **Add Direct Answer components** to location and route pages (AEO)
5. **Add source citations** to statistical claims (E-E-A-T)

---

*End of audit report.*
