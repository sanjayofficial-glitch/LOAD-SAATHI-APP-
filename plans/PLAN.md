# LoadSaathi Deployment Audit & Fix Plan

> **Date:** 2026-09-18
> **Status:** Ready to execute
> **Scope:** Fix deployed 404 on login + release hygiene

---

## 1. Problem Summary

The deployed site (`loadsaathi.in`) returns a **404 Page Not Found** when users attempt to sign in or login. The error page is the static `public/404.html`, not the React `NotFound.tsx` component — meaning the Vercel Edge function (`api/agent.js`) is rejecting the route server-side before the SPA even loads.

---

## 2. Root Causes Identified

### 2.1 — Clerk Missing Route Props (P0 — Auth 404)

**File:** `supabase/src/App.tsx:40-47`

`ClerkProvider` is missing `signInUrl`, `signUpUrl`, and `ssoCallbackUrl` props. Clerk defaults to `/sign-in`, `/sign-up`, and `/sso-callback` — none of which exist in the Edge function's `EXACT_ROUTES` or `PREFIXES` allow-list (`api/agent.js:4-68`). When OAuth triggers `sso-callback`, Edge returns `404.html` with HTTP 404.

**Fix:** Add to `ClerkProvider`:
```tsx
signInUrl="/login"
signUpUrl="/register"
ssoCallbackUrl="/sso-callback"
```

### 2.2 — Edge Allow-List Gap (P0 — Hard Refresh 404)

**File:** `api/agent.js:4-68`

`EXACT_ROUTES` covers `/login`, `/register`, `/choose-role`, `/onboarding` but is **missing**:
- `/sso-callback` (Clerk OAuth exchange)
- `/sign-in`, `/sign-up` (Clerk defaults)

`PREFIXES` is also missing `/tools/` — 9 new tool routes will 404 on hard refresh / SEO crawl.

**Fix:** Add to `EXACT_ROUTES`: `/sso-callback`, `/sign-in`, `/sign-up`
Add to `PREFIXES`: `/tools/`, `/sso-callback/`, `/sign-in/`, `/sign-up/`

### 2.3 — Vercel Config (P1 — Future Breakage)

**File:** `vercel.json:6,56-65`

- `cleanUrls: true` adds unnecessary 308 redirects and may interfere with SPA routing.
- Uses deprecated `routes` instead of `rewrites` (Vercel may drop support).

**Fix:** Set `cleanUrls: false` (or remove), migrate `routes` → `rewrites`.

---

## 3. Additional Findings (Ship or Defer)

| ID | Severity | File | Issue |
|----|----------|------|-------|
| C1 | Critical | `types/index.ts:15-19` | 5 new User columns (`rc_document_url`, etc.) added to types but **no DB migration exists**. `Profile.tsx` doc upload will crash at runtime. |
| C2 | Critical | `routes.tsx:80-88` | Imports 9 new tool components — those files are **untracked**. Committing `routes.tsx` alone breaks `vite build`. |
| C3 | Critical | `api/agent.js:46` | `PREFIXES` missing `/tools/` → 9 tool pages 404 on hard refresh. `sitemap.xml` also missing those 9 URLs. |
| C4 | High | `App.tsx:111` | `<SimpleLabelsProvider value={{}}>` overwrites default Hindi labels → no Hindi renders. |
| C5 | High | `RoleProtectedRoute.tsx:27-29` | Unauthed users bounce to `/` instead of `/login` — hides auth failure. |
| C6 | High | `ChooseRole.tsx:112-124` | `justSelectedRef` set after `setProfile` → race causes double navigate. |
| C7 | Medium | `AuthContext.tsx:52-69` | Single retry on token failure, `supabaseTokenRef` not cleared on signOut → token leak. |
| C8 | Medium | `index.html:282-291` | SSR fallback thinned from 500+ chars to 15 chars — SEO trust anchors lost. |
| C9 | Medium | `CONTEXT.md:64,636,664` | Still references `src/` not `supabase/src/` — docs drift. |
| C10 | Low | `demand-forecast/index.ts:69` | `allowPublic:true` bypasses JWT — any caller can hit service role. |

---

## 4. Execution Plan

