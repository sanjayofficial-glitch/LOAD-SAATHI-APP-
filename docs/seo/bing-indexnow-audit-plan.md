# LoadSaathi — Bing Webmaster Tools & IndexNow: Audit + Implementation Plan

**Date:** 2026-11-12
**Author:** Technical SEO engineer (agent)
**Status:** AUDIT COMPLETE — awaiting approval before implementation
**Scope:** Bing Webmaster Tools integration, IndexNow automation, sitemap/Bing verification, backlink plan. No Google SEO regression, no Supabase/auth/app changes, no page deletion, no deploy without approval.

---

## 1. Executive summary

The site already has a mature, well-audited SEO foundation (single source of truth in `api/agent.js` + `SeoMeta.tsx`, build-generated sitemap, robots.txt, prerendering, and 215 verified URLs). The Bing-specific gaps are narrow and additive:

1. **No IndexNow integration exists** (grep confirmed zero references).
2. **No Bing verification tag in code** — the property is verified (per owner) via DNS/file, which is fine.
3. **robots.txt does not block Bingbot** — `User-agent: *` allows everything; nothing to fix.
4. **Sitemap is Bing-ready** as-is; only needs submission in Bing Webmaster Tools (manual step).
5. **Backlinks**: real weakness per Bing's own diagnostic; needs a legitimate outreach plan.

---

## 2. Phase 1 — Architecture audit (findings)

| Area | Finding | Evidence |
|---|---|---|
| Framework / deploy | React 19 + Vite 6 SPA → `dist/`, deployed on Vercel; `api/agent.js` edge-rendered injects per-page title/meta/canonical/JSON-LD/content for crawlers | `package.json`, `vercel.json`, prior reports |
| Sitemap | `scripts/generate-sitemap.mjs` regenerates `public/sitemap.xml` pre-build from the same data sources as routes (single source of truth). **215 canonical URLs, verified live 200.** No duplicate/redirect/noindex/404 URLs. `lastmod` is honest (real publish/edit dates, stable baseline) | `public/sitemap.xml` (215 entries), sitemap generator, live fetch |
| Sitemap URL breakdown | 86 blog + 48 routes + 30 static + 20 tools + 14 locations + 9 transport-services + 5 Hindi + 3 guides = 215 | computed from live sitemap |
| robots.txt | Allows all (`User-agent: *`), blocks auth/private areas (`/login`, `/admin/`, `/trucker/`, `/shipper/`, `/profile`, `/messages`, `/trips/`, `/share/`, `/screens/`, `/transport/`, `/api/`, `/onboarding`, …). Declares `Sitemap: https://loadsaathi.in/sitemap.xml`. AI crawlers explicitly allowed. **Bingbot is NOT blocked.** | `public/robots.txt` + live fetch, 200 |
| Canonical URLs | Self-referencing on all 215 URLs (live-verified). Server+client mirror. Homepage canonical = `https://loadsaathi.in/`. | `SEO_ROUTE_VALIDATION.csv`, prior reports |
| Vercel config | `vercel.json`: www→apex 301 permanent; `/` and SPA routes rewritten to `api/agent.js`; `sitemap.xml` served with `application/xml`; CSP/security headers; 3 existing crons (`api/cron/*`) run as serverless functions with `CRON_SECRET` bearer auth | `vercel.json`, `api/cron/daily.js` |
| SEO metadata | `index.html` static defaults + `api/agent.js` server injection + `SeoMeta.tsx` client hydration. OG/Twitter/JSON-LD (Organization, LocalBusiness, WebSite, Article) present | repo |
| Bing specifics | No msvalidate meta (verified via other method — OK). No bingbot UA handling in `agent.js` (no UA branching at all → Bingbot receives identical crawl HTML as Googlebot). No IndexNow. | grep, index.html |
| Indexable vs non-indexable | Indexable = the 215 sitemap URLs. Non-indexable = auth/private/dashboard/share/screens/API paths (blocked in robots.txt and/or served `noindex, follow`) | robots.txt, prior CSV |
| Duplicates / redirects | Legacy aliases (`/transport/:city`, old calculator URLs, `/blog/ptl-vs-ftl-when-to-use-each`, `/location/vizag`) are clean one-hop 301s; not in sitemap. No broken canonicals. | prior CSV §10.1 |
| Homepage cache | The earlier "stale CDN homepage" issue is **resolved live** — homepage now returns the injected H1 + content block (fetched 2026-11-12). | live fetch |
| Bing exit recommendation | "Not enough inbound links from high quality domains" → Phase 5 plan below | BWT diagnostic |

