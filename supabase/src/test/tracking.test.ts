import { describe, it, expect } from 'vitest';
import {
  TRACKING_STALE_THRESHOLD_MS,
  TRACKING_WRITE_INTERVAL_MS,
  shouldWriteLocationWatermark,
  isLocationStale,
  shouldPublishGps,
} from '@/lib/tracking';

describe('tracking helpers', () => {
  it('Interval is 30s by default', () => {
    expect(TRACKING_WRITE_INTERVAL_MS).toBe(30000);
  });

  it('Stale threshold is 120s', () => {
    expect(TRACKING_STALE_THRESHOLD_MS).toBe(120000);
  });

  it('should write only when interval elapsed', () => {
    const t0 = 1_000_000;
    expect(shouldWriteLocationWatermark(t0, t0 - 1)).toBe(false); // negative delta treated
    expect(shouldWriteLocationWatermark(t0, t0 + 29999)).toBe(false);
    expect(shouldWriteLocationWatermark(t0, t0 + 30000)).toBe(true);
    expect(shouldWriteLocationWatermark(t0, t0 + 100000)).toBe(true);
  });

  it('isLocationStale flags timestamps >= 120s old', () => {
    const now = Date.now();
    expect(isLocationStale(null, now)).toBe(false);
    expect(isLocationStale(undefined, now)).toBe(false);
    expect(isLocationStale('not-a-date', now)).toBe(false);
    const fresh = new Date(now - 60_000).toISOString();
    const stale = new Date(now - 121_000).toISOString();
    expect(isLocationStale(fresh, now)).toBe(false);
    expect(isLocationStale(stale, now)).toBe(true);
  });

  it('GPS only publishes when an active trip exists', () => {
    expect(shouldPublishGps(false)).toBe(false);
    expect(shouldPublishGps(true)).toBe(true);
  });
});
