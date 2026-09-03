# Admin Sprint 1 — Quick Wins Plan

## Goal

Make the admin area operationally useful in one focused sprint by shipping five high-value features behind `/admin/*`. These are additive — no breaking changes to existing shipper/trucker flows.

## Scope (5 Features)

| # | Feature | Route | Persistence |
|---|---------|-------|-------------|
| A1 | Analytics dashboard with real trend charts (replaces dead `/admin/dashboard`) | `/admin/analytics` | Read-only Supabase aggregates |
| A2 | User detail drawer (click row → full history + actions) | `/admin/users` (drawer) | Reuses existing `users` table |
| A3 | CSV export for Users / Trips / Shipments / Requests | `/admin/users`, `/admin/moderation` | Client-side CSV blob |
| A4 | Bulk actions (verify / cancel) in Users + Moderation tables | `/admin/users`, `/admin/moderation` | Reuses existing tables + new audit log |
| A5 | `admin_audit_log` table + write on every admin mutation + read-only feed | `/admin/audit` (new) | New table via migration |

## Out of Scope (Explicit)

- KYC documents, payments, disputes, refunds, role promotion (deferred to later sprints)
- Removing the existing `/admin/dashboard` route (kept for backward compat; `/admin/analytics` becomes the primary entry)
- Real-time RLS changes for the audit log (service-role only, client reads via admin auth check)

---

## Architectural Decisions

### AD-1: New migration file, idempotent

Create `supabase/migrations/20260903_admin_enhancements.sql` with:
- `IF NOT EXISTS` on every CREATE / ALTER
- No DROPs, no data backfill (audit log is forward-only)
- `IF NOT EXISTS` on the `suspended` column add (safe to re-run)

This file is **appended** at the end of the schema, never replaces `final-schema.sql`. Apply via Supabase CLI: `supabase db push` (or run manually in SQL editor for the dev instance).

### AD-2: Audit log writes happen client-side

The admin UI calls `supabase.from('admin_audit_log').insert(...)` immediately after the successful mutation. This is acceptable because:
- Only admin users (verified via `userProfile.user_type === 'admin'`) can write (enforced by RLS)
- If the insert fails, we log a console warning and surface a soft toast — never block the user's primary action
- A future migration can move to a Postgres trigger if integrity is critical

### AD-3: Drawer pattern, not new page

User Detail Drawer uses Radix `Sheet` (already in the project via `@/components/ui/sheet`) sliding from the right. No new route, no URL change. Keeps the user on the list view and feels fast.

### AD-4: CSV export is client-side

Use a `Blob` + temporary anchor click. No server round-trip. No new dependency — `URL.createObjectURL` + `<a download>` is enough.

### AD-5: Analytics uses existing Recharts (already a dep)

`recharts` is at `3.9.1` (confirmed in `package.json`). No new dependency. Three charts: 14-day user signups (line), 14-day trip+shipment volume (stacked bar), top 10 corridors (horizontal bar). All read from existing tables with date filters.

---

## Data Model

### New table: `admin_audit_log`

```sql
-- Idempotent migration: supabase/migrations/20260903_admin_enhancements.sql

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN (
    'user.verify', 'user.unverify', 'user.suspend', 'user.unsuspend', 'user.role_change',
    'trip.cancel', 'trip.reactivate',
    'shipment.cancel', 'shipment.reactivate',
    'bulk.verify', 'bulk.cancel_trips', 'bulk.cancel_shipments',
    'export.csv'
  )),
  target_type text,    -- 'user' | 'trip' | 'shipment' | 'request' | null
  target_id text,
  metadata jsonb,       -- action-specific details (old/new values, count, etc.)
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read
DROP POLICY IF EXISTS "Admins read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins read audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.user_type = 'admin')
  );

-- Only admins can write (insert)
DROP POLICY IF EXISTS "Admins write audit log" ON public.admin_audit_log;
CREATE POLICY "Admins write audit log" ON public.admin_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.user_type = 'admin')
  );
```

### New column: `users.suspended`

```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspended_reason text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
```

A suspended user should be blocked from posting new trips/shipments and from signing in. **Implementation choice for this sprint:** just add the column + UI flag. The auth-blocking is **out of scope** for this sprint (would need Clerk metadata sync) — note in the audit drawer with a banner.

### TypeScript types

Add to `supabase/src/types/index.ts`:
- `AuditLogEntry { id, admin_id, action, target_type, target_id, metadata, created_at, admin?: { full_name, email } }`

---

## File-by-File Changes

### New files

