export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface AdminAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail?: string;
}

export interface AlertInputs {
  activeTrucks: number;
  idleTrucks: number;
  staleTrucks: number;
  unmatchedShipments: number;
  pendingRequests: number;
  oldestWaitingLoadMins: number | null;
  highValueLoads: number;
}

const SEVERITY_RANK: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

/**
 * Derive the actionable alert list from live counts.
 * Thresholds mirror the defaults in AlertRulesEngine so the config dialog and
 * the board agree on what "an alert" means.
 */
export function deriveAlerts(input: AlertInputs): AdminAlert[] {
  const alerts: AdminAlert[] = [];

  if (input.activeTrucks === 0) {
    alerts.push({
      id: 'no-trucks',
      severity: 'critical',
      title: 'No trucks online',
      detail: 'Nothing is reporting a position right now.',
    });
  }

  if (input.unmatchedShipments >= 5) {
    alerts.push({
      id: 'unmatched-loads',
      severity: 'critical',
      title: `${input.unmatchedShipments} loads unmatched`,
      detail:
        input.oldestWaitingLoadMins != null
          ? `Oldest has been waiting ${input.oldestWaitingLoadMins} min.`
          : 'Above the 5-load threshold.',
    });
  } else if (input.unmatchedShipments > 0) {
    alerts.push({
      id: 'unmatched-loads',
      severity: 'warning',
      title: `${input.unmatchedShipments} loads unmatched`,
    });
  }

  if (input.pendingRequests >= 4) {
    alerts.push({
      id: 'pending-requests',
      severity: 'warning',
      title: `${input.pendingRequests} booking requests pending`,
      detail: 'Waiting on a trucker to accept.',
    });
  }

  if (input.idleTrucks >= 3) {
    alerts.push({
      id: 'idle-trucks',
      severity: 'warning',
      title: `${input.idleTrucks} trucks idle`,
      detail: 'Online but not on a trip.',
    });
  }

  if (input.oldestWaitingLoadMins != null && input.oldestWaitingLoadMins >= 30 && input.unmatchedShipments < 5) {
    alerts.push({
      id: 'slow-load',
      severity: 'warning',
      title: `Load waiting ${input.oldestWaitingLoadMins} min`,
      detail: 'A posted load has not been matched for over 30 min.',
    });
  }

  if (input.staleTrucks > 0) {
    alerts.push({
      id: 'stale-gps',
      severity: 'warning',
      title: `${input.staleTrucks} trucks stopped reporting`,
      detail: 'No position update in the last 15 min.',
    });
  }

  if (input.highValueLoads > 0) {
    alerts.push({
      id: 'high-value',
      severity: 'info',
      title: `${input.highValueLoads} high-value loads`,
      detail: 'Worth more than ₹50,000 — worth a manual push.',
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
