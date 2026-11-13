import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSupabase } from '@/hooks/useSupabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Inbox,
  Info,
  Package,
  Phone,
  RefreshCw,
  Route as RouteIcon,
  Search,
  Star,
  Truck,
} from 'lucide-react';
import ListingDetailPanel, { type ListingSelection } from './command-center/ListingDetailPanel';
import { SHIPMENT_SELECT, TRIP_SELECT } from './command-center/usePostedListings';
import {
  attachShipperToShipments,
  attachTruckerToTrips,
  fetchAdminUsersMap,
} from '@/lib/adminUsers';
import {
  STATUS_ORDER,
  formatINR,
  formatDate,
  statusClass,
  statusLabel,
  timeAgo,
} from './command-center/format';
import type { Shipment, Trip, User } from '@/types';
import { cn } from '@/lib/utils';

/**
 * AdminListings — the "who posted what" browser behind the dashboard's
 * Trips / Shipments metric cards.
 *
 * One component serves both routes (`/admin/trips` and `/admin/shipments`)
 * because the two are the same shape of question — *show me every posting and
 * the profile of the person who made it* — only with different columns.
 * Tapping a row opens the full detail drawer (poster profile, route, every
 * entered field, and the requests/offers on it).
 */
export type AdminListingKind = 'trips' | 'shipments';

type Row = Trip | Shipment;

interface AdminListingsProps {
  kind: AdminListingKind;
}

/** Newest postings kept per page — enough for search without paging UI. */
const ROW_LIMIT = 200;

const IS_TRIPS = (kind: AdminListingKind) => kind === 'trips';

function initialsOf(name?: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
}

/** The joined profile: trips are posted by truckers, loads by shippers. */
function posterOf(row: Row, kind: AdminListingKind): User | undefined {
  return IS_TRIPS(kind) ? (row as Trip).trucker : (row as Shipment).shipper;
}

function routeOf(row: Row): string {
  return `${row.origin_city} → ${row.destination_city}`;
}

function StatusPill({ status }: { status?: string | null }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        statusClass(status),
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

function PosterCell({ user, kind }: { user?: User; kind: AdminListingKind }) {
  const role = IS_TRIPS(kind) ? 'Trucker' : 'Shipper';
  const name = user?.full_name?.trim() || `Unknown ${role.toLowerCase()}`;
  const phone = user?.phone?.trim();

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span
        className={cn(
          'h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold',
          IS_TRIPS(kind)
            ? 'bg-orange-100 text-orange-700'
            : 'bg-blue-100 text-blue-700',
        )}
      >
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          initialsOf(name)
        )}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1">
          <span className="text-sm font-semibold text-gray-900 truncate">{name}</span>
          {user?.is_verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}
        </span>
        <span className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-500">
          {phone ? (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {phone}
            </span>
          ) : (
            <span>No phone</span>
          )}
          {user?.rating != null && (
            <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold">
              <Star className="h-3 w-3 fill-current" />
              {Number(user.rating).toFixed(1)}
            </span>
          )}
        </span>
      </span>
    </div>
  );
}

