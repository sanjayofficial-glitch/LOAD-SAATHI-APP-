import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import TruckMarker from './TruckMarker';
import type { TruckLocation } from './TruckMarker.utils';
import LoadMarker, { type LoadLocation } from './LoadMarker';
import RoutePolyline from './RoutePolyline';
import MapLegend from './MapLegend';
import ZoomControls, { fitPositionsToBounds } from './ZoomControls';
import TileLayerSwitcher from './TileLayerSwitcher';
import { type TileLayerId, getTileLayer } from './TileLayerSwitcher.data';
import { useMapUserInteraction } from './useMapUserInteraction';
import MapSizeHandler from './MapSizeHandler';
import MapErrorBoundary from '@/components/MapErrorBoundary';
import { myLocationIcon } from './icons';
import { cn } from '@/lib/utils';

// ── Map click events (react-leaflet has no eventHandlers on MapContainer) ────
function MapClickHandler({ onClick }: { onClick?: (e: L.LeafletMouseEvent) => void }) {
  useMapEvents({
    click: (e) => onClick?.(e),
  });
  return null;
}

// ── Auto-fit bounds ──────────────────────────────────────────────────────────
// Only refits when the *set* of trucks/loads changes (boundsKey) so live GPS
// pings that move existing trucks don't re-zoom the map on every update.
// Once the user interacts with the map (drag, wheel, pinch, double-click or
// the zoom buttons) auto-fit hands over control so manual zooming sticks.
function FitBounds({
  positions,
  boundsKey,
}: {
  positions: [number, number][];
  boundsKey: string;
}) {
  const map = useMap();
  const userInteracted = useMapUserInteraction(map);

  useEffect(() => {
    if (positions.length === 0 || userInteracted.current) return;
    fitPositionsToBounds(map, positions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundsKey, map]);
  return null;
}

// ── Default center: India ────────────────────────────────────────────────────
const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

export interface LoadSaathiMapProps {
  trucks?: TruckLocation[];
  loads?: LoadLocation[];
  selectedTruckId?: string;
  selectedLoadId?: string;
  onTruckClick?: (truck: TruckLocation) => void;
  onLoadClick?: (load: LoadLocation) => void;
  /** Viewer's own position — renders a "you are here" marker and radius circle. */
  userLocation?: {
    lat: number;
    lng: number;
    radiusKm?: number;
  };
  showRouteFor?: {
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    color?: string;
  };
  className?: string;
  height?: string;
  showLegend?: boolean;
  showClusters?: boolean;
  center?: [number, number];
  zoom?: number;
  onMapClick?: (e: L.LeafletMouseEvent) => void;
}

export default React.memo(function LoadSaathiMap({
  trucks = [],
  loads = [],
  selectedTruckId,
  onTruckClick,
  onLoadClick,
  userLocation,
  showRouteFor,
  className = '',
  height = '500px',
  showLegend = true,
  showClusters = true,
  center = INDIA_CENTER,
  zoom = DEFAULT_ZOOM,
  onMapClick,
}: LoadSaathiMapProps) {
  // Always open on the keyless OpenStreetMap "Standard" layer. The theme no
  // longer forces the dark basemap (it previously required a now-removed CARTO
  // key); users can still pick Dark/Night/Satellite from the switcher.
  const [tileLayerId, setTileLayerId] = useState<TileLayerId>('standard');

  const tile = getTileLayer(tileLayerId);

  // Compute all positions for bounds fitting (route endpoints are excluded so
  // selecting a truck doesn't re-zoom the map to fit the whole route).
  const allPositions = useMemo(() => {
    const positions: [number, number][] = [];
    if (userLocation?.lat && userLocation?.lng) {
      positions.push([userLocation.lat, userLocation.lng]);
    }
    trucks.forEach((t) => {
      if (t.lat && t.lng) positions.push([t.lat, t.lng]);
    });
    loads.forEach((l) => {
      if (l.origin_lat && l.origin_lng) positions.push([l.origin_lat, l.origin_lng]);
    });
    return positions;
  }, [trucks, loads, userLocation]);

  // Stable key for auto-fit: only the *set* of trucks/loads (ids), so moving
  // markers don't trigger re-fits on every realtime update. The viewer's own
  // position is included so the map centers on them once GPS resolves.
  const boundsKey = useMemo(() => {
    const truckIds = trucks.map((t) => t.driver_id).sort().join(',');
    const loadIds = loads.map((l) => l.id).sort().join(',');
    const userPos = userLocation ? `${userLocation.lat},${userLocation.lng}` : '';
    return `${truckIds}|${loadIds}|${userPos}`;
  }, [trucks, loads, userLocation]);

  const markers = (
    <>
      {userLocation && (
        <>
          {userLocation.radiusKm != null && userLocation.radiusKm > 0 && (
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={userLocation.radiusKm * 1000}
              pathOptions={{
                color: '#2563eb',
                weight: 1.5,
                dashArray: '6 6',
                fillColor: '#2563eb',
                fillOpacity: 0.06,
              }}
            />
          )}
          <Marker position={[userLocation.lat, userLocation.lng]} icon={myLocationIcon}>
            <Popup>
              <p className="text-sm font-semibold">You are here</p>
            </Popup>
          </Marker>
        </>
      )}
      {trucks.map((truck) => (
        <TruckMarker
          key={truck.driver_id}
          truck={truck}
          selected={truck.driver_id === selectedTruckId}
          onClick={onTruckClick}
        />
      ))}
      {loads.map((load) => (
        <LoadMarker
          key={load.id}
          load={load}
          onClick={onLoadClick}
        />
      ))}
      {showRouteFor && (
        <RoutePolyline
          originLat={showRouteFor.originLat}
          originLng={showRouteFor.originLng}
          destLat={showRouteFor.destLat}
          destLng={showRouteFor.destLng}
          color={showRouteFor.color}
        />
      )}
    </>
  );

  return (
    <MapErrorBoundary minHeight={typeof height === 'string' ? height : '500px'}>
      <div
        className={cn('relative w-full rounded-lg overflow-hidden border isolate', className)}
        style={{ minHeight: 'min(200px, 30vh)', height }}
      >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', position: 'relative' }}
        scrollWheelZoom
        touchZoom
        zoomControl={false}
        preferCanvas
      >
        <MapSizeHandler />
        <MapClickHandler onClick={onMapClick} />
        <ZoomControls positions={allPositions} />
        <TileLayer
          attribution={tile.attribution}
          url={tile.url}
        />
        {tile.labelsUrl && <TileLayer url={tile.labelsUrl} />}
        {allPositions.length > 0 && <FitBounds positions={allPositions} boundsKey={boundsKey} />}
        {showClusters ? (
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            spiderfyOnMaxZoom
            showCoverageOnHover={false}
          >
            {markers}
          </MarkerClusterGroup>
        ) : (
          markers
        )}
      </MapContainer>
      {showLegend && (
        <MapLegend
          showTrucks={trucks.length > 0}
          showLoads={loads.length > 0}
        />
      )}
      <TileLayerSwitcher currentLayer={tileLayerId} onLayerChange={setTileLayerId} />
    </div>
    </MapErrorBoundary>
  );
});
