import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { authorizeRealtime } from '@/utils/realtime';
import { useAuth } from '@/contexts/AuthContext';
import type { LoadLocation } from '../components/maps/LoadMarker';

/**
 * useLiveLoadLocations - Subscribe to real-time load demand positions.
 * 
 * Flow:
 * 1. Fetch active loads with coordinates via Clerk-authenticated query
 * 2. Subscribe to postgres_changes on load_locations (INSERT/UPDATE/DELETE) via anon client
 * 3. Return LoadLocation[] for map consumption
 * 4. Auto-unsubscribe on unmount
 */
export function useLiveLoadLocations() {
  const { getSupabaseToken } = useAuth();
  const [loads, setLoads] = useState<LoadLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInitial = useCallback(async () => {
    try {
      const token = await getSupabaseToken();
      const client = token ? createClerkSupabaseClient(token) : supabase;

      const { data } = await client
        .from('load_locations')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!data) return;

      setLoads(
        data.map((row) => ({
          id: row.id,
          shipper_id: row.shipper_id,
          shipment_id: row.shipment_id,
          origin_city: row.origin_city,
          dest_city: row.dest_city,
          origin_lat: row.origin_lat,
          origin_lng: row.origin_lng,
          dest_lat: row.dest_lat,
          dest_lng: row.dest_lng,
          weight_tonnes: row.weight_tonnes,
          budget_per_tonne: row.budget_per_tonne,
          goods_description: row.goods_description,
          status: row.status,
          created_at: row.created_at,
        })),
      );
    } catch (err) {
      console.error('[useLiveLoadLocations] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getSupabaseToken]);

  const subscribe = useCallback(async () => {
    // Authorize the shared realtime socket with the Clerk JWT before
    // subscribing — RLS on load_locations is `TO authenticated` and the
    // anon role is denied (verified live: 401 "permission denied for table
    // load_locations"), so postgres_changes events would never arrive.
    if (getSupabaseToken) await authorizeRealtime(getSupabaseToken);

    const channel = supabase
      .channel('load-locations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'load_locations',
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setLoads((prev) => prev.filter((l) => l.id !== (payload.old as Record<string, unknown>)?.id));
            return;
          }

          const row = payload.new as Record<string, unknown>;
          const loc: LoadLocation = {
            id: row.id as string,
            shipper_id: row.shipper_id as string,
            shipment_id: row.shipment_id as string | null,
            origin_city: row.origin_city as string,
            dest_city: row.dest_city as string,
            origin_lat: row.origin_lat as number | null,
            origin_lng: row.origin_lng as number | null,
            dest_lat: row.dest_lat as number | null,
            dest_lng: row.dest_lng as number | null,
            weight_tonnes: row.weight_tonnes as number | null,
            budget_per_tonne: row.budget_per_tonne as number | null,
            goods_description: row.goods_description as string | null,
            status: row.status as string,
            created_at: row.created_at as string,
          };

          setLoads((prev) => {
            const filtered = prev.filter((l) => l.id !== loc.id);
            if (loc.status === 'active') {
              return [loc, ...filtered];
            }
            return filtered;
          });
        },
      )
      .subscribe();

    return channel;
  }, [getSupabaseToken]);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    fetchInitial();
    void (async () => {
      try {
        channel = await subscribe();
      } catch (err) {
        console.error('[useLiveLoadLocations] Realtime subscribe error:', err);
        return;
      }
      // Unmounted (or re-run) while the token was being fetched — tear the
      // channel down instead of leaking it.
      if (cancelled) {
        supabase.removeChannel(channel);
      }
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchInitial, subscribe]);

  return {
    loads,
    isLoading,
    refetch: fetchInitial,
  };
}
