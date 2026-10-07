# LoadSaathi Whole-Codebase Audit Report

**Date:** 2026-09-29
**Scope:** Entire repository — `supabase/src/` (SPA + hooks + pages), `supabase/functions/` (15 edge functions), `supabase/migrations/` (51 files) + `supabase/FULL_REPAIR.sql`, `api/` (Vercel functions), `scripts/`, `.github/workflows/`, `android/`, docs (`README.md`, `CONTEXT.md`, `docs/**`, `SECURITY.md`), `vercel.json`, `public/`.
**Method:** 9-domain parallel read-only agent swarm (queen-led), each domain assigned an ID prefix; all findings re-verified against the files with `file:line` evidence. Baseline tooling run before the sweep.
**Constraints honored:** read-only (no fixes, no commits, no SQL executed); only this file was written; pre-existing dirty file `docs/How to Implement Accurate Pricing in India for Apps/index.ts` left untouched.

**Severity definitions**

| Sev | Meaning |
|---|---|
| **P0** | Exploitable security hole, or code that is unconditionally broken (crash / always-throws / build-breaking) |
| **P1** | High-impact defect: privilege/data exposure, untested security-critical code, or silent data loss |
| **P2** | Real defect with bounded blast radius, or high-value docs/UX/perf drift |
| **P3** | Hardening, hygiene, low-impact drift |

---

## 1. Scorecard

| Domain | Prefix | P0 | P1 | P2 | P3 | Total | Headline |
|---|---|---:|---:|---:|---:|---:|---|
| Security / RLS | SEC | 1 | 1 | 6 | 3 | **11** | Any signed-up user can self-promote to `admin` |
| Edge functions | EDGE | 2 | 3 | 6 | 7 | **18** | One function has a compile-blocking duplicate `const`; another always throws |
| Database / migrations | DB | 0 | 1 | 1 | 1 | **3** (+1 clean) | 9 client-called RPCs exist only outside migrations; `users.city` has no migration source |
| App quality | APP | 0 | 0 | 2 | — | **2** (+lost P3 tail) | No-op profile refresh; global users-read policy |
| Performance / bundle | PERF | 2 | 0 | 2 | 2 | **6** | `/routes/:slug` ships 612 KB gzip |
| SEO / AEO | SEO | 0 | 0 | 4 | 2 | **6** | Homepage has no `<noscript>` (AEO rule 1) |
| Testing / CI | TEST | 0 | 4 | 6 | 4 | **14** | `pnpm build` cannot complete — CI job cancels at 30 min with 0/179 routes prerendered; coverage provider not installed; Deno tests never run; one suite is a tautology |
| Data layer | DATA | 0 | 6 | 8 | 6 | **20** | Admin moderation treats failed updates as success |
| Docs / deployment | DOC | 0 | 1 | 12 | 8 | **21** | Documented security headers absent from `vercel.json` |
| **Total** | | **5** | **16** | **47** | **33** | **101** | |

---

## 2. P0 findings (fix first)

| ID | Title | Evidence | Impact | Fix |
|---|---|---|---|---|
| **SEC-01** | Self-service privilege escalation to `admin` | `supabase/migrations/20250601_baseline_schema.sql:52` (CHECK allows `user_type='admin'`); `20260918_fix_rls_initplan_performance.sql:294-303`; `20260927_tighten_overly_permissive_rls_policies.sql:174-193`; client vector `supabase/src/pages/account/Profile.tsx:196-217` | Any authenticated user UPDATEs their own row → `user_type='admin'` → full admin surface. Complete authz bypass. | Constrain self-UPDATE `WITH CHECK` to `user_type = 'trucker'|'shipper'`; forbid `admin` in the CHECK; add a server-side guard (RPC or trigger) so role changes are admin-only. |
| **EDGE-01** | Duplicate `const` — function cannot parse | `supabase/functions/gemini-proxy/index.ts:34-35` and `:171-172` | `gemini-proxy` fails at deploy/parse → price prediction + NL search broken. | Delete the duplicate declarations. |
| **EDGE-02** | `price-predict` corridor path always throws | `supabase/functions/price-predict/index.ts:801,802,846` (`weight` out of scope), `:808,:813` (`fb` null deref) | Corridor pricing requests deterministically 500. | Hoist `weight` into scope; null-guard `fb` before dereference. |
| **PERF-01** | Homepage first-load 1320 KB raw / 410 KB gzip | `posthog-js` 252 KB + `vendor-supabase` 215 KB eagerly in entry; measured bundle | Mobile first paint on Indian 4G far past budget; SEO/LCP regression. | Lazy-init PostHog after first interaction/idle; split Clerk/Supabase vendor chunks; defer analytics. |
| **PERF-02** | `/routes/:slug` ships 2081 KB raw / 612 KB gzip | `supabase/src/pages/public/RouteDetail.tsx:8` imports `@/data/blog` (blog chunk 312 KB) + `recharts` 407 KB | Worst page in the app; route detail is a top acquisition page. | Split blog data per-slug; `React.lazy` Recharts (only used by `PriceTrendChart`); preload on hover. |

