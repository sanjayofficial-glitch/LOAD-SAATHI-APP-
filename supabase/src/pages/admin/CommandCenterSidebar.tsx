import { Truck, Package, Navigation, Clock, BarChart3, Briefcase, Terminal, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SystemMetricsPanel from './SystemMetricsPanel';
import BusinessMetricsPanel from './BusinessMetricsPanel';
import LiveEventFeed from './LiveEventFeed';
import UserActivityTable from './UserActivityTable';
import type { UserLocation } from './CommandCenterMap';
import type { User, Trip, Shipment } from '@/types';

interface Event {
  id: string;
  type: 'trip' | 'booking' | 'user' | 'chat' | 'alert';
  message: string;
  time: string;
  raw_date?: string;
}

interface CommandCenterSidebarProps {
  locations: UserLocation[];
  users: User[];
  trips: Trip[];
  shipments: Shipment[];
  events: Event[];
  metrics: {
    active_connections: number;
    api_response_time: number;
    error_rate: number;
    active_requests: number;
  };
  businessMetrics: {
    total_shipments: number;
    total_trips: number;
    pending_requests: number;
    accepted_requests: number;
    estimated_revenue: number;
    success_rate: number;
  };
}

function QuickStatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; dot: string }> = {
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-500' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-500' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-500' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-500' },
  };
  const c = colorMap[color] ?? colorMap.orange ?? { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-500' };

  return (
    <div className="bg-slate-800/70 border border-slate-700/70 rounded-lg p-3 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <Icon className={`h-3.5 w-3.5 ${c.text}`} />
        <div className={`h-1.5 w-1.5 rounded-full ${c.dot} animate-pulse`} />
      </div>
      <p className="text-xl font-mono font-bold text-white">{value}</p>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    </div>
  );
}

function PanelSection({
  icon: Icon,
  title,
  color,
  children,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
  };

  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 overflow-hidden shrink-0">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-700/60 shrink-0">
        <div className="flex items-center gap-2">
          <Icon className={`h-3.5 w-3.5 ${colorMap[color] || 'text-slate-400'}`} />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-200">{title}</h2>
        </div>
        {badge}
      </div>
      <div className="p-3">
        {children}
      </div>
    </div>
  );
}

export default function CommandCenterSidebar({
  locations,
  users,
  trips,
  shipments,
  events,
  metrics,
  businessMetrics,
}: CommandCenterSidebarProps) {
  const onlineCount = locations.length;
  const onTripCount = locations.filter(l => l.trip_id).length;

  return (
    <div className="h-full flex flex-col bg-slate-950/95 backdrop-blur-xl border-l border-slate-700/60 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/60 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-orange-600 p-1.5 rounded-lg">
              <Navigation className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <h1 className="text-[11px] font-black tracking-tight uppercase text-white">Command Center</h1>
              <div className="flex items-center gap-1.5">
                <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">System Live</span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="border-green-700 bg-green-900/30 text-green-400 font-mono text-[9px] px-2 py-0.5">
            <Activity className="h-2.5 w-2.5 mr-1" />
            {onlineCount} LIVE
          </Badge>
        </div>
      </div>

      {/* Scrollable content — every section lives in its own contained card */}
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="p-3 space-y-2.5">
          {/* Quick Stats */}
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-3 shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <QuickStatCard icon={Navigation} label="Online" value={onlineCount} color="orange" />
              <QuickStatCard icon={Clock} label="On Trip" value={onTripCount} color="green" />
              <QuickStatCard icon={Package} label="Loads" value={shipments.length} color="blue" />
              <QuickStatCard icon={Truck} label="Trips" value={trips.length} color="purple" />
            </div>
          </div>

          {/* System Metrics */}
          <PanelSection icon={BarChart3} title="System" color="blue">
            <SystemMetricsPanel metrics={metrics} />
          </PanelSection>

          {/* Business Metrics */}
          <PanelSection icon={Briefcase} title="Business" color="purple">
            <BusinessMetricsPanel metrics={businessMetrics} />
          </PanelSection>

          {/* Live Event Feed */}
          <PanelSection icon={Terminal} title="Console" color="green">
            <LiveEventFeed events={events} />
          </PanelSection>

          {/* User Activity */}
          <PanelSection
            icon={Activity}
            title="Users"
            color="orange"
            badge={
              <Badge variant="outline" className="border-slate-600 bg-slate-800/70 text-slate-300 font-mono text-[9px] px-1.5 py-0">
                {users.length}
              </Badge>
            }
          >
            <UserActivityTable users={users} />
          </PanelSection>

          {/* Bottom spacer */}
          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}
