import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Truck, Package, Loader2, BarChart3, Activity } from 'lucide-react';

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
        const { count: users } = await supabaseClient.from('users').select('*', { count: 'exact', head: true });
        const { count: trips } = await supabaseClient.from('trips').select('*', { count: 'exact', head: true });
        const { count: requests } = await supabaseClient.from('requests').select('*', { count: 'exact', head: true });
        const { count: shipments } = await supabaseClient.from('shipments').select('*', { count: 'exact', head: true });
        setStats({ users: users || 0, trips: trips || 0, requests: requests || 0, shipments: shipments || 0 });
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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-6">Admin Dashboard</h1>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 dark:text-orange-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-6">Admin Dashboard</h1>
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-300 text-sm">{error}</div>
      </div>
    );
  }

  const cards = [
    { title: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800' },
    { title: 'Total Trips', value: stats.trips, icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-100 dark:border-orange-800' },
    { title: 'Shipments', value: stats.shipments, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-100 dark:border-purple-800' },
    { title: 'Requests', value: stats.requests, icon: Activity, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-100 dark:border-green-800' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-1.5 rounded-lg shadow-sm">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Admin Dashboard</h1>
      </div>
      
      <div className="grid md:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <Card key={card.title} className={`${card.border} shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in-up`} style={{ animationDelay: `${i * 80}ms` }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{card.title}</CardTitle>
              <div className={`${card.bg} p-2 rounded-lg`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-gray-900 dark:text-white">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