---

## 3. P1 findings

| ID | Title | Evidence | Fix |
|---|---|---|---|
| **SEC-02** | Pricing tables writable by any authenticated user (`FOR ALL USING(true)`; earlier DROPs missed by name mismatch) | `supabase/migrations/20260801_pricing_engine_v2.sql:99` | Replace with role-scoped policies; drop stray `FOR ALL` policies by identity, not name. |
| **EDGE-03** | `fraud-detect` honors client-supplied `userId` over JWT (IDOR via service-role reads) | `supabase/functions/fraud-detect/index.ts:113` | Derive user from JWT; ignore body `userId` unless admin. |
| **EDGE-04** | `fetch-diesel-price`: no auth, no rate limit, triggers service-role upserts | `supabase/functions/fetch-diesel-price/index.ts:153` | Require auth or cron secret + rate limit. |
| **EDGE-18** | `demand-forecast` `allowPublic:true` — unauthenticated AI endpoint | `supabase/functions/demand-forecast/index.ts:69,21,76`; callers `PriceTrendChart.tsx:33-37` ← `RouteDetail.tsx:478`, `FareCalculator.tsx:611` | Add anonymous rate limit or move behind auth; keep public read of *cached* results instead. |
| **DB-01** | 9 client-called RPCs exist only in `supabase/FULL_REPAIR.sql`, not in any of the 51 migrations; migrations `REVOKE` assuming they exist | RPCs: `delete_trip`(:567), `delete_shipment`(:591), `mark_all_notifications_read`(:724), `upsert_team_member`(:742), `delete_team_member`(:791), `reorder_team_members`(:809), `upsert_gallery_image`(:832), `delete_gallery_image`(:879), `reorder_gallery_images`(:897); REVOKEs at `20260918_revoke_anon_privileges.sql:32,48`, `20260927_harden_security_definer_and_user_profiles_view.sql:14`, `20260927_tighten_overly_permissive_rls_policies.sql:47`; callers `TeamManager.tsx:102,117`, `NotificationBell.tsx:115` | Port all 9 RPC definitions into timestamped migrations; fresh `supabase db reset` must pass. |
| **TEST-01** | Coverage silently broken: `@vitest/coverage-v8` not in devDependencies, no thresholds, no CI gate | `package.json` (only `vitest`), `pnpm test:coverage` fails | Add provider + thresholds + CI step. |
| **TEST-02** | 41 `Deno.test` cases in `pricing_test.ts` never run (no vitest glob, no Deno CI job) | `supabase/functions/**/pricing_test.ts` | Add a `deno test` CI job. |
| **TEST-03** | Chat test is tautological — tests `sanitizeContent` copy, real fn not exported | `supabase/src/test/chat.test.ts` vs `supabase/src/utils/chat.ts` | Export the real function; test it. |
| **TEST-13** | `pnpm build` cannot complete — missing build-time `VITE_*` env makes prerender burn 40 s × 179 routes; CI cancels at 30 min with 0 routes rendered | `supabase/src/config/env.ts:22,29,35` (`validateEnv()` throws at module load; no `.env` in repo, only `.env.example`); `dist/assets/env-CL3f2zya.js` (all six keys compiled to `void 0`); `scripts/prerender.mjs:144` (`READY_TIMEOUT_MS = 40_000`) × 179 routes; CI runs `36330341437`, `36327507412` cancelled at ~30 m (`ci.yml:20` `timeout-minutes: 30`; misdiagnosis comment `ci.yml:17-19` blames slow runner); prerender log shows only 4 lines (start, Chrome, 179 routes, SPA server) then 29 min of silence; `dist/.prerender-status.json` = `success:0, failed:0, skipped:1` | Provide `VITE_*` env to the build (CI `env:`/secrets, `.env` locally); make `validateEnv()` fail fast at build start instead of at React mount; then re-run `pnpm build`. |
| **DATA-01** | Public Gallery page reads DB via anon client (only anon-client DB op in repo) | `supabase/src/pages/public/Gallery.tsx:38` | Serve via RLS-scoped read or edge function; verify anon SELECT policy. |
| **DATA-02** | Bulk cancel counts PostgREST error-resolves as success | `supabase/src/pages/admin/Moderation.tsx:147` (`Promise.allSettled` without status check) | Inspect each result's `error`; report failures. |
| **DATA-03** | Monitoring dashboard re-fetches full `trips` + `shipments` with star-joins every 30 s | `supabase/src/pages/admin/MonitoringDashboard.tsx:63` (destructure `{error}` at `:71`) | Aggregate in an RPC; select only needed columns. |
| **DATA-04** | Aggregates all `requests` in JS; errors swallowed, never set error state | `MonitoringDashboard.tsx:147`, catch at `:215` | Move aggregation server-side; surface errors. |
| **DATA-05** | `sms_opt_in` toggle update error unchecked | `supabase/src/pages/account/Profile.tsx:597` | Check `.error`, revert UI + toast on failure. |
| **DATA-06** | Linked shipment status update silently ignored | `supabase/src/pages/trucker/TruckerTripDetail.tsx:118` | Check update result; block/warn on failure. |
| **DOC-01** | Security headers documented but absent from actual config | `docs/deployment.md:27-28`, `docs/architecture.md:36,275`, `SECURITY.md:51-52` vs `vercel.json` | Add the headers to `vercel.json` (or fix docs — headers preferred). |

