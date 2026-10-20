# 004 — Chat: animate only new message arrivals, not history; offline banner slides in

- **Status**: DONE (2026-10-19). Review deviation: the plan's tail-id history cut (`stableId !== lastHistoryId`) would have animated N−1 history bubbles on open; replaced with a membership `Set` (`historyIdsRef`) built after initial load — `arrive = historyLoaded && !historyIdsRef.current.has(stableId)`. All other mechanics (stableId key, tempId preservation, banner slide) as planned.
- **Commit**: 0694273
- **Severity**: MEDIUM
- **Category**: Frequency discipline (purpose & frequency) + jarring change
- **Estimated scope**: 1 file (`supabase/src/pages/messaging/Chat.tsx`), ~25 lines

## Problem

Two issues in `supabase/src/pages/messaging/Chat.tsx`:

1. **Every message** — the entire loaded history included — renders with
   `animate-fade-in` (line 272), so opening a chat replays an entrance animation on
   potentially dozens of old bubbles. Animation should mark *arrival*, not page mount:

```tsx
// supabase/src/pages/messaging/Chat.tsx:272 — current
<div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
```

2. The offline banner is a bare conditional render — it teleports in/out with no motion
   bridge:

```tsx
// supabase/src/pages/messaging/Chat.tsx:305 — current
{!isOnline && (
  <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-100 dark:border-yellow-800 text-xs text-yellow-700 dark:text-yellow-300 text-center">
    <WifiOff className="h-3 w-3 inline mr-1.5" /> You are offline. Reconnect to send and receive messages.
  </div>
)}
```

## Target

1. Bubbles are **static by default**; only messages that arrive *after* the chat has
   finished initial loading get an entrance. Discriminator: track whether initial load
   has completed; animate only bubbles newer than the last history-tail message at load
   completion. Simplest robust version used here: an explicit `historyLoadedIdRef`
   snapshot + an `arrived` class applied per bubble.
2. Optimistic / realtime arrivals rise from the composer:
   `opacity: 0` + `translateY(8px)` + `scale(0.98)` → identity,
   `--dur-base` (180 ms), `var(--ease-out-quind)` — **typo guard: use
   `var(--ease-out-quint)` = `cubic-bezier(0.22, 1, 0.36, 1)`**
3. Offline banner slides from its edge — it's docked at the *bottom* of the message
   area, so enter/exit downward:
   `max-height` is forbidden (layout property); animate
   `translateY(100%) → 0` + `opacity 0 → 1`, 200 ms `var(--ease-ios)`
   (`cubic-bezier(0.32, 0.72, 0, 1)`), symmetric because it's a reversible
   appear/disappear. Since it's a conditional render, exit can be skipped (instant on
   regain) — entering is what matters; exit may stay instant.

## Repo conventions to follow

- House class `.reveal` + `data-reveal="in"`/`"out"` and `revealStyle()` could do this,
  but arrival here is event-driven, not scroll-driven — a dedicated tiny class pair is
  cleaner. Place it in `supabase/src/globals.css` next to `.animate-materialize`
  (after line 549).
- Reduced motion: house pattern (see `useReveal.ts:80-83`) — show content immediately,
  no movement.
- State-indication entrances exemplar: the optimistic-send message system already
  exists at `Chat.tsx:186-199`; we key the animation to *that* path plus the
  realtime-subscribe path, not to the initial `fetchMessages` render (lines 87-89).

## Steps

1. Add CSS to `supabase/src/globals.css` (after `.animate-badge-pop`, ~line 549):

   ```css
   /* Chat bubble arrival — event-driven entrance, marked per message, not per
      mount. Rises from the composer like it was sent from where you typed. */
   @keyframes msgArrive {
     from { opacity: 0; transform: translateY(8px) scale(0.98); }
     to { opacity: 1; transform: translateY(0) scale(1); }
   }
   .animate-msg-arrive {
     animation: msgArrive 180ms var(--ease-out-quint) both;
   }
   @media (prefers-reduced-motion: reduce) {
     .animate-msg-arrive { animation: none; }
   }

   /* Offline banner: slides in from the bottom edge of the message pane.
      Height is driven by content; translate+fade only, no layout props. */
   .offline-banner-enter {
     animation: offlineSlide 200ms var(--ease-ios) both;
   }
   @keyframes offlineSlide {
     from { opacity: 0; transform: translateY(100%); }
     to { opacity: 1; transform: translateY(0); }
   }
   @media (prefers-reduced-motion: reduce) {
     .offline-banner-enter { animation: none; }
   }
   ```

