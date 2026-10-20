# Freddy Phase 2 Draft — Audience Decision, `search_market` Plan, Production Checklist

> **Status: DRAFT prepared 2026-10-20 on branch `freddy-copilot`. Nothing in this
> document has been applied.** No Clerk template change, no Supabase secret
> change, no deployment, no `config.toml` edit. The live Clerk JWT-template
> check gates production rollout; code and tests may be prepared in parallel.

---

## 1. Recommended audience value: `"supabase"`

Use the fixed audience string **`supabase`** for Freddy's Clerk JWT template.

**Why this value:**

- Explicit and stable — `FREDDY_EXPECTED_AUDIENCE` gets a constant, not a domain
  that changes with the Clerk environment.
- Environment-independent — does not depend on whether the project runs on the
  Clerk development instance (`in-oarfish-16.clerk.accounts.dev`, derived from
  the `pk_test` key on 2026-10-20) or a production domain.
- Matches the template's own naming: the template is literally called
  `supabase` (minted by the app via `getToken({ template: 'supabase' })`).

**Verifier compatibility (verified against code + tests):**
`verifyClerkJwt` (`supabase/functions/_shared/verifyClerkJwt.ts:40,159-166`)
accepts `expectedAudience: string | string[]` and matches a token whose `aud`
is either the string `"supabase"` or an array containing it. The relevant
behavior is locked in by tests: "accepts aud as an array containing the expected
audience" and "supports expectedAudience as a list of acceptable values"
(`verifyClerkJwt_test.ts`). 27/27 tests pass locally (Deno 2.9.7, 2026-10-20).

**Evidence for why this step exists at all** (Clerk docs, JWT templates guide):
Clerk custom JWTs automatically include `azp`, `exp`, `iat`, `iss`, `jti`,
`nbf`, `sub` — **`aud` is NOT automatic**; it exists only if the template's
claims JSON explicitly sets it. The repo's own documentation of the template
(`supabase/src/contexts/AuthContext.tsx:57-59`) lists claims
`{sub, email, role}` with **no `aud`** — so unless the live template was edited,
real tokens will not carry `aud`, and the fail-closed verifier will reject them
(test 18: "rejects when aud is absent from the token").

### Confirmation procedure (user-gated; DO NOT skip for production)

1. Open **Clerk Dashboard → JWT Templates → `supabase`** and read the claims
   JSON. (CLI alternative: `npx clerk@latest api jwt_templates` with a backend
   key.)
2. If `aud` is absent, add `"aud": "supabase"` to the claims, save, then mint a
   **fresh** token from a signed-in session (adding `aud` changes all
   template tokens; old cached client tokens still lack it) and confirm the
   claim decodes as `"aud": "supabase"`.
3. Regression-check the template change app-wide (it affects every
   `'supabase'-template` consumer, not just Freddy): sign in, GPS location
   upsert, realtime chat connect, a standard RLS read such as `BrowseTrips`.
   Hosted Supabase PostgREST does not gate on `aud` by default, so these are
   expected unaffected — verify, don't assume.
4. **Do not relax the verifier.** The verifier must continue to reject missing
   or mismatching audiences; that fail-closed property is a deliberate design
   (verifyClerkJwt.ts:23-25).

**Scan-safety:** the schema/policy facts quoted in section 2 were read directly
from migration source; the codebase-memory coverage check flagged those three
SQL files as partially parsed (`parse_partial`), so source-file reads are the
ground truth used below.

---

## 2. `search_market` — implementation plan

One **read-only** tool inside the existing `agent-router` function's tool
layer — not a new function, not a new agent. The router keeps its Phase 1
pipeline (kill switch → rate limit → `verifyClerkJwt` auth → strict validation)
and Phase 2 adds a tool registry this tool plugs into.

### 2.1 Evidence: the real schema (not assumptions)

`public.trips` — `supabase/migrations/20250601_baseline_schema.sql:66-89`;
no later migration alters these columns (grep for `ALTER TABLE public.trips ADD|
ALTER|DROP|RENAME COLUMN` across `supabase/migrations/` → no matches):

| Column | Type / constraint | Tool use |
|---|---|---|
| `id` | uuid PK | result identity |
| `trucker_id` | text FK → `users.id` (Clerk `user_*` id) | join for display |
| `origin_city`, `destination_city` | text NOT NULL | `origin` / `destination` filters (ilike) |
| `departure_date` | date NOT NULL | ordering (same as UI) |
| `available_capacity_tonnes` | numeric NOT NULL, CHECK > 0 | `min_capacity_tonnes` filter |
| `price_per_tonne` | numeric NOT NULL, CHECK > 0 | `max_price_per_tonne` filter |
| `vehicle_type` | text NOT NULL | returned for display |
| `status` | text, CHECK ∈ {active, in_transit, delivered, completed, cancelled} | fixed status filter (below) |
| `origin_state`…`destination_lat/lng`, `estimated_distance_km`, `estimated_duration_min` | nullable text/numeric | returned for display |

