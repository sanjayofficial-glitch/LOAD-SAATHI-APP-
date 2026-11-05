# LoadSaathi — Complete Screen & Page Inventory

> **App:** LoadSaathi — India's AI-powered shared freight marketplace (shippers ↔ truckers, PTL/LTL loads, East India).
> **Scope:** Every screen/page in the app **except the Admin Panel** (admin routes are deliberately excluded).
> **Generated from source:** `supabase/src/pages/`, `supabase/src/features/marketing/`, `supabase/src/routes.tsx`.

---

## 1. Tech Stack & Global Building Blocks

| Layer | Technology |
| --- | --- |
| Framework | React 19 + TypeScript (strict), Vite 6 |
| Routing | React Router DOM 7 |
| UI kit | shadcn/ui + Radix UI primitives (dialog, sheet, drawer (vaul), dropdown, tabs, accordion, toast, etc.) |
| Styling | Tailwind CSS 3.4 + framer-motion animations |
| Forms | React Hook Form + Zod |
| Maps | **Leaflet + react-leaflet** (OpenStreetMap tiles) — map components in `components/maps/` |
| Charts | Recharts 3 |
| Auth | Clerk 5 (+ role-based route guards) |
| Backend | Supabase (PostgreSQL + RLS + Realtime) + Edge Functions |
| Routing engine | OSRM (distance/duration), Nominatim (geocoding), Gemini AI (natural-language search) |
| Analytics | PostHog, Vercel Analytics, Google Analytics |
| Mobile | Capacitor 8 (Android) — same web build |
| Hosting | Vercel |

### Shared map components (Leaflet)
- `LoadSaathiMap` — base map (tile layer, click handler, markers, circles, popups)
- `TruckMarker` / `LoadMarker` — animated truck / load icons on map
- `RoutePolyline` — draws the OSRM route line on the map
- `TileLayerSwitcher` — switches map tile style
- `ZoomControls` — custom zoom in/out buttons
- `MapLegend` — legend overlay for map markers
- `LiveMap` / `NearbyLoadsMap` / `RouteMap` — map wrappers used in app screens

### Global UI components (used across pages)
- `SeoMeta` — SEO/JSON-LD meta per page
- `QuoteLeadCard` — lead-capture CTA card
- `PricePredictor` / `PriceTrendChart` / `RateBenchmarks2026` / `VehicleRateCard` — fare/rate widgets
- `DirectAnswer` / `KeyTakeaways` — SEO content blocks used on marketing pages
- `Reveal` — scroll-reveal animation wrapper
- `DishaMascot` / `GuideBotFab` — AI guide mascot (Disha) chat helper

---

## 2. Route Map (Overview)

### Public marketing / info pages (`PublicLayout`)
| Route | Page |
| --- | --- |
| `/` | Home (Index) |
| `/features` | Features |
| `/how-it-works` | How It Works |
| `/guide` , `/guide/:slug` | Guides |
| `/about` | About |
| `/pricing` | Pricing |
| `/faq` | FAQ |
| `/fare-calculator` | Fare Calculator (AI price estimate) |
| `/contact` | Contact |
| `/safety-trust` | Safety & Trust |
| `/privacy` | Privacy |
| `/terms` | Terms |
| `/solutions/shippers` | Shipper Solution |
| `/solutions/truckers` | Trucker Solution |
| `/compare` , `/compare/loadsaathi-vs-trucksuvidha` , `/compare/loadsaathi-vs-blackbuck` | Competitor comparison pages |
| `/gallery` | Gallery |
| `/sitemap` | HTML Sitemap |
| `/for-msmes` | For MSMEs |
| `/ai-logistics` | AI Logistics |
| `/data` , `/freight-intelligence` | Data Intelligence Hub |
| `/blog` , `/blog/:slug` | Blog list / article |
| `/routes` , `/routes/:slug` | Freight routes index / detail |
| `/location/:city` , `/transport/:city` | City location pages |
| `/transport-service/:city` | Transport service pages |
| `/hi` + `/hi/*` | Hindi-language pages |
| `/share/trip/:id` , `/share/shipment/:id` | Public share pages |
| `/truck-near-me` | Hyperlocal landing |
| `/return-load` , `/ptl-transport` , `/ltl-transport` , `/truck-load-booking` , `/freight-marketplace` | Commercial hubs |
| `/tools` + `/tools/*` (20 tools) | Calculators & checklists |
| `/transport-cost-calculator` | Transport cost calculator |
| `/screens/*` | App screen previews (marketing) |

### Auth pages (`AuthLayout`)
| Route | Page |
| --- | --- |
| `/login` | Login |
| `/register` | Register |
| `/choose-role` | Choose role (Shipper / Trucker) |
| `/onboarding` | Onboarding flow |
| `/forgot-password` | Forgot password |

### Authenticated app pages (`Layout` — role-guarded)
| Route | Page |
| --- | --- |
| `/trucker/dashboard` | Trucker Dashboard |
| `/trucker/post-trip` | Post Trip |
| `/trucker/my-trips` | Trucker Hub (My Trips) |
| `/trucker/trips/:tripId` | Trip Detail |
| `/trucker/trips/:tripId/edit` | Edit Trip |
| `/trucker/history` | Trucker History |
| `/trucker/verification` | Trucker KYC Verification |
| `/trucker/browse-shipments` | Browse Shipments |
| `/shipper/dashboard` | Shipper Dashboard |
| `/shipper/post-shipment` | Post Shipment |
| `/shipper/my-shipments` | My Shipments |
| `/shipper/shipments/:id` | Shipment Detail |
| `/shipper/shipments/:shipmentId/edit` | Edit Shipment |
| `/shipper/history` | Shipper History |
| `/browse-trucks` | Browse Trips (both roles) |
| `/trips/:tripId` | Trip Detail (shared) |
| `/chat/:requestId` | Chat / negotiation |
| `/messages` | Chat list |
| `/profile` | Profile |
| `/favorites` | Favorites |
| `/credit-score` | Credit Score |

### Not covered
- `/admin/*` — Admin Panel (excluded by request)
- `*` — 404 NotFound page

---

## 3. Tools & Calculators (20 pages)

### 3.1 Tools Index — `/tools`
- **File:** `supabase/src/pages/public/Tools.tsx`
- **Purpose:** Landing page listing all 20 freight tools & calculators for truckers and shippers.
- **Elements:** Card grid (3-col on desktop) — each tool is a clickable card with icon + title + description; hero heading; breadcrumbs; SEO meta. "Back to Home" link. Static (no inputs).

### 3.2 Fare Calculator — `/tools/fare-calculator`
- **Purpose:** AI-powered truck fare (bhada) estimate for any Indian city pair (uses `price-predict` edge function + static fallback).
- **Inputs:** Pickup City (text) · Delivery City (text) · Cargo Weight (number, min 0.1) · Vehicle Type (select: Mini Truck, Pickup, 14ft, 17ft, 22ft, Container, Trailer) · Shipment Mode (tabs: FTL / PTL)
- **Buttons:** "Estimate Fare" (spinner "Calculating…") · "Post This Shipment" (→ `/register`)
- **Outputs:** Result card — animated ₹ total (count-up) + ₹/tonne; market trend badge; Low/High end per-tonne cards; diesel price badge; price breakdown (fuel surcharge, return-leg factor, ₹/km); note "Based on N recent shipments"; `QuoteLeadCard`, `PriceTrendChart`, `VehicleRateCard`, `RateBenchmarks2026` sections.
- **Behavior:** API → `price-predict` (10s timeout), fallback to static estimate; reads `?from=&to=` query params; analytics tracking.

