
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ArrowRight, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { showError } from '@/utils/toast';
import { supabase as supabaseAnon } from '@/integrations/supabase/client';
import { authorizeRealtime } from '@/utils/realtime';

interface ChatConversation {
  id: string;
  request_id: string;
  other_user: {
    id: string;
    full_name: string;
    user_type: string;
  };
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

const ChatList = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!userProfile) return;
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');

      const supabase = createClerkSupabaseClient(supabaseToken);

      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          request:requests(
            id,
            shipper:users!requests_shipper_id_fkey(id, full_name, user_type),
            receiver:users!requests_receiver_id_fkey(id, full_name, user_type)
          ),
          shipment_request:shipment_requests(
            id,
            shipper:users!shipment_requests_shipper_id_fkey(id, full_name, user_type),
            trucker:users!shipment_requests_trucker_id_fkey(id, full_name, user_type)
          )
        `)
        .or(`sender_id.eq.${userProfile.id},recipient_id.eq.${userProfile.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const conversationMap = new Map<string, ChatConversation>();

      messages?.forEach(msg => {
        const conversationId = msg.request_id ?? msg.shipment_request_id;
        if (!conversationId) return;

        const existing = conversationMap.get(conversationId);
        const isFromMe = msg.sender_id === userProfile.id;
        const otherUserId = isFromMe ? msg.recipient_id : msg.sender_id;

        const request = msg.request as { shipper?: { id: string; full_name: string; user_type: string }; receiver?: { id: string; full_name: string; user_type: string } } | null;
        const shipmentRequest = msg.shipment_request as { shipper?: { id: string; full_name: string; user_type: string }; trucker?: { id: string; full_name: string; user_type: string } } | null;

        let otherUser: { id: string; full_name: string; user_type: string } | undefined;
        if (request?.shipper) {
          otherUser = userProfile.id === request.shipper.id ? request.receiver : request.shipper;
        } else if (shipmentRequest) {
          otherUser = userProfile.id === shipmentRequest.trucker?.id ? shipmentRequest.shipper : shipmentRequest.trucker;
        }
        if (!otherUser) {
          otherUser = { id: otherUserId, full_name: 'Unknown', user_type: '' };
        }

        if (!existing) {
          conversationMap.set(conversationId, {
            id: conversationId,
            request_id: conversationId,
            other_user: otherUser,
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: !isFromMe && !msg.is_read ? 1 : 0
          });
        } else {
          if (new Date(msg.created_at) > new Date(existing.last_message_time)) {
            existing.last_message = msg.content;
            existing.last_message_time = msg.created_at;
          }
          if (!isFromMe && !msg.is_read) {
            existing.unread_count += 1;
          }
        }
      });

      const conversationsList = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());

      setConversations(conversationsList);
      setFetchError(false);
    } catch (error: unknown) {
      console.error('[ChatList] Error:', error);
      setFetchError(true);
      showError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [getToken, userProfile]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!userProfile?.id) return;

    let cancelled = false;
    let channel: ReturnType<typeof supabaseAnon.channel> | null = null;

    void (async () => {
      // Authorize the shared realtime socket with the Clerk JWT — RLS on
      // `messages` is `TO authenticated`, anon is denied.
      await authorizeRealtime(getToken);
      if (cancelled) return;

      channel = supabaseAnon
        .channel('chatlist-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
        }, () => {
          fetchConversations();
        })
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabaseAnon.removeChannel(channel);
    };
  }, [userProfile?.id, fetchConversations, getToken]);

  const getRequestTitle = (conv: ChatConversation) => {
    return `${conv.other_user.full_name}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-orange-100 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <ErrorState
          title="Failed to load messages"
          description="We couldn't fetch your conversations right now. Check your connection and try again."
          retry={fetchConversations}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-1.5 rounded-lg shadow-sm">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Messages</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400">Your conversations with shippers and truckers</p>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          accent="orange"
          icon={<MessageSquare className="h-8 w-8 sm:h-10 sm:w-10" />}
          title="No conversations yet"
          description="Start a conversation by booking a trip or accepting a request."
          primaryAction={{
            label: 'Go to Dashboard',
            onClick: () => navigate(userProfile?.user_type === 'trucker' ? '/trucker/dashboard' : '/browse-trucks'),
          }}
        />
      ) : (
        <div className="grid gap-3">
          {conversations.map((conv, i) => (
            <Card 
              key={conv.id} 
              className="cursor-pointer hover:shadow-md transition-all duration-200 border-orange-100 dark:border-orange-800 hover:-translate-y-0.5 animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => navigate(`/chat/${conv.request_id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-sm shrink-0">
                      <span className="text-sm font-bold text-white">
                        {conv.other_user.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">
                          {getRequestTitle(conv)}
                        </h3>
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 shrink-0">
                          {new Date(conv.last_message_time).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{conv.last_message}</p>
                    </div>
                  </div>
                  {conv.unread_count > 0 && (
                    <Badge className="bg-orange-600 text-white ml-2 shrink-0">
                      {conv.unread_count}
                    </Badge>
                  )}
                  <ArrowRight className="h-5 w-5 text-gray-300 dark:text-gray-600 ml-2 shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatList;
