import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { useLiveDriverLocations } from '@/hooks/useLiveDriverLocations';
import { useLiveLoadLocations } from '@/hooks/useLiveLoadLocations';
import type { TruckLocation } from '@/components/maps/TruckMarker';
import type { LoadLocation } from '@/components/maps/LoadMarker';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Radio, Zap, RefreshCw, Truck, Package, Activity, Clock, TrendingUp,
  MapPin, AlertTriangle, IndianRupee, Navigation, LayoutDashboard,
  Users, Shield, FileText, Image, Key, BarChart3, MessageSquare,
  ChevronRight, CircleDollarSign, Receipt, UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CommandCenterMap from './CommandCenterMap';
import SidebarDrawer from './SidebarDrawer';
import KPICard from './KPICard';
import TripDetailPanel from './TripDetailPanel';
import { SkeletonCard } from './SkeletonCard';
import type { StatsData, TrendData } from './types';
import type { RouteTrip, RouteShipment } from './CommandCenterMap';

const VEHICLE_TYPES = ['All', 'Mini Truck', 'Tata Ace', 'Tempo', '10 MT', '16 MT', '20 MT', 'Container'];

const ADMIN_NAV = [
  { label: 'Overview', path: '/admin/analytics', icon: LayoutDashboard },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Moderation', path: '/admin/moderation', icon: Shield },
  { label: 'Audit Log', path: '/admin/audit', icon: FileText },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Gallery', path: '/admin/gallery', icon: Image },
  { label: 'API Keys', path: '/admin/api-keys', icon: Key },
  { label: 'Messages', path: '/messages', icon: MessageSquare },
];

