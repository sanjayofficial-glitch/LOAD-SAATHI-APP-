/**
 * Shared display helpers for the command center's posted-listing views
 * (trips posted by truckers, loads posted by shippers).
 *
 * Kept in one module so the list rows and the detail drawer can never show a
 * status with two different words or a rupee value in two different formats.
 */

const STATUS_LABELS: Record<string, string> = {
  active: 'Open',
  pending: 'Open',
  matched: 'Matched',
  in_transit: 'In transit',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  accepted: 'Accepted',
  declined: 'Declined',
};

const STATUS_CLASSES: Record<string, string> = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  matched: 'border-blue-200 bg-blue-50 text-blue-700',
  in_transit: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  delivered: 'border-purple-200 bg-purple-50 text-purple-700',
  completed: 'border-gray-200 bg-gray-100 text-gray-600',
  cancelled: 'border-red-200 bg-red-50 text-red-600',
  accepted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  declined: 'border-red-200 bg-red-50 text-red-600',
};

/** Canonical ordering for the status filter chips. */
export const STATUS_ORDER = [
  'active',
  'pending',
  'matched',
  'in_transit',
  'delivered',
  'completed',
  'cancelled',
  'accepted',
  'declined',
];

/**
 * Raw status values, kept here so queries and filters across the admin area
 * can never drift apart (a typo'd 'actve' silently returns zero rows).
 */
export const TRIP_STATUS = {
  active: 'active',
  inTransit: 'in_transit',
  completed: 'completed',
  cancelled: 'cancelled',
} as const;

export const SHIPMENT_STATUS = {
  pending: 'pending',
  matched: 'matched',
  delivered: 'delivered',
} as const;

export const REQUEST_STATUS = {
  pending: 'pending',
  accepted: 'accepted',
} as const;

/** A load is open for matching while it is pending or matched — shipments have no 'active'. */
export const OPEN_SHIPMENT_STATUSES = [SHIPMENT_STATUS.pending, SHIPMENT_STATUS.matched] as const;

export function statusLabel(status?: string | null): string {
  if (!status) return 'Unknown';
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

export function statusClass(status?: string | null): string {
  return STATUS_CLASSES[status ?? ''] ?? 'border-gray-200 bg-gray-100 text-gray-600';
}

/** "just now" / "12m ago" / "3h ago" / "2d ago". */
export function timeAgo(iso?: string | null): string {
  if (!iso) return '—';
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return '—';
  const diff = Date.now() - ts;
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** "25 Oct 2026" for a `date` column, falling back to the raw value. */
export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatINR(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

/** 145 min → "2h 25m". */
export function formatDuration(min?: number | null): string {
  if (min == null || !Number.isFinite(min) || min <= 0) return '—';
  if (min < 60) return `${Math.round(min)}m`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatKm(km?: number | null): string {
  if (km == null || !Number.isFinite(km) || km <= 0) return '—';
  return `${Math.round(km).toLocaleString('en-IN')} km`;
}

/** "Punjab → Maharashtra" style route line with state detail when present. */
export function routeLine(originCity?: string | null, originState?: string | null): string {
  if (!originCity) return '—';
  return originState ? `${originCity}, ${originState}` : originCity;
}
