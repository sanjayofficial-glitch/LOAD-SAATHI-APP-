# LoadSaathi — Credential Rotation Checklist (SEC-03 / SEC-04)

> Status: Phase 1 remediation · 2026-11-13.
> This document is a **checklist for a human** — no automated rotation is run
> by CI or by agents. Review each item, rotate at the provider dashboard, and
> tick it off.

## 1. What the scan found

| Item | Where | Classification | Action |
|---|---|---|---|
| Gemini API key `AIzaSyC7‑gx0LW0TTM6MRMnYA0ibnqb6Ipp_LNk` | `.env` in git history (~200 commits) | **Privileged — leaked** | **Rotate now** (see §2) |
| Clerk publishable key `pk_test_…` (multiple test values) | `.env` / `.env.development` / `.env.production` history | Public by design (publishable keys are safe to expose; only secret keys are sensitive) | No action; replace with live key when you exit test mode |
| Supabase **anon** key (`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…`) | `.env` history | Public by design (anon key is intended for client use) | No action |
| `INDEXNOW_KEY` | `.env.example` | Public by design (verification key must be public on the site) | No action |
| Groq / HuggingFace / OpenRouter / Fish keys | **None found in git history or frontend** | — | None (these already live as server-side Supabase secrets) |

## 2. Rotate the leaked Gemini key (do this FIRST)

1. Go to Google AI Studio → API keys (https://aistudio.google.com/apikey).
2. Identify the key matching `AIzaSyC7‑gx0LW0TTM6MRMnYA0ibnqb6Ipp_LNk` (or delete it key).
3. **Revoke / delete the old key** — this is the critical step; deletion makes
   the leaked key useless immediately.
4. Create a new Gemini API key.
5. Set it as the server-side Supabase Edge Function secret (never in frontend
   code or `.env`):
   - Supabase dashboard → Edge Functions → Secrets → update `GEMINI_API_KEY`,
     or run local `supabase secrets set GEMINI_API_KEY=<new>` (requires local
     Supabase CLI and project link).
6. Verify: call one AI-powered page (e.g. price estimator / Freddy) and
   confirm it still works with the new key.
7. Double-check no other service was using the old key (search the provider
   dashboard usage for the old key ID).

## 3. Check for other leaked secrets (periodic)

Re-run the repo scan locally:

```powershell
# PowerShell (Windows)
git grep -n -E "gsk_[A-Za-z0-9]{10,}|hf_[A-Za-z0-9]{10,}|AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|GH[su]_[A-Za-z0-9]{20,}" (git rev-list --all)
```

CI now runs gitleaks on every push/PR (`.github/workflows/secret-scan.yml`),
so new leaks will fail the pipeline.

## 4. Git history cleanup (deferred — NOT force-pushed)

- Current state: keys are **rotated**, so the historical leak is harmless.
- If you later want the old value out of history, options:
  1. Keep history as-is (recommended once rotated) — simplest and safe.
  2. Rewrite history with `git filter-repo` / BFG, then force-push. This
     requires **explicit approval** and coordination with any collaborators,
     clones, or CI caches. Do not do this without approval.

## 5. Guardrails for the future

- Never put any real key in `.env`, `.env.example`, or any committed file.
- Frontend env vars (VITE_*) are only for **public** values (anon key,
  publishable keys). Anything that grants money or data access belongs on the
  server (Supabase Edge Function secrets / Vercel envs).
- If a secret must be shown to an admin (e.g. the key manager page), it is
  masked (`has_value` only) and never returned to the browser.
