import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { BarChart3, TrendingUp, Users, Truck, ArrowUpRight } from 'lucide-react';

type TimedRow = { created_at?: string | null };

function deltaPct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Week-over-week delta for a list of dated rows (last 7 days vs the 7 before). */
function bucketDelta(rows: Array<TimedRow>): number | null {
  const now = Date.now();
  const weekAgo = now - 7 * 86_400_000;
  const twoWeeksAgo = now - 14 * 86_400_000;
  let current = 0;
  let previous = 0;
  for (const r of rows) {
    const t = r.created_at ? new Date(r.created_at).getTime() : NaN;
    if (!Number.isFinite(t)) continue;
    if (t >= weekAgo) current += 1;
    else if (t >= twoWeeksAgo) previous += 1;
  }
  return deltaPct(current, previous);
}

type RevenueRow = {
  weight_tonnes: number | null;
  created_at?: string | null;
  trip?: { price_per_tonne: number }[] | { price_per_tonne: number } | null;
};

function revenueOf(row: RevenueRow): number {
  const trip = row.trip;
  const price = Array.isArray(trip) ? trip[0]?.price_per_tonne : trip?.price_per_tonne;
  return (row.weight_tonnes ?? 0) * (price ?? 0);
}

type RequestRow = {
  id: string;
  status: string;
  weight_tonnes: number | null;
  shipper_id: string;
  receiver_id: string | null;
  created_at: string;
  trip?: { price_per_tonne: number }[] | { price_per_tonne: number } | null;
};