2. In `supabase/src/pages/messaging/Chat.tsx`:

   a. Track history cut:

   ```tsx
   const [messages, setMessages] = useState<OptimisticMessage[]>([]);
   // NEW: id of the last message that existed at initial-load completion.
   const historyCutRef = useRef<string | null>(null);
   const [historyLoaded, setHistoryLoaded] = useState(false);
   ```

   Set both in the initial-load path (after line 89 `setMessages(...)`):

   ```tsx
   setMessages(initialMessages.map(m => ({ ...m, status: 'sent' as MessageStatus })));
   historyCutRef.current = initialMessages[initialMessages.length - 1]?.id ?? null;
   setHistoryLoaded(true);
   ```

   b. Change the bubble className (line 272):

   ```tsx
   const animate = historyLoaded && historyCutRef.current != null && !historyCutRef.current.startsWith(msg.id)
     && msg.id !== historyCutRef.current
     && !(historyCutRef.current === msg.id);
   ```

   — **do not use that convoluted logic**; simpler and robust: animate if the message id
   differs from the cut AND the cut exists. Since realtime messages always have fresh
   ids and optimistic ones have temp ids, compare directly:

   ```tsx
   {messages.map((msg) => {
     const isMe = msg.sender_id === userProfile?.id;
     const isNew = !!historyCutRef.current && msg.id !== historyCutRef.current && noLongerLoading();
   ```

   — Final concrete form to write:

   ```tsx
   {messages.map((msg) => {
     const isMe = msg.sender_id === userProfile?.id;
     const arrive = historyLoaded && !!msg.tempId === !!msg.tempId; // placeholder, replaced below
   ```

   **Concrete final logic** (implement exactly this):

   - Track at load: `historyCutRef.current` = last history message id (or null).
   - Bubble is "an arrival" iff `historyLoaded && historyCutRef.current !== msg.id`
   — but history-tail updates (e.g. `is_read` flips via line 118) mutate existing
   bubbles without changing ids, so id-inclusion is stable; a message that *replaces*
   a pending optimistic (same tempId path, line 101-108) keeps its React `key`
   (`msg.tempId` used as key? — current key is `msg.id`) so its animation re-triggers
   only if the id changes.

   Final bubble markup:

   ```tsx
   <div
     key={msg.id}
     className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${
       historyLoaded && historyCutRef.current !== msg.id ? 'animate-msg-arrive' : ''
     }`}
   >
   ```

   One caveat the executor must handle: inside `subscribeToMessages` reconciliation
   (lines 100-108) an optimistic message with `tempId` gets **replaced by the real
   `msg` with a new id** — since the real id ≠ the history cut, it re-animates once at
   confirm time, which is wrong (it already animated on send). To suppress that
   re-animation, keep the optimistic's identity: in the replace-path (line 105),
   preserve the tempId as the React key:

   ```tsx
   next[tempIdx] = { ...msg, status: 'sent', tempId: existing.tempId };
   ```

   this already keeps `tempId` on the object — so **use `tempId ?? msg.id` as the
   React key AND the cut-comparison id**:

   ```tsx
   const stableId = msg.tempId ?? msg.id;
   const arrive = historyLoaded && stableId !== historyCutRef.current;
   ```

   And set the cut from history ids (`historyCutRef.current` = last history id); for
   optimistic bubbles `tempId` is never in history, so they always animate — correct.
   Confirmed realtime-replaces-optimistic keeps `tempId` — no re-animation, no double.

   c. Offline banner (line 305):

   ```tsx
   {!isOnline && (
     <div className="offline-banner-enter px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-100 dark:border-yellow-800 text-xs text-yellow-700 dark:text-yellow-300 text-center">
       <WifiOff className="h-3 w-3 inline mr-1.5" /> You are offline. Reconnect to send and receive messages.
     </div>
   )}
   ```

3. Definition-of-subtle guard: the sends are extra-frequent; if a trucker+shipper
   exchanging many messages finds the 180 ms arrival too chatty, lower only via the one
   place it lives (`.animate-msg-arrive` duration, 180 → 120 ms). Do not branch per
   message-type.

## Boundaries

- Do NOT touch the send pipeline (`sendOptimistic`, `subscribeToMessages` callbacks'
  state logic except the one key change specified).
- Do NOT touch `messagesEndRef` scroll logic.
- Do NOT add framer-motion to Chat.
- The offline banner exit (regain connectivity) stays an instant unmount — exit
  animation is out of scope.
- If the code at Chat.tsx:272/305 or the load path at :89 drifted since 0694273, STOP
  and report.

## Verification

- **Mechanical**: `pnpm typecheck`, `pnpm lint`, `pnpm build` pass.
- **Feel check** (`pnpm dev`, open a chat between two accounts, ideally two browsers):
  - Open a chat with existing history: history renders **static** (no per-bubble
    animation on open).
  - Send a message: only that bubble rises 8px + 0.98 scale from the composer, 180 ms.
  - Receive on the second browser: only the incoming bubble animates; the first browser's
    copy doesn't re-animate on read-receipt flips (is_read update).
  - Go offline (DevTools Network → offline): banner slides up from the bottom edge
    200 ms; going back online: banner disappears instantly (fine).
  - DevTools Animations at 10%: arrival shows translateY+scale together from under the
    composer side.
  - `prefers-reduced-motion` on: no bubble movement; banner appears without slide.
- **Done when**: history is static, arrivals animate once each, no double animation on
  the optimistic→real swap, banner slides in from bottom.
