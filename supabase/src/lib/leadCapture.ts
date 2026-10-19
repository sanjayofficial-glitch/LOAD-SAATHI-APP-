import { supabase as supabaseAnon } from '@/integrations/supabase/client';

interface LeadInsertInput {
  phone: string;
  name: string;
  source: string;
  page_path: string;
  user_id: string;
  message: string;
  /**
   * Optional email. When present, the leads on-insert trigger (migration
   * 20261019140001) fires the instant quote email through /api/lead-quote.
   * Omit for WhatsApp-first captures with no email field.
   */
  email?: string;
}

/**
 * Best-effort insert into the public.leads table.
 *
 * The anon key has INSERT-only access (see the migration's RLS policy), so
 * anonymous users can submit leads but cannot read them. This function is
 * intentionally fire-and-forget: failures are swallowed so the WhatsApp
 * navigation (or form submit) always proceeds.
 */
export async function insertLead(input: LeadInsertInput): Promise<void> {
  try {
    const { error } = await supabaseAnon.from('leads').insert({
      phone: input.phone,
      name: input.name,
      source: input.source,
      page_path: input.page_path,
      user_id: input.user_id,
      message: input.message,
      // Only sent when captured — quoting an absent field would still insert
      // an empty email and skip the trigger, but staying explicit reads better.
      ...(input.email && input.email.trim() ? { email: input.email.trim() } : {}),
    });

    if (error) {
      console.warn('[leadCapture] insert failed:', error.message);
    }
  } catch (err) {
    console.warn('[leadCapture] insert exception:', (err as Error).message);
  }
}