### Phase 1 — Hotfix Auth 404 (P0, ship alone)

| Step | File | Change | Verify |
|------|------|--------|--------|
| 1 | `supabase/src/App.tsx:40` | Add `signInUrl="/login" signUpUrl="/register"` to `ClerkProvider` | — |
| 2 | `api/agent.js:4-52` | Add `/sso-callback`, `/sign-in`, `/sign-up` to `EXACT_ROUTES` | — |
| 3 | `api/agent.js:55-68` | Add `/tools/`, `/sso-callback/`, `/sign-in/`, `/sign-up/` to `PREFIXES` | — |
| 4 | `supabase/src/pages/auth/Login.tsx:21` | Guard `useEffect` with `if (!isLoaded \|\| profileLoading) return;` before `navigate` | — |
| 5 | `supabase/src/pages/auth/Register.tsx:30` | Same guard | — |
| 6 | `vercel.json:6` | Remove `"cleanUrls": true` | — |
| 7 | `vercel.json:56-65` | Migrate `routes` → `rewrites` (same regex, same destination) | `pnpm run build && pnpm run typecheck` |

**Smoke test (local):**
```
pnpm run preview
# Hard-refresh /login → should serve index.html 200
# Hard-refresh /choose-role → 200
# Hard-refresh /sso-callback → 200 (not 404.html)
# /tools/gst-calculator → 200
```

**Deploy:** Push to `main` → Vercel auto-deploys → test live `/login` + Google OAuth end-to-end.

---

### Phase 2 — DB Migration for New Columns (P0, before next deploy)

| Step | Action | Verify |
|------|--------|--------|
| 1 | Create migration: `ALTER TABLE users ADD COLUMN rc_document_url text, insurance_document_url text, mentor_requested boolean DEFAULT false, mentor_id text, sms_opt_in boolean DEFAULT false;` | `supabase db push` or deploy migration |
| 2 | Add storage bucket `user-documents` with RLS (users read/write own files) | `supabase storage ls` |
| 3 | OR: Revert `types/index.ts:15-19` if doc upload is not shipping yet | `pnpm run typecheck` |

---

### Phase 3 — Atomic Commit Bundle

**All modified + untracked source files must ship together.** Commit order:

```
# Stage everything atomically
git add supabase/src/routes.tsx
git add supabase/src/pages/public/tools/*.tsx   # 9 files
git add supabase/src/components/*.tsx           # 7 new components
git add supabase/src/contexts/*.tsx             # AudioGuideContext, SimpleLabelsContext
git add supabase/src/data/*.ts                  # tollData, driverWages, vehicleDimensions, requiredDocuments
git add api/agent.js
git add vercel.json
git add supabase/src/App.tsx
git add supabase/src/pages/auth/Login.tsx
git add supabase/src/pages/auth/Register.tsx
git add supabase/src/pages/auth/ChooseRole.tsx
git add supabase/src/components/RoleProtectedRoute.tsx
git add public/sitemap.xml
git add public/llms.txt
git add index.html
git add supabase/src/types/index.ts
git add globals.css
git add supabase/src/utils/analytics.ts
# ... plus other modified files as needed
```

---

### Phase 4 — SEO & Content Fixes (P1)

| Step | File | Change |
|------|------|--------|
| 1 | `public/sitemap.xml` | Add 9 `/tools/*` URLs |
| 2 | `public/llms.txt` | Update tools list |
| 3 | `index.html:282-291` | Restore or replace SSR fallback content (500+ chars for trust/SEO) |
| 4 | `CONTEXT.md` | Replace all `src/` references with `supabase/src/` |

---

### Phase 5 — Remaining High Fixes (P1)

| Step | File | Change |
|------|------|--------|
| 1 | `App.tsx:111` | `<SimpleLabelsProvider value={HINDI_LABELS}>` (import from context) |
| 2 | `RoleProtectedRoute.tsx:28` | `Navigate to="/login"` instead of `"/"` |
| 3 | `ChooseRole.tsx:112` | Set `justSelectedRef.current = true` **before** `setProfile` |
| 4 | `AuthContext.tsx:207-220` | Clear `supabaseTokenRef` on signOut |

---

### Phase 6 — Deploy & Verify

