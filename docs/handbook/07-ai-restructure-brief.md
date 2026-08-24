# AI Restructure Brief

> Copy-paste this entire document to an AI coding agent (Cursor, Claude, Devin, Windsurf) to restructure and improve the LoadSaathi repository.

---

## Safe AI change loop

```mermaid
flowchart LR
    READ[Read handbook and context] --> SCOPE[Choose a narrow improvement]
    SCOPE --> PRESERVE[Preserve flows, routes, and integrations]
    PRESERVE --> IMPLEMENT[Implement and document]
    IMPLEMENT --> VERIFY[Lint, typecheck, test, and build]
    VERIFY --> REVIEW[Human review and handoff]
```


## Mission

Restructure the LoadSaathi repository to be better organized, properly documented, and ready for team handoff. Fix known issues, reduce duplication, and set up quality infrastructure.

**Do NOT change business logic.** Only restructure, document, and add infrastructure.

---

## Current State (Problems to Fix)

1. **`CONTEXT.md` is stale** — Directory map doesn't match actual structure (`pages/auth/`, `pages/messaging/`, `pages/public/{commercial,tools,...}` are missing)
2. **No CI/CD** — No `.github/workflows/` directory, no automated quality gates
3. **Near-zero tests** — Only 3 test files exist (`utils.test.ts`, `chat.test.ts`, `agentic-readiness.test.ts`)
4. **Code duplication** — `PostTrip.tsx` and `PostShipments.tsx` share ~70% logic
5. **Graphify is AST-only** — No semantic extraction for AI agent understanding
6. **No error monitoring** — No Sentry or structured error logging
7. **README CI badge** — Points to non-existent workflow

---

## Target State

After restructuring, the repo should have:

- [ ] Accurate `CONTEXT.md` with correct directory map
- [ ] GitHub Actions CI running lint + typecheck + test on every PR
- [ ] Unit tests for core utilities (matching, geocode, osrm, chat, notifications)
- [ ] Shared form components extracted from PostTrip/PostShipments
- [ ] Graphify re-run with `--deep` for semantic understanding
- [ ] Sentry error monitoring (free tier)
- [ ] Updated README with correct CI badge
- [ ] `.env.example` file documenting required env vars

---

## Step-by-Step Instructions

### Step 1: Fix CONTEXT.md

Replace the stale directory map in `CONTEXT.md` with the corrected version from `docs/handbook/02-architecture-and-stack.md` (the "Directory Map" section).

Key changes:
- `pages/Index.tsx` → `pages/public/Index.tsx`
- `pages/Login.tsx` → `pages/auth/Login.tsx`
- `pages/Chat.tsx` → `pages/messaging/Chat.tsx`
- Add `pages/public/commercial/`, `pages/public/tools/`, `pages/public/guides/`, `pages/public/locations/`
- Add `pages/account/` (Profile, Favorites, CreditScore)
- Add `pages/trips/` (TripDetail)
- Fix `src/routes.tsx` reference (not in App.tsx)

### Step 2: Set Up GitHub Actions CI

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

### Step 3: Add Unit Tests

Create test files for core utilities:

**`src/utils/__tests__/matching.test.ts`**
- Test `calculateMatchScore()` with various inputs
- Test `getMatchLabel()` tier boundaries
- Test edge cases (missing data, zero values)

**`src/utils/__tests__/geocode.test.ts`**
- Test `geocodeCity()` with known cities
- Test cache behavior
- Test rate limiting

**`src/utils/__tests__/osrm.test.ts`**
- Test `getRoute()` with known routes
- Test LRU cache
- Test error handling

**`src/utils/__tests__/chat.test.ts`** (expand existing)
- Test message sanitization
- Test character limit enforcement
- Test Realtime subscription setup

**`src/utils/__tests__/notifications.test.ts`**
- Test notification creation
- Test RPC calls

### Step 4: Extract Shared Form Logic

Create `src/components/shared/TripShipmentForm.tsx` — extract common logic from `PostTrip.tsx` and `PostShipments.tsx`:

- City selection with geocoding
- OSRM route calculation
- Form validation schema (Zod)
- Price/capacity inputs
- Departure date picker

Keep role-specific fields in the original components but share the 70% common logic.

### Step 5: Run Graphify Deep

```bash
# Full semantic extraction (costs Claude tokens)
graphify . --deep

# Generate SVG for documentation
graphify . --svg
```

Update `graphify-out/GRAPH_REPORT.md` with new results.

### Step 6: Add Error Monitoring

Create `src/lib/sentry.ts`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});
```

Add to `src/main.tsx` early in the provider chain.

**Free tier:** Sentry 5K events/month at $0.

### Step 7: Create .env.example

Create `.env.example`:
```bash
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# PostHog
VITE_POSTHOG_API_KEY=phc_...
VITE_POSTHOG_HOST=https://app.posthog.com

# Google Analytics
VITE_GA_MEASUREMENT_ID=G-...

# Sentry (optional)
VITE_SENTRY_DSN=https://...

# Gemini (Edge Function handles this server-side)
# No client-side key needed
```

### Step 8: Update README

- Fix CI badge to point to new workflow
- Add link to `REPO_HANDBOOK.md`
- Update "Documentation" table to include handbook

---

## Coding Conventions to Enforce

1. **TypeScript strict** — no `any` types
2. **React functional components** — no class components
3. **Tailwind CSS only** — no inline styles, no CSS modules
4. **React Hook Form + Zod** — for all forms
5. **TanStack React Query** — for all server state
6. **Clerk auth** — use `useSupabase()` hook for DB operations
7. **File naming:** PascalCase components (`.tsx`), camelCase utils (`.ts`)
8. **No secrets in code** — all env vars via `import.meta.env`

---

## What NOT to Change

- Business logic (matching algorithm, credit score calculation, etc.)
- Database schema (unless adding new tables)
- Route structure (URL paths)
- External service integrations (Clerk, Supabase, OSRM, etc.)
- UI design/styling (unless fixing bugs)

---

## Verification Checklist

After restructuring, verify:

- [ ] `pnpm lint` passes (no errors)
- [ ] `pnpm typecheck` passes (no errors)
- [ ] `pnpm test` passes (all tests green)
- [ ] `pnpm build` succeeds (production build works)
- [ ] `CONTEXT.md` directory map matches actual structure
- [ ] `.github/workflows/ci.yml` exists and is valid
- [ ] All new test files have at least 5 test cases each
- [ ] Shared form component extracted and used by both PostTrip and PostShipments
- [ ] `.env.example` documents all required env vars
- [ ] README CI badge points to new workflow
- [ ] graphify-out/ updated with `--deep` results

---

## Expected Outcome

A repository that is:
1. **Well-documented** — Any developer (or AI agent) can understand the codebase in <30 minutes
2. **Properly tested** — Core utilities have unit tests, CI catches regressions
3. **Well-organized** — No duplicated logic, clear separation of concerns
4. **Production-ready** — Error monitoring, CI/CD, proper env management
5. **AI-agent-friendly** — Rich graphify graph for AI context, accurate CONTEXT.md

---

*Brief version: 1.0 | Last verified: 2026-08-24*
