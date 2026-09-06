---
name: clerk-supabase-auth-autoretry
description: >-
  Clerk JWT to Supabase authentication with automatic token refresh and 401 retry.
  Use when setting up auth, integrating Clerk with Supabase, handling auth retries,
  or building authenticated Supabase clients. Triggers: clerk supabase auth, auth retry,
  jwt supabase, realtime auth, createClerkSupabaseClient.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# Clerk + Supabase Auth Auto-Retry

## What This Skill Captures

This skill encodes the production-ready pattern for authenticating Supabase clients
with Clerk JWTs in the LoadSaathi application. It covers token refresh, automatic
401 retry logic, and the distinction between authenticated and anonymous Supabase
clients. It also documents the edge cases seen in Capacitor and browser environments.

## Key Files and Paths

- `src/hooks/useSupabase.ts` — Primary hook returning an authenticated Supabase
  client and helper utilities.
- `src/utils/supabaseClient.ts` — Low-level factory `createClerkSupabaseClient(token)`
  and client caching.
- `src/utils/realtime.ts` — `authorizeRealtime()` helper that attaches the Clerk
  JWT to a Supabase Realtime socket before subscribing.
- `src/components/AuthSync.tsx` — Synchronizes Clerk user data into the Supabase
  `users` table on login.
- `src/integrations/supabase/client.ts` — Anonymous Supabase client used only for
  Realtime subscriptions.
- `src/utils/capacitorOAuth.ts` — OAuth helper for native Android builds.

## Core Patterns

### Authenticated Client Hook

Always use `useSupabase()` for database operations:

```tsx
const supabase = useSupabase();
const { data, error } = await supabase.from('trips').select('*');
```

Never instantiate a Supabase client directly inside a component.

### 401 Auto-Retry

`withAuthRetry()` wraps Supabase calls. On a `401` or `PGRST301` error, it fetches
a fresh Clerk JWT and retries the request once. This handles silent token expiry
without user-visible failures. The retry is limited to one attempt to prevent
infinite loops.

### Realtime Authorization

Supabase Realtime requires a separate authorized socket. Use `authorizeRealtime()`
instead of the raw anonymous client when subscriptions need row-level access. The
helper reads the current Clerk session, attaches the JWT as a bearer token, and
returns a ready-to-subscribe channel.

### User Sync

`AuthSync` runs after Clerk sign-in. It reads the Clerk user, upserts into the
`users` table, and stores the profile in `AuthContext`. The profile includes
`user_type`, `rating`, and `verified` status. If the user has never signed in
before, a default profile is created.

## Debugging and Edge Cases

If authenticated queries return `PGRST301`, inspect the JWT in the Authorization
header. A missing or expired token usually means `useSupabase()` is being called
outside a `ClerkProvider` or before the session is ready.

For Capacitor, ensure `capacitor.config.ts` allows navigation to the Clerk domain
and that OAuth deep links are configured. Without this, the token exchange fails
silently and `withAuthRetry()` will loop.

## Best Practices

- Keep JWT retrieval logic in `useSupabase.ts`, not scattered across components.
- Cache the authenticated client per Clerk session to avoid redundant token fetches.
- Use the anonymous client from `integrations/supabase/client.ts` only for public
  Realtime channels.
- Log auth failures with structured logs from `src/lib/logger.ts` for debugging.
- In Capacitor builds, verify deep links are configured so Clerk OAuth redirects
  correctly back to the native shell.

## Trigger Phrases

- "clerk supabase auth"
- "auth retry"
- "jwt supabase"
- "realtime auth"
- "createClerkSupabaseClient"

## Common Pitfalls

- Do not call createClerkSupabaseClient directly from components; always route
  through useSupabase() so the token is managed centrally.
- Avoid storing JWTs in localStorage manually; Clerk handles session persistence.
- When debugging, compare the Authorization header of a working request against
  a failing one to spot missing or malformed tokens.