### 3.3 Transport Cost Calculator — `/transport-cost-calculator`
- **Purpose:** Freight cost range for PTL/LTL/FTL across East India corridors (API-backed).
- **Inputs:** Origin City · Destination City · Weight (tonnes) — all required
- **Buttons:** "Calculate Estimated Cost" · "AI Price Predictor" (→ fare calculator) · "Book a Shipment" (→ `/register?type=shipper`)
- **Outputs:** Green result panel — freight range ₹min–₹max per tonne, recommended ₹/tonne, total ₹, diesel ₹/L, fuel surcharge, rate ₹/km, data-confidence note.

### 3.4 Truck Load Calculator — `/tools/truck-load-calculator`
- **Purpose:** Recommends the right truck(s) for a cargo weight (static weight-band table).
- **Inputs:** Weight (tonnes)
- **Buttons:** "Get a Price Estimate" · "Book Now"
- **Outputs:** Recommended trucks list (2–3 per band: name, type, best-for, capacity); PTL/LTL sharing note; `RateBenchmarks2026` at bottom. Live updates as you type.

### 3.5 PTL vs FTL Calculator — `/tools/ptl-vs-ftl-calculator`
- **Purpose:** Decide between PTL and FTL by weight + urgency.
- **Inputs:** Cargo Weight (number) · Delivery Urgency (radio: Flexible/Moderate/Urgent)
- **Buttons:** "Read Full Guide" · "Book Now"
- **Outputs:** Recommendation card (PTL / FTL / both) with reason, savings %, transit time. Live updates.

### 3.6 Freight Rate Calculator — `/tools/freight-rate-calculator`
- **Purpose:** Freight rate per tonne/km combining **geocoding + OSRM routing + AI pricing** (with heuristic fallback).
- **Inputs:** Origin City · Destination City · Cargo Weight · Truck Type (radio: Any/Mini ≤1T/Pickup 1–2.5T/LCV 2.5–5T/MLCV 5–10T/HCV 10–16T) · Shipment Type (radio: PTL/LTL/FTL)
- **Buttons:** "Calculate Freight Rate" · "Book Now" · "Compare Cost Calculator" · related-tool links
- **Outputs:** Result card — route overview; 3 metric tiles (distance km, ₹/km, transit hours); freight range per tonne + recommended; recommended truck; shipment-type advice; disclaimer.

### 3.7 Return Load Calculator — `/tools/return-load-calculator`
- **Purpose:** Quantifies empty kilometres + potential return-load revenue.
- **Inputs:** Delivery Route From/To (required) · Return Route From/To (optional, defaults to reverse)
- **Buttons:** "Calculate Return Load" · "Browse Return Loads" · "Sign Up as Trucker" · related links
- **Outputs:** Route overview; 3 tiles (delivery km, return km, empty km); fuel cost estimate (₹95/L, ~4 km/L); potential return revenue (₹11/km); truck utilisation progress bar + insight text.

### 3.8 Route Optimizer — `/tools/route-optimizer`
- **Purpose:** Reorders up to 6 stops + origin into an optimized sequence (OSRM + nearest-neighbour).
- **Inputs:** Origin City + Stop 1–6 (text) — at least 1 stop required
- **Buttons:** "Optimize Route" (progress text "Geocoding stop X of Y…") · "Book This Route" · "Estimate Freight Cost"
- **Outputs:** 3 tiles (optimized km, saved km, % reduction); Original vs Optimized panels (km, min, sequence); OSRM variance disclaimer.

### 3.9 Empty km Savings — `/tools/empty-km-savings`
- **Purpose:** Dedicated truck vs shared freight for a route (km, ₹, % and CO2).
- **Inputs:** Origin · Destination · Vehicle Type (select: Light/Medium/Heavy)
- **Buttons:** "Calculate Savings" · "Start Sharing Loads" · "Return Load Calculator"
- **Outputs:** 3 tiles (savings %, ₹ saved, CO2 kg); Dedicated vs Shared panels (km + fuel ₹); route overview; disclaimer.

### 3.10 Trip Profit Calculator — `/tools/trip-profit`
- **Purpose:** Net profit per trip: revenue − fuel, tolls (NH-33 lookup), driver wages, maintenance.
- **Inputs:** Origin · Destination · Vehicle Type (select) · Load Weight (number)
- **Buttons:** "Calculate Profit" · "Start Earning" · "Estimate Freight Rates"
- **Outputs:** Revenue & Total Cost panels; Net Profit (₹ + margin %); line items (Fuel, Toll, Driver, Maintenance); disclaimer.

### 3.11 Shared Savings Calculator — `/tools/shared-savings`
- **Purpose:** Dedicated FTL vs shared PTL: truck count, cost, savings %, CO2, tree equivalent.
- **Inputs:** Origin · Destination · Cargo Weight
- **Buttons:** "Compare Savings" · "Ship Shared Freight" · "PTL vs FTL Guide"
- **Outputs:** 3 tiles (cost savings %, ₹ saved, trees equivalent); Dedicated vs Shared panels (trucks + ₹); CO2 note.

### 3.12 Document Checklist — `/tools/document-checklist`
- **Purpose:** Printable mandatory-documents checklist (RC, insurance, permits, etc.).
- **Inputs:** Route (select, 9 predefined East India routes) · Vehicle Type (select: Tata Ace, 407, LPT, Ultra, Signa, Prima, Bolero, Eicher) · Commodity (select: General, Cement, Steel, Agricultural, Textiles, Electronics, Auto parts, FMCG, Minerals) + checklist checkboxes
- **Buttons:** "Generate Checklist" · "Print Checklist" (window.print) · "Book This Route"
- **Outputs:** Progress bar; checkbox document list; yellow "Special Note" banner; check counter.

### 3.13 Carbon Savings Calculator — `/tools/carbon-savings`
- **Purpose:** CO2 emissions comparison FTL vs PTL (kg saved + trees).
- **Inputs:** Origin · Destination · Vehicle Type (select) · Load Weight
- **Buttons:** "Calculate CO2 Savings" · "Ship Green Freight" · "Shared Savings Calculator"
- **Outputs:** 3 tiles (CO2 saved kg, trees equivalent, distance km); Dedicated vs Shared CO2 panels; tree-absorption note (21 kg/tree/year).

### 3.14 Toll & Fuel Calculator — `/tools/toll-fuel`
- **Purpose:** Toll + fuel cost (NH-33 lookup) with diesel price/mileage adjustment and scenario chips.
- **Inputs:** Origin · Destination · Vehicle Class (select) · Diesel Price ₹/L (default 95) · Mileage km/L (default 4) · Scenario toggle chips (−10/−5/+5/+10/+15%)
- **Buttons:** "Calculate Costs" · "Book This Route" · "Trip Profit Calculator"
- **Outputs:** 3 tiles (fuel ₹, tolls ₹, total ₹); per-km cost; baseline vs scenario fuel comparison; disclaimer (not live rates).

### 3.15 GST Calculator — `/tools/gst-calculator`
- **Purpose:** GST on freight: IGST (interstate) or CGST+SGST split (intrastate), 5%/28%.
- **Inputs:** Charge Amount ₹ · Origin State · Destination State · Service Type (select: General 5% / Special 28% + cess)
- **Buttons:** "Calculate GST"
- **Outputs:** IGST or CGST/SGST panels; total GST; "Input tax credit: Eligible" note; disclaimer.