**Conclusion:** no remediation needed for robots/Bingbot/canonicals/sitemap content. The work is additive: IndexNow key file + submission utility + cron + documentation + manual Bing steps + backlinks.

---

## 3. Phase 2 — IndexNow implementation design

### 3.1 Protocol (verified against indexnow.org/documentation)

- Key: `9524fce83efa44d6845fabaaa587ee5c` (32 hex chars — valid per spec). Provided by owner via `d:\Downloads\9524fce83efa44d6845fabaaa587ee5c.txt`.
- **Option 1 (recommended by spec):** UTF-8 key file at **site root**: `https://loadsaathi.in/9524fce83efa44d6845fabaaa587ee5c.txt` containing exactly the key.
- Batch submission: `POST https://api.indexnow.org/indexnow` with JSON `{ "host": "loadsaathi.in", "key": "…", "keyLocation": "https://loadsaathi.in/…txt", "urlList": [ … ] }` — up to 10,000 URLs per POST.
- Response semantics: `200` = received (NOT indexed — never claim indexing), `202` = accepted/key validation pending, `400` invalid format, `403` key invalid, `422` URLs don't belong to host, `429` rate-limited (retry with backoff).
- Key file location determines scope; root file covers all paths (Option 1).

### 3.2 Components (all new, additive — nothing modified)

| File | Purpose |
|---|---|
| `public/9524fce83efa44d6845fabaaa587ee5c.txt` | IndexNow key file (static; public by design; served from `dist/` root → HTTPS 200) |
| `api/indexnow.js` | Serverless submission endpoint (Node runtime, like `api/cron/daily.js`). Validates host/key/URLs; enforces allowlist (only canonical `https://loadsaathi.in` URLs matching sitemap patterns); batches ≤10k; handles 200/202/400/403/422/429 with retry/backoff; logs every attempt; requires `Authorization: Bearer $INDEXNOW_API_TOKEN` so the endpoint can't be abused |
| `api/cron/indexnow.js` | Daily cron (add one entry to `vercel.json` crons) — stateless incremental submitter: fetches live `sitemap.xml`, submits URLs whose `lastmod` is within the last 72 h (new/changed content), plus homepage. Never resubmits stale URLs. Logs counts per run |
| `scripts/submit-indexnow.mjs` | CLI/manual tool: `node scripts/submit-indexnow.mjs --seed` (full 215-URL seed after deploy), `--latest` (same 72 h window), `--url <u>` (single). Reads key from env `INDEXNOW_KEY` |
| `scripts/generate-indexnow-key.mjs` | Prebuild guard: writes `public/<key>.txt` from `INDEXNOW_KEY` env when set (validates 8–128 hex); verifies committed key file matches env; fails build on mismatch/missing (never invents a key) |
| `.env.example` additions | `INDEXNOW_KEY=` (public key), `INDEXNOW_API_TOKEN=` (secret bearer for the endpoint) — documented, no values committed |
| `vercel.json` | +1 cron entry `{ "path": "/api/cron/indexnow", "schedule": "0 6 * * *" }` (IST morning → 00:30 UTC) |

### 3.3 Trigger mapping (requirement 7)

| Event | Trigger |
|---|---|
| New SEO page published | Slug added to data → sitemap gains URL with `lastmod` ≈ publish date → daily cron submits within 72 h. Also `--url`/`--seed` manual on deploy |
| Existing SEO page materially updated | `lastUpdated`/`lastmod` bumped in data → sitemap `lastmod` changes → cron submits |
| Page permanently deleted | Explicitly out of scope by guardrails (no page deletion). If ever needed: `--url <u>` submits it (Bing then sees 404 and drops it) — API supports this without app changes |
| Dedupe | Stateless by design: only URLs with recent `lastmod` are submitted; seed is one-time manual; IndexNow URL hashing ignores duplicates at their end. No state storage needed (no Supabase/KV changes) |

### 3.4 Validation, logging, retry, error reporting

