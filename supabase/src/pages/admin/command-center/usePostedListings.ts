import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import {
  attachShipperToShipments,
  attachTruckerToTrips,
  fetchAdminUsersMap,
} from '@/lib/adminUsers';
import type { Trip, Shipment } from '@/types';

/**
 * Every profile field the board shows next to a posting — enough to tell the
 * operator *who* posted it without opening the Users page.
 *
 * SEC-01: sensitive columns (phone, KYC docs, …) are no longer readable
 * directly from `users`; the full profiles are attached client-side from the
 * `admin_users_view` RPC (see fetchAdminUsersMap). The constants below only
 * carry the safe public fields in case the admin RPC is ever unavailable.
 */
export const TRIP_SELECT =
  '*, trucker:users!trips_trucker_id_fkey(id, full_name, company_name, rating, total_trips, is_verified, avatar_url, user_type, created_at, verification_status)';

export const SHIPMENT_SELECT =
  '*, shipper:users!shipments_shipper_id_fkey(id, full_name, company_name, rating, total_trips, is_verified, avatar_url, user_type, created_at, verification_status)';

/** Newest N trips and loads kept on the board at once. */
const LISTING_LIMIT = 60;

export interface PostedListings {
  trips: Trip[];
  shipments: Shipment[];
  /**
   * Per-table read failures. The board renders trips and loads from the same
   * request, so a load-only failure must not look like "no loads posted" —
   * the panel shows this instead of an empty state.
   */
  errors?: { trips?: string; shipments?: string };
}

/**
 * usePostedListings — the postings themselves: every trip a trucker has posted
 * and every load a shipper has posted, newest first, each joined to the
 * poster's profile (attached from admin_users_view).
 *
 * This is separate from the live GPS hooks (driver_locations / load_locations),
 * which only carry vehicles and loads that have coordinates — a posting with no
 * route yet never reaches the map but must still be visible here.
 */
export function usePostedListings(enabled: boolean) {
  const { getSupabaseToken } = useAuth();

  return useQuery<PostedListings>({
    queryKey: ['admin-command-listings'],
    queryFn: async () => {
      const token = await getSupabaseToken();
      if (!token) return { trips: [], shipments: [] };
      const supabase = createClerkSupabaseClient(token);

      const [tripsRes, shipmentsRes, userMap] = await Promise.all([
        supabase
          .from('trips')
          .select(TRIP_SELECT)
          .order('created_at', { ascending: false })
          .limit(LISTING_LIMIT),
        supabase
          .from('shipments')
          .select(SHIPMENT_SELECT)
          .order('created_at', { ascending: false })
          .limit(LISTING_LIMIT),
        fetchAdminUsersMap(supabase),
      ]);

      if (tripsRes.error) {
        console.warn('[usePostedListings] trips query failed:', tripsRes.error.message);
      }
      if (shipmentsRes.error) {
        console.warn('[usePostedListings] shipments query failed:', shipmentsRes.error.message);
      }

      const errors: PostedListings['errors'] = {};
      if (tripsRes.error) errors.trips = tripsRes.error.message;
      if (shipmentsRes.error) errors.shipments = shipmentsRes.error.message;

      return {
        trips: attachTruckerToTrips((tripsRes.data ?? []) as Trip[], userMap),
        shipments: attachShipperToShipments((shipmentsRes.data ?? []) as Shipment[], userMap),
        errors,
      };
    },
    enabled,
    refetchInterval: 30000,
  });
}
