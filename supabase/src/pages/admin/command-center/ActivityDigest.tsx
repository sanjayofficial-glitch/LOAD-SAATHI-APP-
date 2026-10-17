import { Sun, Moon, Sunrise, Sunset } from 'lucide-react';

interface ActivityDigestProps {
  stats: {
    tripsCompleted: number;
    loadsMatched: number;
    revenue: number;
    delayedTrips: number;
    cancelledTrips: number;
    peakHour: string;
  };
}

function getDayPhase(): { icon: React.ReactNode; label: string; greeting: string } {
  const hour = new Date().getHours();
  if (hour < 6) return { icon: <Moon className="h-4 w-4" />, label: 'Night', greeting: 'Good Night' };
  if (hour < 12) return { icon: <Sunrise className="h-4 w-4" />, label: 'Morning', greeting: 'Good Morning' };
  if (hour < 17) return { icon: <Sun className="h-4 w-4" />, label: 'Afternoon', greeting: 'Good Afternoon' };
  return { icon: <Sunset className="h-4 w-4" />, label: 'Evening', greeting: 'Good Evening' };
}

export default function ActivityDigest({ stats }: ActivityDigestProps) {
  const phase = getDayPhase();

  return (
    <div className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-orange-500/5 to-amber-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        {phase.icon}
        <div>
          <p className="text-xs font-semibold">{phase.greeting}</p>
          <p className="text-[10px] text-slate-500">{phase.label} summary</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg bg-slate-900/50 p-2">
          <p className="text-lg font-bold text-green-400">{stats.tripsCompleted}</p>
          <p className="text-[9px] uppercase tracking-wider text-slate-500">Trips Done</p>
        </div>
        <div className="rounded-lg bg-slate-900/50 p-2">
          <p className="text-lg font-bold text-blue-400">{stats.loadsMatched}</p>
          <p className="text-[9px] uppercase tracking-wider text-slate-500">Loads Matched</p>
        </div>
        <div className="rounded-lg bg-slate-900/50 p-2">
          <p className="text-lg font-bold text-emerald-400">₹{(stats.revenue / 1000).toFixed(1)}K</p>
          <p className="text-[9px] uppercase tracking-wider text-slate-500">Revenue</p>
        </div>
        <div className="rounded-lg bg-slate-900/50 p-2">
          <p className="text-lg font-bold text-amber-400">{stats.peakHour}</p>
          <p className="text-[9px] uppercase tracking-wider text-slate-500">Peak Hour</p>
        </div>
      </div>

      {(stats.delayedTrips > 0 || stats.cancelledTrips > 0) && (
        <div className="flex gap-2 text-[10px]">
          {stats.delayedTrips > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">
              {stats.delayedTrips} delayed
            </span>
          )}
          {stats.cancelledTrips > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-medium">
              {stats.cancelledTrips} cancelled
            </span>
          )}
        </div>
      )}
    </div>
  );
}
