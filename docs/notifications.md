# Notifications

How a LoadSaathi notification travels from a state change to a user's screen,
and everything you must configure to turn each layer on.

## The pipeline

```
state change (PostgREST / RPC / admin / CLI)
   │  same transaction
   ▼
trigger  ──► notify_user() ──► public.notifications row
   │                                    │
   │                                    ├─► realtime INSERT ──► bell badge + toast (tab open)
   │                                    └─► Database Webhook ──► push-notifier (edge fn)
   │                                                                  │
   │                                                        push_subscriptions rows
   ▼                                                                  ▼
user is looking at the page                            browser push service ──► public/push-sw.js
```

Two guarantees the old design did not have:

1. **The notification row is created in the same transaction as the state
   change.** If the booking commits, the notification exists; if the booking
   rolls back, so does the notification. A closed tab can no longer eat an
   event.
2. **Delivery to a user who is not looking at the page.** Web Push reaches
   desktop Chrome/Firefox/Edge and Android (installable PWA); iOS Safari only
   after _Add to Home Screen_.

`notifications` remains the source of truth. Push is best-effort delivery of
the same row.

## What creates a notification

| Trigger                      | Table               | Event                                               | Recipient                           | Type             | `action_url`                                 |
| ---------------------------- | ------------------- | --------------------------------------------------- | ----------------------------------- | ---------------- | -------------------------------------------- |
| `trg_request_created_notify` | `requests`          | INSERT                                              | trucker (`receiver_id`)             | `booking`        | `/trucker/trips/:tripId`                     |
| `trg_request_decided_notify` | `requests`          | UPDATE OF `status` → accepted/declined              | shipper                             | `booking_update` | `/shipper/my-shipments`                      |
| `trg_offer_created_notify`   | `shipment_requests` | INSERT                                              | shipper                             | `offer`          | `/shipper/shipments/:shipmentId`             |
| `trg_offer_decided_notify`   | `shipment_requests` | UPDATE OF `status` → accepted/declined              | trucker                             | `offer_update`   | `/trucker/dashboard`                         |
| `trg_trip_status_notify`     | `trips`             | UPDATE OF `status` → in_transit/delivered/completed | every **distinct** accepted shipper | `trip_update`    | `/shipper/my-shipments`                      |
| `trg_review_created_notify`  | `reviews`           | INSERT                                              | the reviewed party                  | `review`         | `/trucker/dashboard` or `/shipper/dashboard` |

The trip lifecycle RPCs (`start_trip`, `mark_trip_delivered`, `complete_trip`)
still self-notify the _trucker_ through `create_notification()` — a different
recipient from the shippers the trigger handles, so there is no duplicate.

All of it lives in
`supabase/migrations/20261026000000_notification_system_overhaul.sql`.

### Why the helpers are shaped the way they are

- `notify_user()` is `SECURITY DEFINER` with `SET search_path = 'public'`, and
  `EXECUTE` is revoked from `PUBLIC`, `anon` and `authenticated` — only the
  trigger functions below it may call it.
- Every trigger function is `SECURITY DEFINER` and wraps its body in
  `EXCEPTION WHEN OTHERS`, returning `NEW`. **A notification failure must never
  roll back a booking, an offer or a trip.** Failures surface as a Postgres
  `WARNING` in the logs.
- Cross-user messages are linked with `related_trip_id` /
  `related_shipment_request_id`. The pre-fix client code passed `requests.id`
  into a column FK'd to `shipment_requests.id`, so accept/decline-to-shipper
  notifications failed the foreign key and never landed.

## Read / mark-read RPCs

| RPC                             | Args                | Notes                                     |
| ------------------------------- | ------------------- | ----------------------------------------- |
| `mark_notification_read(uuid)`  | `p_notification_id` | Own rows only (`current_clerk_user_id()`) |
| `mark_all_notifications_read()` | none                | Scopes itself to the caller               |

Both are `SECURITY DEFINER`, granted to `authenticated` + `service_role`,
revoked from `PUBLIC` and `anon`. They existed only in `FULL_REPAIR.sql` before
this migration (audit finding DB-01), so a fresh `supabase db reset` used to
leave the bell calling functions that did not exist.

The badge in `NotificationBell.tsx` is a separate `count: 'exact', head: true`
query — the visible list is capped at 15 rows, so counting the list would
under-report as soon as a user falls behind. Opening the dropdown no longer
marks anything read; there is an explicit **Mark all read** control.

## RLS

The old `"Users can create notifications for others"` policy had
`WITH CHECK (true)` (audit finding SEC-03): any authenticated client could
insert rows into anyone's bell, bypassing `create_notification()`. It is
dropped. Cross-user inserts now happen only through `create_notification()`
(app) or the triggers (server, same transaction as the state change).

`push_subscriptions` is locked to `user_id = current_clerk_user_id()` for
SELECT / INSERT / UPDATE / DELETE, with `anon` fully revoked.

## Web Push setup

One-time, in this order.

### 1. Generate VAPID keys

```bash
npx web-push generate-vapid-keys
```

Gives a `PUBLIC KEY` (87-ish base64url chars) and a `PRIVATE KEY`.

### 2. Store the private half in the edge function