export default function CommandCenterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, getSupabaseToken } = useAuth();
  const { driverLocations, isLoading: locationsLoading } = useLiveDriverLocations();
  const { loads, isLoading: loadsLoading } = useLiveLoadLocations();

  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [selectedTruck, setSelectedTruck] = useState<TruckLocation | null>(null);
  const [selectedLoad, setSelectedLoad] = useState<LoadLocation | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mapLayers] = useState({ trucks: true, loads: true, routes: true, heatmap: false, corridors: true });

  const filteredTrucks = useMemo(() => {
    if (vehicleFilter === 'All') return driverLocations;
    return driverLocations.filter((t) => t.vehicle_type === vehicleFilter);
  }, [driverLocations, vehicleFilter]);

  const activeTruckers = useMemo(() => filteredTrucks.filter((t) => t.trip_id != null), [filteredTrucks]);

  const { data: routeData } = useQuery<{ trips: RouteTrip[]; shipments: RouteShipment[] }>({
    queryKey: ['admin-command-routes'],
    queryFn: async () => {
      const token = await getSupabaseToken();
      if (!token) return { trips: [], shipments: [] };
      const supabase = createClerkSupabaseClient(token);
      const [tripsRes, shipmentsRes] = await Promise.all([
        supabase.from('trips').select('id, origin_city, destination_city, status, origin_lat, origin_lng, destination_lat, destination_lng').eq('status', 'active').limit(50),
        supabase.from('shipments').select('id, origin_city, destination_city, status, origin_lat, origin_lng, destination_lat, destination_lng').eq('status', 'active').limit(50),
      ]);
      return { trips: tripsRes.data ?? [], shipments: shipmentsRes.data ?? [] };
    },
    enabled: !!userProfile?.id && userProfile.user_type === 'admin',
    refetchInterval: 60000,
  });

  const { data: stats, refetch: refetchStats, isLoading: statsLoading } = useQuery<StatsData | null>({
    queryKey: ['admin-command-stats'],
    queryFn: async (): Promise<StatsData | null> => {
      const token = await getSupabaseToken();
      if (!token) return null;
      const supabase = createClerkSupabaseClient(token);
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayIso = todayStart.toISOString();
      const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const yesterdayIso = yesterdayStart.toISOString();

      const [tripsRes, shipmentsRes, requestsRes, usersRes, completedTodayRes, unmatchedRes, topCorridorsRes, leadsRes, todayRevenueRes, yesterdayRevenueRes] = await Promise.all([
        supabase.from('trips').select('id, status').eq('status', 'active'),
        supabase.from('shipments').select('id, status').eq('status', 'active'),
        supabase.from('requests').select('id, status, weight_tonnes, trip:trips(price_per_tonne)').eq('status', 'pending'),
        supabase.from('users').select('id, user_type'),
        supabase.from('trips').select('id, created_at').eq('status', 'completed').gte('created_at', todayIso),
        supabase.from('shipments').select('id').eq('status', 'open'),
        supabase.from('trips').select('origin_city, destination_city').eq('status', 'active'),
        supabase.from('leads').select('id').gte('created_at', todayIso),
        supabase.from('requests').select('weight_tonnes, trip:trips(price_per_tonne)').eq('status', 'accepted').gte('created_at', todayIso),
        supabase.from('requests').select('weight_tonnes, trip:trips(price_per_tonne)').eq('status', 'accepted').gte('created_at', yesterdayIso).lt('created_at', todayIso),
      ]);

      const corridorMap = new Map<string, number>();
      (topCorridorsRes.data || []).forEach((t) => { if (t.origin_city && t.destination_city) { const key = `${t.origin_city} -> ${t.destination_city}`; corridorMap.set(key, (corridorMap.get(key) || 0) + 1); } });
      const hotCorridors = [...corridorMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([route, count]) => ({ route, count }));
      const calcRevenue = (reqs: { weight_tonnes: number; trip?: { price_per_tonne: number }[] | { price_per_tonne: number } }[]) => reqs.reduce((sum: number, r) => { const p = Array.isArray(r.trip) ? r.trip[0]?.price_per_tonne : (r.trip as { price_per_tonne?: number })?.price_per_tonne; return sum + (r.weight_tonnes * (p || 0)); }, 0);

      return { activeTrips: tripsRes.data?.length ?? 0, activeLoads: shipmentsRes.data?.length ?? 0, pendingRequests: requestsRes.data?.length ?? 0, totalUsers: usersRes.data?.length ?? 0, truckers: usersRes.data?.filter((u) => u.user_type === 'trucker').length ?? 0, shippers: usersRes.data?.filter((u) => u.user_type === 'shipper').length ?? 0, completedToday: completedTodayRes.data?.length ?? 0, unmatchedShipments: unmatchedRes.data?.length ?? 0, todayLeads: leadsRes.data?.length ?? 0, hotCorridors, todayRevenue: calcRevenue(todayRevenueRes.data || []), yesterdayRevenue: calcRevenue(yesterdayRevenueRes.data || []), pendingRevenue: (requestsRes.data || []).reduce((sum: number, r) => { const p = Array.isArray(r.trip) ? r.trip[0]?.price_per_tonne : (r.trip as { price_per_tonne?: number })?.price_per_tonne; return sum + (r.weight_tonnes * (p || 0)); }, 0) };
    },
    enabled: !!userProfile?.id && userProfile.user_type === 'admin',
    refetchInterval: 30000,
  });

  // Fetch cumulative/lifetime financial data
  const { data: financials } = useQuery({
    queryKey: ['admin-command-financials'],
    queryFn: async () => {
      const token = await getSupabaseToken();
      if (!token) return null;
      const supabase = createClerkSupabaseClient(token);
      const [acceptedRes, pendingRes, completedTripsRes, totalLeadsRes] = await Promise.all([
        supabase.from('requests').select('weight_tonnes, trip:trips(price_per_tonne)').eq('status', 'accepted'),
        supabase.from('requests').select('weight_tonnes, trip:trips(price_per_tonne)').eq('status', 'pending'),
        supabase.from('trips').select('id').eq('status', 'completed'),
        supabase.from('leads').select('id', { count: 'exact', head: true }),
      ]);
      const totalRevenue = ((acceptedRes.data || []) as Array<{ weight_tonnes: number; trip?: { price_per_tonne: number }[] | { price_per_tonne: number } }>).reduce((sum, r) => { const p = Array.isArray(r.trip) ? r.trip[0]?.price_per_tonne : (r.trip as { price_per_tonne?: number })?.price_per_tonne; return sum + (r.weight_tonnes * (p || 0)); }, 0);
      const pendingRevenue = ((pendingRes.data || []) as Array<{ weight_tonnes: number; trip?: { price_per_tonne: number }[] | { price_per_tonne: number } }>).reduce((sum, r) => { const p = Array.isArray(r.trip) ? r.trip[0]?.price_per_tonne : (r.trip as { price_per_tonne?: number })?.price_per_tonne; return sum + (r.weight_tonnes * (p || 0)); }, 0);
      return {
        totalRevenue,
        pendingRevenue,
        totalTransactions: acceptedRes.data?.length ?? 0,
        completedTrips: completedTripsRes.data?.length ?? 0,
        totalLeads: totalLeadsRes.count ?? 0,
      };
    },
    enabled: !!userProfile?.id && userProfile.user_type === 'admin',
    refetchInterval: 120000,
  });

  const { data: trendData } = useQuery<TrendData | null>({
    queryKey: ['admin-command-trends'],
    queryFn: async (): Promise<TrendData | null> => {
      const token = await getSupabaseToken();
      if (!token) return null;
      const supabase = createClerkSupabaseClient(token);
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
        const e = new Date(d); e.setDate(e.getDate() + 1);
        const [trucksR, loadsR, leadsR, tripsR, pendingR, unmatchedR, completedR, revenueR] = await Promise.all([
          supabase.from('driver_locations').select('id', { count: 'exact', head: true }).gte('last_seen_at', d.toISOString()).lt('last_seen_at', e.toISOString()),
          supabase.from('load_locations').select('id', { count: 'exact', head: true }).eq('status', 'active').gte('created_at', d.toISOString()).lt('created_at', e.toISOString()),
          supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', d.toISOString()).lt('created_at', e.toISOString()),
          supabase.from('trips').select('id', { count: 'exact', head: true }).eq('status', 'active').gte('created_at', d.toISOString()).lt('created_at', e.toISOString()),
          supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'pending').gte('created_at', d.toISOString()).lt('created_at', e.toISOString()),
          supabase.from('shipments').select('id', { count: 'exact', head: true }).eq('status', 'open').gte('created_at', d.toISOString()).lt('created_at', e.toISOString()),
          supabase.from('trips').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('created_at', d.toISOString()).lt('created_at', e.toISOString()),
          supabase.from('requests').select('weight_tonnes, trip:trips(price_per_tonne)').eq('status', 'accepted').gte('created_at', d.toISOString()).lt('created_at', e.toISOString()),
        ]);
        const revenue = (revenueR.data || []).reduce((sum: number, r: { weight_tonnes: number; trip?: { price_per_tonne: number }[] | { price_per_tonne: number } }) => { const p = Array.isArray(r.trip) ? r.trip[0]?.price_per_tonne : (r.trip as { price_per_tonne?: number })?.price_per_tonne; return sum + (r.weight_tonnes * (p || 0)); }, 0);
        days.push({ trucks: trucksR.count ?? 0, loads: loadsR.count ?? 0, leads: leadsR.count ?? 0, trips: tripsR.count ?? 0, pending: pendingR.count ?? 0, unmatched: unmatchedR.count ?? 0, completed: completedR.count ?? 0, revenue });
      }
      return { trucks: days.map((d) => d.trucks), loads: days.map((d) => d.loads), leads: days.map((d) => d.leads), trips: days.map((d) => d.trips), pending: days.map((d) => d.pending), unmatched: days.map((d) => d.unmatched), completed: days.map((d) => d.completed), revenue: days.map((d) => d.revenue) };
    },
    enabled: !!userProfile?.id && userProfile.user_type === 'admin',
    refetchInterval: 300000,
  });

  const trends = useMemo<TrendData>(() => trendData ?? { trucks: [0,0,0,0,0,0,0], loads: [0,0,0,0,0,0,0], leads: [0,0,0,0,0,0,0], trips: [0,0,0,0,0,0,0], pending: [0,0,0,0,0,0,0], unmatched: [0,0,0,0,0,0,0], completed: [0,0,0,0,0,0,0], revenue: [0,0,0,0,0,0,0] }, [trendData]);

  const alerts = useMemo(() => {
    const list: string[] = [];
    if (stats && stats.unmatchedShipments > 5) list.push(`${stats.unmatchedShipments} unmatched loads`);
    if (stats && stats.pendingRequests > 3) list.push(`${stats.pendingRequests} pending requests`);
    if (activeTruckers.length === 0 && !locationsLoading) list.push('No active trucks online');
    return list;
  }, [stats, activeTruckers.length, locationsLoading]);

  return (
    <div className="h-dvh flex flex-col bg-gray-50 text-gray-900 overflow-hidden">
      {/* Top Bar */}
      <header className="shrink-0 border-b border-gray-200 bg-white px-4 py-2.5 flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
              <Radio className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-base font-bold tracking-tight">Command Center</h1>
          </div>
          <Badge className="text-[10px] h-5 bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
            <Zap className="h-2.5 w-2.5 mr-0.5" />Live
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-[110px] h-8 text-xs border-gray-200 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VEHICLE_TYPES.map((vt) => <SelectItem key={vt} value={vt}>{vt}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200" onClick={() => refetchStats()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', sidebarOpen && 'rotate-180')} />
          </Button>
        </div>
      </header>

      {/* Dynamic Admin Nav */}
      <nav className="shrink-0 border-b border-gray-200 bg-white px-2 py-1.5 flex items-center gap-1 overflow-x-auto">
        {ADMIN_NAV.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button key={item.path} onClick={() => navigate(item.path)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap', isActive ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')}>
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* KPI Cards - Row 1: Operations */}
      <div className="shrink-0 px-4 py-2 grid grid-cols-3 md:grid-cols-6 gap-2">
        {statsLoading && !stats ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} className="min-h-[64px]" />) : (
          <>
            <KPICard icon={<Truck className="h-3.5 w-3.5" />} label="Trucks" value={activeTruckers.length} trend={trends.trucks} color="orange" loading={statsLoading} compact />
            <KPICard icon={<Package className="h-3.5 w-3.5" />} label="Loads" value={stats?.activeLoads ?? 0} trend={trends.loads} color="blue" loading={statsLoading} compact />
            <KPICard icon={<Activity className="h-3.5 w-3.5" />} label="In Transit" value={stats?.activeTrips ?? 0} trend={trends.trips} color="green" loading={statsLoading} compact />
            <KPICard icon={<Clock className="h-3.5 w-3.5" />} label="Pending" value={stats?.pendingRequests ?? 0} trend={trends.pending} color="amber" loading={statsLoading} compact />
            <KPICard icon={<MapPin className="h-3.5 w-3.5" />} label="Unmatched" value={stats?.unmatchedShipments ?? 0} trend={trends.unmatched} color="purple" loading={statsLoading} compact />
            <KPICard icon={<UserCheck className="h-3.5 w-3.5" />} label="Leads" value={stats?.todayLeads ?? 0} trend={trends.leads} color="blue" loading={statsLoading} compact />
          </>
        )}
      </div>

      {/* KPI Cards - Row 2: Financial */}
      <div className="shrink-0 px-4 pb-2 grid grid-cols-2 md:grid-cols-4 gap-2">
        <KPICard icon={<IndianRupee className="h-3.5 w-3.5" />} label="Today" value={`₹${((stats?.todayRevenue ?? 0) / 1000).toFixed(1)}K`} trend={trends.revenue} color="emerald" loading={statsLoading} compact />
        <KPICard icon={<CircleDollarSign className="h-3.5 w-3.5" />} label="Total Revenue" value={`₹${((financials?.totalRevenue ?? 0) / 1000).toFixed(1)}K`} trend={trends.revenue} color="green" loading={!financials} compact />
        <KPICard icon={<Receipt className="h-3.5 w-3.5" />} label="Pending Value" value={`₹${((financials?.pendingRevenue ?? 0) / 1000).toFixed(1)}K`} trend={[]} color="amber" loading={!financials} compact />
        <KPICard icon={<TrendingUp className="h-3.5 w-3.5" />} label="Transactions" value={financials?.totalTransactions ?? 0} trend={[]} color="blue" loading={!financials} compact />
      </div>

      {/* Main: Map + Sidebar */}
      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 relative">
          <CommandCenterMap
            trucks={mapLayers.trucks ? filteredTrucks : []}
            loads={mapLayers.loads ? loads : []}
            showRoutes={mapLayers.routes}
            showHeatmap={mapLayers.heatmap}
            showCorridors={mapLayers.corridors}
            selectedTruckId={selectedTruck?.driver_id}
            selectedLoadId={selectedLoad?.id}
            onTruckClick={setSelectedTruck}
            onLoadClick={setSelectedLoad}
            hotCorridors={stats?.hotCorridors ?? []}
            trips={routeData?.trips ?? []}
            shipments={routeData?.shipments ?? []}
          />
          {/* Map Stats Overlay */}
          <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2">
            <div className="bg-white/95 border border-gray-200 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
              <Navigation className="h-3 w-3 text-orange-500" />
              <span className="text-[11px] font-semibold text-gray-700">{filteredTrucks.length} trucks</span>
            </div>
            <div className="bg-white/95 border border-gray-200 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
              <Package className="h-3 w-3 text-blue-500" />
              <span className="text-[11px] font-semibold text-gray-700">{loads.length} loads</span>
            </div>
            {alerts.length > 0 && (
              <div className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="text-[11px] font-semibold text-red-600">{alerts.length} alert{alerts.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {sidebarOpen && (
          <SidebarDrawer
            activeTruckers={activeTruckers}
            loads={loads}
            stats={stats ?? null}
            trends={trends}
            hotCorridors={stats?.hotCorridors ?? []}
            locationsLoading={locationsLoading}
            loadsLoading={loadsLoading}
            statsLoading={statsLoading}
            expandedSections={new Set(['trucks', 'loads', 'matches'])}
            onToggleSection={() => {}}
            onTruckClick={setSelectedTruck}
            onLoadClick={setSelectedLoad}
            onMatch={(tid, lid) => console.log('[Match]', tid, lid)}
          />
        )}
      </div>

      {/* Detail Panel */}
      {(selectedTruck || selectedLoad) && (
        <TripDetailPanel
          selectedTruck={selectedTruck}
          selectedLoad={selectedLoad}
          onClose={() => { setSelectedTruck(null); setSelectedLoad(null); }}
          onContact={(id) => console.log('[Contact]', id)}
          onFlag={(id) => console.log('[Flag]', id)}
        />
      )}
    </div>
  );
}
