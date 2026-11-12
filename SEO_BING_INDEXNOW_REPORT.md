# LoadSaathi — Bing Webmaster Tools & IndexNow Implementation Report

**Date:** 2026-11-12
**Status:** IMPLEMENTED & TESTED — awaiting deployment approval (no deploy performed)
**Companion docs:** `docs/seo/bing-indexnow-audit-plan.md` (audit + plan), `SEO_IMPLEMENTATION_REPORT.md` (prior SEO work)

---

## 1. Summary

Implemented a complete, additive IndexNow integration for loadsaathi.in. No existing page, URL, metadata, Supabase table, auth flow, or app behavior was modified. The daily auto-notification is stateless (72-hour `lastmod` window over the live sitemap), so it needs no new storage and cannot produce duplicate submissions for unchanged URLs.

| Deliverable | Result |
|---|---|
| IndexNow key file at site root | ✅ `public/9524fce83efa44d6845fabaaa587ee5c.txt` (matches owner-provided key) |
| IndexNow key guard in prebuild | ✅ `scripts/generate-indexnow-key.mjs` — validates env key vs committed file; fails on mismatch; never invents a key |
| Server-side submission endpoint | ✅ `api/indexnow.js` — bearer-token protected (INDEXNOW_API_TOKEN), URL allowlist, batch ≤10k, upstream status mapping, 429 backoff, structured logging |
| Daily auto-notification cron | ✅ `api/cron/indexnow.js` — new/changed URLs only (lastmod ≤72h) + homepage; wired as `0 30 0 * * *` UTC in `vercel.json` |
| Manual/CLI submission utility | ✅ `scripts/submit-indexnow.mjs` — `--seed` (215), `--latest` (72h window), `--url` (single), `--dry-run`; npm scripts `indexnow:seed` / `indexnow:latest` |
| Self-test harness | ✅ `scripts/self-test-indexnow.mjs` — 13 checks (auth, allowlist, host pinning, dedupe window, upstream mapping) |
| Env documentation | ✅ `.env.example` documents `INDEXNOW_KEY` (public) and `INDEXNOW_API_TOKEN` (secret) |

---

## 2. Files changed

### New files
| File | Purpose |
|---|---|
| `public/9524fce83efa44d6845fabaaa587ee5c.txt` | IndexNow key file (public by design) |
| `api/indexnow.js` | Private batch submission endpoint |
| `api/cron/indexnow.js` | Daily incremental submission cron |
| `scripts/submit-indexnow.mjs` | CLI/manual submission tool |
| `scripts/generate-indexnow-key.mjs` | Prebuild key-file guard |
| `scripts/self-test-indexnow.mjs` | Self-test harness (no deps, Node-only) |
| `docs/seo/bing-indexnow-audit-plan.md` | Audit + implementation plan |

### Modified files (additive only)
| File | Change |
|---|---|
| `vercel.json` | +1 cron entry `{ "path": "/api/cron/indexnow", "schedule": "30 0 * * *" }` |
| `package.json` | `prebuild` chain += `generate-indexnow-key.mjs`; new scripts `indexnow:seed`, `indexnow:latest` |
| `.env.example` | Documented `INDEXNOW_KEY` + `INDEXNOW_API_TOKEN` (no values committed) |

---

## 3. Before / after

| Check | Before | After |
|---|---|---|
| IndexNow integration | none (grep zero hits) | key file + endpoint + cron + CLI + guard |
| IndexNow key file | n/a | `dist/` contains key file; content matches key (verified post-build) |
| Auto-notify new/changed pages | n/a | daily cron, lastmod ≤72h (stateless) |
| Duplicate submissions | n/a | unchanged URLs never resubmitted (verified by self-test: old lastmod excluded) |
| robots.txt / Bingbot | already allowed, sitemap declared | unchanged (no action needed) |
| Sitemap | 215 URLs | still 215 URLs (unchanged; same file for Google & Bing) |
| Google SEO surface | — | untouched (no src/index/metadata changes) |

---

## 4. Test results

| Gate | Result |
|---|---|
| `node --check` on all new JS | ✅ all pass |
| `scripts/self-test-indexnow.mjs` | ✅ 13/13 (auth 401/405, invalid JSON, http/www/query rejection, admin/login/api/share/screens rejection, valid-batch payload assertion, 429 handling, cron 72h eligibility incl. homepage, missing-key 503) |
| `scripts/generate-indexnow-key.mjs` | ✅ runs clean with and without env; matches committed key |
| `scripts/submit-indexnow.mjs --latest --dry-run` | ✅ submits only homepage (all other lastmod >72h) — dedupe proven |
| `scripts/submit-indexnow.mjs --seed --dry-run` | ✅ enumerates all 215 canonical URLs |
| `pnpm build` (prebuild → vite → prerender → smoke) | ✅ EXIT 0 — 220/220 routes prerendered; smoke ALL CHECKS PASSED (215-URL sitemap, canonicals, H1, titles ≤60, meta 140–155) |
| `pnpm test` (vitest) | ✅ 12 files, 178/178 passed |
| Live Bingbot probes (`bingbot/2.0`, GET) | ✅ `/` `/routes/rourkela-to-ranchi` `/blog/reduce-empty-kilometers` `/hi` `/location/rourkela` `/tools/fare-calculator` `/robots.txt` → all 200; `/admin/` → 404 |
| Live HTTP probes | ✅ `https://loadsaathi.in/robots.txt` 200, `https://loadsaathi.in/sitemap.xml` 200 (215 URLs) |

---

## 5. Remaining manual steps (owner — post-deploy)

1. **Vercel env vars:** set `INDEXNOW_KEY=9524fce83efa44d6845fabaaa587ee5c` and `INDEXNOW_API_TOKEN=<generated secret>` in Vercel → Settings → Environment Variables. **The generated secret (shown in chat / shared securely) must be used here**; it is intentionally not committed.
2. **Deploy** to production (requires approval — not done).
3. **Verify key file live:** `Invoke-WebRequest https://loadsaathi.in/9524fce83efa44d6845fabaaa587ee5c.txt` → 200, body == key.
4. **Seed IndexNow (one-time):** after deploy, run `pnpm indexnow:seed` (submits all 215 canonical URLs) — or hit `POST /api/indexnow` with the bearer token.
5. **Bing Webmaster Tools:** submit sitemap `https://loadsaathi.in/sitemap.xml` → “Sitemaps”. Watch “IndexNow” validation status in BWT.
6. **Verify cron:** after first 00:30 UTC run, check Vercel function logs for `indexnow-cron` info lines.

---

## 6. Safety compliance

- ✅ No pages deleted, no URLs changed, no metadata removed, no redirects added.
- ✅ No Supabase tables/auth touched; no new storage.
- ✅ Google Search Console surface unchanged (same sitemap file, same 215 URLs).
- ✅ No auto-deploy; no live IndexNow ping was sent during implementation (all tests dry-run/mocked).
- ✅ No invented data; key comes only from the owner-provided file `d:\Downloads\9524fce83efa44d6845fabaaa587ee5c.txt`.

---

## 7. Notes / limitations

- HTTP 200 from IndexNow means **received — not indexed**; indexing depends on Bing's crawl.
- Stateless window means a page edited and left untouched for >72h won't be re-notified unless its sitemap `lastmod` changes (by design — avoids duplicates).
- Deletion notifications are not automated (guardrail forbids page deletion); `--url` / the API can still ping a removed URL if ever needed.
- Backlink improvement plan (Bing's "insufficient inbound links" diagnostic) is in `docs/seo/bing-indexnow-audit-plan.md` §6 — owner execution required.
