import { useEffect, useState, useCallback, useRef } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { RefreshCw } from 'lucide-react';
import CommandCenterMap, { type UserLocation } from './CommandCenterMap';
import CommandCenterSidebar from './CommandCenterSidebar';
import type { LoadLocation } from '@/components/maps/LoadMarker';
import type { User, Trip, Shipment } from '@/types';

interface Event {
  id: string;
  type: 'trip' | 'booking' | 'user' | 'chat' | 'alert';
  message: string;
  time: string;
  raw_date?: string;
}

const MonitoringDashboard = () => {
  const { getAuthenticatedClient } = useSupabase();
  const [users, setUsers] = useState<User[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [loads, setLoads] = useState<LoadLocation[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [metrics, setMetrics] = useState({
    active_connections: 0,
    api_response_time: 0,
    error_rate: 0,
    active_requests: 0
  });
  const [businessMetrics, setBusinessMetrics] = useState({
    total_shipments: 0,
    total_trips: 0,
    pending_requests: 0,
    accepted_requests: 0,
    estimated_revenue: 0,
    success_rate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const channelRef = useRef<ReturnType<SupabaseClient['channel']> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const queryTimes: number[] = [];
      const supabaseClient = await getAuthenticatedClient();
      supabaseRef.current = supabaseClient;

      let qs = performance.now();
      const { data: userData } = await supabaseClient
        .from('users')
        .select('id, user_type, full_name, rating, total_trips, is_verified, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      queryTimes.push(performance.now() - qs);
      if (userData) setUsers(userData as unknown as User[]);

      qs = performance.now();
      const { data: tripData } = await supabaseClient
        .from('trips')
        .select('*, trucker:users!trips_trucker_id_fkey(full_name)')
        .order('created_at', { ascending: false });
      queryTimes.push(performance.now() - qs);
      if (tripData) setTrips(tripData);

      qs = performance.now();
      const { data: shipmentData } = await supabaseClient
        .from('shipments')
        .select('*, shipper:users!shipments_shipper_id_fkey(full_name)')
        .order('created_at', { ascending: false });
      queryTimes.push(performance.now() - qs);
      if (shipmentData) setShipments(shipmentData);

      // Business / load locations — shippers post their load at their address.
      // These are shown on the map so every business is visible even without
      // live GPS broadcasting.
      qs = performance.now();
      const { data: loadData } = await supabaseClient
        .from('load_locations')
        .select('*, shipper:users!load_locations_shipper_id_fkey(full_name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      queryTimes.push(performance.now() - qs);
      if (loadData) setLoads(loadData as unknown as LoadLocation[]);

      // Live driver locations
      qs = performance.now();
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: locationData } = await supabaseClient
        .from('driver_locations')
        .select('driver_id, user_type, lat, lng, heading, speed, updated_at')
        .gte('updated_at', fiveMinAgo)
        .order('updated_at', { ascending: false });
      queryTimes.push(performance.now() - qs);

      if (locationData && locationData.length > 0) {
        const driverIds = locationData.map((l) => l.driver_id);
        const { data: locationUsers } = await supabaseClient
          .from('users')
          .select('id, full_name')
          .in('id', driverIds);

        const userNameMap = new Map<string, string>();
        locationUsers?.forEach((u) => userNameMap.set(u.id, u.full_name));

        const enrichedLocations: UserLocation[] = locationData.map((loc) => ({
          driver_id: loc.driver_id,
          user_type: loc.user_type || 'trucker',
          lat: loc.lat,
          lng: loc.lng,
          heading: loc.heading,
          speed: loc.speed,
          updated_at: loc.updated_at,
          full_name: userNameMap.get(loc.driver_id) || 'Unknown',
        }));

        const activeTripTruckers = new Map<string, { origin_city: string; destination_city: string }>();
        tripData?.forEach(t => { if (t.trucker_id) activeTripTruckers.set(t.trucker_id, { origin_city: t.origin_city, destination_city: t.destination_city }); });
        const activeShipShippers = new Map<string, { origin_city: string; destination_city: string }>();
        if (shipmentData) shipmentData.forEach(s => { if (s.shipper_id) activeShipShippers.set(s.shipper_id, { origin_city: s.origin_city, destination_city: s.destination_city }); });

        enrichedLocations.forEach(loc => {
          if (loc.user_type === 'trucker' && activeTripTruckers.has(loc.driver_id)) {
            const trip = activeTripTruckers.get(loc.driver_id)!;
            loc.trip_id = 'active';
            loc.origin_city = trip.origin_city;
            loc.destination_city = trip.destination_city;
          } else if (loc.user_type === 'shipper' && activeShipShippers.has(loc.driver_id)) {
            const ship = activeShipShippers.get(loc.driver_id)!;
            loc.trip_id = 'active';
            loc.origin_city = ship.origin_city;
            loc.destination_city = ship.destination_city;
          }
        });

        setLocations(enrichedLocations);
      } else {
        setLocations([]);
      }

      // Business Metrics
      qs = performance.now();
      const { data: requests } = await supabaseClient.from('requests').select('status, weight_tonnes, trip:trips(price_per_tonne)');
      queryTimes.push(performance.now() - qs);

      const pending = requests?.filter(r => r.status === 'pending').length || 0;
      const accepted = requests?.filter(r => r.status === 'accepted') || [];
      const revenue = accepted.reduce((sum: number, r: { weight_tonnes: number; trip?: { price_per_tonne: number }[] | { price_per_tonne: number } }) => {
        const tripPrice = Array.isArray(r.trip) ? r.trip[0]?.price_per_tonne : (r.trip as { price_per_tonne?: number })?.price_per_tonne;
        return sum + (r.weight_tonnes * (tripPrice || 0));
      }, 0);
      const successRate = requests?.length ? Math.round((accepted.length / requests.length) * 100) : 0;

      setBusinessMetrics({
        total_shipments: shipmentData?.length || 0,
        total_trips: tripData?.length || 0,
        pending_requests: pending,
        accepted_requests: accepted.length,
        estimated_revenue: revenue,
        success_rate: successRate
      });

      // System metrics
      const avgLatency = queryTimes.length ? Math.round(queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length) : 0;
      const cancelledTrips = tripData?.filter(t => t.status === 'cancelled').length || 0;
      const totalTrips = tripData?.length || 0;
      const errorRate = totalTrips ? Math.round((cancelledTrips / totalTrips) * 100) : 0;

      setMetrics({
        active_connections: userData?.length || 0,
        api_response_time: avgLatency,
        error_rate: errorRate,
        active_requests: pending
      });

      // Historical events
      const [{ data: hTrips }, { data: hShips }, { data: hRequests }] = await Promise.all([
        supabaseClient.from('trips').select('id, origin_city, destination_city, created_at').limit(10),
        supabaseClient.from('shipments').select('id, origin_city, created_at').limit(10),
        supabaseClient.from('requests').select('id, created_at, status').limit(10)
      ]);

      const formattedHist: Event[] = [
        ...(hTrips || []).map(t => ({
          id: `t-${t.id}`,
          type: 'trip' as const,
          message: `Trip: ${t.origin_city} → ${t.destination_city}`,
          time: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          raw_date: t.created_at
        })),
        ...(hShips || []).map(s => ({
          id: `s-${s.id}`,
          type: 'booking' as const,
          message: `Load at ${s.origin_city}`,
          time: new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          raw_date: s.created_at
        })),
        ...(hRequests || []).map(r => ({
          id: `r-${r.id}`,
          type: (r.status === 'accepted' ? 'booking' : r.status === 'pending' ? 'alert' : 'chat') as Event['type'],
          message: `Request ${r.status}: ${r.id.slice(0, 8)}...`,
          time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          raw_date: r.created_at
        }))
      ]
      .sort((a, b) => new Date(b.raw_date || '').getTime() - new Date(a.raw_date || '').getTime())
      .slice(0, 20);

      setEvents(formattedHist);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[Monitoring] Fetch error:', err);
      setError('Failed to fetch monitoring data.');
    } finally {
      setLoading(false);
    }
  }, [getAuthenticatedClient]);

  useEffect(() => {
    fetchData().then(() => {
      const client = supabaseRef.current;
      if (!client || channelRef.current) return;

      // Debounce: skip realtime refetches if last fetch was <2s ago
      const lastFetchRef = { current: Date.now() };
      const debouncedFetch = () => {
        const now = Date.now();
        if (now - lastFetchRef.current < 2000) return;
        lastFetchRef.current = now;
        fetchData();
      };

      channelRef.current = client.channel('admin-monitoring')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_locations' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'load_locations' }, debouncedFetch)
        .subscribe();
    });

    const interval = setInterval(fetchData, 30000);
    return () => {
      clearInterval(interval);
      if (channelRef.current) {
        const client = supabaseRef.current;
        const channel = channelRef.current;
        if (client) {
          void (async () => {
            try {
              await client.removeChannel(channel);
            } catch (err) {
              if (import.meta.env.DEV) console.warn('[channel cleanup]', err);
            }
          })();
        }
        channelRef.current = null;
      }
    };
  }, [fetchData]);

  return (
    <div className="h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] flex flex-col bg-slate-950 text-slate-50 overflow-hidden">
      {/* Full-screen map + sidebar layout */}
      <div className="flex-1 flex min-h-0">
        {/* Map — fills remaining width */}
        <div className="flex-1 relative min-w-0">
          <CommandCenterMap
            locations={locations}
            loads={loads}
            trips={trips}
            shipments={shipments}
            loading={loading}
          />
          {/* Floating refresh + error bar — pinned to viewport below the
              sticky top nav so it never scrolls away or gets covered */}
          <div className="fixed top-[calc(3.5rem+1rem)] sm:top-[calc(4rem+1rem)] left-4 z-[9999] flex items-center gap-2">
            {error && (
              <span className="text-[9px] text-red-300 font-mono bg-slate-950/95 border border-red-700/60 px-2.5 py-1 rounded-lg backdrop-blur-md">
                {error}
              </span>
            )}
            <span className="text-[9px] text-slate-400 font-mono bg-slate-950/95 border border-slate-700/60 px-2.5 py-1 rounded-lg backdrop-blur-md hidden sm:inline">
              {lastUpdated.toLocaleTimeString()}
            </span>
            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-slate-950/95 border border-slate-700/60 px-2.5 py-1 rounded-lg backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:border-slate-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Sidebar — fixed width, scrollable */}
        <div className="w-[340px] shrink-0 hidden lg:flex">
          <CommandCenterSidebar
            locations={locations}
            users={users}
            trips={trips}
            shipments={shipments}
            events={events}
            metrics={metrics}
            businessMetrics={businessMetrics}
          />
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
