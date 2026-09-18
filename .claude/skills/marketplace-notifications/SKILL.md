---
name: marketplace-notifications
description: >-
  Marketplace notification helpers for booking lifecycle. Use when building
  two-sided marketplace notifications, booking alerts, or trip lifecycle updates.
  Triggers: marketplace notifications, booking notifications, trip notifications,
  supabase rpc notifications.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# Marketplace Notification Helpers

Typed notification system for two-sided marketplace events: booking requests, accept/decline, trip lifecycle, reviews, and offers.

## Key Files

- `src/utils/notifications.ts` — `sendNotification()` RPC wrapper + domain helpers

## Pattern

### Core Function
```ts
await sendNotification({
  userId: params.userId,
  message: "📦 New booking! ...",
  relatedTripId: params.tripId,
  getToken: () => getToken({ template: 'supabase' }),
});
```
Uses SECURITY DEFINER RPC `create_notification` to bypass RLS for cross-user notifications.

### Domain Helpers
11 pre-built notification functions:

**Booking Flow:**
- `notifyTruckerOfBookingRequest({ truckerId, shipperName, weightTonnes, goodsDescription, originCity, destinationCity, tripId, getToken })`

**Accept/Decline:**
- `notifyShipperOfRequestAccepted({ shipperId, truckerName, truckerPhone, originCity, destinationCity, requestId, getToken })`
- `notifyShipperOfRequestDeclined({ shipperId, truckerName, originCity, destinationCity, getToken })`

**Trip Lifecycle:**
- `notifyShipperOfTripStarted({ shipperId, truckerName, originCity, destinationCity, tripId, getToken })`
- `notifyShipperOfTripCompleted({ shipperId, truckerName, originCity, destinationCity, tripId, getToken })`
- `notifyShipperOfTripDelivered({ shipperId, truckerName, originCity, destinationCity, tripId, getToken })`

**Offers:**
- `notifyTruckerOfOfferAccepted({ truckerId, shipperName, shipperPhone, originCity, destinationCity, requestId, getToken })`
- `notifyTruckerOfOfferDeclined({ truckerId, shipperName, originCity, destinationCity, getToken })`
- `notifyShipperOfTruckerOffer({ shipperId, truckerName, proposedPrice, weightTonnes, originCity, destinationCity, getToken })`

**Reviews:**
- `notifyTruckerOfNewReview({ truckerId, shipperName, tripId, getToken })`
- `notifyShipperOfNewReview({ shipperId, truckerName, tripId, getToken })`

### Message Format
```ts
`📦 New booking! ${shipperName} wants to ship ${weightTonnes}t of "${goodsDescription}" on your trip from ${originCity} → ${destinationCity}.`
```
- Emoji prefix for quick visual scanning
- Includes relevant context (names, cities, weights, prices)
- Links to related trip/request via `relatedTripId`

## Best Practices

- Always pass `getToken` callback, not token directly
- Include related trip/request IDs for deep linking
- Use SECURITY DEFINER RPC for cross-user writes
- Keep messages concise but contextual
- Never send PII in notification messages
