import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Check, X, Clock, User } from 'lucide-react';

interface ModerationItem {
  id: string;
  type: 'user' | 'trip' | 'shipment';
  target_name: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reporter?: string;
}

const Moderation = () => {
  const { getAuthenticatedClient } = useSupabase();
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = await getAuthenticatedClient();
        const [users, trips, shipments] = await Promise.all([
          supabase.from('users').select('id, full_name, is_verified, suspended').eq('suspended', false).limit(20),
          supabase.from('trips').select('id, origin_city, destination_city, status').limit(20),
          supabase.from('shipments').select('id, origin_city, dest_city, status').limit(20),
        ]);
        const mods: ModerationItem[] = [
          ...((users.data || []).map((u) => ({ id: u.id, type: 'user' as const, target_name: u.full_name, reason: 'New user verification', status: 'pending' as const, created_at: new Date().toISOString() }))),
          ...((trips.data || []).map((t) => ({ id: t.id, type: 'trip' as const, target_name: `${t.origin_city} → ${t.destination_city}`, reason: 'Trip review', status: 'pending' as const, created_at: new Date().toISOString() }))),
          ...((shipments.data || []).map((s) => ({ id: s.id, type: 'shipment' as const, target_name: `${s.origin_city} → ${s.dest_city}`, reason: 'Shipment review', status: 'pending' as const, created_at: new Date().toISOString() }))),
        ];
        setItems(mods);
      } catch (err) {
        console.error('[Moderation]', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getAuthenticatedClient]);

  const filtered = filter === 'pending' ? items.filter((i) => i.status === 'pending') : items;

  const typeColors = { user: 'bg-purple-100 text-purple-700', trip: 'bg-orange-100 text-orange-700', shipment: 'bg-blue-100 text-blue-700' };
  const typeIcons = { user: User, trip: Shield, shipment: Package };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-8" />
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Moderation</h1>
              <p className="text-sm text-gray-500">{items.filter((i) => i.status === 'pending').length} pending review</p>
            </div>
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {(['pending', 'all'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">All clear! No pending items.</p>
            </div>
          )}
          {filtered.map((item) => {
            const Icon = typeIcons[item.type];
            return (
              <Card key={item.id} className="border-gray-200 shadow-sm hover:shadow-md transition-all rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${item.type === 'user' ? 'bg-purple-50' : item.type === 'trip' ? 'bg-orange-50' : 'bg-blue-50'} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${item.type === 'user' ? 'text-purple-600' : item.type === 'trip' ? 'text-orange-600' : 'text-blue-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{item.target_name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeColors[item.type]}`}>{item.type}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{item.reason}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white rounded-xl"><Check className="h-3.5 w-3.5 mr-1" />Approve</Button>
                      <Button size="sm" variant="outline" className="h-8 border-red-200 text-red-600 hover:bg-red-50 rounded-xl"><X className="h-3.5 w-3.5 mr-1" />Reject</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function Package({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>;
}

export default Moderation;
