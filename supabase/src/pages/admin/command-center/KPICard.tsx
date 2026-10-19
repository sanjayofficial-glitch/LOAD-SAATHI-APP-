import Sparkline from './Sparkline';
import { cn } from '@/lib/utils';

export type KPITone = 'default' | 'good' | 'warn' | 'bad' | 'info';

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  trend?: number[];
  /** Decorative icon accent (kept for backwards compatibility). */
  color?: string;
  /** Semantic state — drives the card's border/background so the board can be scanned. */
  tone?: KPITone;
  onClick?: () => void;
  loading?: boolean;
  compact?: boolean;
  /** Single-row strip tile: icon + value inline, no sparkline. */
  dense?: boolean;
  trendLabel?: string;
  /** Small helper line, e.g. "7 loads waiting 30m+". */
  hint?: string;
}

interface KPIColor {
  bg: string;
  text: string;
}

const FALLBACK_COLOR: KPIColor = { bg: 'bg-orange-50', text: 'text-orange-600' };

const colorMap: Record<string, KPIColor> = {
  orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
  green: { bg: 'bg-green-50', text: 'text-green-600' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  red: { bg: 'bg-red-50', text: 'text-red-600' },
  slate: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

const TONE_MAP: Record<KPITone, { card: string; value: string }> = {
  default: { card: 'border-gray-200 bg-white', value: 'text-gray-900' },
  info: { card: 'border-gray-200 bg-white', value: 'text-gray-900' },
  good: { card: 'border-emerald-200 bg-emerald-50/40', value: 'text-emerald-700' },
  warn: { card: 'border-amber-300 bg-amber-50/50', value: 'text-amber-700' },
  bad: { card: 'border-red-300 bg-red-50/60', value: 'text-red-700' },
};

export default function KPICard({
  icon,
  label,
  value,
  trend,
  color = 'orange',
  tone = 'default',
  onClick,
  loading,
  compact,
  dense,
  trendLabel,
  hint,
}: KPICardProps) {
  const c = colorMap[color] ?? FALLBACK_COLOR;
  const t = TONE_MAP[tone] ?? TONE_MAP.default;

  if (dense) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick || loading}
        title={trendLabel ?? (hint ? `${label} — ${hint}` : label)}
        className={cn(
          'group text-left rounded-lg border transition-all shrink-0 min-w-0 px-2 py-1.5',
          t.card,
          onClick && 'hover:shadow-sm cursor-pointer',
          !onClick && 'cursor-default',
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn('p-1 rounded-md shrink-0', c.bg, c.text)}>{icon}</span>
          <span className={cn('font-bold tabular-nums text-[13px] truncate', t.value)}>
            {loading ? (
              <span className="inline-block w-7 h-4 rounded bg-gray-200 animate-pulse align-middle" />
            ) : (
              value
            )}
          </span>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-0.5 truncate">
          {label}
        </p>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick || loading}
      title={trendLabel}
      className={cn(
        'group text-left rounded-xl border transition-all shrink-0 min-w-0',
        t.card,
        compact ? 'px-3 py-2.5' : 'p-4',
        onClick && 'hover:shadow-md cursor-pointer',
        !onClick && 'cursor-default',
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className={cn('p-1.5 rounded-lg shrink-0', c.bg, c.text)}>{icon}</div>
        {trend && trend.length >= 2 && <Sparkline data={trend} width={44} height={16} />}
      </div>
      <p className={cn('font-bold tabular-nums truncate', t.value, compact ? 'text-lg' : 'text-2xl')}>
        {loading ? <span className="inline-block w-8 h-5 rounded bg-gray-200 animate-pulse align-middle" /> : value}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-0.5 truncate">{label}</p>
      {hint && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{hint}</p>}
    </button>
  );
}
