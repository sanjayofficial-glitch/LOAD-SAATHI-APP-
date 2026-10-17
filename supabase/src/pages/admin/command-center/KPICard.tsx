import Sparkline from './Sparkline';
import { cn } from '@/lib/utils';

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  trend?: number[];
  color: string;
  onClick?: () => void;
  loading?: boolean;
  compact?: boolean;
  trendLabel?: string;
}

interface KPIColor {
  bg: string;
  text: string;
  border: string;
}

const FALLBACK_COLOR: KPIColor = {
  bg: 'bg-orange-50',
  text: 'text-orange-600',
  border: 'border-orange-100',
};

const colorMap: Record<string, KPIColor> = {
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
  green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
};

export default function KPICard({ icon, label, value, trend, color, onClick, loading, compact, trendLabel }: KPICardProps) {
  const c = colorMap[color] ?? FALLBACK_COLOR;
  return (
    <button onClick={onClick} disabled={!onClick || loading} title={trendLabel} className={cn('text-left rounded-2xl border bg-white transition-all shrink-0', c.border, onClick && 'hover:shadow-md cursor-pointer', !onClick && 'cursor-default', compact ? 'px-3.5 py-2.5' : 'p-4')}>
      <div className="flex items-center justify-between mb-1.5">
        <div className={cn('p-1.5 rounded-lg', c.bg, c.text)}>{icon}</div>
        {trend && trend.length >= 2 && <Sparkline data={trend} width={44} height={16} />}
      </div>
      <p className={cn('font-bold text-gray-900 tabular-nums', compact ? 'text-lg' : 'text-2xl')}>
        {loading ? <span className="inline-block w-8 h-5 rounded bg-gray-100 animate-pulse" /> : value}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-0.5">{label}</p>
    </button>
  );
}
