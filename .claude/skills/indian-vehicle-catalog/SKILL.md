---
name: indian-vehicle-catalog
description: >-
  Indian commercial vehicle searchable catalog and rate card. Use when building
  vehicle selection for logistics apps, truck type dropdowns, or rate cards.
  Triggers: vehicle select, Indian trucks, commercial vehicles, rate card, emissions calculator.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# Indian Commercial Vehicle Catalog

Searchable dropdown for Indian commercial vehicles with brand grouping, regex-based classification, and rate card data.

## Key Files

- `src/components/VehicleSelect.tsx` — Searchable popover with keyboard navigation
- `src/components/VehicleRateCard.tsx` — Static rate table with ₹/km and capacity
- `src/data/vehicles.ts` — Vehicle catalog data
- `src/utils/emissions.ts` — `getVehicleEmissionClass()` regex patterns

## Pattern

### VehicleSelect Component
```tsx
<VehicleSelect
  value={vehicleType}
  onChange={setVehicleType}
  placeholder="Select Vehicle"
/>
```
Features:
- Searchable combobox with Radix Popover
- Brand-grouped list (Tata, Eicher, Mahindra, etc.)
- Keyboard navigation: ArrowUp/Down, Enter, Escape
- ARIA combobox accessibility
- Legacy value preservation if not in catalog
- Clear button to reset search

### Rate Card Data
```ts
const VEHICLE_RATES = [
  { vehicleType: 'mini_truck', label: 'Mini Truck (0.75T)', ratePerKm: 26, capacityTonnes: 0.75 },
  { vehicleType: 'pickup', label: 'Pickup (1.5T)', ratePerKm: 28, capacityTonnes: 1.5 },
  // ... 22ft, container, trailer
];
```
Sources: TruckGuru, CRISIL benchmarks.

### Emissions Classification
Regex-based `getVehicleEmissionClass(vehicleType)`:
- Heavy: MHCVs, tippers, tractors, trailers
- Medium: Eicher, 407, Furio, Loadking
- Light: ACE, Intra, Jeeto, Bolero, pickup

## Best Practices

- Group vehicles by brand in UI
- Show capacity prominently
- Include source citations for rate data
- Use `isKnownVehicle()` to validate legacy values