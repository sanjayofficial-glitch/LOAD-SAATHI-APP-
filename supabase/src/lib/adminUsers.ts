import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * SEC-01 admin data path. The `users` table no longer exposes sensitive
 * columns (phone, KYC document URLs, verification internals, …) to the
 * `authenticated` role directly. Admin surfaces load the full user rows via
 * the `admin_users_view` RPC (SECURITY DEFINER — bypasses column grants) and
 * attach them to listings client-side.
 */

const USER_PROFILE_FIELDS = [
  'id',
  'full_name',
  'phone',
  'company_name',
  'rating',
  'total_trips',
  'is_verified',
  'avatar_url',
  'user_type',
  'created_at',
  'verification_status',
] as const;

type UserRow = Record<string, unknown>;

export async function fetchAdminUsersMap(
  supabase: SupabaseClient,
): Promise<Map<string, UserRow>> {
  const map = new Map<string, UserRow>();
  const { data } = await supabase.rpc('admin_users_view');
  if (!Array.isArray(data)) return map;
  for (const u of data as UserRow[]) {
    if (typeof u.id !== 'string') continue;
    const profile: UserRow = {};
    for (const f of USER_PROFILE_FIELDS) {
      if (f in u) profile[f] = u[f];
    }
    map.set(u.id, profile);
  }
  return map;
}

function attachFromMap<T>(
  rows: T[],
  idField: string,
  embedField: 'trucker' | 'shipper',
  map: Map<string, UserRow>,
): T[] {
  return rows.map((row) => {
    const r = row as UserRow;
    const id = r[idField] as string | undefined;
    if (!id) return row;
    const existing = (r[embedField] ?? null) as UserRow | null;
    const full = map.get(id);
    if (!full) return row;
    return { ...r, [embedField]: { ...(existing ?? {}), ...full } } as T;
  });
}

export const attachTruckerToTrips = <T>(rows: T[], map: Map<string, UserRow>) =>
  attachFromMap(rows, 'trucker_id', 'trucker', map);

export const attachShipperToShipments = <T>(rows: T[], map: Map<string, UserRow>) =>
  attachFromMap(rows, 'shipper_id', 'shipper', map);

export const attachShipperToRequests = <T>(rows: T[], map: Map<string, UserRow>) =>
  attachFromMap(rows, 'shipper_id', 'shipper', map);

export const attachTruckerToShipmentRequests = <T>(rows: T[], map: Map<string, UserRow>) =>
  attachFromMap(rows, 'trucker_id', 'trucker', map);