| Path | Purpose |
|------|---------|
| `supabase/src/pages/admin/AnalyticsDashboard.tsx` | A1: 3 charts (user signups, volume, top corridors) |
| `supabase/src/pages/admin/AuditLog.tsx` | A5: read-only feed, filterable by action/admin/date |
| `supabase/src/pages/admin/UserDetailDrawer.tsx` | A2: sheet drawer with full user history |
| `supabase/src/components/admin/AdminShell.tsx` | Shared layout for `/admin/analytics` + `/admin/audit` (header + breadcrumb + back link to monitoring) |
| `supabase/src/lib/adminAudit.ts` | Single function `recordAudit(supabase, entry)` used by every mutation |
| `supabase/src/lib/csvExport.ts` | `toCSV(rows, columns)` + `downloadCSV(filename, csv)` |
| `supabase/src/hooks/useBulkSelection.ts` | `useBulkSelection<T>` returns `{ selected, toggle, selectAll, clear, count }` for checkboxes |
| `supabase/migrations/20260903_admin_enhancements.sql` | Schema (idempotent) |

### Modified files

| Path | Change |
|------|--------|
| `supabase/src/pages/admin/UserManagement.tsx` | A2 (drawer trigger), A3 (export button), A4 (bulk verify/suspend), A5 (audit write) |
| `supabase/src/pages/admin/Moderation.tsx` | A3 (export button), A4 (bulk cancel), A5 (audit write) |
| `supabase/src/components/Layout.tsx` | `navItems` for admin: keep "Dashboard" link but **redirect it to `/admin/analytics`** (already mapped to `/admin/dashboard`); add "Audit Log" link. **Use `replace` nav semantics only for the redirect** — see open question OQ-1. |
| `supabase/src/routes.tsx` | Add `/admin/analytics` and `/admin/audit` routes, both wrapped in `<RoleProtectedRoute allowedRole="admin">` |
| `supabase/src/types/index.ts` | Add `AuditLogEntry`, `User['suspended']` field |

---

## Implementation Order (TDD-friendly, vertical slices)

Each task is a self-contained unit. Build order minimizes compile errors between steps.

1. **Schema** — write & apply `supabase/migrations/20260903_admin_enhancements.sql` manually in Supabase SQL editor; verify `admin_audit_log` + `users.suspended` exist. Verify RLS by signing in as a non-admin and confirming a `select` returns 0 rows.

2. **Types** — add `AuditLogEntry` to `types/index.ts`; add `suspended`, `suspended_reason`, `suspended_at` to `User`.

3. **Utilities** — `supabase/src/lib/adminAudit.ts` (recordAudit helper with try/catch + dev warn) and `supabase/src/lib/csvExport.ts`. Standalone, no React. Build passes with no UI changes.

4. **AdminShell** — shared layout wrapper (header, breadcrumb, "← Back to Command Center" link). Standalone component.

5. **AnalyticsDashboard** — three Recharts charts. Pulls data via authenticated supabase. Standalone route. No other admin pages depend on this.

6. **AuditLog** — read-only feed. Subscribes to `postgres_changes` on `admin_audit_log` (anon realtime, like other feeds in the app) for live updates. Standalone route.

7. **UserDetailDrawer** — Radix `Sheet` from `@/components/ui/sheet`. Fetches: full user row, all trips/shipments/requests/reviews/messages (5 parallel queries), `VerificationBadge` state, suspend toggle. Stub-only at this point — wires up but no buttons call mutation yet.

8. **UserManagement updates** — A2 (drawer trigger on row click or new "View" button), A3 ("Export CSV" button top-right), A4 (column checkboxes + bottom action bar), A5 (every mutation calls `recordAudit`). All mutations route through the existing toggle/flow but add audit insert after success.

9. **Moderation updates** — A3 + A4 + A5, mirroring the UserManagement changes. Use the same `useBulkSelection` hook.

10. **Layout + Routes** — add `/admin/analytics` and `/admin/audit` to `routes.tsx`; add audit link to admin `navItems`; decide on dashboard redirect (OQ-1).

---

## Open Questions (Require User Input)

### OQ-1: How to handle the existing `/admin/dashboard` route?

The current `Layout.tsx:222` has `path: "/admin/dashboard"` for the admin "Dashboard" nav link, but `/admin/dashboard` is also a real route rendering the 4-card stats page. Three options:

- **(a) Recommended** — Keep `/admin/dashboard` route, but change the admin `navItems` entry to point at `/admin/analytics` instead. Old bookmark to `/admin/dashboard` still works (just shows the legacy 4-card view).
- **(b)** — Delete the legacy `/admin/dashboard` page entirely; redirect old URL → `/admin/analytics`. Cleaner but breaks any external link to the old dashboard.
- **(c)** — Build `/admin/analytics` and leave `/admin/dashboard` as a deprecated stub with a banner "Use the new Analytics dashboard →".

**Recommended: (a)** — non-breaking, minimal blast radius, can clean up in a future sprint.

### OQ-2: Bulk action UX — apply to all filtered, or only selected?

When a user has filters applied (e.g. role=trucker, verified=false) and clicks "Verify all selected", should the bulk action:
- **(a) Recommended** — Only affect rows currently shown AND selected (checkbox). Predictable, no surprise mutations.
- **(b)** — Apply to ALL rows matching the current filter (selection is just a confirmation step). Faster but dangerous.
- **(c)** — Always require explicit selection. Most safe.

