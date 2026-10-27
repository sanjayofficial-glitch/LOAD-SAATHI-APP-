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
  /** Week-over-week change in %, e.g. 12 → "+12%". */
  delta?: number | null;
}

interface KPIColor {
  bg: string;
  text: string;
}

const FALLBACK_COLOR: KPIColor = { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' };

/** Week-over-week delta chip: green up, red down, nothing when unknown. */
function DeltaBadge({ value }: { value: number | null | undefined }) {
  if (value == null) return null;
  const up = value >= 0;
  return (
    <span
      className={cn(
        'text-[10px] font-bold tabular-nums whitespace-nowrap',
        up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
      )}
      title="Change vs the previous 7 days"
    >
      {up ? '+' : ''}
      {value}%
    </span>
  );
}

const colorMap: Record<string, KPIColor> = {
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  green: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  red: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
  slate: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
};

const TONE_MAP: Record<KPITone, { card: string; value: string }> = {
  default: { card: 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900', value: 'text-gray-900 dark:text-gray-100' },
  info: { card: 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900', value: 'text-gray-900 dark:text-gray-100' },
  good: { card: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-900/20', value: 'text-emerald-700 dark:text-emerald-400' },
  warn: { card: 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20', value: 'text-amber-700 dark:text-amber-400' },
  bad: { card: 'border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-900/20', value: 'text-red-700 dark:text-red-400' },
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
  delta,
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
          <span className={cn('font-bold tabular-nums text-[13px] truncate flex items-center gap-1', t.value)}>
            {loading ? (
              <span className="inline-block w-7 h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse align-middle" />
            ) : (
              <>
                {value}
                <DeltaBadge value={delta} />
              </>
            )}
          </span>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-0.5 truncate">
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
      <p className={cn('font-bold tabular-nums truncate flex items-baseline gap-1.5', t.value, compact ? 'text-lg' : 'text-2xl')}>
        {loading ? <span className="inline-block w-8 h-5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse align-middle" /> : (
          <>
            <span className="truncate">{value}</span>
            <DeltaBadge value={delta} />
          </>
        )}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-0.5 truncate">{label}</p>
      {hint && <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{hint}</p>}
    </button>
  );
}
