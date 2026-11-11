# LoadSaathi SEO Restructuring — Implementation Plan

**Date:** 2026-11-03
**Scope:** Technical + on-page SEO improvements for loadsaathi.in
**Evidence base:** Repository inspection (branch `freddy-copilot`), live production probes (raw HTML), Search Console exports (D:\Downloads, 2026-10-05→11-01), and existing SEO docs (`docs/seo/`, `docs/technical-seo-changes.md`).

> **Note on the audit workbook:** `LoadSaathi_215_URL_SEO_Restructuring_Audit_2026-11-03.xlsx` was not present in the environment. Per user decision, this plan uses the repository + Search Console exports as the evidence base. Workbook-specific items (URL Audit, Fix Queue detail) are listed as **assumptions to verify** where the live site could not confirm them.

---

## 1. Existing architecture

| Layer | Implementation |
|---|---|
| Framework | Vite 6 + React 19 SPA, TypeScript, react-router-dom v7 |
| Source root | `supabase/src` (alias `@` → `supabase/src`) |
| Deployment | Vercel (Hobby). `vercel.json` rewrites all non-asset, non-api paths to `api/agent.js` (edge function) |
| SSR / crawl-visible HTML | `api/agent.js` injects per-page `<title>`, meta tags, canonical, JSON-LD, and a long-form content block into the `#ssr-fallback-content` slot of `index.html`. JS clients hide this fallback and hydrate the real React app |
| Client-side metadata | `supabase/src/components/SeoMeta.tsx` — imperative DOM head management, replaces stale static tags on hydration |
| Build pipeline | `prebuild` (env validate → blog meta → sitemap → llms routes) → `vite build` → `prerender.mjs` (headless Chrome dumps of ~40 static routes into `dist/<route>/index.html`) → `smoke.mjs` (bundle presence, sitemap validity) |
| Sitemap | `scripts/generate-sitemap.mjs` → `public/sitemap.xml` (215 URLs today; matches Search Console submitted count) |
| Robots | `public/robots.txt` — allows all, blocks auth/private/noindex areas, explicit AI-crawler allows, sitemap declared |

## 2. Files responsible for SEO

| File | Role |
|---|---|
| `api/agent.js` (≈420 KB) | Server-side SEO engine: route registry, redirects, per-page metadata, JSON-LD, content injection. Single source of truth for crawl-visible HTML |
| `supabase/src/components/SeoMeta.tsx` | Client-side head management (title/desc/canonical/hreflang/OG/Twitter/JSON-LD/breadcrumbs) |
| `supabase/src/pages/Index.tsx` | Homepage: owns its own SeoMeta props + JSON-LD (Organization/WebSite/FAQPage/Service) |
| `supabase/src/data/*.ts` | Content sources: `routes.ts` (48), `locations.ts` (14), `blog.ts` (86), `guides.ts` (3), `transportServices.ts` (9), `blogMeta.ts`, `routeMeta.ts` |
| `public/index.html` | Static shell: default tags, Organization/WebSite JSON-LD, preconnects, no-JS fallback |
| `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt` | Crawler directives, sitemap, AI-readable summary |
| `scripts/generate-sitemap.mjs`, `scripts/prerender.mjs`, `scripts/smoke.mjs`, `scripts/check-site-drift.mjs`, `scripts/seo-coverage-check.mjs` | Build-time/verification tooling |
| `vercel.json` | Rewrites, redirects (www→apex), headers/CSP, caching |

## 3. Route and template inventory