### 3.16 Payload Utilization — `/tools/payload-utilization`
- **Purpose:** % of truck volume/weight capacity used and whether more cargo fits.
- **Inputs:** Truck Model (select, 12 models) · Length/Width/Height (ft) · Weight per Unit (kg) · Quantity
- **Buttons:** "Calculate Utilization" · "Find Trucks" · "Truck Load Calculator"
- **Outputs:** Volume % + Weight % dual progress bars; status callout ("You can fit more cargo" green / "Capacity nearly full — split load" red).

### 3.17 Shipment Brief Builder — `/tools/shipment-brief`
- **Purpose:** Build a copyable/downloadable shipment brief to share with transporters.
- **Inputs:** Pickup · Drop-off · Cargo Type (select, 12) · Total Weight (kg) · Packages · Package dimensions cm (optional) · Ready Date (optional) · Loading Needs (select: dock/forklift/manual/tail-lift/not sure) · Preferred Vehicle (select, 8) · Special Instructions (textarea)
- **Buttons:** "Generate Shipment Brief" · "Copy Brief" (flips to "Copied!") · "Download .txt" · "Post This Load" · "Estimate Freight Rate"
- **Outputs:** Monospace structured brief preview (ROUTE / CARGO / SCHEDULE & HANDLING / SPECIAL INSTRUCTIONS); "Free — no signup needed" tag.

### 3.18 Waiting-Time Cost Calculator — `/tools/waiting-time-cost`
- **Purpose:** Cost of truck waiting time (billable hours after free allowance).
- **Inputs:** Loading Wait (hrs) · Unloading Wait (hrs) · Free Allowance (default 2) · Truck Cost/Day ₹ · Driver Cost/Day ₹ · Missed Trip Cost ₹ (optional)
- **Buttons:** "Calculate Waiting Cost" · "Join as Trucker" · "Trip Profit Calculator"
- **Outputs:** Big total ₹; 4 mini-tiles (₹/hr total, truck share, driver share, missed trip); assumptions list; yellow estimate-only disclaimer.

### 3.19 Freight Quote Comparison — `/tools/freight-quote-comparison`
- **Purpose:** Side-by-side comparison of up to 3 transporter quotes; highlights lowest all-in total.
- **Inputs:** Route Distance km (optional) · per quote: Transporter name, Transit days, Payment terms (select: Advance/On delivery/Credit 7/15/30) + 7 charge fields (Base, Fuel surcharge, Tolls/Fastag, Loading/Unloading, Waiting, Taxes/GST, Insurance)
- **Buttons:** "Compare Quotes" · "+ Add Third Quote" · "Remove" (ghost) · "Sanity-Check with Rate Calculator" · "Post a Load"
- **Outputs:** Ranked quote rows with "Lowest all-in" trophy badge, ₹ total, ₹/km, transit, terms; "Read beyond the total" advisory.

### 3.20 Cargo Volume Planner — `/tools/cargo-volume-planner`
- **Purpose:** PTL space planner: volume (cbm + cu ft), density, dominating constraint, smallest fitting vehicle.
- **Inputs:** Package L/W/H cm · Packages · Weight per package (kg)
- **Buttons:** "Calculate Volume & Space" · "Check Truck Utilization" · "Post a PTL Load"
- **Outputs:** 3 tiles (cbm, cu ft, total kg); density panel + constraint; yellow space-estimate panel with fitting vehicle (or "exceeds largest common vehicle").

### 3.21 Load-Securing Checklist — `/tools/load-securing-checklist`
- **Purpose:** Packing → loading/securing → dispatch checklist by cargo category.
- **Inputs:** Cargo Category (select, 8) · Handling needs (6 checkboxes: stackable, forklift, upright, weather protection, two-person, seal/tamper) · checklist checkboxes
- **Buttons:** "Build My Checklist" · "Print Checklist" · "Document Checklist" · "Post a Load"
- **Outputs:** Sectioned checklist (Packing / Loading & Securing / Dispatch & Handover) with progress bar; yellow "Not a substitute for paperwork" note.

---

## 4. Commercial Hub Pages (5)

| Page | Route | Purpose | Key buttons | Notable sections |
| --- | --- | --- | --- | --- |
| Return Load | `/return-load` | Backhaul marketing for truckers, AI matching, escrow | "Find Return Loads" · "Check Rates" | Hero + DirectAnswer + KeyTakeaways, problems grid, benefits grid w/ stats, 4-step How It Works, stats bar, FAQ (5), route links, mock "Return Load Finder" panel (sample loads + AI recommendation) |
| PTL Transport | `/ptl-transport` | Partial truckload hub for MSMEs | "Ship via PTL" · "Get a Rate Estimate" | Hero, benefits stats (30–40% savings, 0.5–3T, 95% match, ₹5L insurance), PTL vs FTL table, 4-step, FAQ (5), mock "PTL Shipment Builder" + AI recommendation card |
| LTL Transport | `/ltl-transport` | Less-than-truckload hub (50kg–3T) | "Ship via LTL" · "Get a Rate Estimate" | Hero, benefits stats, LTL rate cards for 6 corridors, 4-step, FAQ (5), mock "LTL Rate Estimator" (LTL/PTL/FTL totals) |
| Truck Load Booking | `/truck-load-booking` | Full-truck booking hub | "Book a Truck" · "Get a Price Estimate" | Hero, benefits stats (2.4× faster, 0% hidden fees, 8,500+ truckers, 100% visibility), truck-type cards (Ace → Tractor Trailer), 4-step, FAQ (5), mock "AI Matched Trucks" panel (3 trucks w/ match %) |
| Freight Marketplace | `/freight-marketplace` | Flagship marketplace positioning | "I'm a Shipper" · "I'm a Trucker" · "Browse all 25+ corridors" | Hero, features grid (6), shipper/trucker split checklists, 6 corridor cards, FAQ (5), dual CTA |

> All 5 commercial pages are static marketing pages with scroll-reveal animations (`Reveal`), SEO meta with FAQ JSON-LD, and `<noscript>` blocks.

---

## 5. SEO & Content Hub Pages

### 5.1 Location Pages — `/location/:city` (alias `/transport/:city`)
- **File:** `pages/public/locations/LocationPage.tsx`
- **Purpose:** Per-city SEO landing page for freight services (hero, industries, commodities, rates, hub distances, FAQ). Unknown city → noindex "City Not Found".
- **Key UI elements:** Hero (MapPin state badge, H1 "Freight Transport in {city}"), DirectAnswer box, "Start Shipping" CTA → `/register`; Industries grid (glass cards); Key Commodities grid; Distance-to-Hubs cards; Rate Ranges cards (PTL/FTL/LTL); "Freight Routes from {city}" cards → `/routes/:slug`; FAQ cards; final CTA ("Get Started Free" / "Browse All Routes").
- **Cities served (14):** Rourkela, Ranchi, Kolkata, Bhubaneswar, Jamshedpur, Cuttack, Sambalpur, Angul, Jharsuguda, Burdwan, Dhanbad, Balasore, Berhampur, Vizag/Visakhapatnam.

