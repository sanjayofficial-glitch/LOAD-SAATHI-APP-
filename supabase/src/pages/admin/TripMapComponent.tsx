import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2 } from 'lucide-react';
import ZoomControls from '@/components/maps/ZoomControls';

const coordCache: Record<string, [number, number]> = {
  'mumbai': [19.0760, 72.8777],
  'delhi': [28.6139, 77.2090],
  'new delhi': [28.6139, 77.2090],
  'bangalore': [12.9716, 77.5946],
  'bengaluru': [12.9716, 77.5946],
  'hyderabad': [17.3850, 78.4867],
  'ahmedabad': [23.0225, 72.5714],
  'chennai': [13.0827, 80.2707],
  'kolkata': [22.5726, 88.3639],
  'pune': [18.5204, 73.8567],
  'jaipur': [26.9124, 75.7873],
  'lucknow': [26.8467, 80.9462],
  'kanpur': [26.4499, 80.3319],
  'nagpur': [21.1458, 79.0882],
  'indore': [22.7196, 75.8577],
  'thane': [19.2183, 72.9781],
  'bhopal': [23.2599, 77.4126],
  'visakhapatnam': [17.6868, 83.2185],
  'patna': [25.5941, 85.1376],
  'vadodara': [22.3072, 73.1812],
  'ghaziabad': [28.6692, 77.4538],
  'ludhiana': [30.9010, 75.8573],
  'agra': [27.1767, 78.0081],
  'nashik': [19.9975, 73.7898],
  'ranchi': [23.3441, 85.3096],
  'jamshedpur': [22.8046, 86.2029],
  'dhanbad': [23.7957, 86.4304],
  'godda': [24.8256, 87.2114],
  'daltonganj': [23.9933, 84.0722],
  'hazaribagh': [23.9925, 85.3633],
  'bokaro': [23.6693, 86.1511],
  'gurgaon': [28.4595, 77.0266],
  'gurugram': [28.4595, 77.0266],
  'noida': [28.5355, 77.3910],
  'surat': [21.1702, 72.8311],
  'bhubaneswar': [20.2961, 85.8245],
  'guwahati': [26.1445, 91.7362],
  'amritsar': [31.6340, 74.8723],
  'madurai': [9.9252, 78.1198],
  'vijayawada': [16.5062, 80.6480],
  'gwalior': [26.2124, 78.1772],
  'coimbatore': [11.0168, 76.9558],
  'jodhpur': [26.2389, 73.0243],
  'raipur': [21.2514, 81.6296],
  'kota': [25.2138, 75.8648],
  'chandigarh': [30.7333, 76.7794],
  'hubli': [15.3647, 75.1240],
  'mysore': [12.2958, 76.6394],
  'bareilly': [28.3670, 79.4304],
  'aligarh': [27.8974, 78.0880],
  'tiruchirappalli': [10.7905, 78.7047],
  'solapur': [17.6599, 75.9064],
  'varanasi': [25.3176, 82.9739],
  'dehradun': [30.3165, 78.0322],
  'panaji': [15.4909, 73.8278],
};

const applyJitter = (coord: [number, number], index: number): [number, number] => {
  const jitter = 0.02;
  const angle = (index * 137.5) % 360;
  const rad = (angle * Math.PI) / 180;
  return [coord[0] + Math.sin(rad) * jitter, coord[1] + Math.cos(rad) * jitter];
};

