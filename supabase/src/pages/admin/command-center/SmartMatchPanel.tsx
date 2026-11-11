import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TruckLocation } from '@/components/maps/TruckMarker.utils';
import type { LoadLocation } from '@/components/maps/LoadMarker';

interface SmartMatchPanelProps {
  trucks: TruckLocation[];
  loads: LoadLocation[];
  /** Open the load so an operator can review the pairing. */
  onReview?: (load: LoadLocation) => void;
}

export interface MatchSuggestion {
  truck: TruckLocation;
  load: LoadLocation;
  score: number;
  reasons: string[];
}

/** Scored truck↔load pairings — shared by the panel and the Quick Actions auto-match. */
// eslint-disable-next-line react-refresh/only-export-components -- pure helper, not a component
export function computeMatches(trucks: TruckLocation[], loads: LoadLocation[]): MatchSuggestion[] {
  const suggestions: MatchSuggestion[] = [];

  for (const truck of trucks) {
    if (truck.trip_id) continue; // Already on a trip

    for (const load of loads) {
      let score = 0;
      const reasons: string[] = [];

      // Vehicle type compatibility
      if (truck.vehicle_type && load.weight_tonnes) {
        const truckCapacity = parseCapacity(truck.vehicle_type);
        if (truckCapacity && truckCapacity >= load.weight_tonnes) {
          score += 30;
          reasons.push(`Capacity fit: ${truck.vehicle_type}`);
        }
      }

      // City proximity (same origin city)
      if (
        truck.origin_city &&
        load.origin_city &&
        truck.origin_city.toLowerCase() === load.origin_city.toLowerCase()
      ) {
        score += 25;
        reasons.push(`Same origin: ${load.origin_city}`);
      }

      // Destination overlap
      if (
        truck.destination_city &&
        load.dest_city &&
        truck.destination_city.toLowerCase() === load.dest_city.toLowerCase()
      ) {
        score += 20;
        reasons.push(`Same destination: ${load.dest_city}`);
      }

      // Budget compatibility
      if (load.budget_per_tonne && truck.available_capacity_tonnes) {
        score += 15;
        reasons.push(`Budget: ₹${load.budget_per_tonne}/T`);
      }

      if (score > 30) {
        suggestions.push({ truck, load, score, reasons });
      }
    }
  }

  return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
}

function parseCapacity(vehicleType: string): number | null {
  const match = vehicleType.match(/(\d+)\s*MT/i);
  if (!match || !match[1]) return null;
  return parseInt(match[1], 10);
}

export default function SmartMatchPanel({ trucks, loads, onReview }: SmartMatchPanelProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const suggestions = computeMatches(trucks, loads).filter(
    (s) => !dismissed.has(`${s.truck.driver_id}-${s.load.id}`),
  );

  if (suggestions.length === 0) {
    return (
      <p className="text-[11px] text-gray-400 py-2 text-center">
        No strong matches right now.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {suggestions.map((s) => (
        <div
          key={`${s.truck.driver_id}-${s.load.id}`}
          className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate text-gray-800">
              {s.truck.driver_name || 'Truck'} · {s.load.origin_city} → {s.load.dest_city}
            </p>
            <p className="text-[10px] text-gray-500 truncate">{s.reasons.slice(0, 2).join(' • ')}</p>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] shrink-0 ${
              s.score >= 70
                ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                : s.score >= 50
                  ? 'border-amber-200 text-amber-700 bg-amber-50'
                  : 'border-gray-200 text-gray-600'
            }`}
          >
            {s.score}%
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 shrink-0 text-gray-400"
            aria-label="Dismiss match"
            onClick={() => setDismissed((prev) => new Set(prev).add(`${s.truck.driver_id}-${s.load.id}`))}
          >
            ×
          </Button>
          <Button
            size="sm"
            className="h-6 px-2 text-[10px] shrink-0"
            onClick={() => onReview?.(s.load)}
          >
            <ArrowRight className="h-3 w-3 mr-0.5" /> Review
          </Button>
        </div>
      ))}
    </div>
  );
}
