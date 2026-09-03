import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { truckerIcon, onTripIcon, selectedTruckerIcon, selectedOnTripIcon } from './icons';

export interface TruckLocation {
  driver_id: string;
  driver_name?: string;
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  trip_id: string | null;
  origin_city: string | null;
  destination_city: string | null;
  vehicle_type: string | null;
  available_capacity_tonnes: number | null;
  trip_status: string | null;
  last_seen_at: string;
  /**
   * false = synthetic marker (a posted trip placed at its origin city), not a
   * live GPS broadcast. Defaults to live when unset.
   */
  is_live?: boolean;
}

interface TruckMarkerProps {
  truck: TruckLocation;
  onClick?: (truck: TruckLocation) => void;
  selected?: boolean;
}

/** A truck is considered in transit when it has an active trip or live trip context. */
export function isTruckInTransit(truck: TruckLocation): boolean {
  // Posted-trip pins (no live GPS) are standing/available, not confirmed moving.
  if (truck.is_live === false) return false;
  return (
    truck.trip_status === 'in_transit' ||
    (truck.trip_id != null && truck.origin_city != null)
  );
}

export function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default React.memo(function TruckMarker({ truck, onClick, selected = false }: TruckMarkerProps) {
  const isInTransit = isTruckInTransit(truck);
  const icon = selected
    ? isInTransit
      ? selectedOnTripIcon
      : selectedTruckerIcon
    : isInTransit
      ? onTripIcon
      : truckerIcon;

  return (
    <Marker
      position={[truck.lat, truck.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick?.(truck),
      }}
    >
      <Popup>
        <div className="min-w-[180px]">
          <p className="font-semibold text-sm">
            {truck.driver_name || 'Truck'}
          </p>
          {truck.vehicle_type && (
            <p className="text-xs text-muted-foreground">
              {truck.vehicle_type}
              {truck.available_capacity_tonnes != null && ` • ${truck.available_capacity_tonnes}T`}
            </p>
          )}
          {truck.origin_city && truck.destination_city && (
            <p className="text-xs text-muted-foreground mt-1">
              📍 {truck.origin_city} → {truck.destination_city}
            </p>
          )}
          {truck.speed != null && truck.speed > 0 && (
            <p className="text-xs text-muted-foreground">
              🏎️ {Math.round(truck.speed * 3.6)} km/h
            </p>
          )}
          {truck.is_live === false ? (
            <p className="text-xs text-muted-foreground mt-1">
              📡 Posted trip · live GPS not shared
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              🕐 Updated {formatTimeAgo(truck.last_seen_at)}
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
});
