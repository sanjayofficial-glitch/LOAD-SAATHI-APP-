# LoadSaathi SEO Launch Playbook — Fix "LoadSaathi → Loan Saathi" + Trending Content

> Created: 2026-08-08 · Owner: Sanjaya · Status: Draft for execution
> Goal: (1) Get Google to treat "loadsaathi" as its own brand query, (2) index all pages, (3) build authority + brand signals, (4) publish trending freight content.

---

## Launch playbook sequence

```mermaid
flowchart LR
    ENTITY[Disambiguate the LoadSaathi entity] --> INDEX[Submit and verify indexation]
    INDEX --> SIGNALS[Build relevant directory signals]
    SIGNALS --> CONTENT[Publish useful freight content]
    CONTENT --> INTERNAL[Strengthen internal linking]
    INTERNAL --> MEASURE[Measure discovery and demand]
```


## 1. WIKIDATA ENTRY — the single biggest off-site disambiguation lever

Google's Knowledge Graph pulls entity type, aliases, and website linkage from Wikidata. A Loan-Saathi style finance entity already exists there; we need a clearly typed *trucking* entity.

**How to create (10 min):** Sign in to https://www.wikidata.org → Search box → type `loadsaathi` → if no result, click "Create a new item".

**Suggested labels (any language, English first):**

| Field | Value |
|---|---|
| English label | LoadSaathi |
| English aliases | Load Saathi · LoadSaathi.in · Load Saathi freight |
| English description | Indian online truck freight marketplace connecting shippers and truckers for PTL, FTL and return loads |

**Statements to add (each needs a "reference" — use the site itself, LinkedIn, and any news):**

| Property | Value |
|---|---|
| instance of (P31) | **business** (Q4830453) AND **road freight transport** (add a second P31) |
| official website (P856) | `https://loadsaathi.in` |
| industry (P452) | **trucking** (use "freight transport" if trucking missing) |
| headquarters location (P159) | Rourkela, Odisha, India |
| inception (P571) | 2025 |
| founder (P112) | Sanjaya Sahu (create person item if missing, link LinkedIn) |
| employer/organized by (P749) | (skip) |
| social media profiles | LinkedIn / X / Instagram / Facebook (as P3452 / P2002 / P553 / P2013) |
| logo image (P154) | `https://loadsaathi.in/logo-512.png` |
| Commons category / tax ID / CIN | add GSTIN + CIN if available |

**Critical disambiguation tip:** because the label "Load Saathi" collides with the finance brand, the **description must always include the words "freight" / "trucking" / "logistics"** so the KG keeps them as separate entities.

**After creation:** come back to `index.html` and add the Wikidata `sameAs` URL to the Organization node (we already added `naics` + `additionalType` there).

---

## 2. GOOGLE SEARCH CONSOLE — get the 27 "Discovered – currently not indexed" pages indexed

Indexing more loadsaathi.in URLs is the strongest on-off fix. Google won't "correct" loadsaathi to loansaathi when it clearly has many loadsaathi.in pages.

### Step-by-step
1. Go to https://search.google.com/search-console → select the **loadsaathi.in** property (verify if not done).
2. **Pages** report (Indexing → Pages) → filter "Discovered – currently not indexed" → export the list (~27 URLs).
3. For each URL (max ~10/day): use the **URL inspection** tool → paste URL → **Request Indexing**.
   - TIP: wait for a URL to turn "URL is on Google" before requesting the next batch.
4. Fix the root causes that block rendering/crawling:
   - **Run `pnpm`/`npx vite build`** locally and confirm no JS errors (Helmet-injected schema/meta only renders after JS — this is normal, Google renders it).
   - Ensure no `noindex` leaks in `src/components/SeoMeta.tsx` (currently no noindex — verified).
   - Keep the sitemap (78 URLs, updated lastmod) and submit it again in **Sitemaps**.
5. **After deployment**, re-submit `https://loadsaathi.in/sitemap.xml` → "Success".
6. Repeat request-indexing weekly until coverage is green.

