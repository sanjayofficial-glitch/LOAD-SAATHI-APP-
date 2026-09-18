# Free Feature Enhancement Plan — LoadSaathi

## Goal

Add 12 no-cost features that leverage existing infrastructure (edge functions, utilities, data tables, hooks) to provide capabilities absent from all competing Indian logistics platforms.

## Constraints

- No new API keys, no new external services, no new database tables
- All data sources already exist in the codebase:
  - OSRM routing + `optimizeRoute()` in `utils/osrm.ts:109`
  - Nominatim geocoding with cache + rate limiter in `utils/geocode.ts:24`
  - Emissions calculator in `utils/emissions.ts:37`
  - Vehicle catalog (234 vehicles) in `data/vehicles.ts`
  - Route distances in `data/distances.json`
  - Route metadata in `data/routeMeta.ts`
  - Price prediction edge function `price-predict` (deployed)
  - Demand forecast edge function `demand-forecast` (deployed)
  - Fuel price data + cron function in `supabase/functions/fuel-cron/`
  - GPS tracking component in `components/GpsTracker.tsx`
  - LiveMap component in `components/LiveMap.tsx`
- New UI goes in `supabase/src/pages/public/tools/` (pattern established by existing calculators)
- New routes go in `supabase/src/routes.tsx` under the `<PublicLayout>` group
- New tools follow SEO pattern: `<SeoMeta>` + `<noscript>` + JSON-LD (established by `FareCalculator.tsx`)

---

## Phase 1 — Core Differentiators (Week 1)

### Task 1: Multi-Stop Route Optimizer

**Files to create:**
- `src/pages/public/tools/RouteOptimizer.tsx`
- `src/data/tollData.ts` (static toll charges, ~50 major highway entries)

**Files to modify:**
- `src/routes.tsx` — add `<Route path="/tools/route-optimizer" element={<RouteOptimizer />} />`

**What it does:**
Uses existing `optimizeRoute()` from `utils/osrm.ts:109` — a nearest-neighbor TSP solver already written but never exposed. Users input origin + up to 6 stops → get optimal sequence with distance/time savings.

**Data flow:**
```
User input: origin city + 6 destination cities
  → geocodeCity() for each (utils/geocode.ts)
  → optimizeRoute(waypoints) returns OrderedRoute
  → Display: optimized sequence table + route map line (reuses LiveMap)
  → Stats: "Naive route: 680 km | Optimized: 520 km | Saved: 160 km (24%)"
```

**Why market doesn't offer this:** Porter, BlackBuck, and Delphi don't expose route sequencing for small truckers. Routific charges ₹10,000+/month.

### Task 2: Public Shipment Tracking Link

**Files to create:**
- `src/pages/public/TrackShipment.tsx` (public, no auth required)

**Files to modify:**
- `src/routes.tsx` — add `<Route path="/track/:trackingId" element={<TrackShipment />} />`
- `supabase/functions/generate-tracking-link/index.ts` (new edge function — generates shareable token)
  - OR simpler: add `tracking_token` column to existing `trips` table migration
  - Uses existing GPS data already being stored (`origin_lat`, `origin_lng` + GpsTracker)

**Data flow:**
```
Shipper clicks "Share tracking link"
  → Supabase INSERT tracking_token into trips table
  → URL: /track/abc123
Recipient opens link (no login)
  → Query trips table via anonymous supabase client by tracking_token
  → Render LiveMap with current GPS position
  → Show: status, ETA, current location, distance remaining
```

**Why market doesn't offer this:** Competitors require app download for tracking. No-login tracking is a major UX differentiator.

### Task 3: Empty Kilometer Savings Calculator

**Files to create:**
- `src/pages/public/tools/EmptyKmSavings.tsx`

**Data flow:**
```
User input: origin / destination / vehicle type
  → getRoute() from utils/osrm.ts (distance + time)
  → calculateEmissions() from utils/emissions.ts (CO2 baseline)
  → Diesel cost: distance × fuel_rate[vehicle] × diesel_price[odisha]
  → Show: "Dedicated truck: 280 km × 2 = 560 km (₹42,000)"
         "Shared: 280 km × 1 = 280 km (₹22,000)"
         "You save: 50% (₹20,000) + 140 kg CO₂"
```

**Why market doesn't offer this:** Competitors claim "40% savings" but don't visualize how empty-return kilometers are eliminated.

---

## Phase 2 — Market Intelligence (Week 2-3)

### Task 4: Return Load Probability

**Files to modify:**
- `supabase/functions/demand-forecast/index.ts` — extend output to include:
  ```ts
  interface ForecastResult {
    // ... existing fields ...
    returnLoadProbability?: number;        // 0-100
    returnLoadConfidence?: "high" | "medium" | "low";
    historicalReturnRate?: number;         // percentage
    returnLoadWindow?: "24h" | "48h" | "72h";
  }
  ```

