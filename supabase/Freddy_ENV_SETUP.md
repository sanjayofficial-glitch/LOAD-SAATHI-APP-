# Freddy Chatbot Environment Setup

## Required Environment Variables (Supabase Edge Functions Dashboard)

These must be set in **Supabase Dashboard → Edge Functions → Settings → Environment Variables**:

| Variable | Value | Purpose |
|----------|-------|---------|
| `FREDDY_ENABLED` | `true` | Enable the Freddy chatbot (kill switch) |
| `FREDDY_MEMORY_ENABLED` | `true` | Enable server-side conversation memory |
| `FREDDY_JWT_SECRET` | (Clerk JWT secret) | JWT verification secret |
| `FREDDY_EXPECTED_ISSUER` | (Clerk issuer URL) | Expected JWT issuer |
| `FREDDY_EXPECTED_AUDIENCE` | (Clerk audience) | Expected JWT audience |
| `GEMINI_API_KEY` | (Google AI key) | LLM intent parsing (optional — keyword fallback works without) |

## How to Get Clerk JWT Values

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → Your app → API Keys
2. Copy the **JWT Secret** → `FREDDY_JWT_SECRET`
3. Copy the **Issuer** URL (e.g., `https://your-app.clerk.accounts.dev`) → `FREDDY_EXPECTED_ISSUER`
4. Copy the **Audience** (e.g., `https://your-app.clerk.accounts.dev`) → `FREDDY_EXPECTED_AUDIENCE`

## Database Migration

The `freddy_sessions` table is created by:
```
supabase/migrations/20261103000000_freddy_sessions.sql
```

Apply it with:
```bash
cd supabase
supabase db push
```

Or run the SQL directly in Supabase SQL Editor.

## Client-Side (Optional)

For local development, add to `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

These are already in `.env` for the main app.
