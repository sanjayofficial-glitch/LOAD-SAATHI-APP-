import KPICard from './KPICard';
import {
  Truck,
  Package,
  Phone,
  Activity,
  Zap,
  MapPin,
  Clock,
  TrendingUp,
} from 'lucide-react';

interface KPIGridProps {
  stats: {
    activeTrucks: number;
    activeLoads: number;
    todayLeads: number;
    activeTrips: number;
    pendingRequests: number;
    unmatchedShipments: number;
    completedToday: number;
    estimatedRevenue: number;
  };
  trends: {
    trucks: number[];
    loads: number[];
    leads: number[];
    trips: number[];
    pending: number[];
    unmatched: number[];
    completed: number[];
    revenue: number[];
  };
  loading: boolean;
  onCardClick: (card: string) => void;
}

export default function KPIGrid({ stats, trends, loading, onCardClick }: KPIGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-2">
      <KPICard
        icon={<Truck className="h-4 w-4" />}
        label="Trucks"
        value={stats.activeTrucks}
        trend={trends.trucks}
        trendLabel="Active Trucks"
        color="orange"
        onClick={() => onCardClick('trucks')}
        loading={loading}
      />
      <KPICard
        icon={<Package className="h-4 w-4" />}
        label="Loads"
        value={stats.activeLoads}
        trend={trends.loads}
        trendLabel="Active Loads"
        color="blue"
        onClick={() => onCardClick('loads')}
        loading={loading}
      />
      <KPICard
        icon={<Phone className="h-4 w-4" />}
        label="Today Leads"
        value={stats.todayLeads}
        trend={trends.leads}
        trendLabel="Today Leads"
        color="amber"
        loading={loading}
      />
      <KPICard
        icon={<Activity className="h-4 w-4" />}
        label="In Transit"
        value={stats.activeTrips}
        trend={trends.trips}
        trendLabel="In Transit"
        color="green"
        onClick={() => onCardClick('trips')}
        loading={loading}
      />
      <KPICard
        icon={<Zap className="h-4 w-4" />}
        label="Pending"
        value={stats.pendingRequests}
        trend={trends.pending}
        trendLabel="Pending Requests"
        color="amber"
        loading={loading}
      />
      <KPICard
        icon={<MapPin className="h-4 w-4" />}
        label="Unmatched"
        value={stats.unmatchedShipments}
        trend={trends.unmatched}
        trendLabel="Unmatched"
        color="purple"
        onClick={() => onCardClick('unmatched')}
        loading={loading}
      />
      <KPICard
        icon={<Clock className="h-4 w-4" />}
        label="Done Today"
        value={stats.completedToday}
        trend={trends.completed}
        trendLabel="Completed Today"
        color="emerald"
        loading={loading}
      />
      <KPICard
        icon={<TrendingUp className="h-4 w-4" />}
        label="Revenue"
        value={`₹${(stats.estimatedRevenue / 1000).toFixed(1)}K`}
        trend={trends.revenue}
        trendLabel="Est. Revenue"
        color="emerald"
        loading={loading}
      />
    </div>
  );
}