**Files to create:**
- `src/components/ReturnLoadProbability.tsx` (badge component)

**Files to modify:**
- `src/pages/shipper/PostShipments.tsx` — embed ReturnLoadProbability badge in confirmation
- `src/pages/trucker/PostTrip.tsx` — embed in trip detail page

**Data flow:**
```
Booking confirmed (trip or shipment)
  → Client calls demand-forecast with origin + destination
  → Edge function queries price_history for reverse direction density
  → Calculates: returnLoadProbability = reverseDensity / forwardDensity
  → Returns: { probability: 73, confidence: "high", window: "24h" }
  → UI: Badge "73% — Good chance of return load within 24 hours"
```

**Why market doesn't offer this:** Truckers call brokers guessing return load availability. No platform predicts it before commitment.

### Task 5: Trip Profit Calculator (Trucker)

**Files to create:**
- `src/pages/public/tools/TripProfitCalculator.tsx`
- `src/data/driverWages.ts` (static wage data per state, ~15 entries)

**Files to modify:**
- `src/routes.tsx` — add `<Route path="/tools/trip-profit" element={<TripProfitCalculator />} />`

**Data flow:**
```
User input: origin / destination / vehicle type / load weight / cargo type
  → getRoute() → distance
  → fuelCost = distance × (1/fuelEfficiency[vehicle]) × dieselPrice
  → tolls = lookup tollData.json by highway segments
  → driverWage = distance × wageRate[state]
  → maintenance = distance × maintenanceRate[vehicleClass]
  → depreciation = fixedDailyRate[vehicle] × days
  → grossRevenue = distance × ratePerKm[vehicle] × weight
  → netProfit = grossRevenue - (fuelCost + tolls + driverWage + maintenance + depreciation)
  → Output: "Net profit: ₹2,400 (12%) | FTL alternative: break-even"
```

**Why market doesn't offer this:** Truckers calculate profit in WhatsApp groups using spreadsheets. Transparent profit visibility is unique.

### Task 6: Shared Freight Savings Calculator

**Files to create:**
- `src/pages/public/tools/SharedSavingsCalculator.tsx`

**Data flow:**
```
User input: origin / destination / total cargo weight
  → getRoute() for distance
  → FTL: 2 dedicated trucks (split load) at FTL rates
  → Shared: 1 truck at PTL rates
  → CO₂ savings via calculateEmissions() × 2 trucks vs 1
  → Output: split cost, savings percentage, CO₂ saved, equivalent trees planted
```

**Why market doesn't offer this:** "40% savings" claim is everywhere — no tool shows the actual split math.

### Task 7: Price Trend Chart

**Files to create:**
- `src/components/PriceTrendChart.tsx` (reusable chart component using Recharts)

**Files to modify:**
- `src/pages/public/RouteDetail.tsx` — embed PriceTrendChart in every route page
- `src/pages/public/tools/FareCalculator.tsx` — embed in results

**Data flow:**
```
Route page loads (e.g., /routes/rourkela-to-ranchi)
  → Query price_history by origin_city + destination_city
  → Transform to time-series: [{date, price_per_tonne}]
  → Render LineChart with:
    - Current price marker
    - 30-day volatility indicator
    - Position indicator ("Current: 35th percentile — prices are low")
```

**Why market doesn't offer this:** Everyone shows "current market rate" — nobody shows historical trends or volatility.

---

## Phase 3 — Compliance & Optimization Tools (Week 4)

### Task 8: Document Checklist Generator

**Files to create:**
- `src/pages/public/tools/DocumentChecklist.tsx`
- `src/data/requiredDocuments.ts` (static JSON, ~30 entries mapping route+goods+vehicle → documents)

**Files to modify:**
- `src/routes.tsx` — add `<Route path="/tools/document-checklist" element={<DocumentChecklist />} />`

**Data flow:**
```
User input: route / vehicle type / commodity category
  → Lookup requiredDocuments.ts (static data mapping):
    {
      "rourkela-bhubaneswar": {
        vehicle: "Tata 407",
        commodity: "cement",
        documents: [
          "RC Book Copy", "Insurance Certificate", "Permit (OD-07)",
          "NOC from RTO", "Fitness Certificate",
          "E-Way Bill", "Weight Certificate", "Tax Receipt"
        ],
        special: "Hazardous goods declaration (if applicable)"
      }
    }
  → Display printable checklist with checkboxes
```

**Why market doesn't offer this:** Truckers call each other on WhatsApp asking "what papers do I need?"

### Task 9: Carbon Savings Calculator

**Files to create:**
- `src/pages/public/tools/CarbonSavingsCalculator.tsx`

