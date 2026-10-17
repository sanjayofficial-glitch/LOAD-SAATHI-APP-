# LoadSaathi — Tracking: Rollback & Backup

## 0. Before ANY production DDL
Record the current policies and state so we can paste them back.

### Capture (READ-ONLY, safe)
Run this in Supabase SQL editor **before** changes; save the CSV to `docs/tracking/_sql/_snapshots/<date>.csv`.
See `docs/tracking/_sql/02_capture_state.sql`.

### Capture roles/users (optional but recommended)
Backup admin identity:
```sql
SELECT id, user_type FROM public.users WHERE user_type IN ('admin','trucker','shipper') ORDER BY user_type;
```

## 1. Backup strategy
- Use `supabase db dump` (CLI) or the SQL content above saved as a file.
- No paid storage needed — commit the dump to a private branch, not production `main`.
- Also export migration history:
```bash
supabase migration list && supabase db dump --schema-only -f /tmp/pre-change-schema.sql 2>&1 | tee
```

## 2. Rollback file convention
Every migration ships with a sibling rollback:
- `supabase/migrations/<ts>_harden_live_location_participant_rls.sql`
- `supabase/migrations/<ts>_harden_live_location_participant_rls_ROLLBACK.sql`
Rollback file must restore the **original permissive** policies byte-for-byte. Example:
```sql
-- ROLLBACK: restore permissive reads (verified live as of 2026-10-16)
DROP POLICY IF EXISTS "Driver, participant or admin can read driver location" ON public.driver_locations;
CREATE POLICY "Anyone can read driver locations"
  ON public.driver_locations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Scoped read load_locations" ON public.load_locations;
CREATE POLICY "Anyone can read load_locations"
  ON public.load_locations FOR SELECT TO authenticated USING (true);
```
⚠️ **Edit rollback values from your actual captured backup** — do not blindly copy examples.

## 3. Dev-branch rehearsal (required before prod)
1. `supabase branches create tracking-rls-dev`
2. Switch to the branch's `project_ref`.
3. Apply the migration **only on the branch**.
4. Run the verification checklist with a real shipper + admin + trucker.
5. Merge or discard after pass; **never merge with failing verification**.
6. Do not invoke `supabase migration repair` or `db pull` from production implicitly.

## 4. Emergency revert order (if production wrong)
1. Apply the rollback migration (`apply_migration`) for RLS only; wait < 1 minute until policies restore. Most writes resume immediately.
2. If any code layer rejects reads, ship a revert of the deployed frontend build (Vercel revert deployment) — no DB damage.
3. Confirm via:
```sql
SELECT policyname, qual FROM pg_policies WHERE tablename='driver_locations' AND cmd='SELECT';
```
`qual` should return `true` after a correct rollback.
4. Keep the app live; do not clear connection caches forcibly.
5. Only after stability do you re-attempt.

## 5. Never do (without approval)
- `UPDATE/DELETE` on `driver_locations`, `trips`, `requests` directly.
- Drop tables or rename columns.
- Expose service-role key or read server files via SQL.
- Edit policies manually from Studio console — only via auditable migrations.
- Merge or `db push` to production from an unverified branch.
