---
name: notification-bell-realtime
description: >-
  Notification bell with Supabase realtime + RPC. Use when building notification
  systems, unread counts, or realtime alerts. Triggers: notification bell,
  realtime notifications, supabase notifications, unread count.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# Notification Bell with Realtime + RPC

Notification dropdown with realtime INSERT subscriptions, unread count, mark-all-read RPC, and toast popups.

## Key Files

- `src/components/NotificationBell.tsx` — Dropdown with unread badge and realtime
- `src/utils/notifications.ts` — Domain-specific notification helpers

## Pattern

### Fetch + Subscribe
```tsx
const { notifications, unreadCount } = useNotifications();
```
1. Fetch initial notifications via authenticated Supabase client
2. Authorize realtime socket with Clerk JWT
3. Subscribe to `postgres_changes` INSERT on `notifications` table
4. Filter by `user_id=eq.<current_user_id>`
5. Prepend new notifications, increment unread count
6. Show toast popup for each new notification

### Mark All as Read
```ts
await supabaseClient.rpc('mark_all_notifications_read', { p_user_id: userId });
```
Uses SECURITY DEFINER RPC to bypass RLS for bulk update.

### Dropdown UI
- Bell icon with red badge showing unread count
- Badge pulses when > 0
- Dropdown max height 320px with scroll
- Shows empty state with MessageSquare icon
- Auto-marks-read on dropdown open

### Domain Helpers
Pre-built notification functions in `src/utils/notifications.ts`:
- `notifyTruckerOfBookingRequest`
- `notifyShipperOfRequestAccepted/Declined`
- `notifyShipperOfTripStarted/Completed/Delivered`
- `notifyTruckerOfOfferAccepted/Declined`
- `notifyTruckerOfNewReview` / `notifyShipperOfNewReview`
- `notifyShipperOfTruckerOffer`

## Best Practices

- Always authorize realtime socket before subscribing
- Limit to 10 most recent notifications
- Use toast for realtime notification popups
- Mark all as read on dropdown open for better UX
- Never send PII in notification messages
