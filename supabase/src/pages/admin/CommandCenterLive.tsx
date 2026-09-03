import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { LoadSaathiMap } from '@/components/maps';
import { useLiveDriverLocations } from '@/hooks/useLiveDriverLocations';
import { useLiveLoadLocations } from '@/hooks/useLiveLoadLocations';
import type { TruckLocation } from '@/components/maps/TruckMarker';
import type { LoadLocation } from '@/components/maps/LoadMarker';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Truck,
  Package,
  MapPin,
  Activity,
  RefreshCw,
  Clock,
  Zap,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  type: 'trip' | 'booking' | 'user' | 'alert';
  message: string;
  time: string;
}

const VEHICLE_TYPES = ['All', 'Mini Truck', 'Tata Ace', 'Tempo', '10 MT', '16 MT', '20 MT', 'Container'];

export default function CommandCenterLive() {
  const { userProfile, getSupabaseToken } = useAuth();

  // Real-time data hooks
  const { driverLocations, isLoading: locationsLoading } = useLiveDriverLocations();
  const { loads, isLoading: loadsLoading } = useLiveLoadLocations();

  // Filters
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [selectedTruck, setSelectedTruck] = useState<TruckLocation | null>(null);
  const [selectedLoad, setSelectedLoad] = useState<LoadLocation | null>(null);

  // Fetch summary stats
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['admin-command-stats'],
    queryFn: async () => {
      const token = await getSupabaseToken();
      if (!token) return null;
      const supabase = createClerkSupabaseClient(token);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayIso = todayStart.toISOString();

      const [tripsRes, shipmentsRes, requestsRes, usersRes, completedTodayRes, unmatchedRes, topCorridorsRes] = await Promise.all([
        supabase.from('trips').select('id, status').eq('status', 'active'),
        supabase.from('shipments').select('id, status').eq('status', 'active'),
        supabase.from('requests').select('id, status').eq('status', 'pending'),
        supabase.from('users').select('id, user_type'),
        supabase.from('trips').select('id, created_at').eq('status', 'completed').gte('created_at', todayIso),
        supabase.from('shipments').select('id').eq('status', 'open'),
        supabase.from('trips').select('origin_city, destination_city').eq('status', 'active'),
      ]);

      // Compute hot corridors (top origin→dest pairs)
      const corridorMap = new Map<string, number>();
      (topCorridorsRes.data || []).forEach((t) => {
        if (t.origin_city && t.destination_city) {
          const key = `${t.origin_city} → ${t.destination_city}`;
          corridorMap.set(key, (corridorMap.get(key) || 0) + 1);
        }
      });
      const hotCorridors = [...corridorMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([route, count]) => ({ route, count }));

      return {
        activeTrips: tripsRes.data?.length ?? 0,
        activeLoads: shipmentsRes.data?.length ?? 0,
        pendingRequests: requestsRes.data?.length ?? 0,
        totalUsers: usersRes.data?.length ?? 0,
        truckers: usersRes.data?.filter((u) => u.user_type === 'trucker').length ?? 0,
        shippers: usersRes.data?.filter((u) => u.user_type === 'shipper').length ?? 0,
        completedToday: completedTodayRes.data?.length ?? 0,
        unmatchedShipments: unmatchedRes.data?.length ?? 0,
        hotCorridors,
      };
    },
    enabled: !!userProfile?.id && userProfile.user_type === 'admin',
    refetchInterval: 30000,
  });

  // Recent events (trips + shipments + requests)
  const { data: events = [] } = useQuery({
    queryKey: ['admin-command-events'],
    queryFn: async () => {
      const token = await getSupabaseToken();
      if (!token) return [];
      const supabase = createClerkSupabaseClient(token);

      const [recentTrips, recentShipments, recentRequests] = await Promise.all([
        supabase
          .from('trips')
          .select('id, origin_city, destination_city, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('shipments')
          .select('id, origin_city, dest_city, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('requests')
          .select('id, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const allEvents: Event[] = [
        ...(recentTrips.data || []).map((t) => ({
          id: `trip-${t.id}`,
          type: 'trip' as const,
          message: `🚛 ${t.origin_city} → ${t.destination_city} (${t.status})`,
          time: new Date(t.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        })),
        ...(recentShipments.data || []).map((s) => ({
          id: `ship-${s.id}`,
          type: 'booking' as const,
          message: `📦 ${s.origin_city} → ${s.dest_city} (${s.status})`,
          time: new Date(s.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        })),
        ...(recentRequests.data || []).map((r) => ({
          id: `req-${r.id}`,
          type: 'alert' as const,
          message: `📩 Request ${r.status}`,
          time: new Date(r.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        })),
      ];

      return allEvents.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 10);
    },
    enabled: !!userProfile?.id && userProfile.user_type === 'admin',
    refetchInterval: 60000,
  });

  // Filter trucks by vehicle type
  const filteredTrucks = useMemo(() => {
    if (vehicleFilter === 'All') return driverLocations;
    return driverLocations.filter((t) => t.vehicle_type === vehicleFilter);
  }, [driverLocations, vehicleFilter]);

  // Active truckers (sharing location within last 5 min)
  const activeTruckers = useMemo(
    () => filteredTrucks.filter((t) => t.trip_id != null),
    [filteredTrucks],
  );

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-green-500 animate-pulse" />
              <h1 className="text-lg font-semibold">Command Center</h1>
            </div>
            <Badge variant="outline" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_TYPES.map((vt) => (
                  <SelectItem key={vt} value={vt}>
                    {vt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchStats()}
              className="h-8"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="shrink-0 grid grid-cols-3 md:grid-cols-6 gap-2 px-4 py-3">
        <Card className="py-2">
          <CardContent className="flex items-center gap-2 px-3">
            <Truck className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-[10px] text-muted-foreground">Trucks</p>
              <p className="text-lg font-bold">{activeTruckers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-2">
          <CardContent className="flex items-center gap-2 px-3">
            <Package className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-[10px] text-muted-foreground">Loads</p>
              <p className="text-lg font-bold">{loads.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-2">
          <CardContent className="flex items-center gap-2 px-3">
            <Activity className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-[10px] text-muted-foreground">In Transit</p>
              <p className="text-lg font-bold">{stats?.activeTrips ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-2">
          <CardContent className="flex items-center gap-2 px-3">
            <Zap className="h-4 w-4 text-amber-500" />
            <div>
              <p className="text-[10px] text-muted-foreground">Pending</p>
              <p className="text-lg font-bold">{stats?.pendingRequests ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-2">
          <CardContent className="flex items-center gap-2 px-3">
            <MapPin className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-[10px] text-muted-foreground">Unmatched</p>
              <p className="text-lg font-bold">{stats?.unmatchedShipments ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-2">
          <CardContent className="flex items-center gap-2 px-3">
            <Clock className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-[10px] text-muted-foreground">Done Today</p>
              <p className="text-lg font-bold">{stats?.completedToday ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Map + Sidebar */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Map */}
        <div className="flex-1 relative">
          <LoadSaathiMap
            trucks={filteredTrucks}
            loads={loads}
            selectedTruckId={selectedTruck?.driver_id}
            selectedLoadId={selectedLoad?.id}
            onTruckClick={setSelectedTruck}
            onLoadClick={setSelectedLoad}
            height="100%"
            showClusters
          />
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-card overflow-y-auto">
          {/* Active Truckers List */}
          <div className="p-3 border-b">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Truck className="h-3.5 w-3.5 text-orange-500" />
              Active Trucks ({activeTruckers.length})
            </h3>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {activeTruckers.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">
                  {locationsLoading ? 'Loading...' : 'No trucks sharing location'}
                </p>
              )}
              {activeTruckers.map((truck) => (
                <button
                  key={truck.driver_id}
                  onClick={() => setSelectedTruck(truck)}
                  className={cn(
                    'w-full text-left px-2 py-1.5 rounded text-xs hover:bg-accent transition-colors',
                    selectedTruck?.driver_id === truck.driver_id && 'bg-accent',
                  )}
                >
                  <p className="font-medium truncate">{truck.driver_name || 'Truck'}</p>
                  <p className="text-muted-foreground truncate">
                    {truck.origin_city && truck.destination_city
                      ? `${truck.origin_city} → ${truck.destination_city}`
                      : truck.vehicle_type || 'Location active'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Active Loads List */}
          <div className="p-3 border-b">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Package className="h-3.5 w-3.5 text-blue-500" />
              Load Demand ({loads.length})
            </h3>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {loads.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">
                  {loadsLoading ? 'Loading...' : 'No active loads'}
                </p>
              )}
              {loads.map((load) => (
                <button
                  key={load.id}
                  onClick={() => setSelectedLoad(load)}
                  className={cn(
                    'w-full text-left px-2 py-1.5 rounded text-xs hover:bg-accent transition-colors',
                    selectedLoad?.id === load.id && 'bg-accent',
                  )}
                >
                  <p className="font-medium truncate">
                    {load.origin_city} → {load.dest_city}
                  </p>
                  <p className="text-muted-foreground truncate">
                    {load.weight_tonnes != null && `${load.weight_tonnes}T`}
                    {load.budget_per_tonne != null && ` • ₹${load.budget_per_tonne}/T`}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Hot Corridors */}
          {stats?.hotCorridors && stats.hotCorridors.length > 0 && (
            <div className="p-3 border-b">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-orange-500" />
                Hot Corridors
              </h3>
              <div className="space-y-1">
                {stats.hotCorridors.map((c, i) => (
                  <div key={i} className="flex items-center justify-between px-2 py-1 text-xs">
                    <span className="truncate flex-1">{c.route}</span>
                    <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">{c.count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Events */}
          <div className="p-3">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-gray-500" />
              Recent Activity
            </h3>
            <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
              {events.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">No recent events</p>
              )}
              {events.map((event) => (
                <div key={event.id} className="px-2 py-1.5 text-xs border-b last:border-0">
                  <p className="truncate">{event.message}</p>
                  <p className="text-muted-foreground">{event.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
