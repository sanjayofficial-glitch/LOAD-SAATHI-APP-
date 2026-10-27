import { TrendingUp, IndianRupee, Clock } from 'lucide-react';
import Sparkline from './Sparkline';
import type { PendingAgeing } from './types';

interface RevenueTrackerProps {
  todayRevenue: number;
  pendingRevenue: number;
  yesterdayRevenue: number;
  weeklyTrend: number[];
  /** How long unmatched value has been sitting — 0-7 / 8-30 / 30d+ buckets. */
  ageing?: PendingAgeing | null;
  loading?: boolean;
}

const AGEING_BUCKETS = [
  { key: 'fresh', label: '0–7d', field: 'fresh' as const, bar: 'bg-amber-400' },
  { key: 'mid', label: '8–30d', field: 'mid' as const, bar: 'bg-orange-500' },
  { key: 'aged', label: '30d+', field: 'aged' as const, bar: 'bg-red-500' },
];

export default function RevenueTracker({
  todayRevenue,
  pendingRevenue,
  yesterdayRevenue,
  weeklyTrend,
  ageing,
  loading,
}: RevenueTrackerProps) {
  const diff = todayRevenue - yesterdayRevenue;
  const diffPct = yesterdayRevenue > 0 ? Math.round((diff / yesterdayRevenue) * 100) : 0;
  const isUp = diff >= 0;
  const ageingTotal = ageing ? ageing.fresh + ageing.mid + ageing.aged : 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Revenue</h3>
        </div>
        {weeklyTrend.length >= 2 && <Sparkline data={weeklyTrend} width={64} height={20} />}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-lg font-bold tabular-nums text-gray-900">
            {loading ? (
              <span className="inline-block w-14 h-5 rounded bg-gray-100 animate-pulse" />
            ) : (
              `₹${(todayRevenue / 1000).toFixed(1)}K`
            )}
          </p>
          <p className="text-[9px] uppercase tracking-wider text-gray-400">Today</p>
        </div>
        <div>
          <p className="text-lg font-bold tabular-nums text-amber-600">
            {loading ? (
              <span className="inline-block w-14 h-5 rounded bg-gray-100 animate-pulse" />
            ) : (
              `₹${(pendingRevenue / 1000).toFixed(1)}K`
            )}
          </p>
          <p className="text-[9px] uppercase tracking-wider text-gray-400">Pending</p>
        </div>
        <div>
          <p
            className={`text-sm font-bold tabular-nums flex items-center gap-0.5 ${
              isUp ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            <TrendingUp className={`h-3 w-3 ${isUp ? '' : 'rotate-180'}`} />
            {loading ? '—' : `${Math.abs(diffPct)}%`}
          </p>
          <p className="text-[9px] uppercase tracking-wider text-gray-400">vs Yesterday</p>
        </div>
      </div>

      {ageing && ageingTotal > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-gray-400" />
            <p className="text-[9px] uppercase tracking-wider text-gray-400">Pending ageing</p>
          </div>
          {/* Width encodes share; the labels below carry the actual numbers. */}
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            {AGEING_BUCKETS.map((b) => (
              <span
                key={b.key}
                className={b.bar}
                title={`${b.label}: ₹${Math.round(ageing[b.field]).toLocaleString('en-IN')}`}
                style={{ width: `${(ageing[b.field] / ageingTotal) * 100}%` }}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {AGEING_BUCKETS.map((b) => (
              <div key={b.key}>
                <p
                  className={`text-xs font-semibold tabular-nums ${
                    b.key === 'aged' ? 'text-red-600' : 'text-gray-700'
                  }`}
                >
                  ₹{(ageing[b.field] / 1000).toFixed(1)}K
                </p>
                <p className="text-[9px] text-gray-400">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