const AnalyticsDashboard = () => {
  const { getAuthenticatedClient } = useSupabase();
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTrips: 0,
    activeTrips: 0,
    completedTrips: 0,
    totalShipments: 0,
    totalRequests: 0,
    acceptedRequests: 0,
    revenue: 0,
    usersDelta: null as number | null,
    tripsDelta: null as number | null,
    shipmentsDelta: null as number | null,
    revenueDelta: null as number | null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const supabase = await getAuthenticatedClient();
        const [users, trips, shipments, requests, revenue] = await Promise.all([
          supabase.from('users').select('created_at'),
          supabase.from('trips').select('id, status, trucker_id, created_at'),
          supabase.from('shipments').select('id, shipper_id, created_at'),
          supabase
            .from('requests')
            .select('id, status, weight_tonnes, shipper_id, receiver_id, created_at, trip:trips(price_per_tonne)'),
          supabase
            .from('requests')
            .select('weight_tonnes, created_at, trip:trips(price_per_tonne)')
            .eq('status', 'accepted'),
        ]);
        const tripsData = (trips.data ?? []) as Array<{ status: string; trucker_id: string; created_at: string }>;
        const shipmentsData = (shipments.data ?? []) as Array<{ shipper_id: string; created_at: string }>;
        const requestsData = (requests.data ?? []) as RequestRow[];
        const userRows = (users.data ?? []) as Array<TimedRow>;
        const revenueRows = (revenue.data ?? []) as RevenueRow[];

        // Real active users: distinct users with any action (trip, load or request)
        // in the last 30 days — no more "70% of total" guesswork.
        const thirtyDays = Date.now() - 30 * 86_400_000;
        const recentActorIds = new Set<string>();
        for (const t of tripsData) if (new Date(t.created_at).getTime() >= thirtyDays) recentActorIds.add(t.trucker_id);
        for (const s of shipmentsData) if (new Date(s.created_at).getTime() >= thirtyDays) recentActorIds.add(s.shipper_id);
        for (const rq of requestsData) {
          if (new Date(rq.created_at).getTime() >= thirtyDays) {
            recentActorIds.add(rq.shipper_id);
            if (rq.receiver_id) recentActorIds.add(rq.receiver_id);
          }
        }

        let totalRevenue = 0;
        let revCurrent = 0;
        let revPrevious = 0;
        const nowMs = Date.now();
        const weekAgo = nowMs - 7 * 86_400_000;
        const twoWeeksAgo = nowMs - 14 * 86_400_000;
        for (const row of revenueRows) {
          const value = revenueOf(row);
          totalRevenue += value;
          const t = row.created_at ? new Date(row.created_at).getTime() : NaN;
          if (!Number.isFinite(t)) continue;
          if (t >= weekAgo) revCurrent += value;
          else if (t >= twoWeeksAgo) revPrevious += value;
        }

        setMetrics({
          totalUsers: userRows.length,
          activeUsers: recentActorIds.size,
          totalTrips: tripsData.length,
          activeTrips: tripsData.filter((t) => t.status === 'active').length,
          completedTrips: tripsData.filter((t) => t.status === 'completed').length,
          totalShipments: shipmentsData.length,
          totalRequests: requestsData.length,
          acceptedRequests: requestsData.filter((r) => r.status === 'accepted').length,
          revenue: totalRevenue,
          usersDelta: bucketDelta(userRows),
          tripsDelta: bucketDelta(tripsData),
          shipmentsDelta: bucketDelta(shipmentsData),
          revenueDelta: deltaPct(revCurrent, revPrevious),
        });
      } catch (err) { console.error('[Analytics]', err); } finally { setLoading(false); }
    };
    fetchMetrics();
  }, [getAuthenticatedClient]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-8" />
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />)}
          </div>
          <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const change = (delta: number | null): { text: string; up: boolean } =>
    delta == null
      ? { text: '—', up: false }
      : { text: `${delta > 0 ? '+' : ''}${delta}%`, up: delta >= 0 };

  const cards = [
    { label: 'Total Users', value: metrics.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', delta: metrics.usersDelta },
    { label: 'Active Users (30d)', value: metrics.activeUsers.toLocaleString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', delta: null },
    { label: 'Active Trips', value: metrics.activeTrips.toLocaleString(), icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50', delta: metrics.tripsDelta },
    { label: 'Est. GMV', value: `₹${(metrics.revenue / 1000).toFixed(1)}K`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', delta: metrics.revenueDelta },
  ];

  const conversionRate = metrics.totalRequests > 0 ? Math.round((metrics.acceptedRequests / metrics.totalRequests) * 100) : 0;
  const userActivityRate = metrics.totalUsers > 0 ? Math.round((metrics.activeUsers / metrics.totalUsers) * 100) : 0;
  const tripCompletionRate = metrics.totalTrips > 0 ? Math.round((metrics.completedTrips / metrics.totalTrips) * 100) : 0;
  const avgRevenuePerAccepted = metrics.acceptedRequests > 0 ? Math.round(metrics.revenue / metrics.acceptedRequests) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500">Platform performance and insights</p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          {cards.map((card) => {
            const ch = change(card.delta);
            return (
              <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className={`${card.bg} p-2.5 rounded-xl`}><card.icon className={`h-5 w-5 ${card.color}`} /></div>
                  <span className={`flex items-center gap-0.5 text-xs font-semibold ${card.delta == null ? 'text-gray-400' : ch.up ? 'text-green-600' : 'text-red-500'}`}>
                    {card.delta != null && ch.up && <ArrowUpRight className="h-3 w-3" />}
                    {ch.text}
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs font-medium text-gray-500 mt-1">{card.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Request Funnel</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Requests', value: metrics.totalRequests, pct: 100, color: 'bg-blue-500' },
                { label: 'Accepted', value: metrics.acceptedRequests, pct: conversionRate, color: 'bg-green-500' },
                { label: 'Pending', value: metrics.totalRequests - metrics.acceptedRequests, pct: 100 - conversionRate, color: 'bg-amber-500' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-semibold text-gray-900">{item.value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Key Metrics</h3>
            <div className="space-y-3">
              {[
                { label: 'User Activity Rate (30d)', value: `${userActivityRate}%` },
                { label: 'Trip Completion Rate', value: `${tripCompletionRate}%` },
                { label: 'Request Acceptance Rate', value: `${conversionRate}%` },
                { label: 'Avg Est. GMV per Accepted', value: `₹${avgRevenuePerAccepted.toLocaleString()}` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-600">{item.label}</span>
                  <span className="text-sm font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
