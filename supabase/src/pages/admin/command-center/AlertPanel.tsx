import { AlertTriangle, AlertOctagon, Info, CheckCircle2, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminAlert, AlertSeverity } from './alerts';

const SEVERITY_STYLE: Record<
  AlertSeverity,
  { wrap: string; icon: React.ReactNode; badge: string; label: string }
> = {
  critical: {
    wrap: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50',
    icon: <AlertOctagon className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />,
    badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400',
    label: 'Critical',
  },
  warning: {
    wrap: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50',
    icon: <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />,
    badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400',
    label: 'Warning',
  },
  info: {
    wrap: 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900',
    icon: <Info className="h-4 w-4 text-gray-500 dark:text-gray-400 shrink-0" />,
    badge: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    label: 'Info',
  },
};

interface AlertPanelProps {
  alerts: AdminAlert[];
  /** Compact = single-line strip used under the KPI row. */
  variant?: 'strip' | 'list';
  /** Alert ids the operator already acknowledged (today). */
  acknowledged?: ReadonlySet<string>;
  /** Persist an acknowledgement for the rest of the day. */
  onAcknowledge?: (alertId: string) => void;
  /** Drill into the data behind an alert (opens the mapped section). */
  onDrillDown?: (alert: AdminAlert) => void;
}

export default function AlertPanel({
  alerts,
  variant = 'strip',
  acknowledged,
  onAcknowledge,
  onDrillDown,
}: AlertPanelProps) {
  const isAcked = (id: string) => acknowledged?.has(id) ?? false;
  const actionable = alerts.filter(
    (a) => (a.severity !== 'info' || a.id !== 'all-clear') && !isAcked(a.id),
  );

  if (variant === 'strip') {
    if (actionable.length === 0) {
      return (
        <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">All systems normal</span>
          <span className="text-gray-400 dark:text-gray-500">— no thresholds breached.</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
        {actionable.slice(0, 4).map((a) => {
          const s = SEVERITY_STYLE[a.severity];
          const drillable = Boolean(a.section) && Boolean(onDrillDown);
          return (
            <button
              key={a.id}
              type="button"
              disabled={!drillable}
              onClick={() => drillable && onDrillDown?.(a)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap',
                s.wrap,
                drillable && 'cursor-pointer transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-orange-500',
              )}
              title={drillable ? `${a.detail ?? ''} — tap to open`.trim() : a.detail}
            >
              {s.icon}
              {a.title}
              {drillable && <ChevronRight className="h-3 w-3 opacity-60" />}
            </button>
          );
        })}
        {actionable.length > 4 && (
          <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap">+{actionable.length - 4} more</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {alerts.map((a) => {
        const s = SEVERITY_STYLE[a.severity];
        const acked = isAcked(a.id);
        const drillable = Boolean(a.section) && Boolean(onDrillDown);
        return (
          <div
            key={a.id}
            className={cn('flex items-start gap-2.5 rounded-lg border p-2.5', s.wrap, acked && 'opacity-60')}
          >
            {s.icon}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{a.title}</p>
                <span className={cn('text-[9px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5', s.badge)}>
                  {acked ? 'Acknowledged' : s.label}
                </span>
              </div>
              {a.detail && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{a.detail}</p>}
              {!acked && (onAcknowledge || drillable) && (
                <div className="flex items-center gap-2 mt-1.5">
                  {drillable && (
                    <button
                      type="button"
                      onClick={() => onDrillDown?.(a)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
                    >
                      Open details <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                  {onAcknowledge && (
                    <button
                      type="button"
                      onClick={() => onAcknowledge(a.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
                    >
                      <Check className="h-3 w-3" /> Acknowledge
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
