import { AlertTriangle, AlertOctagon, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminAlert, AlertSeverity } from './alerts';

const SEVERITY_STYLE: Record<
  AlertSeverity,
  { wrap: string; icon: React.ReactNode; badge: string; label: string }
> = {
  critical: {
    wrap: 'border-red-200 bg-red-50',
    icon: <AlertOctagon className="h-4 w-4 text-red-600 shrink-0" />,
    badge: 'bg-red-100 text-red-700',
    label: 'Critical',
  },
  warning: {
    wrap: 'border-amber-200 bg-amber-50',
    icon: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />,
    badge: 'bg-amber-100 text-amber-700',
    label: 'Warning',
  },
  info: {
    wrap: 'border-gray-200 bg-white',
    icon: <Info className="h-4 w-4 text-gray-500 shrink-0" />,
    badge: 'bg-gray-100 text-gray-600',
    label: 'Info',
  },
};

interface AlertPanelProps {
  alerts: AdminAlert[];
  /** Compact = single-line strip used under the KPI row. */
  variant?: 'strip' | 'list';
}

export default function AlertPanel({ alerts, variant = 'strip' }: AlertPanelProps) {
  const actionable = alerts.filter((a) => a.severity !== 'info' || a.id !== 'all-clear');

  if (variant === 'strip') {
    if (actionable.length === 0) {
      return (
        <div className="flex items-center gap-2 text-xs text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">All systems normal</span>
          <span className="text-gray-400">— no thresholds breached.</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
        {alerts.slice(0, 4).map((a) => {
          const s = SEVERITY_STYLE[a.severity];
          return (
            <span
              key={a.id}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap',
                s.wrap,
              )}
              title={a.detail}
            >
              {s.icon}
              {a.title}
            </span>
          );
        })}
        {alerts.length > 4 && (
          <span className="text-[11px] text-gray-400 whitespace-nowrap">+{alerts.length - 4} more</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {alerts.map((a) => {
        const s = SEVERITY_STYLE[a.severity];
        return (
          <div key={a.id} className={cn('flex items-start gap-2.5 rounded-lg border p-2.5', s.wrap)}>
            {s.icon}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-gray-900 truncate">{a.title}</p>
                <span className={cn('text-[9px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5', s.badge)}>
                  {s.label}
                </span>
              </div>
              {a.detail && <p className="text-[11px] text-gray-500 mt-0.5">{a.detail}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
