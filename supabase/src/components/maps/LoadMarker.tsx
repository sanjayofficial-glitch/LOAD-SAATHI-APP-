import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { shipperIcon } from './icons';

export interface LoadLocation {
  id: string;
  shipper_id: string;
  shipment_id: string | null;
  origin_city: string;
  dest_city: string;
  origin_lat: number | null;
  origin_lng: number | null;
  dest_lat: number | null;
  dest_lng: number | null;
  weight_tonnes: number | null;
  budget_per_tonne: number | null;
  goods_description: string | null;
  status: string;
  created_at: string;
}

interface LoadMarkerProps {
  load: LoadLocation;
  showBothPins?: boolean;
  onClick?: (load: LoadLocation) => void;
}

function formatBudget(amount: number | null): string {
  if (amount == null) return '';
  return `₹${amount.toLocaleString('en-IN')}/T`;
}

export default React.memo(function LoadMarker({ load, showBothPins = false, onClick }: LoadMarkerProps) {
  const hasOrigin = load.origin_lat != null && load.origin_lng != null;
  const hasDest = load.dest_lat != null && load.dest_lng != null;

  if (!hasOrigin) return null;

  return (
    <>
      <Marker
        position={[load.origin_lat!, load.origin_lng!]}
        icon={shipperIcon}
        eventHandlers={{
          click: () => onClick?.(load),
        }}
      >
        <Popup>
          <div className="min-w-[180px]">
            <p className="font-semibold text-sm">
              📦 {load.origin_city} → {load.dest_city}
            </p>
            {load.weight_tonnes != null && (
              <p className="text-xs text-muted-foreground">
                {load.weight_tonnes}T
                {load.budget_per_tonne != null && ` • ${formatBudget(load.budget_per_tonne)}`}
              </p>
            )}
            {load.goods_description && (
              <p className="text-xs text-muted-foreground mt-1">
                {load.goods_description.length > 40
                  ? `${load.goods_description.slice(0, 40)}...`
                  : load.goods_description}
              </p>
            )}
          </div>
        </Popup>
      </Marker>
      {showBothPins && hasDest && (
        <Marker
          position={[load.dest_lat!, load.dest_lng!]}
          icon={shipperIcon}
        />
      )}
    </>
  );
});
