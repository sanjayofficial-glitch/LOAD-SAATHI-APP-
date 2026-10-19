import { useEffect, useState } from 'react';
import { getOnlineUserIds, subscribeToOnlineUsers } from '@/utils/presence';

/**
 * Set of Clerk user ids currently using the app (Supabase Presence).
 *
 * Populated by `startPresence`, which is wired once in `Layout` for every
 * signed-in user — so the set is app-wide, not scoped to the current page.
 */
export function useOnlineUsers(): Set<string> {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(() => getOnlineUserIds());

  useEffect(() => subscribeToOnlineUsers(setOnlineUserIds), []);

  return onlineUserIds;
}
