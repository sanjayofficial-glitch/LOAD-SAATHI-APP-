
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import {
  Bell,
  BellRing,
  CheckCircle,
  CheckCheck,
  MessageSquare,
  Package,
  Star,
  Truck,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showSuccess, showError } from '@/utils/toast';
import { enablePush, disablePush, isPushSupported, isPushSubscribed } from '@/utils/push';
// Base supabase client (anon key) for Realtime subscriptions only.
// Realtime uses RLS policies to filter events per user_id — no auth header needed.
import { supabase as baseSupabase } from '@/integrations/supabase/client';
import { authorizeRealtime } from '@/utils/realtime';

interface Notification {
  id: string;
  message: string;
  title?: string | null;
  type?: string | null;
  action_url?: string | null;
  is_read: boolean;
  created_at: string;
}

const LIST_LIMIT = 15;

/** Type first (server-set), then message keywords for legacy rows without a type. */
function iconFor(notif: Notification): React.ReactNode {
  switch (notif.type) {
    case 'booking':
      return <Package className="h-3 w-3 text-orange-600 dark:text-orange-400" />;
    case 'booking_update':
    case 'offer_update':
      return notif.message.includes('Accepted')
        ? <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
        : <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />;
    case 'offer':
      return <Truck className="h-3 w-3 text-blue-600 dark:text-blue-400" />;
    case 'trip_update':
      return <Truck className="h-3 w-3 text-green-600 dark:text-green-400" />;
    case 'review':
      return <Star className="h-3 w-3 text-yellow-500" />;
    default:
      if (notif.message.includes('Accepted')) return <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />;
      if (notif.message.includes('Declined') || notif.message.includes('declined')) return <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />;
      if (notif.message.includes('⭐')) return <Star className="h-3 w-3 text-yellow-500" />;
      if (notif.message.includes('🚛') || notif.message.includes('📍')) return <Truck className="h-3 w-3 text-green-600 dark:text-green-400" />;
      return <MessageSquare className="h-3 w-3 text-orange-600 dark:text-orange-400" />;
  }
}

