import { PlusCircle, CheckCircle2, UserPlus, MessageSquare, AlertCircle, Package, Truck } from 'lucide-react';
import type { FeedEvent, FeedEventType } from './useAdminEventFeed';

const EVENT_ICON: Record<FeedEventType, React.ReactNode> = {
  trip: <Truck className="h-3 w-3 text-orange-500" />,
  load: <Package className="h-3 w-3 text-blue-500" />,
  request: <PlusCircle className="h-3 w-3 text-purple-500" />,
  lead: <CheckCircle2 className="h-3 w-3 text-emerald-500" />,
  user: <UserPlus className="h-3 w-3 text-cyan-500" />,
};

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
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
        <MessageSquare className="h-4 w-4 text-gray-300" />
        <p className="text-[11px] text-gray-400">Listening for new activity…</p>
        <p className="text-[10px] text-gray-300">New trips, loads, requests and signups appear here instantly.</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto pr-1" style={{ maxHeight }}>
      <ul className="space-y-1">
        {events.map((e) => (
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
    </div>
  );
}