---

## 4. Findings by domain

### 4.1 Security (SEC) — 11 findings

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| SEC-01 | P0 | Self-service privilege escalation (see §2) | baseline_schema.sql:52; 20260927_tighten…:174-193; Profile.tsx:196-217 |
| SEC-02 | P1 | Pricing tables writable by authenticated (`FOR ALL USING(true)`) | 20260801_pricing_engine_v2.sql:99 |
| SEC-03 | P2 | `notifications` INSERT "for others" policy `WITH CHECK (true)` never dropped | 20260807_fix_rls_trucker_trip_actions.sql:24 |
| SEC-04 | P2 | `users` SELECT `USING(true)` exposes email/phone to all authenticated | 20260816_security_hardening.sql:83 (= final-schema.sql:301; dup of APP-02) |
| SEC-05 | P2 | `credit_scores_select_all` grants SELECT on all credit scores | 20260702_credit_scores.sql:256 |
| SEC-06 | P2 | storage.objects gallery policies permit broad public bucket access | 20260803_gallery_and_team.sql:66 |
| SEC-07 | P2 | `load_locations` SELECT `USING(true)` exposes all driver locations | 20260805_add_trip_context_to_driver_locations.sql:42 |
| SEC-08 | P2 | `fraud-detect` accepts arbitrary `body.userId` — checks run against any user | supabase/functions/fraud-detect/index.ts:113 (same root as EDGE-03) |
| SEC-09 | P3 | Cron route auth optional — skips check when `CRON_SECRET` unset | api/cron/diesel.js:21 |
| SEC-10 | P3 | Deep-link path passed to `location.replace` can be protocol-relative (`//host`) | supabase/src/utils/capacitorOAuth.ts:46 |
| SEC-11 | P3 | Active trips readable by anon (`USING(true)`) | 20260806_fix_trips_read_access.sql:41 |

**Fix order:** SEC-01 → SEC-02 → SEC-03/04/05/07 (column-scoped reads) → SEC-06/08 → P3s.

### 4.2 Edge functions (EDGE) — 18 findings

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| EDGE-01 | P0 | Duplicate `const` (see §2) | gemini-proxy/index.ts:34-35,171-172 |
| EDGE-02 | P0 | Corridor path always throws (see §2) | price-predict/index.ts:801,802,808,813,846 |
| EDGE-03 | P1 | Client `userId` beats JWT (IDOR) | fraud-detect/index.ts:113 |
| EDGE-04 | P1 | `fetch-diesel-price` unauthenticated + unrate-limited service-role upserts | fetch-diesel-price/index.ts:153 |
| EDGE-18 | P1 | `demand-forecast` allowPublic (see §3) | demand-forecast/index.ts:69,21,76 |
| EDGE-05 | P2 | `get-fuel-price` no auth/rate limit — open service-role query | get-fuel-price/index.ts:6 |
| EDGE-06 | P2 | `fraud-detect` rules 1–3 dead code — PostgREST GET returns array, destructured as object | fraud-detect/index.ts:117 |
| EDGE-07 | P2 | `gemini-proxy` instructs model to fabricate "realistic" search results returned as data | gemini-proxy/index.ts:46 |
| EDGE-08 | P2 | Gemini API key passed in URL query string (logs/proxies) | credit-insights/index.ts:78 |
| EDGE-09 | P2 | `price-predict` accepts anonymous callers — JWT check only runs when Bearer present | price-predict/index.ts:679 |
| EDGE-10 | P2 | `demand-forecast` returns hardcoded `predictedDemand:5`, `price:2500` | demand-forecast/index.ts:183 |
| EDGE-11 | P3 | Client-controlled `userName` interpolated into Gemini prompt | credit-insights/index.ts:45 |
| EDGE-12 | P3 | CORS `Allow-Methods` omits DELETE (admin-secrets preflight fails) | edgeHelpers.ts:18 |
| EDGE-13 | P3 | Rate limit keyed on first `X-Forwarded-For` hop — spoofable | edgeHelpers.ts:33 |
| EDGE-14 | P3 | `rateLimitMap` unbounded — memory growth per IP | edgeHelpers.ts:43 |
| EDGE-15 | P3 | Ownership checked before null check → 403 instead of 400 | credit-score/index.ts:49 |
| EDGE-16 | P3 | Silently returns fake score **550** when calculation RPC fails | credit-score/index.ts:112 |
| EDGE-17 | P3 | Upstream `lastError` detail leaked in 500 responses | admin-secrets/index.ts:185 |

