import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { VEHICLE_RATES } from './VehicleRateCard.data';

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
