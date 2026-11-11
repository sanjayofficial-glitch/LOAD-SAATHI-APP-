import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { showSuccess, showError } from '@/utils/toast';
import { useLiveDriverLocations } from '@/hooks/useLiveDriverLocations';
import { useLiveLoadLocations } from '@/hooks/useLiveLoadLocations';
import { useRealtimeInvalidate } from '@/hooks/useRealtimeInvalidate';
import { isTruckInTransit } from '@/components/maps/TruckMarker.utils';
import type { TruckLocation } from '@/components/maps/TruckMarker.utils';
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
import KPICard from './KPICard';
import type { KPITone } from './KPICard';
import AlertPanel from './AlertPanel';
import AlertRulesEngine from './AlertRulesEngine';
import TripDetailPanel from './TripDetailPanel';
import PostedListingsPanel from './PostedListingsPanel';
import ListingDetailPanel from './ListingDetailPanel';
import type { ListingSelection } from './ListingDetailPanel';
import { SkeletonCard } from './SkeletonCard';
import { computeMatches, type MatchSuggestion } from './SmartMatchPanel';
import {
  deriveAlerts,
  loadAlertConfig,
  saveAlertConfig,
  type AdminAlert,
  type AlertConfig,
} from './alerts';
import {
  OPEN_SHIPMENT_STATUSES,
  REQUEST_STATUS,
  SHIPMENT_STATUS,
  TRIP_STATUS,
} from './format';
import { useAdminEventFeed } from './useAdminEventFeed';
import { usePostedListings } from './usePostedListings';
import type { PendingAgeing, StatsData, TrendData } from './types';
import type { Shipment, Trip } from '@/types';

const VEHICLE_TYPES = ['All', 'Mini Truck', 'Tata Ace', 'Tempo', '10 MT', '16 MT', '20 MT', 'Container'];

/** localStorage key for today's acknowledged alert ids: `${alertId}|${YYYY-MM-DD}`. */
const ACK_STORAGE_KEY = 'admin-command-alert-ack';

/** Cap on broadcast recipients so one click cannot fire hundreds of RPCs. */
const BROADCAST_CAP = 50;

const EMPTY_TRENDS: TrendData = {
  trucks: [0, 0, 0, 0, 0, 0, 0],
  loads: [0, 0, 0, 0, 0, 0, 0],
  leads: [0, 0, 0, 0, 0, 0, 0],
  trips: [0, 0, 0, 0, 0, 0, 0],
  pending: [0, 0, 0, 0, 0, 0, 0],
  unmatched: [0, 0, 0, 0, 0, 0, 0],
  completed: [0, 0, 0, 0, 0, 0, 0],
  revenue: [0, 0, 0, 0, 0, 0, 0],
  prev: { trucks: 0, loads: 0, leads: 0, trips: 0, pending: 0, unmatched: 0, completed: 0, revenue: 0 },
};

const MOBILE_TABS = [
  { key: 'map', label: 'Map', icon: MapPin },
  { key: 'trips', label: 'Trips', icon: Truck },
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

/** Day keys for the last `n` days, oldest first — 14 covers 7 days + a WoW baseline. */
function lastDayKeys(n: number): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(localDayKey(d));
  }
  return keys;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

/**
 * Week-over-week change as a percentage, or null when there is no previous
 * week to compare against (0% of nothing is not a trend).
 */
function wowDelta(current: number[], previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((sum(current) - previous) / previous) * 100);
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

