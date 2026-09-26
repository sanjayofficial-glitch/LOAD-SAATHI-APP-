# LoadSaathi SEO Strategy & Ranking Plan

> **Source data:** `loadsaathi_keyword_research (1).xlsx` (498 keywords + 210 competitor-gap + 13 blog ideas)
> **Baselines:** GSC 90d — 35 clicks / 938 impressions / 3.7% CTR / avg position 19.1 · Vercel 77 visitors/7d (↓72%) · 168 sitemap URLs · 28 not-indexed
> **Scope:** Analysis & strategy only — implementation tracked in the 30/60/90 roadmap (§10).
> **Related docs:** `docs/seo/loadsaathi_seo_recovery_plan.md` · `docs/seo-launch-playbook.md` · `docs/seo/geo-implementation-plan.md` · `docs/seo/backlinks.md` · `Blogs/_SEO_BLOG_CHECKLIST.md`

---

## 1. Executive Summary

**Diagnosis:** LoadSaathi has a solid content base (168 URLs: 24 route pages, 5 city pages, ~25 posts, guides, calculators) but three compounding failures:

1. **Technical:** duplicate canonical tags → 28 pages not indexed → rankings stuck at page 2 (pos 19.1).
2. **Entity:** Google confuses the brand with loan/finance ("Loan Saathi") — brand queries leak.
3. **Coverage:** no scaled city/route content program, while the workbook shows 258 route keywords + ~100 local gap keywords unserved.

**Strategy thesis (in order):**

| Phase | Move | Compounding effect |
|-------|------|--------------------|
| 0 | Fix canonicals + prerender + resubmit | Unlocks the 168 existing URLs |
| 1 | Schema, brand entity (Wikidata), transactional pages | Cheap wins on existing URLs |
| 2 | Scale route + city content to 300–500 URLs | Owns the 258-KW route cluster + local gap |
| 3 | Calculators, return-load, backlinks, distribution | Free-tool links + WhatsApp/FB organic |

**The one thing first:** fix duplicate `<link rel="canonical">` tags. Nothing else ranks until one canonical wins per URL. **Impact: High · Effort: Low.**

---

## 2. Technical SEO Audit

| # | Issue | Evidence | Impact | Effort | Fix order |
|---|-------|----------|--------|--------|-----------|
| T1 | **Duplicate canonical tags** (homepage canonical + page-specific canonical on same page) | `docs/seo/loadsaathi_seo_recovery_plan.md` | **High** | **Low** | 1 |
| T2 | 28 URLs "Duplicate, submitted not indexed" / "Crawled not indexed" | GSC | **High** | Med | 2 (after T1) |
| T3 | Sitemap count drift — 168 live vs GSC submitted | live `public/sitemap.xml` vs GSC | Med | Low | 2 |
| T4 | SPA client-side render — route/city/guide pages need prerendered/SSR HTML | Vite SPA | **High** | Med | 2 |
| T5 | LocalBusiness schema phone placeholder ("TBD") | `docs/seo/geo-implementation-plan.md` | Med | Low | 3 |
| T6 | Brand confusion — Google associates "Saathi" with loan/finance | `docs/seo-launch-playbook.md` | **High** | Med | 3 |
| T7 | BreadcrumbList + FAQPage/HowTo schema gaps on route/guide templates | GEO plan phases | Med | Low | 3 |
| T8 | `robots.txt` already allows AI crawlers (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended, CCBot…) | live `public/robots.txt` | ✅ Done | — | — |

**Fix order:** T1 → T4 → T2/T3 (GSC resubmit) → T5/T7 (schema) → T6 (entity cleanup).

### Title-tag formulas (apply after T1)