| Group | Count | URLs | Template |
|---|---|---|---|
| Home | 1 | `/` | `pages/Index.tsx` (+ `features/home/sections/*`) |
| Core public | ~20 | `/about /contact /pricing /faq /features /how-it-works /safety-trust /compare* /solutions/* /gallery /sitemap /data /for-msmes /ai-logistics ...` | `pages/public/*` |
| Commercial landing | 6 | `/return-load /ptl-transport /ltl-transport /truck-load-booking /freight-marketplace /truck-near-me` | `pages/public/commercial/*` |
| Tools | 19 | `/tools/fare-calculator ... /tools/load-securing-checklist` + legacy `/transport-cost-calculator`, `/truck-load-calculator`, `/freight-rate-calculator`, `/return-load-calculator`, `/ptl-vs-ftl-calculator` | `pages/public/tools/*` |
| Routes | 48 | `/routes/:slug` | `pages/public/RouteDetail.tsx` (data-driven) |
| Locations | 14 | `/location/:city` (+ alias `/transport/:city` → 301) | `pages/public/locations/LocationPage.tsx` |
| Transport services | 9 | `/transport-service/:city` | `pages/public/transport/TransportServicePage.tsx` |
| Guides | 3 | `/guide/:slug` | `pages/public/guides/GuidePage.tsx` |
| Blog | 86 | `/blog`, `/blog/:slug` | `pages/blog/BlogList.tsx`, `BlogArticle.tsx` |
| Hindi | 5 | `/hi`, `/hi/ptl-transport`, `/hi/return-load`, `/hi/bhada-kaise-book-kare`, `/hi/route/rourkela-to-ranchi` | `pages/public/hi/*` |
| Private/app | many | `/login /register /trucker/* /shipper/* /admin/* /profile /messages /trips/* ...` | auth + role-protected layouts (noindex) |
| Share | 2 patterns | `/share/trip/:id`, `/share/shipment/:id` | noindex + shared og tags |

## 4. Confirmed issues (verified against code + live site)

1. **Homepage raw HTML has no H1** — live probe of `https://loadsaathi.in/` (Age≈31k s, stale CDN cache) shows zero `<h1>`; the injected content block is absent from that cached response. Current code *does* inject an H1 for `/` (verified working on `/return-load`, `/ltl-transport`, etc.). Root cause = stale Vercel/CDN edge cache of an older `index.html` response. Homepage also shows only the hero copy client-side before React mounts.
2. **Stale-cache risk for the homepage** — `Cache-Control: public, max-age=0, must-revalidate` is still serving an ~8.7 h old response with `Age` header. Need cache-busting/revalidation verification and a purge + re-request after deploy.
3. **Conflicting foundingDate** — `public/index.html` Organization schema says `foundingDate: "2025"`; `pages/Index.tsx` client JSON-LD says `"2024"`. Must reconcile (needs human confirmation of the true value).
4. **Meta-description copy smell on routes** — e.g. `/routes/rourkela-to-ranchi` description contains `(distance pending re-verification)`; several routes carry `dataStatus: "needs_review"`. Clean the copy; verify the dataset.
5. **Missing workbook findings** — the 215-URL audit rows (URL Audit / Fix Queue / On-Page Findings) are not available; per-page discrepancies beyond those probed above remain as assumptions to verify during implementation (see §7).
6. **Search Console signals** (evidence):
   - Pages gaining impressions (2026-10-05→11-01): `/tools/fare-calculator` (321 impr / 7 clicks), `/tools/truck-load-calculator` (54), `/routes/bhubaneswar-to-vizag` (14), `/routes/rourkela-to-kolkata` (10), `/location/kolkata` (12) → prioritize these for conversion content.
   - Pages losing impressions: `/ltl-transport` (−39), `/blog/truck-transport-cost-per-km-india-2026` (−25), `/return-load` (−8), `/gallery` (−6), several route blogs (−1…−9) → check for redirects/duplicates and revisit on-page quality; survive the "crawled — not indexed" state.
   - Duplicate pair `/blog/ptl-vs-ftl-when-to-use-each` → `/guide/ptl-vs-ftl` already 301s; the lost-page row for `/blog/ptl-vs-ftl-when-to-use-each` is consistent with consolidation (expected).
7. **No live `hreflang` mismatch** — EN↔HI alternates exist and are reciprocal; verified on `/`, `/hi`, `/ptl-transport`, `/return-load`, `/routes/rourkela-to-ranchi`.
8. **Sitemap consistency** — 215 URLs, zero errors per SC baseline; generator excludes redirect/noindex/private URLs. Keep single-file under 50K.

## 5. Proposed changes (by mission priority)