### Indexing API (fast-track, ~200 URLs/day)
```bash
cd scripts
pip install google-api-python-client google-auth
# put the service-account key as scripts/credentials.json
python index-urls.py          # live run (reads scripts/Table.csv)
```
(Currently `--dry-run` validates 27 URLs without credentials — already works.)

### Bing (also feeds Microsoft Copilot)
1. Replace `YOUR_BING_VERIFICATION_CODE` in `index.html` with the real code from Bing Webmaster Tools.
2. Submit sitemap in Bing Webmaster → also covers Copilot answers.

---

## 3. DIRECTORY / BACKLINK CHECKLIST — build "LoadSaathi = freight" anchor signals

External mentions using the anchor **"LoadSaathi"** in a *logistics/trucking* context teach Google the brand's vertical. Prioritize in this order.

### Tier 1 — freight/logistics/trucking (highest relevance)
- [ ] IndiaMART supplier page (logistics services)
- [ ] Justdial business listing (category: Logistics & Transportation Services)
- [ ] BharatMatrimony-style sectoral? No — use **cargo portals**: CargoConnection, 5PLogistics
- [ ] Truck/transport portals: Trukky, TruckGuru (partner or guest post), GOGO Transport
- [ ] Startup directories: **Product Hunt**, BetaList, SaaSHub, AlternativeTo, There's An AI For That (list LoadSaathi as AI freight matching)
- [ ] Tracxn / Crunchbase / LinkedIn Company page (verify claimed + link website)

### Tier 2 — local India (entity + citations)
- [ ] Google Business Profile (category: Freight Forwarding; address = Rourkela; NAICS-like keywords PTL/LTL)
- [ ] Justdial + IndiaMART + MeraContact + Yellowpages India (NAP consistency: name / phone +91-83289-98031 / address)
- [ ] Local news pitch: Rourkela/ Ranchi business dailies + Odisha TV tech slots

### Tier 3 — AI-visible + review platforms
- [ ] G2, Capterra (SaaS categories) — even a few reviews create entity signals
- [ ] Trustpilot listing
- [ ] **HARO / Featured / Qwoted** — answer "freight market India" queries; you get a branded backlink + LLM citation

### Anchor + on-page requirement for every listing
- Name shown: **LoadSaathi** (not Load Saathi)
- Description first sentence: "LoadSaathi is an AI-powered freight marketplace connecting shippers and truckers for PTL, FTL and return loads across East India — not a loan or finance company."
- Link: `https://loadsaathi.in`
- Repeat the freight keywords in the description so the link's surrounding text is freight-related.

---

## 4. TRENDING BLOG CONTENT PLAN (2026 — with citable stats)

Two articles from this plan are already written into the codebase (see below). Publish the rest in the listed order; each new article must also be added to `public/sitemap.xml` and requested for indexing.

### Already written (in `src/data/blog.ts`)
| Slug | Title | Why it's trending |
|---|---|---|
| `india-truck-freight-rates-2026` | India Truck Freight Rates 2026: PTL, FTL & LTL Price Guide | High commercial intent; India road freight USD 167.5B (Mordor 2026), PTL CAGR 9.7% (MarkNtel) |
| `truck-transport-cost-per-km-india-2026` | Truck Transport Cost per km in India 2026 (Mini, Medium & Container) | Targets "truck transport cost per km India" keyword; rates ₹10–₹85/km (TruckGuru 2026) |

