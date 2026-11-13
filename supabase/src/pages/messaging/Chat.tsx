
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { getParticipantContact } from '@/lib/userContact';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { Message } from '@/types/chat';
import { fetchMessages, sendMessage, subscribeToMessages, markMessagesAsRead, sanitizeContent, ChatKind } from '@/utils/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Loader2, User as UserIcon, WifiOff, Phone, Mic } from 'lucide-react';
import { useT } from "@/i18n/useT";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/utils/analytics';
import { MessageStatus } from '@/components/MessageStatus';

type MessageStatus = 'sending' | 'sent' | 'failed';

interface OptimisticMessage extends Message {
  status: MessageStatus;
  tempId?: string;
}

const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const Chat = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();
  const { isOnline } = useNetworkStatus();
  // App-wide presence (Supabase Presence) — tells us whether the chat partner
  // is online. `isOnline` above is only this device's own connectivity.
  const onlineUserIds = useOnlineUsers();

  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  // ids of every message that existed at initial-load completion.
  // Bubbles whose stableId is not in this set (post-load arrivals) animate their entrance.
  const historyIdsRef = useRef<Set<string> | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const t = useT();
  const { supported: speechSupported, isListening, start: startSpeech } = useSpeechToText();
  const [recipient, setRecipient] = useState<{ id: string; full_name: string; phone?: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatKindRef = useRef<ChatKind>('request');

  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const getClientRef = useRef(getAuthenticatedClient);
  getClientRef.current = getAuthenticatedClient;

  useEffect(() => {
    if (!requestId || !userProfile) return;

    let channel: ReturnType<typeof supabase.channel> | undefined;
    let cancelled = false;

    const initChat = async () => {
      try {
        const supabaseClient = await getClientRef.current();

        const [reqRes, sReqRes] = await Promise.all([
          supabaseClient.from('requests').select('*, trip:trips(*, trucker:users!trips_trucker_id_fkey(id, full_name, rating, total_trips, is_verified, verification_status, avatar_url, user_type)), shipper:users!requests_shipper_id_fkey(id, full_name, rating, total_trips, is_verified, verification_status, avatar_url, user_type), receiver:users!requests_receiver_id_fkey(id, full_name, rating, total_trips, is_verified, verification_status, avatar_url, user_type)').eq('id', requestId).maybeSingle(),
          supabaseClient.from('shipment_requests').select('*, shipment:shipments(*, shipper:users!shipments_shipper_id_fkey(id, full_name, rating, total_trips, is_verified, verification_status, avatar_url, user_type)), trucker:users!shipment_requests_trucker_id_fkey(id, full_name, rating, total_trips, is_verified, verification_status, avatar_url, user_type), shipper:users!shipment_requests_shipper_id_fkey(id, full_name, rating, total_trips, is_verified, verification_status, avatar_url, user_type)').eq('id', requestId).maybeSingle()
        ]);

        if (cancelled) return;

        let otherUser = null;
        if (reqRes.data) {
          chatKindRef.current = 'request';
          const r = reqRes.data;
          otherUser = userProfile.id === r.shipper?.id ? r.receiver ?? r.trip?.trucker : r.shipper;
        } else if (sReqRes.data) {
          chatKindRef.current = 'shipment_request';
          const sr = sReqRes.data;
          otherUser = userProfile.id === sr.trucker?.id ? sr.shipper ?? sr.shipment?.shipper : sr.trucker;
        }

        if (!otherUser) throw new Error('Chat partner not found');
        setRecipient(otherUser);

        // SEC-01: the partner's phone is only revealed once the booking
        // request / offer is accepted (resolved via the participant-contact RPC).
        const requestStatus = reqRes.data?.status ?? sReqRes.data?.status;
        if (requestStatus === 'accepted' && otherUser?.id) {
          const phone = await getParticipantContact(supabaseClient, otherUser.id);
          if (phone) {
            setRecipient((prev) => (prev ? { ...prev, phone } : prev));
          }
        }

        const initialMessages = await fetchMessages(requestId, getTokenRef.current, chatKindRef.current);
        if (cancelled) return;
        setMessages(initialMessages.map(m => ({ ...m, status: 'sent' as MessageStatus })));
        historyIdsRef.current = new Set(initialMessages.map(m => m.id));
        setHistoryLoaded(true);
        markMessagesAsRead(requestId, userProfile.id, getTokenRef.current, chatKindRef.current);

        // Stale-channel cleanup happens inside subscribeToMessages().
        if (cancelled) return;

        channel = await subscribeToMessages(
          requestId,
          (msg) => {
            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev;
              const tempIdx = prev.findIndex(m => m.status === 'sending' && m.content === msg.content && m.sender_id === msg.sender_id);
              if (tempIdx >= 0) {
                const next = prev.slice();
                const existing = next[tempIdx];
                if (existing?.tempId) {
                  next[tempIdx] = { ...msg, status: 'sent', tempId: existing.tempId };
                }
                return next;
              }
              return [...prev, { ...msg, status: 'sent' as MessageStatus }];
            });
            if (msg.recipient_id === userProfile.id) markMessagesAsRead(requestId, userProfile.id, getTokenRef.current, chatKindRef.current);
          },
          chatKindRef.current,
          getTokenRef.current,
          // Read receipts: when the recipient marks the thread as read, the
          // UPDATE event flips is_read on our sent bubbles (blue ticks).
          (updated) => {
            setMessages(prev => prev.map(m => (m.id === updated.id ? { ...m, is_read: updated.is_read } : m)));
          },
        );

        if (cancelled) {
          if (channel) supabase.removeChannel(channel);
          return;
        }

        setLoading(false);
      } catch (err: unknown) {
        if (!cancelled) {
          showError(err instanceof Error ? err.message : 'Failed to load chat');
          navigate(-1);
        }
      }
    };

    initChat();
    return () => {
      cancelled = true;
      if (channel) {
        void (async () => {
          try {
            await supabase.removeChannel(channel);
          } catch (err) {
            if (import.meta.env.DEV) console.warn("[channel cleanup]", err);
          }
        })();
      }
    };
  }, [requestId, userProfile, navigate]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendOptimistic = useCallback(async (content: string, tempId: string) => {
    if (!recipient || !requestId) return;
    try {
      const sentMsg = await sendMessage({ recipientId: recipient.id, content, requestId, kind: chatKindRef.current, getToken: getTokenRef.current, userId: userProfile!.id });
      setMessages(prev => prev.map(m => (m.tempId === tempId ? { ...sentMsg, status: 'sent' as MessageStatus, tempId } : m)));
      trackEvent('message_sent', {
        request_id: requestId,
        sender_role: userProfile?.user_type,
      });
    } catch (error) {
      import('@/utils/posthog').then(({ posthog }) => posthog.captureException(error, { flow: 'send_message' })).catch(() => {});
      setMessages(prev => prev.map(m => (m.tempId === tempId ? { ...m, status: 'failed' as MessageStatus } : m)));
      showError('Failed to send message');
    }
  }, [recipient, requestId, userProfile]);

  /** Send a preset quick reply — same pipeline as typed messages. */
  const sendText = useCallback(async (raw: string) => {
    if (!recipient || !requestId || !raw.trim() || sending) return;
    if (!isOnline) {
      showError('You are offline. Cannot send messages.');
      return;
    }

    // Apply the same sanitization the DB write uses, so the optimistic bubble
    // is byte-identical to the realtime/insert payload (dedupe relies on it).
    const sanitized = sanitizeContent(raw);
    if (!sanitized) {
      showError('Message is empty');
      return;
    }

    const tempId = generateTempId();
    const optimistic: OptimisticMessage = {
      id: tempId,
      tempId,
      sender_id: userProfile!.id,
      recipient_id: recipient.id,
      content: sanitized,
      created_at: new Date().toISOString(),
      is_read: false,
      request_id: chatKindRef.current === 'request' ? requestId : undefined,
      shipment_request_id: chatKindRef.current === 'shipment_request' ? requestId : undefined,
      status: 'sending',
    };

    setMessages(prev => [...prev, optimistic]);
    setNewMessage('');
    setSending(true);
    try {
      await sendOptimistic(sanitized, tempId);
    } finally {
      setSending(false);
    }
  }, [recipient, requestId, sending, isOnline, userProfile, sendOptimistic]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    void sendText(newMessage);
  }, [sendText, newMessage]);

  const handleRetry = useCallback((msg: OptimisticMessage) => {
    if (!recipient || !requestId || msg.status !== 'failed') return;
    setMessages(prev => prev.map(m => (m.tempId === msg.tempId ? { ...m, status: 'sending' as MessageStatus } : m)));
    setSending(true);
    void sendOptimistic(msg.content, msg.tempId!).finally(() => setSending(false));
  }, [recipient, requestId, sendOptimistic]);

  // Real presence for the partner — not this device's connectivity.
  const partnerOnline = recipient ? onlineUserIds.has(recipient.id) : false;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60dvh]">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading conversation...</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 max-w-3xl h-[calc(100dvh-8rem)] sm:h-[calc(100dvh-10rem)] flex flex-col animate-fade-in">
      <Card className="border-orange-100 dark:border-orange-800 shadow-lg flex-grow flex flex-col overflow-hidden">
        {/* Header */}
        <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 py-3 sm:py-4 px-4 sm:px-6 flex flex-row items-center gap-4 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0" aria-label="Back to messages">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm">
            <UserIcon className="h-4 w-4 sm:h-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base sm:text-lg font-bold truncate">{recipient?.full_name}</CardTitle>
            <div className="flex items-center gap-1.5">
              {partnerOnline ? (
                <>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Offline</p>
                </>
              )}
            </div>
          </div>
          {recipient?.phone && (
            <a href={`tel:${recipient.phone}`}>
              <Button variant="outline" size="sm" className="border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950">
                <Phone className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Call</span>
              </Button>
            </a>
          )}
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-grow overflow-hidden p-0 flex flex-col bg-gray-50/50 dark:bg-gray-950/50">
          <ScrollArea className="flex-grow px-4 sm:px-6 py-4 sm:py-6">
            <div className="space-y-3">
              {messages.map((msg) => {
                const isMe = msg.sender_id === userProfile?.id;
                const stableId = msg.tempId ?? msg.id;
                const arrive = historyLoaded && !(historyIdsRef.current?.has(stableId) ?? false);
                return (
                  <div
                    key={stableId}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}${arrive ? ' animate-msg-arrive' : ''}`}
                  >
                    <div className={`max-w-[85%] sm:max-w-[75%]`}>
                      <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words ${
                        isMe
                          ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-sm'
                          : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                      }`}>
                        {msg.content}
                      </div>
                      <div className={`flex items-center gap-1.5 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {isMe && <MessageStatus status={msg.status} isRead={msg.is_read} />}
                        {isMe && msg.status === 'failed' && (
                          <button
                            type="button"
                            onClick={() => handleRetry(msg)}
                            className="text-[10px] font-medium text-destructive hover:underline focus:outline-none focus:ring-1 focus:ring-destructive rounded"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Offline Banner */}
          {!isOnline && (
            <div
              role="status"
              className="offline-banner-enter px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-100 dark:border-yellow-800 text-xs text-yellow-700 dark:text-yellow-300 text-center"
            >
              <WifiOff className="h-3 w-3 inline mr-1.5" /> You are offline. Reconnect to send and receive messages.
            </div>
          )}

          {/* Quick replies — one tap, no typing */}
          {isOnline && (
            <div className="flex items-center gap-2 overflow-x-auto px-3 sm:px-4 pt-3 pb-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[t('chat.q1'), t('chat.q2'), t('chat.q3')].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void sendText(q)}
                  disabled={sending}
                  className="press shrink-0 min-h-11 rounded-full border border-orange-200 dark:border-orange-800 bg-orange-50/70 dark:bg-orange-950/40 px-3.5 text-xs font-semibold text-orange-700 dark:text-orange-300 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2">
            {speechSupported && (
              <Button
                type="button"
                size="icon"
                onClick={() => startSpeech((transcript) => setNewMessage(transcript))}
                aria-label={t('voice.mic')}
                className={`h-12 w-12 shrink-0 ${isListening ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                {isListening ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
              </Button>
            )}
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              disabled={sending || !isOnline}
              className="min-w-0 h-12 border-gray-200 dark:border-gray-700 focus-visible:ring-orange-500"
            />
            <Button
              type="submit"
              disabled={sending || !newMessage.trim() || !isOnline}
              size="icon"
              aria-label="Send message"
              className="h-12 w-12 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-sm shrink-0"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Chat;

