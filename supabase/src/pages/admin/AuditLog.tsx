import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, RefreshCw, Filter } from 'lucide-react';
import { toast } from 'sonner';
import type { AuditLogEntry } from '@/types';
import AdminShell from '@/components/admin/AdminShell';

const ACTION_LABELS: Record<string, string> = {
  'user.verify': 'User Verified',
  'user.unverify': 'User Unverified',
  'user.suspend': 'User Suspended',
  'user.unsuspend': 'User Unsuspended',
  'user.role_change': 'Role Changed',
  'trip.cancel': 'Trip Cancelled',
  'trip.reactivate': 'Trip Reactivated',
  'shipment.cancel': 'Shipment Cancelled',
  'shipment.reactivate': 'Shipment Reactivated',
  'bulk.verify': 'Bulk Verify',
  'bulk.cancel_trips': 'Bulk Cancel Trips',
  'bulk.cancel_shipments': 'Bulk Cancel Shipments',
  'export.csv': 'CSV Export',
};

const ACTION_COLORS: Record<string, string> = {
  'user.verify': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  'user.unverify': 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  'user.suspend': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  'user.unsuspend': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  'user.role_change': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  'trip.cancel': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  'trip.reactivate': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  'shipment.cancel': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  'shipment.reactivate': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  'bulk.verify': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  'bulk.cancel_trips': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  'bulk.cancel_shipments': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  'export.csv': 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

const AuditLog = () => {
  const { getAuthenticatedClient } = useSupabase();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [adminFilter, setAdminFilter] = useState('');
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const channelRef = useRef<ReturnType<SupabaseClient['channel']> | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = await getAuthenticatedClient();
      supabaseRef.current = supabase;

      let query = supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }
      if (adminFilter.trim()) {
        query = query.ilike('admin_id', `%${adminFilter.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Error fetching audit log:', err);
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message || 'Unknown error';
      toast.error(`Failed to load audit log: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [getAuthenticatedClient, actionFilter, adminFilter]);

  useEffect(() => {
    fetchEntries().then(() => {
      const client = supabaseRef.current;
      if (!client || channelRef.current) return;

      channelRef.current = client
        .channel('admin-audit-log')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_audit_log',
        }, (payload) => {
          setEntries(prev => [payload.new as AuditLogEntry, ...prev]);
        })
        .subscribe();
    });

    return () => {
      if (channelRef.current) {
        const client = supabaseRef.current;
        if (client) {
          void (async () => {
            try {
              const channel = channelRef.current;
              if (channel) {
                await client.removeChannel(channel);
              }
            } catch (err) {
              if (import.meta.env.DEV) console.warn('[channel cleanup]', err);
            }
          })();
        }
        channelRef.current = null;
      }
    };
  }, [fetchEntries]);

  const filteredEntries = useMemo(() => {
    if (actionFilter === 'all' && !adminFilter.trim()) return entries;
    return entries.filter(e => {
      const matchesAction = actionFilter === 'all' || e.action === actionFilter;
      const matchesAdmin = !adminFilter.trim() || e.admin_id.includes(adminFilter.trim());
      return matchesAction && matchesAdmin;
    });
  }, [entries, actionFilter, adminFilter]);

  return (
    <AdminShell title="Audit Log" description="Track all admin actions across the platform">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="h-4 w-4 text-slate-400" />
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-slate-800 border-slate-700 text-slate-200">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {Object.entries(ACTION_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Filter by admin ID..."
            value={adminFilter}
            onChange={e => setAdminFilter(e.target.value)}
            className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
          />
          <Button variant="outline" size="sm" onClick={fetchEntries} disabled={loading} className="border-slate-700 text-slate-300 hover:text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>

        <Card className="bg-slate-900 border-slate-700/60">
          <CardContent className="p-0">
            {loading && entries.length === 0 ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">No audit entries found</div>
            ) : (
              <div className="divide-y divide-slate-700/60">
                {filteredEntries.map(entry => (
                  <div key={entry.id} className="p-3 sm:p-4 flex items-start gap-3 hover:bg-slate-800/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${ACTION_COLORS[entry.action] || 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>
                          {ACTION_LABELS[entry.action] || entry.action}
                        </Badge>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Admin: <span className="font-mono text-slate-300">{entry.admin_id}</span>
                        {entry.target_type && (
                          <> &middot; Target: <span className="font-mono text-slate-300">{entry.target_type}:{entry.target_id?.slice(0, 8)}</span></>
                        )}
                        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                          <span className="text-slate-500"> &middot; {JSON.stringify(entry.metadata)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
};

export default AuditLog;
