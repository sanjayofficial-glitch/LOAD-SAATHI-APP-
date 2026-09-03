/**
 * RouteMap — Free map using react-leaflet + OpenStreetMap (no API key needed!)
 * Geocodes city names using Nominatim (free, no signup) and draws the actual
 * OSRM driving route when possible.
 *
 * Usage:
 *   <RouteMap originCity="Mumbai" destinationCity="Delhi" />
 *   <RouteMap originCity="Mumbai" destinationCity="Delhi" 
 *             originLat={19.076} originLng={72.877} 
 *             destLat={28.704} destLng={77.102}
 *             distanceKm={1400} durationMin={1200} />
 */
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Skeleton } from '@/components/ui/skeleton';
import { geocodeCity } from '@/utils/geocode';
import { getRoute, RouteResult } from '@/utils/osrm';
import ZoomControls from '@/components/maps/ZoomControls';
import TileLayerSwitcher, { type TileLayerId, getTileLayer } from '@/components/maps/TileLayerSwitcher';
import { useTheme } from '@/theme/theme';

// Fix Leaflet's default marker icon (broken in Vite builds)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Fix 0×0 map pane: invalidateSize on mount
function MapSizeHandler() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

interface Coords { lat: number; lon: number; }

interface RouteMapProps {
  originCity: string;
  destinationCity: string;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  distanceKm?: number;
  durationMin?: number;
  height?: string;
  interactive?: boolean;
}

const RouteMap = React.memo(({
  originCity,
  destinationCity,
  originLat: propOriginLat,
  originLng: propOriginLng,
  destLat: propDestLat,
  destLng: propDestLng,
  distanceKm: propDistanceKm,
  durationMin: propDurationMin,
  height = '300px',
  interactive = true,
}: RouteMapProps) => {
  const [origin, setOrigin] = useState<Coords | null>(null);
  const [destination, setDestination] = useState<Coords | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { isDark } = useTheme();

  const defaultTileId: TileLayerId = isDark ? 'dark' : 'standard';
  const [tileLayerId, setTileLayerId] = useState<TileLayerId>(defaultTileId);

  useEffect(() => {
    setTileLayerId(isDark ? 'dark' : 'standard');
  }, [isDark]);

  const tile = getTileLayer(tileLayerId);

  const hasPreStoredCoords = propOriginLat !== undefined && propOriginLng !== undefined &&
                             propDestLat !== undefined && propDestLng !== undefined;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const loadMapData = async () => {
      let originCoords: Coords | null = null;
      let destCoords: Coords | null = null;

      if (hasPreStoredCoords) {
        originCoords = { lat: propOriginLat!, lon: propOriginLng! };
        destCoords = { lat: propDestLat!, lon: propDestLng! };
      } else {
        [originCoords, destCoords] = await Promise.all([
          geocodeCity(originCity),
          geocodeCity(destinationCity)
        ]);
      }

      if (cancelled) return;

      if (!originCoords || !destCoords) {
        setError(true);
        setLoading(false);
        return;
      }

      setOrigin(originCoords);
      setDestination(destCoords);

      // Always fetch the OSRM route for accurate geometry display.
      // If we have pre-stored distance/duration, use those for the
      // info bar; otherwise use the freshly computed values.
      const routeResult = await getRoute(
        originCoords.lon, originCoords.lat,
        destCoords.lon, destCoords.lat
      );
      if (!cancelled) setRoute(routeResult);

      if (!cancelled) setLoading(false);
    };

    loadMapData();

    return () => { cancelled = true; };
  }, [originCity, destinationCity, propOriginLat, propOriginLng, propDestLat, propDestLng, hasPreStoredCoords]);

  if (loading) return <Skeleton className="w-full rounded-lg" style={{ height }} />;
  if (error || !origin || !destination) {
    return (
      <div className="flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm" style={{ height }}>
        Map unavailable for these cities
      </div>
    );
  }

  const center: [number, number] = [
    (origin.lat + destination.lat) / 2,
    (origin.lon + destination.lon) / 2,
  ];

  const displayDistanceKm = propDistanceKm || route?.distance_km;
  const displayDurationMin = propDurationMin || route?.duration_min;

  const positions: [number, number][] = [
    [origin.lat, origin.lon],
    [destination.lat, destination.lon],
  ];

  // Note: computed after the loading/error early-returns, so no hooks here.

  return (
    <div>
      <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 isolate" style={{ height }}>
        <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%', position: 'relative' }} scrollWheelZoom={interactive} touchZoom={interactive} dragging={interactive} zoomControl={false}>
          <MapSizeHandler />
          <ZoomControls positions={positions} />
          <TileLayer
            attribution={tile.attribution}
            url={tile.url}
          />
          <Marker position={[origin.lat, origin.lon]} icon={originIcon}>
            <Popup>🟢 From: {originCity}</Popup>
          </Marker>
          <Marker position={[destination.lat, destination.lon]} icon={destIcon}>
            <Popup>🔴 To: {destinationCity}</Popup>
          </Marker>
          {route?.geometry ? (
            <GeoJSON
              key={JSON.stringify(route.geometry)}
              data={route.geometry}
              style={() => ({
                color: '#f97316',
                weight: 3,
                opacity: 0.85,
              })}
            />
          ) : (
            <Polyline
              positions={[
                [origin.lat, origin.lon],
                [destination.lat, destination.lon],
              ]}
              pathOptions={{ color: '#f97316', weight: 3, dashArray: '8, 8' }}
            />
          )}
        </MapContainer>
        <TileLayerSwitcher currentLayer={tileLayerId} onLayerChange={setTileLayerId} />
      </div>
      {displayDistanceKm && displayDurationMin && (
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
          📍 {displayDistanceKm.toLocaleString()} km &nbsp; ⏱ ~{displayDurationMin} min (~{Math.round(displayDurationMin / 60)} hrs)
        </div>
      )}
    </div>
  );
});

export default RouteMap;
