import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { authorizeRealtime } from '@/utils/realtime';
import { useAuth } from '@/contexts/AuthContext';

/**
 * useRealtimeInvalidate
 *
 * Subscribes to `postgres_changes` on the given tables and invalidates the
 * given React Query keys whenever anything changes. This turns any polling
 * dashboard into a push-driven one without hand-rolling merge logic for every
 * table (which is what makes it drift).
 *
 * Realtime RLS is `TO authenticated`, so the shared socket must be authorized
 * with the Clerk JWT before subscribing (see utils/realtime).
 */
export function useRealtimeInvalidate(
  channelName: string,
  tables: string[],
  queryKeys: readonly (readonly string[])[],
): void {
  const queryClient = useQueryClient();
  const { getSupabaseToken } = useAuth();

  const tablesKey = tables.join(',');
  const keysKey = JSON.stringify(queryKeys);

  useEffect(() => {
    if (!tablesKey) return;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      try {
        await authorizeRealtime(getSupabaseToken);
      } catch {
        /* authorizeRealtime already swallows/logs; keep going */
      }
      if (cancelled) return;

      const tableList = tablesKey.split(',');
      const keyList = JSON.parse(keysKey) as string[][];

      let ch = supabase.channel(channelName);
      for (const table of tableList) {
        ch = ch.on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => {
            for (const key of keyList) {
              void queryClient.invalidateQueries({ queryKey: key });
            }
          },
        );
      }
      channel = ch.subscribe();
    };

    void setup();

    return () => {
      cancelled = true;
      if (channel) {
        void (async () => {
          try {
            await supabase.removeChannel(channel);
          } catch (err) {
            if (import.meta.env.DEV) console.warn('[useRealtimeInvalidate] cleanup', err);
          }
        })();
      }
    };
  }, [channelName, tablesKey, keysKey, queryClient, getSupabaseToken]);
}
