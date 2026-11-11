import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, Truck, Shield, MoreVertical, Phone } from 'lucide-react';

interface User {
  id: string;
  email?: string;
  user_type: 'trucker' | 'shipper' | 'admin';
  full_name: string;
  phone?: string;
  rating: number;
  total_trips: number;
  is_verified?: boolean;
  suspended?: boolean;
  created_at: string;
  city?: string;
}

const UserManagement = () => {
  const { getAuthenticatedClient } = useSupabase();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'trucker' | 'shipper' | 'admin'>('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const supabase = await getAuthenticatedClient();
        const { data } = await supabase.rpc('admin_users_view');
        setUsers((data || []) as unknown as User[]);
      } catch (err) {
        console.error('[UserManagement]', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [getAuthenticatedClient]);

  const filtered = users.filter((u) => {
    if (filter !== 'all' && u.user_type !== filter) return false;
    if (search && !u.full_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const roleIcons = { trucker: Truck, shipper: Users, admin: Shield };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mb-8" />
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Users</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{new Set(users.map((u) => u.email)).size} total users</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
          </div>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {(['all', 'trucker', 'shipper', 'admin'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          {filtered.length === 0 && <div className="text-center py-16 text-gray-500 dark:text-gray-400">No users found</div>}
          {filtered.map((user) => {
            const Icon = roleIcons[user.user_type];
            return (
              <Card key={user.id} className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all rounded-2xl">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${user.user_type === 'trucker' ? 'bg-orange-50 dark:bg-orange-900/30' : user.user_type === 'shipper' ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-purple-50 dark:bg-purple-900/30'} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${user.user_type === 'trucker' ? 'text-orange-600 dark:text-orange-400' : user.user_type === 'shipper' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{user.full_name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${user.user_type === 'trucker' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400' : user.user_type === 'shipper' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400' : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400'}`}>{user.user_type}</span>
                      {user.is_verified && <Badge className="text-[10px] bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-0">Verified</Badge>}
                      {user.suspended && <Badge className="text-[10px] bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border-0">Suspended</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {user.city && <span>{user.city}</span>}
                      {user.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{user.phone}</span>}
                      <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" />{user.rating || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.total_trips}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">trips</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function Star({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
}

export default UserManagement;
