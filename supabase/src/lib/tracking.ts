// Pure helpers for live tracking — kept dependency-free so they can be tested without React/Supabase.
export const TRACKING_STALE_THRESHOLD_MS = 2 * 60 * 1000; // 120 seconds
export const TRACKING_WRITE_INTERVAL_MS = 30 * 1000; // 30 seconds

export interface DriverLocationRow {
  driver_id: string;
  is_sharing?: boolean;
  trip_id?: string | null;
}

export function shouldWriteLocationWatermark(
  lastWriteAtMs: number,
  nowMs: number,
  intervalMs: number = TRACKING_WRITE_INTERVAL_MS,
): boolean {
  return nowMs - lastWriteAtMs >= intervalMs;
}

export function isLocationStale(lastUpdatedIso: string | null | undefined, nowMs: number): boolean {
  if (!lastUpdatedIso) return false;
  const last = Date.parse(lastUpdatedIso);
  if (Number.isNaN(last)) return false;
  return nowMs - last >= TRACKING_STALE_THRESHOLD_MS;
}

export function shouldPublishGps(hasActiveTrip: boolean): boolean {
  return hasActiveTrip;
}
