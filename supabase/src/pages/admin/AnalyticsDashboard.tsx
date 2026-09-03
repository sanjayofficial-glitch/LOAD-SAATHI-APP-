import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/useSupabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, Truck, Package, TrendingUp } from 'lucide-react';

interface DailyCount {
  date: string;
  users: number;
  trips: number;
  shipments: number;
}

interface CorridorCount {
  corridor: string;
  count: number;
}

const LAST_14_DAYS = 14;

function formatDate(date: Date): string {
  return date.toISOString().slice(5, 10);
}

function getDateRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

const AnalyticsDashboard = () => {
  const { getAuthenticatedClient } = useSupabase();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const supabase = await getAuthenticatedClient();
      const { start, end } = getDateRange(LAST_14_DAYS);

      const [usersRes, tripsRes, shipmentsRes] = await Promise.all([
        supabase
          .from('users')
          .select('created_at')
          .gte('created_at', start)
          .lte('created_at', end),
        supabase
          .from('trips')
          .select('created_at, origin_city, destination_city')
          .gte('created_at', start)
          .lte('created_at', end),
        supabase
          .from('shipments')
          .select('created_at, origin_city, destination_city')
          .gte('created_at', start)
          .lte('created_at', end),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (tripsRes.error) throw tripsRes.error;
      if (shipmentsRes.error) throw shipmentsRes.error;

      return {
        users: usersRes.data || [],
        trips: tripsRes.data || [],
        shipments: shipmentsRes.data || [],
      };
    },
    staleTime: 60_000,
  });

  const dailyData = useMemo<DailyCount[]>(() => {
    if (!data) return [];
    const map = new Map<string, DailyCount>();
    const today = new Date();
    for (let i = LAST_14_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = formatDate(d);
      map.set(key, { date: key, users: 0, trips: 0, shipments: 0 });
    }

    data.users.forEach(u => {
      const key = formatDate(new Date(u.created_at));
      const entry = map.get(key);
      if (entry) entry.users++;
    });
    data.trips.forEach(t => {
      const key = formatDate(new Date(t.created_at));
      const entry = map.get(key);
      if (entry) entry.trips++;
    });
    data.shipments.forEach(s => {
      const key = formatDate(new Date(s.created_at));
      const entry = map.get(key);
      if (entry) entry.shipments++;
    });

    return Array.from(map.values());
  }, [data]);

  const corridorData = useMemo<CorridorCount[]>(() => {
    if (!data) return [];
    const counts = new Map<string, number>();
    const addCorridor = (origin?: string, destination?: string) => {
      if (!origin || !destination) return;
      const key = `${origin} → ${destination}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    };
    data.trips.forEach(t => addCorridor(t.origin_city, t.destination_city));
    data.shipments.forEach(s => addCorridor(s.origin_city, s.destination_city));

    return Array.from(counts.entries())
      .map(([corridor, count]) => ({ corridor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [data]);

  const totalUsers = data?.users.length || 0;
  const totalTrips = data?.trips.length || 0;
  const totalShipments = data?.shipments.length || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-700/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Signups (14d)</p>
              <p className="text-xl font-mono font-bold text-white">{isLoading ? '—' : totalUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Truck className="h-4 w-4 text-orange-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Trips (14d)</p>
              <p className="text-xl font-mono font-bold text-white">{isLoading ? '—' : totalTrips}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Package className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Loads (14d)</p>
              <p className="text-xl font-mono font-bold text-white">{isLoading ? '—' : totalShipments}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-700/60">
        <CardHeader>
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            Daily Signups (14 days)
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">New user registrations per day</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Signups" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700/60">
        <CardHeader>
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-400" />
            Daily Volume (14 days)
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">Trips and shipments created per day</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="trips" fill="#f97316" radius={[2, 2, 0, 0]} name="Trips" />
                <Bar dataKey="shipments" fill="#a855f7" radius={[2, 2, 0, 0]} name="Shipments" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700/60">
        <CardHeader>
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-400" />
            Top 10 Corridors
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">Most active routes across trips and shipments</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={corridorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                <YAxis type="category" dataKey="corridor" stroke="#94a3b8" fontSize={9} width={140} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 2, 2, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