### 5.2 Transport Service Pages — `/transport-service/:city`
- **File:** `pages/public/transport/TransportServicePage.tsx`
- **Purpose:** Per-city "Part Load Transport / PTL & FTL booking" page. Unknown city → noindex.
- **Key UI elements:** Hero ("Start Shipping" / "Get Freight Quote" buttons, "Last updated" note); 4 service-link cards (PTL Part Load → `/ptl-transport`, FTL Full Truck → `/truck-load-booking`, Return Load Booking → `/return-load`, Instant Freight Quote → `/tools/freight-rate-calculator`); Rate ranges cards; Hub distance cards; Industries grid; Commodities list; route cards → `/routes/:slug`; FAQ cards; CTA.
- **Cities served (9):** Ranchi, Bhubaneswar, Rourkela, Jamshedpur, Balasore, Berhampur, Kolkata, Durgapur, Burdwan.

### 5.3 Guide Pages — `/guide/:slug` (and `/guide`)
- **File:** `pages/public/guides/GuidePage.tsx`
- **Purpose:** Long-form freight guide article (HowTo + Article schema). Missing slug → noindex "Guide Not Found".
- **Key UI elements:** "Back to Blog" link; "Guide" pill; H1; meta row (author, read time); summary card; prose paragraphs; optional rate table; "Related Resources" cards; "About the Author" card.
- **Guides (3):** `ptl-vs-ftl` (FTL & PTL full form, difference, rates), `freight-rates-east-india` (Freight Rates in East India 2026), `shipping-steel` (How to Ship Steel in India).

### 5.4 Freight Routes Index — `/routes`
- **File:** `pages/public/RoutesIndex.tsx`
- **Purpose:** Hub listing all PTL/LTL freight corridors.
- **Key UI elements:** Hero ("Freight Corridors" pill); corridor filter chips by state-pair; 48 route cards (MapPin, from → to, states, km, transit hrs, description, "Cross-State/Intra-State" footer); CTA card "Route Not Listed? → Post a Shipment".
- **Routes (48 lanes, both directions):** all pairs among Rourkela, Ranchi, Jamshedpur, Bhubaneswar, Kolkata, Burdwan, Sambalpur, Dhanbad, Vizag, Balasore, Berhampur, Cuttack, Jharsuguda.

### 5.5 Route Detail — `/routes/:slug`
- **File:** `pages/public/RouteDetail.tsx`
- **Purpose:** Deep per-lane freight page.
- **Key UI elements:** Breadcrumbs; state pill; H1; DirectAnswer; stat chips (km, transit, PTL/LTL, highway); data-status notice; "Ship from" + "Check Estimated Fare" (prefills `?from=&to=`); `QuoteLeadCard`; "Why Ship" checklist; lane intelligence (commodities + loading/unloading points); Truck Types table (5); return-load economics card → `/return-load`; benefits grid; 4-step How It Works; lazy `PriceTrendChart`; PTL vs FTL table; FAQ; related blog articles; "Routes Connected" block (reverse lane + siblings); "Helpful Guides"; "Freight from Major Cities"; final CTA.

### 5.6 Hindi Pages (hreflang `hi`)
| Route | Page | Elements |
| --- | --- | --- |
| `/hi` | HiHome | H1 "भारत में ऑनलाइन ट्रक बुकिंग"; 3 service cards → `/hi/ptl-transport`, `/hi/return-load`, `/hi/bhada-kaise-book-kare`; FAQ cards; footer links |
| `/hi/ptl-transport` | HiPtlTransport | PTL explainer; PTL vs FTL comparison table; FAQ; EN page link |
| `/hi/return-load` | HiReturnLoad | Return load explainer; FAQ; EN page link |
| `/hi/bhada-kaise-book-kare` | HiBhadaGuide | 4-step booking guide (glass step cards); FAQ; EN link → `/how-it-works` |
| `/hi/route/rourkela-to-ranchi` | HiRouteRourkelaRanchi | Route rate page; 3 stat cards (180 km, ~4hr, PTL/FTL); FAQ; EN route link |

### 5.7 Blog — `/blog` and `/blog/:slug`
- **Files:** `pages/blog/BlogList.tsx`, `pages/blog/BlogArticle.tsx`
- **BlogList:** Hero + article cards (cover image or 📦 fallback, category badge, title, excerpt, date/read-time/author, ArrowRight). 86 articles, static at build.
- **BlogArticle:** Category badge; H1; DirectAnswer; KeyTakeaways (from first 3 paragraphs); meta row; cover image; summary card; prose body with inline-link parsing; FAQ cards; "Freight Routes Mentioned"; author bio; "More Articles"; share card ("Share Article" → clipboard + toast).

### 5.8 Public Share Pages
- **SharedTrip — `/share/trip/:id`:** Public view of a trucker's trip: route block, details grid (Departure, Capacity, Price highlight, Vehicle, optional Distance/Duration), trucker profile card (avatar, name, ⭐ rating), status badge, CTA ("Book This Load" → `/register` or "Back to Browse"), WhatsApp share button. Data from Supabase (`trips` + RPC), noindex.
- **SharedShipment — `/share/shipment/:id`:** Same pattern for a shipment: route block, goods description, details grid (Pickup Date, Weight, Budget highlight, optional Distance/Duration), pickup/delivery addresses, status badge, CTA ("Offer Your Truck" → `/register`). No map, no WhatsApp.

### 5.9 Truck Near Me — `/truck-near-me`
- **File:** `pages/public/TruckNearMe.tsx`
- **Purpose:** "Truck near me" SEO landing (shipper acquisition) with an animated static mock map panel.
- **Key UI elements:** Hero with glass "Trucks Near You" mock panel (Rourkela→Kolkata, LIVE badge, 3 truck rows with credit scores, market-rate note); CTAs "Find a Truck Now" / "Check Market Rate"; Problems grid; 3-step "Book a Truck"; Benefits grid; Coverage grid → `/transport-service/:slug` (9 cities); FAQ; Popular Routes grid → `/routes/:slug`; CTA card with trust chips.

### 5.10 App Screen Previews (marketing gallery) — `/screens/*`
| Route | Page | Mock content |
| --- | --- | --- |
| `/screens/dashboard` | DashboardPreview | Shipper dashboard mock (4 stat cards, weekly shipments bar chart, recent shipments list) + Trucker dashboard mock (4 stat cards, earnings bar chart, recent trips list) |
| `/screens/matching` | MatchingPreview | "AI_MATCH_ENGINE v2.4" frame; tabs Browse Shipments/Trips; search input; Filters & AI Sort buttons; listing cards with color-coded AI match % badges |
| `/screens/chat` | ChatPreview | "MESSENGER" frame; sidebar with conversations (avatar, unread badge, online dot); chat window with message bubbles, read checkmarks, composer + Send |
| `/screens/credit-score` | CreditScorePreview | "TRUST_SCORE_DASHBOARD" frame; SVG circular gauge (832 Platinum), tier bars, stat rows, score-breakdown progress bars, 4 AI insight cards |
| `/screens/reviews` | ReviewsPreview | "REVIEW_SYSTEM" frame; overall rating (4.4), star buckets, filter tabs, sort select, review cards with StarRating + likes |
| `/screens/admin` | AdminPreview | "ADMIN_COMMAND_CENTER" frame; 6 metric cards, area/bar charts, live event feed with type-colored rows |

---

## 6. Public Marketing & Info Pages

