// Web Push subscription management.
//
// Registered by public/push-sw.js (see main.tsx). Subscription rows live in
// public.push_subscriptions (RLS: user owns their own rows) and are read by
// supabase/functions/push-notifier when a Database Webhook fires on
// notifications INSERT.
//
// VAPID_PUBLIC_KEY is the only value the frontend needs; the private half
// lives exclusively in the edge function's secrets. If it is not set,
// every function here resolves to `false`/no-op so the app degrades to
// in-app notifications only.

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export const isPushSupported = (): boolean =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  window.isSecureContext &&
  Boolean(VAPID_PUBLIC_KEY);

/** Is the user currently subscribed on this device? */
export const isPushSubscribed = async (): Promise<boolean> => {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration('/push-sw.js');
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    return Boolean(sub);
  } catch {
    return false;
  }
};

/** base64url (VAPID) → Uint8Array, as required by PushManager.subscribe. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export interface EnablePushResult {
  ok: boolean;
  reason?: 'unsupported' | 'no_key' | 'permission_denied' | 'error' | 'no_user';
}

/**
 * Prompt for permission, subscribe to push, and persist the subscription.
 * Returns `{ ok: false, reason: 'permission_denied' }` when the user says no —
 * the caller decides whether that is worth a toast.
 */
export const enablePush = async (params: {
  userId: string;
  getToken: () => Promise<string | null>;
}): Promise<EnablePushResult> => {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };
  if (!VAPID_PUBLIC_KEY) return { ok: false, reason: 'no_key' };
  if (!params.userId) return { ok: false, reason: 'no_user' };

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { ok: false, reason: 'permission_denied' };

    const reg = await navigator.serviceWorker.register('/push-sw.js');
    // Wait for the worker so pushManager.subscribe() is not racing an
    // in-progress install.
    await navigator.serviceWorker.ready;

    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
      }));

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, reason: 'error' };
    }

    const token = await params.getToken();
    if (!token) return { ok: false, reason: 'error' };

    const { createClerkSupabaseClient } = await import('@/lib/supabase');
    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: params.userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        user_agent: navigator.userAgent,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );
    if (error) throw error;

    return { ok: true };
  } catch (err) {
    console.error('[enablePush] Error:', err);
    return { ok: false, reason: 'error' };
  }
};

/**
 * Unsubscribe this device. Removes the DB row (best-effort) and the local
 * subscription so the push service stops delivering to a dead endpoint.
 */
export const disablePush = async (params: {
  getToken: () => Promise<string | null>;
}): Promise<boolean> => {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration('/push-sw.js');
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return true;

    const token = await params.getToken();
    if (token) {
      const { createClerkSupabaseClient } = await import('@/lib/supabase');
      const supabase = createClerkSupabaseClient(token);
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', sub.endpoint);
      if (error) console.error('[disablePush] row delete failed:', error);
    }

    return await sub.unsubscribe();
  } catch (err) {
    console.error('[disablePush] Error:', err);
    return false;
  }
};