### Priority 1 — Homepage (smallest effective change)
- Confirm + verify the server-injected H1 and content block reach production raw HTML (redeploy → purge → probe). If still absent, fix `injectContentBlock` slot matching for the deployed `index.html` (whitespace-sensitive regex) and/or force revalidation via Vercel cache header adjustment for `/`.
- Improve the **crawl-visible block** for `/` in `api/agent.js` (static branch): make the heading a purposeful H1 (e.g. **"Move Goods Smarter with Shared Freight"**), then an intro paragraph that explains LoadSaathi, shipper pathway, transporter pathway, PTL/LTL explanation, internal links (solutions, routes, tools), and a commercial CTA — relation-driven, not keyword-stuffed.
- Don't change the client-side hero H1 (already good: "Book Trucks & Part Loads Across East India"); keep conversion UX.
- Reconcile Organization `foundingDate` + homepage FAQ claims ("50+ cities", "25+ corridors", "2–5%" vs "1.5–3%") with product reality before touching structured data.

### Priority 2 — Canonical / Soft-404 (verification only; no redirects)
- All four flagged pages verified live as 200 + self-canonical + H1. Record in the report as resolved; request re-indexing via Search Console URL Inspection after deployment; no code changes.
- Keep the rule: never canonicalize an independent commercial landing page to the homepage.

### Priority 3 — Tools (18 pages + hub)
- Audit `supabase/src/pages/public/tools/*` + `public/pages/Tools.tsx` for presence of: purpose, input-field explanation, methodology, worked example, interpretation, limitations/assumptions, FAQ, contextual links, CTA. Add missing blocks to the shared `SeoMeta` data and/or page components.
- Standardize tool titles/descriptions (dedupe `transport-cost-calculator` vs `/tools/*` aliases by using one canonical URL per tool — already 301-redirected; keep as-is).
- Ensure no duplicate-intent tools (e.g. fare vs freight-rate vs transport-cost calculators) — keep functionality, differentiate positioning copy.
- The fare calculator already earns impressions → optimize its copy + internal links first.

### Priority 4 — Routes (48 pages)
- Keep URLs. Improve `ROUTE_DATA` entries for commercially relevant corridors (Rourkela↔Ranchi, Rourkela↔Bhubaneswar, Rourkela↔Jamshedpur, Bhubaneswar↔Cuttack, Bhubaneswar↔Sambalpur, Bhubaneswar↔Jamshedpur, Bhubaneswar↔Kolkata, etc.).
- Replace "needs_review" language with verified route facts where the dataset is confirmed; otherwise omit unverified specifics. Never invent distances/transit/rates beyond existing verified data.
- Ensure reverse-route linking + location-page cross-links (route ↔ origin/destination cities).

### Priority 5 — Locations & transport services (14 + 9 pages)
- Validate each city page's claims (no "active local operations/guaranteed trucks" unless true). Improve city-specific descriptions, freight use-cases, route links, local FAQs, CTA.

### Priority 6 — Blog/guides (86 + 3)
- Fix duplicate blog topics if any (e.g. `truck-transport-cost-per-km-india` vs `-2026`). Verify slug uniqueness in `blog.ts`.
- Ensure Article JSON-LD (author, publishedTime, real dateModified only when actually updated), meta descriptions within 140–160 chars, one H1, descriptive H2/H3.
- Prioritize impression-earning articles for copy improvements; do not rewrite all.

### Priority 7 — Internal linking
- Introduce a deterministic `relatedLinksFor()` improvement in `api/agent.js` (and matching client components): tools hub ↔ calculators; route ↔ reverse route ↔ origin/dest cities ↔ guide ↔ booking CTA; blog ↔ contextual product/calculator/route.
- Keep footers clean — no hundreds of repetitive links.

### Priority 8 — Technical SEO
- Sitemap: keep current generator; consider adding `hreflang` alternates are not required in sitemap (keep single set).
- Robots: verify no block of newly important paths; keep noindex policies for private areas.
- Head canonical/hreflang/X-default: already consistent server+client; regression-test.
- Structured data: drop invalid Q&A markup if any (SC reported 3 invalid Q&A enhancements in recovery doc — confirm and fix or remove).
- Core Web Vitals: verify after changes (no code regressions); keep image dimensions/lazy-load patterns.

### Priority 14 — Hindi
- Preserve `/hi/*`; correct any reciprocals, language attributes, natural copy; no mechanical translation.

## 6. Explicit non-goals (guardrails)

- No URL/slug/domain changes; no bulk redirects; no deleting pages.
- No noindex additions for thin-but-indexable pages.
- No Supabase schema/RLS/policy changes; no auth changes; no dashboard changes.
- No invented prices, testimonials, trips, loads, coverage, or rates.
- No full-site rewrites; no arbitrary formulas.
- No deployment without explicit user approval.