**Data flow:**
```
User input: origin / destination / vehicle type / load weight
  → calculateEmissions() for FTL (full truck, single shipper)
  → calculateEmissions() for shared (split load, same truck)
  → CO₂ saved = FTL emissions - shared emissions
  → Trees equivalent = CO₂ saved / 21 kg/tree/year
  → Output: "You saved 140 kg CO₂ — equivalent to planting 7 trees"
```

**Why market doesn't offer this:** Environmental impact claims exist in CSR reports — no operational tool.

### Task 10: Toll + Fuel Cost Breakdown

**Files to create:**
- `src/pages/public/tools/TollFuelCalculator.tsx`
- `src/data/tollCharges.ts` (static toll rates for 20 major highway corridors)

**Data flow:**
```
User input: origin / destination / vehicle type
  → getRoute() → distance + highway segments (from distances.json)
  → fuelCost = distance ÷ fuelEfficiency × dieselPrice[from fuel_prices table]
  → tolls = sum tollCharges.json entries matching highway segments
  → Output: "Diesel: ₹12,600 | Tolls: ₹850 | Total: ₹13,450"
```

**Why market doesn't offer this:** Only freight rates shown — no true operating costs.

### Task 11: GST Calculator for Freight

**Files to create:**
- `src/pages/public/tools/GstCalculator.tsx`

**Data flow:**
```
User input: charge amount / origin state / destination state / service type
  → IGST: 5% (if interstate) or 28% + cess (if special category)
  → CGST + SGST: 2.5% each (if intrastate, normal rate)
  → Input credit eligibility: Yes (if registered under GST)
  → Output: "IGST @ 5%: ₹1,250 | Input tax credit: Eligible"
```

**Why market doesn't offer this:** No logistics platform handles GST complexity.

### Task 12: Vehicle Payload Utilization Calculator

**Files to create:**
- `src/pages/public/tools/PayloadUtilization.tsx`
- `src/data/vehicleDimensions.ts` (new file — add dimensions to vehicles.ts or separate)

**Data flow:**
```
User input: truck model / cargo dimensions / quantity
  → Look up vehicleDimensions for truck
  → Calculate: cargoVolume / truckVolume × 100
  → Calculate: cargoWeight / truckCapacity × 100
  → Output: "Volume utilization: 68% | Weight utilization: 78% | Can fit: 2 more sacks"
```

**Why market doesn't offer this:** Truckers guess whether cargo fits.

---

## Phase 4 — SEO & Distribution (Week 5)

### Task 13: Route Density Heatmap

**Files to create:**
- `src/pages/public/Heatmap.tsx` (public page)

**Data flow:**
```
Query price_history grouped by route
  → Aggregate: count of shipments per route over last 30 days
  → Color intensity: green (low) → red (high)
  → Overlay on India map SVG with route lines from distances.json
```

**Why market doesn't offer this:** No platform shows market-wide activity heatmaps.

### Task 14: Corridor Economics Report Pages

**Files to create:**
- `src/pages/public/corridors/[corridorSlug].tsx` (dynamic route)

**Data flow:**
Each of the 6 corridors (e.g., "rourkela-bhubaneswar") gets a dedicated page with:
- Distance band analysis from distances.json
- Price history trend chart
- Popular commodities from routeMeta.ts
- Return-load probability analysis
- Document checklist for that corridor
- Carbon savings potential

**Why market doesn't offer this:** No competitor publishes corridor-level economics publicly.

---

## Implementation Rules

All new features must follow the existing codebase patterns:

1. **Routing**: Add `lazy()` import + `<Route>` in `routes.tsx`
2. **Layout**: Public tools wrapped in `<PublicLayout>` (via parent route)
3. **SEO**: Every page uses `<SeoMeta>` + `<noscript>` + JSON-LD
4. **Styling**: Tailwind CSS only, `cn()` helper from `lib/utils.ts`
5. **Data fetching**: Use `@tanstack/react-query` for DB queries, `fetch()` for edge functions
6. **Forms**: React Hook Form + Zod for validation where applicable
7. **Analytics**: Call `trackCalculatorStarted` / `trackEstimateGenerated` from `utils/analytics.ts`

## Validation Steps

After each feature:
1. `pnpm run typecheck` — must pass
2. `pnpm run lint` — must pass
3. `pnpm run build` — must succeed
4. Navigate to each new route in dev server — must render without errors
5. Verify `<noscript>` content is readable by static crawlers
6. Verify `<SeoMeta>` injects correct title/description/JSON-LD

## Risk: Edge Function Rate Limits

The `demand-forecast` function has a rate limit of 15 req/min. Features calling it (Tasks 4, 7, 9) must batch requests or implement client-side caching to avoid hitting limits during testing.

## Risk: OSRM Public API

The OSRM instance at `router.project-osrm.org` is free but public. For the Route Optimizer (Task 1), the existing cache in `getRoute()` (10-min TTL, 500-entry LRU) handles burst traffic. For the Corridor Heatmap (Task 13), use pre-computed `distances.json` instead of live OSRM calls.
