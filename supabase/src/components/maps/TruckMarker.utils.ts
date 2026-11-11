export interface TruckLocation {
  driver_id: string;
  driver_name?: string;
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  trip_id: string | null;
  origin_city: string | null;
  destination_city: string | null;
  vehicle_type: string | null;
  available_capacity_tonnes: number | null;
  trip_status: string | null;
  last_seen_at: string;
  /**
   * false = synthetic marker (a posted trip placed at its origin city), not a
   * live GPS broadcast. Defaults to live when unset.
   */
  is_live?: boolean;
}

/**
 * A truck is in transit only when its underlying trip is `in_transit`.
 * `trip_id`/`origin_city` are populated for *posted* trips too, so we cannot
 * use them as a "in transit" signal — they just mean a trip exists.
 * `AutoGpsTracker` keeps `trip_status` in sync with the trips row, so once
 * the driver calls `start_trip` (RPC) the next 30s ping flips the marker.
 */
export function isTruckInTransit(truck: TruckLocation): boolean {
  if (truck.is_live === false) return false;
  return truck.trip_status === 'in_transit';
}

export function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
