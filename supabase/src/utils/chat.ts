import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Message } from '@/types/chat';
// The base supabase client (anon key) is used for Realtime subscriptions. The
// socket is authorized with the Clerk JWT via authorizeRealtime() before
// subscribing so RLS (`TO authenticated`) lets events through.
// All mutations use the Clerk-authenticated client below.
import { supabase } from '@/integrations/supabase/client';
import { authorizeRealtime } from '@/utils/realtime';
import type { RealtimeChannel } from '@supabase/supabase-js';

const MAX_MESSAGE_LENGTH = 2000;

/**
 * A conversation is either backed by a `requests` row (shipper → trip) or a
 * `shipment_requests` row (trucker → shipment). The column used to associate
 * messages changes accordingly.
 */
export type ChatKind = 'request' | 'shipment_request';

const chatColumn = (kind: ChatKind): 'request_id' | 'shipment_request_id' =>
  kind === 'shipment_request' ? 'shipment_request_id' : 'request_id';

/**
 * Sanitize message content — strip HTML tags and trim whitespace.
 * Prevents XSS if messages are ever rendered as HTML.
 */
function sanitizeContent(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

/**
 * Send a new message in a chat conversation.
 */
export const sendMessage = async (payload: {
  recipientId: string;
  content: string;
  requestId?: string;
  getToken: () => Promise<string | null>;
  userId: string;
  kind?: ChatKind;
}): Promise<Message> => {
  const { recipientId, content, requestId, getToken, userId, kind = 'request' } = payload;

  if (!recipientId || !content) {
    throw new Error('Recipient ID and message content are required');
  }

  const sanitized = sanitizeContent(content);
  if (!sanitized) {
    throw new Error('Message content is empty after sanitization');
  }

  try {
    const supabaseToken = await getToken();
    if (!supabaseToken) {
      throw new Error('Failed to get Supabase token');
    }

    const supabaseClient = createClerkSupabaseClient(supabaseToken);

    const { data, error } = await supabaseClient
      .from('messages')
      .insert({
        sender_id: userId,
        recipient_id: recipientId,
        content: sanitized,
        [chatColumn(kind)]: requestId,
        is_read: false,
      })
      .select('id, sender_id, recipient_id, content, created_at, is_read, request_id, shipment_request_id')
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to send message');
    }

    return data as Message;
  } catch (err: unknown) {
    console.error('[sendMessage] Error:', err);
    throw err;
  }
};

/**
 * Fetch all messages for a specific request using an authenticated client.
 */
export const fetchMessages = async (
  requestId: string,
  getToken: () => Promise<string | null>,
  kind: ChatKind = 'request'
): Promise<Message[]> => {
  try {
    const token = await getToken();
    if (!token) throw new Error('No token');
    const supabaseClient = createClerkSupabaseClient(token);

    const { data, error } = await supabaseClient
      .from('messages')
      .select('id, sender_id, recipient_id, content, created_at, is_read, request_id, shipment_request_id')
      .eq(chatColumn(kind), requestId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error('Failed to fetch messages');
    }

    return (data || []) as Message[];
  } catch (err: unknown) {
    console.error('[fetchMessages] Error:', err);
    throw err;
  }
};

/**
 * Mark messages as read for a specific user in a chat using an authenticated client.
 */
export const markMessagesAsRead = async (
  requestId: string,
  userId: string,
  getToken: () => Promise<string | null>,
  kind: ChatKind = 'request'
): Promise<void> => {
  try {
    const token = await getToken();
    if (!token) return;
    const supabaseClient = createClerkSupabaseClient(token);

    await supabaseClient
      .from('messages')
      .update({ is_read: true })
      .eq(chatColumn(kind), requestId)
      .eq('recipient_id', userId)
      .eq('is_read', false);
  } catch (err: unknown) {
    console.error('[markMessagesAsRead] Error:', err);
  }
};

/**
 * Subscribe to real-time message updates.
 *
 * Authorizes the shared realtime socket with the Clerk JWT first — RLS on
 * `messages` is `TO authenticated`, and the anon role is denied, so events
 * would never arrive otherwise.
 */
export const subscribeToMessages = async (
  requestId: string,
  onNewMessage: (message: Message) => void,
  kind: ChatKind = 'request',
  getToken?: (options?: { template?: string }) => Promise<string | null>,
): Promise<RealtimeChannel> => {
  const channelName = `chat:${requestId}`;

  // Remove any existing channel with this name to prevent the
  // "cannot add postgres_changes callbacks after subscribe" error
  const existingChannels = supabase.getChannels();
  for (const ch of existingChannels) {
    if (ch.topic === channelName) {
      await supabase.removeChannel(ch);
    }
  }

  if (getToken) await authorizeRealtime(getToken);

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `${chatColumn(kind)}=eq.${requestId}`,
      },
      (payload) => {
        onNewMessage(payload.new as Message);
      }
    )
    .subscribe();

  return channel;
};