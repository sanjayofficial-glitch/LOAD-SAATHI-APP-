import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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

interface VehicleRateCardProps {
  compact?: boolean;
  selectedVehicle?: string;
  showSource?: boolean;
}

export default function VehicleRateCard({
  compact = false,
  selectedVehicle,
  showSource = true,
}: VehicleRateCardProps) {
  const rates = compact ? VEHICLE_RATES.slice(0, 4) : VEHICLE_RATES;

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className={compact ? 'p-4 pb-2' : 'pb-3'}>
        <CardTitle className="text-base font-semibold">
          Vehicle Rate Card (per km)
        </CardTitle>
      </CardHeader>
      <CardContent className={compact ? 'p-4 pt-0' : ''}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="text-left font-medium text-slate-600 dark:text-slate-400 pb-2">Vehicle</th>
                <th className="text-right font-medium text-slate-600 dark:text-slate-400 pb-2">₹/km</th>
                <th className="text-right font-medium text-slate-600 dark:text-slate-400 pb-2">Capacity</th>
                {!compact && showSource && (
                  <th className="text-left font-medium text-slate-600 dark:text-slate-400 pb-2">Source</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <tr
                  key={rate.vehicleType}
                  className={
                    selectedVehicle === rate.vehicleType
                      ? 'bg-slate-100 dark:bg-slate-800/50'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }
                >
                  <td className="py-2 font-medium">{rate.label}</td>
                  <td className="py-2 text-right">{rate.ratePerKm}</td>
                  <td className="py-2 text-right text-slate-600 dark:text-slate-400">
                    {rate.capacityTonnes}T
                  </td>
                  {!compact && showSource && (
                    <td className="py-2 text-xs text-slate-500 dark:text-slate-500">
                      {rate.source}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showSource && !compact && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
            Rates sourced from TruckGuru & CRISIL Sep 2026 benchmarks. Includes return-leg factor, fuel surcharge, and tolls.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
