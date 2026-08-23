import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2,
  MapPin,
  Package,
  Radio,
  RefreshCw,
  ArrowRight,
  Truck,
} from 'lucide-react';
import { LoadSaathiMap } from '@/components/maps';
import type { LoadLocation } from '@/components/maps/LoadMarker';
import { useLiveLoadLocations } from '@/hooks/useLiveLoadLocations';
import { haversineDistanceKm, formatDistanceKm } from '@/utils/geo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface GpsPoint {
  lat: number;
  lng: number;
}

type GpsState =
  | { status: 'locating' }
  | { status: 'ready'; position: GpsPoint }
  | { status: 'error'; message: string };

const RADIUS_OPTIONS = [50, 75, 100] as const;

function loadDistanceKm(position: GpsPoint, load: LoadLocation): number | null {
  if (load.origin_lat == null || load.origin_lng == null) return null;
  return haversineDistanceKm(position.lat, position.lng, load.origin_lat, load.origin_lng);
}

export default function NearbyLoadsMap() {
  const { loads, isLoading: loadsLoading } = useLiveLoadLocations();
  const [gps, setGps] = useState<GpsState>({ status: 'locating' });
  const [radiusKm, setRadiusKm] = useState<number>(100);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setGps({ status: 'error', message: 'Geolocation is not supported by your browser.' });
      return;
    }
    setGps({ status: 'locating' });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setGps({
          status: 'ready',
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        }),
      (err) => {
        const messages: Record<number, string> = {
          1: 'Location permission denied. Enable location access to see loads near you.',
          2: 'Location unavailable. Check your device GPS and try again.',
          3: 'Location request timed out. Please try again.',
        };
        setGps({ status: 'error', message: messages[err.code] || 'Could not get your location.' });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  // Loads within the selected radius of the trucker's position.
  const nearbyLoads = useMemo(() => {
    if (gps.status !== 'ready') return loads;
    return loads.filter((load) => {
      const dist = loadDistanceKm(gps.position, load);
      return dist != null && dist <= radiusKm;
    });
  }, [loads, gps, radiusKm]);

  // Sort nearest-first once we know where the trucker is.
  const sortedLoads = useMemo(() => {
    if (gps.status !== 'ready' || nearbyLoads.length < 2) return nearbyLoads;
    return [...nearbyLoads].sort((a, b) => {
      const da = loadDistanceKm(gps.position, a) ?? Infinity;
      const db = loadDistanceKm(gps.position, b) ?? Infinity;
      return da - db;
    });
  }, [nearbyLoads, gps]);

  const located = gps.status === 'ready';

  return (
    <section className="rounded-2xl border border-orange-100 dark:border-orange-800 bg-card shadow-md overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-400" />

      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-orange-50/50 dark:bg-orange-950/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                Nearby Loads
              </h2>
              {loadsLoading ? (
                <Badge variant="outline" className="text-xs">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Loading
                </Badge>
              ) : (
                <Badge className="bg-green-600 text-white text-xs">
                  <Radio className="h-3 w-3 mr-1 animate-pulse" /> Live
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {located ? (
                <>
                  Loads within <span className="font-bold text-orange-600 dark:text-orange-400">{radiusKm} km</span> of your location
                </>
              ) : gps.status === 'locating' ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> Locating your position…
                </span>
              ) : (
                'Enable location to see loads near you'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Radius selector */}
            <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-0.5">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={radiusKm === r}
                  onClick={() => setRadiusKm(r)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-bold rounded-md transition-colors',
                    radiusKm === r
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400',
                  )}
                >
                  {r} km
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={locate}
              disabled={gps.status === 'locating'}
              className="border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-400"
            >
              {gps.status === 'locating' ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
              )}
              Locate me
            </Button>
          </div>
        </div>

        {/* Location status banner */}
        {gps.status === 'error' && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-3 py-2 text-xs text-yellow-800 dark:text-yellow-300">
            <span className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {gps.message} Showing all active loads meanwhile.
            </span>
            <button
              type="button"
              onClick={locate}
              className="font-bold underline underline-offset-2 hover:text-yellow-950 dark:hover:text-yellow-100"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="p-0">
        {loadsLoading && loads.length === 0 ? (
          <Skeleton className="h-[45vh] w-full rounded-none" />
        ) : (
          <LoadSaathiMap
            loads={sortedLoads}
            userLocation={
              located
                ? { lat: gps.position.lat, lng: gps.position.lng, radiusKm }
                : undefined
            }
            height="min(420px, 45vh)"
            showLegend
          />
        )}
      </div>

      {/* Load list */}
      <div className="border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {nearbyLoads.length} load{nearbyLoads.length !== 1 ? 's' : ''} nearby
          </p>
          <Link
            to="/trucker/browse-shipments"
            className="flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loadsLoading ? (
          <div className="px-4 sm:px-6 pb-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : nearbyLoads.length === 0 ? (
          <div className="px-4 sm:px-6 pb-6 flex flex-col items-center gap-2 text-center text-gray-400 dark:text-gray-600">
            <Truck className="h-8 w-8 opacity-50" />
            <p className="text-sm font-medium">
              {located
                ? `No loads within ${radiusKm} km right now`
                : 'No active loads right now'}
            </p>
            <p className="text-xs">
              {located ? 'Try a larger radius or check back soon.' : 'Check back soon — new loads appear live.'}
            </p>
          </div>
        ) : (
          <ul className="px-2 sm:px-4 pb-4 space-y-1.5 max-h-80 overflow-y-auto">
            {sortedLoads.slice(0, 10).map((load) => {
              const dist =
                gps.status === 'ready' ? loadDistanceKm(gps.position, load) : null;
              return (
                <li key={load.id}>
                  <div className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 px-3 py-2.5 hover:border-orange-200 dark:hover:border-orange-700 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                        {load.origin_city} → {load.dest_city}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {load.goods_description || 'Freight'}
                        {load.weight_tonnes != null && ` • ${load.weight_tonnes}T`}
                        {load.budget_per_tonne != null && (
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            {' '}
                            • ₹{load.budget_per_tonne.toLocaleString('en-IN')}/T
                          </span>
                        )}
                      </p>
                    </div>
                    {dist != null && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          'shrink-0 text-[11px] font-mono',
                          dist <= radiusKm * 0.5
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                            : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
                        )}
                      >
                        {formatDistanceKm(dist)}
                      </Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