RLS chain for reads (grounded):

- `20260806_fix_trips_read_access.sql:29,40-42`: `GRANT SELECT ON ALL TABLES …
  TO authenticated`; policy **"Anyone can see active trips"** —
  `FOR SELECT TO authenticated USING (true)` (name is historical; the predicate
  grants all authenticated users read access to all trip rows).
- Write-side policies use the Clerk-auth-aware `(select current_clerk_user_id())`
  helper (`20261019120000_rls_initplan_and_clerk_auth_fix.sql:157-164`) and are
  irrelevant here: the tool performs **no writes**.
- Indexes exist for this query shape: `idx_trips_status_origin_dest (status,
  origin_city, destination_city)`, `idx_trips_departure_date`
  (`20250601_baseline_schema.sql:286-291`).

The app's own "available loads" rule is authoritative — `BrowseTrips.queryFn`
(`supabase/src/pages/shipper/BrowseTrips.tsx:104-133`) queries
`trips` **with caller's Clerk-JWT client** (`createClerkSupabaseClient(token)`),
filters `.in('status', ['active', 'in_transit'])` (not just `active`), orders by
`departure_date` ascending, caps `.limit(50)`, and applies:
`ilike('origin_city', %term%)`, `ilike('destination_city', %term%)`,
`gte('available_capacity_tonnes', n)`, `lte('price_per_tonne', n)`,
`ilike('vehicle_type', %term%)`, and embeds
`trucker:users!trips_trucker_id_fkey(full_name, rating, total_trips, is_verified)`.

### 2.2 File placement

| File | Purpose |
|---|---|
| `supabase/functions/_shared/searchMarket.ts` (new) | Pure-ish tool module: param validation + query building + result shaping. Follows the `_shared/` module convention (`osrm.ts`, `fuel.ts`, `verifyClerkJwt.ts`). |
| `supabase/functions/_shared/searchMarket_test.ts` (new) | Deno tests, fully network-free (same pattern as `verifyClerkJwt_test.ts`: `*_test.ts` keeps vitest's default include untouched). |
| `supabase/functions/agent-router/index.ts` (Phase 2 edit) | Registers the tool; replaces the 501 placeholder with the reasoning loop. This edit happens **only** after the tool module + tests are green. |

### 2.3 Database access — anchored to RLS, never service role

- The tool receives the **caller's verified JWT** (already validated by
  `verifyClerkJwt` in the router) and creates a caller-scoped Supabase client:
  `createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: {
  Authorization: "Bearer " + userJwt } } })` — same identity semantics as the
  app's `createClerkSupabaseClient(token)`; RLS stays authoritative.
- **New secret requirement:** edge functions auto-inject `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY`, but **not** the anon key (existing precedent:
  `lead-alert/index.ts:25,140` imports supabase-js from
  `https://esm.sh/@supabase/supabase-js@2` and uses the service key only where
  admin access is justified). `SUPABASE_ANON_KEY` must be set as a project
  secret when Freddy deploys. The service-role key must never appear in this
  code path.
- The model never constructs SQL or filters: the LLM sees the tool's JSON
  schema, and the router/tool validate every parameter into typed, whitelisted
  builder calls.

### 2.4 Initial tool contract (validated, evidence-mapped)

| Field | Rule | Maps to |
|---|---|---|
| `origin` | optional string, trimmed, 1–80 chars, `%`/`_`/`,` escaped or rejected before ilike | `ilike('origin_city', '%term%')` |
| `destination` | optional string, same rule | `ilike('destination_city', '%term%')` |
| `min_capacity_tonnes` | optional, finite number, `0 < n ≤ 500` | `gte('available_capacity_tonnes', n)` (DB CHECK > 0) |
| `max_price_per_tonne` | optional, finite number, `0 < n ≤ 1_000_000` (INR) | `lte('price_per_tonne', n)` (DB CHECK > 0) |
| result limit | fixed 50 (not model-controlled) | `.limit(50)` |
| order | fixed `departure_date` ascending (not model-controlled) | `.order(...)` |
| status | fixed `['active', 'in_transit']` (not model-controlled) | `.in('status', [...])` |
| selected columns | fixed allowlist incl. the `trucker` embed subset (same as BrowseTrips) | `.select(...)` |
| database role | caller JWT only | RLS authoritative |
| writes | none — this tool is read-only by construction | — |

