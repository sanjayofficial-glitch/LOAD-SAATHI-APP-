import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Returns the target user's phone number only when the current user has a
 * legitimate business link with them (accepted request / own transaction /
 * admin), or null otherwise.
 *
 * Backs the SEC-01 "phone hidden until connected" policy: the `phone` column
 * is revoked from direct reads on the `users` table, so this RPC is the only
 * way a non-admin can see another user's contact details.
 */
export async function getParticipantContact(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_participant_contact', {
    p_target_id: userId,
  });
  if (error || typeof data !== 'string' || !data) return null;
  return data;
}
