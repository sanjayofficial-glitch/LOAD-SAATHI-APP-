# Digital Freight Credit Score — Design Doc

**Phase:** 1 of 4 (Safety & Trust → BI)
**Status:** Draft
**Date:** 2026-07-02

---

## Credit-score concept map

```mermaid
flowchart TD
    HISTORY[Trip and account history] --> FACTORS[Completion, timeliness, communication, reviews, tenure]
    FACTORS --> WEIGHT[Weighted calculation]
    WEIGHT --> SCORE[Score from 300 to 900]
    SCORE --> INSIGHTS[Narrative insights and trust signal]
```


## 1. Overview

A **freight credit score** (300–900 range, CIBIL-like) for every user (shipper & trucker) on the Load Saathi platform. The score reflects trustworthiness and reliability based purely on platform-internal data. Visible to both parties — shippers use it to pick reliable truckers, truckers use it to evaluate shipper reliability.

Core scoring is **deterministic SQL** (fast, auditable, no API cost). AI enrichment (existing multi-provider chain) adds natural-language reasoning and improvement suggestions.

---

## 2. Data Sources (Platform-Only)

All data already in the database:

| Factor | Table(s) | Notes |
|--------|----------|-------|
| Trip completion rate | `trips` | completed vs cancelled by trucker |
| Request acceptance rate | `requests`, `shipment_requests` | accepted vs rejected/expired |
| Average rating | `reviews` | bidirectional — both shipper→trucker and trucker→shipper |
| Rating volume | `reviews` | count of reviews received (confidence signal) |
| Account age | `users` | days since `created_at` |
| Activity recency | `trips`, `shipments`, `requests` | days since last activity |
| Verification status | `users.is_verified` | boolean, set by admin |
| Profile completeness | `users` | phone, company_name, full_name filled |
| Cancellation rate | `trips.status` | trips cancelled after acceptance |
| Chat responsiveness | `messages` | avg response time (stretch goal) |

---

## 3. Scoring Engine (PostgreSQL)

### 3.1 Table: `credit_scores`

```sql
create table public.credit_scores (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id),
  score integer not null check (score >= 300 and score <= 900),
  tier text not null check (tier in ('poor', 'fair', 'good', 'very_good', 'excellent')),
  factors jsonb not null default '{}',
  calculated_at timestamptz not null default now(),
  unique(user_id)
);
```

The `factors` JSONB stores the raw factor breakdown for transparency:
```json
{
  "trip_completion": { "score": 85, "weight": 0.30, "raw": 0.92 },
  "request_acceptance": { "score": 70, "weight": 0.20, "raw": 0.85 },
  "average_rating": { "score": 90, "weight": 0.20, "raw": 4.5 },
  "rating_volume": { "score": 60, "weight": 0.10, "raw": 12 },
  "account_age": { "score": 75, "weight": 0.10, "raw": 180 },
  "verification": { "score": 100, "weight": 0.10, "raw": true }
}
```

### 3.2 PG Function: `calculate_credit_score(p_user_id)`

A PL/pgSQL function that:
1. Queries the user's trip history, request history, reviews, and profile
2. Computes each factor score (0–100) and applies weight
3. Maps weighted sum to 300–900 range and tier

**Tier mapping:**
| Range | Tier |
|-------|------|
| 300–499 | poor |
| 500–649 | fair |
| 650–749 | good |
| 750–849 | very_good |
| 850–900 | excellent |

**Scheduled refresh:** A Supabase cron job (pg_cron) refreshes scores daily. Scores are also refreshed on trigger (trip completion, review posted, etc.).

### 3.3 Trigger-Refresh Pattern

Triggers on `trips`, `reviews`, `shipment_requests` call a helper that marks the user's score as stale. The next read of `credit_scores` for that user recalculates if stale. This avoids recalculating every user on every event.

---

## 4. AI Enrichment (Edge Function)

### 4.1 New Edge Function: `credit-insights`

Reuses the **same multi-provider chain** from `price-predict`:
```
Gemini (gemini-2.0-flash-lite) → Groq (llama-3.3-70b-versatile) → OpenRouter → fallback
```

**Input:** `{ user_id, score, tier, factors }` — the raw score data

