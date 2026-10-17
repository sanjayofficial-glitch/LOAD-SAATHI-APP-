import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Users, Truck, Package, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const AdminDashboard = () => {
  const { getAuthenticatedClient } = useSupabase();
  const [stats, setStats] = useState({ users: 0, trips: 0, requests: 0, shipments: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        const supabaseClient = await getAuthenticatedClient();
        const [users, trips, requests, shipments] = await Promise.all([
          supabaseClient.from('users').select('*', { count: 'exact', head: true }),
          supabaseClient.from('trips').select('*', { count: 'exact', head: true }),
          supabaseClient.from('requests').select('*', { count: 'exact', head: true }),
          supabaseClient.from('shipments').select('*', { count: 'exact', head: true }),
        ]);
        setStats({ users: users.count || 0, trips: trips.count || 0, requests: requests.count || 0, shipments: shipments.count || 0 });
      } catch (err) {
        console.error('[AdminDashboard] Error:', err);
        setError('Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [getAuthenticatedClient]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-8" />
          <div className="grid md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  const cards = [
    { title: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%', up: true },
    { title: 'Total Trips', value: stats.trips, icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50', trend: '+8%', up: true },
    { title: 'Shipments', value: stats.shipments, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+5%', up: true },
    { title: 'Requests', value: stats.requests, icon: Activity, color: 'text-green-600', bg: 'bg-green-50', trend: '-3%', up: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Platform overview and key metrics</p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <div key={card.title} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`${card.bg} p-2.5 rounded-xl`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${card.up ? 'text-green-600' : 'text-red-500'}`}>
                  {card.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {card.trend}
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
              <p className="text-xs font-medium text-gray-500 mt-1">{card.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