```bash
supabase secrets set \
  VAPID_PUBLIC_KEY="<public key>" \
  VAPID_PRIVATE_KEY="<private key>" \
  VAPID_SUBJECT="mailto:you@loadsaathi.in" \
  PUSH_WEBHOOK_SECRET="<random 32+ chars>"
```

The private key never reaches the browser. `PUSH_WEBHOOK_SECRET` is optional —
if set, the webhook must send it as the `x-push-webhook-secret` header.

### 3. Expose the public half to the frontend

Set `VITE_VAPID_PUBLIC_KEY=<public key>` in Vercel → Settings → Environment
Variables (and in local `.env`). `scripts/validate-env.mjs` warns at build time
if it is missing or malformed; without it the bell reports push as
unconfigured and the app stays in-app-only.

### 4. Deploy the function

```bash
supabase functions deploy push-notifier
```

`verify_jwt = false` is set for it in `supabase/config.toml` because the caller
is a server-side webhook, not a browser. It authenticates with the shared
secret and then substantiates the payload: a notification row that does not
really exist in the database is dropped silently.

### 5. Create the Database Webhook (Dashboard only)

Supabase Studio → **Database → Webhooks → Create hook**:

| Field                          | Value                                   |
| ------------------------------ | --------------------------------------- |
| Name                           | `notify-push`                           |
| Table                          | `notifications`                         |
| Events                         | ✅ Insert                               |
| Type                           | HTTP Request / Supabase Edge Functions  |
| Function                       | `push-notifier`                         |
| Timeout                        | 1000 ms                                 |
| Header `x-push-webhook-secret` | the secret from step 2 (if you set one) |

This cannot be configured from repo code — the webhook lives in the project's
`pg_net` configuration.

### 6. Verify

```bash
# From the SQL editor, as a real user id:
INSERT INTO public.notifications (user_id, message, type, title, action_url)
VALUES ('<users.id>', 'Push test', 'info', 'Test', '/');

# Then check the edge function logs for "[push-notifier]".
curl -s -X POST "$SUPABASE_FUNCTIONS_URL/push-notifier" \
  -H "content-type: application/json" \
  -H "x-push-webhook-secret: $PUSH_WEBHOOK_SECRET" \
  -d '{"record":{"id":"<notification id>","user_id":"<users.id>"}}'
```

Expected: `{"ok":true,"sent":1,"dead":0}`. `no_subscriptions` means the user
has not clicked **Enable push notifications** in the bell yet.

## Frontend pieces

| File                                           | Role                                                                                                      |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `public/push-sw.js`                            | `push` → `showNotification`; `notificationclick` → focus/open `data.url`. No `fetch` handler.             |
| `supabase/src/main.tsx`                        | Registers `/push-sw.js` on web only. The Capacitor branch unregisters all workers.                        |
| `supabase/src/utils/push.ts`                   | `isPushSupported` / `isPushSubscribed` / `enablePush` / `disablePush` + base64url VAPID decode.           |
| `supabase/src/components/NotificationBell.tsx` | Badge count, per-item read + deep link, **Mark all read**, type icons, relative time, push opt-in button. |

`public/sw.js` (an offline-caching worker) is deliberately **not** registered —
registering it would silently turn on caching behaviour that was written but
never shipped.

### Deep links

Clicking an item marks it read and navigates to `action_url`. A push click
lands on the same URL via the service worker. Route targets are defined in
`supabase/src/routes.tsx`; if you add a route that notifications point at,
update the trigger table above in the same PR.

## Operational notes

- **Deleting a user.** `push_subscriptions.user_id` is `ON DELETE CASCADE`.
- **Stale subscriptions.** `push-notifier` deletes a subscription when the push
  service answers 400 / 404 / 410 / 413 (unsubscribed, expired, malformed).
- **Outage.** If the push service or the edge function is down, the row is
  already written and realtime still updates the bell. Nothing is lost.
- **Rate.** One webhook call per notification row, TTL 24 h. A burst of
  notifications is a burst of webhook calls — if that ever becomes a problem,
  add batching in `push-notifier`, not in the triggers.
- **Android shell.** Capacitor unregisters service workers on startup, so
  native gets in-app notifications only (realtime/toast) until a native push
  plugin is added.

## Related audit findings closed here

| ID     | Finding                                                                            | Fix                                             |
| ------ | ---------------------------------------------------------------------------------- | ----------------------------------------------- |
| DB-01  | `mark_all_notifications_read` / `mark_notification_read` only in `FULL_REPAIR.sql` | Redefined in the migration with explicit grants |
| SEC-03 | `WITH CHECK (true)` insert policy on `notifications`                               | Policy dropped                                  |
| —      | Badge undercount from a 10-row list                                                | Exact count query                               |
| —      | Dropdown auto-marked everything read on open                                       | Explicit "Mark all read"                        |
| —      | Accept/decline notifications silently failing an FK                                | Trigger uses `related_trip_id`                  |
| —      | `mark_notification_read` had `EXECUTE` revoked for `authenticated`                 | Re-granted                                      |
| —      | No delivery outside an open tab                                                    | Web Push                                        |
| —      | Client-fired delivery lost if the sender's tab died                                | DB triggers                                     |