**Output:** `{ summary, strengths[], improvements[], trend }`
- `summary`: "Ramesh has a strong credit profile with 95% trip completion..."
- `strengths[]`: ["92% trip completion rate", "Verified user since 2024"]
- `improvements[]`: ["Accept more booking requests to improve acceptance rate"]
- `trend`: "stable" | "improving" | "declining" (based on recent score changes)

The edge function is **optional** — if all AI providers fail, the UI shows just the deterministic score with "AI insights unavailable" fallback.

### 4.2 First-Time Score Calculation

When a user has zero trip history, they get a **default score of 550** ("fair") with a factor breakdown that shows "insufficient data" — this gives new users a baseline without penalizing them.

---

## 5. Frontend

### 5.1 Credit Score Badge (Reusable Component)

A small badge showing score + tier color, used on:
- User profile pages (trucker & shipper)
- Trip detail page (shows trucker's score)
- Browse trips / browse shipments cards
- Chat sidebar

**Visual:** Circular gauge or colored pill with score number. Colors: red (poor), orange (fair), yellow (good), teal (very_good), green (excellent).

### 5.2 Credit Score Detail Page

Route: `/credit-score` (accessible from profile)

Sections:
1. **Score gauge** — large animated gauge showing current score with tier label
2. **Factor breakdown** — bar chart showing each factor's contribution (as a score out of 100)
3. **AI insights** — natural-language summary (when available), strengths, improvements
4. **History chart** — score trend over time (line chart, last 30 data points)
5. **What affects your score** — explainer section with tips

### 5.3 Score on Trip/Shipment Cards

In browse views, a small credit score badge appears next to each user's name. Color-coded so shippers can quickly gauge reliability at a glance.

---

## 6. Security & RLS

```sql
-- credit_scores RLS
create policy "Users can see their own score"
  on credit_scores for select
  using (auth.jwt()->>'sub' = user_id);

create policy "Shippers can see trucker scores"
  on credit_scores for select
  using (exists (
    select 1 from users
    where users.id = auth.jwt()->>'sub'
    and users.user_type in ('shipper', 'admin')
  ));

create policy "Truckers can see shipper scores"
  on credit_scores for select
  using (exists (
    select 1 from users
    where users.id = auth.jwt()->>'sub'
    and users.user_type in ('trucker', 'admin')
  ));
```

The scoring function is `SECURITY DEFINER` (runs as owner) so it can read all necessary tables.

---

## 7. API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/functions/v1/credit-score` | GET | Returns user's credit score + factors |
| `/functions/v1/credit-score?user_id=X` | GET | Returns another user's score (RLS-gated) |
| `/functions/v1/credit-insights` | POST | Returns AI-enriched insights |

Also a Supabase RPC for direct DB access:
```sql
select * from get_credit_score('user_id_here');
```

---

## 8. Migration Files

| File | Purpose |
|------|---------|
| `supabase/migrations/0040_credit_scores.sql` | Create `credit_scores` table, `credit_score_factor` type, `calculate_credit_score()` function, triggers, RLS |
| `supabase/functions/credit-score/index.ts` | Edge function for score retrieval |
| `supabase/functions/credit-insights/index.ts` | Edge function for AI enrichment |

---

## 9. Error Handling & Edge Cases

| Case | Handling |
|------|----------|
| No trip history | Default score of 550 ("fair"), factors show "insufficient data" |
| AI provider chain fails | Return deterministic score only, UI shows "Insights unavailable" |
| Score calculation error | Return previous score with `stale: true` flag |
| User not found in `users` table | Return 404 |
| RLS violation (user not allowed to see another's score) | Return 403 |
| Concurrent score updates | `unique(user_id)` constraint + ON CONFLICT UPDATE pattern |

---

## 10. Testing Strategy

Since there are no existing tests:
- **SQL tests** — manual verification of `calculate_credit_score()` with known inputs
- **Edge function tests** — `curl` calls against local Supabase
- **Frontend** — visual verification of badge, gauge, factor breakdown

Test scenarios:
1. New user → score = 550, tier = fair
2. Trucker with 10 completed trips, 5.0 rating → high score
3. Trucker with 3 cancelled trips → lower score
4. Shipper with many completed shipments → high score
5. AI provider down → fallback to deterministic-only display

---

## 11. Future Considerations (Phase 2+)

- Score decay for inactive accounts
- Negative events (disputes, no-shows) as score penalties
- External data integration (RC verification, UPI payment history)
- Fleet-level aggregated credit score