| Page type | Pattern | Example |
|-----------|---------|---------|
| Route | `{Origin} to {Dest} Truck Fare 2026 \| Per KG Rate & Distance` | `Bokaro to Berhampur Truck Fare 2026 \| Per KG Rate & Distance` |
| City | `Transport Service in {City} \| Truck Booking {City}` | `Transport Service in Ranchi \| Truck Booking Ranchi` |
| Calculator | `{What} Calculator - Free Online {Topic} Tool` | `PTL vs FTL Calculator - Find Cheaper Option Free` |
| Blog | Question/Hinglish intent + brand | `Bokaro se Berhampur Bhada Kitna? 2026 Truck Fare Guide` |

---

## 3. On-Page SEO

**Current assets:** 24 route pages (`/routes/…`), 5 location pages (`/location/{rourkela,ranchi,kolkata,bhubaneswar,jamshedpur}`), ~25 blog posts, guides (`/guide/ptl-vs-ftl`, `freight-rates-east-india`, `shipping-steel`), tools (`/fare-calculator`, `/tools`), `/compare`, `/freight-intelligence`.

| Element | Standard | Priority |
|---------|----------|----------|
| Title | §2 formula, ≤60 chars, one primary KW | High |
| Meta description | Price cue + city + book/load CTA, ≤155 chars | High |
| H1 | One per page = primary keyword (language matches page intent) | High |
| Internal links | Route ↔ city ↔ fare calculator; blog → route hub | High |
| FAQ block | 3–5 Q&A + FAQPage schema on every route/guide | High |
| Schema | BlogPosting on blog; price signal on routes; HowTo on guides | Med |
| Images | WebP, alt = primary keyword | Med |
| Language | EN H1; Hinglish/Hindi FAQ variants on same URL (don't split yet) | Med |

### Cluster map — existing pages to upgrade first

| Cluster | KWs in workbook | Existing target | Action |
|---------|-----------------|-----------------|--------|
| Route freight rate | 258 | 24 route pages | **Scale to top 80+ pairs** |
| Calculator | 48 | `/fare-calculator`, `/tools` | Dedicated calculators |
| PTL vs FTL | 27 | `/guide/ptl-vs-ftl` | Rewrite + FAQ schema + table |
| Return load | 27 | weak/none | New hub |
| Marketplace/booking | 27 + competitor gap | `/`, `/for-msmes`, `/compare` | Strengthen transactional copy |
| Cargo steel/coal | 24 | `/guide/shipping-steel` | Extend to coal/ore corridors |

---

## 4. Content Gap Analysis — 30 New/Upgraded Content Pieces

Each piece maps to ≥1 researched cluster. Lang = language intent.

| # | Content piece | Target URL | Cluster (KW count) | Lang | Impact | Effort |
|---|---------------|------------|--------------------|------|--------|--------|
| 1 | Return load guide + board explainer | `/guide/return-load` + `/return-loads` | Return Load (27) | EN/HI | High | Med |
| 2 | Bokaro → Berhampur freight guide | `/routes/bokaro-berhampur` + blog | Route (258) | EN/Hinglish | High | Low |
| 3 | Ranchi → Kolkata truck rate 2026 | `/routes/ranchi-kolkata` | Route | Hinglish | High | Low |
| 4 | Rourkela → Jamshedpur charges | `/routes/rourkela-jamshedpur` | Route | EN | High | Low |
| 5 | Free truck fare calculator (per kg/full) | `/tools/truck-fare-calculator` | Calculator (48) | EN | High | Med |
| 6 | Diesel price ↔ freight monthly | `/blog/diesel-freight-impact` | Route/Seasonal | EN | Med | Low |
| 7 | Loading points in Ranchi | `/location/ranchi-loading-points` | Local | Hinglish | Med | Low |
| 8 | Transport service in Dhanbad | `/location/dhanbad` | Local | EN | High | Low |
| 9 | Transport service in Asansol | `/location/asansol` | Local | EN | High | Low |
| 10 | Transport service in Kharagpur | `/location/kharagpur` | Local | EN | High | Low |
| 11 | Transport service in Siliguri (NE gateway) | `/location/siliguri` | Local | EN | High | Low |
| 12 | Transport service in Sambalpur | `/location/sambalpur` | Local | EN | High | Low |
| 13 | Transport service in Cuttack | `/location/cuttack` | Local | EN | High | Low |
| 14 | Transport service in Durgapur | `/location/durgapur` | Local | EN | High | Low |
| 15 | Transport service in Berhampur | `/location/berhampur` | Local | EN | High | Low |
| 16 | PTL vs FTL 2026 rewrite + embed | `/guide/ptl-vs-ftl` | PTL vs FTL (27) | EN/Hinglish | High | Med |
| 17 | PTL vs FTL real price examples | `/blog/ptl-ftl-price-examples` | PTL vs FTL | EN | Med | Low |
| 18 | Book truck online, 0 commission | strengthen `/for-msmes` | Marketplace (27+gap) | EN | High | Low |
| 19 | Vahak/BlackBuck alternatives | `/compare` expand | Comparison (12+gap) | EN | Med | Low |
| 20 | Coal transport corridor Odisha/JH | `/blog/coal-transport-odisha` | Cargo (24) | EN | Med | Low |
| 21 | Steel coil/TMT shipping guide | `/guide/shipping-steel` | Cargo | EN | Med | Low |
| 22 | Truck ownership cost India 2026 (TCO) | `/blog/truck-ownership-cost` | Ownership (30) | EN/Hinglish | Med | Med |
| 23 | Best time to book trucks (monsoon/festive) | `/blog/seasonal-truck-booking` | Seasonal (9) | EN | Low | Low |
| 24 | AI in Indian logistics | `/blog/ai-logistics-india` | AI (6) | EN | Low | Low |
| 25 | ट्रक भाड़ा कैसे चेक करें | Hinglish/Hindi post | Generic/Brand | Hindi | High | Low |
| 26 | Typo clusters (49 misspellings) | consolidate into main pages | Typo (49) | — | Low | Low (no thin pages) |
| 27 | Jharkhand freight rate master | `/routes/jharkhand-freight-rates` | Route hub | EN | High | Med |
| 28 | Odisha freight rate master | `/routes/odisha-freight-rates` | Route hub | EN | High | Med |
| 29 | West Bengal freight rate master | `/routes/wb-freight-rates` | Route hub | EN | High | Med |
| 30 | WhatsApp-first booking how-to | `/guide/whatsapp-booking` | Generic | Hinglish | Med | Low |

**Language guidance:** workbook split is 220 EN / 145 Hinglish / 84 Hindi / 49 typo. Do **not** create a `/hi/` subdirectory yet — put Hinglish/Hindi keywords into FAQ/H2 of English URLs first. Hindi subfolder only after English clusters win (~Month 6+).

**Typo keywords (49):** let Google normalize misspellings; do not build thin typo pages.

---

## 5. Local SEO — 15 Cities

| Tier | Cities | Status |
|------|--------|--------|
| 1 (upgrade now) | Ranchi, Rourkela, Jamshedpur, Bhubaneswar, Kolkata | `/location/` pages exist |
| 2 (next 5) | Dhanbad, Bokaro, Asansol, Durgapur, Balasore | new pages |
| 3 (next 5) | Berhampur, Cuttack, Sambalpur, Kharagpur, Siliguri | new pages |

**Per-city page checklist (all 15):**

1. H1: `Transport Service in {City}` (+ native-script variant in body)
2. 8–12 FAQs incl. Hinglish: "{City} se {Dest} truck kitne ka?"
3. Top 5 routes FROM the city as internal links (feeds the 258-KW route cluster)
4. LocalBusiness schema with **real phone** (unblocks GEO-plan TBD item)
5. Embedded fare-calculator CTA
6. Consistent brand string: **LoadSaathi** (no "Load Saathi" variants)

**Google Business Profile (free):** service-area business listing for Ranchi + Bhubaneswar first; per-city GBP only where physical/warehouse presence exists. **Impact: Med · Effort: Low.**

---

## 6. AEO / GEO (Answer Engine Optimization)

**Already good:** `robots.txt` explicitly allows GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended, CCBot, Bytespider; `llms.txt`, `pricing.md`, `index.md` in sitemap.

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| A1 | FAQPage schema on 15 city + top 20 route pages (natural Hinglish/Hindi questions) | High | Low |
| A2 | HowTo schema on guides (booking steps, post-load steps) | Med | Low |
| A3 | Keep `llms.txt` updated as pages scale to 300–500 | Med | Low |
| A4 | Self-contained 100–200 word answer block at top of every route page | High | Low |
| A5 | Statistics with source + year in freight posts | Med | Low |
| A6 | AboutPage + Organization sameAs (Wikidata) — ties to T6 brand fix | High | Med |
| A7 | Monthly spot-check: ChatGPT / Perplexity / Gemini for "truck booking India" | Med | Low |

---

## 7. Top-10 Keyword Ranking Strategy

**Current:** avg position 19.1 (page 2). **Target:** top-10 on long-tail route/local within 90 days; head calculator + return-load clusters within 6 months.

| Pri | Cluster (workbook) | # KWs | Strategy | Timeline | Impact | Effort |
|-----|-------------------|-------|----------|----------|--------|--------|
| 1 | Route-based freight rate | 258 | Publish top 60–80 city-pair pages (template + unique FAQ/answer block); calculator embed each | 30–60d | **High** | Med |
| 2 | Calculator | 48 | 3–4 interactive tools (fare/kg, return-load savings, PTL vs FTL, distance) | 30–90d | **High** | Med |
| 3 | Local city gap | ~100 gap KWs | 15 cities to §5 checklist | 30–60d | **High** | Med |
| 4 | PTL vs FTL | 27 | Own head term: rewrite `/guide/ptl-vs-ftl` + table + schema | 0–30d | **High** | Low |
| 5 | Return load | 27 | New hub + empty-truck pain content (Hinglish) | 30–90d | High | Med |
| 6 | Marketplace/booking + gap | 27 + gap | Transactional landing: "book truck online 0 commission" | 0–60d | High | Low |
| 7 | Cargo steel/coal | 24 | Extend steel guide; new coal corridor post | 60–90d | Med | Low |
| 8 | Comparison (Vahak/BlackBuck/Trukky/Porter) | 12 + 210 gap | `/compare` + honest comparison posts | 60–90d | Med | Low |
| 9 | Ownership / seasonal / AI | 30+9+6 | Supporting E-E-A-T content linking into hubs | 90d+ | Low | Low |
| 10 | Brand + typo | 15 + 49 | Wikidata entity fix (§2 T6); misspellings resolve via normalization | Ongoing | Med | Low |

**Ready-to-use titles:**

| KW | Title tag |
|----|-----------|
| Bokaro to Berhampur truck fare | `Bokaro to Berhampur Truck Fare 2026 \| Rate, Distance, Time` |
| Return load truck | `Return Load Board India \| Save on Empty Truck Trips - LoadSaathi` |
| Truck fare per km calculator | `Truck Fare Calculator per KM/KG 2026 \| Free India Tool` |
| Book truck online | `Book Truck Online - 0 Commission Load Matching \| LoadSaathi` |
| PTL vs FTL | `PTL vs FTL: Which is Cheaper in 2026? (Real Rate Examples)` |

**Won't chase yet:** head terms ("truck booking", "transport company india") dominated by BlackBuck/Porter ad budgets — win the 3–5 word route/local money terms first, graduate later.

---

## 8. Backlink Strategy

Base list: `docs/seo/backlinks.md` — execute in tiers:

| Tier | Type | Examples | # targets | Impact | Effort |
|------|------|----------|-----------|--------|--------|
| T1 | Foundational/entity | Wikidata, Crunchbase, AboutPage, Organization sameAs | 5–8 | **High** (solves T6) | Low |
| T2 | Indian business directories | Justdial, IndiaMART, TradeIndia, Sulekha, ExportersIndia | 20–30 | High | Low |
| T3 | Logistics-specific | Govt schemes, Startup India, logistics park listings | 10–15 | Med | Med |
| T4 | Local citations (NAP) | City business listings for 15 cities | 15–30 | Med | Low |
| T5 | Content PR | Rate-index / diesel-freight stories → logistics blogs, YourStory | 3–5/qtr | High | Med |
| T6 | Partnerships | MSME associations, GST tools, trucker unions (offline→online) | 5–10 | Med | Med |

**Rules:** exact brand string `LoadSaathi` everywhere · anchor mix brand > URL > partial KW · no paid link farms · **do T1 first** (entity clarity multiplies every other link).

---

## 9. Social / Distribution (WhatsApp-First)

Audience: 40+ truckers on low-end Android, low literacy, Hinglish voice/video; MSME owners already in WhatsApp.

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| S1 | WhatsApp share loop on every route/fare page ("Share rate with your transporter") | High | Low |
| S2 | Facebook: 1 Hindi/Hinglish 30–60s reel/week — "Aaj ka rate: Ranchi→Kolkata ₹X/kg" → route link | High | Med |
| S3 | Facebook trucker/community groups: value posts + rate cards (no spam links) | Med | Low |
| S4 | IG + FB Reels: calculator screen recordings (free organic) | Med | Low |
| S5 | Telegram/WhatsApp community: daily East India rate pulse (reuse §4 content) | Med | Med |
| S6 | YouTube Shorts: "Booking kaise kare" 3-step (trust + AEO) | Med | Low |
| S7 | Shareable PNG rate cards per city pair (design once, batch-produce) | High | Med |

No paid social in the 90-day plan — organic + WhatsApp compounding fits the zero-budget phase.

---

## 10. 30 / 60 / 90-Day Roadmap

### Days 1–30 — Unlock + foundation

| # | Item | Owner | Impact |
|---|------|-------|--------|
| 1 | **Fix duplicate canonicals (T1)** | Dev | **Critical** |
| 2 | Prerender route/city/guide templates (T4) | Dev | High |
| 3 | GSC: resubmit sitemap, clear 28 not-indexed | SEO | High |
| 4 | LocalBusiness (real phone) + FAQ schema on 5 cities + 24 routes | Dev | High |
| 5 | Rewrite `/guide/ptl-vs-ftl` | Content | High |
| 6 | Strengthen `/for-msmes` + `/compare` | Content | High |
| 7 | Wikidata/AboutPage entity claim (T6/T1 backlinks) | SEO | High |
| 8 | Ship 10 highest-volume route pages (template) | Content | High |

### Days 31–60 — Scale

| # | Item | Impact |
|---|------|--------|
| 9 | +40 route pages (top pairs from 258) | High |
| 10 | 15 city pages to §5 checklist | High |
| 11 | Fare calculator + PTL/FTL calculator live | High |
| 12 | Return-load hub (content #1) | High |
| 13 | Directory blast T2 + local citations T4 | High |
| 14 | WhatsApp share + FB reels cadence (S1–S4) | Med |

### Days 61–90 — Compound

| # | Item | Impact |
|---|------|--------|
| 15 | Remaining route pages → 300-URL target | High |
| 16 | Cargo/coal/steel + ownership/seasonal content | Med |
| 17 | T5 PR pitches (rate-index data) | Med |
| 18 | AEO audit: self-contained answers on top 50 pages | High |
| 19 | KPI review vs §11; iterate clusters hitting top-20 | High |

---

## 11. Metrics & KPIs

| Metric | Baseline | 30d | 60d | 90d | Source |
|--------|----------|-----|-----|-----|--------|
| Indexed pages | ~140/168 | 160 | 280 | 400+ | GSC |
| Not-indexed errors | 28 | <10 | <5 | ~0 | GSC |
| Clicks (90d) | 35 | 80 | 200 | 500+ | GSC |
| Impressions (90d) | 938 | 2,000 | 6,000 | 15,000+ | GSC |
| Avg position | 19.1 | 16 | 13 | ≤10 on top 30 long-tails | GSC |
| CTR | 3.7% | 4% | 4.5% | 5%+ | GSC |
| Route pages live | 24 | 34 | 74 | 120–150 | Sitemap |
| Total URLs | 168 | 180 | 280 | **300–500** | Sitemap |
| Referring domains | ~0 | 15 | 40 | 70+ | GSC Links / Ahrefs WC |
| WhatsApp share clicks | 0 | instrument | ↑ MoM | ↑ MoM | Analytics events |
| FB reel views/wk | 0 | 500 | 1,500 | 3,000+ | Meta Insights |

**Weekly ritual:** GSC coverage + top queries + position changes for the 30 target long-tails.

---

## 12. Tool Recommendations (Free / Low-Cost)

| Need | Tool | Cost |
|------|------|------|
| Rank + coverage | Google Search Console | Free |
| Analytics | GA4 or Vercel Analytics | Free |
| Crawl check | Screaming Frog free (500 URLs) | Free |
| Schema validation | Rich Results Test + Schema Validator | Free |
| Keyword expansion | Keyword Planner (broad), AlsoAsked, GSC query mining | Free |
| Backlinks | GSC Links + Ahrefs Webmaster Tools (verified site) | Free |
| AI visibility | Monthly ChatGPT/Perplexity/Gemini spot-check | Free |
| Content QA | `Blogs/_SEO_BLOG_CHECKLIST.md` | Free |
| Uptime/robots | Vercel logs + `curl robots.txt` / `sitemap.xml` | Free |

No Semrush/Ahrefs subscription needed for the 90-day plan.

---

## Do This First (One-Page Summary)

> **Fix duplicate canonical tags → resubmit sitemap → only then publish new content.**

| Pri | Action | Why first | Impact | Effort |
|-----|--------|-----------|--------|--------|
| **0** | Remove duplicate `<link rel="canonical">` | Nothing ranks while canonicals conflict — root cause of 28 not-indexed + traffic drop | Critical | Low |
| **1** | Prerender route/city/guide HTML | SPA must ship crawlable content | Critical | Med |
| **2** | GSC cleanup + sitemap resubmit | Reveals true index state | High | Low |
| **3** | FAQ/HowTo + LocalBusiness (real phone) on existing 50 key URLs | Cheap authority + AEO | High | Low |
| **4** | Wikidata + brand sameAs ("Loan Saathi" disambiguation) | Brand searches blocked until fixed | High | Low |
| **5** | PTL vs FTL rewrite + `/for-msmes` + `/compare` | Fastest content wins on existing URLs | High | Low |
| **6** | Ship top 40 route pages (258-KW cluster) | Largest keyword pool, templatable | High | Med |
| **7** | 15 city pages to checklist standard | Local gap vs Vahak/BlackBuck | High | Med |
| **8** | Fare + PTL/FTL calculators | 48-KW cluster, linkable free-tool links | High | Med |
| **9** | Directory + entity backlinks (T1/T2) | Trust + disambiguation | High | Low |
| **10** | WhatsApp share + 1 FB reel/week | Zero-cost distribution matching audience | Med | Low |

**90-day success:** unique canonicals · ≥400 indexed pages · 30 long-tail route/local keywords in top 10 · clicks ≥500/90d · brand entity unconfused · content runway clear to 500 URLs.

---

*Data compiled from `loadsaathi_keyword_research (1).xlsx` · Strategy version 1.0 · Update KPIs weekly, strategy monthly.*
