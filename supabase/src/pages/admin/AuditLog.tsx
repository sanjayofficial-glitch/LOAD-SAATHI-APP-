import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Search, Clock, User, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface AuditEntry {
  id: string;
  admin_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  created_at: string;
  admin?: { full_name?: string };
}

const AuditLog = () => {
  const { getAuthenticatedClient } = useSupabase();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const supabase = await getAuthenticatedClient();
        const { data } = await supabase.from('audit_log').select('*, admin:users!audit_log_admin_id_fkey(full_name)').order('created_at', { ascending: false }).limit(50);
        setEntries((data || []) as unknown as AuditEntry[]);
      } catch (err) { console.error('[AuditLog]', err); } finally { setLoading(false); }
    };
    fetchLogs();
  }, [getAuthenticatedClient]);

  const filtered = entries.filter((e) => !search || e.action?.toLowerCase().includes(search.toLowerCase()) || e.admin?.full_name?.toLowerCase().includes(search.toLowerCase()));

  const actionColors: Record<string, string> = { create: 'bg-green-100 text-green-700', update: 'bg-blue-100 text-blue-700', delete: 'bg-red-100 text-red-700', approve: 'bg-emerald-100 text-emerald-700', reject: 'bg-amber-100 text-amber-700' };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-8" />
          <div className="grid gap-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
              <p className="text-sm text-gray-500">{entries.length} entries</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64 border-gray-200 bg-white" />
          </div>
        </div>

        <div className="grid gap-2">
          {filtered.length === 0 && <div className="text-center py-16 text-gray-500">No log entries found</div>}
          {filtered.map((entry) => {
            const color = actionColors[entry.action?.split('_')[0] ?? ''] || 'bg-gray-100 text-gray-700';
            return (
              <Card key={entry.id} className="border-gray-200 shadow-sm rounded-2xl">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <Activity className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{entry.action}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${color}`}>{entry.action}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                      {entry.admin && <span className="flex items-center gap-1"><User className="h-3 w-3" />{entry.admin.full_name}</span>}
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(entry.created_at).toLocaleString()}</span>
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

export default AuditLog;
