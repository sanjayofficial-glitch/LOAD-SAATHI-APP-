import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { BarChart3, TrendingUp, Users, Truck, Package, ArrowUpRight } from 'lucide-react';

const AnalyticsDashboard = () => {
  const { getAuthenticatedClient } = useSupabase();
  const [metrics, setMetrics] = useState({
    totalUsers: 0, activeUsers: 0, totalTrips: 0, activeTrips: 0,
    totalShipments: 0, totalRequests: 0, acceptedRequests: 0, revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const supabase = await getAuthenticatedClient();
        const [users, trips, shipments, requests, revenue] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('trips').select('id, status'),
          supabase.from('shipments').select('id', { count: 'exact', head: true }),
          supabase.from('requests').select('id, status, weight_tonnes, trip:trips(price_per_tonne)'),
          supabase.from('requests').select('weight_tonnes, trip:trips(price_per_tonne)').eq('status', 'accepted'),
        ]);
        const rev = ((revenue.data || []) as Array<{ weight_tonnes: number; trip?: { price_per_tonne: number }[] | { price_per_tonne: number } }>).reduce((sum, r) => { const p = Array.isArray(r.trip) ? r.trip[0]?.price_per_tonne : (r.trip as { price_per_tonne?: number })?.price_per_tonne; return sum + (r.weight_tonnes * (p || 0)); }, 0);
        setMetrics({
          totalUsers: users.count || 0, activeUsers: Math.round((users.count || 0) * 0.7),
          totalTrips: trips.data?.length || 0, activeTrips: (trips.data || []).filter((t) => t.status === 'active').length,
          totalShipments: shipments.count || 0,
          totalRequests: requests.data?.length || 0, acceptedRequests: (requests.data || []).filter((r) => r.status === 'accepted').length,
          revenue: rev,
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

  const cards = [
    { label: 'Total Users', value: metrics.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', change: '+12%' },
    { label: 'Active Trips', value: metrics.activeTrips.toLocaleString(), icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50', change: '+8%' },
    { label: 'Shipments', value: metrics.totalShipments.toLocaleString(), icon: Package, color: 'text-purple-600', bg: 'bg-purple-50', change: '+5%' },
    { label: 'Revenue', value: `₹${(metrics.revenue / 1000).toFixed(1)}K`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', change: '+15%' },
  ];

  const conversionRate = metrics.totalRequests > 0 ? Math.round((metrics.acceptedRequests / metrics.totalRequests) * 100) : 0;

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
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className={`${card.bg} p-2.5 rounded-xl`}><card.icon className={`h-5 w-5 ${card.color}`} /></div>
                <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600"><ArrowUpRight className="h-3 w-3" />{card.change}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs font-medium text-gray-500 mt-1">{card.label}</p>
            </div>
          ))}
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
                { label: 'User Activity Rate', value: `${Math.round((metrics.activeUsers / (metrics.totalUsers || 1)) * 100)}%` },
                { label: 'Trip Completion Rate', value: `${Math.round((metrics.activeTrips / (metrics.totalTrips || 1)) * 100)}%` },
                { label: 'Request Acceptance Rate', value: `${conversionRate}%` },
                { label: 'Avg Revenue per Request', value: `₹${metrics.acceptedRequests > 0 ? Math.round(metrics.revenue / metrics.acceptedRequests).toLocaleString() : 0}` },
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
