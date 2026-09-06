# Accurate India Pricing Engine — Implementation Plan

## Goal

Replace LoadSaathi's placeholders (`₹9/tonne-km` flat fallback in the UI, vague "% of shipment value" page) with a real India pricing model that:

1. Uses **per-km rates per vehicle class** (TruckGuru-style), not per-tonne-km flat.
2. Links rates to **live diesel price** (Odisha `fuel_prices` table) with the industry-standard **0.65% fuel surcharge per ₹1 diesel rise over base ₹95.20**.
3. Splits **FTL** (per-km, full truck) from **PTL** (per-kg, chargeable weight with volumetric rule) — two different businesses.
4. Applies a **return-leg factor** when no return load is likely (interior Odisha/Jharkhand 1.5x; Rourkela↔Bhubaneswar 1.2x).
5. Publishes a **transparent per-km rate card** the UI can display, with source citations (CRISIL, TruckGuru, IOCL).
6. Removes the **Coming soon** escrow badge or replaces it with a real launch date.
7. Updates the public pricing page (`/pricing`) to use the new "₹199 base + 1.5–3% per transaction" model, broker comparison to "8–15%" with citation, and adds GST/toll/detention/cancellation disclosure.

Constraint: **Do not break the working app.** All existing call sites (`FareCalculator.tsx`, `FreightRateCalculator.tsx`, `TransportCostCalculator.tsx`, `usePricePrediction.ts`, `price-predict/index.ts`) must keep working with backwards-compatible response shapes.

## Current State (Verified from Code)

| Component | Status | Gap |
|---|---|---|
| `supabase/functions/price-predict/index.ts` | Live, V2 engine: history + AI blend + corridor + seasonal + 7 vehicle config rows | No fuel surcharge, no return-leg factor, no PTL/FTL split |
| `supabase/functions/price-predict/pricing.ts` | Pure helpers, 257-line Deno test suite | Tests pass; no fuel/return logic |
| `supabase/migrations/20260801_pricing_engine_v2.sql` | Tables exist: `pricing_config`, `corridor_multipliers`, `seasonal_multipliers`, `pricing_flags` | `pricing_config` rates (₹14–28/km) don't match cited TruckGuru market data (₹26–91/km); no `fuel_prices` table here, only in `FULL_REPAIR.sql` |
| `supabase/FULL_REPAIR.sql` | Defines `fuel_prices` table + RLS | Schema is correct but **no row inserts, no cron, no API call site** |
| `supabase/src/pages/public/FareCalculator.tsx:110–114` | Hardcoded `baseRatePerTonne = 9` fallback | **Must remove** — inaccurate and visible to users |
| `supabase/src/pages/public/tools/FreightRateCalculator.tsx` | Has UI inputs (PTL/LTL/FTL, truck type, weight) | **Inputs ignored** — only sends weightTonnes to edge function |
| `supabase/src/pages/public/tools/TransportCostCalculator.tsx` | Thin wrapper | Already fine |
| `supabase/src/hooks/usePricePrediction.ts` | TanStack Query wrapper | Already fine, just consumes new fields |
| `supabase/src/pages/public/Pricing.tsx` | Marketing page with "3–5%" / "2–4%" / "10–20%" | All three numbers need updating (per market research) |
| `docs/How to Implement Accurate Pricing in India for Apps/pricing.ts` | Reference/scratch file | **Do not use** — outside `supabase/`, not deployed |

## Out of Scope (Explicitly)

