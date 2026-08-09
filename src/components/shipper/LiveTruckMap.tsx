import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { LoadSaathiMap } from '@/components/maps';
import { useLiveDriverLocations } from '@/hooks/useLiveDriverLocations';
import { useTripMapMarkers } from '@/hooks/useTripMapMarkers';
import { isTruckInTransit, type TruckLocation } from '@/components/maps/TruckMarker';
import { useAuth } from '@/contexts/AuthContext';
import type { Trip } from '@/types';
import TruckDetailsPanel, {
  type TripWithTrucker,
  type TruckerProfile,
} from './TruckDetailsPanel';
import { Radio, Truck, Search, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type TruckFilter = 'all' | 'in_transit' | 'standing';

const FILTERS: { key: TruckFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'standing', label: 'Standing' },
];

interface LiveTruckMapProps {
  className?: string;
}

export default function LiveTruckMap({ className }: LiveTruckMapProps) {
  const { getSupabaseToken } = useAuth();
  const { driverLocations, isLoading } = useLiveDriverLocations();

  // Active posted trips — shown as pins even when a trucker isn't broadcasting GPS.
  const { data: activeTrips = [], isLoading: tripsLoading } = useQuery<Trip[]>({
    queryKey: ['shipper-map-active-trips'],
    queryFn: async () => {
      const token = await getSupabaseToken();
      if (!token) return [];
      const supabase = createClerkSupabaseClient(token);
      const { data } = await supabase
        .from('trips')
        .select(`
          id, origin_city, destination_city, origin_state, destination_state, origin_lat, origin_lng, destination_lat, destination_lng, available_capacity_tonnes, price_per_tonne, departure_date, created_at, trucker_id, status, vehicle_type,
          trucker:users!trips_trucker_id_fkey(full_name, rating, is_verified)
        `)
        .eq('status', 'active')
        .order('departure_date', { ascending: true })
        .limit(50);
      const mapped = (data || []).map((t: Record<string, unknown>) => ({
        ...t,
        trucker: Array.isArray(t.trucker) ? (t.trucker as Record<string, unknown>[])[0] : t.trucker,
      }));
      return mapped as Trip[];
    },
    staleTime: 30_000,
  });

  // Posted-trip pins (live GPS preferred, trip origin / geocoded city fallback).
  const tripMarkers = useTripMapMarkers(activeTrips, driverLocations);

  // Live GPS trucks + posted-trip pins merged; live position wins per driver.
  const allTrucks = useMemo<TruckLocation[]>(() => {
    const seen = new Set<string>();
    const merged: TruckLocation[] = [];
    for (const t of [...driverLocations, ...tripMarkers]) {
      if (seen.has(t.driver_id)) continue;
      seen.add(t.driver_id);
      merged.push(t);
    }
    return merged;
  }, [driverLocations, tripMarkers]);

  const [filter, setFilter] = useState<TruckFilter>('all');
  const [selectedTruck, setSelectedTruck] = useState<TruckLocation | null>(null);

  // Keep the panel following the truck live (positions update in realtime)
  const liveTruck = selectedTruck
    ? driverLocations.find((t) => t.driver_id === selectedTruck.driver_id) ?? selectedTruck
    : null;

  // Full trip + trucker details for the selected truck's posted trip
  const { data: trip, isLoading: tripLoading } = useQuery<TripWithTrucker | null>({
    queryKey: ['shipper-map-trip', liveTruck?.trip_id],
    queryFn: async () => {
      if (!liveTruck?.trip_id) return null;
      const token = await getToken({ template: 'supabase' });
      if (!token) return null;
      const supabase = createClerkSupabaseClient(token);
      const { data } = await supabase
        .from('trips')
        .select(
          'id, origin_city, destination_city, origin_state, destination_state, origin_lat, origin_lng, destination_lat, destination_lng, available_capacity_tonnes, price_per_tonne, departure_date, vehicle_type, vehicle_number, status, estimated_distance_km, estimated_duration_min, trucker_id, trucker:users!trips_trucker_id_fkey(full_name, rating, phone, total_trips, is_verified)',
        )
        .eq('id', liveTruck.trip_id)
        .maybeSingle();
      return (data as TripWithTrucker | null) ?? null;
    },
    enabled: !!liveTruck?.trip_id,
  });

  // Trucker profile fallback (standing trucks have no active trip)
  const { data: truckerProfile, isLoading: profileLoading } = useQuery<TruckerProfile | null>({
    queryKey: ['shipper-map-profile', liveTruck?.driver_id],
    queryFn: async () => {
      if (!liveTruck) return null;
      const token = await getToken({ template: 'supabase' });
      if (!token) return null;
      const supabase = createClerkSupabaseClient(token);
      const { data } = await supabase
        .from('users')
        .select('id, full_name, rating, phone, total_trips, is_verified')
        .eq('id', liveTruck.driver_id)
        .maybeSingle();
      return (data as TruckerProfile | null) ?? null;
    },
    enabled: !!liveTruck,
  });

  const filteredTrucks = useMemo(() => {
    switch (filter) {
      case 'in_transit':
        return allTrucks.filter(isTruckInTransit);
      case 'standing':
        return allTrucks.filter((t) => !isTruckInTransit(t));
      default:
        return allTrucks;
    }
  }, [allTrucks, filter]);

  const counts = useMemo(
    () => ({
      all: allTrucks.length,
      in_transit: allTrucks.filter(isTruckInTransit).length,
      standing: allTrucks.filter((t) => !isTruckInTransit(t)).length,
    }),
    [allTrucks],
  );

  const showRouteFor =
    trip &&
    trip.origin_lat != null &&
    trip.origin_lng != null &&
    trip.destination_lat != null &&
    trip.destination_lng != null
      ? {
          originLat: trip.origin_lat,
          originLng: trip.origin_lng,
          destLat: trip.destination_lat,
          destLng: trip.destination_lng,
          color: '#f97316',
        }
      : undefined;

  return (
    <section className={className}>
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2 flex-wrap">
            <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
            Trucks Around You
            {driverLocations.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 dark:bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-[11px] font-black tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                LIVE
              </span>
            ) : tripMarkers.length > 0 ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-500/15 dark:bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-[11px] font-black tracking-wider">
                POSTED TRIPS
              </span>
            ) : null}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tap any truck to see its route, price and trucker details — live GPS where shared,
            posted trips otherwise.
          </p>
        </div>
        <Link
          to="/browse-trucks"
          className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1"
        >
          Browse all trips <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Map card */}
      <div
        className={cn(
          'relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg bg-muted',
          className,
        )}
        style={{ height: '540px' }}
      >
        <LoadSaathiMap
          trucks={filteredTrucks}
          selectedTruckId={liveTruck?.driver_id}
          onTruckClick={setSelectedTruck}
          onMapClick={() => setSelectedTruck(null)}
          showRouteFor={showRouteFor}
          height="100%"
          className="rounded-none border-0"
          showLegend={false}
          showClusters
        />

        {/* Filter chips */}
        <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 flex-wrap max-w-[calc(100%-5rem)]">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-[11px] font-bold border backdrop-blur-xl transition-all duration-200',
                filter === f.key
                  ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/30 scale-105'
                  : 'bg-white/85 dark:bg-gray-900/85 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400',
              )}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>

        {/* Filtered-empty hint */}
        {filteredTrucks.length === 0 && allTrucks.length > 0 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 shadow-lg">
              No {filter === 'in_transit' ? 'in-transit' : 'standing'} trucks right now
              <button
                onClick={() => setFilter('all')}
                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-bold transition-colors"
              >
                Show all
              </button>
            </div>
          </div>
        )}

        {/* Trucker details panel */}
        {liveTruck && (
          <div
            className={cn(
              'pointer-events-none absolute z-[1000]',
              'inset-x-3 bottom-3 max-h-[52%]',
              'md:inset-x-auto md:right-3 md:top-3 md:bottom-3 md:w-[350px] md:max-h-none',
            )}
          >
            <div className="pointer-events-auto h-full max-h-full flex flex-col rounded-2xl border border-border/60 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
              <TruckDetailsPanel
                truck={liveTruck}
                trip={trip ?? null}
                truckerProfile={truckerProfile ?? null}
                loading={tripLoading || profileLoading}
                onClose={() => setSelectedTruck(null)}
              />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !tripsLoading && allTrucks.length === 0 && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center p-6 pointer-events-none">
            <div className="pointer-events-auto text-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-8 max-w-sm shadow-xl">
              <div className="bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Radio className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">No trucks right now</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                No truckers are sharing live location and no trips are posted at the moment.
                Post your load and truckers will come to you.
              </p>
              <div className="flex flex-col gap-2 mt-5">
                <Link
                  to="/shipper/post-shipment"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-md transition-all"
                >
                  Post Your Load
                </Link>
                <Link
                  to="/browse-trucks"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 border border-orange-200 dark:border-orange-800/60 transition-colors"
                >
                  <Search className="h-4 w-4" /> Browse Available Trips
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
