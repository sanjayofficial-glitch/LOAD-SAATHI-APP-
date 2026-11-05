import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';
import type { TruckLocation } from '@/components/maps/TruckMarker';
import type { LoadLocation } from '@/components/maps/LoadMarker';
import { getCityCoords } from './cityCoordCache';

// Minimal structural shapes for route lines (the command-center query selects a subset of columns)
export interface RouteTrip {
  id: string;
  origin_city?: string | null;
  destination_city?: string | null;
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
}

export interface RouteShipment {
  id: string;
  origin_city?: string | null;
  destination_city?: string | null;
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
}

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png' });

// ── Truck Icon (orange circle with white truck SVG) ───────────────
const truckSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
  <circle cx="18" cy="18" r="15" fill="#f97316" stroke="#ffffff" stroke-width="2.5"/>
  <g transform="translate(9,9) scale(0.7)">
    <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="7" cy="18" r="2" fill="none" stroke="#ffffff" stroke-width="2.5"/>
    <circle cx="17" cy="18" r="2" fill="none" stroke="#ffffff" stroke-width="2.5"/>
  </g>
</svg>`;
const truckerIcon = L.divIcon({
  className: '',
  html: `<img src="data:image/svg+xml;charset=UTF-8,${encodeURIComponent(truckSvg)}" width="36" height="36" />`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

// ── On-Trip Truck Icon (green circle with white truck SVG) ───────
const onTripSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="17" fill="#22c55e" stroke="#ffffff" stroke-width="2.5"/>
  <g transform="translate(12,12) scale(0.7)">
    <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="7" cy="18" r="2" fill="none" stroke="#ffffff" stroke-width="2.5"/>
    <circle cx="17" cy="18" r="2" fill="none" stroke="#ffffff" stroke-width="2.5"/>
  </g>
</svg>`;
const onTripIcon = L.divIcon({
  className: '',
  html: `<img src="data:image/svg+xml;charset=UTF-8,${encodeURIComponent(onTripSvg)}" width="40" height="40" />`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// ── Load/Business Icon (blue rounded square with package SVG) ────
const loadSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect x="3" y="3" width="26" height="26" rx="6" fill="#2563eb" stroke="#ffffff" stroke-width="2.5"/>
  <g transform="translate(10,10) scale(0.65)">
    <rect x="3" y="7" width="18" height="13" rx="2" fill="none" stroke="#ffffff" stroke-width="2.5"/>
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="none" stroke="#ffffff" stroke-width="2.5"/>
  </g>
</svg>`;
const loadIcon = L.divIcon({
  className: '',
  html: `<img src="data:image/svg+xml;charset=UTF-8,${encodeURIComponent(loadSvg)}" width="32" height="32" />`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// ── Types ────────────────────────────────────────────────────────
interface CommandCenterMapProps {
  trucks: TruckLocation[];
  loads: LoadLocation[];
  showRoutes: boolean;
  showHeatmap: boolean;
  showCorridors: boolean;
  selectedTruckId?: string;
  selectedLoadId?: string;
  onTruckClick?: (truck: TruckLocation) => void;
  onLoadClick?: (load: LoadLocation) => void;
  hotCorridors: Array<{ route: string; count: number }>;
  trips?: RouteTrip[];
  shipments?: RouteShipment[];
}

interface ResolvedRoute { id: string; positions: [number, number][]; color: string; }

function AnimatedRoute({ route }: { route: ResolvedRoute }) {
  const [offset, setOffset] = useState(0);
  // 12.5fps dash animation — but never tick while the tab/app is hidden
  // (wasted re-renders, GPU work and battery on mobile WebViews).
  useEffect(() => {
    const i = setInterval(() => {
      if (document.hidden) return;
      setOffset((p) => (p - 1) % 16);
    }, 80);
    return () => clearInterval(i);
  }, []);
  if (route.positions.length < 2) return null;
  return (<>
    <Polyline positions={route.positions} pathOptions={{ color: route.color, weight: 6, opacity: 0.12, lineCap: 'round', lineJoin: 'round' }} />
    <Polyline positions={route.positions} pathOptions={{ color: route.color, weight: 3, opacity: 0.85, dashArray: '10 6', dashOffset: String(offset), lineCap: 'round', lineJoin: 'round' }} />
  </>);
}

function CorridorLayer({ corridors }: { corridors: Array<{ route: string; count: number }> }) {
  const [lines, setLines] = useState<Array<{ from: [number, number]; to: [number, number]; count: number }>>([]);
  useEffect(() => {
    let c = false;
    (async () => {
      const r: Array<{ from: [number, number]; to: [number, number]; count: number }> = [];
      for (const co of corridors) {
        const p = co.route.split('->').map((s) => s.trim());
        if (p.length !== 2) continue;
        const fromCity = p[0];
        const toCity = p[1];
        if (!fromCity || !toCity) continue;
        const [f, t] = await Promise.all([getCityCoords(fromCity), getCityCoords(toCity)]);
        if (f && t) r.push({ from: f, to: t, count: co.count });
      }
      if (!c) setLines(r);
    })();
    return () => { c = true; };
  }, [corridors]);
  return (<>{lines.map((l, i) => (<React.Fragment key={i}>
    <Polyline positions={[l.from, l.to]} pathOptions={{ color: '#a855f7', weight: 2 + l.count * 0.5, opacity: 0.25 + l.count * 0.06, dashArray: '6 6' }} />
    <CircleMarker center={l.from} radius={4} pathOptions={{ color: '#a855f7', fillColor: '#a855f7', fillOpacity: 0.6, weight: 2 }} />
    <CircleMarker center={l.to} radius={4} pathOptions={{ color: '#a855f7', fillColor: '#a855f7', fillOpacity: 0.6, weight: 2 }} />
  </React.Fragment>))}</>);
}

function HeatmapLayer({ points }: { points: [number, number][] }) {
  const map = useMap(); const ref = useRef<L.LayerGroup | null>(null);
  useEffect(() => {
    if (ref.current) { map.removeLayer(ref.current); ref.current = null; }
    if (points.length === 0) return;
    const g = L.layerGroup();
    points.forEach(([lat, lng]) => {
      L.circleMarker([lat, lng], { renderer: L.canvas(), radius: 24, color: 'transparent', fillColor: '#ef4444', fillOpacity: 0.05, interactive: false }).addTo(g);
      L.circleMarker([lat, lng], { renderer: L.canvas(), radius: 16, color: 'transparent', fillColor: '#f97316', fillOpacity: 0.12, interactive: false }).addTo(g);
      L.circleMarker([lat, lng], { renderer: L.canvas(), radius: 8, color: 'transparent', fillColor: '#fbbf24', fillOpacity: 0.25, interactive: false }).addTo(g);
    });
    g.addTo(map); ref.current = g;
    return () => { if (ref.current) { map.removeLayer(ref.current); ref.current = null; } };
  }, [points, map]);
  return null;
}

/**
 * Keeps Leaflet in sync with its flex container and re-fits the view whenever
 * either the tracked positions or the container box changes.
 *
 * Leaflet only listens for `window` resize, so a `flex-1` container that gains
 * or loses height after mount (metrics loading in, rail toggling, the mobile
 * tab pane switching from `hidden`) leaves the map on a stale size: tiles are
 * drawn for the old box and `fitBounds` can be computed against a 0x0 canvas,
 * which parks the view on a garbage zoom/centre.
 */
function MapView({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = map.getContainer();
    const sync = () => {
      map.invalidateSize({ pan: false });
      const w = el.clientWidth;
      const h = el.clientHeight;
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    sync();
    const raf = requestAnimationFrame(sync);
    const timer = window.setTimeout(sync, 300);
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [map]);

  const positionsKey = positions.map((p) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`).join('|');

  useEffect(() => {
    // Wait for a real box — fitting against 0x0 produces a nonsense zoom.
    if (positions.length === 0 || size.w === 0 || size.h === 0) return;
    map.fitBounds(L.latLngBounds(positions.map((p) => L.latLng(p[0], p[1]))), {
      padding: [60, 60],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionsKey, map, size.w, size.h]);

  return null;
}

// ── Main component ───────────────────────────────────────────────
const CommandCenterMap: React.FC<CommandCenterMapProps> = ({
  trucks, loads, showRoutes, showHeatmap, showCorridors,
  selectedTruckId, selectedLoadId, onTruckClick, onLoadClick,
  hotCorridors, trips = [], shipments = [],
}) => {
  const [tileLayer, setTileLayer] = useState<'satellite' | 'standard'>('satellite');
  const tileUrl = tileLayer === 'satellite'
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const allPositions = useMemo(() => {
    const pts: [number, number][] = [];
    trucks.forEach((t) => pts.push([t.lat, t.lng]));
    loads.forEach((l) => { if (l.origin_lat && l.origin_lng) pts.push([l.origin_lat, l.origin_lng]); });
    return pts;
  }, [trucks, loads]);

  const [resolvedRoutes, setResolvedRoutes] = useState<ResolvedRoute[]>([]);
  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      const routes: ResolvedRoute[] = [];
      for (const trip of trips) {
        if (trip.origin_lat && trip.origin_lng && trip.destination_lat && trip.destination_lng) {
          routes.push({ id: `trip-${trip.id}`, positions: [[trip.origin_lat, trip.origin_lng], [trip.destination_lat, trip.destination_lng]], color: '#f97316' });
        } else if (trip.origin_city && trip.destination_city) {
          const [f, t] = await Promise.all([getCityCoords(trip.origin_city), getCityCoords(trip.destination_city)]);
          if (f && t) routes.push({ id: `trip-${trip.id}`, positions: [f, t], color: '#f97316' });
        }
      }
      for (const ship of shipments) {
        if (ship.origin_lat && ship.origin_lng && ship.destination_lat && ship.destination_lng) {
          routes.push({ id: `ship-${ship.id}`, positions: [[ship.origin_lat, ship.origin_lng], [ship.destination_lat, ship.destination_lng]], color: '#3b82f6' });
        } else if (ship.origin_city && ship.destination_city) {
          const [f, t] = await Promise.all([getCityCoords(ship.origin_city), getCityCoords(ship.destination_city)]);
          if (f && t) routes.push({ id: `ship-${ship.id}`, positions: [f, t], color: '#3b82f6' });
        }
      }
      if (!cancelled) setResolvedRoutes(routes);
    };
    resolve();
    return () => { cancelled = true; };
  }, [trips, shipments]);

  const heatPoints = useMemo(() => trucks.map((t) => [t.lat, t.lng] as [number, number]), [trucks]);

  return (
    <div className="absolute inset-0 bg-gray-100">
      <MapContainer
        center={[22.5, 84.0]}
        zoom={7}
        className="absolute inset-0"
        style={{ background: '#f3f4f6' }}
        scrollWheelZoom
        touchZoom
        zoomControl
      >
        <TileLayer attribution='&copy; Esri' url={tileUrl} />

        {showHeatmap && <HeatmapLayer points={heatPoints} />}
        {showCorridors && <CorridorLayer corridors={hotCorridors} />}
        <MapView positions={allPositions} />
        {showRoutes && resolvedRoutes.map((route) => <AnimatedRoute key={route.id} route={route} />)}

        {/* Truck markers with truck icon */}
        {trucks.map((truck) => {
          const isOnTrip = !!truck.trip_id;
          const icon = isOnTrip ? onTripIcon : truckerIcon;
          return (
            <Marker key={truck.driver_id} position={[truck.lat, truck.lng]} icon={icon} eventHandlers={{ click: () => onTruckClick?.(truck) }} zIndexOffset={selectedTruckId === truck.driver_id ? 500 : 0}>
              <Popup>
                <div className="min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: isOnTrip ? '#22c55e' : '#f97316', border: '3px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', flexShrink: 0 }} />
                    <div>
                      <p className="font-bold text-sm text-gray-900">{truck.driver_name || 'Truck'}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">{isOnTrip ? 'In Transit' : 'Idle'}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    {truck.vehicle_type && <p><span className="font-medium">Vehicle:</span> {truck.vehicle_type} {truck.available_capacity_tonnes != null && `(${truck.available_capacity_tonnes}T)`}</p>}
                    {truck.origin_city && truck.destination_city && <p><span className="font-medium">Route:</span> {truck.origin_city} → {truck.destination_city}</p>}
                    {truck.speed != null && truck.speed > 0 && <p><span className="font-medium">Speed:</span> {Math.round(truck.speed * 3.6)} km/h</p>}
                    <p className="text-gray-400 pt-1">Updated {formatTimeAgo(truck.last_seen_at)}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Load/Business markers with package icon */}
        {loads.map((load) => {
          if (load.origin_lat == null || load.origin_lng == null) return null;
          return (
            <Marker key={`load-${load.id}`} position={[load.origin_lat, load.origin_lng]} icon={loadIcon} eventHandlers={{ click: () => onLoadClick?.(load) }} zIndexOffset={selectedLoadId === load.id ? 500 : 0}>
              <Popup>
                <div className="min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div style={{ width: 20, height: 20, borderRadius: '6px', background: '#2563eb', border: '3px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', flexShrink: 0 }} />
                    <div>
                      <p className="font-bold text-sm text-gray-900">📦 {load.origin_city} → {load.dest_city}</p>
                      <p className="text-[10px] text-blue-600 uppercase font-semibold">Load Request</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    {load.weight_tonnes != null && <p><span className="font-medium">Weight:</span> {load.weight_tonnes}T</p>}
                    {load.budget_per_tonne != null && <p><span className="font-medium">Budget:</span> ₹{load.budget_per_tonne.toLocaleString('en-IN')}/T</p>}
                    {load.goods_description && <p><span className="font-medium">Goods:</span> {load.goods_description.length > 50 ? load.goods_description.slice(0, 50) + '...' : load.goods_description}</p>}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Tile layer switcher */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1">
        {(['satellite', 'standard'] as const).map((layer) => (
          <button
            key={layer}
            onClick={() => setTileLayer(layer)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider shadow-md',
              tileLayer === layer ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            )}
          >
            {layer}
          </button>
        ))}
      </div>
    </div>
  );
};

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default CommandCenterMap;
