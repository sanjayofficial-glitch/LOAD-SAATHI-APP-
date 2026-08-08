# Smart Matching Algorithm

LoadSaathi's AI matching engine pairs shippers with truckers using a
multi-factor scoring model. The core logic lives in `src/utils/matching.ts` and
is consumed via the `useSmartMatch` hook.

## Scoring Model

Each potential shipper–trucker pair is scored on **7 factors**. The score is
displayed to the user as a match percentage.

| Factor | Points | Condition |
|--------|--------|-----------|
| City match | +20 | Same origin/destination city |
| Proximity | +15 | Within 20 km of the route |
| Route overlap | +20 | Within 10 km of origin/destination |
| Capacity fit | +10 | Cargo weight ≤ truck capacity |
| Price alignment | +10 | Within 20% of budget |
| Date match | +10 | Departure within 3 days |
| Rating bonus | +15 | Trucker rating ≥ 4.5 |

**Maximum possible score:** 100

## How It Works

```
useSmartMatch hook
  → fetch active trips/shipments from Supabase
  → calculateMatchScore() for each potential pair
  → sort results by score descending
  → display match % to user
```

## Factors Explained

### 1. City Match (+20)

If the trip's origin and the shipment's origin share a city (or the
destination cities match), award full points. This is the strongest signal of
a practical match.

### 2. Proximity Score (+15)

Uses the coordinates (lat/lng) computed by geocoding. If the shipment pickup
point is within 20 km of the truck's route, award points.

> **Requires coordinates.** If trips/shipments lack lat/lng, this factor
> contributes 0. Always run geocoding on form submit.

### 3. Route Overlap (+20)

The degree to which the shipment's route overlaps the truck's route. If origin
and destination are both within 10 km of each other's route, full points.

### 4. Capacity Fit (+10)

`cargo weight ≤ truck available_capacity_kg` → full points. Penalized as the
cargo approaches or exceeds capacity.

### 5. Price Alignment (+10)

Compares `budget` (shipper) vs `price_per_kg` (trucker). Within 20% → full
points.

### 6. Date Match (+10)

Departure dates within 3 days of each other → full points.

### 7. Rating Bonus (+15)

Bonus for reliable truckers. `rating ≥ 4.5` → full points. Lower ratings get
proportional credit.

## ML Enhancement (optional)

A machine-learning variant exists at
`supabase/functions/match-ml/index.ts` that logs predictions to the
`ml_match_log` table for offline evaluation. The client-side scoring above is
the primary path; the ML function is used to validate and improve the model
over time.

## Usage in the UI

- **Shipper:** `src/pages/shipper/BrowseTrips.tsx` — shows matched trips with
  match %
- **Trucker:** `src/pages/trucker/BrowseShipments.tsx` — shows matched
  shipments with match %

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Match score always 0% | Trips/shipments missing lat/lng | Ensure geocoding runs on form submit |
| Proximity factor never scores | Coordinates missing | Re-post or backfill coordinates |

See `src/utils/matching.ts` for the reference implementation.