### 6.1 Home — `/`
- **File:** `pages/Index.tsx`
- **Purpose:** Landing page; primary acquisition surface for shippers and truckers. Aggregates 14 sections.
- **Key UI elements:**
  - Hero: badge "Live in East India — Early Access"; H1 "Book Trucks & Part Loads Across East India"; `Button "I Want to Ship Goods"` / `Button "I Have Truck Space"`; trust ticks (GST-verified truckers, Live GPS tracking, Escrow-backed payments); quick-scroll pills; **HeroQuoteWidget** form (`input From`, `input To` with datalist, `input Weight (kg)`, `Button "Get estimate — no login needed"` → instant estimate card with "Get exact quote" link); stats row (40% Empty Trucks, 10x Slow Matching, 30–60 Days Delayed Payments)
  - SectionNav sticky pill nav; ProofBar stats; BentoGrid "Utilization Crisis" (4 cards); WhatIsLoadSaathi (3 cards); HowItWorksSection (Shippers 4 steps / Truckers 4 steps + "See Full Walkthrough"); WhyLoadSaathi (two 5-benefit cards); PlatformTabs (Shipper OS / Transporter OS / AI Command Center — each with mock UI + 6 feature cards with accent badges); TrustedAcrossEastIndia (4 city cards → `/location/:city`); VisionSection; AppPreview (6 preview cards → `/screens/*`); SafetyTrust (3 trust cards); FaqSection (7 native accordions); CtaSection (dual CTA + Sign in link)
- **Behavior:** HeroQuoteWidget instant client-side estimate (from `distances.json` + `VEHICLE_RATES`, no network); PlatformTabs state; SectionNav scroll-spy. No page-level fetching.

### 6.2 Features — `/features`
- **Purpose:** Platform capabilities for both audiences + FAQ.
- **Elements:** 6 Shipper OS feature cards (Shipment Management, AI Transporter Discovery, Smart Notifications, Real-Time Tracking, Verified Network, Analytics); 6 Transporter OS cards (Load Discovery, Route Optimization, Smart Match Alerts, Earnings Dashboard, Payment Protection "Coming soon", Trip History); 3 AI Command Center cards (AI Match Scoring, Price Prediction, Credit Scoring); 4 FAQ cards; CTA buttons.

### 6.3 How It Works — `/how-it-works`
- **Elements:** For Shippers — 5 numbered step cards (Register → Post Shipment → AI Match → Track → Complete & Review); For Truckers — 5 steps (Register Fleet → Post Trip → Find Loads → Haul & Track → Get Paid); stat lines; CTA buttons.

### 6.4 About — `/about`
- **Elements:** Mission + Vision cards; "A Broken System" vs "Intelligence, Not Intermediaries" bullets; stats row; 5 value cards; "The LoadSaathi Story"; `TeamShowcase` leadership component; 6 corridor cards → `/routes/:slug`; 3 guide cards; "Get Started" CTA.

### 6.5 Pricing — `/pricing`
- **Elements:** Shipper plan card (free, 7 features, "Live" badge on escrow, "Start Shipping"); Trucker plan card ("Most Popular" banner, free, 7 features, "Start Hauling"); Transaction fee breakdown (Shippers 1.5–3% / Truckers 1.5–2.5%); LoadSaathi vs Brokers comparison table (8 rows); 5 pricing FAQ cards; "Create Free Account" CTA.

### 6.6 FAQ — `/faq`
- **Elements:** 5 categories with accordions (Shippers 5, Truckers 5, Payments 5, Trust & Safety 6, Technical 5); "Contact Support" + "Create Free Account" CTAs.

### 6.7 Contact — `/contact`
- **Elements:** Form card (Full Name, Email, Subject, Message textarea, "Send Message" button → success state "Message Sent!"); info cards (Email, Live Chat 24/7, Response under 4 hours, Office); Business hours card; Enterprise inquiries mailto; Leadership cards (CEO Sanjaya Sahu + COO Prince Mallik with phone/LinkedIn); CTA.
- **Behavior:** form submits via `insertLead` lib (lead capture) + analytics, silent failure.

### 6.8 Safety & Trust — `/safety-trust`
- **Elements:** 6 trust cards: Digital Freight Credit Score (4 tier progress bars 300–900), Bidirectional Reviews, Multi-Level Verification (Aadhaar/PAN/DL, GST, vehicle docs, address), Escrow Protection, Documented Compliance (e-way bill, ePOD, GPS logs), AI Fraud Detection; "How Your Credit Score Is Calculated" (5 weighted cards: Trip Completion 30%, On-Time 25%, Reviews 20%, Profile 15%, Payment History 10%); CTA.

### 6.9 Privacy — `/privacy`
- **Elements:** 6 numbered legal sections (Information We Collect, How We Use, Information Sharing incl. "No Data Selling", Data Security TLS 1.3/AES-256, Your Rights, Contact Us); CTA links to `/contact` and `/terms`.

### 6.10 Terms — `/terms`
- **Elements:** 12 numbered legal sections (incl. User Accounts & Registration, Transaction & Payment Terms, Digital Credit Score); CTA links.

### 6.11 Shipper Solution — `/solutions/shippers`
- **Elements:** Hero with "Shipper Command Center" mockup (LIVE/AI.ACTIVE badges, KPI mock, recent tenders list); 4 problem cards (Broker Dependency, Opaque Pricing, No Real-Time Tracking, Empty Truck Inefficiency); 4 feature cards with stat callouts (2.4x faster matching, 100% live visibility, ₹12K avg savings, 98% on-time); dashboard mockup with 4 KPI cards + "Live Shipment Map" placeholder; stats row; 4 FAQ cards; registration CTA with trust ticks.

### 6.12 Trucker Solution — `/solutions/truckers`
- **Elements:** Mirror of shipper page: "Trucker Command Center" mockup (FLEET.ON/AI.SYNC, 87% utilization, available return loads list with prices); 4 problem cards (Empty Return Trips, Broker Margins, Payment Delays, Route Uncertainty); 4 feature cards (40% more revenue, 22% higher earnings, 850+ score, <5min response); dashboard mockup with 4 KPI cards + recommended loads with match %; stats row; 4 FAQ; registration CTA.

### 6.13 Gallery — `/gallery`
- **Elements:** Tabs filter (All, Fleet, Office, Team, Corridors, Operations, Events); masonry grid with hover captions; skeleton loading; empty state; **lightbox Dialog**; images from Supabase storage (`gallery_images` table).
- **Behavior:** fetches from Supabase, category re-fetch, broken-image tracking.

### 6.14 Sitemap — `/sitemap`
- **Elements:** Static link columns (Main, Solutions, Freight, Tools, Hindi, Company) + dynamic groups (Routes 48, Cities 14, Transport services 9, Guides 3, Blog 86) derived from the same data modules; CTA card "Post a Shipment".

### 6.15 For MSMEs — `/for-msmes`
- **Elements:** Emerald hero ("Calculate Your Rate" → calculator, "Sign Up Free"); 3 problem→solution cards with stats (30%, 20–40%, 50%); 6 benefit cards; 3 circular steps; 4 FAQ; CTA links.

### 6.16 AI Logistics — `/ai-logistics`
- **Elements:** Blue hero ("See AI Matching in Action" → `/screens/matching`, "Read Full Article" → blog); empty-mile problem + 3 stat cards; 6 "How LoadSaathi Uses AI" cards; 4-step "How AI Matching Works"; CTA links.

### 6.17 Freight Data Hub — `/data` (alias `/freight-intelligence`)
- **Elements:** 4 insight cards (PTL rate trends, empty-km reduction, PTL CAGR 9.7%, utilization 87%); **Corridor Rate Index table** (6 corridors: distance, PTL ₹/tonne, FTL ₹/trip → route pages); CTA buttons.