- Pre-submit validation: URL must be `https://loadsaathi.in/…`, already present in the live sitemap (or explicit manual override), pattern-allowed (homepage, routes, locations, transport-services, guides, blog, tools, static marketing pages, Hindi) — admin/auth/share/screens/api paths rejected.
- Logging: structured `console.log` (Vercel function logs) with timestamp, action, URL count, IndexNow HTTP status, per-batch error detail. Seed/cron summary lines.
- Retry: on 429 → exponential backoff (e.g., 60 s → 300 s, max 3 attempts per batch). On 400/403/422 → log + stop (config error, no silent DDoS).
- Error reporting: failure summary surfaced in the cron response (visible in Vercel cron runs) and documented in a `docs/seo/indexnow-log.md` note; no external alert integration required (no new dependencies).

### 3.5 Guardrail compliance

- No Supabase tables/auth modified. No app behavior changed. No URLs changed/deleted. No existing metadata touched.
- `INDEXNOW_KEY` is public by design (it must be publicly crawlable); `INDEXNOW_API_TOKEN` stays secret.
- No auto-deploy; seed runs only after owner deploys.

---

## 4. Phase 3 — URL coverage summary

Eligible to submit (from live sitemap, 215): all categories below.

| Group | Count | Examples |
|---|---|---|
| Homepage | 1 | `/` |
| Core public | 30 | `/about /contact /pricing /faq /features /how-it-works /safety-trust /return-load /ptl-transport /ltl-transport /truck-load-booking /freight-marketplace /truck-near-me /solutions/* /compare/* /privacy /terms /for-msmes /ai-logistics /data /routes /blog /guide /sitemap /gallery` |
| Tools/calculators | 20 | `/tools/*` (19) + `/transport-cost-calculator` |
| Route pages | 48 | `/routes/:slug` |
| Location pages | 14 | `/location/:city` |
| Transport services | 9 | `/transport-service/:city` |
| Guides | 3 | `/guide/:slug` |
| Blog | 86 | `/blog/:slug` |
| Hindi | 5 | `/hi`, `/hi/ptl-transport`, `/hi/return-load`, `/hi/bhada-kaise-book-kare`, `/hi/route/rourkela-to-ranchi` |

**Never submit:** `/login /register /choose-role /onboarding /forgot-password /auth-sync /admin/* /trucker/* /shipper/* /profile /messages /chat/* /favorites /credit-score /browse-trucks /trips/* /dashboard /share/* /screens/* /api/* /csp-report` (blocked/noindex or non-canonical).

---

## 5. Phase 4 — Sitemap & Bing integration

1. **Sitemap validation:** done — `https://loadsaathi.in/sitemap.xml` returns 200 `application/xml`, 215 canonical URLs, no robots/noindex/404/redirect URLs, valid XML.
2. **Exact URL to submit in Bing Webmaster Tools:** **`https://loadsaathi.in/sitemap.xml`** (BWT → Sitemaps → submit; also ensure the site is the apex host).
3. **robots.txt:** already references the sitemap and doesn't block Bingbot. No change needed.
4. **Google compatibility preserved:** sitemap content unchanged in structure (same 215 URLs); no duplicate sitemaps created; Google's submitted sitemap URL is the same file.
5. **Manual steps remaining (owner):** submit sitemap in BWT; optionally re-run BWT "Validate site" + IndexNow check; verify key file appears in BWT after first submission.

---

## 6. Phase 5 — Legitimate backlink improvement plan

Target: high-quality, relevant, non-spam inbound links. Focus areas (highest impact first):

1. **NIT Rourkela — FTBI startup profile (anchor priority).**
   - Ensure LoadSaathi's FTBI incubatee profile is complete and current (NIT Rourkela FTBI website/startup directory) with correct URL + description. If already listed, request a reciprocal profile link from the LoadSaathi site to the FTBI page (earns a link from an authoritative `.ac.in` domain).
   - Register/update on NIT Rourkela's startup showcase pages and any FTBI press/portfolio pages.
