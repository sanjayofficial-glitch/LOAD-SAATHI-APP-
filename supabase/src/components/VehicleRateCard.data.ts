export interface VehicleRate {
  vehicleType: string;
  label: string;
  ratePerKm: number;
  minTonneKm: number;
  maxTonneKm: number;
  capacityTonnes: number;
  source: string;
}

export const VEHICLE_RATES: VehicleRate[] = [
  { vehicleType: 'mini_truck', label: 'Mini Truck (0.75T)', ratePerKm: 26, minTonneKm: 1500, maxTonneKm: 4500, capacityTonnes: 0.75, source: 'TruckGuru Sep 2026' },
  { vehicleType: 'pickup', label: 'Pickup (1.5T)', ratePerKm: 28, minTonneKm: 1800, maxTonneKm: 5500, capacityTonnes: 1.5, source: 'TruckGuru Sep 2026' },
  { vehicleType: '14ft', label: '14ft Truck (5T)', ratePerKm: 32, minTonneKm: 2500, maxTonneKm: 7500, capacityTonnes: 5, source: 'TruckGuru Sep 2026' },
  { vehicleType: '17ft', label: '17ft Truck (7T)', ratePerKm: 40, minTonneKm: 3500, maxTonneKm: 10000, capacityTonnes: 7, source: 'TruckGuru Sep 2026' },
  { vehicleType: '22ft', label: '22ft Truck (12T)', ratePerKm: 52, minTonneKm: 5000, maxTonneKm: 14000, capacityTonnes: 12, source: 'CRISIL Sep 2026' },
  { vehicleType: 'container', label: 'Container Truck (16T)', ratePerKm: 68, minTonneKm: 7000, maxTonneKm: 18000, capacityTonnes: 16, source: 'CRISIL Sep 2026' },
  { vehicleType: 'trailer', label: 'Trailer (25T)', ratePerKm: 82, minTonneKm: 9000, maxTonneKm: 24000, capacityTonnes: 25, source: 'CRISIL Sep 2026' },
];
