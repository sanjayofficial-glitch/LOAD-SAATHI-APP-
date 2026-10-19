import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { authorizeRealtime } from '@/utils/realtime';

/**
 * App-wide presence ("is user X using the app right now?").
 *
 * Why this exists: the chat header used to render its Online/Offline dot from
 * `useNetworkStatus()`, which is this device's `navigator.onLine` — it says
 * nothing about the chat partner. Supabase Presence lets every signed-in
 * client join one shared channel and publish its user id, so any page can
 * answer that question for real.
 *
 * Presence state lives in memory on the realtime server only. Entries are
 * removed automatically when a client disconnects (tab closed, network lost),
 * so there is nothing to clean up in the database.
 */

export const PRESENCE_CHANNEL_NAME = 'app-presence';
const PRESENCE_CHANNEL_TOPIC = `realtime:${PRESENCE_CHANNEL_NAME}`;

type TokenGetter = (options?: { template?: string }) => Promise<string | null>;
type Listener = (onlineUserIds: Set<string>) => void;

let channel: RealtimeChannel | null = null;
let activeUserId: string | null = null;
let generation = 0;
let onlineUserIds = new Set<string>();
const listeners = new Set<Listener>();

function collectOnlineUserIds(ch: RealtimeChannel): Set<string> {
  const ids = new Set<string>();
  const state = ch.presenceState<{ user_id?: string }>();
  for (const metas of Object.values(state)) {
    for (const meta of metas ?? []) {
      if (meta.user_id) ids.add(meta.user_id);
    }
  }
  return ids;
}

function emit(): void {
  const snapshot = new Set(onlineUserIds);
  for (const listener of listeners) listener(snapshot);
}

/** Current snapshot of online user ids (Clerk user ids). */
export function getOnlineUserIds(): Set<string> {
  return new Set(onlineUserIds);
}

/** Subscribe to online-user snapshot changes. Returns an unsubscribe fn. */
export function subscribeToOnlineUsers(listener: Listener): () => void {
  listeners.add(listener);
  listener(new Set(onlineUserIds));
  return () => {
    listeners.delete(listener);
  };
}

async function removePresenceChannel(): Promise<void> {
  const stale = channel;
  channel = null;
  if (stale) {
    try {
      await supabase.removeChannel(stale);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[presence] failed to remove channel:', err);
    }
  }
}

/**
 * Start tracking the signed-in user's presence. Idempotent for the same user;
 * call `stopPresence()` when the user signs out (or the app shell unmounts).
 */
export async function startPresence(userId: string, getToken?: TokenGetter): Promise<void> {
  if (activeUserId === userId && channel) return;

  generation += 1;
  const gen = generation;
  activeUserId = userId;
  await removePresenceChannel();
  if (gen !== generation) return; // superseded by a newer start/stop

  try {
    if (getToken) await authorizeRealtime(getToken);
    if (gen !== generation) return;

    // Defensive: drop any leftover channel with the same topic so listeners
    // are never added to an already-subscribed channel (`on()` throws after
    // subscribe in realtime-js).
    for (const ch of supabase.getChannels()) {
      if (ch.topic === PRESENCE_CHANNEL_TOPIC) {
        await supabase.removeChannel(ch);
      }
    }

    const ch = supabase.channel(PRESENCE_CHANNEL_NAME, {
      config: { presence: { key: userId } },
    });

    // Must be registered before subscribe() — adding presence listeners after
    // subscribe throws in realtime-js.
    ch.on('presence', { event: 'sync' }, () => {
      onlineUserIds = collectOnlineUserIds(ch);
      emit();
    });

    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void ch.track({ user_id: userId }).catch((err) => {
          if (import.meta.env.DEV) console.warn('[presence] track failed:', err);
        });
      }
    });

    if (gen !== generation) {
      await supabase.removeChannel(ch);
      return;
    }
    channel = ch;
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[presence] failed to start:', err);
  }
}

/** Stop tracking presence and clear the online snapshot. */
export async function stopPresence(): Promise<void> {
  generation += 1;
  activeUserId = null;
  await removePresenceChannel();
  onlineUserIds = new Set();
  emit();
}
