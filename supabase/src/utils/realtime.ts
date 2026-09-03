import { supabase } from '@/integrations/supabase/client';

/**
 * Authorize the shared realtime socket with the Clerk Supabase JWT before
 * subscribing. RLS policies on realtime tables (messages, notifications,
 * driver_locations, load_locations, …) are `TO authenticated` — the anon role
 * is denied (live-verified: REST returns 401 "permission denied for table …"),
 * so without this, postgres_changes subscriptions silently receive zero events.
 *
 * MUST run before the first channel.subscribe() on this client (ideally before
 * any other channel joins the socket) so the socket authorizes as
 * `authenticated`.
 */
export async function authorizeRealtime(
  getToken: (options?: { template?: string }) => Promise<string | null>,
): Promise<void> {
  try {
    const token = await getToken({ template: 'supabase' });
    if (token) supabase.realtime.setAuth(token);
  } catch (err) {
    console.warn('[realtime] Failed to authorize realtime connection:', err);
  }
}
