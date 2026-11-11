import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '@/hooks/useSupabase';
import {
  Users,
  Truck,
  Package,
  Activity,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

type Stat = { count: number; delta: number | null };

/** Count rows and compute a week-over-week delta (last 7 days vs the 7 before). */
function countWithDelta(rows: Array<{ created_at?: string | null }>): Stat {
  const now = Date.now();
  const weekAgo = now - 7 * 86_400_000;
  const twoWeeksAgo = now - 14 * 86_400_000;
  let current = 0;
  let previous = 0;
  for (const row of rows) {
    const t = row.created_at ? new Date(row.created_at).getTime() : NaN;
    if (!Number.isFinite(t)) continue;
    if (t >= weekAgo) current += 1;
    else if (t >= twoWeeksAgo) previous += 1;
  }
  const delta = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
  return { count: rows.length, delta };
}

const AdminDashboard = () => {
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Record<string, Stat> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        const supabaseClient = await getAuthenticatedClient();
        const [users, trips, requests, shipments] = await Promise.all([
          supabaseClient.from('users').select('created_at'),
          supabaseClient.from('trips').select('created_at'),
          supabaseClient.from('requests').select('created_at'),
          supabaseClient.from('shipments').select('created_at'),
        ]);
        const failed = [users, trips, requests, shipments].find((res) => res.error);
        if (failed?.error) throw failed.error;
        setStats({
          users: countWithDelta((users.data ?? []) as Array<{ created_at?: string | null }>),
          trips: countWithDelta((trips.data ?? []) as Array<{ created_at?: string | null }>),
          requests: countWithDelta((requests.data ?? []) as Array<{ created_at?: string | null }>),
          shipments: countWithDelta((shipments.data ?? []) as Array<{ created_at?: string | null }>),
        });
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
    { key: 'users', title: 'Total Users', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', path: '/admin/users', cta: 'Open user list' },
    { key: 'trips', title: 'Total Trips', icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50', path: '/admin/trips', cta: 'See who posted trips' },
    { key: 'shipments', title: 'Shipments', icon: Package, color: 'text-purple-600', bg: 'bg-purple-50', path: '/admin/shipments', cta: 'See who posted loads' },
    { key: 'requests', title: 'Requests', icon: Activity, color: 'text-green-600', bg: 'bg-green-50', path: '/admin/monitoring', cta: 'Watch them live' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => {
            const stat = stats?.[card.key];
            const delta = stat?.delta == null ? null : stat.delta;
            const up = delta != null && delta >= 0;
            return (
              <button
                key={card.title}
                type="button"
                onClick={() => navigate(card.path)}
                aria-label={`${card.title}: ${card.cta}`}
                className="group bg-white rounded-2xl border border-gray-200 p-5 text-left shadow-sm hover:shadow-md hover:border-orange-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:border-orange-400 cursor-pointer transition-all"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`${card.bg} p-2.5 rounded-xl`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <span className={`flex items-center gap-0.5 text-xs font-semibold ${delta == null ? 'text-gray-400' : up ? 'text-green-600' : 'text-red-500'}`}>
                    {delta != null && (up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />)}
                    {delta == null ? '—' : `${delta > 0 ? '+' : ''}${delta}%`}
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stat?.count.toLocaleString() ?? '—'}</p>
                <p className="text-xs font-medium text-gray-500 mt-1">{card.title}</p>
                <p className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-orange-600 opacity-70 transition-opacity group-hover:opacity-100">
                  {card.cta}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
