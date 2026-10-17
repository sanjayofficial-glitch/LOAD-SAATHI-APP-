import { useState, useEffect } from 'react';
import { Bell, Plus, AlertTriangle, Clock, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AlertRule {
  id: string;
  type: 'pending_loads' | 'idle_truck' | 'high_value' | 'no_movement';
  threshold: number;
  enabled: boolean;
  label: string;
}

const DEFAULT_RULES: AlertRule[] = [
  { id: '1', type: 'pending_loads', threshold: 5, enabled: true, label: '>5 loads pending for 30 min' },
  { id: '2', type: 'idle_truck', threshold: 3, enabled: true, label: '>3 trucks idle for 1 hour' },
  { id: '3', type: 'high_value', threshold: 50000, enabled: true, label: 'Load worth >₹50,000 posted' },
  { id: '4', type: 'no_movement', threshold: 2, enabled: false, label: 'Trip no movement for 2 hours' },
];

const TYPE_ICONS: Record<AlertRule['type'], React.ReactNode> = {
  pending_loads: <Package className="h-3.5 w-3.5 text-blue-500" />,
  idle_truck: <Truck className="h-3.5 w-3.5 text-orange-500" />,
  high_value: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
  no_movement: <Clock className="h-3.5 w-3.5 text-red-500" />,
};

interface AlertRulesEngineProps {
  alerts: string[];
}

const STORAGE_KEY = 'loadsaathi-alert-rules';

function loadRules(): AlertRule[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return DEFAULT_RULES;
}

function saveRules(rules: AlertRule[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  } catch { /* ignore */ }
}

export default function AlertRulesEngine({ alerts }: AlertRulesEngineProps) {
  const [rules, setRules] = useState<AlertRule[]>(loadRules);
  const [showConfig, setShowConfig] = useState(false);

  // Persist rules to localStorage whenever they change
  useEffect(() => {
    saveRules(rules);
  }, [rules]);

  const activeAlerts = alerts.filter((a) => a !== '');

  return (
    <>
      {/* Alert indicator button */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 relative"
        onClick={() => setShowConfig(true)}
      >
        <Bell className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Alerts</span>
        {activeAlerts.length > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {activeAlerts.length}
          </span>
        )}
      </Button>

      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-orange-500" />
              Alert Rules
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {activeAlerts.length > 0 && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Active Alerts</p>
                {activeAlerts.map((alert, i) => (
                  <p key={i} className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                    {alert}
                  </p>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="shrink-0">{TYPE_ICONS[rule.type]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{rule.label}</p>
                  </div>
                  <button
                    onClick={() =>
                      setRules((prev) =>
                        prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r)),
                      )
                    }
                    className={`relative h-5 w-9 rounded-full transition-colors ${
                      rule.enabled ? 'bg-green-500' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        rule.enabled ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                const newRule: AlertRule = {
                  id: Date.now().toString(),
                  type: 'pending_loads',
                  threshold: 5,
                  enabled: true,
                  label: 'Custom alert rule',
                };
                setRules((prev) => [...prev, newRule]);
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
