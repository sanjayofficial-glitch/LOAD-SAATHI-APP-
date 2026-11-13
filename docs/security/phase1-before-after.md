# LoadSaathi Phase 1 — Security Remediation Evidence (2026-11-13)

Branch: `security/phase1` · Live project: `aejvxilhydyfbwkhjpdt` (Supabase)
All database verifications below were executed inside transactions that were
**rolled back** — production was not modified.

## Before (live state)

| Finding | Observed live |
|---|---|
| SEC-01 | Policy `"Authenticated users can read all users"` `USING (true)` present; `authenticated` had table-level SELECT on `users` (every column incl. email, phone, KYC URLs, verification internals) |
| SEC-02 | `get_users_admin_view()` SECURITY DEFINER without internal admin check; `anon` + `authenticated` + `service_role` had EXECUTE |
| SEC-03 | Real Gemini API key `AIzaSyC7-gx0LW…` committed in `.env` (~200 commits). No other privileged secrets found in git history |
| SEC-04 | `freddy-ai.ts` read `VITE_GROQ_API_KEY` / `VITE_HUGGINGFACE_TOKEN`, stored them in localStorage, and called Groq/HuggingFace directly from the browser |

## After (verified in dry-run)

| Check | Result |
|---|---|
| `get_users_admin_view()` ACL | only `postgres` + `authenticated` (anon/service_role revoked) |
| Non-admin call to `get_users_admin_view()` | `ERROR 42501: Admins only` |
| Admin call to `get_users_admin_view()` | returns all 59 user rows |
| `users` table-level SELECT for `authenticated` | false |
| `has_column_privilege(authenticated, phone / email)` | false |
| `has_column_privilege(authenticated, full_name)` | true |
| Unrelated authenticated user reading another user's safe profile | works (name, rating, trips, verified) |
| Unrelated authenticated user reading another user's phone | `ERROR 42501: permission denied for table users` |
| `get_participant_contact()` unconnected caller | returns NULL |
| `get_participant_contact()` admin caller | returns phone (`8420857086` for sample user) |
| Own full profile via `get_own_profile()` | works (1 row) |

## Code checks

- `pnpm typecheck` — pass
- `pnpm test` — 178/178 pass (same as pre-change baseline)
- `eslint` on all changed files — clean
- Fresh `vite build` — pass (see run log)

## Files changed

**Frontend**
- `supabase/src/lib/freddy-ai.ts` — removed provider keys/localStorage/direct API calls
- `supabase/src/lib/userContact.ts` — NEW participant-contact RPC client
- `supabase/src/lib/adminUsers.ts` — NEW admin users-map helper (admin_users_view RPC)
- `supabase/src/pages/trips/TripDetail.tsx` — safe select; phone via RPC after connection
- `supabase/src/features/shipper/components/LiveTruckMap.tsx` — dropped `phone` from selects
- `supabase/src/pages/trucker/TruckerHub.tsx` — phone via RPC for accepted offers
- `supabase/src/pages/trucker/TruckerTripDetail.tsx` — safe selects; phone via RPC for accepted requests
- `supabase/src/pages/shipper/MyShipments.tsx` — dropped `phone` from join
- `supabase/src/pages/shipper/ShipmentDetail.tsx` — safe selects; accepted-trucker phone via RPC
- `supabase/src/pages/messaging/Chat.tsx` — safe selects; partner phone via RPC (accepted only)
- `supabase/src/pages/admin/AdminListings.tsx` — profiles attached via admin_users_view RPC
- `supabase/src/pages/admin/command-center/usePostedListings.ts` — same
- `supabase/src/pages/admin/command-center/useListingDetail.ts` — same

**Database migrations (with rollbacks)**
- `supabase/migrations/20261113_phase1_sec02_admin_users_view_check.sql` (+ `_ROLLBACK.sql`)
- `supabase/migrations/20261113_phase1_sec01_users_table_restrict.sql` (+ `_ROLLBACK.sql`)
- `supabase/migrations/20261113_phase1_sec01_participant_contact_rpc.sql` (+ `_ROLLBACK.sql`)

**Security tooling**
- `.github/workflows/secret-scan.yml` — gitleaks on push/PR
- `docs/security/credential-rotation-checklist.md` — rotation steps for the leaked Gemini key

## Remaining (needs human/explicit approval)

1. Rotate the leaked Gemini key (checklist in `docs/security/credential-rotation-checklist.md`).
2. Deploy frontend to production FIRST, verify, then apply the three migrations
   (in order A → B → C) to production; verify again.
3. Optional later: git history scrub (not recommended; rotate instead).
