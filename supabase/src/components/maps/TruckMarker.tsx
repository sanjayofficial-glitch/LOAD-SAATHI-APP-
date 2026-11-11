import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { truckerIcon, onTripIcon, selectedTruckerIcon, selectedOnTripIcon } from './icons';

import { isTruckInTransit, formatTimeAgo, type TruckLocation } from './TruckMarker.utils';

interface TruckMarkerProps {
  truck: TruckLocation;
  onClick?: (truck: TruckLocation) => void;
  selected?: boolean;
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
