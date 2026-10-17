import { Truck, Package, TrendingUp, Activity, ChevronDown, ChevronUp, MapPin, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { TruckLocation } from '@/components/maps/TruckMarker';
import type { LoadLocation } from '@/components/maps/LoadMarker';
import SmartMatchPanel from './SmartMatchPanel';
import RevenueTracker from './RevenueTracker';
import ActivityDigest from './ActivityDigest';
import VirtualList from './VirtualList';
import { SkeletonList } from './SkeletonCard';
import type { StatsData, TrendData } from './types';

interface SidebarDrawerProps {
  activeTruckers: TruckLocation[];
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
  onMatch: (truckId: string, loadId: string) => void;
}

type SectionKey = 'trucks' | 'loads' | 'matches' | 'revenue' | 'digest' | 'corridors';

const SECTIONS: Array<{ key: SectionKey; label: string; icon: React.ReactNode }> = [
  { key: 'trucks', label: 'Active Trucks', icon: <Truck className="h-3.5 w-3.5 text-orange-400" /> },
  { key: 'loads', label: 'Load Demand', icon: <Package className="h-3.5 w-3.5 text-blue-400" /> },
  { key: 'matches', label: 'Smart Matches', icon: <Activity className="h-3.5 w-3.5 text-purple-400" /> },
  { key: 'revenue', label: 'Revenue', icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> },
  { key: 'digest', label: 'Daily Digest', icon: <Clock className="h-3.5 w-3.5 text-amber-400" /> },
  { key: 'corridors', label: 'Hot Corridors', icon: <MapPin className="h-3.5 w-3.5 text-pink-400" /> },
];

export default function SidebarDrawer({
  activeTruckers,
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
  onMatch,
}: SidebarDrawerProps) {
  return (
    <div className="w-full lg:w-[320px] shrink-0 border-l border-slate-800 bg-slate-950/95 backdrop-blur-xl overflow-y-auto">
      <div className="p-2 space-y-1">
        {SECTIONS.map(({ key, label, icon }) => {
          const isExpanded = expandedSections.has(key);
          return (
            <div key={key} className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
              <button
                onClick={() => onToggleSection(key)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {icon}
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">{label}</span>
                  {key === 'trucks' && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-orange-500/30 text-orange-400">
                      {activeTruckers.length}
                    </Badge>
                  )}
                  {key === 'loads' && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-blue-500/30 text-blue-400">
                      {loads.length}
                    </Badge>
                  )}
                </div>
                {isExpanded ? <ChevronUp className="h-3 w-3 text-slate-500" /> : <ChevronDown className="h-3 w-3 text-slate-500" />}
              </button>

              {isExpanded && (
                <div className="px-2 pb-2">
                  {key === 'trucks' && (
                    locationsLoading ? (
                      <SkeletonList count={3} />
                    ) : activeTruckers.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2 text-center">No active trucks</p>
                    ) : (
                      <VirtualList
                        items={activeTruckers}
                        itemHeight={44}
                        maxHeight={160}
                        renderItem={(truck) => (
                          <button
                            key={truck.driver_id}
                            onClick={() => onTruckClick(truck)}
                            className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-slate-800/50 transition-colors"
                          >
                            <p className="font-medium truncate text-slate-200">{truck.driver_name || 'Truck'}</p>
                            <p className="text-slate-500 truncate text-[10px]">
                              {truck.origin_city && truck.destination_city
                                ? `${truck.origin_city} → ${truck.destination_city}`
                                : truck.vehicle_type || 'Location active'}
                            </p>
                          </button>
                        )}
                      />
                    )
                  )}

                  {key === 'loads' && (
                    loadsLoading ? (
                      <SkeletonList count={3} />
                    ) : loads.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2 text-center">No active loads</p>
                    ) : (
                      <VirtualList
                        items={loads}
                        itemHeight={44}
                        maxHeight={160}
                        renderItem={(load) => (
                          <button
                            key={load.id}
                            onClick={() => onLoadClick(load)}
                            className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-slate-800/50 transition-colors"
                          >
                            <p className="font-medium truncate text-slate-200">
                              {load.origin_city} → {load.dest_city}
                            </p>
                            <p className="text-slate-500 truncate text-[10px]">
                              {load.weight_tonnes != null && `${load.weight_tonnes}T`}
                              {load.budget_per_tonne != null && ` • ₹${load.budget_per_tonne.toLocaleString('en-IN')}/T`}
                            </p>
                          </button>
                        )}
                      />
                    )
                  )}

                  {key === 'matches' && (
                    <SmartMatchPanel trucks={activeTruckers} loads={loads} onMatch={onMatch} />
                  )}

                  {key === 'revenue' && (
                    <RevenueTracker
                      todayRevenue={stats?.todayRevenue ?? 0}
                      pendingRevenue={stats?.pendingRevenue ?? 0}
                      yesterdayRevenue={stats?.yesterdayRevenue ?? 0}
                      weeklyTrend={trends.revenue}
                      loading={statsLoading}
                    />
                  )}

                  {key === 'digest' && (
                    <ActivityDigest
                      stats={{
                        tripsCompleted: stats?.completedToday ?? 0,
                        loadsMatched: (stats?.activeLoads ?? 0) - (stats?.unmatchedShipments ?? 0),
                        revenue: stats?.todayRevenue ?? 0,
                        delayedTrips: 0,
                        cancelledTrips: 0,
                        peakHour: '10-12',
                      }}
                    />
                  )}

                  {key === 'corridors' && (
                    hotCorridors.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2 text-center">No corridor data</p>
                    ) : (
                      <div className="space-y-1">
                        {hotCorridors.map((c, i) => (
                          <div key={i} className="flex items-center justify-between px-2 py-1.5 text-xs">
                            <span className="truncate flex-1 text-slate-300">{c.route}</span>
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
    </div>
  );
}