- 145-truck master JSON (the user's research mentions one). We are not creating it in this plan. The V2 engine stays at the 7 vehicle-class buckets; if leadership later wants 145 rows, that's a follow-up data migration.
- FASTag/IOCL fuel-card partnership (BlackBuck-style GTV play). Requires partnerships we don't have.
- NHAI live toll API. We use per-km toll estimates from vehicle class.
- EV pricing differential. Add later if EV loads appear in volume.
- Rewriting `usePricePrediction.ts` signature. The response shape stays the same; we only add new optional fields.
- Removing the duplicate `FreightRateCalculator.tsx` and `TransportCostCalculator.tsx` pages. Out of scope; SEO consolidation is a separate task per `Blogs/2/LoadSaathi SEO Content System & Publishing Plan.md` (redirects planned separately).

## Data Decisions (Require User Sign-Off)

| # | Question | Default Proposal (use unless user overrides) |
|---|---|---|
| 1 | Final shipper fee structure | `₹199 base + 1.5–3% per transaction` (was 3–5% pure %) |
| 2 | Final trucker fee | `1.5–2.5%` with credit-score tiers: 300–599→2.5%, 600–699→2.0%, 700–799→1.7%, 800–900→1.5% |
| 3 | GST treatment | `+18% IGST on platform fee, billed separately` (industry standard) |
| 4 | Escrow launch | Remove "Coming soon" badge entirely unless a real Q4 2026 launch date is supplied; if a date is supplied, replace badge with that date |
| 5 | Toll policy | `Pass-through at actuals (NHAI rates)`, estimated ₹/km per vehicle class until live integration |
| 6 | Detention policy | `3 hours free loading, then ₹500/hr for LCV / ₹1000/hr for HCV` |
| 7 | Cancellation policy | `<24h before pickup: 50% of booking; <6h: 75%; after dispatch: 100%` |
| 8 | Enterprise threshold | `50+ loads/month, flat 1% shipper + 1% trucker, net-30 terms, API access` |
| 9 | Broker comparison | Update to `8–15% (CRISIL 2024, industry estimates)` |
| 10 | Base diesel for surcharge | `₹95.20 (Delhi RSP, 1 Sept 2026, from PRICING_DATA in docs/pricing.ts)` |

## Affected Files

### Database (SQL migration)
- `supabase/migrations/<date>_accurate_pricing_v3.sql` (NEW) — vehicle-class rate update, fuel prices seed, return-leg config, surcharge config, RLS

### Edge Function
- `supabase/functions/price-predict/pricing.ts` — add `applyFuelSurcharge()`, `getReturnFactor()`, `calculatePtl()`, helper to load fuel price
- `supabase/functions/price-predict/index.ts` — wire fuel surcharge into final price, add `vehicleClass` request field, add PTL/FTL split, return new optional fields (`fuelSurcharge`, `returnFactor`, `perKmRate`, `breakdown`)
- `supabase/functions/price-predict/pricing_test.ts` — add tests for new helpers
- `supabase/functions/fetch-diesel-price/` (NEW) — daily cron edge function that hits IOCL/dieselprice.in, writes to `fuel_prices` table
- `supabase/functions/_shared/fuel.ts` (NEW) — shared helper to read latest fuel price by state

### Frontend
- `supabase/src/pages/public/FareCalculator.tsx` — remove `₹9/tonne-km` fallback, replace with `useFuelPrice` query + FTL/PTL toggle UI, show breakdown panel (Fuel + Toll + Driver + Return + Surcharge)
- `supabase/src/pages/public/tools/FreightRateCalculator.tsx` — wire existing `truckType` + `shipmentType` inputs into the request body, show per-km rate from response
- `supabase/src/hooks/useFuelPrice.ts` (NEW) — TanStack Query, reads `fuel_prices` via REST
- `supabase/src/components/VehicleRateCard.tsx` (NEW) — reusable per-km rate card, populated from `pricing_config`, shown on `/fare-calculator`, `/pricing`, and the commercial pages
- `supabase/src/pages/public/Pricing.tsx` — update fee %ages, broker comparison, add disclosure sections (GST, toll, detention, cancellation, escrow status), update JSON-LD

### Marketing / SEO
- `public/pricing.md` — mirror new numbers
- `public/llms.txt` — refresh pricing summary
- `.agents/product-marketing.md` — refresh Pricing section

## Implementation Steps (Ordered)

### Phase 1 — Data (no UI changes, no risk)

1. **Migration** `supabase/migrations/<date>_accurate_pricing_v3.sql`:
   - UPDATE `pricing_config` rates to match TruckGuru/CRISIL benchmarks (per km, not per tonne). New rates and capacity rows (sample numbers, **user must confirm**):
     - `mini_truck` (0.75T, Tata Ace) → rate_per_km 26, min 1500, max 4500
     - `pickup` (1.5T, Bolero/Bada Dost) → 28, 1800, 5500
     - `14ft` (5T, Eicher Pro 2049) → 32, 2500, 7500
     - `17ft` (7T, Eicher Pro 3015) → 40, 3500, 10000
     - `22ft` (12T, LPT 1613) → 52, 5000, 14000
     - `container` (16T, Signa) → 68, 7000, 18000
     - `trailer` (25T, Prima) → 82, 9000, 24000
   - Add `pricing_surcharge_config` table: `base_diesel_price numeric (default 95.20)`, `surcharge_per_rupee numeric (default 0.0065)`, `base_diesel_date date`. RLS: read by authenticated, write by service_role.
   - Add `route_return_factor` table: `origin_state`, `destination_state`, `factor numeric (1.0–1.5)`, `note`. Seed with Odisha↔Bhubaneswar (1.2), Odisha↔Jharkhand interior (1.4), Rourkela→Raipur (1.3), Jharkhand interior (1.5), etc. RLS same as above.
   - Add columns to `fuel_prices` if missing: `state text NOT NULL`, `diesel_price numeric NOT NULL`, `effective_date date NOT NULL DEFAULT current_date`. Seed Odisha (Rourkela, Bhubaneswar, Cuttack) at ₹101.61 from cited research.
   - Add `pricing_flags` rows: `enable_fuel_surcharge=true`, `enable_return_factor=true`.
   - All new tables get RLS: SELECT to authenticated, ALL to service_role. Same pattern as existing `pricing_config` RLS.

2. **`fetch-diesel-price` edge function** `supabase/functions/fetch-diesel-price/`:
   - Single endpoint, scheduled via Vercel cron (or Supabase pg_cron — pick the one already used in the repo; check `vercel.json` and `supabase/config.toml`).
   - Hits `https://dieselprice.in/api/v1/state/odisha` (or IOCL PPP daily RSS) and writes one row per district per day to `fuel_prices`.
   - For MVP, hardcode a fallback if the API fails: last-known value + 0.5% buffer. Log to `logger` (the existing `supabase/src/lib/logger.ts` is client-side; use Deno's `console.error` with a `[fuel]` prefix and a `console.table` for the response).
   - Add `Deno.test` smoke test (no external HTTP): ensure schema validation works and at least the fallback path runs without error.

### Phase 2 — Edge Function (still no UI change)

3. **`supabase/functions/price-predict/pricing.ts`** additions:
   - New interface `SurchargeConfig { baseDieselPrice, surchargePerRupee }`.
   - New function `applyFuelSurcharge(basePrice, currentDiesel, cfg)` → returns surcharge amount rounded to nearest ₹10. Pure function, 100% testable.
   - New function `getReturnFactor(originState, destState, routeFactorMap)` → returns numeric factor or 1.4 default.
   - New function `calculatePtl(weightKg, distanceKm, ratePerKg, minCharge)` → returns `{ chargeableKg, freight, perKg }`. Apply volumetric: `volumetricKg = (L*B*H)/6000` (param required).
   - Export these from the existing module. Update `DEFAULT_CONFIG` in-place if rates changed (mirror step 1).

4. **`supabase/functions/price-predict/index.ts`** changes:
   - Load `pricing_surcharge_config` (single row) and current `fuel_prices` for origin state in parallel with existing config load.
   - Read new request fields: `vehicleClass?`, `shipmentMode?: 'ptl' | 'ftl'`, `dimensions?: {l,b,h}`, `includeFuelSurcharge?: boolean`.
   - In `localFallback` (Tier 2, distance + vehicleConfig branch): compute `perKmRate = vehicleConfig.rate_per_km`, then:
     - FTL: `distance * perKmRate * returnFactor`, optionally add `applyFuelSurcharge(...)`.
     - PTL: `calculatePtl(weight*1000, distance, ratePerKg, minPrice)` with `ratePerKg = perKmRate / avgCapacityTonnes / 100`.
   - In Tier 1 (history median branch): keep historical per-tonne as-is, but still apply surcharge and return factor.
   - In Tier 4 (weight tiers): leave unchanged (this tier is the absolute fallback when no other data exists).
   - Return new optional fields: `fuelSurcharge`, `returnFactor`, `perKmRate`, `breakdown` (object with fuel, toll, driver, baseFreight).
   - Backwards-compat: all new fields are additive. Existing callers (UIs) keep working.

5. **`supabase/functions/price-predict/pricing_test.ts`** additions:
   - `applyFuelSurcharge` — base ₹20,000, diesel ₹95.20 → 0 surcharge. Diesel ₹101.61 → ~₹834. Diesel ₹110 → ~₹1,920.
   - `getReturnFactor` — known state pair returns seeded value, unknown returns 1.4.
   - `calculatePtl` — 400kg, 320km → checks chargeable weight, freight, min charge floor.
   - All existing tests must still pass.

6. **Deploy** edge function: `supabase functions deploy price-predict` (verify command from `package.json` scripts — if not present, add it).

### Phase 3 — Frontend (UI changes, can ship behind a feature flag if risk-averse)

7. **`supabase/src/hooks/useFuelPrice.ts`** (NEW):
   - TanStack Query, `queryKey: ['fuel', originState]`, fetches `https://<supabase>/rest/v1/fuel_prices?state=eq.<state>&order=effective_date.desc&limit=1` with anon key.
   - Returns `{ dieselPrice, effectiveDate, isStale }` (stale if >7 days old).

8. **`supabase/src/components/VehicleRateCard.tsx`** (NEW):
   - Server-rendered from `pricing_config` (read at build time via a small script, or fetched at runtime). For MVP, hardcode the 7 classes with a `// synced from supabase/pricing_config` comment and a `useEffect` refetch.
   - Props: `originState?` (default Odisha), `compact?` (boolean — sidebar vs full table).
   - Shows: vehicle class, capacity, rate/km range, min/max, last-updated date.

9. **`supabase/src/pages/public/FareCalculator.tsx`**:
   - **Remove** the `₹9/tonne-km` block at lines 107–142 entirely.
   - Replace the fallback with: "We're having trouble fetching live rates. Try again, or [contact us] for a manual quote." No fake numbers.
   - **Add** to UI: FTL/PTL toggle, vehicle class select, dimensions inputs (L×B×H cm) for PTL, diesel price badge in the hero ("Live diesel: Odisha ₹101.61 from IOCL, 4 Sept 2026").
   - **Add** breakdown panel below result: Fuel cost, Toll estimate, Driver bhatta, Return adjustment, Surcharge, Base + commission + GST.
   - **Add** the `VehicleRateCard` component at the bottom of the page.
   - All existing PostHog `fare_estimated` and `trackEstimateGenerated` events must still fire — keep the calls; add new properties `shipmentMode`, `vehicleClass`, `perKmRate`.

10. **`supabase/src/pages/public/tools/FreightRateCalculator.tsx`**:
    - Wire `truckType` → `vehicleClass` in the request body.
    - Wire `shipmentType` → `shipmentMode` in the request body.
    - Add a "per km rate" line in the result card (use new `perKmRate` from response).
    - Show vehicle recommendation with capacity in tonnes, not just a name.

11. **`supabase/src/pages/public/tools/TransportCostCalculator.tsx`**:
    - No functional change. Optionally add the diesel badge in the hero. Skip if it bloats the page.

12. **Verification before shipping Phase 3**:
    - `pnpm run typecheck`
    - `pnpm run lint`
    - `pnpm run build`
    - Manual smoke: open `/fare-calculator?from=Rourkela&to=Bhubaneswar` and check the breakdown appears with non-zero values.

### Phase 4 — Marketing Page and Machine-Readable Files

13. **`supabase/src/pages/public/Pricing.tsx`**:
    - Update headline fees: `₹199 base + 1.5–3%` (was 3–5%).
    - Update trucker fee to `1.5–2.5%` with credit-score tier table.
    - Update broker comparison to `8–15% (CRISIL 2024 industry estimates)`.
    - Add sections: "Toll policy", "Detention policy", "Cancellation policy", "GST treatment", "Enterprise terms".
    - Remove "Coming soon" on Escrow unless a real launch date is supplied.
    - Update JSON-LD `Product.offers` accordingly.

14. **`public/pricing.md`**:
    - Mirror the new fees, policies, comparison, and source citations.

15. **`public/llms.txt`** and **`.agents/product-marketing.md`**:
    - Refresh the pricing summary so the AI bots and your internal product context stay consistent with the page.

## Validation Checklist

- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run lint` passes
- [ ] `pnpm run build` passes
- [ ] `supabase functions deploy price-predict` succeeds
- [ ] `deno test supabase/functions/price-predict/pricing_test.ts` passes
- [ ] Manual: `/fare-calculator?from=Rourkela&to=Bhubaneswar&weight=5` shows:
  - Distance ≥ 300 km (OSRM)
  - Recommended price in the range ₹20,000–₹25,000 (was ₹14,000 from the broken formula)
  - Breakdown panel visible with all rows
  - Diesel badge with current Odisha price
- [ ] Manual: post a real shipment on `/shipper/PostShipments` and confirm the price still resolves
- [ ] Manual: confirm `usePricePrediction` hook returns `data.recommendedPrice` for the dashboard if used there
- [ ] No console errors on the calculator pages

## Risk and Rollback

| Risk | Mitigation |
|---|---|
| Migration updates break existing `pricing_config` consumers (admin panels, edge function) | All new columns are additive on `fuel_prices`; `pricing_config` UPDATE only changes values, not schema. Wrap migration in a single transactional file; test locally first via `supabase db reset`. |
| Edge function changes return shape and break UIs | New fields are optional. UI reads them defensively (`data.fuelSurcharge ?? 0`). |
| Daily cron API (dieselprice.in) is rate-limited or down | Fallback path uses last-known price. Function logs the failure. UI shows "stale" badge if data is >7 days old. |
| User disagrees with proposed fee %ages | Step 1 has a "Default Proposal" column. Pause after Phase 1 to get finance sign-off, then resume. |
| Tax/GST law interpretation error | Mark GST section with disclaimer "Indicative; consult your tax advisor for invoice-level compliance." Add the same disclaimer in `/pricing`. |

If anything fails in production post-deploy: `supabase functions deploy price-predict --no-verify` with a revert to the prior index.ts is the fastest rollback. Keep the prior `index.ts` content in git history.

## Open Questions (Block Phase 1 sign-off)

1. Confirm the 7 vehicle-class rates in step 1 match what finance/leadership has approved.
2. Confirm the broker comparison "8–15%" and the citation wording.
3. Confirm the GST treatment (separate line vs inclusive).
4. Confirm Escrow launch date or approve removing the badge.
5. Confirm the return-leg factor table seeds (1.2 for Rourkela↔Bhubaneswar, 1.4–1.5 for interior).
6. Approve the daily cron source (dieselprice.in vs IOCL RSS vs manual).
7. Approve the deployment sequence (Phase 1+2 first, monitor 48h, then Phase 3+4).

## Execution Order for Implementation Agent

1. Resolve the 7 open questions with the user.
2. Write the migration `accurate_pricing_v3.sql`. Apply to a local Supabase instance and verify with `psql` or Supabase Studio.
3. Build `fetch-diesel-price` edge function + cron schedule. Verify the row lands in `fuel_prices`.
4. Update `pricing.ts` + `index.ts` + `pricing_test.ts`. Run `deno test`. Deploy to staging.
5. Smoke test the deployed edge function with `curl` against `https://<project>.supabase.co/functions/v1/price-predict` using a real route (Rourkela→Bhubaneswar, 5T). Confirm new fields in response.
6. Build `useFuelPrice` hook + `VehicleRateCard` component.
7. Refactor `FareCalculator.tsx`, `FreightRateCalculator.tsx`, `TransportCostCalculator.tsx`.
8. Update `Pricing.tsx`, `pricing.md`, `llms.txt`, `product-marketing.md`.
9. Run full validation checklist. Ship.
