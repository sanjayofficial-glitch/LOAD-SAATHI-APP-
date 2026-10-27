import { useState } from 'react';
import { Bell, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ALERT_RULE_DEFS,
  DEFAULT_ALERT_CONFIG,
  type AlertConfig,
} from './alerts';

interface AlertRulesEngineProps {
  config: AlertConfig;
  onChange: (config: AlertConfig) => void;
  /** Number of currently firing alerts — shown as the button badge. */
  activeCount?: number;
}

/**
 * Editor for the thresholds that drive deriveAlerts(). Every control here
 * changes what the alert strip reports on the board — nothing is decorative.
 */
export default function AlertRulesEngine({ config, onChange, activeCount = 0 }: AlertRulesEngineProps) {
  const [open, setOpen] = useState(false);

  const isDisabled = (ruleId: string) => config.disabled.includes(ruleId);

  const toggleRule = (ruleId: string) => {
    const disabled = isDisabled(ruleId)
      ? config.disabled.filter((id) => id !== ruleId)
      : [...config.disabled, ruleId];
    onChange({ ...config, disabled });
  };

  const setThreshold = (key: (typeof ALERT_RULE_DEFS)[number]['key'], value: number) => {
    onChange({ ...config, thresholds: { ...config.thresholds, [key]: value } });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 border-gray-200 relative"
        onClick={() => setOpen(true)}
        aria-label="Configure alert thresholds"
      >
        <Bell className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Alert rules</span>
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-orange-500" />
              Alert rules
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-2 max-h-[60vh] overflow-y-auto">
            <p className="text-[11px] text-gray-500">
              Thresholds apply immediately to the alert strip on the board and are saved in this
              browser.
            </p>

            {ALERT_RULE_DEFS.map((rule) => {
              const disabled = isDisabled(rule.ruleId);
              return (
                <div
                  key={rule.key}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 bg-white"
                >
                  <div className="flex-1 min-w-0">
                    <p className={disabled ? 'text-sm font-medium text-gray-400' : 'text-sm font-medium'}>
                      {rule.label}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Currently {config.thresholds[rule.key].toLocaleString('en-IN')} {rule.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Input
                      type="number"
                      min={0}
                      step={rule.step}
                      disabled={disabled}
                      value={config.thresholds[rule.key]}
                      onChange={(e) => setThreshold(rule.key, Math.max(0, Number(e.target.value) || 0))}
                      className="h-8 w-20 text-right text-xs"
                      aria-label={`${rule.label} threshold`}
                    />
                    <span className="text-[11px] text-gray-400 w-8">{rule.unit}</span>
                    <Switch
                      checked={!disabled}
                      onCheckedChange={() => toggleRule(rule.ruleId)}
                      aria-label={`${disabled ? 'Enable' : 'Disable'} ${rule.label}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onChange(DEFAULT_ALERT_CONFIG)}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset to defaults
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