*Verified clean: `match-ml`; all 15 functions have `verify_jwt`/admin checks at the platform layer.*

### 4.3 Database & migrations (DB) — 4 entries

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| DB-01 | P1 | 9 client-called RPCs live only in `FULL_REPAIR.sql` (see §3) | FULL_REPAIR.sql:567-897; REVOKEs in 3 migrations; callers TeamManager/NotificationBell |
| DB-04 | P2 | **`users.city` has no migration source** — 3 independent checks (ALTER-scan windows, ADD COLUMN grep, column-def scan) found nothing; only `fuel_prices.city` and `driver_locations` are in migrations; yet `ShipmentDetail` ships `shipper:users!…(*)` | `supabase/src/pages/shipper/ShipmentDetail.tsx:69,463`; baseline `CREATE TABLE users` at `20250601_baseline_schema.sql:49-61`; `20260905_fix_fuel_prices_and_add_missing_tables.sql:14` |
| DB-03 | P3 | Trigger WHEN-clause regression: hardening file creates rating triggers **with** `WHEN`, standalone variant drops/recreates **without** (runs last lexicographically) — correctness kept, wasted recomputes | `20260816_security_hardening.sql:240-253` vs `20260816_security_hardening_standalone.sql:159-170` |
| DB-02 | — | **Verified clean:** realtime publication covers all 8 client tables | `20260927153000_restore_realtime_publication.sql` + baseline |

**Other DB verified-clean:** messages/notifications index coverage good (`idx_notifications_user_id/is_read/type`, partial `idx_notifications_user_unread`, `idx_notifications_related_*`, `idx_messages_sender_id/recipient_id/conversation/request_id/shipment_request_id`; no `created_at` index on `messages` — minor); status unions in `types/index.ts:32/:60/:78/:95` match DB CHECKs (baseline:76/:107/:151/:131); all `text CHECK` (no enums); duplicate `trg_reviews_update_rating` resolved (`20260701_review_system_v2.sql:75`); `search_path` hardening migrations present.

### 4.4 App quality (APP) — 2 findings + gap note

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| APP-01 | P2 | `refreshProfile()` is a no-op — breaks profile save/role flows | `supabase/src/contexts/AuthContext.tsx:41,99,149,178`; consumers `Profile.tsx:163,188,196-224`, `ChooseRole.tsx:118-120` |
| APP-02 | P2 | "Authenticated users can read all users" `USING(true)` — duplicates SEC-04 | `supabase/src/integrations/supabase/final-schema.sql:301` |

**Verified clean:** canonical/alias dedupe (edge 301s + SeoMeta canonicals), sitemap↔robots (173 locs, none disallowed), og:image/twitter:card, realtime/geolocation/interval cleanup, `RoleProtectedRoute` RBAC, RLS write policies, localStorage PII, `React.lazy` code-splitting.

### 4.5 Performance (PERF) — 6 findings

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| PERF-01 | P0 | Homepage 1320 KB raw / 410 KB gzip (§2) | posthog-js 252 KB, vendor-supabase 215 KB |
| PERF-02 | P0 | `/routes/:slug` 2081 KB raw / 612 KB gzip (§2) | RouteDetail.tsx:8 → @/data/blog; recharts 407 KB |
| PERF-03 | P2 | Authed shell bundles framer-motion eagerly via `DockNav`/dock that `PublicLayout` deliberately lazy-loads (~130 KB per its own comment) | `supabase/src/components/Layout.tsx:54` |
| PERF-04 | P2 | Conversation list fetches **entire message history** with 2 nested user joins, no `.limit()` | `supabase/src/pages/messaging/ChatList.tsx:44` |
| PERF-05 | P3 | Admin user list selects all `users` rows, no `.limit()` | `supabase/src/pages/admin/UserManagement.tsx:65` |
| PERF-06 | P3 | Admin drawer fires 4 unbounded deep-joined per-user queries | `supabase/src/pages/admin/UserDetailDrawer.tsx:44` |

