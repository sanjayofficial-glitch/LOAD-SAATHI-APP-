# Handover Checklist

> Everything you need to run, deploy, and maintain LoadSaathi. Use this when onboarding a new developer or handing off to an AI agent.

---

## Quick Start (5 Minutes)

```bash
# 1. Clone
git clone <repo-url>
cd LOAD-SAATHI-APP-1-OSRM

# 2. Install
pnpm install

# 3. Environment
cp .env.example .env
# Fill in keys (see Environment Variables below)

# 4. Run
pnpm dev
# → http://localhost:5173
```

---

## Environment Variables

### Required (app won't work without these)

| Variable | Where to Get | Notes |
|----------|-------------|-------|
| `VITE_CLERK_PUBLISHABLE_KEY` | [Clerk Dashboard](https://dashboard.clerk.com/) → API Keys | Starts with `pk_test_` or `pk_live_` |
| `VITE_SUPABASE_URL` | [Supabase Dashboard](https://supabase.com/dashboard/) → Settings → API | Format: `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Same location | Format: `eyJ...` (JWT) |

### Optional (features degrade gracefully without these)

| Variable | Where to Get | Feature |
|----------|-------------|---------|
| `VITE_POSTHOG_API_KEY` | [PostHog](https://app.posthog.com/) → Project Settings → API Key | Product analytics |
| `VITE_POSTHOG_HOST` | Same | `https://app.posthog.com` |
| `VITE_GA_MEASUREMENT_ID` | [Google Analytics](https://analytics.google.com/) | Web analytics |
| `VITE_GA4_MEASUREMENT_ID` | Same (alternative key) | GA4 |
| `VITE_SENTRY_DSN` | [Sentry](https://sentry.io/) | Error monitoring |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Cloud Console | Maps (if using Google Maps) |
| `VITE_RESEND_API_KEY` | [Resend](https://resend.com/) | Email notifications |

### Server-Side (Edge Functions only, NOT in client)

| Variable | Where | Notes |
|----------|-------|-------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | Used in Edge Functions only |
| `GEMINI_API_KEY` | Google AI Studio | For NL search parsing |
| `RESEND_API_KEY` | Resend dashboard | Email notifications |

---

## Accounts & Services

| Service | Purpose | Dashboard URL | Free Tier |
|---------|---------|---------------|-----------|
| **Clerk** | Authentication (sign-in, sign-up, JWT) | https://dashboard.clerk.com/ | 10K MAU |
| **Supabase** | Database + Realtime + Edge Functions | https://supabase.com/dashboard/ | 500MB DB, 1GB storage |
| **Vercel** | Hosting + Deployment | https://vercel.com/ | 100GB bandwidth |
| **PostHog** | Product Analytics | https://app.posthog.com/ | 1M events/mo |
| **Google Analytics** | Web Analytics | https://analytics.google.com/ | Free |
| **OSRM Public** | Route Calculation | N/A (public API) | Rate limited |
| **Nominatim** | Geocoding | N/A (public API) | 1 req/sec |
| **Gemini** | AI Search Parsing | https://aistudio.google.com/ | Free tier |

---

## Build Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `pnpm dev` | Start dev server (hot reload) | Daily development |
| `pnpm build` | Production build | Before deploy |
| `pnpm preview` | Preview production build locally | Testing build |
| `pnpm lint` | ESLint check | Before commits |
| `pnpm typecheck` | TypeScript type check | Before commits |
| `pnpm test` | Run Vitest tests | Before commits |
| `pnpm test:watch` | Run tests in watch mode | During development |
| `npx cap sync` | Sync web build to Android | After build, before Android run |
| `npx cap run android` | Run on Android emulator | Mobile testing |
| `graphify . --deep` | Generate code knowledge graph | After major changes |
| `graphify . --update` | Incremental graph update | After small changes |

---

## Deployment

### Vercel (Web)

- **Auto-deploys** from `main` branch
- Framework: Vite
- Build command: `pnpm build`
- Output: `dist`
- SPA rewrites: All routes → `index.html` (configured in `vercel.json`)

### Capacitor (Android)

```bash
# 1. Build web app
pnpm build

# 2. Sync to Android
npx cap sync

# 3. Open in Android Studio
npx cap open android

# 4. Build APK in Android Studio
# Build → Build Bundle(s) / APK(s) → Build APK(s)
```

**Android project:** `android/` directory (Capacitor-managed)

---

## Project Structure (Quick Reference)

```
src/
├── App.tsx              # Root component + ALL route definitions
├── main.tsx             # Entry point (React root)
├── routes.tsx           # Route configuration
├── globals.css          # Tailwind + CSS variables
├── pages/
│   ├── auth/            # Login, Register, ChooseRole, ForgotPassword
│   ├── messaging/       # Chat, ChatList
│   ├── account/         # Profile, Favorites, CreditScore
│   ├── trips/           # TripDetail (public)
│   ├── public/          # Marketing + info pages (30+ routes)
│   │   ├── commercial/  # Pricing, Features, ShipperSolution, TruckerSolution
│   │   ├── tools/       # FareCalculator
│   │   ├── guides/      # GuidePage (dynamic)
│   │   ├── locations/   # LocationPage (dynamic)
│   │   └── [others]     # About, Contact, FAQ, Safety, SharedTrip, etc.
│   ├── trucker/         # Dashboard, PostTrip, TruckerHub, EditTrip, BrowseShipments
│   ├── shipper/         # Dashboard, PostShipments, MyShipments, EditShipment, BrowseTrips
│   └── admin/           # Dashboard, MonitoringDashboard, UserManagement, Moderation
├── components/          # Shared UI (50+ components)
├── hooks/               # Custom hooks (useAuth, useSupabase, useSmartMatch, etc.)
├── utils/               # Utilities (matching, osrm, geocode, chat, etc.)
├── lib/                 # Libraries (gemini, posthog, analytics)
├── types/               # TypeScript types
├── contexts/            # React contexts (ThemeContext)
└── test/                # Tests (3 files)
```

---

## Known Issues & Tech Debt

| Issue | Severity | Status |
|-------|----------|--------|
| Only 3 test files — near-zero coverage | HIGH | Open |
| No CI/CD pipeline | HIGH | Open |
| CONTEXT.md directory map is stale | MEDIUM | Will be fixed |
| PostTrip/PostShipments share ~70% logic | MEDIUM | Open |
| Chat may need Firebase migration | MEDIUM | Plan exists |
| No error monitoring (Sentry) | LOW | Free tier available |
| Graphify is AST-only (no semantic) | LOW | Can run --deep |

---

## Key Files to Know

| File | Why It Matters |
|------|---------------|
| `src/App.tsx` | Root component — ALL route definitions live here |
| `src/routes.tsx` | Route configuration (imported by App.tsx) |
| `src/utils/matching.ts` | AI matching algorithm (7-factor scoring) |
| `src/utils/osrm.ts` | OSRM routing with LRU cache |
| `src/utils/geocode.ts` | Nominatim geocoding |
| `src/utils/chat.ts` | Chat utilities (Realtime, sanitization) |
| `src/lib/supabase.ts` | Supabase client factories (anon + Clerk-authenticated) |
| `src/lib/gemini.ts` | Gemini AI for NL search parsing |
| `src/hooks/useAuth.ts` | Auth context hook |
| `src/hooks/useSupabase.ts` | Authenticated Supabase client hook |
| `src/hooks/useSmartMatch.ts` | Smart matching hook |
| `src/types/index.ts` | TypeScript type definitions |
| `src/integrations/supabase/final-schema.sql` | Full DB schema + RLS policies |
| `CONTEXT.md` | AI agent context (architecture overview) |
| `REPO_HANDBOOK.md` | Master handover document |
| `AI_RULES.md` | Rules for AI coding agents |

---

## Team

| Name | Role | GitHub |
|------|------|--------|
| Sanjaya Sahu | Founder / CEO | @SanjayaSahu2006 |
| Prince Mallik | Developer | @prince-dev07 |
| Jaydev Suna | Developer | @thejaydev |

---

## Emergency Contacts

| Issue | Where to Look |
|-------|--------------|
| Auth not working | Check `VITE_CLERK_PUBLISHABLE_KEY` in `.env` |
| Database errors | Check Supabase dashboard → SQL Editor |
| Route not loading | Check route definition in `src/App.tsx` |
| Build failing | Run `pnpm lint` + `pnpm typecheck` to find errors |
| Android crash | Check `android/` directory, run `npx cap sync` |
| Realtime not working | Check Supabase dashboard → Database → Replication |

---

*Last verified: 2026-08-24*
