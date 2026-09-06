import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ZoomControls, { fitPositionsToBounds } from "@/components/maps/ZoomControls";
import TileLayerSwitcher, { type TileLayerId, getTileLayer } from "@/components/maps/TileLayerSwitcher";
import { useMapUserInteraction } from "@/components/maps/useMapUserInteraction";
import MapSizeHandler from "@/components/maps/MapSizeHandler";
import MapErrorBoundary from "@/components/MapErrorBoundary";
import { useTheme } from "@/theme/theme";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface TruckLocation {
  id: string;
  driverId: string;
  driverName: string;
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  tripId: string | null;
  originCity: string | null;
  destinationCity: string | null;
  lastUpdated: string;
}

interface LiveMapProps {
  trucks: TruckLocation[];
  className?: string;
  /** Map height. Defaults to a value that fits small phones (~55% of viewport). */
  height?: string;
}

function FitBounds({ trucks, boundsKey }: { trucks: TruckLocation[]; boundsKey: string }) {
  const map = useMap();
  const userInteracted = useMapUserInteraction(map);
  const lastFitKey = useRef("");

  useEffect(() => {
    if (trucks.length === 0 || userInteracted.current) return;
    // Multi-truck maps only re-fit when the *set* of trucks changes so live
    // position pings don't yank the view. A single truck (trip/shipment
    // detail) keeps re-centering so the map follows it — until the user
    // zooms or pans manually.
    if (trucks.length > 1 && lastFitKey.current === boundsKey) return;
    lastFitKey.current = boundsKey;
    const coords: [number, number][] = trucks.map((t) => [t.lat, t.lng]);
    fitPositionsToBounds(map, coords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trucks, map]);
  return null;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--";
  }
}

export default React.memo(function LiveMap({ trucks, className = "", height = "min(500px, 55dvh)" }: LiveMapProps) {
  const { isDark } = useTheme();

  const defaultTileId: TileLayerId = isDark ? 'dark' : 'standard';
  const [tileLayerId, setTileLayerId] = useState<TileLayerId>(defaultTileId);

  useEffect(() => {
    setTileLayerId(isDark ? 'dark' : 'standard');
  }, [isDark]);

  const tile = getTileLayer(tileLayerId);

  const positions = useMemo<[number, number][]>(
    () => trucks.map((t) => [t.lat, t.lng] as [number, number]),
    [trucks]
  );
  const boundsKey = useMemo(() => trucks.map((t) => t.id).sort().join(","), [trucks]);

  return (
    <MapErrorBoundary minHeight={typeof height === 'string' ? height : 'min(500px, 55dvh)'}>
      <div
        className={`relative w-full rounded-lg overflow-hidden border isolate ${className}`}
        style={{ minHeight: 'min(200px, 30vh)', height }}
      >
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: "100%", width: "100%", position: "relative" }}
        scrollWheelZoom
        touchZoom
        zoomControl={false}
      >
        <MapSizeHandler />
        <ZoomControls positions={positions} />
        <TileLayer
          attribution={tile.attribution}
          url={tile.url}
        />
        <FitBounds trucks={trucks} boundsKey={boundsKey} />
        {trucks.map((truck) => (
          <Marker key={truck.id} position={[truck.lat, truck.lng]}>
            <Popup>
              <div>
                <p className="font-semibold">{truck.driverName}</p>
                {truck.originCity && truck.destinationCity && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {truck.originCity} to {truck.destinationCity}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Updated: {formatTime(truck.lastUpdated)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <TileLayerSwitcher currentLayer={tileLayerId} onLayerChange={setTileLayerId} />
    </div>
    </MapErrorBoundary>
  );
});