### 4.6 SEO / AEO (SEO) — 6 findings

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| SEO-01 | P2 | hreflang / `og:locale` mismatch | `api/agent.js:3606-3616` vs `SeoMeta.tsx:162-174` |
| SEO-02 | P2 | `<html lang>` never set to Hindi | index.html / SeoMeta |
| SEO-03 | P2 | 64/73 blog titles >65 chars (truncation in SERPs) | `api/agent.js:853`; `supabase/src/data/blog.ts` |
| SEO-04 | P2 | **Homepage has no `<noscript>` block** — violates AEO rule 1 on the highest-value page | `supabase/src/pages/Index.tsx:36` (0 matches) |
| SEO-05 | P3 | 4 public pages lack required `<noscript>`: SharedShipment, SharedTrip, Terms, Tools | `supabase/src/pages/public/SharedShipment.tsx:1` et al. |
| SEO-06 | P3 | robots.txt: AI-crawler groups list only `Allow: /`, so RFC 9309 most-specific-group matching bypasses the wildcard Disallows on `/login`, `/admin/`, `/trucker/` | `public/robots.txt:28-50` |

*Severities for SEO-01..04 are inferred (P2); evidence is verified.*

### 4.7 Testing & CI (TEST) — 14 findings

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| TEST-01 | P1 | Coverage broken: `@vitest/coverage-v8` missing; no thresholds, no CI gate | package.json |
| TEST-02 | P1 | 41 `Deno.test` cases never run | supabase/functions/**/pricing_test.ts |
| TEST-03 | P1 | Chat suite tautological — `sanitizeContent` under test isn't the exported one | test/chat.test.ts vs utils/chat.ts |
| TEST-13 | P1 | `pnpm build` cannot complete: no build-time `VITE_*` env → `env.ts:29,35` throws at module load → boot crash → no React mount → no `[data-ls-seo]`/`h1` readiness markers → 40 s per route × 179 routes (~2 h) vs CI `timeout-minutes: 30`. CI Build step runs 29 m 19 s then `cancelled`; 0 routes prerendered. Symptom misdiagnosed as "slow runner" | supabase/src/config/env.ts:22,29,35; scripts/prerender.mjs:144,331; dist/assets/env-CL3f2zya.js (`void 0` keys); dist/.prerender-status.json (`success:0`); .github/workflows/ci.yml:17-20; CI runs 36330341437, 36327507412; no `.env` (only `.env.example`) |
| TEST-04 | P2 | 0 edge-function tests; 10 untested functions (price-predict 788, credit-insights 251, match-ml 246, fetch-diesel-price 221, fraud-detect 221, gemini-proxy 204, admin-secrets 199, demand-forecast 174, credit-score 105, get-fuel-price 69 lines) | supabase/functions/ |
| TEST-05 | P2 | prerender/smoke can pass false-green (assertion style) | scripts/prerender.mjs, scripts/smoke.mjs |
| TEST-14 | P2 | Prerender is fail-soft and unbounded: no global deadline or consecutive-failure circuit breaker, and it exits 0 writing `prerendered:true` even when 0 routes rendered (`results.skipped++` path) — `pnpm build`/`pnpm check` can "pass" with nothing pre-rendered | scripts/prerender.mjs:144 (`READY_TIMEOUT_MS` per-route only), :424 (`results` init), :434 (`skipped++`), :456 (Done summary), :458 (`writeStatus({prerendered:true,...})` — exit 0); observed `dist/.prerender-status.json` = `success:0, failed:0, skipped:1` |
| TEST-06 | P2 | 33 lint warnings ungated (`eslint .` without `--max-warnings`) | package.json:15 |
| TEST-07 | P2 | `scripts/` unlinted/untyped | scripts/ |
| TEST-08 | P2 | No dependency-vulnerability scanning in CI | .github/workflows/ci.yml |
| TEST-09 | P3 | `format:check` never run in CI | package.json:18 vs ci.yml |
| TEST-10 | P3 | Hardcoded node-version in CI vs `.nvmrc` | `.github/workflows/ci.yml:36` |
| TEST-11 | P3 | Dead `chromeDumpDom` | `scripts/prerender.mjs:218-219` |
| TEST-12 | P3 | Content-assertion-heavy suite (brittle) | `supabase/src/test/agentic-readiness.test.ts:18,189,221,437` |

**Baseline:** 3 test files / 98 tests (agentic-readiness 72, utils 17, chat 9) vs 288 app files.
**Fix order:** TEST-13 → TEST-03 → TEST-09/10 → TEST-01 → TEST-05 → TEST-14.

