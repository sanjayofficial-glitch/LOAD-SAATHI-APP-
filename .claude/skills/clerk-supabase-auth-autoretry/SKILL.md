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

# Clerk + Supabase Auth with Auto-Retry

Production pattern for Clerk-authenticated Supabase clients with automatic token refresh and 401 retry logic.

## Key Files

- `src/hooks/useSupabase.ts` — `useSupabase()` hook returning `getAuthenticatedClient()` and `withAuthRetry()`
- `src/utils/supabaseClient.ts` — `createClerkSupabaseClient(token)` factory
- `src/utils/realtime.ts` — `authorizeRealtime()` to attach Clerk JWT to realtime socket
- `src/components/AuthSync.tsx` — Clerk ↔ Supabase profile sync on login

## Pattern

### useSupabase Hook
```tsx
const { getAuthenticatedClient, withAuthRetry, getToken } = useSupabase();
```
- `getToken()` gets Clerk JWT with `supabase` template
- `getAuthenticatedClient()` creates a fresh Supabase client with Clerk JWT
- `withAuthRetry(operation)` executes a Supabase operation; on 401/PGRST301 errors, retries once with a fresh token

### Realtime Authorization
```ts
await authorizeRealtime(getToken);
// THEN subscribe to postgres_changes
```
Must run before `channel.subscribe()` because RLS on realtime tables is `TO authenticated` — anon role is denied.

### Client Factory
```ts
const client = createClerkSupabaseClient(token);
client.realtime.setAuth(token);
```
Never create Supabase clients directly in components. Always use `useSupabase()` or the factory with a Clerk token.

## Best Practices

- Always use `useSupabase()` hook for authenticated DB operations
- Use anonymous client from `src/integrations/supabase/client.ts` ONLY for Realtime subscriptions
- Call `authorizeRealtime(getToken)` before any realtime subscription
- AuthSync component keeps Clerk ↔ Supabase in sync automatically
- Retry on 401 handles expired Clerk tokens transparently
