import { X, Navigation, Clock, Package, User, Truck, ExternalLink, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TruckLocation } from '@/components/maps/TruckMarker';
import type { LoadLocation } from '@/components/maps/LoadMarker';
import PredictiveETA from './PredictiveETA';

interface TripDetailPanelProps {
  selectedTruck: TruckLocation | null;
  selectedLoad: LoadLocation | null;
  onClose: () => void;
}

function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function googleMapsDirectionsUrl(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}`;
}

export default function TripDetailPanel({
  selectedTruck,
  selectedLoad,
  onClose,
}: TripDetailPanelProps) {
  if (!selectedTruck && !selectedLoad) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-[10000] w-full sm:w-96 bg-white border-l border-gray-200 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
        <h2 className="font-semibold text-sm text-gray-900">
          {selectedTruck ? 'Truck Details' : 'Load Details'}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Close details"
          onClick={onClose}
          className="h-7 w-7 p-0 text-gray-400 hover:text-gray-900"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedTruck && (
          <>
            {/* Driver Info */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center">
                <User className="h-6 w-6 text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {selectedTruck.driver_name || 'Unknown Driver'}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  {selectedTruck.vehicle_type || 'Unknown vehicle'}
                  {selectedTruck.available_capacity_tonnes != null &&
                    ` • ${selectedTruck.available_capacity_tonnes}T`}
                </p>
              </div>
            </div>

            {/* Route + live status */}
            {selectedTruck.origin_city && selectedTruck.destination_city && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 flex items-center gap-1">
                  <Navigation className="h-3 w-3" /> Route
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-800">{selectedTruck.origin_city}</span>
                  <span className="flex-1 border-t border-dashed border-gray-300" />
                  <span className="font-medium text-gray-800">{selectedTruck.destination_city}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
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

            {/* Actions — real navigation only */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" asChild>
                <a
                  href={googleMapsUrl(selectedTruck.lat, selectedTruck.lng)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin className="h-3.5 w-3.5 mr-1" /> Live location
                </a>
              </Button>
            </div>
          </>
        )}

        {selectedLoad && (
          <>
            {/* Load Info */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {selectedLoad.origin_city} → {selectedLoad.dest_city}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedLoad.weight_tonnes != null && `${selectedLoad.weight_tonnes}T`}
                  {selectedLoad.budget_per_tonne != null &&
                    ` • ₹${selectedLoad.budget_per_tonne.toLocaleString('en-IN')}/T`}
                </p>
              </div>
            </div>

            {/* Goods Description */}
            {selectedLoad.goods_description && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                  Goods
                </p>
                <p className="text-sm text-gray-800">{selectedLoad.goods_description}</p>
              </div>
            )}

            {/* Waiting time */}
            <div className="flex items-center justify-between text-xs text-gray-500 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Posted {formatTimeAgo(selectedLoad.created_at)}
              </span>
              {estimatedValue(selectedLoad) > 0 && (
                <span className="font-semibold text-gray-700">
                  Est. ₹{estimatedValue(selectedLoad).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Actions — real navigation only */}
            <div className="flex gap-2">
              {selectedLoad.origin_lat != null && selectedLoad.origin_lng != null && (
                <Button size="sm" variant="outline" className="flex-1" asChild>
                  <a
                    href={
                      selectedLoad.dest_lat != null && selectedLoad.dest_lng != null
                        ? googleMapsDirectionsUrl(
                            selectedLoad.origin_lat,
                            selectedLoad.origin_lng,
                            selectedLoad.dest_lat,
                            selectedLoad.dest_lng,
                          )
                        : googleMapsUrl(selectedLoad.origin_lat, selectedLoad.origin_lng)
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open route
                  </a>
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function estimatedValue(load: LoadLocation): number {
  if (load.weight_tonnes == null || load.budget_per_tonne == null) return 0;
  return load.weight_tonnes * load.budget_per_tonne;
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