async function getCityCoords(city: string): Promise<[number, number] | null> {
  const normalized = city.toLowerCase().trim();
  if (coordCache[normalized]) return coordCache[normalized];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', India')}&format=json&limit=1`,
      { headers: { 'User-Agent': 'LoadSaathi-Admin/1.0' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      coordCache[normalized] = coords;
      return coords;
    }
  } catch {
    // ignore
  }
  return null;
}

async function resolveCoords(
  item: Record<string, unknown>,
  cityField: string,
  latField: string,
  lngField: string
): Promise<[number, number] | null> {
  if (item[latField] != null && item[lngField] != null) {
    return [Number(item[latField]), Number(item[lngField])];
  }
  return getCityCoords(item[cityField] as string);
}

const truckIcon = new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png', iconSize: [24, 24], iconAnchor: [12, 12] });
const boxIcon = new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png', iconSize: [24, 24], iconAnchor: [12, 12] });
const flagIcon = new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/3233/3233005.png', iconSize: [24, 24], iconAnchor: [12, 24] });

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

interface MapItem {
  id: string;
  status: string;
  origin_city: string;
  destination_city: string;
  origin_lat?: number;
  origin_lng?: number;
  destination_lat?: number;
  destination_lng?: number;
  trucker?: { full_name: string };
  shipper?: { full_name: string };
}
interface ResolvedMapItem extends MapItem {
  origin: [number, number];
  destination: [number, number];
}
interface TripMapProps { trips: MapItem[]; shipments: MapItem[]; }

const TripMap: React.FC<TripMapProps> = ({ trips, shipments }) => {
  const [resolvedTrips, setResolvedTrips] = useState<ResolvedMapItem[]>([]);
  const [resolvedShipments, setResolvedShipments] = useState<ResolvedMapItem[]>([]);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const resolveAll = async () => {
      setResolving(true);
      const activeTrips = trips.filter(t => t.status !== 'cancelled');
      const activeShipments = shipments.filter(s => s.status !== 'cancelled');

      // Resolve all coords in parallel batches of 5 to respect Nominatim rate limits
      const batchResolve = async (items: MapItem[], isTrip: boolean) => {
        const results: ResolvedMapItem[] = [];
        for (let i = 0; i < items.length; i += 5) {
          const batch = items.slice(i, i + 5);
          const batchResults = await Promise.all(
            batch.map(async (item, idx) => {
              const origin = await resolveCoords(item as unknown as Record<string, unknown>, 'origin_city', 'origin_lat', 'origin_lng');
              const dest = await resolveCoords(item as unknown as Record<string, unknown>, 'destination_city', 'destination_lat', 'destination_lng');
              if (origin && dest) {
                const globalIdx = i + idx;
                return {
                  ...item,
                  origin: applyJitter(origin, isTrip ? globalIdx : globalIdx + 50),
                  destination: applyJitter(dest, isTrip ? globalIdx + 10 : globalIdx + 60),
                } as ResolvedMapItem;
              }
              return null;
            })
          );
          results.push(...batchResults.filter((x): x is ResolvedMapItem => x !== null));
          if (i + 5 < items.length) await new Promise(r => setTimeout(r, 200));
        }
        return results;
      };

      const [tripResults, shipmentResults] = await Promise.all([
        batchResolve(activeTrips, true),
        batchResolve(activeShipments, false),
      ]);

      if (isMounted) {
        setResolvedTrips(tripResults);
        setResolvedShipments(shipmentResults);
        setResolving(false);
      }
    };
    resolveAll();
    return () => { isMounted = false; };
  }, [trips, shipments]);

  const allPositions = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = [];
    resolvedTrips.forEach((t) => {
      pts.push(t.origin);
      pts.push(t.destination);
    });
    resolvedShipments.forEach((s) => {
      pts.push(s.origin);
      pts.push(s.destination);
    });
    return pts;
  }, [resolvedTrips, resolvedShipments]);

  return (
    <div className="h-full w-full bg-slate-900 overflow-hidden relative">
      <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%', background: '#020617', position: 'relative' }} scrollWheelZoom touchZoom zoomControl={false}>
        <MapResizer />
        <ZoomControls positions={allPositions} />
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}" />

        {resolvedTrips.map(t => (
          <React.Fragment key={`t-${t.id}`}>
            <Marker position={t.origin} icon={truckIcon}><Popup>{t.trucker?.full_name}: {t.origin_city}</Popup></Marker>
            <Marker position={t.destination} icon={flagIcon}><Popup>To: {t.destination_city}</Popup></Marker>
            <Polyline positions={[t.origin, t.destination]} pathOptions={{ color: '#f97316', weight: 2, dashArray: '5, 10', opacity: 0.7 }} />
          </React.Fragment>
        ))}

        {resolvedShipments.map(s => (
          <React.Fragment key={`s-${s.id}`}>
            <Marker position={s.origin} icon={boxIcon}><Popup>{s.shipper?.full_name}: {s.origin_city}</Popup></Marker>
            <Marker position={s.destination} icon={flagIcon}><Popup>To: {s.destination_city}</Popup></Marker>
            <Polyline positions={[s.origin, s.destination]} pathOptions={{ color: '#3b82f6', weight: 2, dashArray: '5, 10', opacity: 0.7 }} />
          </React.Fragment>
        ))}
      </MapContainer>

      {resolving && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-slate-950/90 border border-slate-800 px-4 py-2 rounded-full flex items-center gap-3 shadow-2xl">
          <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
            Mapping Logistics ({resolvedTrips.length + resolvedShipments.length} loaded)
          </span>
        </div>
      )}
    </div>
  );
};

export default TripMap;
