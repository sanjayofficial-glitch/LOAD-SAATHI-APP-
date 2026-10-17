# LoadSaathi — Live Truck Tracking: Safety Guide Pack

**Goal:** Improve/reuse the existing driver-location tracking **without risking the live database or running app.** All steps assume production is live and must not be brought down.

## Golden rules
1. **No production writes** (migrations, RLS changes, data deletes) until we have verified on a Supabase dev branch with a real signed-in user.
2. **Always capture a backup** of policies/schema before any DDL (see `01-rollback-and-backup.md`).
3. **One change at a time** — RLS migration OR code edits, never both in the same release.
4. **Rollback ready before applying** — every change ships with a paired rollback file.
5. **Keep the site live** — no destructive/secrets changes; if unsure, stop and ask.

## Index
- `00-current-state-audit.md` — real live DB state (verified, not docs)
- `01-rollback-and-backup.md` — how to snapshot & revert safely
- `02-migration-runsheet.md` — dev-branch-first run sheet
- `03-verification-checklist.md` — acceptance/error checks
- `_sql/02_capture_state.sql` — read-only state capture script
- `_sql/02_restore_state_rollback.sql` — one-click restore (to be edited to actual backup values)

## Key context (verified 2026-10-16)
- Live `driver_locations`: 16 rows; `USING (true)` SELECT (permissive) — leaked today.
- `load_locations`: same permissive SELECT.
- `trips`: auth `USING (true)`.
- 1 admin in `users` (`user_type='admin'`).
- `is_admin()` works (SECURITY DEFINER).
- Build broken separately by missing `VITE_*` env (AUDIT TEST-13), zero test files.
- Repo has a large in-progress SEO diff — do not stack tracking work on it; use a fresh branch.
