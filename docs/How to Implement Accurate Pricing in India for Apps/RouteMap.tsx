import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Skeleton } from '@/components/ui/skeleton';
import { routeBetweenCities, type RoadRoute } from '@/services/routing.service';

// Fix Leaflet's default marker icon (broken in Vite builds)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

interface RouteMapProps {
  originCity: string;
  destinationCity: string;
  height?: string;
  onRouteCalculated?: (route: RoadRoute) => void;
}

const RouteMap = ({ originCity, destinationCity, height = '300px', onRouteCalculated }: RouteMapProps) => {
  const [route, setRoute] = useState<RoadRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    routeBetweenCities(originCity, destinationCity).then((result) => {
      if (cancelled) return;
      if (!result) setError(true);
      else {
        setRoute(result);
        onRouteCalculated?.(result);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [originCity, destinationCity, onRouteCalculated]);

  if (loading) return <Skeleton className="w-full rounded-lg" style={{ height }} />;
  if (error || !route || route.geometry.length < 2) {
    return (
      <div className="flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 text-sm" style={{ height }}>
        Route unavailable for these cities
      </div>
    );
  }

  const center: [number, number] = route.geometry[Math.floor(route.geometry.length / 2)];

  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-200" style={{ height }}>
      <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={route.geometry[0]} icon={originIcon}><Popup>🟢 From: {originCity}</Popup></Marker>
        <Marker position={route.geometry[route.geometry.length - 1]} icon={destIcon}><Popup>🔴 To: {destinationCity}</Popup></Marker>
        <Polyline positions={route.geometry} pathOptions={{ color: '#f97316', weight: 4 }} />
      </MapContainer>
      <div className="absolute bottom-2 left-2 z-[1000] rounded-md bg-white/95 px-3 py-2 text-xs shadow">
        <strong>{route.distanceKm.toLocaleString('en-IN')} km</strong> · {Math.floor(route.durationMinutes / 60)}h {route.durationMinutes % 60}m
        {route.source === 'straight-line' && <span className="ml-1 text-amber-700">(fallback estimate)</span>}
      </div>
    </div>
  );
};

export default RouteMap;