/** Client-side CSV download for an in-memory table (BOM so Excel reads ₹ correctly). */
function downloadCsv(filename: string, rows: Array<Array<string | number>>): void {
  const esc = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(esc).join(',')).join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function CommandCenterPage() {
  const { userProfile, getSupabaseToken } = useAuth();
  const isAdmin = userProfile?.user_type === 'admin';

  const { driverLocations, isLoading: locationsLoading, refetch: refetchLocations } =
    useLiveDriverLocations();
  const { loads, isLoading: loadsLoading, error: loadsError, refetch: refetchLoads } = useLiveLoadLocations();

  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [selectedTruck, setSelectedTruck] = useState<TruckLocation | null>(null);
  const [selectedLoad, setSelectedLoad] = useState<LoadLocation | null>(null);
  const [railOpen, setRailOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>('map');
  // The listing the operator has opened: a trucker's trip or a shipper's load.
  // Kept separate from the map selections so a detail drawer never fights the
  // marker popovers for the same slot.
  const [selectedListing, setSelectedListing] = useState<ListingSelection | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    // Open the sections that represent live operational state by default — the
    // rail should read as a status board, not a list of closed drawers.
    () => new Set(['alerts', 'trips', 'feed', 'onTrip', 'loads']),
  );
  const [now, setNow] = useState(() => Date.now());
  const navigate = useNavigate();

  // Alert thresholds live in this browser (edited by AlertRulesEngine);
  // acknowledgements expire at midnight local — a new day re-arms the alerts.
  const [alertConfig, setAlertConfig] = useState<AlertConfig>(() => loadAlertConfig());
  const [ackedKeys, setAckedKeys] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(ACK_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const ackDay = localDayKey(new Date());

  const acknowledged = useMemo(() => {
    const set = new Set<string>();
    for (const key of ackedKeys) {
      const sep = key.lastIndexOf('|');
      if (sep > 0 && key.slice(sep + 1) === ackDay) set.add(key.slice(0, sep));
    }
    return set;
  }, [ackedKeys, ackDay]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Prune yesterday's keys as they are written back, so the list never grows.
    const pruned = ackedKeys.filter((k) => k.endsWith(`|${ackDay}`));
    try {
      window.localStorage.setItem(ACK_STORAGE_KEY, JSON.stringify(pruned));
    } catch {
      // Storage unavailable — acknowledgements just won't survive a reload.
    }
    if (pruned.length !== ackedKeys.length) setAckedKeys(pruned);
  }, [ackedKeys, ackDay]);

  const handleAlertConfigChange = useCallback((next: AlertConfig) => {
    setAlertConfig(next);
    saveAlertConfig(next);
  }, []);

  const acknowledgeAlert = useCallback(
    (id: string) => {
      const key = `${id}|${ackDay}`;
      setAckedKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
    },
    [ackDay],
  );

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
    ['trips', 'shipments', 'requests', 'shipment_requests', 'leads', 'users'],
    [
      ['admin-command-stats'],
      ['admin-command-financials'],
      ['admin-command-routes'],
      ['admin-command-listings'],
      ['admin-command-listing-detail'],
    ],
  );

  const events = useAdminEventFeed(isAdmin);

  // The postings themselves: trips a trucker posted, loads a shipper posted —
  // newest first, with each poster's profile. This is what makes the board show
  // *listings*, not just the subset that has GPS coordinates on the map.
  const {
    data: listings,
    isLoading: listingsLoading,
    refetch: refetchListings,
  } = usePostedListings(isAdmin);

  const trips = useMemo(() => listings?.trips ?? [], [listings]);
  const postedShipments = useMemo(() => listings?.shipments ?? [], [listings]);

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

  // Stale = no position within the operator's configured GPS window. The list
  // (not just a count) feeds the alert detail so the board can name vehicles.
  const staleTruckList = useMemo(() => {
    const cutoff = now - alertConfig.thresholds.staleGpsMins * 60_000;
    return driverLocations.filter((t) => {
      const ts = new Date(t.last_seen_at).getTime();
      return Number.isFinite(ts) && ts < cutoff;
    });
  }, [driverLocations, now, alertConfig.thresholds.staleGpsMins]);

  const staleTrucks = staleTruckList.length;

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
        (l) =>
          (l.weight_tonnes ?? 0) * (l.budget_per_tonne ?? 0) >
          alertConfig.thresholds.highValueAmount,
      ).length,
    [loads, alertConfig.thresholds.highValueAmount],
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
          .eq('status', TRIP_STATUS.active)
          .limit(50),
        supabase
          .from('shipments')
          .select(
            'id, origin_city, destination_city, status, origin_lat, origin_lng, destination_lat, destination_lng',
          )
          // A load is open for matching while it is pending or matched — there
          // is no 'active' status on shipments, so filtering on it always
          // returned an empty set.
          .in('status', [...OPEN_SHIPMENT_STATUSES])
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
        usersCountRes,
        truckersRes,
        shippersRes,
        completedTodayRes,
        unmatchedRes,
        topCorridorsRes,
        leadsRes,
        todayRevenueRes,
        yesterdayRevenueRes,
        todaysTripsRes,
      ] = await Promise.all([
        supabase.from('trips').select('id, status').eq('status', TRIP_STATUS.active),
        supabase.from('shipments').select('id, status').in('status', [...OPEN_SHIPMENT_STATUSES]),
        supabase
          .from('requests')
          .select('id, status, weight_tonnes, trip:trips(price_per_tonne)')
          .eq('status', REQUEST_STATUS.pending),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('user_type', 'trucker'),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('user_type', 'shipper'),
        supabase
          .from('trips')
          .select('id, created_at')
          .eq('status', TRIP_STATUS.completed)
          .gte('created_at', todayIso),
        supabase.from('shipments').select('id').eq('status', SHIPMENT_STATUS.pending),
        supabase.from('trips').select('origin_city, destination_city').eq('status', TRIP_STATUS.active),
        supabase.from('leads').select('id').gte('created_at', todayIso),
        supabase
          .from('requests')
          .select('weight_tonnes, trip:trips(price_per_tonne)')
          .eq('status', REQUEST_STATUS.accepted)
          .gte('created_at', todayIso),
        supabase
          .from('requests')
          .select('weight_tonnes, trip:trips(price_per_tonne)')
          .eq('status', REQUEST_STATUS.accepted)
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
        totalUsers: usersCountRes.count ?? 0,
        truckers: truckersRes.count ?? 0,
        shippers: shippersRes.count ?? 0,
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
        tripsToday: todaysTripsRes.data?.length ?? 0,
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
        supabase
          .from('requests')
          .select('weight_tonnes, trip:trips(price_per_tonne)')
          .eq('status', REQUEST_STATUS.accepted),
        supabase
          .from('requests')
          .select('weight_tonnes, created_at, trip:trips(price_per_tonne)')
          .eq('status', REQUEST_STATUS.pending),
        supabase.from('trips').select('id').eq('status', TRIP_STATUS.completed),
        supabase.from('leads').select('id', { count: 'exact', head: true }),
      ]);
      const acceptedRows = (acceptedRes.data ?? []) as RevenueRow[];
      const pendingRows = (pendingRes.data ?? []) as Array<RevenueRow & { created_at?: string | null }>;

      // Ageing: how long unmatched value has been sitting. Anything past 30
      // days is a listing nobody is going to pick up without a nudge.
      const nowMs = Date.now();
      const pendingAgeing: PendingAgeing = { fresh: 0, mid: 0, aged: 0 };
      for (const row of pendingRows) {
        const value = revenueOf(row);
        const ts = row.created_at ? new Date(row.created_at).getTime() : NaN;
        const ageDays = Number.isFinite(ts) ? (nowMs - ts) / 86_400_000 : 0;
        if (ageDays > 30) pendingAgeing.aged += value;
        else if (ageDays > 7) pendingAgeing.mid += value;
        else pendingAgeing.fresh += value;
      }

      return {
        totalRevenue: acceptedRows.reduce((sum, r) => sum + revenueOf(r), 0),
        pendingRevenue: pendingRows.reduce((sum, r) => sum + revenueOf(r), 0),
        pendingAgeing,
        totalTransactions: acceptedRows.length,
        completedTrips: completedTripsRes.data?.length ?? 0,
        totalLeads: totalLeadsRes.count ?? 0,
      };
    },
    enabled: isAdmin,
    refetchInterval: 120000,
  });

  // 14-day window bucketed client-side: the last 7 days feed the sparklines,
  // the 7 before them give a week-over-week baseline. One ranged query per
  // metric (7 total) replaces the previous ~56 sequential per-day requests.
  const { data: trendData } = useQuery<TrendData | null>({
    queryKey: ['admin-command-trends'],
    queryFn: async (): Promise<TrendData | null> => {
      const token = await getSupabaseToken();
      if (!token) return null;
      const supabase = createClerkSupabaseClient(token);
      const keys = lastDayKeys(14);
      const windowIso = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

      const [trucksRes, loadsRes, leadsRes, tripsRes, requestsRes, shipmentsRes, revenueRes] =
        await Promise.all([
          supabase.from('driver_locations').select('last_seen_at').gte('last_seen_at', windowIso),
          supabase.from('load_locations').select('created_at, status').gte('created_at', windowIso),
          supabase.from('leads').select('created_at').gte('created_at', windowIso),
          supabase.from('trips').select('created_at, status').gte('created_at', windowIso),
          supabase.from('requests').select('created_at, status').gte('created_at', windowIso),
          supabase.from('shipments').select('created_at, status').gte('created_at', windowIso),
          supabase
            .from('requests')
            .select('created_at, weight_tonnes, trip:trips(price_per_tonne)')
            .eq('status', REQUEST_STATUS.accepted)
            .gte('created_at', windowIso),
        ]);

      const tripRows = (tripsRes.data ?? []) as Array<{ created_at: string; status: string }>;
      const revenueRows = (revenueRes.data ?? []) as Array<RevenueRow & { created_at: string }>;

      /** 14 aligned buckets → current week's series + previous week's total. */
      const split = (full: number[]) => ({
        current: full.slice(7),
        prev: sum(full.slice(0, 7)),
      });

      const trucks = split(
        countByDay((trucksRes.data ?? []).map((r) => ({ at: r.last_seen_at })), keys),
      );
      const loads = split(
        countByDay(
          (loadsRes.data ?? [])
            // load_locations tracks 'active' until the trip completes.
            .filter((r) => r.status === 'active')
            .map((r) => ({ at: r.created_at })),
          keys,
        ),
      );
      const leads = split(
        countByDay((leadsRes.data ?? []).map((r) => ({ at: r.created_at })), keys),
      );
      const trips = split(
        countByDay(
          tripRows.filter((r) => r.status === TRIP_STATUS.active).map((r) => ({ at: r.created_at })),
          keys,
        ),
      );
      const pending = split(
        countByDay(
          (requestsRes.data ?? [])
            .filter((r) => r.status === REQUEST_STATUS.pending)
            .map((r) => ({ at: r.created_at })),
          keys,
        ),
      );
      const unmatched = split(
        countByDay(
          (shipmentsRes.data ?? [])
            .filter((r) => r.status === SHIPMENT_STATUS.pending)
            .map((r) => ({ at: r.created_at })),
          keys,
        ),
      );
      const completed = split(
        countByDay(
          tripRows.filter((r) => r.status === TRIP_STATUS.completed).map((r) => ({ at: r.created_at })),
          keys,
        ),
      );
      const revenue = split(
        sumByDay(revenueRows.map((r) => ({ at: r.created_at, value: revenueOf(r) })), keys),
      );

      return {
        trucks: trucks.current,
        loads: loads.current,
        leads: leads.current,
        trips: trips.current,
        pending: pending.current,
        unmatched: unmatched.current,
        completed: completed.current,
        revenue: revenue.current,
        prev: {
          trucks: trucks.prev,
          loads: loads.prev,
          leads: leads.prev,
          trips: trips.prev,
          pending: pending.prev,
          unmatched: unmatched.prev,
          completed: completed.prev,
          revenue: revenue.prev,
        },
      };
    },
    enabled: isAdmin,
    refetchInterval: 300000,
  });

  const trends = trendData ?? EMPTY_TRENDS;

  // ── Alerts ─────────────────────────────────────────────────────
  const alerts = useMemo(
    () =>
      deriveAlerts(
        {
          activeTrucks: driverLocations.length,
          idleTrucks: idleTrucks.length,
          staleTrucks,
          // Name the silent vehicles so the alert is actionable, not a count.
          staleVehicleNumbers: staleTruckList.map(
            (t) => t.driver_name || t.vehicle_type || t.driver_id,
          ),
          unmatchedShipments: stats?.unmatchedShipments ?? 0,
          pendingRequests: stats?.pendingRequests ?? 0,
          oldestWaitingLoadMins,
          highValueLoads,
        },
        alertConfig,
      ),
    [
      driverLocations.length,
      idleTrucks.length,
      staleTrucks,
      staleTruckList,
      stats?.unmatchedShipments,
      stats?.pendingRequests,
      oldestWaitingLoadMins,
      highValueLoads,
      alertConfig,
    ],
  );
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  // Everything except the all-clear placeholder — what the rules button badges.
  const openAlertCount = alerts.filter(
    (a) => a.id !== 'all-clear' && !acknowledged.has(a.id),
  ).length;

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
    // Mirror the section on the phone: posting-centric sections open the
    // Trips tab, alerts open Metrics, everything else lands on the feed.
    setMobileTab(key === 'trips' ? 'trips' : key === 'alerts' ? 'metrics' : 'feed');
  }, []);

  /** Alert drill-down: open the rail section that holds the data behind it. */
  const handleAlertDrillDown = useCallback(
    (alert: AdminAlert) => {
      if (alert.section) openSection(alert.section);
    },
    [openSection],
  );

  const handleTruckClick = useCallback((truck: TruckLocation) => {
    setSelectedTruck(truck);
    setSelectedLoad(null);
    setSelectedListing(null);
  }, []);

  const handleLoadClick = useCallback((load: LoadLocation) => {
    setSelectedLoad(load);
    setSelectedTruck(null);
    setSelectedListing(null);
  }, []);

  // Opening a posting takes over the detail slot — the map selections are
  // cleared so only one drawer is ever on screen.
  const handleSelectTrip = useCallback((trip: Trip) => {
    setSelectedListing({ type: 'trip', trip });
    setSelectedTruck(null);
    setSelectedLoad(null);
  }, []);

  const handleSelectShipment = useCallback((shipment: Shipment) => {
    setSelectedListing({ type: 'shipment', shipment });
    setSelectedTruck(null);
    setSelectedLoad(null);
  }, []);

  const selectedTripId =
    selectedListing?.type === 'trip' ? selectedListing.trip.id : null;
  const selectedShipmentId =
    selectedListing?.type === 'shipment' ? selectedListing.shipment.id : null;

  const listingsPanelProps = {
    trips,
    shipments: postedShipments,
    loading: listingsLoading,
    errors: listings?.errors,
    selectedTripId,
    selectedShipmentId,
    onSelectTrip: handleSelectTrip,
    onSelectShipment: handleSelectShipment,
  };

  const closeListing = useCallback(() => setSelectedListing(null), []);

  const handleRefresh = useCallback(() => {
    void refetchStats();
    void refetchFinancials();
    void refetchRoutes();
    void refetchLocations();
    void refetchLoads();
    void refetchListings();
  }, [
    refetchStats,
    refetchFinancials,
    refetchRoutes,
    refetchLocations,
    refetchLoads,
    refetchListings,
  ]);

  // ── Quick actions ──────────────────────────────────────────────
  // Broadcast: one in-app notification per online trucker, through the
  // admin-authorised create_notification() RPC (cross-user INSERT on the
  // table itself is blocked by design).
  const handleBroadcast = useCallback(
    async (message: string) => {
      const recipients = [...new Set(driverLocations.map((t) => t.driver_id))].slice(
        0,
        BROADCAST_CAP,
      );
      if (recipients.length === 0) {
        showError('Nobody is online to notify right now.');
        return;
      }
      try {
        const token = await getSupabaseToken();
        if (!token) {
          showError('Your session has expired — sign in again to broadcast.');
          return;
        }
        const supabase = createClerkSupabaseClient(token);
        const results = await Promise.all(
          recipients.map((userId) =>
            supabase.rpc('create_notification', {
              p_user_id: userId,
              p_message: message,
              p_type: 'info',
              p_title: 'From the Command Center',
            }),
          ),
        );
        const failed = results.filter((r) => r.error).length;
        const sent = results.length - failed;
        if (sent > 0) {
          showSuccess(`Broadcast delivered to ${sent} online ${sent === 1 ? 'user' : 'users'}.`);
        }
        if (failed > 0) {
          showError(`${failed} notification${failed === 1 ? '' : 's'} could not be delivered.`);
        }
      } catch {
        showError('Broadcast failed — please retry.');
      }
    },
    [driverLocations, getSupabaseToken],
  );

  // Auto-Match: score idle trucks against open loads (same engine as the
  // Smart Matches panel) and notify each trucker about their best pairing.
  const handleAutoMatch = useCallback(async () => {
    const scored = computeMatches(idleTrucks, loads).filter((s) => s.score >= 60);
    const best = new Map<string, MatchSuggestion>();
    for (const s of scored) {
      const current = best.get(s.truck.driver_id);
      if (!current || s.score > current.score) best.set(s.truck.driver_id, s);
    }

    if (best.size === 0) {
      showError('No truck–load pairing scores 60% or better right now.');
      return;
    }

    try {
      const token = await getSupabaseToken();
      if (!token) {
        showError('Your session has expired — sign in again to run auto-match.');
        return;
      }
      const supabase = createClerkSupabaseClient(token);
      const targets = [...best.values()];
      const results = await Promise.all(
        targets.map((s) =>
          supabase.rpc('create_notification', {
            p_user_id: s.truck.driver_id,
            p_message: `Possible load for your truck: ${s.load.origin_city} → ${s.load.dest_city}${
              s.load.weight_tonnes != null ? ` · ${s.load.weight_tonnes}T` : ''
            } (${s.score}% fit).`,
            p_type: 'match',
            p_title: 'Auto-match suggestion',
          }),
        ),
      );
      const failed = results.filter((r) => r.error).length;
      const sent = results.length - failed;
      if (sent > 0) {
        showSuccess(
          `Auto-match: ${sent} trucker${sent === 1 ? '' : 's'} notified about ${sent} load${
            sent === 1 ? '' : 's'
          }.`,
        );
      }
      if (failed > 0) {
        showError(`${failed} driver notification${failed === 1 ? '' : 's'} could not be sent.`);
      }
    } catch {
      showError('Auto-match failed — please retry.');
    }
  }, [idleTrucks, loads, getSupabaseToken]);

  // Export: everything currently loaded in memory, no server round-trip.
  const handleExport = useCallback(() => {
    const rows: Array<Array<string | number>> = [
      ['Type', 'ID', 'Origin', 'Destination', 'Status', 'Poster', 'Created'],
      ...trips.map((t) => [
        'Trip',
        t.id,
        t.origin_city,
        t.destination_city,
        t.status,
        t.trucker?.full_name || t.trucker_id,
        t.created_at,
      ]),
      ...postedShipments.map((s) => [
        'Load',
        s.id,
        s.origin_city,
        s.destination_city,
        s.status,
        s.shipper?.full_name || s.shipper_id,
        s.created_at,
      ]),
    ];
    if (rows.length === 1) {
      showError('Nothing to export yet — no listings loaded.');
      return;
    }
    downloadCsv(`command-center-listings-${localDayKey(new Date())}.csv`, rows);
    showSuccess(`Exported ${trips.length + postedShipments.length} listings to CSV.`);
  }, [trips, postedShipments]);

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
    /** Full-page destination when the tile should leave the board (deep link). */
    path?: string;
    /** Week-over-week change, or null when last week had no data. */
    delta?: number | null;
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
      delta: wowDelta(trends.trucks, trends.prev.trucks),
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
      delta: wowDelta(trends.loads, trends.prev.loads),
    },
    {
      key: 'inTransit',
      icon: <Activity className="h-3.5 w-3.5" />,
      label: 'In Transit',
      value: stats?.activeTrips ?? 0,
      trend: trends.trips,
      color: 'green',
      tone: 'info',
      hint: `${stats?.tripsToday ?? 0} new today`,
      loading: statsLoading,
      section: 'trips',
      path: '/admin/trips',
      delta: wowDelta(trends.trips, trends.prev.trips),
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
      delta: wowDelta(trends.pending, trends.prev.pending),
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
      path: '/admin/shipments',
      delta: wowDelta(trends.unmatched, trends.prev.unmatched),
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
      delta: wowDelta(trends.leads, trends.prev.leads),
    },
    {
      key: 'revenueToday',
      icon: <IndianRupee className="h-3.5 w-3.5" />,
      label: 'GMV Today',
      value: `₹${((stats?.todayRevenue ?? 0) / 1000).toFixed(1)}K`,
      trend: trends.revenue,
      color: 'emerald',
      tone: 'good',
      hint: 'estimated',
      loading: statsLoading,
      section: 'revenue',
      delta: wowDelta(trends.revenue, trends.prev.revenue),
    },
    {
      key: 'revenueTotal',
      icon: <CircleDollarSign className="h-3.5 w-3.5" />,
      label: 'Total GMV',
      value: `₹${((financials?.totalRevenue ?? 0) / 1000).toFixed(1)}K`,
      color: 'green',
      tone: 'good',
      hint: 'estimated',
      loading: !financials,
      section: 'revenue',
    },
    {
      key: 'pendingValue',
      icon: <Receipt className="h-3.5 w-3.5" />,
      label: 'Pending GMV',
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
            delta={s.delta}
            onClick={() => (s.path ? navigate(s.path) : openSection(s.section))}
          />
        ));

  const railProps = {
    alerts,
    acknowledged,
    onAcknowledge: acknowledgeAlert,
    onDrillDown: handleAlertDrillDown,
    alertConfig,
    onAlertConfigChange: handleAlertConfigChange,
    onBroadcast: handleBroadcast,
    onAutoMatch: handleAutoMatch,
    onExport: handleExport,
    onlineCount: driverLocations.length,
    pendingAgeing: financials?.pendingAgeing ?? null,
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
    ...listingsPanelProps,
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* ── Toolbar ────────────────────────────────────────────── */}
      {/* One slim row carries the title, live status, alert chips and the
          controls. The previous layout stacked three bordered white bars
          before the map even began, which both wasted vertical space and made
          the top of the page read as a set of stray divider lines. The toolbar
          itself is deliberately borderless: the divider belongs under the whole
          white top block (the mobile tab bar or the desktop KPI strip), so the
          viewport shows exactly one line instead of three. */}
      <header className="shrink-0 h-12 bg-white dark:bg-gray-900 px-2.5 sm:px-3 flex items-center gap-2 z-20 border-b border-gray-200 dark:border-gray-800">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm shrink-0">
          <Radio className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h1 className="text-sm font-bold tracking-tight whitespace-nowrap truncate text-gray-900 dark:text-gray-100">
            Command Center
          </h1>
          <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
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
          <AlertPanel
            alerts={alerts}
            variant="strip"
            acknowledged={acknowledged}
            onDrillDown={handleAlertDrillDown}
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <AlertRulesEngine
            config={alertConfig}
            onChange={handleAlertConfigChange}
            activeCount={openAlertCount}
          />
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger
              className="w-[86px] sm:w-[120px] h-8 text-xs border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0"
              aria-label="Filter by vehicle type"
            >
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
            className="h-8 w-8 p-0 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label={railOpen ? 'Hide side panel' : 'Show side panel'}
            title={railOpen ? 'Hide side panel' : 'Show side panel'}
            className={cn('h-8 w-8 p-0 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hidden lg:inline-flex')}
            onClick={() => setRailOpen((open) => !open)}
          >
            <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', railOpen && 'rotate-180')} />
          </Button>
        </div>
      </header>

      {/* ── Mobile tab bar ─────────────────────────────────────── */}
      <div className="lg:hidden shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-2 py-1 flex items-center gap-1">
        {MOBILE_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMobileTab(key)}
            aria-pressed={mobileTab === key}
            className={cn(
              'relative flex-1 flex items-center justify-center gap-1.5 px-1.5 sm:px-3 py-2 rounded-lg text-xs font-semibold transition-colors min-w-0',
              mobileTab === key
                ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{label}</span>
            {key === 'metrics' && criticalCount > 0 && (
              <span className="absolute top-1.5 right-2 h-1.5 w-1.5 rounded-full bg-red-500" />
            )}
          </button>
        ))}
      </div>

      {/* ── KPI strip (desktop) ────────────────────────────────── */}
      {/* Single dense row: every headline number in one place, ~46px tall
          instead of the previous ~230px of stacked task cards. */}
      <div className="hidden lg:block shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-1.5">
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

          {/* Map legend */}
          <div className="absolute bottom-3 left-3 z-[1000] flex flex-wrap items-center gap-2">
            <div className="bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
              <Navigation className="h-3 w-3 text-orange-500" />
              <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                {filteredTrucks.length} trucks
              </span>
            </div>
            <div className="bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
              <Package className="h-3 w-3 text-blue-500" />
              <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{loads.length} loads</span>
            </div>
            {loadsError && (
              <button
                type="button"
                onClick={() => void refetchLoads()}
                title={loadsError}
                className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
              >
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                  Loads failed to load — retry
                </span>
              </button>
            )}
            {criticalCount > 0 && (
              <button
                type="button"
                onClick={() => openSection('alerts')}
                className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
              >
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                  {criticalCount} critical
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile trips/loads pane — every posting, no GPS required */}
        {mobileTab === 'trips' && (
          <div className="lg:hidden flex-1 min-h-0 flex flex-col bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
            <PostedListingsPanel {...listingsPanelProps} density="pane" />
          </div>
        )}

        {/* Mobile metrics pane */}
        {mobileTab === 'metrics' && (
          <div className="lg:hidden flex-1 min-h-0 overflow-y-auto bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 py-3 space-y-3">
            <AlertPanel
              alerts={alerts}
              variant="list"
              acknowledged={acknowledged}
              onAcknowledge={acknowledgeAlert}
              onDrillDown={handleAlertDrillDown}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{renderKpis(false)}</div>
          </div>
        )}

        {/* Rail: desktop side panel and/or mobile feed pane */}
        {(railOpen || mobileTab === 'feed') && (
          <aside
            className={cn(
              'min-h-0 overflow-y-auto bg-gray-50 dark:bg-gray-950',
              mobileTab === 'feed' ? 'flex-1' : 'hidden',
              railOpen
                ? 'lg:block lg:flex-none lg:w-[340px] lg:border-l lg:border-gray-200 dark:lg:border-gray-800'
                : 'lg:hidden',
            )}
          >
            <CommandRail {...railProps} />
          </aside>
        )}
      </div>

      {/* ── Detail panel ───────────────────────────────────────── */}
      <ListingDetailPanel selection={selectedListing} onClose={closeListing} />
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