### 4.8 Data layer (DATA) — 20 findings

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| DATA-01 | P1 | Public Gallery reads DB via anon client | pages/public/Gallery.tsx:38 |
| DATA-02 | P1 | Bulk-cancel counts error-resolves as success | pages/admin/Moderation.tsx:147 |
| DATA-03 | P1 | Monitoring re-fetches full star-joined trips+shipments every 30 s | pages/admin/MonitoringDashboard.tsx:63,71 |
| DATA-04 | P1 | Aggregates all requests in JS; errors swallowed | MonitoringDashboard.tsx:147,215 |
| DATA-05 | P1 | `sms_opt_in` update error unchecked | pages/account/Profile.tsx:597 |
| DATA-06 | P1 | Linked shipment status update silently ignored | pages/trucker/TruckerTripDetail.tsx:118 |
| DATA-07 | P2 | Hub list swallows errors, no `.limit()` | pages/trucker/TruckerHub.tsx:92 |
| DATA-08 | P2 | Manual list-load setState without cancelled flag (race) | pages/shipper/MyShipments.tsx:136 |
| DATA-09 | P2 | Favorites sub-query errors dropped into empty sections | pages/account/Favorites.tsx:66 |
| DATA-10 | P2 | Six ShipmentDetail follow-up queries ignore errors | pages/shipper/ShipmentDetail.tsx:86 |
| DATA-11 | P2 | Admin drawer: four unbounded star-joined lists | pages/admin/UserDetailDrawer.tsx:44 |
| DATA-12 | P2 | Chat query uses four-level nested star joins | pages/messaging/Chat.tsx:63 |
| DATA-13 | P2 | Profile stats/reviews unbounded; errors logged only | pages/account/Profile.tsx:110 |
| DATA-14 | P2 | `fetchMessages` returns full conversation, no limit | utils/chat.ts:109 |
| DATA-15 | P3 | EditShipment invalidates a key no component consumes | pages/shipper/EditShipment.tsx:108 |
| DATA-16 | P3 | Price-history insert failures deliberately swallowed | pages/trucker/PostTrip.tsx:110 |
| DATA-17 | P3 | GalleryManager storage remove errors unchecked | pages/admin/GalleryManager.tsx:167 |
| DATA-18 | P3 | Admin KPI count queries ignore errors | pages/admin/Dashboard.tsx:17 |
| DATA-19 | P3 | Moderation list fetches all rows, no pagination | pages/admin/Moderation.tsx:66 |
| DATA-20 | P3 | Favorite toggle never invalidates Favorites cache | components/FavoriteButton.tsx:67 |

**Verified-clean (realtime):** 11 channels — Layout.tsx:224, NotificationBell.tsx:75, useLiveDriverLocations.ts:88, useLiveLoadLocations.ts:69, AuditLog.tsx:93, MonitoringDashboard.tsx:237, ChatList.tsx:138, ShipmentDetail.tsx:201, TripDetail.tsx:127, chat.ts:174, Chat.tsx:92,116,135 — **every channel has a matching `removeChannel`/`unsubscribe`.**
**Unbounded `select('*')` inventory:** UserDetailDrawer ×4 (worst), EditTrip, Gallery, EditShipment, TeamManager, useLiveLoadLocations, team-showcase, GalleryManager, AuditLog ×1 each.

