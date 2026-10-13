import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, Navigation } from 'lucide-react';
import MapControls, { type MapFilters } from '@/components/MapControls';
import ZoomControls, { fitPositionsToBounds } from '@/components/maps/ZoomControls';
import TileLayerSwitcher, { type TileLayerId, getTileLayer } from '@/components/maps/TileLayerSwitcher';
import { useMapUserInteraction } from '@/components/maps/useMapUserInteraction';
import type { LoadLocation } from '@/components/maps/LoadMarker';
import { cn } from '@/lib/utils';

// ── Leaflet icon fix for Vite ────────────────────────────────────────────────
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Custom icons ─────────────────────────────────────────────────────────────
const truckerIcon = new L.DivIcon({
  className: 'trucker-marker',
  html: `<div style="position:relative;width:28px;height:28px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(249,115,22,0.25);animation:pulse-ring 2s ease-out infinite;"></div>
    <div style="position:absolute;inset:4px;border-radius:50%;background:#f97316;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(249,115,22,0.6);">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
    </div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const shipperIcon = new L.DivIcon({
  className: 'shipper-marker',
  html: `<div style="position:relative;width:28px;height:28px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.25);animation:pulse-ring 2s ease-out infinite;"></div>
    <div style="position:absolute;inset:4px;border-radius:50%;background:#3b82f6;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(59,130,246,0.6);">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
    </div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const onTripIcon = new L.DivIcon({
  className: 'ontrip-marker',
  html: `<div style="position:relative;width:32px;height:32px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(34,197,94,0.2);animation:pulse-ring 1.5s ease-out infinite;"></div>
    <div style="position:absolute;inset:2px;border-radius:50%;background:#22c55e;display:flex;align-items:center;justify-content:center;box-shadow:0 0 16px rgba(34,197,94,0.6);border:2px solid rgba(255,255,255,0.3);">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    </div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const originIcon = new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png', iconSize: [20, 20], iconAnchor: [10, 10] });
const destIcon = new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/3233/3233005.png', iconSize: [20, 20], iconAnchor: [10, 20] });

// Business / load pin — a shipper's posted load placed at their address
const loadIcon = new L.DivIcon({
  className: 'load-marker',
  html: `<div style="position:relative;width:28px;height:28px;">
    <div style="position:absolute;inset:0;border-radius:8px;background:rgba(59,130,246,0.25);"></div>
    <div style="position:absolute;inset:3px;border-radius:6px;background:#2563eb;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(59,130,246,0.55);border:1px solid rgba(255,255,255,0.35);">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
    </div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// ── City coordinate cache (Odisha/East India focus) ─────────────────────────
const coordCache: Record<string, [number, number]> = {
  'rourkela': [22.2604, 84.8536],
  'ranchi': [23.3441, 85.3096],
  'burdwan': [23.2324, 87.8625],
  'bhubaneswar': [20.2961, 85.8245],
  'cuttack': [20.4625, 85.8830],
  'sambalpur': [21.4704, 83.9700],
  'jamshedpur': [22.8046, 86.2029],
  'dhanbad': [23.7957, 86.4304],
  'bokaro': [23.6693, 86.1511],
  'hazaribagh': [23.9925, 85.3633],
  'daltonganj': [23.9933, 84.0722],
  'raipur': [21.2514, 81.6296],
  'bilaspur': [22.0797, 82.1409],
  'patna': [25.5941, 85.1376],
  'gaya': [24.7963, 85.0000],
  'varanasi': [25.3176, 82.9739],
  'kolkata': [22.5726, 88.3639],
  'asansol': [23.6739, 86.9524],
  'siliguri': [26.7271, 88.3953],
  'guwahati': [26.1445, 91.7362],
  'nagpur': [21.1458, 79.0882],
  'jabalpur': [23.1815, 79.9864],
  'delhi': [28.6139, 77.2090],
  'mumbai': [19.0760, 72.8777],
  'bangalore': [12.9716, 77.5946],
  'chennai': [13.0827, 80.2707],
  'pune': [18.5204, 73.8567],
  'hyderabad': [17.3850, 78.4867],
  'ahmedabad': [23.0225, 72.5714],
  'jaipur': [26.9124, 75.7873],
  'lucknow': [26.8467, 80.9462],
  'kanpur': [26.4499, 80.3319],
  'indore': [22.7196, 75.8577],
  'visakhapatnam': [17.6868, 83.2185],
  'vijayawada': [16.5062, 80.6480],
};

async function getCityCoords(city: string): Promise<[number, number] | null> {
  const normalized = city.toLowerCase().trim();
  if (coordCache[normalized]) return coordCache[normalized];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', India')}&format=json&limit=1`,
      { headers: { 'User-Agent': 'LoadSaathi-CommandCenter/1.0' } }
    );
    const data = await res.json();
    if (data?.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      coordCache[normalized] = coords;
      return coords;
    }
  } catch { /* ignore */ }
  return null;
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface UserLocation {
  driver_id: string;
  user_type: 'trucker' | 'shipper';
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  updated_at: string;
  full_name?: string;
  trip_id?: string | null;
  origin_city?: string | null;
  destination_city?: string | null;
}

interface CommandCenterMapProps {
  locations: UserLocation[];
  trips: Array<{
    id: string;
    origin_city: string;
    destination_city: string;
    origin_lat?: number;
    origin_lng?: number;
    destination_lat?: number;
    destination_lng?: number;
    status: string;
    trucker?: { full_name: string };
  }>;
  shipments: Array<{
    id: string;
    origin_city: string;
    destination_city: string;
    origin_lat?: number;
    origin_lng?: number;
    destination_lat?: number;
    destination_lng?: number;
    status: string;
    shipper?: { full_name: string };
  }>;
  loads?: LoadLocation[];
  loading?: boolean;
}

// ── Heatmap layer (canvas circles — no external dependency) ─────────────────
function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    if (points.length === 0) return;

    const group = L.layerGroup();
    points.forEach(([lat, lng]) => {
      L.circleMarker([lat, lng], {
        renderer: L.canvas(),
        radius: 22,
        color: 'transparent',
        fillColor: '#f97316',
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(group);

      L.circleMarker([lat, lng], {
        renderer: L.canvas(),
        radius: 14,
        color: 'transparent',
        fillColor: '#f97316',
        fillOpacity: 0.22,
        interactive: false,
      }).addTo(group);

      L.circleMarker([lat, lng], {
        renderer: L.canvas(),
        radius: 7,
        color: 'transparent',
        fillColor: '#fb923c',
        fillOpacity: 0.45,
        interactive: false,
      }).addTo(group);
    });

    group.addTo(map);
    layerRef.current = group;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [points, map]);

  return null;
}

// ── Force Leaflet resize after container stabilizes ──────────────────────────
function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}
function FitBounds({ locations, boundsKey }: { locations: UserLocation[]; boundsKey: string }) {
  const map = useMap();
  const userInteracted = useMapUserInteraction(map);
  useEffect(() => {
    if (locations.length === 0 || userInteracted.current) return;
    const coords: [number, number][] = locations.map((l) => [l.lat, l.lng]);
    fitPositionsToBounds(map, coords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundsKey, map]);
  return null;
}

// ── Main component ───────────────────────────────────────────────────────────
const CommandCenterMap: React.FC<CommandCenterMapProps> = ({
  locations,
  trips,
  shipments,
  loads = [],
  loading = false,
}) => {
  const [filters, setFilters] = useState<MapFilters>({
    showTruckers: true,
    showShippers: true,
    showOnTripOnly: false,
    showHeatmap: false,
    showRoutes: true,
  });
  const [tileLayerId, setTileLayerId] = useState<TileLayerId>('dark');
  const tile = getTileLayer(tileLayerId);

  const [resolvedTrips, setResolvedTrips] = useState<Array<{ id: string; origin: [number, number]; destination: [number, number]; status: string; origin_city: string; destination_city: string; trucker?: { full_name: string } }>>([]);
  const [resolvedShipments, setResolvedShipments] = useState<Array<{ id: string; origin: [number, number]; destination: [number, number]; status: string; origin_city: string; destination_city: string; shipper?: { full_name: string } }>>([]);

  // Resolve trip/shipment coordinates
  useEffect(() => {
    let mounted = true;
    const resolve = async () => {
      const activeTrips = trips.filter(t => t.status !== 'cancelled');
      const activeShipments = shipments.filter(s => s.status !== 'cancelled');

      const resolveItem = async (item: { origin_city: string; destination_city: string; origin_lat?: number; origin_lng?: number; destination_lat?: number; destination_lng?: number }): Promise<{ origin: [number, number]; destination: [number, number]; origin_city: string; destination_city: string } | null> => {
        let origin: [number, number] | null = null;
        let dest: [number, number] | null = null;

        if (item.origin_lat != null && item.origin_lng != null) {
          origin = [item.origin_lat, item.origin_lng];
        } else {
          origin = await getCityCoords(item.origin_city);
        }
        if (item.destination_lat != null && item.destination_lng != null) {
          dest = [item.destination_lat, item.destination_lng];
        } else {
          dest = await getCityCoords(item.destination_city);
        }
        return origin && dest ? { origin, destination: dest, origin_city: item.origin_city, destination_city: item.destination_city } : null;
      };

      const [tripResults, shipmentResults] = await Promise.all([
        Promise.all(activeTrips.map(async (t) => {
          const r = await resolveItem(t);
          return r ? { ...t, ...r } : null;
        })),
        Promise.all(activeShipments.map(async (s) => {
          const r = await resolveItem(s);
          return r ? { ...s, ...r } : null;
        })),
      ]);

      if (mounted) {
        setResolvedTrips(tripResults.filter((x): x is NonNullable<typeof x> => x !== null));
        setResolvedShipments(shipmentResults.filter((x): x is NonNullable<typeof x> => x !== null));
      }
    };
    resolve();
    return () => { mounted = false; };
  }, [trips, shipments]);

  // Filter locations
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      if (!filters.showTruckers && loc.user_type === 'trucker') return false;
      if (!filters.showShippers && loc.user_type === 'shipper') return false;
      if (filters.showOnTripOnly && !loc.trip_id) return false;
      return true;
    });
  }, [locations, filters]);

  // Heatmap points
  const heatPoints = useMemo(() => {
    return filteredLocations.map((loc) => [loc.lat, loc.lng, 1] as [number, number, number]);
  }, [filteredLocations]);

  // All visible points (for the "fit all" zoom button)
  const allPositions = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = filteredLocations.map((loc) => [loc.lat, loc.lng]);
    if (filters.showShippers) {
      loads.forEach((l) => {
        if (l.origin_lat != null && l.origin_lng != null) pts.push([l.origin_lat, l.origin_lng]);
      });
    }
    if (filters.showRoutes) {
      resolvedTrips.forEach((t) => {
        pts.push(t.origin);
        pts.push(t.destination);
      });
      resolvedShipments.forEach((s) => {
        pts.push(s.origin);
        pts.push(s.destination);
      });
    }
    return pts;
  }, [filteredLocations, resolvedTrips, resolvedShipments, loads, filters.showRoutes, filters.showShippers]);

  const fitBoundsKey = useMemo(
    () => filteredLocations.map((l) => l.driver_id).sort().join(','),
    [filteredLocations]
  );

  // Stats
  const onlineCount = locations.length;
  const onTripCount = locations.filter(l => l.trip_id).length;

  // Format time ago
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="absolute inset-0 bg-slate-900 overflow-hidden">
      <MapContainer
        center={[22.5, 84.0]}
        zoom={7}
        className="absolute inset-0"
        style={{ background: '#020617' }}
        scrollWheelZoom
        touchZoom
        zoomControl={false}
      >
        <InvalidateSize />
        <ZoomControls positions={allPositions} />
        <TileLayer
          attribution={tile.attribution}
          url={tile.url}
        />
        {tile.labelsUrl && <TileLayer url={tile.labelsUrl} />}

        {/* Heatmap layer */}
        {filters.showHeatmap && <HeatmapLayer points={heatPoints} />}

        {/* Fit bounds to filtered locations */}
        {filteredLocations.length > 0 && <FitBounds locations={filteredLocations} boundsKey={fitBoundsKey} />}

        {/* User location markers */}
        {filteredLocations.map((loc) => {
          const isOnTrip = !!loc.trip_id;
          const icon = isOnTrip ? onTripIcon : loc.user_type === 'trucker' ? truckerIcon : shipperIcon;

          return (
            <Marker
              key={loc.driver_id}
              position={[loc.lat, loc.lng]}
              icon={icon}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn(
                      'h-2 w-2 rounded-full',
                      isOnTrip ? 'bg-green-500' : loc.user_type === 'trucker' ? 'bg-orange-500' : 'bg-blue-500'
                    )} />
                    <p className="font-bold text-sm text-gray-900">{loc.full_name || 'Unknown'}</p>
                  </div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                    {loc.user_type} {isOnTrip && '• ON TRIP'}
                  </p>
                  {isOnTrip && loc.origin_city && loc.destination_city && (
                    <p className="text-xs text-gray-600 mb-1">
                      📍 {loc.origin_city} → 🏁 {loc.destination_city}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-500 mt-1">
                    {loc.speed != null && <span>Speed: {Math.round(loc.speed * 3.6)} km/h</span>}
                    <span>Seen: {timeAgo(loc.updated_at)}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Business / load pins (shipper's posted address) */}
        {filters.showShippers && loads.map((load) => {
          if (load.origin_lat == null || load.origin_lng == null) return null;
          return (
            <Marker
              key={`load-${load.id}`}
              position={[load.origin_lat, load.origin_lng]}
              icon={loadIcon}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <p className="font-bold text-sm text-gray-900">
                    📦 {load.origin_city} → {load.dest_city}
                  </p>
                  {(load.weight_tonnes != null || load.budget_per_tonne != null) && (
                    <p className="text-xs text-gray-600 mt-1">
                      {load.weight_tonnes != null && `${load.weight_tonnes}T`}
                      {load.weight_tonnes != null && load.budget_per_tonne != null && ' • '}
                      {load.budget_per_tonne != null && `₹${load.budget_per_tonne.toLocaleString('en-IN')}/T`}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold">
                    Business address location
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Route lines for active trips */}
        {filters.showRoutes && resolvedTrips.map(t => (
          <React.Fragment key={`trip-${t.id}`}>
            <Marker position={t.origin} icon={originIcon}>
              <Popup><span className="font-semibold">{t.trucker?.full_name}</span>: {t.origin_city}</Popup>
            </Marker>
            <Marker position={t.destination} icon={destIcon}>
              <Popup>Destination: {t.destination_city}</Popup>
            </Marker>
            <Polyline
              positions={[t.origin, t.destination]}
              pathOptions={{ color: '#f97316', weight: 2, dashArray: '5, 10', opacity: 0.6 }}
            />
          </React.Fragment>
        ))}

        {/* Route lines for active shipments */}
        {filters.showRoutes && resolvedShipments.map(s => (
          <React.Fragment key={`ship-${s.id}`}>
            <Marker position={s.origin} icon={originIcon}>
              <Popup><span className="font-semibold">{s.shipper?.full_name}</span>: {s.origin_city}</Popup>
            </Marker>
            <Marker position={s.destination} icon={destIcon}>
              <Popup>Destination: {s.destination_city}</Popup>
            </Marker>
            <Polyline
              positions={[s.origin, s.destination]}
              pathOptions={{ color: '#3b82f6', weight: 2, dashArray: '5, 10', opacity: 0.5 }}
            />
          </React.Fragment>
        ))}
      </MapContainer>

      {/* Map controls overlay */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        <TileLayerSwitcher currentLayer={tileLayerId} onLayerChange={setTileLayerId} />
        <MapControls
          filters={filters}
          onFilterChange={setFilters}
          onlineCount={onlineCount}
          onTripCount={onTripCount}
        />
      </div>

      {/* Stats bar at bottom-left — pinned to viewport */}
      <div className="fixed bottom-4 left-4 z-[9999] flex items-center gap-3">
        <div className="bg-slate-950/95 border border-slate-700/60 px-3 py-1.5 rounded-lg backdrop-blur-md shadow-2xl flex items-center gap-2">
          <Navigation className="h-3 w-3 text-orange-400" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">
            {filteredLocations.length} USERS ON MAP
          </span>
        </div>
        {filters.showHeatmap && (
          <div className="bg-slate-950/95 border border-red-800/60 px-3 py-1.5 rounded-lg backdrop-blur-md shadow-2xl flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-red-400">
              HEATMAP ACTIVE
            </span>
          </div>
        )}
      </div>

      {/* Loading overlay — pinned to viewport */}
      {loading && (
        <div className="fixed bottom-4 right-4 z-[9999] bg-slate-950/95 border border-slate-700/60 px-4 py-2 rounded-full flex items-center gap-3 shadow-2xl">
          <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">
            Syncing positions...
          </span>
        </div>
      )}

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .trucker-marker, .shipper-marker, .ontrip-marker, .load-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
};

export default CommandCenterMap;
