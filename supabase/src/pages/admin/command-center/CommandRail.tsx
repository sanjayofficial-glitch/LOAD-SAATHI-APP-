import {
  Truck,
  Package,
  TrendingUp,
  Sparkles,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Bell,
  Radio,
  Route as RouteIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { TruckLocation } from '@/components/maps/TruckMarker';
import type { LoadLocation } from '@/components/maps/LoadMarker';
import SmartMatchPanel from './SmartMatchPanel';
import RevenueTracker from './RevenueTracker';
import ActivityDigest from './ActivityDigest';
import AlertPanel from './AlertPanel';
import AlertRulesEngine from './AlertRulesEngine';
import QuickActionsToolbar from './QuickActionsToolbar';
import LiveFeedPanel from './LiveFeedPanel';
import PostedListingsPanel from './PostedListingsPanel';
import VirtualList from './VirtualList';
import { SkeletonList } from './SkeletonCard';
import { cn } from '@/lib/utils';
import type { PendingAgeing, StatsData, TrendData } from './types';
import type { AdminAlert, AlertConfig } from './alerts';
import type { FeedEvent } from './useAdminEventFeed';
import type { Shipment, Trip } from '@/types';

export interface CommandRailProps {
  alerts: AdminAlert[];
  /** Alert ids acknowledged today — rendered dimmed with an "Acknowledged" badge. */
  acknowledged?: ReadonlySet<string>;
  onAcknowledge?: (alertId: string) => void;
  onDrillDown?: (alert: AdminAlert) => void;
  alertConfig: AlertConfig;
  onAlertConfigChange: (config: AlertConfig) => void;
  onBroadcast: (message: string) => void;
  onAutoMatch: () => void;
  onExport: () => void;
  /** Online users the broadcast will reach. */
  onlineCount: number;
  /** Ageing buckets for unmatched value, when the financials query has run. */
  pendingAgeing?: PendingAgeing | null;
  events: FeedEvent[];
  now: number;
  onTripTrucks: TruckLocation[];
  idleTrucks: TruckLocation[];
  loads: LoadLocation[];
  stats: StatsData | null;
  trends: TrendData;
  hotCorridors: Array<{ route: string; count: number }>;
  locationsLoading: boolean;
  loadsLoading: boolean;
  statsLoading: boolean;
  expandedSections: Set<string>;
  onToggleSection: (section: string) => void;
  onTruckClick: (truck: TruckLocation) => void;
  onLoadClick: (load: LoadLocation) => void;
  onReviewLoad: (load: LoadLocation) => void;
  /** Trips posted by truckers and loads posted by shippers. */
  trips: Trip[];
  shipments: Shipment[];
  listingsLoading?: boolean;
  selectedTripId?: string | null;
  selectedShipmentId?: string | null;
  onSelectTrip: (trip: Trip) => void;
  onSelectShipment: (shipment: Shipment) => void;
}

type SectionKey =
  | 'alerts'
  | 'trips'
  | 'feed'
  | 'matches'
  | 'onTrip'
  | 'idle'
  | 'loads'
  | 'revenue'
  | 'digest'
  | 'corridors';

interface SectionDef {
  key: SectionKey;
  label: string;
  icon: React.ReactNode;
  count?: number;
  critical?: boolean;
}

function TruckRow({
  truck,
  onClick,
  tone = 'idle',
}: {
  truck: TruckLocation;
  onClick: () => void;
  tone?: 'idle' | 'trip';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full shrink-0',
            tone === 'trip' ? 'bg-emerald-500' : 'bg-amber-400',
          )}
        />
        <p className="font-medium truncate text-xs text-gray-800 flex-1">
          {truck.driver_name || 'Truck'}
        </p>
      </div>
      <p className="text-gray-500 truncate text-[10px] pl-3.5">
        {truck.origin_city && truck.destination_city
          ? `${truck.origin_city} → ${truck.destination_city}`
          : truck.vehicle_type || 'Location active'}
      </p>
    </button>
  );
}

