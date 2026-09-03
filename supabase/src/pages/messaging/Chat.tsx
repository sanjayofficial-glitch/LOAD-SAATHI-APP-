
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Message } from '@/types/chat';
import { fetchMessages, sendMessage, subscribeToMessages, markMessagesAsRead, ChatKind } from '@/utils/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Loader2, User as UserIcon, WifiOff, Phone } from 'lucide-react';
import { showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { posthog } from '@/utils/posthog';
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

  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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
          supabaseClient.from('requests').select('*, trip:trips(*, trucker:users!trips_trucker_id_fkey(*)), shipper:users!requests_shipper_id_fkey(*), receiver:users!requests_receiver_id_fkey(*)').eq('id', requestId).maybeSingle(),
          supabaseClient.from('shipment_requests').select('*, shipment:shipments(*, shipper:users!shipments_shipper_id_fkey(*)), trucker:users!shipment_requests_trucker_id_fkey(*), shipper:users!shipment_requests_shipper_id_fkey(*)').eq('id', requestId).maybeSingle()
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

        const initialMessages = await fetchMessages(requestId, getTokenRef.current, chatKindRef.current);
        if (cancelled) return;
        setMessages(initialMessages.map(m => ({ ...m, status: 'sent' as MessageStatus })));
        markMessagesAsRead(requestId, userProfile.id, getTokenRef.current, chatKindRef.current);

        const channelName = `chat:${requestId}`;
        const existingChannels = supabase.getChannels();
        for (const ch of existingChannels) {
          if (ch.topic === channelName) {
            await supabase.removeChannel(ch);
          }
        }

        if (cancelled) return;

        channel = await subscribeToMessages(requestId, (msg) => {
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
        }, chatKindRef.current, getTokenRef.current);

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
      posthog.capture('message_sent', {
        request_id: requestId,
        sender_role: userProfile?.user_type,
      });
    } catch (error) {
      posthog.captureException(error, { flow: 'send_message' });
      setMessages(prev => prev.map(m => (m.tempId === tempId ? { ...m, status: 'failed' as MessageStatus } : m)));
      showError('Failed to send message');
    }
  }, [recipient, requestId, getToken, userProfile]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !requestId || !newMessage.trim() || sending) return;
    if (!isOnline) {
      showError('You are offline. Cannot send messages.');
      return;
    }

    const tempId = generateTempId();
    const optimistic: OptimisticMessage = {
      id: tempId,
      tempId,
      sender_id: userProfile!.id,
      recipient_id: recipient.id,
      content: newMessage,
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
      await sendOptimistic(newMessage, tempId);
    } finally {
      setSending(false);
    }
  }, [recipient, requestId, newMessage, sending, isOnline, userProfile, sendOptimistic]);

  const handleRetry = useCallback((msg: OptimisticMessage) => {
    if (!recipient || !requestId || msg.status !== 'failed') return;
    setMessages(prev => prev.map(m => (m.tempId === msg.tempId ? { ...m, status: 'sending' as MessageStatus } : m)));
    setSending(true);
    void sendOptimistic(msg.content, msg.tempId!).finally(() => setSending(false));
  }, [recipient, requestId, sendOptimistic]);

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
              {isOnline ? (
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
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
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
                        {isMe && <MessageStatus status={msg.status} />}
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
            <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-100 dark:border-yellow-800 text-xs text-yellow-700 dark:text-yellow-300 text-center">
              <WifiOff className="h-3 w-3 inline mr-1.5" /> You are offline. Messages will not send until reconnected.
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              disabled={sending || !isOnline}
              className="min-w-0 border-gray-200 dark:border-gray-700 focus-visible:ring-orange-500"
            />
            <Button
              type="submit"
              disabled={sending || !newMessage.trim() || !isOnline}
              size="icon"
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-sm shrink-0"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Chat;

