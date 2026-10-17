import { useState } from 'react';
import { Sparkles, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TruckLocation } from '@/components/maps/TruckMarker';
import type { LoadLocation } from '@/components/maps/LoadMarker';

interface SmartMatchPanelProps {
  trucks: TruckLocation[];
  loads: LoadLocation[];
  onMatch?: (truckId: string, loadId: string) => void;
}

interface MatchSuggestion {
  truck: TruckLocation;
  load: LoadLocation;
  score: number;
  reasons: string[];
}

function computeMatches(trucks: TruckLocation[], loads: LoadLocation[]): MatchSuggestion[] {
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

export default function SmartMatchPanel({ trucks, loads, onMatch }: SmartMatchPanelProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const suggestions = computeMatches(trucks, loads).filter(
    (s) => !dismissed.has(`${s.truck.driver_id}-${s.load.id}`),
  );

  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Smart Matches</h3>
        </div>
        <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
          {suggestions.length}
        </Badge>
      </div>
      <div className="p-2 space-y-1.5 max-h-[240px] overflow-y-auto">
        {suggestions.map((s) => (
          <div
            key={`${s.truck.driver_id}-${s.load.id}`}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-slate-200">
                {s.truck.driver_name || 'Truck'} → {s.load.origin_city} → {s.load.dest_city}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {s.reasons.slice(0, 2).join(' • ')}
              </p>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] shrink-0 ${
                s.score >= 70
                  ? 'border-green-500/30 text-green-500'
                  : s.score >= 50
                    ? 'border-amber-500/30 text-amber-500'
                    : 'border-slate-500/30 text-slate-500'
              }`}
            >
              {s.score}%
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 shrink-0"
              onClick={() => setDismissed((prev) => new Set(prev).add(`${s.truck.driver_id}-${s.load.id}`))}
            >
              ×
            </Button>
            <Button
              size="sm"
              className="h-6 px-2 text-[10px] shrink-0"
              onClick={() => onMatch?.(s.truck.driver_id, s.load.id)}
            >
              <Check className="h-3 w-3 mr-0.5" /> Match
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
