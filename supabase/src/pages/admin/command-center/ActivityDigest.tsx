import { Sun, Moon, Sunrise, Sunset } from 'lucide-react';

interface ActivityDigestProps {
  stats: {
    tripsCompleted: number;
    loadsMatched: number;
    revenue: number;
    /** Only rendered when > 0; omit to hide the row entirely. */
    delayedTrips?: number;
    cancelledTrips?: number;
    peakHour: string;
  };
}

function getDayPhase(): { icon: React.ReactNode; label: string; greeting: string } {
  const hour = new Date().getHours();
  if (hour < 6) return { icon: <Moon className="h-4 w-4 text-indigo-500" />, label: 'Night', greeting: 'Good Night' };
  if (hour < 12) return { icon: <Sunrise className="h-4 w-4 text-amber-500" />, label: 'Morning', greeting: 'Good Morning' };
  if (hour < 17) return { icon: <Sun className="h-4 w-4 text-orange-500" />, label: 'Afternoon', greeting: 'Good Afternoon' };
  return { icon: <Sunset className="h-4 w-4 text-orange-500" />, label: 'Evening', greeting: 'Good Evening' };
}

export default function ActivityDigest({ stats }: ActivityDigestProps) {
  const phase = getDayPhase();
  const delayed = stats.delayedTrips ?? 0;
  const cancelled = stats.cancelledTrips ?? 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-orange-50 to-amber-50/50 p-3 space-y-3">
      <div className="flex items-center gap-2">
        {phase.icon}
        <div>
          <p className="text-xs font-semibold text-gray-800">{phase.greeting}</p>
          <p className="text-[10px] text-gray-500">{phase.label} summary</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg bg-white/80 border border-gray-100 p-2">
          <p className="text-lg font-bold text-emerald-600 tabular-nums">{stats.tripsCompleted}</p>
          <p className="text-[9px] uppercase tracking-wider text-gray-400">Trips Done</p>
        </div>
        <div className="rounded-lg bg-white/80 border border-gray-100 p-2">
          <p className="text-lg font-bold text-blue-600 tabular-nums">{stats.loadsMatched}</p>
          <p className="text-[9px] uppercase tracking-wider text-gray-400">Loads Matched</p>
        </div>
        <div className="rounded-lg bg-white/80 border border-gray-100 p-2">
          <p className="text-lg font-bold text-gray-900 tabular-nums">₹{(stats.revenue / 1000).toFixed(1)}K</p>
          <p className="text-[9px] uppercase tracking-wider text-gray-400">Revenue</p>
        </div>
        <div className="rounded-lg bg-white/80 border border-gray-100 p-2">
          <p className="text-lg font-bold text-gray-900 tabular-nums">{stats.peakHour}</p>
          <p className="text-[9px] uppercase tracking-wider text-gray-400">Busiest Hour</p>
        </div>
      </div>

      {(delayed > 0 || cancelled > 0) && (
        <div className="flex gap-2 text-[10px]">
          {delayed > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
              {delayed} delayed
            </span>
          )}
          {cancelled > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
              {cancelled} cancelled
            </span>
          )}
        </div>
      )}
    </div>
  );
}
