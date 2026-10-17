import { TrendingUp, IndianRupee } from 'lucide-react';
import Sparkline from './Sparkline';

interface RevenueTrackerProps {
  todayRevenue: number;
  pendingRevenue: number;
  yesterdayRevenue: number;
  weeklyTrend: number[];
  loading?: boolean;
}

export default function RevenueTracker({
  todayRevenue,
  pendingRevenue,
  yesterdayRevenue,
  weeklyTrend,
  loading,
}: RevenueTrackerProps) {
  const diff = todayRevenue - yesterdayRevenue;
  const diffPct = yesterdayRevenue > 0 ? Math.round((diff / yesterdayRevenue) * 100) : 0;
  const isUp = diff >= 0;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IndianRupee className="h-3.5 w-3.5 text-emerald-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Revenue</h3>
        </div>
        {weeklyTrend.length >= 2 && <Sparkline data={weeklyTrend} width={64} height={20} />}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-lg font-bold tabular-nums text-slate-100">
            {loading ? (
              <span className="inline-block w-14 h-5 rounded bg-slate-700 animate-pulse" />
            ) : (
              `₹${(todayRevenue / 1000).toFixed(1)}K`
            )}
          </p>
          <p className="text-[9px] uppercase tracking-wider text-slate-500">Today</p>
        </div>
        <div>
          <p className="text-lg font-bold tabular-nums text-amber-400">
            {loading ? (
              <span className="inline-block w-14 h-5 rounded bg-slate-700 animate-pulse" />
            ) : (
              `₹${(pendingRevenue / 1000).toFixed(1)}K`
            )}
          </p>
          <p className="text-[9px] uppercase tracking-wider text-slate-500">Pending</p>
        </div>
        <div>
          <p
            className={`text-sm font-bold tabular-nums flex items-center gap-0.5 ${
              isUp ? 'text-green-400' : 'text-red-400'
            }`}
          >
            <TrendingUp className={`h-3 w-3 ${isUp ? '' : 'rotate-180'}`} />
            {loading ? '—' : `${Math.abs(diffPct)}%`}
          </p>
          <p className="text-[9px] uppercase tracking-wider text-slate-500">vs Yesterday</p>
        </div>
      </div>
    </div>
  );
}