**Recommended: (a)** — selection is explicit, filters are for narrowing what you see. Toast always shows the exact count.

### OQ-3: Suspend behavior — what exactly gets blocked?

The new `users.suspended` column can be flipped, but the *consequences* of being suspended need scope. For this sprint, the recommended scope is:

- **In scope:** UI shows suspended banner in User Detail Drawer; suspended user gets a yellow dot in UserManagement table; suspending writes audit log.
- **Out of scope (deferred):** Actually blocking the suspended user from signing in (requires Clerk `publicMetadata` sync), preventing them from posting new trips/shipments at the DB level, hiding their existing listings.

If you want full enforcement in this sprint, add a `CHECK` policy or trigger — but this requires coordination with the auth flow. Confirm whether UI-only is acceptable for Sprint 1.

---

## Validation Steps

After each file edit, run:
```bash
cd D:\Users\sanja\dyad-apps\load-saathi-app-1-osrm
pnpm typecheck
pnpm lint
```

At the end, full build:
```bash
pnpm build
```

### Manual smoke tests (admin user)

1. `/admin/analytics` loads, 3 charts render, no console errors. Refresh shows updated data.
2. `/admin/users` — click any row → drawer opens with that user's data. Toggle suspend → drawer reflects new state on close+reopen. Audit log row appears.
3. `/admin/users` — select 3 users → "Verify" → all 3 show verified badge; 3 audit log rows appear.
4. `/admin/users` — click "Export CSV" → browser downloads `users-2026-09-03.csv`; file contains all users (not just filtered/selected), UTF-8, headers in row 1.
5. `/admin/moderation` — same bulk + export behaviors for trips and shipments.
6. `/admin/audit` — see all actions performed above, filterable by action type. New rows appear in real time when other admin tabs perform mutations.
7. As a non-admin user (shipper or trucker) — visit `/admin/audit` directly. Should redirect to dashboard (RoleProtectedRoute blocks it).
8. As a non-admin user — try `supabase.from('admin_audit_log').select('*')` in dev console. Should return 0 rows (RLS).

### Regression checks

- Shipper and trucker dashboards, post trip/shipment flows, chat, credit score — all unchanged and still pass typecheck.
- Existing `/admin/dashboard`, `/admin/monitoring`, `/admin/moderation`, `/admin/gallery`, `/admin/team` — all still work.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| RLS policy blocks admin reads because Clerk JWT claim differs from `auth.uid()` | Confirmed in code: `useSupabase.ts` returns a Clerk-authenticated client; the existing `notifications` table uses the same pattern (admin RLS works in current code). Apply same pattern. |
| Bulk mutation partial failure (e.g. 3 of 5 succeed, 2 fail) | Use `Promise.allSettled`; show per-row success/failure toast; only write audit log for successes. |
| CSV export of 10k+ rows freezes browser | Add a 1000-row cap with a notice; for Sprint 2, switch to server-side export via Supabase Edge Function. |
| Audit log grows unbounded | Add a comment in the migration noting a future `DELETE WHERE created_at < now() - interval '90 days'` cron job. Don't implement now. |
| Drawer trigger accidentally fires on checkbox click | Stop event propagation in the row's checkbox `onClick` (standard pattern). |
| Analytics page makes 5+ slow queries | Use `Promise.all` + a single skeleton state; cache the result for 60s in React Query (`staleTime: 60_000`). |

---

## Deliverables

1. `supabase/migrations/20260903_admin_enhancements.sql` — applied to dev DB
2. `supabase/src/lib/adminAudit.ts` + `supabase/src/lib/csvExport.ts`
3. `supabase/src/hooks/useBulkSelection.ts`
4. `supabase/src/components/admin/AdminShell.tsx`
5. `supabase/src/pages/admin/AnalyticsDashboard.tsx`
6. `supabase/src/pages/admin/AuditLog.tsx`
7. `supabase/src/pages/admin/UserDetailDrawer.tsx`
8. `supabase/src/pages/admin/UserManagement.tsx` (modified)
9. `supabase/src/pages/admin/Moderation.tsx` (modified)
10. `supabase/src/components/Layout.tsx` (modified)
11. `supabase/src/routes.tsx` (modified)
12. `supabase/src/types/index.ts` (modified)

All passing `pnpm typecheck` + `pnpm lint` + `pnpm build` (0 new errors, 0 new warnings beyond the existing 15).

---

## What's Next (Sprint 2 Preview, NOT in scope)

Once Sprint 1 lands, the natural next set is:
- KYC document upload + review queue
- Payments/escrow + dispute workflow
- Real-time suspend enforcement (Clerk metadata sync)
- Shipper/Trucker analytics: lifetime GMV, monthly active users, top truckers
- Server-side CSV export for large datasets
- Promo codes / broadcast notifications

These will be planned separately.
