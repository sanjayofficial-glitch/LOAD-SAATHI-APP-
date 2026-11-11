import { supabase } from '@/integrations/supabase/client';
import { createClerkSupabaseClient } from '@/lib/supabase';

/**
 * App-wide presence ("is user X using the app right now?").
 *
 * Why this exists: the chat header used to render its Online/Offline dot from
 * `useNetworkStatus()`, which is this device's `navigator.onLine` — it says
 * nothing about the chat partner. Presence is now table-backed: each signed-in
 * client owns a row in `public.user_presence` (RLS: owner write, authenticated
 * read) and heartbeats it every 30s. `useOnlineUsers` reads that table for the
 * online set, so any page can answer the question for real.
 *
 * Row cleanup happens when the user signs out or the app shell unmounts — the
 * stop function returned by `startPresence` clears the heartbeat and deletes
 * the user's row. Stale rows (e.g. a crashed tab) age out of the online window
 * because `useOnlineUsers` only counts rows younger than 90s.
 */

type TokenGetter = () => Promise<string | null>;

const PRESENCE_HEARTBEAT_MS = 30000;

let activeStop: (() => void) | null = null;

/** Fire-and-forget a Postgrest query, swallowing any error. */
function silent(result: PromiseLike<unknown>): void {
  void result.then(
    () => undefined,
    () => undefined,
  );
}

/**
 * Start tracking the signed-in user's presence. Idempotent: starting again
 * stops any previously started loop first. Returns a stop function.
 */
export async function startPresence(userId: string, getToken?: TokenGetter): Promise<() => void> {
  // Stop any previously started loop (Layout re-runs on user/token changes).
  activeStop?.();
  activeStop = null;

  const token = await getToken?.();
  const client = token ? createClerkSupabaseClient(token) : supabase;

  let stopped = false;

  const upsert = (): void => {
    silent(
      client
        .from('user_presence')
        .upsert({ user_id: userId, last_seen: new Date().toISOString() }),
    );
  };

  upsert();
  const interval = setInterval(upsert, PRESENCE_HEARTBEAT_MS);

  const stop = (): void => {
    if (stopped) return;
    stopped = true;
    clearInterval(interval);
    silent(client.from('user_presence').delete().eq('user_id', userId));
  };

  activeStop = stop;
  return stop;
}

/** Stop any active presence loop (used by the app shell on sign-out/unmount). */
export async function stopPresence(): Promise<void> {
  activeStop?.();
  activeStop = null;
}