```bash
pnpm run check          # lint + typecheck + test + build
git commit -m "fix: resolve auth 404 + ship tool calculators + DB migration"
git push origin main    # triggers Vercel deploy
```

**Post-deploy verification:**
- [ ] `/login` hard-refresh → 200, not 404
- [ ] Google OAuth sign-in → redirects to `/choose-role` → dashboard
- [ ] Email/password sign-in → same flow
- [ ] `/tools/gst-calculator` hard-refresh → 200
- [ ] `robots.txt` + `sitemap.xml` served correctly
- [ ] No console errors (Clerk env, Supabase token)
- [ ] `llms.txt` + `pricing.md` updated

---

## 5. Files Affected (Complete List)

### Modified (35)
`api/agent.js`, `index.html`, `vercel.json`, `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `tsconfig.json`, `globals.css`, `capacitor.config.ts`, `supabase/src/App.tsx`, `supabase/src/main.tsx`, `supabase/src/routes.tsx`, `supabase/src/types/index.ts`, `supabase/src/utils/analytics.ts`, `supabase/src/pages/auth/ChooseRole.tsx`, `supabase/src/pages/account/Profile.tsx`, `supabase/src/pages/admin/GalleryManager.tsx`, `supabase/src/pages/public/About.tsx`, `supabase/src/pages/public/FAQ.tsx`, `supabase/src/pages/public/Gallery.tsx`, `supabase/src/pages/public/HowItWorks.tsx`, `supabase/src/pages/public/Pricing.tsx`, `supabase/src/pages/public/RouteDetail.tsx`, `supabase/src/pages/public/FareCalculator.tsx`, `supabase/src/pages/shipper/BrowseTrips.tsx`, `supabase/src/pages/shipper/PostShipments.tsx`, `supabase/src/pages/trucker/BrowseShipments.tsx`, `supabase/src/pages/trucker/PostTrip.tsx`, `supabase/src/pages/trucker/TruckerHub.tsx`, `supabase/src/pages/trucker/TruckerTripDetail.tsx`, `supabase/functions/demand-forecast/index.ts`, `features/home/sections/HeroSection.tsx`, `features/shipper/components/LiveTruckMap.tsx`, `hooks/useTripMapMarkers.ts`, `.claude/skills/*` (5 files)

### Untracked (41)
**Source (25 — must ship together):**
- `supabase/src/pages/public/tools/*` — 9 calculator components
- `supabase/src/components/*` — FloatingWhatsAppButton, LoadCardStack, PriceTrendChart, ReturnLoadProbability, SimpleLabel, VoiceGuide, VoiceLocationInput
- `supabase/src/contexts/*` — AudioGuideContext, SimpleLabelsContext
- `supabase/src/data/*` — tollData, driverWages, vehicleDimensions, requiredDocuments

**Docs/Skills (16 — safe to ship separately):**
- `.claude/skills/*` — 16 skill markdown files
- `.kilo/plans/*` — 3 plan files (ignore)

---

## 6. Risk Assessment

| Scenario | Risk | Mitigation |
|----------|------|------------|
| Ship `routes.tsx` without 9 tool files | Build breaks | Atomic commit (Phase 3) |
| Ship `types/index.ts` without DB migration | Runtime crash on doc upload | Phase 2 first, or revert types |
| Ship without Phase 1 hotfix | 404 persists on login | Phase 1 is mandatory first |
| Partial commit of `api/agent.js` | Edge routing regression | Ship `agent.js` + `vercel.json` together |
| `SimpleLabelsProvider value={{}}` | Hindi broken for all users | Phase 5 fix before or with release |

---

## 7. Decision Points (User Input Required)

Before executing, confirm:

1. **Auth 404 fix scope:** Ship Phase 1 (hotfix only) first, or bundle with Phase 2-5?
2. **DB migration:** Does `rc_document_url` / `insurance_document_url` / `mentor_*` / `sms_opt_in` need to ship now, or can we revert those types and defer?
3. **`demand-forecast` auth bypass (C10):** Leave `allowPublic:true` for now, or fix to require admin token?
4. **`index.html` SSR fallback (C8):** Restore original 500+ char content, or keep minimal and update CONTEXT.md?
