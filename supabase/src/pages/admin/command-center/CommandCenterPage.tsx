import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { useLiveDriverLocations } from '@/hooks/useLiveDriverLocations';
import { useLiveLoadLocations } from '@/hooks/useLiveLoadLocations';
import { useRealtimeInvalidate } from '@/hooks/useRealtimeInvalidate';
import { isTruckInTransit } from '@/components/maps/TruckMarker';
import type { TruckLocation } from '@/components/maps/TruckMarker';
import type { LoadLocation } from '@/components/maps/LoadMarker';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Radio,
  RefreshCw,
  Bot,
  Truck,
  Package,
  Activity,
  Clock,
  TrendingUp,
  MapPin,
  AlertTriangle,
  IndianRupee,
  Navigation,
  BarChart3,
  ChevronRight,
  CircleDollarSign,
  Receipt,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CommandCenterMap from './CommandCenterMap';
import type { RouteTrip, RouteShipment } from './CommandCenterMap';
import CommandRail from './CommandRail';
import AgentOrgPanel from './AgentOrgPanel';
import KPICard from './KPICard';
import type { KPITone } from './KPICard';
import AlertPanel from './AlertPanel';
import TripDetailPanel from './TripDetailPanel';
import { SkeletonCard } from './SkeletonCard';
import { deriveAlerts } from './alerts';
import { useAdminEventFeed } from './useAdminEventFeed';
import type { StatsData, TrendData } from './types';

const VEHICLE_TYPES = ['All', 'Mini Truck', 'Tata Ace', 'Tempo', '10 MT', '16 MT', '20 MT', 'Container'];

const STALE_GPS_MS = 15 * 60 * 1000;
const HIGH_VALUE_THRESHOLD = 50000;

const EMPTY_TRENDS: TrendData = {
  trucks: [0, 0, 0, 0, 0, 0, 0],
  loads: [0, 0, 0, 0, 0, 0, 0],
  leads: [0, 0, 0, 0, 0, 0, 0],
  trips: [0, 0, 0, 0, 0, 0, 0],
  pending: [0, 0, 0, 0, 0, 0, 0],
  unmatched: [0, 0, 0, 0, 0, 0, 0],
  completed: [0, 0, 0, 0, 0, 0, 0],
  revenue: [0, 0, 0, 0, 0, 0, 0],
};

const MOBILE_TABS = [
  { key: 'map', label: 'Map', icon: MapPin },
  { key: 'metrics', label: 'Metrics', icon: BarChart3 },
  { key: 'feed', label: 'Feed', icon: Radio },
] as const;

type MobileTab = (typeof MOBILE_TABS)[number]['key'];

// ── Revenue helpers ──────────────────────────────────────────────
// `requests.trip` comes back as an embedded relation whose shape depends on
// whether PostgREST treats it as to-one (object) or to-many (array).
type RevenueRow = {
  weight_tonnes: number | null;
  trip?: { price_per_tonne: number }[] | { price_per_tonne: number } | null;
};

function revenueOf(row: RevenueRow): number {
  const trip = row.trip;
  const price = Array.isArray(trip) ? trip[0]?.price_per_tonne : trip?.price_per_tonne;
  return (row.weight_tonnes ?? 0) * (price ?? 0);
}

// ── Trend bucketing ──────────────────────────────────────────────
function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function lastSevenDayKeys(): string[] {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(localDayKey(d));
  }
  return keys;
}

function countByDay(rows: Array<{ at?: string | null }>, keys: string[]): number[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (!row.at) continue;
    const k = localDayKey(new Date(row.at));
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return keys.map((k) => map.get(k) ?? 0);
}

function sumByDay(rows: Array<{ at?: string | null; value: number }>, keys: string[]): number[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (!row.at) continue;
    const k = localDayKey(new Date(row.at));
    map.set(k, (map.get(k) ?? 0) + row.value);
  }
  return keys.map((k) => map.get(k) ?? 0);
}

