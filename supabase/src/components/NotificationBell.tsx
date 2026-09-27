
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { Bell, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showSuccess } from '@/utils/toast';
// Base supabase client (anon key) for Realtime subscriptions only.
// Realtime uses RLS policies to filter events per user_id — no auth header needed.
import { supabase as baseSupabase } from '@/integrations/supabase/client';
import { authorizeRealtime } from '@/utils/realtime';

interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const NotificationBell = React.memo(() => {
  const { userProfile, getSupabaseToken } = useAuth();
  const { getAuthenticatedClient } = useSupabase();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userProfile?.id) return;
    
    try {
      const supabaseClient = await getAuthenticatedClient();
      const { data, error } = await supabaseClient
        .from('notifications')
        .select('id, type, message, is_read, created_at, related_trip_id')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('[NotificationBell] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getAuthenticatedClient]);

  useEffect(() => {
    if (!userProfile?.id) return;

    let cancelled = false;
    let channel: ReturnType<typeof baseSupabase.channel> | null = null;

    fetchNotifications();

    void (async () => {
      // Authorize the shared realtime socket with the Clerk JWT — RLS on
      // `notifications` is `TO authenticated`, anon is denied.
      await authorizeRealtime(getSupabaseToken);
      if (cancelled) return;

      channel = baseSupabase
        .channel(`notifications:${userProfile.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userProfile.id}`,
          },
          (payload) => {
            const newNotif = payload.new as Notification;
            setNotifications(prev => [newNotif, ...prev].slice(0, 10));
            setUnreadCount(prev => prev + 1);
            showSuccess(newNotif.message); // Show popup toast
          }
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) {
        void (async () => {
          try {
            await baseSupabase.removeChannel(channel);
          } catch (err) {
            if (import.meta.env.DEV) console.warn('[channel cleanup]', err);
          }
        })();
      }
    };
  }, [userProfile?.id, fetchNotifications, getSupabaseToken]);

  const markAllAsRead = async () => {
    if (unreadCount === 0 || !userProfile?.id) return;
    try {
      const supabaseClient = await getAuthenticatedClient();
      // Takes no arguments. It scopes itself to the caller via
      // auth.jwt() ->> 'sub', so passing p_user_id made PostgREST reject
      // the call and "mark all read" silently did nothing.
      await supabaseClient.rpc('mark_all_notifications_read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (_err) {
      console.error('Failed to mark read');
    }
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && unreadCount > 0 && markAllAsRead()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && <Badge variant="secondary" className="text-[10px]">{unreadCount} New</Badge>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem key={notif.id} className="p-3 cursor-default focus:bg-gray-50 dark:focus:bg-gray-800">
                <div className="flex gap-3">
                  <div className={`mt-0.5 p-1 rounded-full h-fit ${notif.is_read ? 'bg-gray-100 dark:bg-gray-800' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                    {notif.message.includes('Accepted') ? <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" /> : <AlertCircle className="h-3 w-3 text-orange-600 dark:text-orange-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${notif.is_read ? 'text-gray-600 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>{notif.message}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">{new Date(notif.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

export default NotificationBell;