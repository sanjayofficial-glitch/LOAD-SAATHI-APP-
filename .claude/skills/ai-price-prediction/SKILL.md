---
name: ai-price-prediction
description: >-
  AI price prediction with market data for logistics. Use when suggesting prices
  for shipments or trips, analyzing market rates, or building pricing tools.
  Triggers: price prediction, AI pricing, market rate suggestion, freight pricing.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# AI Price Prediction

AI-powered price prediction system that suggests market rates based on route, weight, vehicle type, and historical data.

## Key Files

- `src/hooks/usePricePrediction.ts` — React Query hook with debounced input, Clerk JWT auth
- `src/components/PricePredictor.tsx` — UI component showing recommended price, range, trend

## Pattern

### Hook
```tsx
const { data, isLoading, isError } = usePricePrediction({
  originCity: 'Mumbai',
  destinationCity: 'Delhi',
  weightTonnes: 5,
  vehicleType: '22ft',
});
```
- Debounced input (800ms) to avoid excessive API calls
- Calls Supabase edge function `/functions/v1/price-predict`
- 8-second timeout via AbortSignal
- 5-minute stale time, 1 retry
- Returns: `recommendedPrice`, `range.min/max`, `confidence`, `trend`, `reasoning`, `historicalLoads`, `provider`, `fuelSurcharge`, `breakdown`

### UI Component
```tsx
<PricePredictor
  originCity={origin}
  destinationCity={dest}
  weightTonnes={weight}
  vehicleType={vehicle}
  onApplyPrice={(price) => setPrice(price)}
/>
```
Shows: AI badge with provider, recommended price with range, trend icon, confidence, historical context, reasoning text, Apply button.

## Best Practices

- Only fetch when origin, destination, and weight are valid
- Debounce user input to reduce API load
- Show loading state with "AI analysing market prices..."
- Include provider badge for transparency
- Surface historical data when available