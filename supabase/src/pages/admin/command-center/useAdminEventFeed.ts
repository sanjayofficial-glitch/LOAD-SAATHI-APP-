import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { authorizeRealtime } from '@/utils/realtime';
import { useAuth } from '@/contexts/AuthContext';

export type FeedEventType = 'trip' | 'load' | 'request' | 'lead' | 'user';

export interface FeedEvent {
  id: string;
  type: FeedEventType;
  message: string;
  at: number;
}

const MAX_EVENTS = 60;

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function buildMessage(type: FeedEventType, row: Record<string, unknown>): string {
  const origin = asString(row.origin_city);
  const dest = asString(row.destination_city) ?? asString(row.dest_city);

  switch (type) {
    case 'trip':
      return origin && dest ? `New trip posted: ${origin} → ${dest}` : 'New trip posted';
    case 'load':
      return origin && dest ? `New load posted: ${origin} → ${dest}` : 'New load posted';
    case 'request':
      return 'New booking request received';
    case 'lead':
      return asString(row.name) ? `New lead: ${asString(row.name)}` : 'New lead captured';
    case 'user': {
      const name = asString(row.full_name) ?? 'New user';
      const userType = asString(row.user_type);
      return userType ? `${name} signed up as ${userType}` : `${name} signed up`;
    }
    default:
      return 'New activity';
  }
}

const FEED_TABLES: Array<{ table: string; type: FeedEventType }> = [
  { table: 'trips', type: 'trip' },
  { table: 'shipments', type: 'load' },
  { table: 'requests', type: 'request' },
  { table: 'leads', type: 'lead' },
  { table: 'users', type: 'user' },
];

/**
 * useAdminEventFeed — appends a human-readable event whenever a new row lands
 * in the operational tables. This is what makes the board feel "live" instead
 * of a number that silently changes every 30 seconds.
 */
export function useAdminEventFeed(enabled: boolean): FeedEvent[] {
  const { getSupabaseToken } = useAuth();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const push = (type: FeedEventType, row: Record<string, unknown>) => {
      counter.current += 1;
      const event: FeedEvent = {
        id: `${Date.now()}-${counter.current}`,
        type,
        message: buildMessage(type, row),
        at: Date.now(),
      };
      setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));
    };

    const setup = async () => {
      try {
        await authorizeRealtime(getSupabaseToken);
      } catch {
        /* authorizeRealtime logs internally */
      }
      if (cancelled) return;

      let ch = supabase.channel('admin-command-feed');
      for (const { table, type } of FEED_TABLES) {
        ch = ch.on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table },
          (payload) => push(type, (payload.new ?? {}) as Record<string, unknown>),
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
            if (import.meta.env.DEV) console.warn('[useAdminEventFeed] cleanup', err);
          }
        })();
      }
    };
  }, [enabled, getSupabaseToken]);

  return events;
}