### 6.18 Comparison Hub — `/compare`
- **Elements:** Stats bar (4); **LoadSaathi vs Vahak vs BlackBuck vs Trukky** 5-column table (10 rows); LoadSaathi vs Traditional Brokers table (8 rows); 3-step how-it-works; head-to-head cards → `/compare/loadsaathi-vs-trucksuvidha`, `/compare/loadsaathi-vs-blackbuck`; CTAs.

### 6.19 Compare vs TruckSuvidha — `/compare/loadsaathi-vs-trucksuvidha`
- **Elements:** Feature comparison table (7 rows: cost, commission, matching, density, calculators, return-load tool, registration); "Where TruckSuvidha Is Strong"; 4 "Why choose LoadSaathi" cards; CTAs; 3 FAQ; related links.

### 6.20 Compare vs BlackBuck — `/compare/loadsaathi-vs-blackbuck`
- **Elements:** Distinct light theme; stat strip (₹0 commission, payout same-day, free KYC); business model table (6 rows); "Where BlackBuck excels" (3 cards); "Why fleet owners choose LoadSaathi" (3 dark cards incl. ₹48,000/yr math); verdict; 4 FAQ; final CTA; related guides.

### 6.21 404 — `*`
- **Elements:** Gradient background, truck icon, giant "404", "Page not found", `Button "Go Home"` + `Button "Go Back"`. noindex.

### Shared layouts & chrome
- **PublicLayout** (wraps all public pages): skip link; offline banner; fixed header (logo, ThemeToggle, role-aware Dashboard/Sign In/Get Started links, mobile hamburger); TrustStrip (4 tiles above footer); footer with 7 link columns + social icons + Cookie settings; desktop `DockNav` + mobile floating tab bar with center "Get Started" action; `ScrollToTopFab`; `FloatingCTA` (WhatsApp + Call support FAB); Disha mascot + FreddyChat.
- **Layout** (authenticated app shell): sticky header with logo, ThemeToggle, `NotificationBell`, messages shortcut with unread badge, account dropdown (avatar, name, verification badge, Profile/Credit Score/Home/Tour/Sign Out); role-based nav + mobile tabs with center action (Trucker: "Post Trip"; Shipper: "Post Load"); unread message polling + realtime; presence; `PhoneNudgeBanner`; offline banner; `LocationPermissionBanner` + `AutoGpsTracker`; Disha + FreddyChat; footer.
- **AuthLayout** (login/register/choose-role/onboarding/forgot-password): minimal shell — large Disha mascot as branding/guide engine, no header/footer.
- **MobileTabBar:** floating bottom "island" nav with sliding pill highlight, sheet menu, center action.
- **FloatingWhatsAppButton:** detail-page FAB (share or contact-owner mode) that builds WhatsApp links and tracks leads.

---

## 7. Auth Pages (`AuthLayout`)

### 7.1 Login — `/login`
- **Elements:** Logo header; "Welcome back" heading; error banner; `Button "Continue with Google"` (OAuth); divider "or sign in with email"; email input; password input with show/hide toggle; `Button "Sign In"`; "Forgot password?" link → `/forgot-password`; "Create a free account" → `/register`; footer tagline.
- **Behavior:** Clerk email sign-in + Google OAuth (Capacitor-aware redirect). Returns users to their role dashboard (`dashboardPathFor()`); unassigned → `/choose-role`. Disha login guide auto-starts.

### 7.2 Register — `/register`
- **Elements:** "Create your account" heading; Google button; first/last name inputs; email; password (min 8); `Button "Create Account"`; **verification step** (6-char code input, "Verify", "Resend code", "Back to sign up"); "Already have an account? Sign in".
- **Behavior:** Clerk sign-up with email-code verification (`?type=shipper|trucker` preselects role); on verify → navigate to `/choose-role?type=...`.

### 7.3 Choose Role — `/choose-role`
- **Elements:** Loading spinner; error banner; two role cards: **Shipper** (blue User icon, hover-revealed "Select Shipper ✓") and **Trucker** (orange Truck icon, optional checkbox "Get help from an experienced trucker on my route" → `mentor_requested`); footnote about switching roles later; "Setting up your personalized dashboard…" overlay.
- **Behavior:** Saves `user_type` (+ mentor opt-in) to Supabase `users`, refreshes profile, navigates to `/onboarding`. Guards: unauthenticated → `/login`, already has role → dashboard.

### 7.4 Onboarding Flow — `/onboarding`
- **Elements:** 3-step indicator dots; **Welcome** step (role-colored icon, 3 feature bullets, "Get Started →", "Skip for now"); **Profile** step (Full name, Phone with live validation "Looks good"/"Enter 10 digits", optional Company name, "Save & Continue →"); **Done** step (green check, "Post Your First Trip/Shipment", "Go to Dashboard").
- **Behavior:** Saves phone/company to `users` (Indian phone validation), sets `loadsaathi-onboarded-{userId}` flag; first-action path goes to post-trip/post-shipment.

### 7.5 Forgot Password — `/forgot-password`
- **Elements:** Lock icon; "Forgot Password?"; email field; `Button "Send Reset Link"` (spinner); "Back to Login"; success state ("Check Your Email", "Try a different email").
- **Behavior:** calls `resetPassword(email)`; success toast.

---

## 8. Trucker App Pages (`Layout`, trucker role)

