# B1 Remediation — Secrets in Git History

**Status:** Working tree is clean (no `.env`/`.env.local` tracked; `ruvector.db`,
`kilo.json`, `knowledge-graph.json` untracked as of the audit-fix commit).
**However, git history still contains the old `.env` commits** (e.g. `88d68ce`
"Updated .env", `47ae7ff` "Updated .env", `ae71b68` "Update binary database
files"), so the Clerk/Supabase secrets remain recoverable from any clone.

This cannot be fixed from code. It needs a coordinated history rewrite +
force-push + key rotation. Run the steps below when you can coordinate the
force-push (every clone of the repo must re-clone afterwards).

## 1. Confirm exposure

```powershell
git log --all --oneline -- .env .env.local ruvector.db
git show 88d68ce:.env   # inspect which keys were present
```

## 2. Rotate the exposed keys FIRST (before or in parallel with the rewrite)

Rotation makes the history rewrite non-urgent, so do this even if you postpone
the rewrite:

| Exposed secret | Where to rotate |
|---|---|
| Clerk keys (`pk_…`, `sk_…`) | Clerk Dashboard → API Keys → rotate secret key |
| Supabase `service_role` key | Supabase Dashboard → Settings → API → regenerate (service_role invalidates JWTs signed with it) |
| Supabase anon key | rotate only if it was in `.env` (it is publishable by design) |
| Supabase DB password | Supabase Dashboard → Settings → Database → reset password |
| Vercel/other tokens | respective dashboards |

Then update the new values in Vercel env vars (Production/Preview/Development).

## 3. Rewrite history (single machine, coordinated)

```powershell
# Requires: pipx install git-filter-repo  (or pip install git-filter-repo)
git clone --mirror https://github.com/<org>/<repo>.git D:\temp\repo-scrub
cd D:\temp\repo-scrub

# Remove the secret files from ALL history
git filter-repo --invert-paths --path .env --path .env.local --path ruvector.db --path kilo.json --path knowledge-graph.json

# Push the rewritten history
git push --force --mirror
```

Then on every machine: `git fetch origin && git reset --hard origin/main`
(or simply re-clone). Vercel will redeploy from the rewritten branch.

## 4. Post-rewrite checks

```powershell
git log --all --oneline -- .env .env.local   # must be empty
git rev-list --all --objects | Select-String "\.env$|ruvector"
```

Also contact GitHub Support to invalidate cached PR/fork views if the repo is
public — force-push does not purge GitHub's cached commit views.

## Why not done automatically

Rewriting history force-pushes and invalidates every existing clone, and
rotation invalidates live integrations — both are side-effecting operations on
a production repo, so they are documented here for the owner to execute.