Unknown/extra fields are rejected at the router's existing strict-validation
layer (precedent: agent-router/index.ts:141-161 rejects unknown body keys; the
tool-args validator reuses that pattern), so nothing undocumented can reach the
query builder.

### 2.5 Response shape and grounding rules

Return to the model (and onward to the caller):

```json
{
  "tool": "search_market",
  "count": 2,
  "loads": [
    {
      "id": "…",
      "origin_city": "…", "destination_city": "…",
      "origin_state": "…", "destination_state": "…",
      "departure_date": "…",
      "available_capacity_tonnes": "…",
      "price_per_tonne": "…",
      "vehicle_type": "…",
      "estimated_distance_km": "…", "estimated_duration_min": 0,
      "trucker": { "full_name": "…", "rating": 0, "total_trips": 0, "is_verified": false }
    }
  ]
}
```

- Empty results are a **normal, explicit** outcome: `{"tool":"search_market",
  "count":0,"loads":[]}` — the loop must tell the user "no matching loads" and
  must not fall back to invented data.
- The model may summarize/compare these records. It must **not** invent loads,
  fabricate prices/capacities, or describe a result as a confirmed booking —
  the system prompt carries the same refusal rules (Phase 2 prompt text).

### 2.6 Test plan (network-free first, like the JWT tests)

1. **Validation cases** (pure): each filter happy-path; every reject case —
   unknown key, oversized/empty text, NaN/Infinity/negative, out-of-range
   bounds, boundary values at the limits.
2. **Builder cases** (pure): given validated params, the produced
   PostgREST request has exactly the expected method/path/filters/headers;
   assert the fixed `limit(50)`, order, status list, and column allowlist; and
   that no parameter ever comes from model text unsanitized.
3. **Response shaping** (pure): parse of a fixture row array into the contract
   shape; empty-array → `count: 0`; malformed DB payload → sanitized error.
4. **Live smoke (separate, user-gated)**: `deno task`-style run against a
   **local** Supabase stack or the dev project with a real template token —
   proving auth end-to-end (RSL (RLS) identity via `current_clerk_user_id()`).
   The final live template `aud` confirmation also lands here.

### 2.7 Rollout order (Phase 2)

1. Tool module + tests green locally, **before** any router change.
   (Done 2026-10-20: 23 network-free tests.)
2. Router edit: replace the 501 with the **deterministic** search_market step
   only (`agent-router/handler.ts:248-321`; `index.ts` is now a thin
   `Deno.serve` wrapper). No model/LLM loop in this phase — that is a separate
   later change (§4). (Done 2026-10-20: 18 router tests; 68 total green.)
3. Config note (see §3, Stage C) prepared; `FREDDY_ENABLED` stays **off** until
   the staged verification in §3 completes. **Sequencing limitation found in
   review:** the kill switch is checked *before* JWT verification
   (`handler.ts:109` precedes `handler.ts:160`), so a flag-off deploy proves
   reachability only — the JWT path must be verified in staging (§3 Stage B),
   never by flipping the production flag to "just test auth".

---

## 3. Production checklist (staged — each stage is a separate action)

> **Review correction (2026-10-20).** The original step 6 — "deploy with the
> flag off and verify authentication" — was impossible as written: the kill
> switch is checked **before** JWT verification, so with `FREDDY_ENABLED=false`
> every request short-circuits to the disabled banner and no auth code runs.
> A flag-off deploy can never exercise the Clerk JWT path. The corrected
> sequence below verifies authentication in a controlled staging environment
> *before* any production enablement, and never enables an unrestricted
> production endpoint merely to test auth.

### Stage A — Independent production confirmation (nothing deployed, nothing enabled)

1. **Production Clerk template.** JWT templates are per Clerk *instance* — the
   dev confirmation does not transfer. Production Clerk Dashboard → JWT
   Templates → `supabase` must contain `"aud": "supabase"` and mint
   `{sub, email, role: "authenticated"}` signed with the production Supabase
   project's legacy HS256 JWT secret.
2. **Production issuer.** Decode the production `VITE_CLERK_PUBLISHABLE_KEY`
   (`pk_live_...` fronting domain) and use that value — and only that value —
   as the production `FREDDY_EXPECTED_ISSUER`. The dev issuer
   (`https://in-oarfish-16.clerk.accounts.dev`) must never be reused.
3. **Production Supabase JWT configuration.** Confirm the production project
   still signs with the **legacy HS256 secret** the template is configured
   with (not the newer JWT signing-keys mode): `verifyClerkJwt` is HS256-pinned
   and fails closed otherwise.

### Stage B — Controlled staging verification of the JWT + PostgREST path

No production enablement, in preference order:

