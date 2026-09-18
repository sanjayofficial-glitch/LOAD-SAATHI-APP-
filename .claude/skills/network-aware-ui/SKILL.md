---
name: network-aware-ui
description: >-
  Offline/online detection with banners. Use when building offline-capable apps,
  network status indicators, or connectivity-aware UI. Triggers: offline detection,
  network status, offline banner, online offline react.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# Network-Aware UI

Offline/online detection with sticky banners and "back online" confirmation toast.

## Key Files

- `src/hooks/useNetworkStatus.ts` — Hook returning `isOnline` and `wasOffline`
- `src/components/OfflineBanner.tsx` — Sticky banner component

## Pattern

### Hook
```tsx
const { isOnline, wasOffline } = useNetworkStatus();
```
- `isOnline` — current online status from `navigator.onLine`
- `wasOffline` — true for 3 seconds after reconnecting (for "back online" banner)

### Event Listeners
```ts
window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);
```
- `handleOnline`: sets `isOnline = true`, `wasOffline = true`, clears after 3s
- `handleOffline`: sets `isOnline = false`

### Banner Component
```tsx
<OfflineBanner />
```
- Returns null when online and not reconnecting
- Offline: yellow gradient banner with WifiOff icon, sticky top
- Reconnecting: green gradient banner with Wifi icon, animated fade-in, 3s display

## Best Practices

- Use sticky positioning so banner is always visible
- Show distinct messages for offline vs reconnecting
- Auto-hide "back online" after 3 seconds
- Use gradient backgrounds for visibility
- Keep banner compact to avoid excessive vertical space