## 7. Risks

| Risk | Mitigation |
|---|---|
| `api/agent.js` regex injection breaks on some page | Extend `smoke.mjs` + `seo-coverage-check.mjs` to assert one H1, one canonical, one description per sampled route; test before deploy |
| Client/server metadata drift | `SeoMeta` and agent.js must stay mirroring; add drift test (blog slugs already covered; extend to routes/locations/tools) |
| Stale CDN cache hides fixes | After deploy, purge/request revalidation, probe raw HTML (title/canonical/H1) with `Age`-fresh response |
| Changing shared templates breaks other pages | Identify dependent pages before touching a shared component; small batches; run full build + vitest |
| Unverified route/location data violates "no invented claims" | Only edit content that is sourced from existing repo data; mark any new factual claims as needing human verification |
| Missing workbook rows leave gaps | Track as "assumptions to verify"; verify each per-page before changing (live probe) |
| Homepage FAQ/schema claims mismatch reality | Combine with human confirmation; adjust copy/schema to match actual product terms |

## 8. Testing strategy

Per stage, run:
1. `pnpm lint` (eslint) and `pnpm typecheck` (tsc --noEmit)
2. `pnpm test` (vitest — existing suites: utils, tracking, security-headers, phone, newTools, csp-report, agentic-readiness, chat, command-center)
3. `pnpm build` (prebuild: blog-meta/sitemap/llms → vite build → prerender → smoke). Smoke asserts dist health + sitemap validity.
4. Route-level HTML assertions via `scripts/seo-coverage-check.mjs` (extend as needed) + live raw-HTML probes (title, description, canonical, robots, one H1, JSON-LD valid).
5. Representative page checklist: home, shipper landing, transporter landing, route page, location page, blog article, calculator, Hindi page — desktop + mobile viewport.

## 9. Implementation sequence (controlled stages)

| Stage | Work | Depends on |
|---|---|---|
| **A. Discovery** | ✅ Done — inspect repo, live probes, SC exports, write this plan | — |
| **B. Technical foundation** | Fix homepage injected H1/content + cache revalidation verification; reconcile Organization foundingDate; extend smoke/coverage checks for H1/canonical/description; clean route meta-desc copy (no data changes); refresh sitemap if needed | A |
| **C. Commercial landing pages** | Improve shipper/transporter/booking/return-load pages (copy → CTA present in crawl-visible block); highest-priority route + location pages (Rourkela/Ranchi/Bhubaneswar/Cuttack/Jamshedpur/Sambalpur + top lanes) | B |
| **D. Tools** | Add missing explanation blocks to calculator pages (purpose/inputs/method/example/limits/FAQ/links/CTA) — content only, preserve calculator logic | B |
| **E. Educational content** | Priority articles + guides (impression-earning first); fix metadata/structured-data issues; dedupe topics | B |
| **F. Final verification** | Full build + tests; route vs workbook compare (as available); write `SEO_IMPLEMENTATION_REPORT.md`, `SEO_ROUTE_VALIDATION.csv`, modified-file list, build/test results | C–E |

**Batching rule:** each stage = a reviewable PR-sized batch; shared components touched only with a dependency map; no batch that touches > ~10 files without a checkpoint.

## 10. Required deliverables (final)
1. ✅ `SEO_IMPLEMENTATION_PLAN.md` (this file)
2. `SEO_IMPLEMENTATION_REPORT.md`
3. `SEO_ROUTE_VALIDATION.csv`
4. Updated `public/sitemap.xml` (regenerated by build; only if URLs changed)
5. Modified-file list + route test list
6. Before/after metadata for modified pages
7. Unresolved Search Console issues list
8. Changes needing human approval (e.g. foundingDate, FAQ term claims, rate data verification)
9. Build and test results

## 11. Open questions for human approval
- True `foundingDate` (2024 vs 2025)?
- Homepage FAQ/fee claims ("2–5%" vs "1.5–3%"), "50+ cities", "25+ corridors" — keep, adjust, or soften?
- Route `dataStatus: needs_review` items — are distances/transit values verified?
- Deployment approval for each stage (explicit per stage).
