// Web Push sender for LoadSaathi notifications.
//
// Trigger: a Supabase Database Webhook on `notifications` INSERT
// (Dashboard → Database → Webhooks → table `notifications`, event Insert →
// HTTP POST to this function; see docs/notifications.md). It can also be
// called directly with `{ record: { ...notification } }`.
//
// Flow: notification row (written by the triggers in
// migrations/20261026000000_notification_system_overhaul.sql) → this function
// → each Web Push subscription of the recipient → the browser's push service →
// public/push-sw.js shows the notification, even when the tab is closed.
//
// Anti-abuse:
//   1. Shared secret: if PUSH_WEBHOOK_SECRET is set, the caller must echo it
//      in the `x-push-webhook-secret` header (set it on the webhook itself).
//   2. Substantiation: the notification row must actually exist in the
//      database — a fabricated payload with no matching insert is dropped.
//   3. Only rows for the recipient are read; subscriptions are scoped by
//      user_id under service-role.
//
// Reliability contract: best effort. A dead subscription is deleted on
// 404/410, a push-service outage is logged and swallowed — the
// `notifications` row (in-app bell + toast) remains the source of truth.
//
// Secrets (Deno env, `supabase secrets set`):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@domain)
//   PUSH_WEBHOOK_SECRET (optional but recommended)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const ALLOWED_ORIGINS = [
  'https://loadsaathi.in',
  'https://www.loadsaathi.in',
  'http://localhost:8080',
  'http://localhost:5173',
];

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-push-webhook-secret',
    'Content-Type': 'application/json',
  };
}

const json = (data: unknown, status = 200, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

interface NotificationRow {
  id: string;
  user_id: string;
  message: string;
  title?: string | null;
  type?: string | null;
  action_url?: string | null;
  created_at?: string;
}

interface WebhookPayload {
  type?: string;
  table?: string;
  schema?: string;
  record?: NotificationRow;
  old_record?: unknown;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function handler(req: Request): Promise<Response> {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json({ ok: false, reason: 'method_not_allowed' }, 405, cors);

  // 1. Shared secret (optional, configured on the webhook)
  const secret = Deno.env.get('PUSH_WEBHOOK_SECRET') ?? '';
  if (secret && req.headers.get('x-push-webhook-secret') !== secret) {
    return json({ ok: false, reason: 'bad_secret' }, 401, cors);
  }

  // 1b. Envelope sanity: if the caller presents a Database-Webhook envelope,
  // it must be a notifications INSERT (a bare row is only accepted for
  // backwards compatibility with internal callers).
  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, reason: 'invalid_json' }, 400, cors);
  }
  if (payload?.table && payload.table !== 'notifications') {
    return json({ ok: false, reason: 'wrong_table' }, 200, cors);
  }
  if (payload?.type && payload.type !== 'INSERT') {
    return json({ ok: false, reason: 'ignored_event' }, 200, cors);
  }

  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:ops@loadsaathi.in';
  if (!vapidPublicKey || !vapidPrivateKey) {
    // Not configured yet — quiet no-op; the in-app bell still works.
    return json({ ok: false, reason: 'vapid_not_configured' }, 200, cors);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, reason: 'service_credentials_missing' }, 200, cors);
  }

  // Accept both the Database Webhook envelope and a bare notification row.
  const record = (payload?.record ?? payload) as NotificationRow;
  if (!record?.id || !record?.user_id) {
    return json({ ok: false, reason: 'no_record' }, 400, cors);
  }

  // 1c. Idempotency: deduplicate replays of the same notification delivery.
  const dedupKey = `${record.user_id}:${record.id}`;
  const nowMs = Date.now();
  const seen = deliveredRecently.get(dedupKey);
  if (seen && nowMs < seen) {
    return json({ ok: true, sent: 0, reason: 'duplicate' }, 200, cors);
  }
  deliveredRecently.set(dedupKey, nowMs + DEDUP_WINDOW_MS);
  if (deliveredRecently.size > DEDUP_MAP_CAP) {
    const expired: string[] = [];
    for (const [key, at] of deliveredRecently) {
      if (nowMs >= at) expired.push(key);
    }
    for (const key of expired) deliveredRecently.delete(key);
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // 2. Substantiation: this notification must really exist.
  const { data: stored, error: storedErr } = await admin
    .from('notifications')
    .select('id, user_id, message, title, type, action_url, created_at')
    .eq('id', record.id)
    .maybeSingle();

  if (storedErr) {
    console.error('[push-notifier] notification read failed:', storedErr.message);
    return json({ ok: false, reason: 'db_error' }, 200, cors);
  }
  if (!stored || stored.user_id !== record.user_id) {
    // Fabricated / already purged payload — stay silent.
    return json({ ok: false }, 200, cors);
  }

  const notification = stored as NotificationRow;

  // 3. Recipient's subscriptions
  const { data: subs, error: subsErr } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', notification.user_id);

  if (subsErr) {
    console.error('[push-notifier] subscription read failed:', subsErr.message);
    return json({ ok: false, reason: 'db_error' }, 200, cors);
  }
  const subscriptions = (subs ?? []) as SubscriptionRow[];
  if (subscriptions.length === 0) {
    return json({ ok: true, sent: 0, reason: 'no_subscriptions' }, 200, cors);
  }

  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } catch (err) {
    console.error('[push-notifier] invalid VAPID details:', (err as Error).message);
    return json({ ok: false, reason: 'invalid_vapid' }, 200, cors);
  }

  const body = JSON.stringify({
    title: notification.title?.trim() || 'LoadSaathi',
    body: notification.message,
    url: notification.action_url || '/',
    tag: notification.type || 'notification',
    id: notification.id,
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
          { TTL: 60 * 60 * 24, urgency: 'normal' }
        );
        return { ok: true as const, id: sub.id };
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        // 404/410: the push service no longer knows this subscription.
        // 400/413: malformed — retrying will never work either.
        if (statusCode === 404 || statusCode === 410 || statusCode === 400 || statusCode === 413) {
          return { ok: false as const, id: sub.id, dead: true, statusCode };
        }
        console.error('[push-notifier] send failed', statusCode ?? '?', (err as Error).message);
        return { ok: false as const, id: sub.id, dead: false, statusCode };
      }
    })
  );

  const settled = results.map((r) => (r.status === 'fulfilled' ? r.value : { ok: false, id: '' }));
  const deadIds = settled.filter((r) => 'dead' in r && r.dead).map((r) => r.id);
  if (deadIds.length > 0) {
    const { error: delErr } = await admin.from('push_subscriptions').delete().in('id', deadIds);
    if (delErr) console.error('[push-notifier] cleanup failed:', delErr.message);
  }

  const sent = settled.filter((r) => r.ok).length;
  return json({ ok: true, sent, dead: deadIds.length }, 200, cors);
}

// Idempotency guard for webhook replays (in-memory, bounded).
const DEDUP_WINDOW_MS = 5 * 60 * 1000;
const DEDUP_MAP_CAP = 10_000;
const deliveredRecently = new Map<string, number>();

Deno.serve(async (req: Request): Promise<Response> => {
  try {
    return await handler(req);
  } catch (err) {
    console.error('[push-notifier] unhandled:', (err as Error).message);
    return json({ ok: false, reason: 'internal_error' }, 500);
  }
});
