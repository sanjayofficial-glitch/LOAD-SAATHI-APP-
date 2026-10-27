import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import type { Request, ShipmentRequest } from '@/types';

/** Literal selects so the embedded relation parses at the type level. */
const TRIP_REQUEST_SELECT =
  '*, shipper:users!requests_shipper_id_fkey(id, full_name, phone, company_name, rating, total_trips, is_verified, avatar_url, user_type, created_at, verification_status)';

const SHIPMENT_OFFER_SELECT =
  '*, trucker:users!shipment_requests_trucker_id_fkey(id, full_name, phone, company_name, rating, total_trips, is_verified, avatar_url, user_type, created_at, verification_status)';

const RELATED_LIMIT = 50;

export type ListingKind = 'trip' | 'shipment';

/**
 * useListingDetail — everything attached to one posting:
 *
 *  - a trip  → the booking requests shippers sent to it (goods, weight,
 *              addresses, status), each joined to the shipper's profile
 *  - a load  → the offers truckers made on it (proposed rate, message,
 *              status), each joined to the trucker's profile
 *
 * This is the part the map and the KPI strip can never show: who is actually
 * on each side of a posting.
 */
export function useListingDetail(kind: ListingKind | null, id: string | null) {
  const { getSupabaseToken } = useAuth();

  return useQuery<Request[] | ShipmentRequest[]>({
    queryKey: ['admin-command-listing-detail', kind, id],
    enabled: Boolean(kind && id),
    queryFn: async () => {
      const token = await getSupabaseToken();
      if (!token) return [];
      const supabase = createClerkSupabaseClient(token);

      if (kind === 'trip') {
        const { data, error } = await supabase
          .from('requests')
          .select(TRIP_REQUEST_SELECT)
          .eq('trip_id', id as string)
          .order('created_at', { ascending: false })
          .limit(RELATED_LIMIT);
        if (error) console.warn('[useListingDetail] trip requests failed:', error.message);
        return (data ?? []) as Request[];
      }

      const { data, error } = await supabase
        .from('shipment_requests')
        .select(SHIPMENT_OFFER_SELECT)
        .eq('shipment_id', id as string)
        .order('created_at', { ascending: false })
        .limit(RELATED_LIMIT);
      if (error) console.warn('[useListingDetail] shipment offers failed:', error.message);
      return (data ?? []) as ShipmentRequest[];
    },
    staleTime: 15000,
  });
}