/** Busiest 2-hour band of the day, e.g. "10-12". */
function computePeakHour(timestamps: Array<string | null | undefined>): string {
  const bands = new Array<number>(12).fill(0);
  let total = 0;
  for (const ts of timestamps) {
    if (!ts) continue;
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) continue;
    const band = Math.floor(d.getHours() / 2);
    bands[band] = (bands[band] ?? 0) + 1;
    total += 1;
  }
  if (total === 0) return '—';
  let best = 0;
  for (let i = 1; i < bands.length; i++) {
    if ((bands[i] ?? 0) > (bands[best] ?? 0)) best = i;
  }
  const start = best * 2;
  return `${String(start).padStart(2, '0')}-${String(start + 2).padStart(2, '0')}`;
}

function timeAgoFrom(now: number, at: number): string {
  if (!at) return '—';
  const secs = Math.max(0, Math.round((now - at) / 1000));
  if (secs < 5) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function CommandCenterPage() {
  const { userProfile, getSupabaseToken } = useAuth();
  const isAdmin = userProfile?.user_type === 'admin';

  const { driverLocations, isLoading: locationsLoading, refetch: refetchLocations } =
    useLiveDriverLocations();
  const { loads, isLoading: loadsLoading, refetch: refetchLoads } = useLiveLoadLocations();

  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [selectedTruck, setSelectedTruck] = useState<TruckLocation | null>(null);
  const [selectedLoad, setSelectedLoad] = useState<LoadLocation | null>(null);
  const [railOpen, setRailOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>('map');
  // AI Agents view: a static org chart overlay on the map pane. Opening it
  // also forces the map tab so the overlay is visible on small screens.
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    // Open the sections that represent live operational state by default — the
    // rail should read as a status board, not a list of closed drawers.
    () => new Set(['alerts', 'feed', 'onTrip', 'loads']),
  );
  const [now, setNow] = useState(() => Date.now());

  // 1s heartbeat so "updated Xs ago" and waiting-time alerts keep ticking.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Push-driven refresh: any write to the operational tables invalidates the
  // command-center queries, so the board updates on change instead of only on
  // the polling interval.
  useRealtimeInvalidate(
    'admin-command-live',
    ['trips', 'shipments', 'requests', 'leads'],
    [['admin-command-stats'], ['admin-command-financials'], ['admin-command-routes']],
  );

  const events = useAdminEventFeed(isAdmin);

  // ── Derived truck groupings ────────────────────────────────────
  const filteredTrucks = useMemo(
    () =>
      vehicleFilter === 'All'
        ? driverLocations
        : driverLocations.filter((t) => t.vehicle_type === vehicleFilter),
    [driverLocations, vehicleFilter],
  );

  const onTripTrucks = useMemo(() => filteredTrucks.filter(isTruckInTransit), [filteredTrucks]);
  const idleTrucks = useMemo(
    () => filteredTrucks.filter((t) => !isTruckInTransit(t)),
    [filteredTrucks],
  );

  const staleTrucks = useMemo(() => {
    const cutoff = now - STALE_GPS_MS;
    return driverLocations.filter((t) => {
      const ts = new Date(t.last_seen_at).getTime();
      return Number.isFinite(ts) && ts < cutoff;
    }).length;
  }, [driverLocations, now]);

  const oldestWaitingLoadMins = useMemo(() => {
    let oldest: number | null = null;
    for (const load of loads) {
      const ts = new Date(load.created_at).getTime();
      if (!Number.isFinite(ts)) continue;
      const mins = Math.floor((now - ts) / 60000);
      if (oldest == null || mins > oldest) oldest = mins;
    }
    return oldest;
  }, [loads, now]);

  const highValueLoads = useMemo(
    () =>
      loads.filter(
        (l) => (l.weight_tonnes ?? 0) * (l.budget_per_tonne ?? 0) > HIGH_VALUE_THRESHOLD,
      ).length,
    [loads],
  );

  // ── Queries ────────────────────────────────────────────────────
  const { data: routeData, refetch: refetchRoutes } = useQuery<{
    trips: RouteTrip[];
    shipments: RouteShipment[];
  }>({
    queryKey: ['admin-command-routes'],
    queryFn: async () => {
      const token = await getSupabaseToken();
      if (!token) return { trips: [], shipments: [] };
      const supabase = createClerkSupabaseClient(token);
      const [tripsRes, shipmentsRes] = await Promise.all([
        supabase
          .from('trips')
          .select(
            'id, origin_city, destination_city, status, origin_lat, origin_lng, destination_lat, destination_lng',
          )
          .eq('status', 'active')
          .limit(50),
        supabase
          .from('shipments')
          .select(
            'id, origin_city, destination_city, status, origin_lat, origin_lng, destination_lat, destination_lng',
          )
          .eq('status', 'active')
          .limit(50),
      ]);
      return { trips: tripsRes.data ?? [], shipments: shipmentsRes.data ?? [] };
    },
    enabled: isAdmin,
    refetchInterval: 60000,
  });

  const {
    data: stats,
    refetch: refetchStats,
    isLoading: statsLoading,
    dataUpdatedAt: statsUpdatedAt,
  } = useQuery<StatsData | null>({
    queryKey: ['admin-command-stats'],
    queryFn: async (): Promise<StatsData | null> => {
      const token = await getSupabaseToken();
      if (!token) return null;
      const supabase = createClerkSupabaseClient(token);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayIso = todayStart.toISOString();
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const yesterdayIso = yesterdayStart.toISOString();

      const [
        tripsRes,
        shipmentsRes,
        requestsRes,
        usersRes,
        completedTodayRes,
        unmatchedRes,
        topCorridorsRes,
        leadsRes,
        todayRevenueRes,
        yesterdayRevenueRes,
        todaysTripsRes,
      ] = await Promise.all([
        supabase.from('trips').select('id, status').eq('status', 'active'),
        supabase.from('shipments').select('id, status').eq('status', 'active'),
        supabase
          .from('requests')
          .select('id, status, weight_tonnes, trip:trips(price_per_tonne)')
          .eq('status', 'pending'),
        supabase.from('users').select('id, user_type'),
        supabase.from('trips').select('id, created_at').eq('status', 'completed').gte('created_at', todayIso),
        supabase.from('shipments').select('id').eq('status', 'open'),
        supabase.from('trips').select('origin_city, destination_city').eq('status', 'active'),
        supabase.from('leads').select('id').gte('created_at', todayIso),
        supabase
          .from('requests')
          .select('weight_tonnes, trip:trips(price_per_tonne)')
          .eq('status', 'accepted')
          .gte('created_at', todayIso),
        supabase
          .from('requests')
          .select('weight_tonnes, trip:trips(price_per_tonne)')
          .eq('status', 'accepted')
          .gte('created_at', yesterdayIso)
          .lt('created_at', todayIso),
        supabase.from('trips').select('created_at').gte('created_at', todayIso),
      ]);

      const corridorMap = new Map<string, number>();
      (topCorridorsRes.data || []).forEach((t) => {
        if (t.origin_city && t.destination_city) {
          const key = `${t.origin_city} -> ${t.destination_city}`;
          corridorMap.set(key, (corridorMap.get(key) || 0) + 1);
        }
      });
      const hotCorridors = [...corridorMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([route, count]) => ({ route, count }));

      const todayRevenueRows = (todayRevenueRes.data ?? []) as RevenueRow[];
      const yesterdayRevenueRows = (yesterdayRevenueRes.data ?? []) as RevenueRow[];
      const pendingRows = (requestsRes.data ?? []) as RevenueRow[];

      return {
        activeTrips: tripsRes.data?.length ?? 0,
        activeLoads: shipmentsRes.data?.length ?? 0,
        pendingRequests: requestsRes.data?.length ?? 0,
        totalUsers: usersRes.data?.length ?? 0,
        truckers: usersRes.data?.filter((u) => u.user_type === 'trucker').length ?? 0,
        shippers: usersRes.data?.filter((u) => u.user_type === 'shipper').length ?? 0,
        completedToday: completedTodayRes.data?.length ?? 0,
        unmatchedShipments: unmatchedRes.data?.length ?? 0,
        // Loads that found a match today = accepted requests created today.
        matchedLoads: todayRevenueRows.length,
        todayLeads: leadsRes.data?.length ?? 0,
        hotCorridors,
        todayRevenue: todayRevenueRows.reduce((sum, r) => sum + revenueOf(r), 0),
        yesterdayRevenue: yesterdayRevenueRows.reduce((sum, r) => sum + revenueOf(r), 0),
        pendingRevenue: pendingRows.reduce((sum, r) => sum + revenueOf(r), 0),
        peakHour: computePeakHour((todaysTripsRes.data ?? []).map((r) => r.created_at)),
      };
    },
    enabled: isAdmin,
    refetchInterval: 60000,
  });

  const { data: financials, refetch: refetchFinancials } = useQuery({
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
      const acceptedRows = (acceptedRes.data ?? []) as RevenueRow[];
      const pendingRows = (pendingRes.data ?? []) as RevenueRow[];
      return {
        totalRevenue: acceptedRows.reduce((sum, r) => sum + revenueOf(r), 0),
        pendingRevenue: pendingRows.reduce((sum, r) => sum + revenueOf(r), 0),
        totalTransactions: acceptedRows.length,
        completedTrips: completedTripsRes.data?.length ?? 0,
        totalLeads: totalLeadsRes.count ?? 0,
      };
    },
    enabled: isAdmin,
    refetchInterval: 120000,
  });

  // 7-day trends. One ranged query per metric (7 total) bucketed client-side —
  // replaces the previous ~56 sequential per-day count requests.
  const { data: trendData } = useQuery<TrendData | null>({
    queryKey: ['admin-command-trends'],
    queryFn: async (): Promise<TrendData | null> => {
      const token = await getSupabaseToken();
      if (!token) return null;
      const supabase = createClerkSupabaseClient(token);
      const keys = lastSevenDayKeys();
      const weekIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [trucksRes, loadsRes, leadsRes, tripsRes, requestsRes, shipmentsRes, revenueRes] =
        await Promise.all([
          supabase.from('driver_locations').select('last_seen_at').gte('last_seen_at', weekIso),
          supabase.from('load_locations').select('created_at, status').gte('created_at', weekIso),
          supabase.from('leads').select('created_at').gte('created_at', weekIso),
          supabase.from('trips').select('created_at, status').gte('created_at', weekIso),
          supabase.from('requests').select('created_at, status').gte('created_at', weekIso),
          supabase.from('shipments').select('created_at, status').gte('created_at', weekIso),
          supabase
            .from('requests')
            .select('created_at, weight_tonnes, trip:trips(price_per_tonne)')
            .eq('status', 'accepted')
            .gte('created_at', weekIso),
        ]);

      const tripRows = (tripsRes.data ?? []) as Array<{ created_at: string; status: string }>;
      const revenueRows = (revenueRes.data ?? []) as Array<RevenueRow & { created_at: string }>;

      return {
        trucks: countByDay(
          (trucksRes.data ?? []).map((r) => ({ at: r.last_seen_at })),
          keys,
        ),
        loads: countByDay(
          (loadsRes.data ?? [])
            .filter((r) => r.status === 'active')
            .map((r) => ({ at: r.created_at })),
          keys,
        ),
        leads: countByDay(
          (leadsRes.data ?? []).map((r) => ({ at: r.created_at })),
          keys,
        ),
        trips: countByDay(
          tripRows.filter((r) => r.status === 'active').map((r) => ({ at: r.created_at })),
          keys,
        ),
        pending: countByDay(
          (requestsRes.data ?? [])
            .filter((r) => r.status === 'pending')
            .map((r) => ({ at: r.created_at })),
          keys,
        ),
        unmatched: countByDay(
          (shipmentsRes.data ?? [])
            .filter((r) => r.status === 'open')
            .map((r) => ({ at: r.created_at })),
          keys,
        ),
        completed: countByDay(
          tripRows.filter((r) => r.status === 'completed').map((r) => ({ at: r.created_at })),
          keys,
        ),
        revenue: sumByDay(
          revenueRows.map((r) => ({ at: r.created_at, value: revenueOf(r) })),
          keys,
        ),
      };
    },
    enabled: isAdmin,
    refetchInterval: 300000,
  });

  const trends = trendData ?? EMPTY_TRENDS;

  // ── Alerts ─────────────────────────────────────────────────────
  const alerts = useMemo(
    () =>
      deriveAlerts({
        activeTrucks: driverLocations.length,
        idleTrucks: idleTrucks.length,
        staleTrucks,
        unmatchedShipments: stats?.unmatchedShipments ?? 0,
        pendingRequests: stats?.pendingRequests ?? 0,
        oldestWaitingLoadMins,
        highValueLoads,
      }),
    [
      driverLocations.length,
      idleTrucks.length,
      staleTrucks,
      stats?.unmatchedShipments,
      stats?.pendingRequests,
      oldestWaitingLoadMins,
      highValueLoads,
    ],
  );
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;

  // ── Rail interaction ───────────────────────────────────────────
  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const openSection = useCallback((key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setRailOpen(true);
    setMobileTab('feed');
  }, []);

  const handleTruckClick = useCallback((truck: TruckLocation) => {
    setSelectedTruck(truck);
    setSelectedLoad(null);
  }, []);

  const handleLoadClick = useCallback((load: LoadLocation) => {
    setSelectedLoad(load);
    setSelectedTruck(null);
  }, []);

  const handleRefresh = useCallback(() => {
    void refetchStats();
    void refetchFinancials();
    void refetchRoutes();
    void refetchLocations();
    void refetchLoads();
  }, [refetchStats, refetchFinancials, refetchRoutes, refetchLocations, refetchLoads]);

  const updatedAgo = timeAgoFrom(now, statsUpdatedAt);

  // ── KPI strip ──────────────────────────────────────────────────
  // One spec list rendered either as a dense single-row strip (desktop) or as
  // cards in the mobile Metrics tab, so the two views can never drift apart.
  const kpiLoading = statsLoading && !stats;

  const kpiSpecs: Array<{
    key: string;
    icon: React.ReactNode;
    label: string;
    value: number | string;
    trend?: number[];
    color: string;
    tone: KPITone;
    hint?: string;
    loading: boolean;
    section: string;
  }> = [
    {
      key: 'trucks',
      icon: <Truck className="h-3.5 w-3.5" />,
      label: 'Trucks',
      value: driverLocations.length,
      trend: trends.trucks,
      color: 'orange',
      tone: driverLocations.length === 0 ? 'bad' : 'good',
      hint: `${idleTrucks.length} idle`,
      loading: locationsLoading,
      section: 'onTrip',
    },
    {
      key: 'loads',
      icon: <Package className="h-3.5 w-3.5" />,
      label: 'Loads',
      value: stats?.activeLoads ?? 0,
      trend: trends.loads,
      color: 'blue',
      tone: 'default',
      loading: statsLoading,
      section: 'loads',
    },
    {
      key: 'inTransit',
      icon: <Activity className="h-3.5 w-3.5" />,
      label: 'In Transit',
      value: stats?.activeTrips ?? 0,
      trend: trends.trips,
      color: 'green',
      tone: 'info',
      loading: statsLoading,
      section: 'onTrip',
    },
    {
      key: 'pending',
      icon: <Clock className="h-3.5 w-3.5" />,
      label: 'Pending',
      value: stats?.pendingRequests ?? 0,
      trend: trends.pending,
      color: 'amber',
      tone: (stats?.pendingRequests ?? 0) >= 4 ? 'warn' : 'default',
      hint: `${highValueLoads} high-value`,
      loading: statsLoading,
      section: 'matches',
    },
    {
      key: 'unmatched',
      icon: <MapPin className="h-3.5 w-3.5" />,
      label: 'Unmatched',
      value: stats?.unmatchedShipments ?? 0,
      trend: trends.unmatched,
      color: 'purple',
      tone:
        (stats?.unmatchedShipments ?? 0) >= 5
          ? 'bad'
          : (stats?.unmatchedShipments ?? 0) > 0
            ? 'warn'
            : 'good',
      hint: oldestWaitingLoadMins != null ? `oldest ${oldestWaitingLoadMins}m` : undefined,
      loading: statsLoading,
      section: 'loads',
    },
    {
      key: 'leads',
      icon: <UserCheck className="h-3.5 w-3.5" />,
      label: 'Leads Today',
      value: stats?.todayLeads ?? 0,
      trend: trends.leads,
      color: 'blue',
      tone: 'info',
      loading: statsLoading,
      section: 'feed',
    },
    {
      key: 'revenueToday',
      icon: <IndianRupee className="h-3.5 w-3.5" />,
      label: 'Today',
      value: `₹${((stats?.todayRevenue ?? 0) / 1000).toFixed(1)}K`,
      trend: trends.revenue,
      color: 'emerald',
      tone: 'good',
      loading: statsLoading,
      section: 'revenue',
    },
    {
      key: 'revenueTotal',
      icon: <CircleDollarSign className="h-3.5 w-3.5" />,
      label: 'Total Revenue',
      value: `₹${((financials?.totalRevenue ?? 0) / 1000).toFixed(1)}K`,
      color: 'green',
      tone: 'good',
      loading: !financials,
      section: 'revenue',
    },
    {
      key: 'pendingValue',
      icon: <Receipt className="h-3.5 w-3.5" />,
      label: 'Pending Value',
      value: `₹${((financials?.pendingRevenue ?? 0) / 1000).toFixed(1)}K`,
      color: 'amber',
      tone: 'warn',
      loading: !financials,
      section: 'revenue',
    },
    {
      key: 'transactions',
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      label: 'Transactions',
      value: financials?.totalTransactions ?? 0,
      color: 'blue',
      tone: 'info',
      loading: !financials,
      section: 'digest',
    },
  ];

  const renderKpis = (dense: boolean) =>
    kpiLoading
      ? Array.from({ length: kpiSpecs.length }).map((_, i) => (
          <SkeletonCard key={i} className={dense ? 'h-[46px]' : 'min-h-[76px]'} />
        ))
      : kpiSpecs.map((s) => (
          <KPICard
            key={s.key}
            icon={s.icon}
            label={s.label}
            value={s.value}
            trend={dense ? undefined : s.trend}
            color={s.color}
            tone={s.tone}
            hint={s.hint}
            loading={s.loading}
            dense={dense}
            compact={!dense}
            onClick={() => openSection(s.section)}
          />
        ));

  const railProps = {
    alerts,
    events,
    now,
    onTripTrucks,
    idleTrucks,
    loads,
    stats: stats ?? null,
    trends,
    hotCorridors: stats?.hotCorridors ?? [],
    locationsLoading,
    loadsLoading,
    statsLoading,
    expandedSections,
    onToggleSection: toggleSection,
    onTruckClick: handleTruckClick,
    onLoadClick: handleLoadClick,
    onReviewLoad: handleLoadClick,
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-gray-50 text-gray-900 overflow-hidden">
      {/* ── Toolbar ────────────────────────────────────────────── */}
      {/* One slim row carries the title, live status, alert chips and the
          controls. The previous layout stacked three bordered white bars
          before the map even began, which both wasted vertical space and made
          the top of the page read as a set of stray divider lines. The toolbar
          itself is deliberately borderless: the divider belongs under the whole
          white top block (the mobile tab bar or the desktop KPI strip), so the
          viewport shows exactly one line instead of three. */}
      <header className="shrink-0 h-12 bg-white px-2.5 sm:px-3 flex items-center gap-2 z-20">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm shrink-0">
          <Radio className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <h1 className="text-sm font-bold tracking-tight whitespace-nowrap">Command Center</h1>
          <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-gray-400 whitespace-nowrap">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            Live
            <span className="text-gray-300">·</span>
            <span className="tabular-nums">updated {updatedAgo}</span>
          </span>
        </div>

        {/* Alert chips sit inline in the toolbar instead of owning a whole bar. */}
        <div className="hidden md:block flex-1 min-w-0">
          <AlertPanel alerts={alerts} variant="strip" />
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-[104px] sm:w-[120px] h-8 text-xs border-gray-200 bg-white">
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
            aria-label="Refresh data"
            title="Refresh data"
            className="h-8 w-8 p-0 border-gray-200"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label={agentsOpen ? 'Hide AI agents' : 'Show AI agents'}
            aria-pressed={agentsOpen}
            title={agentsOpen ? 'Hide AI agents' : 'Show AI agents'}
            className="h-8 w-8 p-0 border-gray-200"
            onClick={() => {
              setAgentsOpen((open) => !open);
              // The overlay lives on the map pane — make sure that pane is visible.
              setMobileTab('map');
            }}
          >
            <Bot className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label={railOpen ? 'Hide side panel' : 'Show side panel'}
            title={railOpen ? 'Hide side panel' : 'Show side panel'}
            className={cn('h-8 w-8 p-0 border-gray-200 hidden lg:inline-flex')}
            onClick={() => setRailOpen((open) => !open)}
          >
            <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', railOpen && 'rotate-180')} />
          </Button>
        </div>
      </header>

      {/* ── Mobile tab bar ─────────────────────────────────────── */}
      <div className="lg:hidden shrink-0 border-b border-gray-200 bg-white px-2 py-1 flex items-center gap-1">
        {MOBILE_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMobileTab(key)}
            aria-pressed={mobileTab === key}
            className={cn(
              'relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors',
              mobileTab === key
                ? 'bg-orange-50 text-orange-700'
                : 'text-gray-500 hover:bg-gray-100',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {key === 'metrics' && criticalCount > 0 && (
              <span className="absolute top-1.5 right-2 h-1.5 w-1.5 rounded-full bg-red-500" />
            )}
          </button>
        ))}
      </div>

      {/* ── KPI strip (desktop) ────────────────────────────────── */}
      {/* Single dense row: every headline number in one place, ~46px tall
          instead of the previous ~230px of stacked task cards. */}
      <div className="hidden lg:block shrink-0 border-b border-gray-200 bg-white px-3 py-1.5">
        <div className="grid grid-cols-5 2xl:grid-cols-10 gap-1.5">{renderKpis(true)}</div>
      </div>

      {/* ── Body: map + rail ───────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex">
        <div
          className={cn(
            'flex-1 min-h-0 relative',
            mobileTab === 'map' ? 'block' : 'hidden',
            'lg:block',
          )}
        >
          <CommandCenterMap
            trucks={filteredTrucks}
            loads={loads}
            showRoutes
            showHeatmap={false}
            showCorridors
            selectedTruckId={selectedTruck?.driver_id}
            selectedLoadId={selectedLoad?.id}
            onTruckClick={handleTruckClick}
            onLoadClick={handleLoadClick}
            hotCorridors={stats?.hotCorridors ?? []}
            trips={routeData?.trips ?? []}
            shipments={routeData?.shipments ?? []}
          />

          {/* AI Agents view — static org chart + honest Disha request status.
              Overlay only: opening it never changes what the map is doing. */}
          {agentsOpen && <AgentOrgPanel onClose={() => setAgentsOpen(false)} />}

          {/* Map legend */}
          <div className="absolute bottom-3 left-3 z-[1000] flex flex-wrap items-center gap-2">
            <div className="bg-white/95 border border-gray-200 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
              <Navigation className="h-3 w-3 text-orange-500" />
              <span className="text-[11px] font-semibold text-gray-700">
                {filteredTrucks.length} trucks
              </span>
            </div>
            <div className="bg-white/95 border border-gray-200 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
              <Package className="h-3 w-3 text-blue-500" />
              <span className="text-[11px] font-semibold text-gray-700">{loads.length} loads</span>
            </div>
            {criticalCount > 0 && (
              <button
                type="button"
                onClick={() => openSection('alerts')}
                className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 hover:bg-red-100 transition-colors"
              >
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="text-[11px] font-semibold text-red-600">
                  {criticalCount} critical
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile metrics pane */}
        {mobileTab === 'metrics' && (
          <div className="lg:hidden flex-1 min-h-0 overflow-y-auto bg-white border-b border-gray-200 px-3 py-3 space-y-3">
            <AlertPanel alerts={alerts} variant="list" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{renderKpis(false)}</div>
          </div>
        )}

        {/* Rail: desktop side panel and/or mobile feed pane */}
        {(railOpen || mobileTab === 'feed') && (
          <aside
            className={cn(
              'min-h-0 overflow-y-auto bg-gray-50',
              mobileTab === 'feed' ? 'flex-1' : 'hidden',
              railOpen
                ? 'lg:block lg:flex-none lg:w-[340px] lg:border-l lg:border-gray-200'
                : 'lg:hidden',
            )}
          >
            <CommandRail {...railProps} />
          </aside>
        )}
      </div>

      {/* ── Detail panel ───────────────────────────────────────── */}
      {(selectedTruck || selectedLoad) && (
        <TripDetailPanel
          selectedTruck={selectedTruck}
          selectedLoad={selectedLoad}
          onClose={() => {
            setSelectedTruck(null);
            setSelectedLoad(null);
          }}
        />
      )}
    </div>
  );
}
