import { Leaf } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateEmissions } from '@/utils/emissions';

interface EmissionsCardProps {
  distanceKm?: number | null;
  vehicleType?: string | null;
  loadTonnes?: number | null;
  compact?: boolean;
}

export default function EmissionsCard({
  distanceKm,
  vehicleType,
  loadTonnes,
  compact = false,
}: EmissionsCardProps) {
  const emissions = calculateEmissions({
    distanceKm: distanceKm ?? 0,
    vehicleType,
    loadTonnes,
  });

  return (
    <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
      <CardHeader className={compact ? 'p-4 pb-2' : 'pb-3'}>
        <CardTitle className="flex items-center gap-2 text-base text-emerald-800 dark:text-emerald-300">
          <Leaf className="h-4 w-4" /> Carbon estimate
        </CardTitle>
      </CardHeader>
      <CardContent className={compact ? 'p-4 pt-0' : ''}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
              {emissions.totalKg.toLocaleString()} kg
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">CO₂e for this route</p>
          </div>
          <div className="text-right text-xs text-emerald-700 dark:text-emerald-400">
            <p>{emissions.distanceKm.toLocaleString()} km</p>
            <p className="capitalize">{emissions.vehicleClass}-duty vehicle</p>
            {emissions.intensityKgPerTonneKm !== null && <p>{emissions.intensityKgPerTonneKm} kg / tonne-km</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