const AdminListings = ({ kind }: AdminListingsProps) => {
  const { getAuthenticatedClient } = useSupabase();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  // Deep links (KPI tiles) pass ?status= to land pre-filtered.
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(() =>
    searchParams.get('status') || 'all',
  );
  const [selected, setSelected] = useState<ListingSelection | null>(null);

  // Keep the URL in sync so the active filter survives refresh/share.
  const applyStatusFilter = useCallback(
    (status: string) => {
      setStatusFilter(status);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (status === 'all') next.delete('status');
          else next.set('status', status);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        setError(null);
        const supabase = await getAuthenticatedClient();
        const { data, error: err } = await supabase
          .from(kind)
          .select(IS_TRIPS(kind) ? TRIP_SELECT : SHIPMENT_SELECT)
          .order('created_at', { ascending: false })
          .limit(ROW_LIMIT);
        if (err) throw new Error(err.message);
        // SEC-01: attach full poster profiles (incl. phone for admin search)
        // from the admin_users_view RPC instead of direct `users` reads.
        const userMap = await fetchAdminUsersMap(supabase);
        const rowsData = IS_TRIPS(kind)
          ? attachTruckerToTrips((data ?? []) as Trip[], userMap)
          : attachShipperToShipments((data ?? []) as Shipment[], userMap);
        setRows(rowsData as unknown as Row[]);
      } catch (err) {
        console.error('[AdminListings] load failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to load listings');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getAuthenticatedClient, kind],
  );

  useEffect(() => {
    load();
  }, [load]);

  const statuses = useMemo(() => {
    const present = new Set<string>(rows.map((r) => r.status ?? ''));
    return STATUS_ORDER.filter((s) => present.has(s));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (!q) return true;
      const poster = posterOf(row, kind);
      const haystack = [
        poster?.full_name,
        poster?.phone,
        poster?.company_name,
        row.origin_city,
        row.origin_state,
        row.destination_city,
        row.destination_state,
        row.status,
        IS_TRIPS(kind)
          ? `${(row as Trip).vehicle_type} ${(row as Trip).vehicle_number}`
          : `${(row as Shipment).goods_description} ${(row as Shipment).pickup_address} ${(row as Shipment).delivery_address}`,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, search, statusFilter, kind]);

  const title = IS_TRIPS(kind) ? 'Trips' : 'Shipments';
  const subtitle = IS_TRIPS(kind)
    ? 'Every trip a trucker has posted, with the trucker behind it'
    : 'Every load a shipper has posted, with the shipper behind it';

  const openRow = (row: Row) => {
    setSelected(
      IS_TRIPS(kind)
        ? { type: 'trip', trip: row as Trip }
        : { type: 'shipment', shipment: row as Shipment },
    );
  };

  // ── Loading / error ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-8" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && rows.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
          <Button className="mt-4" variant="outline" onClick={() => load()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div className="flex items-start gap-3 min-w-0">
            <Link
              to="/admin/dashboard"
              aria-label="Back to dashboard"
              className="mt-1 p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div
              className={cn(
                'w-10 h-10 shrink-0 rounded-xl flex items-center justify-center shadow-lg',
                IS_TRIPS(kind)
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/20'
                  : 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/20',
              )}
            >
              {IS_TRIPS(kind) ? (
                <Truck className="h-5 w-5 text-white" />
              ) : (
                <Package className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
              <p className="text-sm text-gray-500">
                {rows.length} total · {filtered.length} shown
              </p>
              <p className="hidden sm:block text-xs text-gray-400 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing}>
            <RefreshCw className={cn('h-4 w-4 mr-1.5', refreshing && 'animate-spin')} />
            {refreshing ? 'Refreshing' : 'Refresh'}
          </Button>
        </div>

        {/* Toolbar */}
        <div className="mb-4 space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={
                IS_TRIPS(kind)
                  ? 'Search trucker, phone, city, vehicle…'
                  : 'Search shipper, phone, city, goods…'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-gray-200 bg-white"
            />
          </div>
          {statuses.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 [-scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {['all', ...statuses].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => applyStatusFilter(s)}
                  className={cn(
                    'shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                    statusFilter === s
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
                  )}
                >
                  {s === 'all' ? 'All' : statusLabel(s)}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="mb-3 text-xs text-red-600 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> {error} — showing last loaded data.
          </p>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-16 text-center">
            <Inbox className="h-8 w-8 mx-auto text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-700">No {title.toLowerCase()} found</p>
            <p className="mt-1 text-xs text-gray-500">
              {search || statusFilter !== 'all'
                ? 'Try clearing the search or status filter.'
                : 'Nothing has been posted yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop: table */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Posted by</th>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">{IS_TRIPS(kind) ? 'Vehicle & rate' : 'Load & budget'}</th>
                    <th className="px-4 py-3">Departure</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Posted</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => {
                    const trip = row as Trip;
                    const shipment = row as Shipment;
                    return (
                      <tr
                        key={row.id}
                        tabIndex={0}
                        role="button"
                        aria-label={`Open details for ${routeOf(row)}`}
                        onClick={() => openRow(row)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openRow(row);
                          }
                        }}
                        className="cursor-pointer border-b border-gray-100 last:border-0 transition-colors hover:bg-orange-50/50 focus:bg-orange-50/70 focus:outline-none"
                      >
                        <td className="px-4 py-3 max-w-[240px]">
                          <PosterCell user={posterOf(row, kind)} kind={kind} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                            <RouteIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span className="truncate">{routeOf(row)}</span>
                          </span>
                          <span className="mt-0.5 block text-[11px] text-gray-400">
                            {row.origin_state || row.destination_state
                              ? `${row.origin_state ?? '—'} → ${row.destination_state ?? '—'}`
                              : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {IS_TRIPS(kind) ? (
                            <>
                              <span className="block font-medium">
                                {trip.vehicle_type} · {trip.vehicle_number}
                              </span>
                              <span className="block text-[11px] text-gray-500">
                                {trip.available_capacity_tonnes} T @ {formatINR(trip.price_per_tonne)}/T
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="block font-medium truncate max-w-[220px]">
                                {shipment.goods_description}
                              </span>
                              <span className="block text-[11px] text-gray-500">
                                {shipment.weight_tonnes} T @ {formatINR(shipment.budget_per_tonne)}/T
                              </span>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(row.departure_date)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={row.status} />
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="block text-xs text-gray-600">
                            {formatDate(row.created_at)}
                          </span>
                          <span className="block text-[11px] text-gray-400">
                            {timeAgo(row.created_at)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: stacked cards */}
            <div className="md:hidden flex flex-col gap-2.5">
              {filtered.map((row) => {
                const trip = row as Trip;
                const shipment = row as Shipment;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => openRow(row)}
                    className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm active:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <PosterCell user={posterOf(row, kind)} kind={kind} />
                      <StatusPill status={row.status} />
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                      <RouteIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      {routeOf(row)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {IS_TRIPS(kind)
                        ? `${trip.vehicle_type} · ${trip.vehicle_number} · ${trip.available_capacity_tonnes} T @ ${formatINR(trip.price_per_tonne)}/T`
                        : `${shipment.goods_description} · ${shipment.weight_tonnes} T @ ${formatINR(shipment.budget_per_tonne)}/T`}
                    </p>
                    <p className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Departs {formatDate(row.departure_date)}</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-orange-600">
                        Details <ArrowRight className="h-3 w-3" />
                      </span>
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Footnote: what this page is for */}
        <p className="mt-6 flex items-center gap-1.5 text-[11px] text-gray-400">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Tap any row to see the full posting, the poster's profile, and the requests on it.
        </p>
      </div>

      <ListingDetailPanel selection={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default AdminListings;
