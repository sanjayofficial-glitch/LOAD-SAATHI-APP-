import { useEffect, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { createClerkSupabaseClient } from '@/lib/supabase';
import { authorizeRealtime } from '@/utils/realtime';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Set of Clerk user ids currently using the app (table-backed presence).
 *
 * Reads `public.user_presence` — maintained by `startPresence` heartbeats —
 * and keeps the snapshot fresh via realtime postgres_changes on that table.
 * A row counts as online when its `last_seen` is younger than 90s.
 */

const ONLINE_WINDOW_MS = 90000;

type TokenGetter = () => Promise<string | null>;

async function fetchOnlineUserIds(getToken?: TokenGetter): Promise<Set<string>> {
  try {
    const token = await getToken?.();
    const client = token ? createClerkSupabaseClient(token) : supabase;

    const { data, error } = await client.from('user_presence').select('user_id, last_seen');
    if (error) return new Set<string>();

    const now = Date.now();
    const ids = new Set<string>();
    for (const row of data ?? []) {
      if (now - new Date(row.last_seen).getTime() < ONLINE_WINDOW_MS) {
        ids.add(row.user_id);
      }
    }
    return ids;
  } catch {
    // Silent — presence is best-effort.
    return new Set<string>();
  }
}

function subscribeToOnlineUsers(
  cb: (ids: Set<string>) => void,
  getToken?: TokenGetter,
): () => void {
  let disposed = false;
  let channel: RealtimeChannel | null = null;

  const refresh = async (): Promise<void> => {
    if (disposed) return;
    const ids = await fetchOnlineUserIds(getToken);
    if (!disposed) cb(ids);
  };

  void (async () => {
    // Authorize the shared realtime socket first — RLS on `user_presence` is
    // `TO authenticated`, so anon subscriptions receive no events.
    if (getToken) await authorizeRealtime(getToken);
    if (disposed) return;

    // Emit an initial snapshot before subscribing.
    await refresh();

    if (disposed) return;
    const ch = supabase
      .channel('user-presence-table-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_presence' },
        () => {
          void refresh();
        },
      )
      .subscribe();
    channel = ch;
  })();

  return () => {
    disposed = true;
    if (channel) {
      void channel.unsubscribe();
      channel = null;
    }
  };
}

/**
 * The set of Clerk user ids currently online, kept live for the lifetime of
 * the calling component.
 */
export function useOnlineUsers(): Set<string> {
  const { getSupabaseToken } = useAuth();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(() => new Set());

  useEffect(
    () => subscribeToOnlineUsers(setOnlineUserIds, getSupabaseToken),
    [getSupabaseToken],
  );

  return onlineUserIds;
}