/** "3m ago", "2h ago", "Yesterday", else a short date. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 172800) return 'Yesterday';
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

const NotificationBell = React.memo(() => {
  const { userProfile, getSupabaseToken } = useAuth();
  const { getAuthenticatedClient, getToken } = useSupabase();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pushState, setPushState] = useState<'unknown' | 'on' | 'off' | 'unsupported'>('unknown');
  const [pushBusy, setPushBusy] = useState(false);

  // Exact unread count — the list is capped at LIST_LIMIT, so counting the
  // visible rows under-reports the badge as soon as a user falls behind.
  const fetchUnreadCount = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const supabaseClient = await getAuthenticatedClient();
      const { count, error } = await supabaseClient
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userProfile.id)
        .eq('is_read', false);
      if (error) throw error;
      setUnreadCount(count ?? 0);
    } catch (err) {
      console.error('[NotificationBell] unread count failed:', err);
    }
  }, [userProfile?.id, getAuthenticatedClient]);

  const fetchNotifications = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const supabaseClient = await getAuthenticatedClient();
      const { data, error } = await supabaseClient
        .from('notifications')
        .select('id, type, title, message, is_read, created_at, action_url, related_trip_id')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(LIST_LIMIT);

      if (error) throw error;
      if (data) setNotifications(data);
      await fetchUnreadCount();
    } catch (err) {
      console.error('[NotificationBell] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getAuthenticatedClient, fetchUnreadCount]);

  const refreshPushState = useCallback(async () => {
    if (!isPushSupported()) {
      setPushState('unsupported');
      return;
    }
    setPushState((await isPushSubscribed()) ? 'on' : 'off');
  }, []);

  useEffect(() => {
    if (!userProfile?.id) return;

    let cancelled = false;
    let channel: ReturnType<typeof baseSupabase.channel> | null = null;

    fetchNotifications();
    void refreshPushState();

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
            setNotifications(prev => [newNotif, ...prev].slice(0, LIST_LIMIT));
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
  }, [userProfile?.id, fetchNotifications, refreshPushState, getSupabaseToken]);

  const markAsRead = async (notif: Notification) => {
    if (notif.is_read) return;
    // Optimistic: the badge must not flicker back if the RPC is slow.
    setNotifications(prev => prev.map(n => (n.id === notif.id ? { ...n, is_read: true } : n)));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      const supabaseClient = await getAuthenticatedClient();
      const { error } = await supabaseClient.rpc('mark_notification_read', {
        p_notification_id: notif.id,
      });
      if (error) throw error;
    } catch (err) {
      console.error('[NotificationBell] mark read failed:', err);
      // Roll back so the badge tells the truth again.
      setNotifications(prev => prev.map(n => (n.id === notif.id ? { ...n, is_read: false } : n)));
      setUnreadCount(prev => prev + 1);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0 || !userProfile?.id) return;
    try {
      const supabaseClient = await getAuthenticatedClient();
      // Takes no arguments. It scopes itself to the caller via
      // current_clerk_user_id(), so passing p_user_id makes PostgREST
      // reject the call and the update silently does nothing.
      const { error } = await supabaseClient.rpc('mark_all_notifications_read');
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      showSuccess('All notifications marked as read');
    } catch (err) {
      console.error('[NotificationBell] mark all read failed:', err);
      showError('Could not mark notifications as read');
    }
  };

  const handleOpenItem = async (notif: Notification) => {
    await markAsRead(notif);
    if (notif.action_url) navigate(notif.action_url);
  };

  const togglePush = async () => {
    if (pushBusy || pushState === 'unsupported') return;
    setPushBusy(true);
    try {
      if (pushState === 'on') {
        const ok = await disablePush({ getToken });
        setPushState(ok ? 'off' : 'on');
        if (ok) showSuccess('Push notifications turned off');
        return;
      }
      const result = await enablePush({
        userId: userProfile?.id ?? '',
        getToken,
      });
      if (result.ok) {
        setPushState('on');
        showSuccess('Push notifications enabled');
      } else if (result.reason === 'permission_denied') {
        showError('Notifications are blocked in your browser settings');
      } else if (result.reason === 'unsupported') {
        setPushState('unsupported');
      } else if (result.reason === 'no_key') {
        showError('Push is not configured for this deployment yet');
      } else {
        showError('Could not enable push notifications');
      }
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}>
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          {unreadCount > 0 && (
            <span
              key={unreadCount}
              className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white animate-badge-pop"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <BellRing className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                onSelect={(e) => {
                  e.preventDefault(); // keep the menu open until we navigate
                  void handleOpenItem(notif);
                }}
                className="p-3 cursor-pointer focus:bg-gray-50 dark:focus:bg-gray-800"
              >
                <div className="flex gap-3 w-full">
                  <div className={`mt-0.5 p-1 rounded-full h-fit ${notif.is_read ? 'bg-gray-100 dark:bg-gray-800' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                    {iconFor(notif)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${notif.is_read ? 'text-gray-600 dark:text-gray-300' : 'font-medium text-gray-900 dark:text-white'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">{relativeTime(notif.created_at)}</p>
                  </div>
                  {!notif.is_read && <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0" />}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        {unreadCount > LIST_LIMIT && (
          <div className="px-3 py-2 text-[11px] text-gray-400 dark:text-gray-500 border-t">
            Showing the {LIST_LIMIT} most recent · {unreadCount} unread
          </div>
        )}
        <DropdownMenuSeparator />
        {pushState !== 'unsupported' && (
          <div className="p-2">
            <Button
              type="button"
              variant={pushState === 'on' ? 'outline' : 'default'}
              size="sm"
              className="w-full"
              disabled={pushBusy}
              onClick={togglePush}
            >
              <BellRing className="h-3.5 w-3.5 mr-2" />
              {pushBusy
                ? 'Please allow in your browser…'
                : pushState === 'on'
                  ? 'Push notifications on — turn off'
                  : 'Enable push notifications'}
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

export default NotificationBell;
