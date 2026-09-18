---
name: smart-marketplace-matching
description: >-
  7-factor smart matching algorithm for two-sided marketplace. Use when matching
  shipments to truck trips, scoring relevance, or building marketplace ranking.
  Triggers: smart matching, marketplace scoring, relevance algorithm, two-sided matching,
  match score.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# 7-Factor Smart Matching Algorithm

Complete scoring engine for matching shipments to truck trips in a two-sided logistics marketplace.

## Key Files

- `src/utils/matching.ts` — `calculateMatchScore()`, `getMatchLabel()`, `getAIMatchBadge()`
- `src/hooks/useSmartMatch.ts` — React hook for sequential rate-limited AI scoring

## Scoring Factors (100 points max)

1. **City/State Match** (0-30 pts)
   - Same city: +15 origin + 15 destination
   - Same state fallback: +8 each

2. **Geographic Proximity** (0-25 pts)
   - Haversine distance between origin/destination coordinates
   - <10km: 12.5pts, <50km: 10pts, <150km: 7pts, <300km: 4pts, <500km: 2pts
   - Fallback: redistributes cityStateScore if no coords

3. **Route Overlap** (0-15 pts)
   - Compares shipment route vs trip route using origin/dest distances
   - `15 * (1 - deviation / avgRouteDist)` when deviation < 50% of avg route

4. **Capacity Fit** (0-15 pts)
   - ratio = shipmentWeight / tripCapacity
   - ≤0.3: 15pts, ≤0.5: 12pts, ≤0.75: 8pts, ≤1.0: 5pts

5. **Price Compatibility** (0-10 pts)
   - budget/price ratio ≥1.0: 10pts, ≥0.85: 7pts, ≥0.7: 4pts, else 0

6. **Date Compatibility** (0-5 pts)
   - ≤3 days: 5pts, ≤7 days: 3pts, else 1pt

7. **Trucker Rating Bonus** (0-5 pts)
   - ≥4.5: 5pts, ≥4.0: 3pts, ≥3.5: 1pt

## React Hook Pattern

```tsx
const { scores, loadingId, refetch } = useSmartMatch(items, getParams, maxItems);
```
- Sequential, rate-limited calls to Supabase edge function `/functions/v1/match-ml`
- Debounce guard: 300ms minimum between fetches
- Stale cache: 5 minutes
- Queue-based: processes up to `maxItems` sequentially with 150ms delay between
- Auto-refetches when items list changes

## Best Practices

- Always geocode cities before matching (proximity score requires lat/lng)
- Use `getMatchLabel(score)` for UI badges
- Use `getAIMatchBadge(info)` for AI suggestion display
- Cache results to avoid repeated edge function calls