# Freddy / Disha Agent SLO & Observability

**Owner:** CTO (TBD named owner for the Freddy/Disha surface)
**Date:** 2026-11-13
**Status:** Draft for review — needs CISO sign-off on the retention section before flip-on of `FREDDY_MEMORY_ENABLED=true`.

---

## 1. Service definition

The "Freddy agent" is the AI chatbot + mascot-assisted surface:

| Component | Role |
|---|---|
| `agent-router` (edge fn) | Orchestrator: Clerk-JWT verify, rate limit, intent parse, tool calls, memory |
| `gemini-proxy` (edge fn) | Intent-normalizer fallback chain (Gemini → Groq → OpenRouter) |
| `freddyIntent` / `freddyMemory` (shared) | LLM parse with deterministic fallback; server-side session store |
| `freddyAgent.ts` / `FreddyChatModal` (client) | Chat UI; agent-router is the single source of truth (no client-side parsing / direct DB reads) |
| `FreddyWidget` (avatar / pill variants) + Disha mascot/guide | Emissary surface on public/auth + authenticated layouts |

**Good request definition:** an authenticated chat turn that (a) produces a market/shipment/credit answer, or (b) degrades gracefully to the deterministic knowledge-base / keyword fallback. A *demoted-but-answered* turn counts as **good**. Only hard failures count against the error budget: 5xx, timeout with no fallback, auth/validation rejection of a well-formed request.

---

## 2. SLOs (target, 30-day rolling)

| SLI | Target | Rationale |
|---|---|---|
| Availability (hard-failure free turns) | **99.5%** | Client has 20s timeout; deterministic fallback covers LLM outages |
| Latency `p95`, end-to-end | **< 8s** | Below the 20s client timeout with headroom for retries |
| Latency `p50` | **< 2.5s** | Feels instant for the emoji-speed chat |
| 429 rate (per IP limiter) | **< 1%** of turns | Carrier-NAT false-429s are user-visible |
| LLM provider hit-rate | **≥ 80%** | Remainder served by deterministic fallback |
| Cost | **≤ $50/mo** (tokens, all providers) | Enforced via provider chain + caps |

**Error budget (99.5% over 30d):** 43,200 min/mo → **216 min** budget.

| Burn | Alert | Action |
|---|---|---|
| > 2%/1h sustained (~ 4.3 min) | page | L1: kill switch (`FREDDY_ENABLED`) if systemic |
| > 5%/1d sustained (~ 10.8 min) | pagerduty | L2: roll back provider chain to deterministic-only |
| > 50% budget spent in 30d | warn | Review provider config / scaling |

---

## 3. Measurement (implementation notes)

**Server-side (Supabase Logs Explorer):**
- Error rate per invocation: `function_name = 'agent-router'` (+ `gemini-proxy`), count `status_code >= 500` (or `status_code` in `{502,503,504}`) over 60s windows.
- 429 rate: `status_code = 429` per function.
- Latency: `avg(duration_ms)` / `percentile(duration_ms, 95)` per function.
- LLM hit-rate: instrument `freddyIntent`/`gemini-proxy` to log the chosen provider (`intentSource`) as a structured log field; quarter: `intentSource = 'llm'` vs `'fallback'`.

**Client-side (PostHog):**
- Event `freddy_turn` with `{ ok, tool, latency_ms, fallback_used }` fired by `FreddyChatModal` on settle (they already run PostHog).
- Dashboard: p95/p50 latency, ok-rate, fallback-rate over 7/30d.

**Cost:**
- Gemini/Groq/OpenRouter dashboards, monthly sum; compare vs $50 cap.

---

## 4. Conversation-memory retention (CISO gate)

`public.freddy_sessions` stores chat transcripts (PII). The retention job is now implemented as migration `20261114_freddy_sessions_ttl.sql` (pg_cron, daily 03:00 UTC, 30-day idle TTL, skipped if pg_cron is absent). Remaining steps before enabling `FREDDY_MEMORY_ENABLED=true` at scale:

1. **CISO sign-off** that the 30d idle TTL matches the privacy notice.
2. **Audit:** track purge runs (count of deleted rows per run) in logs; confirm with CISO.
3. **Opt-out:** keep `FREDDY_MEMORY_ENABLED` env as global kill switch + add a per-user `chat_memory_enabled` flag later if required.

---

## 5. Review cadence
- **Monthly:** burn-rate check, p95 trend, 429 rate, LLM cost vs cap.
- **On change:** re-verify after any `freddyIntent` prompt change (unit tests exist) or provider/key rotation.
- **Release gate:** `astryx doctor` + `pnpm check` before any frontend delivery; edge-function tests via `supabase functions test`.
