import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { authorizeRealtime } from '@/utils/realtime';
import { useAuth } from '@/contexts/AuthContext';
import type { TruckLocation } from '@/components/maps/TruckMarker';

/**
 * useLiveDriverLocations - Subscribe to real-time driver positions.
 * 
 * Flow:
 * 1. Fetch initial positions (last 5 min) via Clerk-authenticated query
 * 2. Subscribe to postgres_changes on driver_locations (INSERT/UPDATE) via anon client
 * 3. Return TruckLocation[] for map consumption
 * 4. Auto-unsubscribe on unmount
 */
const FIVE_MINUTES_MS = 5 * 60 * 1000;

export function useLiveDriverLocations() {
  const { getSupabaseToken } = useAuth();
  const [locations, setLocations] = useState<Map<string, TruckLocation>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial positions with Clerk-authenticated client
  const fetchInitial = useCallback(async () => {
    try {
      const token = await getSupabaseToken();
      const client = token ? createClerkSupabaseClient(token) : supabase;

      const fiveMinAgo = new Date(Date.now() - FIVE_MINUTES_MS).toISOString();
      const { data } = await client
        .from('driver_locations')
        .select('driver_id, user_type, lat, lng, heading, speed, trip_id, origin_city, destination_city, vehicle_type, available_capacity_tonnes, trip_status, last_seen_at, updated_at')
        .gte('last_seen_at', fiveMinAgo)
        .order('last_seen_at', { ascending: false });

      if (!data) return;

      // Fetch driver names
      const driverIds = [...new Set(data.map((d) => d.driver_id))];
      if (driverIds.length === 0) { setLocations(new Map()); setIsLoading(false); return; }
      const { data: users } = await client
        .from('users')
        .select('id, full_name')
        .in('id', driverIds);

      const nameMap = new Map<string, string>();
      users?.forEach((u) => nameMap.set(u.id, u.full_name));

      const map = new Map<string, TruckLocation>();
      for (const row of data) {
        // Deduplicate: keep latest per driver
        if (map.has(row.driver_id)) continue;
        map.set(row.driver_id, {
          driver_id: row.driver_id,
          driver_name: nameMap.get(row.driver_id),
          lat: row.lat,
          lng: row.lng,
          heading: row.heading,
          speed: row.speed,
          trip_id: row.trip_id,
          origin_city: row.origin_city,
          destination_city: row.destination_city,
          vehicle_type: row.vehicle_type,
          available_capacity_tonnes: row.available_capacity_tonnes,
          trip_status: row.trip_status,
          last_seen_at: row.last_seen_at || row.updated_at,
        });
      }
      setLocations(map);
    } catch (err) {
      console.error('[useLiveDriverLocations] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getSupabaseToken]);

  // Subscribe to real-time changes
  const subscribe = useCallback(async () => {
    // The shared realtime socket starts as the `anon` role, which RLS denies
    // on driver_locations (`TO authenticated` only) — verified live against
    // the backend (401 "permission denied for table driver_locations"). Set
    // the Clerk JWT on the realtime connection BEFORE the first subscribe so
    // postgres_changes events actually flow.
    if (getSupabaseToken) await authorizeRealtime(getSupabaseToken);

    const channel = supabase
      .channel('driver-locations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations',
        },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            setLocations((prev) => {
              const next = new Map(prev);
              const key = (payload.old as Record<string, unknown>)?.driver_id as string;
              if (key) next.delete(key);
              return next;
            });
            return;
          }

          const row = payload.new as Record<string, unknown>;
          if (!row?.driver_id || !row?.lat || !row?.lng) return;

          // Fetch name if needed
          let name: string | undefined;
          setLocations((prev) => {
            const existing = prev.get(row.driver_id as string);
            name = existing?.driver_name;
            return prev; // No state change yet
          });

          if (!name) {
            // The anon client is denied reads on `users` too (RLS is
            // `TO authenticated`), so look the name up with the
            // Clerk-authenticated client.
            let fullName: string | undefined;
            if (getSupabaseToken) {
              const token = await getSupabaseToken();
              if (token) {
                const authClient = createClerkSupabaseClient(token);
                const { data: user } = await authClient
                  .from('users')
                  .select('full_name')
                  .eq('id', row.driver_id)
                  .single();
                fullName = user?.full_name;
              }
            }
            name = fullName;
          }

          const loc: TruckLocation = {
            driver_id: row.driver_id as string,
            driver_name: name,
            lat: row.lat as number,
            lng: row.lng as number,
            heading: row.heading as number | null,
            speed: row.speed as number | null,
            trip_id: row.trip_id as string | null,
            origin_city: row.origin_city as string | null,
            destination_city: row.destination_city as string | null,
            vehicle_type: row.vehicle_type as string | null,
            available_capacity_tonnes: row.available_capacity_tonnes as number | null,
            trip_status: row.trip_status as string | null,
            last_seen_at: (row.last_seen_at as string) || (row.updated_at as string),
          };

          setLocations((prev) => {
            const next = new Map(prev);
            next.set(loc.driver_id, loc);
            return next;
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
        console.error('[useLiveDriverLocations] Realtime subscribe error:', err);
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

  const driverLocations = Array.from(locations.values());

  return {
    driverLocations,
    isLoading,
    refetch: fetchInitial,
  };
}