export default function CommandRail({
  alerts,
  acknowledged,
  onAcknowledge,
  onDrillDown,
  alertConfig,
  onAlertConfigChange,
  onBroadcast,
  onAutoMatch,
  onExport,
  onlineCount,
  pendingAgeing,
  events,
  now,
  onTripTrucks,
  idleTrucks,
  loads,
  stats,
  trends,
  hotCorridors,
  locationsLoading,
  loadsLoading,
  statsLoading,
  expandedSections,
  onToggleSection,
  onTruckClick,
  onLoadClick,
  onReviewLoad,
  trips,
  shipments,
  listingsLoading,
  selectedTripId,
  selectedShipmentId,
  onSelectTrip,
  onSelectShipment,
}: CommandRailProps) {
  // Acknowledged alerts stay visible (dimmed, marked) but stop counting as open.
  const openAlerts = alerts.filter(
    (a) => a.id !== 'all-clear' && !(acknowledged?.has(a.id) ?? false),
  );
  const criticalCount = openAlerts.filter((a) => a.severity !== 'info').length;

  const sections: SectionDef[] = [
    { key: 'alerts', label: 'Alerts', icon: <Bell className="h-3.5 w-3.5 text-red-500" />, count: criticalCount, critical: criticalCount > 0 },
    {
      key: 'trips',
      label: 'Trips & Loads',
      icon: <RouteIcon className="h-3.5 w-3.5 text-orange-500" />,
      count: trips.length + shipments.length,
    },
    { key: 'feed', label: 'Live Activity', icon: <Radio className="h-3.5 w-3.5 text-emerald-500" /> },
    { key: 'matches', label: 'Smart Matches', icon: <Sparkles className="h-3.5 w-3.5 text-purple-500" /> },
    { key: 'onTrip', label: 'On Trip', icon: <Truck className="h-3.5 w-3.5 text-emerald-600" />, count: onTripTrucks.length },
    { key: 'idle', label: 'Idle Trucks', icon: <Truck className="h-3.5 w-3.5 text-amber-500" />, count: idleTrucks.length },
    { key: 'loads', label: 'Load Demand', icon: <Package className="h-3.5 w-3.5 text-blue-500" />, count: loads.length },
    { key: 'revenue', label: 'Revenue', icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> },
    { key: 'digest', label: 'Daily Digest', icon: <Clock className="h-3.5 w-3.5 text-amber-500" /> },
    { key: 'corridors', label: 'Top Corridors', icon: <MapPin className="h-3.5 w-3.5 text-pink-500" /> },
  ];

  return (
    <div className="p-2 space-y-1.5">
      {sections.map(({ key, label, icon, count, critical }) => {
        const isExpanded = expandedSections.has(key);
        return (
          <div key={key} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <button
              type="button"
              aria-expanded={isExpanded}
              onClick={() => onToggleSection(key)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                {icon}
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 truncate">
                  {label}
                </span>
                {count != null && count > 0 && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[9px] px-1.5 py-0 shrink-0',
                      critical
                        ? 'border-red-200 bg-red-50 text-red-600'
                        : 'border-gray-200 text-gray-500',
                    )}
                  >
                    {count}
                  </Badge>
                )}
              </div>
              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              )}
            </button>

            {isExpanded && (
              <div className="px-2.5 pb-2.5 pt-0.5">
                {key === 'alerts' && (
                  <div className="space-y-2">
                    <AlertPanel
                      alerts={alerts}
                      variant="list"
                      acknowledged={acknowledged}
                      onAcknowledge={onAcknowledge}
                      onDrillDown={onDrillDown}
                    />
                    <div className="flex justify-end">
                      <AlertRulesEngine
                        config={alertConfig}
                        onChange={onAlertConfigChange}
                        activeCount={openAlerts.length}
                      />
                    </div>
                  </div>
                )}

                {key === 'trips' && (
                  <PostedListingsPanel
                    trips={trips}
                    shipments={shipments}
                    loading={listingsLoading}
                    density="rail"
                    selectedTripId={selectedTripId}
                    selectedShipmentId={selectedShipmentId}
                    onSelectTrip={onSelectTrip}
                    onSelectShipment={onSelectShipment}
                  />
                )}

                {key === 'feed' && (
                  <div className="space-y-2">
                    <LiveFeedPanel events={events} now={now} />
                    <QuickActionsToolbar
                      onlineCount={onlineCount}
                      onBroadcast={onBroadcast}
                      onAutoMatch={onAutoMatch}
                      onExport={onExport}
                    />
                  </div>
                )}

                {key === 'matches' && (
                  <SmartMatchPanel trucks={idleTrucks} loads={loads} onReview={onReviewLoad} />
                )}

                {key === 'onTrip' && (
                  onTripTrucks.length === 0 ? (
                    <p className="text-[11px] text-gray-400 py-2 text-center">No trucks on trip</p>
                  ) : (
                    <VirtualList
                      items={onTripTrucks}
                      itemHeight={40}
                      maxHeight={200}
                      renderItem={(t) => (
                        <TruckRow key={t.driver_id} truck={t} tone="trip" onClick={() => onTruckClick(t)} />
                      )}
                    />
                  )
                )}

                {key === 'idle' && (
                  locationsLoading ? (
                    <SkeletonList count={3} />
                  ) : idleTrucks.length === 0 ? (
                    <p className="text-[11px] text-gray-400 py-2 text-center">No idle trucks</p>
                  ) : (
                    <VirtualList
                      items={idleTrucks}
                      itemHeight={40}
                      maxHeight={200}
                      renderItem={(t) => (
                        <TruckRow key={t.driver_id} truck={t} tone="idle" onClick={() => onTruckClick(t)} />
                      )}
                    />
                  )
                )}

                {key === 'loads' && (
                  loadsLoading ? (
                    <SkeletonList count={3} />
                  ) : loads.length === 0 ? (
                    <p className="text-[11px] text-gray-400 py-2 text-center">No active loads</p>
                  ) : (
                    <VirtualList
                      items={loads}
                      itemHeight={40}
                      maxHeight={200}
                      renderItem={(load) => (
                        <button
                          key={load.id}
                          type="button"
                          onClick={() => onLoadClick(load)}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <p className="font-medium truncate text-xs text-gray-800">
                            {load.origin_city} → {load.dest_city}
                          </p>
                          <p className="text-gray-500 truncate text-[10px]">
                            {load.weight_tonnes != null && `${load.weight_tonnes}T`}
                            {load.budget_per_tonne != null &&
                              ` • ₹${load.budget_per_tonne.toLocaleString('en-IN')}/T`}
                          </p>
                        </button>
                      )}
                    />
                  )
                )}

                {key === 'revenue' && (
                  <RevenueTracker
                    todayRevenue={stats?.todayRevenue ?? 0}
                    pendingRevenue={stats?.pendingRevenue ?? 0}
                    yesterdayRevenue={stats?.yesterdayRevenue ?? 0}
                    weeklyTrend={trends.revenue}
                    ageing={pendingAgeing ?? undefined}
                    loading={statsLoading}
                  />
                )}

                {key === 'digest' && (
                  <ActivityDigest
                    stats={{
                      tripsCompleted: stats?.completedToday ?? 0,
                      loadsMatched: stats?.matchedLoads ?? 0,
                      revenue: stats?.todayRevenue ?? 0,
                      peakHour: stats?.peakHour ?? '—',
                    }}
                  />
                )}

                {key === 'corridors' && (
                  hotCorridors.length === 0 ? (
                    <p className="text-[11px] text-gray-400 py-2 text-center">No corridor data</p>
                  ) : (
                    <div className="space-y-0.5">
                      {hotCorridors.map((c, i) => (
                        <div key={i} className="flex items-center justify-between px-2 py-1.5 text-xs">
                          <span className="truncate flex-1 text-gray-600">{c.route}</span>
                          <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                            {c.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
