import { Phone, AlertTriangle, X, Navigation, Clock, Package, User, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TruckLocation } from '@/components/maps/TruckMarker';
import type { LoadLocation } from '@/components/maps/LoadMarker';
import PredictiveETA from './PredictiveETA';

interface TripDetailPanelProps {
  selectedTruck: TruckLocation | null;
  selectedLoad: LoadLocation | null;
  onClose: () => void;
  onContact?: (id: string) => void;
  onFlag?: (id: string) => void;
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all', color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function TripDetailPanel({
  selectedTruck,
  selectedLoad,
  onClose,
  onContact,
  onFlag,
}: TripDetailPanelProps) {
  if (!selectedTruck && !selectedLoad) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-[10000] w-full sm:w-96 bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
        <h2 className="font-semibold text-sm text-slate-100">
          {selectedTruck ? 'Truck Details' : 'Load Details'}
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 text-slate-400 hover:text-white">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedTruck && (
          <>
            {/* Driver Info */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <User className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-100">{selectedTruck.driver_name || 'Unknown Driver'}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  {selectedTruck.vehicle_type || 'Unknown vehicle'}
                  {selectedTruck.available_capacity_tonnes != null &&
                    ` • ${selectedTruck.available_capacity_tonnes}T`}
                </p>
              </div>
            </div>

            {/* Trip Progress */}
            {selectedTruck.origin_city && selectedTruck.destination_city && (
              <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Navigation className="h-3 w-3" /> Route
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-slate-200">{selectedTruck.origin_city}</span>
                  <div className="flex-1">
                    <ProgressBar value={35} max={100} color="bg-orange-500" />
                  </div>
                  <span className="font-medium text-slate-200">{selectedTruck.destination_city}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Updated {formatTimeAgo(selectedTruck.last_seen_at)}
                  </span>
                  {selectedTruck.speed != null && selectedTruck.speed > 0 && (
                    <span>{Math.round(selectedTruck.speed * 3.6)} km/h</span>
                  )}
                </div>
              </div>
            )}

            {/* Predictive ETA */}
            {selectedTruck.origin_city && selectedTruck.destination_city && (
              <PredictiveETA truck={selectedTruck} />
            )}

            {/* Status */}
            <div className="flex gap-2">
              <Badge
                variant={selectedTruck.trip_status === 'in_transit' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {selectedTruck.trip_status === 'in_transit' ? 'IN TRANSIT' : 'IDLE'}
              </Badge>
              {selectedTruck.trip_id && (
                <Badge variant="outline" className="text-xs">
                  Trip Active
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onContact?.(selectedTruck.driver_id)}
              >
                <Phone className="h-3.5 w-3.5 mr-1" /> Contact
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onFlag?.(selectedTruck.driver_id)}
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Flag
              </Button>
            </div>
          </>
        )}

        {selectedLoad && (
          <>
            {/* Load Info */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-100">
                  {selectedLoad.origin_city} → {selectedLoad.dest_city}
                </p>
                <p className="text-xs text-slate-400">
                  {selectedLoad.weight_tonnes != null && `${selectedLoad.weight_tonnes}T`}
                  {selectedLoad.budget_per_tonne != null &&
                    ` • ₹${selectedLoad.budget_per_tonne.toLocaleString('en-IN')}/T`}
                </p>
              </div>
            </div>

            {/* Goods Description */}
            {selectedLoad.goods_description && (
              <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                  Goods
                </p>
                <p className="text-sm text-slate-200">{selectedLoad.goods_description}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onFlag?.(selectedLoad.id)}
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Flag Issue
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