### 4.9 Docs & deployment (DOC) — 21 findings

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| DOC-01 | P1 | Documented security headers absent from `vercel.json` | docs/deployment.md:27-28; docs/architecture.md:36,275; SECURITY.md:51-52 |
| DOC-02 | P2 | PostHog documented "Optional" but required by env schema | docs/environment-variables.md:39-40 vs config/env.ts:7-8 |
| DOC-03 | P2 | Env validation decorative — 0 imports of `env`; only touchpoint `main.tsx:48`; 22 files / 34 raw `import.meta.env` reads | supabase/src/config/env.ts |
| DOC-04 | P2 | 141 `src/` refs in docs, 132 wrong-path | README.md:195; docs/data-models.md:21; docs/conventions.md:29,36,40,43,44,64,69,83; architecture.md:89,264,272; authentication.md:51-57,109; deployment.md:131 |
| DOC-05 | P2 | Phantom `AuthSync.tsx` documented, absent from repo | docs/authentication.md:53,70-77; architecture.md:245; CONTEXT.md +4; 0 hits in supabase/src |
| DOC-06 | P2 | "All routes in `src/App.tsx`" false — routes live in `routes.tsx` | docs/architecture.md:264; conventions.md:69 vs App.tsx:17,119 |
| DOC-07 | P2 | Dev port documented 5173, actual 8080 | docs/getting-started.md:72; CONTEXT.md:933 vs vite.config.ts |
| DOC-08 | P2 | CI documented as "add a workflow" though one exists; example omits typecheck | docs/deployment.md:59-86 vs .github/workflows/ci.yml |
| DOC-09 | P2 | `VITE_GA_MEASUREMENT_ID` documented but never read; GA ID hardcoded | docs/environment-variables.md:41 vs utils/analytics.ts |
| DOC-10 | P2 | edge-functions.md documents 7 of 10 functions; `invoke` example has 0 usages (17 raw-fetch call sites) | docs/edge-functions.md:41-53,58 |
| DOC-11 | P2 | Phantom script `generate-android-assets.ps1` | docs/mobile-android.md:68 vs scripts/ |
| DOC-12 | P2 | Wrong path `src/pages/Login.tsx` | docs/authentication.md:51-57,109 vs pages/auth/Login.tsx |
| DOC-13 | P2 | CONTEXT.md wrong tree + port 5173; 0 `supabase/src` refs | CONTEXT.md (9 `src/` lines, L933) |
| DOC-14 | P3 | SPA rewrite destination imprecise (docs say index.html, actual `/api/agent.js`) | docs/deployment.md:27 vs vercel.json |
| DOC-15 | P3 | Android `versionName 1.0`/`versionCode 1` vs package.json `0.0.0` | android/app/build.gradle:10-11 |
| DOC-16 | P3 | Tracked files violating `.gitignore` (ruvector.db, .memory/*, knowledge-graph.json, .opencode/plugins/graphify.js) | .gitignore vs `git ls-files` |
| DOC-17 | P3 | Blanket `.env*` gitignore rule traps new example files | .gitignore |
| DOC-18 | P3 | Untracked scratch files + 2 dirty tracked files in working tree | check_more.sh etc.; pricing index.ts; public/sitemap.xml |
| DOC-19 | P3 | `Access-Control-Allow-Origin: *` on all `/api/*` routes | vercel.json headers |
| DOC-20 | P3 | getting-started.md omits typecheck/format commands | docs/getting-started.md vs package.json |
| DOC-21 | P3 | `fraud-detect` has zero callers in repo (dead endpoint) | supabase/functions/fraud-detect (0 matches in src/api/scripts/migrations) |

---

## 5. Cross-cutting themes

1. **Fail-open error handling (biggest systemic defect).** Errors are caught-and-ignored across the data layer (DATA-02, 04, 05, 06, 07, 09, 10, 13, 16, 17, 18), inside edge functions (EDGE-16 returns a fabricated score 550), in env validation (DOC-03 makes Zod validation a no-op), and in tests (TEST-03's tautology). *Rule to adopt: every `.error` from PostgREST must either surface to UI state or be rethrown.*
2. **Authorization gaps at every tier.** RLS over-permissiveness (SEC-01, 02, 03, 04, 05, 07, 11; APP-02) + unauthenticated edge endpoints (EDGE-04, 05, 09, 18) + client-trusted identity (EDGE-03/SEC-08) + optional cron auth (SEC-09). *Rule: identity only from JWT/session; every table/column grant is deny-by-default.*
3. **Unbounded queries.** No `.limit()` on ChatList, Moderation, UserManagement, UserDetailDrawer, Profile stats, favorites, hub lists (PERF-04/05/06, DATA-07, 11, 13, 14, 19). Each is a production incident waiting at ~10× data.
4. **Schema/migration drift.** 9 RPCs and the `users.city` column exist only outside migrations (DB-01, DB-04) — a fresh `db reset` cannot reproduce production; duplicate trigger definitions diverge (DB-03).
5. **Docs describe a different repo.** 132 wrong paths, a phantom component, wrong port, wrong route file, headers that don't exist (DOC-01..13) — CONTEXT.md itself is stale.
6. **Test suite measures little.** 98 tests over 288 files, coverage tool absent, 41 Deno tests unwired, edge functions (where the P0s live) have zero tests (TEST-01..04).
7. **Bundle debt concentrated in 2 routes.** One eager vendor + one cross-domain data import account for most of the 612 KB worst page (PERF-01/02) — a small, high-leverage fix.

---

## 6. Phased fix roadmap

**Phase 0 — P0s (same day; ship-blocking)**
1. SEC-01 — close self-service admin escalation (RLS `WITH CHECK` + server-side guard).
2. EDGE-01 — remove duplicate `const` (restores `gemini-proxy`).
3. EDGE-02 — fix `price-predict` corridor scope/null bugs.
4. PERF-01 + PERF-02 — lazy PostHog; split blog data + lazy Recharts (measurable immediately).

**Phase 1 — P1s (this week)**
- Security/edge: SEC-02, EDGE-03, EDGE-04, EDGE-18.
- Data integrity: DATA-01…DATA-06 (error surfacing + anon-client read).
- Schema: DB-01 (port 9 RPCs into migrations) + DB-04 (`users.city` migration).
- Testing: **TEST-13 (unblocks `pnpm build`/CI — provide `VITE_*` env + fail-fast validation)** → TEST-03 → TEST-09/10 (quick wins) → TEST-01 (coverage gate) → TEST-02 (Deno CI).
- Docs: DOC-01 (real headers in `vercel.json`).

**Phase 2 — P2s (next sprint)**
- RLS column-scoping sweep (SEC-03/04/05/07, APP-02), edge hardening (EDGE-05…10), APP-01, PERF-03/04, SEO-01…04, TEST-04…08 + **TEST-14 (prerender deadline / circuit breaker / non-zero exit)**, DATA-07…14, DOC-02…13 (batch doc rewrite against actual paths/ports).

**Phase 3 — P3s (opportunistic)**
- SEC-09/10/11, EDGE-11…17, DB-03, PERF-05/06, SEO-05/06, TEST-11/12, DATA-15…20, DOC-14…21.

**Definition of done per phase:** `pnpm check` green (after TEST-01/09 are fixed), new tests for each fixed P0/P1, and a fresh `supabase db reset` succeeding from migrations alone (DB-01/DB-04 exit criterion).

---

## 7. Verified-clean inventory

- **Secrets/hygiene:** only `.env.example` tracked; no hardcoded API keys (`AIza…`, `sk-`, `gsk_`) anywhere; no service-role/secret patterns in `supabase/src` client code; no secrets in client code; `search_path` hardening migrations present (`20250611_supabase_lint_fixes.sql:16,49`, `20260816_security_hardening*.sql`, `20260927_authorize_security_definer_rpcs.sql`).
- **RLS:** enabled on all 30 tables (the stray "IF" is a regex artifact).
- **Edge:** all 15 functions have `verify_jwt`/admin checks; `match-ml` clean; `allowPublic` confined to `demand-forecast` only.
- **Security sweep extras:** `api/agent.js` auth, `.github/workflows/ci.yml`, CORS allowlist, `supabase/src` redirects/URL params, localStorage/console secret exposure, innerHTML/eval sinks — all clean.
- **DB:** realtime publication covers all 8 client tables (DB-02); messages/notifications index coverage good; status unions match DB CHECKs; text-CHECK constraint style consistent; duplicate rating trigger resolved; `search_path` set on SECURITY DEFINER functions.
- **Data/realtime:** all 11 realtime channels pair with `removeChannel`/`unsubscribe`.
- **App:** canonical/alias dedupe via edge 301s + SeoMeta canonicals; sitemap↔robots consistent (173 locs); og:image/twitter:card present; `RoleProtectedRoute` RBAC correct; RLS write policies; no localStorage PII; `React.lazy` code-splitting in place.
- **Baseline tooling:** `pnpm install` OK; `pnpm lint` 0 errors / 33 warnings; `pnpm typecheck` exit 0; `pnpm test` 3 files / 98 tests pass.

---

## 8. Tooling appendix

| Check | Command | Result |
|---|---|---|
| Install | `pnpm install` | OK |
| Lint | `pnpm lint` (`eslint .`) | 0 errors, 33 warnings |
| Typecheck | `pnpm typecheck` (`tsc --noEmit`) | exit 0, clean |
| Unit tests | `pnpm test` (`vitest run`) | 3 files, 98 tests pass |
| Build | `pnpm build` (`vite build` + prerender + smoke) | **Cannot complete** — `vite build` alone passes (exit 0, 31.1 s); `scripts/prerender.mjs` hangs (TEST-13). CI run `36330341437`: Lint/Typecheck/Test pass, Build step 15:40:03 → 16:09:22 (29 m 19 s) then `cancelled` at `timeout-minutes: 30`; run `36327507412` cancelled the same way. Prerender log ends after 4 lines (179 routes discovered, SPA server up); 0/179 routes rendered. `dist/` exists from local `vite build` — 282 assets, 4014 KB / 4.82 MB |

**Inventory:** 303 TS/TSX files (~2.7 MB source) across `supabase/src`, `api`, `scripts`, `supabase/functions`; 51 migrations; 15 edge functions; route table `supabase/src/routes.tsx` (~340 lines).
**Environment notes:** PowerShell shell; `rg` not installed (used `Get-ChildItem | Select-String`); migrations apply in lexicographic filename order (`.` 0x2E < `_` 0x5F); task-agent session resume works for follow-ups.

---

## 9. Coverage & completeness note

- All 9 planned domains delivered findings; totals: **101 findings (5 P0, 16 P1, 47 P2, 33 P3)**.
- Several agent outputs were truncated in transit and recovered: DOC (via session resume), DATA (one fresh re-run + resume), SEC / EDGE / PERF+SEO+APP (via targeted recovery runs). Recovered listings are compact (title + evidence + severity); depth of prose per finding is therefore lighter than §2–§3.
- **Residual gaps:** (a) original APP run's P3 detail list was lost and not fully re-enumerated — APP likely has additional P3 hygiene findings; (b) EDGE count is 18 vs the original run's stated 19 (one original item not re-observed); (c) ~~`pnpm build` output/exit status never captured~~ **now diagnosed as TEST-13/TEST-14** — local `vite build` passes, the sink is `prerender.mjs` burning 40 s × 179 routes on a boot crash from missing `VITE_*` env, and both CI runs cancel at the 30-minute job timeout with 0/179 routes rendered; a fully green `pnpm build`/`pnpm check` run still requires TEST-13 to be fixed; (d) SEO severities are inferred rather than assigned by the originating agent.
- Duplicate/overlapping findings intentionally kept cross-referenced rather than deleted: SEC-04 ≡ APP-02 (users `USING(true)`), SEC-08 ≡ EDGE-03 (fraud-detect `userId`), EDGE-18 is the demand-forecast public-call chain.
- Nothing in this report has been fixed; this document is the audit deliverable only.
