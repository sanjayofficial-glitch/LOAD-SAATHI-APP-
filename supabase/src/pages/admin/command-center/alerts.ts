export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface AdminAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail?: string;
  /** Where "drill down" takes the operator — a CommandRail section key. */
  section?: string;
}

export interface AlertInputs {
  activeTrucks: number;
  idleTrucks: number;
  staleTrucks: number;
  /** Vehicle numbers of the trucks that stopped reporting (stale-gps detail). */
  staleVehicleNumbers?: string[];
  unmatchedShipments: number;
  pendingRequests: number;
  oldestWaitingLoadMins: number | null;
  highValueLoads: number;
}

// ── Thresholds ───────────────────────────────────────────────────
// The single source of truth for "what is an alert". AlertRulesEngine edits
// these; deriveAlerts reads them. Persisted per browser in localStorage.

export interface AlertThresholds {
  /** Unmatched loads at which the alert escalates from warning to critical. */
  unmatchedCritical: number;
  /** Pending booking requests before the warning fires. */
  pendingRequests: number;
  /** Idle (online, no trip) trucks before the warning fires. */
  idleTrucks: number;
  /** Minutes a single load may sit unmatched before the warning fires. */
  slowLoadMins: number;
  /** Minutes without a GPS position before a truck counts as stale. */
  staleGpsMins: number;
  /** Rupee value above which a load is flagged as high-value. */
  highValueAmount: number;
}

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  unmatchedCritical: 5,
  pendingRequests: 4,
  idleTrucks: 3,
  slowLoadMins: 30,
  staleGpsMins: 15,
  highValueAmount: 50000,
};

export interface AlertRuleDef {
  key: keyof AlertThresholds;
  /** Rule id used by deriveAlerts — also the acknowledge key. */
  ruleId: string;
  label: string;
  unit: string;
  step: number;
}

export const ALERT_RULE_DEFS: AlertRuleDef[] = [
  { key: 'unmatchedCritical', ruleId: 'unmatched-loads', label: 'Unmatched loads (critical)', unit: 'loads', step: 1 },
  { key: 'pendingRequests', ruleId: 'pending-requests', label: 'Pending booking requests', unit: 'requests', step: 1 },
  { key: 'idleTrucks', ruleId: 'idle-trucks', label: 'Idle trucks', unit: 'trucks', step: 1 },
  { key: 'slowLoadMins', ruleId: 'slow-load', label: 'Load waiting longer than', unit: 'min', step: 5 },
  { key: 'staleGpsMins', ruleId: 'stale-gps', label: 'No GPS update for', unit: 'min', step: 5 },
  { key: 'highValueAmount', ruleId: 'high-value', label: 'High-value load above', unit: '₹', step: 5000 },
];

export interface AlertConfig {
  thresholds: AlertThresholds;
  /** Rule ids the operator has switched off. */
  disabled: string[];
}

export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  thresholds: DEFAULT_THRESHOLDS,
  disabled: [],
};

const CONFIG_KEY = 'admin-command-alert-config';

export function loadAlertConfig(): AlertConfig {
  if (typeof window === 'undefined') return DEFAULT_ALERT_CONFIG;
  try {
    const raw = window.localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_ALERT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<AlertConfig>;
    return {
      thresholds: { ...DEFAULT_THRESHOLDS, ...(parsed.thresholds ?? {}) },
      disabled: Array.isArray(parsed.disabled) ? parsed.disabled : [],
    };
  } catch {
    return DEFAULT_ALERT_CONFIG;
  }
}

export function saveAlertConfig(config: AlertConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Storage unavailable (private mode) — the config simply won't persist.
  }
}

const SEVERITY_RANK: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

/**
 * Derive the actionable alert list from live counts, honouring the operator's
 * thresholds and per-rule disable flags.
 */
export function deriveAlerts(
  input: AlertInputs,
  config: AlertConfig = DEFAULT_ALERT_CONFIG,
): AdminAlert[] {
  const t = { ...DEFAULT_THRESHOLDS, ...config.thresholds };
  const off = new Set(config.disabled);
  const alerts: AdminAlert[] = [];

  if (!off.has('no-trucks') && input.activeTrucks === 0) {
    alerts.push({
      id: 'no-trucks',
      severity: 'critical',
      title: 'No trucks online',
      detail: 'Nothing is reporting a position right now.',
      section: 'onTrip',
    });
  }

  if (!off.has('unmatched-loads') && input.unmatchedShipments >= t.unmatchedCritical) {
    alerts.push({
      id: 'unmatched-loads',
      severity: 'critical',
      title: `${input.unmatchedShipments} loads unmatched`,
      detail:
        input.oldestWaitingLoadMins != null
          ? `Oldest has been waiting ${input.oldestWaitingLoadMins} min.`
          : `Above the ${t.unmatchedCritical}-load threshold.`,
      section: 'loads',
    });
  } else if (!off.has('unmatched-loads') && input.unmatchedShipments > 0) {
    alerts.push({
      id: 'unmatched-loads',
      severity: 'warning',
      title: `${input.unmatchedShipments} loads unmatched`,
      section: 'loads',
    });
  }

  if (!off.has('pending-requests') && input.pendingRequests >= t.pendingRequests) {
    alerts.push({
      id: 'pending-requests',
      severity: 'warning',
      title: `${input.pendingRequests} booking requests pending`,
      detail: 'Waiting on a trucker to accept.',
      section: 'matches',
    });
  }

  if (!off.has('idle-trucks') && input.idleTrucks >= t.idleTrucks) {
    alerts.push({
      id: 'idle-trucks',
      severity: 'warning',
      title: `${input.idleTrucks} trucks idle`,
      detail: 'Online but not on a trip.',
      section: 'idle',
    });
  }

  if (
    !off.has('slow-load') &&
    input.oldestWaitingLoadMins != null &&
    input.oldestWaitingLoadMins >= t.slowLoadMins &&
    input.unmatchedShipments < t.unmatchedCritical
  ) {
    alerts.push({
      id: 'slow-load',
      severity: 'warning',
      title: `Load waiting ${input.oldestWaitingLoadMins} min`,
      detail: `A posted load has not been matched for over ${t.slowLoadMins} min.`,
      section: 'loads',
    });
  }

  if (!off.has('stale-gps') && input.staleTrucks > 0) {
    const vehicles = input.staleVehicleNumbers ?? [];
    alerts.push({
      id: 'stale-gps',
      severity: 'warning',
      title: `${input.staleTrucks} trucks stopped reporting`,
      detail:
        vehicles.length > 0
          ? `No position update in ${t.staleGpsMins} min: ${vehicles.slice(0, 4).join(', ')}${
              vehicles.length > 4 ? ` +${vehicles.length - 4} more` : ''
            }.`
          : `No position update in the last ${t.staleGpsMins} min.`,
      section: 'idle',
    });
  }

  if (!off.has('high-value') && input.highValueLoads > 0) {
    alerts.push({
      id: 'high-value',
      severity: 'info',
      title: `${input.highValueLoads} high-value loads`,
      detail: `Worth more than ₹${t.highValueAmount.toLocaleString('en-IN')} — worth a manual push.`,
      section: 'loads',
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: 'all-clear',
      severity: 'info',
      title: 'All systems normal',
      detail: 'No thresholds breached in the last check.',
    });
  }

  return alerts.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}
