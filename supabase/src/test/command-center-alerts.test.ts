import { describe, it, expect } from 'vitest';
import {
  DEFAULT_THRESHOLDS,
  deriveAlerts,
  type AlertConfig,
  type AlertInputs,
} from '@/pages/admin/command-center/alerts';

const QUIET: AlertInputs = {
  activeTrucks: 5,
  idleTrucks: 1,
  staleTrucks: 0,
  unmatchedShipments: 1,
  pendingRequests: 1,
  oldestWaitingLoadMins: 5,
  highValueLoads: 0,
};

const CONFIG: AlertConfig = { thresholds: DEFAULT_THRESHOLDS, disabled: [] };

const withInputs = (patch: Partial<AlertInputs>) => ({ ...QUIET, ...patch });

describe('deriveAlerts', () => {
  it('returns an all-clear when nothing breaches', () => {
    const alerts = deriveAlerts(
      {
        activeTrucks: 5,
        idleTrucks: 1,
        staleTrucks: 0,
        unmatchedShipments: 0,
        pendingRequests: 0,
        oldestWaitingLoadMins: null,
        highValueLoads: 0,
      },
      CONFIG,
    );
    expect(alerts).toHaveLength(1);
    const [first] = alerts;
    expect(first?.id).toBe('all-clear');
    expect(first?.severity).toBe('info');
  });

  it('flags zero online trucks as critical', () => {
    const alerts = deriveAlerts(withInputs({ activeTrucks: 0 }), CONFIG);
    const noTrucks = alerts.find((a) => a.id === 'no-trucks');
    expect(noTrucks?.severity).toBe('critical');
    expect(noTrucks?.section).toBe('onTrip');
  });

  it('escalates unmatched loads from warning to critical at the threshold', () => {
    const below = deriveAlerts(withInputs({ unmatchedShipments: 4 }), CONFIG);
    expect(below.find((a) => a.id === 'unmatched-loads')?.severity).toBe('warning');

    const atThreshold = deriveAlerts(withInputs({ unmatchedShipments: 5 }), CONFIG);
    const critical = atThreshold.find((a) => a.id === 'unmatched-loads');
    expect(critical?.severity).toBe('critical');
    expect(critical?.detail).toContain('5 min');
  });

  it('honours a raised unmatched threshold', () => {
    const raised: AlertConfig = {
      thresholds: { ...DEFAULT_THRESHOLDS, unmatchedCritical: 10 },
      disabled: [],
    };
    const alerts = deriveAlerts(withInputs({ unmatchedShipments: 6 }), raised);
    const unmatched = alerts.find((a) => a.id === 'unmatched-loads');
    expect(unmatched?.severity).toBe('warning');
  });

  it('does not double-report a slow load when unmatched is already critical', () => {
    const alerts = deriveAlerts(
      withInputs({ unmatchedShipments: 5, oldestWaitingLoadMins: 90 }),
      CONFIG,
    );
    expect(alerts.filter((a) => a.id === 'slow-load')).toHaveLength(0);
  });

  it('fires the slow-load warning when loads sit under the critical count', () => {
    const alerts = deriveAlerts(
      withInputs({ unmatchedShipments: 2, oldestWaitingLoadMins: 45 }),
      CONFIG,
    );
    const slow = alerts.find((a) => a.id === 'slow-load');
    expect(slow?.severity).toBe('warning');
    expect(slow?.detail).toContain('30 min');
  });

  it('suppresses disabled rules', () => {
    const disabled: AlertConfig = {
      thresholds: DEFAULT_THRESHOLDS,
      disabled: ['idle-trucks', 'high-value'],
    };
    const alerts = deriveAlerts(
      withInputs({ idleTrucks: 9, highValueLoads: 4, pendingRequests: 5 }),
      disabled,
    );
    expect(alerts.find((a) => a.id === 'idle-trucks')).toBeUndefined();
    expect(alerts.find((a) => a.id === 'high-value')).toBeUndefined();
    // Other rules still fire.
    expect(alerts.find((a) => a.id === 'pending-requests')).toBeDefined();
  });

  it('names the vehicles that stopped reporting', () => {
    const alerts = deriveAlerts(
      withInputs({
        staleTrucks: 5,
        staleVehicleNumbers: ['MH-12-AB-1234', 'MH-14-CD-5678', 'MH-12-EF-9012', 'MH-13-GH-3456', 'MH-11-JK-7890'],
      }),
      CONFIG,
    );
    const stale = alerts.find((a) => a.id === 'stale-gps');
    expect(stale).toBeDefined();
    expect(stale?.detail).toContain('MH-12-AB-1234');
    // Only the first four are listed; the rest collapse into "+1 more".
    expect(stale?.detail).not.toContain('MH-11-JK-7890');
    expect(stale?.detail).toContain('+1 more');
    expect(stale?.detail).toContain(`${DEFAULT_THRESHOLDS.staleGpsMins} min`);
  });

  it('falls back to a generic stale detail without vehicle names', () => {
    const alerts = deriveAlerts(withInputs({ staleTrucks: 2 }), CONFIG);
    const stale = alerts.find((a) => a.id === 'stale-gps');
    expect(stale?.detail).toBe(
      `No position update in the last ${DEFAULT_THRESHOLDS.staleGpsMins} min.`,
    );
  });

  it('orders alerts by severity: critical, warning, info', () => {
    const alerts = deriveAlerts(
      withInputs({
        activeTrucks: 0,
        idleTrucks: 5,
        staleTrucks: 1,
        pendingRequests: 4,
        highValueLoads: 2,
      }),
      CONFIG,
    );
    const rank = { critical: 0, warning: 1, info: 2 } as const;
    const ranks = alerts.map((a) => rank[a.severity]);
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
    expect(alerts[0]?.severity).toBe('critical');
  });

  it('maps every alert to a drill-down section (except all-clear)', () => {
    const alerts = deriveAlerts(
      withInputs({
        activeTrucks: 0,
        idleTrucks: 5,
        staleTrucks: 1,
        pendingRequests: 4,
        highValueLoads: 2,
      }),
      CONFIG,
    );
    for (const a of alerts) {
      if (a.id === 'all-clear') continue;
      expect(a.section, `${a.id} has no section`).toBeTruthy();
    }
  });
});