### Recommended queue (write in this order)
| # | Slug | Title | Hook / stats to cite | When |
|---|---|---|---|---|
| 1 | `eway-bill-rules-2026-ship-to-gstin-guide` | E-Way Bill Rules 2026: Ship-To GSTIN & Closure Facility Guide | Record 140.6M e-way bills in March 2026, +13% (GSTN via Business Standard) | **VERIFY against Advisory 668 first** — your existing post claims it's on hold; Cleartax (Aug 3) still treats Ship-To as mandatory. Reconcile before publishing. |
| 2 | `india-logistics-cost-gdp-freight` | Why India's Logistics Costs 13–14% of GDP (vs 8–10% globally) & How to Cut Them | Deccan Transcon 2026 outlook; National Logistics Policy; PM Gati Shakti | ASAP |
| 3 | `monsoon-logistics-india-2026` | Monsoon Trucking: How to Protect Cargo & Cut Costs This Season | Seasonal rate hikes 15–20% (TruckGuru); floods disrupt East India corridors | Now (monsoon window) |
| 4 | `ltl-market-india-2026` | India LTL Market 2026: USD 8.7B Growing at 11.4% CAGR — What Shippers Should Do | MarkWide May 2026; Mordor 9.88% CAGR, wholesale/retail 38% share | This month |
| 5 | `ecommerce-tier2-3-logistics` | Why E-commerce Logistics Is Moving to Tier-2 & Tier-3 Cities | Mordor; 58% of SMEs rely on partial-load freight (MarketReportsWorld) | This month |
| 6 | `electric-trucks-india-2026` | Are Electric Trucks Viable for Indian Freight in 2026? | 6Wresearch: EV/hybrid traction; DFC + FASTag infrastructure | Next month |
| 7 | `return-load-market-india` | The Return Load (Backhaul) Market in India: Size, Savings & How to Book | Empty miles cut up to 80% with digital pooling (Mordor); 40% empty km stat | Next month |
| 8 | `driver-shortage-india-2-4-million` | India's 2.4 Million Driver Shortage: What It Means for Freight Rates | Mordor 2026 | Next month |
| 9 | `loadsaathi-vs-loansaathi` | Is LoadSaathi a Loan Company? No — Here's the Freight Marketplace Explained | Brand disambiguation + FAQSchema + HowTo schema | ASAP (fixes confusion + captures "loadsaathi vs loansaathi" query) |
| 10 | `ptl-cost-savings-east-india` | How MSMEs in Odisha & Jharkhand Save 35% with PTL Shared Freight | Existing case-study material; corridor rates | Ongoing |

### Every article must include (AEO rules)
- `BlogPosting` JSON-LD (auto via `SeoMeta` — pass `publishedTime`, `dateModified`, `image`)
- Author byline + "Last updated" date
- Stats with named sources + year (e.g., "India road freight: USD 167.5B in 2026 — Mordor Intelligence")
- 150-word self-contained summary paragraph
- FAQ section (3–5 Q&As) — automatically builds FAQPage schema
- CTA to LoadSaathi + one internal link to a route/guide page

### Automation for publishing a new article
1. Add entry to `src/data/blog.ts` (match existing field format exactly — see `ai-freight-matching`).
2. Add URL to `public/sitemap.xml` (blog URLs get lastmod auto-synced via the update script).
3. `npx vite build` → commit → `vercel --prod --yes`.
4. Request indexing in GSC URL inspection.

---

## 5. GOOGLE ADS (brand campaign) — optional but fast

- Campaign: Search → **Exact match** keyword: `loadsaathi` (and `load saathi freight`, `loadsaathi truck`)
- **Negative keywords:** loansaathi, loan saathi, personal loan, business loan, funding (so you never show for finance queries and never get mixed into that audience)
- Budget: ₹200–500/day, 2–4 weeks. Goal: prove brand query volume so Google stops auto-correcting.
- Ad copy first line: "LoadSaathi Freight Marketplace – Book PTL & Return Loads" + sitelinks to /pricing and /routes.

---

## 6. EXECUTION CHECKLIST (by week)

**Week 1:** Google Business Profile → request indexing of 10 stuck URLs → Bing verification + sitemap → create Wikidata item → publish `loadsaathi-vs-loansaathi` + reconcile e-way bill posts.
**Week 2:** Publish monsoon + logistics-GDP articles → 15 Tier-1 directory listings → second round of request-indexing → add Wikidata `sameAs` to index.html.
**Week 3:** Publish LTL + e-commerce tier-2/3 articles → Tier-2/3 directories → run `python index-urls.py` → review GSC coverage report.
**Week 4:** Publish EV trucks + return-load + driver-shortage → HARO/Featured pitches → evaluate Google Ads brand campaign results → re-check "loadsaathi" SERP (aim: no more "results for loansaathi").

**Success metric:** searching `loadsaathi` (incognito, IN region) returns loadsaathi.in as the #1 organic result with no "Search instead for loansaathi" banner.
