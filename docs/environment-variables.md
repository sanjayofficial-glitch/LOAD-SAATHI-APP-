# Environment Variables

## Configuration boundary

```mermaid
flowchart TB
    TEMPLATE[.env.example] --> LOCAL[Local .env]
    LOCAL --> VITE[Vite client variables]
    VITE --> PUBLIC[Browser-safe configuration]
    SERVER[Supabase secret variables] --> EDGE[Edge Function runtime]
    EDGE --> PRIVATE[Server-side integrations]
    PUBLIC -. never contains . .-> PRIVATE
```

All environment variables in LoadSaathi are validated at runtime via **Zod** in
`src/config/env.ts`. Access them only through the validated `env` object:

```ts
import { env } from '@/config/env';
```

Never read `import.meta.env` directly outside `env.ts`.

## Variable Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (starts `pk_`) | `pk_test_...` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous (publishable) key | `eyJ...` |

### Optional

| Variable | Description |
|----------|-------------|
| `VITE_ADMIN_USER_ID` | Grants a user ID admin role access |
| `VITE_POSTHOG_API_KEY` | PostHog project API key |
| `VITE_POSTHOG_HOST` | PostHog host URL (e.g. `https://us.i.posthog.com`) |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics measurement ID (`G-...`) |

## File Convention

| File | Purpose | Committed? |
|------|---------|-----------|
| `.env.example` | Documented template with placeholders | ✅ Yes |
| `.env` | Local development secrets | ❌ No (gitignored) |
| `.env.local` | Local overrides | ❌ No (gitignored) |
| `.env.development` / `.env.production` | Build-mode overrides | ❌ Recommended against committing |
| Vercel Dashboard | Production secrets | Stored securely |

## Rules

1. **Never commit real secrets.** Only `.env.example` is safe to commit.
2. Use placeholders like `pk_test_xxxxxxxxx` in `.env.example`.
3. For Vercel, add the exact same variable names in Project Settings →
   Environment Variables (production/preview). Vercel ignores local `.env`
   files pushed to the repo.
4. Publishable keys (`pk_test_...`, Supabase anon key) may appear in client
   code because RLS protects the data. Secret keys (Clerk secret, Supabase
   service role, Gemini API key) must never reach the client.

## Supabase Edge Function Secrets

Edge function secrets (e.g., `GEMINI_API_KEY`) are stored in the Supabase
Dashboard → Edge Functions → Secrets, or via CLI:

```bash
supabase secrets set GEMINI_API_KEY=your-key
```

They are **not** part of the client env config and must never be added to
`.env` files committed to the repo.

## Adding a New Variable

1. Add it to `src/config/env.ts` with a Zod schema (and default if needed).
2. Add it to `.env.example` with a placeholder and comment.
3. Add it to this document's table.
4. Add it to the Vercel environment variables for production.
5. If used by Edge Functions, add as a Supabase secret instead.
