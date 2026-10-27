import { useState } from 'react';
import { PlusCircle, CheckCircle2, UserPlus, MessageSquare, AlertCircle, Package, Truck, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import type { FeedEvent, FeedEventType } from './useAdminEventFeed';

const EVENT_ICON: Record<FeedEventType, React.ReactNode> = {
  trip: <Truck className="h-3 w-3 text-orange-500" />,
  load: <Package className="h-3 w-3 text-blue-500" />,
  request: <PlusCircle className="h-3 w-3 text-purple-500" />,
  lead: <CheckCircle2 className="h-3 w-3 text-emerald-500" />,
  user: <UserPlus className="h-3 w-3 text-cyan-500" />,
};

const TYPE_FILTERS: Array<{ key: FeedEventType | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'trip', label: 'Trips' },
  { key: 'load', label: 'Loads' },
  { key: 'request', label: 'Requests' },
  { key: 'lead', label: 'Leads' },
  { key: 'user', label: 'Users' },
];

function timeAgo(at: number, now: number): string {
  const secs = Math.max(0, Math.round((now - at) / 1000));
  if (secs < 5) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

interface LiveFeedPanelProps {
  events: FeedEvent[];
  now: number;
  maxHeight?: number;
}

export default function LiveFeedPanel({ events, now, maxHeight = 260 }: LiveFeedPanelProps) {
  const [typeFilter, setTypeFilter] = useState<FeedEventType | 'all'>('all');
  const [query, setQuery] = useState('');

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
        <MessageSquare className="h-4 w-4 text-gray-300" />
        <p className="text-[11px] text-gray-400">Listening for new activity…</p>
        <p className="text-[10px] text-gray-300">New trips, loads, requests and signups appear here instantly.</p>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = events.filter((e) => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    return q.length === 0 || e.message.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-1.5">
      <div className="space-y-1.5">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter activity…"
            className="h-7 pl-7 text-xs border-gray-200"
            aria-label="Filter activity by text"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={typeFilter === f.key}
              onClick={() => setTypeFilter(f.key)}
              className={cn(
                'px-2 py-0.5 rounded-full border text-[10px] font-medium transition-colors cursor-pointer',
                typeFilter === f.key
                  ? 'border-orange-200 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto pr-1" style={{ maxHeight }}>
        {filtered.length === 0 ? (
          <p className="text-[11px] text-gray-400 text-center py-6">
            No activity matches this filter.
          </p>
        ) : (
          <ul className="space-y-1">
            {filtered.map((e) => (
              <li key={e.id} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-gray-50">
                <div className="mt-0.5 p-1 rounded-full bg-gray-100 border border-gray-200 shrink-0">
                  {EVENT_ICON[e.type] ?? <AlertCircle className="h-3 w-3 text-gray-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-800 leading-tight truncate">{e.message}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 tabular-nums">{timeAgo(e.at, now)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