2. **Startup ecosystem directories (editorial/curated, free).**
   - Product Hunt (launch), BetaList, TAAFT (There's An AI For That) — as an AI-powered freight marketplace, YC Startup School directory (free founder profile), Startup India (DPIIT recognized startup registry — government link), Crunchbase (profile), AngelList/Wellfound (profile), F6S, OpenStartup, StartupLift, TechTable, Indie Hackers (founder story post), G2/Capterra/SoftwareAdvice (listing for the platform product).
   - Each must be a genuine profile/listing, not paid link insertion.
3. **Logistics & transport industry publications (editorial/PR).**
   - Indian Transport & Logistics News (ITLN), Logistics Insider, STAT Media Group (The STAT Trade Times), Motopress/cargo-oriented blogs, The Logistics Point, ET Infra/Financial Express logistics sections, Odisha business press (Sambad Business, Prameya) — pitch the "return load / empty kilometers" story + FTBI + Rourkela corridor angle.
   - Relevant industry association pages: e.g., CFCF (Container Freight & Cargo Forwarders), local transporter associations in Rourkela/Ranchi.
4. **Relevant business directories (curated, niche).**
   - Justdial / IndiaMART (business listings — moderate value; treat as presence, not ranking levers), Google Business Profile (already has geo schema), MSME/Startup portals (StartupIndia, MSME.gov.in), Odisha start-up portal (Odisha Startup Cell).
5. **Genuine partner & customer references.**
   - Logistics/warehousing partners, steel/FMCG/agro shippers, transporter fleet associations → ask for a "our partner" or case-study mention with a link.
   - Create and publish (on the site) one or two genuine customer/partner success stories (with consent) — other sites link to these naturally, and they give third parties something authoritative to reference.
6. **Editorial mentions / digital PR.**
   - Local & trade press: Rourkela/Ranchi/Bhubaneswar business coverage of the FTBI-backed startup; community news angles (trucker digitization, return-load savings).
   - Guest posts/op-eds on logistics trade sites (offered, not paid) with author bio links.
   - HARO/Qwoted-style expert quotes for logistics/freight topics.

**Explicit non-goals:** no purchased links, no link farms/PBNs, no comment spam, no directory spam (submit only to curated, relevant, human-reviewed directories).

**Measurement:** track referring domains in GSC/BWT after 60–90 days; ICP: 5–10 quality referring domains (gov/edu/news/industry) in quarter 1.

---

## 7. Phase 6 — Safety checklist (compliance)

- [ ] No existing pages deleted/edited URLs changed
- [ ] No Google-facing changes to existing metadata/canonicals/sitemap content
- [ ] No Supabase table/user/auth modifications
- [ ] No app routing/behavior changes
- [ ] New files only + 1 additive cron entry in `vercel.json`
- [ ] No deploy without explicit owner approval
- [ ] No invented data/claims; key file contains only the owner-provided key

---

## 8. Phase 7 — Testing & evidence plan

| Check | Method |
|---|---|
| Key file HTTP 200 | After deploy: `Invoke-WebRequest https://loadsaathi.in/9524fce83efa44d6845fabaaa587ee5c.txt` → 200 + body == key |
| IndexNow API accepts test URL | POST seed batch with 1 URL (`/`) → expect 200/202; record response code (200 = received, not indexed) |
| Sitemap HTTP 200 | Already verified; re-verify post-deploy |
| robots.txt accessible | Already verified 200 |
| Canonicals correct | Re-run `scripts/smoke.mjs` + spot-check via `SEO_ROUTE_VALIDATION.csv` |
| Bingbot access | `curl -A "Mozilla/5.0 (compatible; bingbot/2.0)"` to `/`, `/routes/rourkela-to-ranchi`, `/blog/…`, `/hi` → 200 (robots allows) |
| Google SEO intact | `pnpm check` (lint/typecheck/test/build/smoke/verify:seo) all green; sitemap still 215 URLs |
| Vercel build succeeds | `pnpm build` exit 0 |
| Duplicate submission check | Inspect cron run log: URLs older than 72 h are never resent |

**Deliverables:** this plan, `SEO_BING_INDEXNOW_REPORT.md` (post-implementation), modified-files list, before/after, test results, remaining manual BWT steps, deployment instructions.

---

## 9. Open approvals requested

1. **Approve implementing Phase 2 components** (key file + API + cron + scripts + .env.example + vercel.json) — no deploy.
2. **State strategy:** stateless 72 h window (recommended, zero new storage) vs Supabase state table (strict dedupe but requires a new table — violates "never modify Supabase tables" unless approved).
3. **Env setup on Vercel:** `INDEXNOW_KEY` + `INDEXNOW_API_TOKEN` to be set by owner before deploy.
4. **Deploy approval** is separate and required before any live effect.
