# Getting Started

This guide walks you through setting up the LoadSaathi codebase on your local
machine.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 22 | JavaScript runtime |
| pnpm | >= 9 | Package manager |
| Git | latest | Version control |
| Android Studio | latest | Building the Android app (optional) |
| Supabase account | — | Database + auth backend |
| Clerk account | — | Authentication service |

## 1. Clone & Install

```bash
git clone <repository-url>
cd load-saathi

# Install dependencies
pnpm install
```

## 2. Environment Variables

Copy the example env file and fill in your keys:

```bash
cp .env.example .env
```

At minimum you need:

| Variable | Where to get it |
|----------|-----------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |

Optional:

| Variable | Purpose |
|----------|---------|
| `VITE_ADMIN_USER_ID` | Grants admin role access |
| `VITE_POSTHOG_API_KEY` | PostHog analytics |
| `VITE_POSTHOG_HOST` | PostHog host URL |

See [environment-variables.md](environment-variables.md) for the full list.

> **Never commit `.env`.** The `.env.example` file is the safe template.

## 3. Start the Dev Server

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

## 4. Database Setup (Supabase)

1. Create a project in the [Supabase dashboard](https://supabase.com).
2. Run the schema against your database. The canonical schema is at:
   `src/integrations/supabase/final-schema.sql`
3. Apply any date-stamped migrations in `supabase/migrations/` that are newer
   than your last apply.
4. Enable Realtime for the tables used by the app:
   `trips`, `shipments`, `requests`, `shipment_requests`, `messages`,
   `notifications`, `driver_locations`.
5. Create a Clerk JWT template named for Supabase so Clerk tokens work with
   your Supabase project (see [authentication.md](authentication.md)).

### Applying Migrations via CLI (optional)

```bash
# From the supabase/ directory
supabase db reset
supabase db push
```

## 5. Common Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage |
| `npx cap sync` | Sync web build to Android project |
| `npx cap open android` | Open Android project in Android Studio |

## 6. Android App (Optional)

```bash
pnpm build                 # Build the web assets first
npx cap sync               # Copy web build into android/
npx cap run android        # Build & install on emulator/device
```

See [mobile-android.md](mobile-android.md) for details.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Failed to fetch dynamically imported module" | Run `pnpm run build` to regenerate bundles |
| "Clerk key missing" | Check `VITE_CLERK_PUBLISHABLE_KEY` in `.env` |
| "Supabase RLS policy violation" | Ensure user is authenticated with correct `user_type` |
| Geocoding returns null | Check city/state fields; Nominatim rate limit is 1 req/sec |
| OSRM returns no route | Coordinates may be inverted — OSRM expects lng,lat |
| GPS not updating | Browser requires HTTPS for geolocation |

See [CONTEXT.md](../CONTEXT.md) section 6 for the full troubleshooting guide.

## Next Steps

- Read the [Architecture](architecture.md) document
- Explore the [Data Models](data-models.md)
- Check the [Deployment](deployment.md) guide