### 8.1 Trucker Dashboard — `/trucker/dashboard`
- **Elements:** Header with welcome + rating pill; offline banner; `KycStatusCard` nudge; first-time `EmptyState` ("Post Your First Trip" / "Browse Available Loads"); `ProfileProgressBar` + `OnboardingChecklist`; **4 stat cards** (Live Trips, New Requests, Completed, Total Earnings — each with mini progress bar + link); **`NearbyLoadsMap`** (live loads around trucker's GPS, radius 50/75/100 km, "Locate me"); Quick Actions card ("Post New Trip", "Find Loads", "Manage Trips"); Quick Links (Booking Requests, Work History); **Driver Risk Score card** (`CreditScoreGauge` + tips + badge); **Live Fleet card** (`LiveMap` of your trucks from `driver_locations`); Monthly Earnings card (7/30/90-day toggle + `TruckerEarningsChart` bar chart + empty state); Recent Activity card.
- **Behavior:** 8 parallel Supabase queries for stats/earnings/activity/trucks; no realtime (poll on mount/range change); `ErrorState` retry.

### 8.2 Post Trip — `/trucker/post-trip`
- **Elements:** "Back" button; Quick Post / Full Details segmented toggle; `TemplateSelector`; **Origin/Destination** (`VoiceLocationInput` quick / `LocationSelector` full); `ReturnLoadProbability` panel; Departure Date (min today); Available Capacity (tonnes); Price per Tonne + `PricePredictor` + "Estimated total ₹"; `VehicleSelect` + Vehicle Number (full); `SaveAsTemplate`; `Button "Post Trip"` (disabled offline); per-field validation errors.
- **Behavior:** react-hook-form + zod; on submit → `insert_trip` RPC + fire-and-forget `insert_price_history`; geocode + OSRM → `update_trip_coords`; success toast → `/trucker/my-trips`. Disha guide flow.

### 8.3 Trucker Hub — `/trucker/my-trips` (?tab=trips|sent|incoming)
- **Elements:** Header + "Show me loads" / "Post New Trip" buttons; **Tabs**: "My Trips" (cards with `RouteMap` 150px, StatusBadge, date/price/capacity, actions: View, Mark Delivered, Trip Completed, Edit, Delete — all with AlertDialog confirm), "Sent Offers" (offer cards; when accepted → Chat + Call buttons), "Booking Requests" (request cards; pending → Accept/Decline; accepted → Chat); skeletons + ErrorState.
- **Behavior:** loads trips, `shipment_requests` (+shipper join), `requests` (+trip join); RPCs: `delete_trip`, `complete_trip`, `mark_trip_delivered`; accept/decline updates `requests.status`.

### 8.4 Edit Trip — `/trucker/trips/:tripId/edit`
- **Elements:** "Back to My Trips"; "Edit Trip Details" card (orange header); same fields as PostTrip (origin/destination LocationSelector, date, capacity, price, VehicleSelect, vehicle number); "Cancel" + "Save Changes".
- **Behavior:** ownership check (`trucker_id` mismatch → error+redirect); saves + best-effort geocode/OSRM coordinate re-sync.

### 8.5 Trucker Trip Detail — `/trucker/trips/:tripId`
- **Elements:** Back button; contextual header actions based on status (**Start Trip** blue, **Edit Trip**, **Mark Delivered** purple, **Complete Trip** green — AlertDialog-confirmed); `RouteMap` 240px; `GpsTracker` (when active/in_transit — Start/Stop Tracking, accuracy/speed/heading grid); `EmissionsCard`; trip info card (route, StatusBadge, departure, capacity, price, vehicle); **Booking Requests section** with pending count, tabs Pending/Accepted/Declined, shipper cards (avatar, name, phone, rating, goods/weight/pickup), Accept/Decline, and on completion **"Rate Shipper"** via `ReviewDialog`.
- **Behavior:** RPCs `start_trip` / `mark_trip_delivered` / `complete_trip` (cascade to linked shipments); event tracking.

### 8.6 Browse Shipments — `/trucker/browse-shipments` (?view=list|map|card)
- **Elements:** Search input; list/map view toggle; sort select (Best Match, Budget, Pickup Date, Distance); "Filters Applied" collapsible (Origin, Destination, Min Weight, Max Budget); **list cards** (route, match badge, **AI match badge** with tooltip reasoning + spinner, date, weight, budget, distance/ETA, goods, shipper + VerificationBadge, FavoriteButton, "Send Offer"); **map view** (`LoadSaathiMap` with clustered loads + sidebar cards); **card view** (`LoadCardStack` swipe stack + `FloatingWhatsAppButton`); empty/error/skeleton states.
- **Behavior:** React Query + `useSmartMatch` (AI scores) + `useLiveLoadLocations`; `calculateMatchScore`; accept → `/trucker/shipments/:id`.

### 8.7 Trucker History — `/trucker/history`
- **Elements:** Header; 4 stat cards (Total, Completed, Pending, This Month); filter card (Activity Type select: All/Posted Trips/Sent Offers; Status select; Clear Filters); activity list (color bar orange=trip/blue=offer, icon tile, status badge, client/payload/revenue grid, "VIEW →"); empty/error states.
- **Behavior:** React Query fetches trips + `shipment_requests`, merges + filters client-side.

### 8.8 Trucker Verification (KYC) — `/trucker/verification`
- **Elements:** Status banner (verified/pending/rejected with note/none); progress card ("X of Y documents added", "Saved {bytes} by compressing", Progress bar, "Still needed"); **document cards** per KYC doc (licence, RC, insurance, truck photos): Required/Optional badge, status badge, file size, reviewer note, signed-URL preview, expiry date input with warnings, camera/gallery pickers, "Take photo"/"File" buttons, delete; "Submit for verification" button; privacy footnote.
- **Behavior:** camera `capture="environment"` + gallery inputs; image compression; RPCs for upload/delete/expiry/submit from `@/utils/kyc`.

---

## 9. Shipper App Pages (`Layout`, shipper role)

### 9.1 Shipper Dashboard — `/shipper/dashboard`
- **Elements:** Header with welcome + offline notice; `LiveTruckMap` (live trucks); `ProfileProgressBar` + `OnboardingChecklist`; **4 stat cards** (Active Loads, New Offers, Completed, Total Spent); Quick Actions ("Post New Load", "Find Trucks" → `/browse-trucks`, "My Loads"); Recent Activity links; Upcoming Shipments list (route, date/weight chips, "Details", "Cancel"); **Analytics row**: Monthly Spending card (7/30/90-day toggle + `ShipperSpendingChart`) + Recent Routes card; empty state "Create My First Shipment".
- **Behavior:** 7 parallel queries; cancel shipment → `cancelled`; offline gating.

### 9.2 Post Shipment — `/shipper/post-shipment`
- **Elements:** Mirror of PostTrip: Quick/Full toggle, `TemplateSelector` (type=shipment), Origin/Destination (`VoiceLocationInput`/`LocationSelector`), `ReturnLoadProbability`, Ready Date, Weight, Goods Description textarea, Budget per Tonne + `PricePredictor` + "Estimated total ₹", Pickup/Delivery addresses (full mode), `SaveAsTemplate`, `Button "Post Shipment"` (blue, disabled offline).
- **Behavior:** `insert_shipment` RPC + fire-and-forget `insert_price_history`; geocode+OSRM coords; → `/shipper/dashboard`. Disha guide flow `post-load`.

### 9.3 My Shipments — `/shipper/my-shipments` (?tab=loads|sent|incoming)
- **Elements:** Header + "Post New Load"; **Tabs**: "My Loads" (cards with View/Edit/Delete via AlertDialog), "Sent Requests" (status badge; accepted → "Chat with Trucker"), "Incoming Offers" (trucker cards with avatar/rating/message; Accept/Decline; accepted → Chat); per-tab empty states.
- **Behavior:** accept offer → `shipment_requests.status=accepted` + linked shipment → `matched` (DB trigger notifies trucker).

### 9.4 Shipment Detail — `/shipper/shipments/:id` (also `/trucker/shipments/:id`)
- **Elements:** Back; owner actions (Edit Shipment, Rate Trucker when completed); trucker action ("Send Offer"); `RouteMap` 260px; `EmissionsCard`; main card (route + status, date, weight, budget, offers count for owner, goods, pickup/delivery addresses); sidebar: **Shipper Details** (for truckers) or **Trucker Contact** + "Chat on WhatsApp" (for owner); **Shipment Status card** with live tracking: `LiveMap` with live truck marker when in transit (stale >120s warning, auto-refresh), step list otherwise, "Review Offers" button; **Offer Dialog** (price + message + live total); `ReviewDialog` for owner on completed.
- **Behavior:** realtime subscription to `driver_locations` for the accepted trucker; `insert_shipment_request` RPC for offers.

### 9.5 Edit Shipment — `/shipper/shipments/:shipmentId/edit`
- **Elements:** "Edit Shipment Details" card (goods, weight, budget, hidden origin/destination); "Save Changes".
- **Behavior:** React Query + mutation; geocode/OSRM coords re-sync.

### 9.6 Shipper History — `/shipper/history`
- **Elements:** Same pattern as Trucker History (stat cards, filters, activity list with blue=shipment/orange=request bars, "DETAILS →" → `/shipper/shipments/:id` or `/trips/:id`).

### 9.7 Browse Trips — `/browse-trucks`
- **Elements:** Search; list/map toggle; sort (Best Match, Price, Departure Date, Distance); filters (Origin, Destination, Min Capacity, Max Price, Vehicle Type via `VehicleSelect`); list cards (route, status, match + AI badges, date, capacity, price, distance/ETA, trucker + VerificationBadge + rating, FavoriteButton, "View Details" → `/trips/:id`); map view (`LoadSaathiMap` with live truck markers + sidebar).
- **Behavior:** React Query + `useSmartMatch` + `useLiveDriverLocations` + `useTripMapMarkers`.

---

## 10. Common Authenticated Pages

### 10.1 Trip Detail — `/trips/:tripId`
- **Elements:** Back; `RouteMap` 280px; **Live Trucker Location card** (pulsing dot, stale warning, `LiveMap` single truck); `EmissionsCard`; Trip Information (WhatsApp chat button, route, date, vehicle/price grid, capacity badge, trucker details + `CreditScoreBadge`); Recent Reviews card; **"Book Space" sticky card** (weight input with capacity warning, goods, pickup/delivery addresses, "Estimated Cost ₹", "Send Booking Request"; completed → "Trip Finished" + "Find Other Trucks").
- **Behavior:** realtime `driver_locations` subscription; booking request → `requests` insert → `/shipper/my-shipments?tab=sent`.

### 10.2 Chat — `/chat/:requestId`
- **Elements:** Header (back, gradient avatar, name, Online/Offline presence dot, "Call" tel link); message bubbles (mine orange/right, theirs white/left, arrival animation, timestamp, `MessageStatus` ticks + read receipts, "Retry" on failed); auto-scroll; offline banner; composer input + send button (spinner).
- **Behavior:** optimistic messages + dedupe; realtime `postgres_changes`; read-receipt updates; supports both `requests` and `shipment_requests` kinds.

### 10.3 Chat List — `/messages`
- **Elements:** Header "Messages"; conversation cards (avatar, counterparty name, last message preview, time, unread orange badge, ArrowRight → `/chat/:requestId`); empty state (→ dashboard or browse-trucks); skeletons.
- **Behavior:** groups messages by conversation; realtime re-fetch on `messages` changes.

### 10.4 Profile — `/profile`
- **Elements:** Avatar with camera upload overlay; name + Verified badge + role badge + trucker "Get verified" button; **Tabs**: Overview (Trips/Shipments, Ratings, Credit Score card → `/credit-score`, Account Summary), Reviews (5-star list), Personal Info (Full Name, Phone with validation, Company, SMS opt-in checkbox, "Save Changes"), Verification (trucker status banner), Security ("Security Settings", **Switch Account Type** Shipper/Trucker, **Admin Mode** for allow-listed user).
- **Behavior:** avatar upload; role switch updates `user_type` → role dashboard; admin entry gated by env var.

### 10.5 Favorites — `/favorites`
- **Elements:** Tabs Trips/Shipments/Users with counts; cards linking to details + `FavoriteButton` hearts; per-tab "Remove All" with AlertDialog confirm; empty state.
- **Behavior:** favorites table + batch fetches; bulk delete per entity type; query invalidation.

### 10.6 Credit Score — `/credit-score`
- **Elements:** Back; Shield header; `CreditScoreGauge` (lg); Tabs **Breakdown** (`CreditScoreDetail` factors), **History** (`CreditScoreHistory` line chart), **AI Insights** (`AIInsights`); no-score fallback card ("Starting Score: 550").
- **Behavior:** `useCreditScore()` + `useCreditInsights()`.

---

## 11. Shared App Components (quick reference)

| Component | What it does | Used in |
| --- | --- | --- |
| `LoadCardStack` | Swipeable card stack (Previous / Accept with green accept-beat / Next, counter) | BrowseShipments card view |
| `LocationSelector` | Cascading State → District → City/Town selects (from `locations.json`) | PostTrip, PostShipments, EditTrip |
| `VoiceLocationInput` | City autocomplete + Web Speech voice input (en-IN), 0.6-confidence auto-select | Quick-mode post forms |
| `VehicleSelect` | Searchable grouped vehicle dropdown (Indian commercial vehicles) | PostTrip, EditTrip, BrowseTrips filters |
| `NearbyLoadsMap` | Live loads around GPS + radius toggle 50/75/100 km + nearest-first list | Trucker Dashboard |
| `LiveMap` | Live truck positions map (keyless OSM, zoom controls, tile switcher, fit-bounds) | Trucker Dashboard, ShipmentDetail, TripDetail |
| `RouteMap` | Static OSRM route map (geocode + polyline + origin/dest markers + distance/duration) | TruckerHub, TripDetail, ShipmentDetail |
| `FreddyChat` | Floating AI assistant chat (quick chips, page context, markdown, auto-open first visit) | Global (layouts) |
| `DishaHelpPanel` | Context-aware help modal (tips per page, actions, mood badge) | Global |
| `GuideBotFab` | Location-aware help FAB for truckers (30s location poll) | Trucker screens |
| `GpsTracker` | Explicit live-tracking card (start/stop, accuracy/speed, upserts `driver_locations` every 10s) | TruckerTripDetail |
| `AutoGpsTracker` | Invisible background GPS updater (30s upserts for truckers/shippers) | App layout |
| `NotificationBell` | Notifications dropdown with realtime alerts, mark read, push toggle | App header |
| `ReviewDialog` | 5-star bidirectional review dialog (shipper/trucker) | TruckerTripDetail, ShipmentDetail |
| `FavoriteButton` | Heart toggle with optimistic cache | Browse lists, Favorites |
| `CreditScoreGauge` | SVG score gauge (300–900, animated) | Dashboards, Credit Score page |
| `CreditScoreHistory` | Recharts line chart of score history | Credit Score page |
| `LoadSaathiMap` | Main configurable Leaflet map (trucks + loads + user circle + clusters + legend + switcher) | BrowseShipments, BrowseTrips, NearbyLoadsMap |
| `TruckMarker` | Truck marker with 4 icon states + popup (driver, route, speed, GPS age) | Via LoadSaathiMap |
| `LoadMarker` | Load marker + popup (route, weight, budget, goods) | Via LoadSaathiMap |
| `RoutePolyline` | OSRM route polyline drawing | Via LoadSaathiMap |
| `TileLayerSwitcher` | Map style picker (Standard / Satellite / Dark / Night) | All maps |
| `ZoomControls` | Custom zoom in/out/fit-all | All maps |
| `MapLegend` | Legend overlay (Available Truck / In Transit / Load Demand) | LoadSaathiMap |

---

## 12. Summary at a Glance

| Group | Count | Routes |
| --- | --- | --- |
| Public marketing/info | 21 | `/`, `/features`, `/how-it-works`, `/about`, `/pricing`, `/faq`, `/contact`, `/safety-trust`, `/privacy`, `/terms`, `/solutions/*`, `/gallery`, `/sitemap`, `/for-msmes`, `/ai-logistics`, `/data`, `/compare`, `/compare/*`, 404 |
| SEO/content hub | ~13 + dynamic | `/location/:city`, `/transport-service/:city`, `/guide/:slug`, `/routes`, `/routes/:slug`, `/hi*`, `/blog*`, `/share/*`, `/truck-near-me`, `/screens/*` |
| Tools & calculators | 20 + index | `/tools*`, `/transport-cost-calculator` |
| Commercial hubs | 5 | `/return-load`, `/ptl-transport`, `/ltl-transport`, `/truck-load-booking`, `/freight-marketplace` |
| Auth | 5 | `/login`, `/register`, `/choose-role`, `/onboarding`, `/forgot-password` |
| Trucker app | 8 | `/trucker/*` |
| Shipper app | 7 | `/shipper/*`, `/browse-trucks` |
| Common app | 6 | `/trips/:id`, `/chat/:id`, `/messages`, `/profile`, `/favorites`, `/credit-score` |
| **Total (excl. admin)** | **~85+ pages** | — |