1. **Local full-stack rehearsal** (`supabase start`): run the function locally
   with `FREDDY_ENABLED=true` in the *local* function env only, and exercise
   the complete pipeline — 401 (missing/bad-signature/wrong-`iss`/
   missing-`aud`/expired), 405, 415, 413, the 400 family, 429, and the two
   config-missing 500s — plus one 200 with a template-shaped token signed with
   the local stack's JWT secret. Seed a couple of trips and cross-check that
   searched rows equal the RLS-visible rows for that identity.
2. **Throwaway staging project:** deploy this same function code to a
   disposable Supabase project configured with the **dev** Clerk secret/issuer
   and a staging anon key; repeat the matrix with real Clerk-issued tokens,
   including a live PostgREST 200 whose rows match what BrowseTrips shows the
   same user. Nothing production is touched.
3. *(Last resort, explicit user gate, time-boxed.)* A brief flag-on window on
   production: deploy flag-off → smoke the disabled path → flip on → at most
   two probes (one 401 with a bogus token, one 200 with a real token) → flip
   back off. Bounded by the 10 req/min limiter and read-only RLS. Only when
   options 1–2 are unavailable.

**Staging verification matrix** (record as run evidence): missing token → 401;
bad signature → 401; wrong `iss` → 401; missing/wrong `aud` → 401; expired →
401; missing auth config → 500 (names in logs only); missing marketplace
config → 500; valid token + filters → 200, rows cross-checked against the
RLS-visible dataset; kill switch off → disabled banner with no auth run (by
design).

### Stage C — Production deploy, flag still off

4. Apply the gateway config **only after Stage A+B are green**:

   ```toml
   [functions.agent-router]
   verify_jwt = false
   ```

   This disables Supabase's *gateway* JWT verification for that function
   specifically (same mechanism as `[functions.lead-alert]`, config.toml:419-420).
   Rationale: the gateway check calls GoTrue, which rejects Clerk-template
   tokens (`400 bad_jwt: sub claim must be a UUID` — recorded evidence in
   verifyClerkJwt.ts:8-11). With gateway verification off, **the function's own
   `verifyClerkJwt` is the mandatory authentication gate** — it already fails
   closed: missing config → 500 before any token is checked, and the verifier
   itself never throws (catch-all → null → 401)
   (agent-router/handler.ts:146-167).
5. **`SUPABASE_JWT_SECRET` handling** — high-impact project secret:
   - Verify it is the **exact legacy JWT secret configured as the Clerk
     template's custom signing key** (production Clerk Dashboard → JWT
     Templates → `supabase` → signing key). A different-than-supposed secret
     silently becomes a config-error 500 for every request — fail-closed, but
     the endpoint is inert.
   - Server-side only (Supabase Edge Function secret). Never in frontend
     config, env exposed to `Vite`, Vercel, logs, or repository files. The
     router reads it from env and logs only the variable *name* when missing
     (agent-router/handler.ts:150-157).
   - Rotation awareness: rotating the legacy JWT secret invalidates every
     HS256-verified consumer at once — including this template.
6. **Set the remaining server-side secrets** only when ready to deploy (names
   only): `FREDDY_ENABLED` (off), `SUPABASE_JWT_SECRET` (step 5),
   `FREDDY_EXPECTED_ISSUER` (Stage A value), `FREDDY_EXPECTED_AUDIENCE`
   (= `supabase`), `SUPABASE_ANON_KEY`.
7. **Deploy with the feature flag off** (`supabase functions deploy
   agent-router`, apply the Stage C block) and smoke the **disabled path
   only**: 200 `{ok, enabled:false, phase:1}` reachable at any time, OPTIONS →
   204, CORS headers present. This cannot and must not exercise auth — that is
   exactly what Stage B was for.

### Stage D — Production enablement (separate, explicit user decision)

8. Flip `FREDDY_ENABLED=true` only after Stage B evidence is archived and the
   user accepts the residual exposure (read-only RLS-visible SELECTs, ≤50
   rows/query, 10 req/min). Wrong production secrets surface as fail-closed
   500/401 — configuration noise, never data exposure; a correct configuration
   must show the one real-token 200 carried over from staging parity. Monitor
   logs: the handler logs only request IDs and variable names.

---

## 4. Next action

1. **Stage A confirmations** (production template `aud`, prod issuer from the
   `pk_live` key, prod legacy-secret parity) — nothing deploys before these.
2. **Stage B staging rehearsal** — local stack first, then a throwaway staging
   project if a real-token rehearsal is wanted.
3. **In parallel, and fully separate from deployment:** design the real
   single-agent tool-calling loop — the model decides whether to call
   `search_market` and supplies supported arguments, the backend validates and
   executes, and the model summarizes from the returned records only. No
   booking/mutation tools. This work must not change the auth/kill-switch
   order or be bundled into a deploy.
