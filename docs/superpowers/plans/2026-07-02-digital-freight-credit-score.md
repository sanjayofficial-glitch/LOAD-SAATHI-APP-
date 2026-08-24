# Digital Freight Credit Score — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a freight credit score (300–900) for every user, computed from platform-internal data, with AI enrichment for insights.

**Architecture:** Deterministic PostgreSQL scoring function (fast, auditable) + optional AI enrichment via existing multi-provider chain (Gemini → Groq → OpenRouter → fallback). Frontend components show score badge on browse/trip pages and a detailed score page.

**Tech Stack:** PostgreSQL (Supabase), Deno Edge Functions, React 19 + TypeScript + TanStack Query, Recharts, Tailwind CSS, shadcn/ui

## Global Constraints

- All edge functions use `getEnv(name)` helper (NOT module-level const) for env vars
- Edge functions follow the exact multi-provider chain pattern from `price-predict`: Gemini 2.0 Flash Lite (`?key=` URL param) → Groq (`llama-3.3-70b-versatile`) → OpenRouter → data fallback
- No new auth infrastructure — Clerk + Supabase RLS handles access
- All scoring is from platform-internal data only (no external API calls for score calculation)
- Frontend lazy-loads all route pages with `React.lazy()` + `Suspense`
- Score is visible to all authenticated users (mutual trust signal) — RLS permits this

---

## Delivery plan shape

```mermaid
flowchart LR
    DISCOVERY[Understand scoring goals] --> DESIGN[Define factors and boundaries]
    DESIGN --> IMPLEMENT[Build score calculation]
    IMPLEMENT --> VERIFY[Validate with tests and examples]
    VERIFY --> RELEASE[Release behind a controlled workflow]
```

## File Structure

| File | Purpose |
|------|---------|
| `supabase/migrations/20260702_credit_scores.sql` | Creates `credit_scores` table, `calculate_credit_score()` function, trigger refresh pattern, RLS policies |
| `supabase/functions/credit-score/index.ts` | Edge function: GET single-user credit score (read from DB) |
| `supabase/functions/credit-insights/index.ts` | Edge function: AI enrichment — returns summary, strengths, improvements, trend |
| `src/hooks/useCreditScore.ts` | React hook — fetches credit score via edge function |
| `src/types/index.ts` | Add `CreditScore` and `CreditInsights` interfaces |
| `src/components/credit-score/CreditScoreBadge.tsx` | Small colored badge showing score + tier |
| `src/components/credit-score/CreditScoreGauge.tsx` | Large animated gauge for detail page |
| `src/components/credit-score/CreditScoreDetail.tsx` | Score overview card with factors breakdown |
| `src/components/credit-score/CreditScoreHistory.tsx` | Trend chart using Recharts |
| `src/components/credit-score/AIInsights.tsx` | AI insights card (summary, strengths, improvements) |
| `src/pages/CreditScore.tsx` | Full credit score page at `/credit-score` |
| `src/App.tsx` | Add route for `/credit-score` |
| `src/pages/trip/TripDetail.tsx` | Add credit score badge next to trucker rating |
| `src/pages/shipper/BrowseTrips.tsx` | Add credit score badge on trip cards |
| `src/pages/Profile.tsx` | Add link to credit score page + badge |

### Task 1: Database Migration — credit_scores table + scoring function

**Files:**
- Create: `supabase/migrations/20260702_credit_scores.sql`

- [ ] **Step 1: Create migration file**

```sql
-- 001: Create credit_scores table
create table if not exists public.credit_scores (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  score integer not null check (score >= 300 and score <= 900),
  tier text not null check (tier in ('poor', 'fair', 'good', 'very_good', 'excellent')),
  factors jsonb not null default '{}',
  calculated_at timestamptz not null default now(),
  unique(user_id)
);

-- 002: Create function to calculate credit score
create or replace function public.calculate_credit_score(p_user_id text)
returns table(
  score integer,
  tier text,
  factors jsonb
)
language plpgsql
security definer
as $$
declare
  v_trip_completion_rate numeric;
  v_trip_completion_score numeric;
  v_acceptance_rate numeric;
  v_acceptance_score numeric;
  v_avg_rating numeric;
  v_rating_score numeric;
  v_rating_count integer;
  v_rating_volume_score numeric;
  v_account_age_days integer;
  v_account_age_score numeric;
  v_is_verified boolean;
  v_verification_score numeric;
  v_total_score numeric;
  v_final_score integer;
  v_tier text;
  v_factors jsonb;
begin
  -- Trip completion rate: completed vs cancelled (trucker) or completed vs cancelled (shipper shipments)
  select
    case
      when count(*) > 0 then
        round((count(*) filter (where status in ('completed', 'delivered', 'in_transit'))::numeric / count(*)::numeric) * 100, 1)
      else 0
    end
  into v_trip_completion_rate
  from (
    select status from public.trips where trucker_id = p_user_id
    union all
    select status from public.shipments where shipper_id = p_user_id
  ) t;

  v_trip_completion_score := case
    when v_trip_completion_rate >= 95 then 100
    when v_trip_completion_rate >= 85 then 85
    when v_trip_completion_rate >= 70 then 65
    when v_trip_completion_rate >= 50 then 45
    when v_trip_completion_rate > 0 then 25
    else 0
  end;

  -- Request acceptance rate: accepted / (accepted + rejected) for sent requests
  select
    case
      when count(*) > 0 then
        round((count(*) filter (where status = 'accepted')::numeric / count(*)::numeric) * 100, 1)
      else 0
    end
  into v_acceptance_rate
  from (
    select status from public.requests where receiver_id = p_user_id
    union all
    select status from public.shipment_requests where trucker_id = p_user_id
  ) r;

  v_acceptance_score := case
    when v_acceptance_rate >= 90 then 100
    when v_acceptance_rate >= 75 then 85
    when v_acceptance_rate >= 50 then 65
    when v_acceptance_rate >= 25 then 40
    when v_acceptance_rate > 0 then 20
    else 0
  end;

  -- Average rating from reviews
  select
    round(coalesce(avg(rating), 0)::numeric, 2),
    count(*)
  into v_avg_rating, v_rating_count
  from public.reviews
  where
    (reviewer_role = 'shipper' and trucker_id = p_user_id)
    or (reviewer_role = 'trucker' and shipper_id = p_user_id);

  v_rating_score := case
    when v_avg_rating >= 4.8 then 100
    when v_avg_rating >= 4.5 then 90
    when v_avg_rating >= 4.0 then 75
    when v_avg_rating >= 3.0 then 50
    when v_avg_rating >= 1.0 then 25
    else 0
  end;

  -- Rating volume confidence (few reviews = less reliable signal)
  v_rating_volume_score := case
    when v_rating_count >= 50 then 100
    when v_rating_count >= 20 then 85
    when v_rating_count >= 10 then 65
    when v_rating_count >= 5 then 45
    when v_rating_count >= 1 then 25
    else 0
  end;

  -- Account age
  select coalesce(
    extract(day from now() - created_at)::integer, 0
  ) into v_account_age_days
  from public.users
  where id = p_user_id;

  v_account_age_score := case
    when v_account_age_days >= 365 then 100
    when v_account_age_days >= 180 then 85
    when v_account_age_days >= 90 then 70
    when v_account_age_days >= 30 then 50
    when v_account_age_days >= 7 then 30
    else 10
  end;

  -- Verification status
  select is_verified into v_is_verified
  from public.users
  where id = p_user_id;

  v_verification_score := case when v_is_verified then 100 else 40 end;

  -- Weighted total (0-100)
  v_total_score :=
    (v_trip_completion_score * 0.30) +
    (v_acceptance_score * 0.20) +
    (v_rating_score * 0.20) +
    (v_rating_volume_score * 0.10) +
    (v_account_age_score * 0.10) +
    (v_verification_score * 0.10);

  -- Scale to 300-900
  v_final_score := greatest(300, least(900, round(300 + (v_total_score / 100.0 * 600))::integer));

  -- Determine tier
  v_tier := case
    when v_final_score >= 850 then 'excellent'
    when v_final_score >= 750 then 'very_good'
    when v_final_score >= 650 then 'good'
    when v_final_score >= 500 then 'fair'
    else 'poor'
  end;

  v_factors := jsonb_build_object(
    'trip_completion', jsonb_build_object('score', v_trip_completion_score, 'weight', 0.30, 'raw', v_trip_completion_rate),
    'request_acceptance', jsonb_build_object('score', v_acceptance_score, 'weight', 0.20, 'raw', v_acceptance_rate),
    'average_rating', jsonb_build_object('score', v_rating_score, 'weight', 0.20, 'raw', v_avg_rating),
    'rating_volume', jsonb_build_object('score', v_rating_volume_score, 'weight', 0.10, 'raw', v_rating_count),
    'account_age', jsonb_build_object('score', v_account_age_score, 'weight', 0.10, 'raw', v_account_age_days),
    'verification', jsonb_build_object('score', v_verification_score, 'weight', 0.10, 'raw', v_is_verified)
  );

  return query select v_final_score, v_tier, v_factors;
end;
$$;

-- 003: Function to upsert credit score (called by triggers and refresh)
create or replace function public.refresh_credit_score(p_user_id text)
returns void
language plpgsql
security definer
as $$
declare
  v_score integer;
  v_tier text;
  v_factors jsonb;
begin
  select s.score, s.tier, s.factors into v_score, v_tier, v_factors
  from public.calculate_credit_score(p_user_id) s;

  insert into public.credit_scores (user_id, score, tier, factors, calculated_at)
  values (p_user_id, v_score, v_tier, v_factors, now())
  on conflict (user_id)
  do update set score = excluded.score, tier = excluded.tier, factors = excluded.factors, calculated_at = excluded.calculated_at;
end;
$$;

-- 004: Trigger function — marks score as stale (schedules refresh)
create or replace function public.on_user_activity_change()
returns trigger
language plpgsql
security definer
as $$
declare
  v_user_id text;
begin
  if tg_table_name = 'trips' then
    v_user_id := new.trucker_id;
  elsif tg_table_name = 'shipments' then
    v_user_id := new.shipper_id;
  elsif tg_table_name = 'reviews' then
    v_user_id := new.trucker_id;
    perform public.refresh_credit_score(new.shipper_id);
  elsif tg_table_name in ('requests', 'shipment_requests') then
    v_user_id := coalesce(new.receiver_id, new.trucker_id);
  else
    return new;
  end if;

  if v_user_id is not null then
    perform public.refresh_credit_score(v_user_id);
  end if;

  return new;
end;
$$;

-- 005: Triggers on activity tables
create trigger trg_trip_credit_score
  after insert or update of status on public.trips
  for each row execute function public.on_user_activity_change();

create trigger trg_shipment_credit_score
  after insert or update of status on public.shipments
  for each row execute function public.on_user_activity_change();

create trigger trg_review_credit_score
  after insert on public.reviews
  for each row execute function public.on_user_activity_change();

create trigger trg_request_credit_score
  after insert or update of status on public.requests
  for each row execute function public.on_user_activity_change();

create trigger trg_shipment_request_credit_score
  after insert or update of status on public.shipment_requests
  for each row execute function public.on_user_activity_change();

-- 006: RLS
alter table public.credit_scores enable row level security;

create policy "Authenticated users can view all credit scores"
  on public.credit_scores for select
  using (auth.jwt()->>'sub' is not null);

create policy "System can insert/update credit scores"
  on public.credit_scores for insert
  with check (true);

create policy "System can update credit scores"
  on public.credit_scores for update
  using (true);
```

- [ ] **Step 2: Verify migration syntax**

Run: `cd supabase && npx supabase db diff --file 20260702_credit_scores`
Expected: Creates the table, functions, triggers, and RLS policies

### Task 2: Credit Score Edge Function

**Files:**
- Create: `supabase/functions/credit-score/index.ts`

- [ ] **Step 1: Create edge function**

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getEnv(name: string): string {
  return Deno.env.get(name) ?? "";
}

Deno.serve(async (req: Request) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  try {
    const url = new URL(req.url);
    const targetUserId = url.searchParams.get("user_id");
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Server config error" }), { status: 500, headers });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${supabaseKey}` } },
    });

    // Verify caller is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers });
    }

    // If no user_id specified, return caller's score. Otherwise return target's score.
    const queryUserId = targetUserId || user.id;

    // Get score — if stale or missing, calculate fresh
    const { data: existing } = await supabase
      .from("credit_scores")
      .select("score, tier, factors, calculated_at")
      .eq("user_id", queryUserId)
      .maybeSingle();

    // Return existing if fresh (less than 1 hour old)
    if (existing) {
      const ageMinutes = (Date.now() - new Date(existing.calculated_at).getTime()) / 60000;
      if (ageMinutes < 60) {
        return new Response(JSON.stringify({
          user_id: queryUserId,
          score: existing.score,
          tier: existing.tier,
          factors: existing.factors,
          calculated_at: existing.calculated_at,
          stale: false,
        }), { status: 200, headers });
      }
    }

    // Calculate fresh score
    const { data: fresh } = await supabase.rpc("refresh_credit_score", { p_user_id: queryUserId });

    const { data: scoreRow } = await supabase
      .from("credit_scores")
      .select("score, tier, factors, calculated_at")
      .eq("user_id", queryUserId)
      .maybeSingle();

    if (!scoreRow) {
      // New user with no history — default score
      return new Response(JSON.stringify({
        user_id: queryUserId,
        score: 550,
        tier: "fair",
        factors: {
          trip_completion: { score: 0, weight: 0.30, raw: 0 },
          request_acceptance: { score: 0, weight: 0.20, raw: 0 },
          average_rating: { score: 0, weight: 0.20, raw: 0 },
          rating_volume: { score: 0, weight: 0.10, raw: 0 },
          account_age: { score: 10, weight: 0.10, raw: 1 },
          verification: { score: 40, weight: 0.10, raw: false },
        },
        calculated_at: new Date().toISOString(),
        stale: false,
        insufficient_data: true,
      }), { status: 200, headers });
    }

    return new Response(JSON.stringify({
      user_id: queryUserId,
      score: scoreRow.score,
      tier: scoreRow.tier,
      factors: scoreRow.factors,
      calculated_at: scoreRow.calculated_at,
      stale: false,
    }), { status: 200, headers });

  } catch (err) {
    console.error("Credit score error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers });
  }
});
```

### Task 3: Credit Insights Edge Function (AI Enrichment)

**Files:**
- Create: `supabase/functions/credit-insights/index.ts`

**Interfaces:**
- Consumes: `{ user_id, score, tier, factors }` from Task 2
- Produces: `{ summary, strengths[], improvements[], trend }`

- [ ] **Step 1: Create the AI enrichment edge function**

Uses the **identical multi-provider chain** from `price-predict` — copy the exact `geminiProvider`, `groqProvider`, `openRouterProvider`, and `parseAIResponse` helpers. Only the prompt and the final response shape change.

```typescript
function getEnv(name: string): string {
  return Deno.env.get(name) ?? "";
}

interface CreditInsightInput {
  user_id: string;
  score: number;
  tier: string;
  factors: Record<string, { score: number; weight: number; raw: number | boolean }>;
  user_name?: string;
}

interface CreditInsightResult {
  summary: string;
  strengths: string[];
  improvements: string[];
  trend: "stable" | "improving" | "declining";
}

interface ProviderResult {
  success: boolean;
  data?: CreditInsightResult & { provider?: string };
  rateLimited?: boolean;
}

function buildInsightPrompt(input: CreditInsightInput): string {
  const factorLines = Object.entries(input.factors)
    .map(([key, val]) => `- ${key}: score ${val.score}/100 (raw: ${val.raw}, weight: ${val.weight * 100}%)`)
    .join("\n");

  return `You are a freight credit analyst for an Indian logistics platform. Given a user's credit score data, provide a brief analysis.

User: ${input.user_name || "User"}
Credit Score: ${input.score}/900 (${input.tier})
Factor Breakdown:
${factorLines}

Return ONLY a JSON object (no markdown):
{
  "summary": "1-2 sentence summary of their credit profile",
  "strengths": ["2-3 specific strengths based on their top factors"],
  "improvements": ["2-3 specific actionable improvements based on their lowest factors"],
  "trend": "stable" | "improving" | "declining"
}

Base the trend on whether their high-weight factors (trip_completion, acceptance_rate, rating) are strong or weak.`;
}

function parseAIResponse(text: string): CreditInsightResult | null {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// Copy geminiProvider, groqProvider, openRouterProvider from price-predict exactly
// Only change: the prompt variable passed to each provider

function localFallback(input: CreditInsightInput): CreditInsightResult {
  const strengths: string[] = [];
  const improvements: string[] = [];

  for (const [key, val] of Object.entries(input.factors)) {
    const score = typeof val.score === "number" ? val.score : 0;
    if (score >= 80) {
      if (key === "trip_completion") strengths.push("High trip completion rate");
      else if (key === "request_acceptance") strengths.push("Good request acceptance rate");
      else if (key === "average_rating") strengths.push("Strong ratings from peers");
      else if (key === "verification") strengths.push("Verified user");
      else if (key === "account_age") strengths.push("Long-standing platform member");
    } else if (score < 40 && score > 0) {
      if (key === "trip_completion") improvements.push("Complete more trips to improve reliability score");
      else if (key === "request_acceptance") improvements.push("Accept more booking requests to improve responsiveness");
      else if (key === "average_rating") improvements.push("Maintain good communication to improve ratings");
      else if (key === "rating_volume") improvements.push("Complete more transactions to build review history");
      else if (key === "account_age") improvements.push("Stay active on the platform to build account history");
      else if (key === "verification") improvements.push("Get your account verified by the admin");
    }
  }

  return {
    summary: `Credit score is ${input.score}/900 (${input.tier}). ${strengths.length > 0 ? strengths[0] + "." : "Build your profile by completing more trips."}`,
    strengths: strengths.length > 0 ? strengths : ["Active platform member"],
    improvements: improvements.length > 0 ? improvements : ["Complete your first trip to build credit history"],
    trend: input.score >= 650 ? "stable" : "improving",
  };
}

// === Provider implementations (identical to price-predict) ===

async function geminiProvider(prompt: string): Promise<ProviderResult> {
  const apiKey = getEnv("GEMINI_API_KEY");
  if (!apiKey) return { success: false, rateLimited: false };

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );

    if (res.status === 429) return { success: false, rateLimited: true };
    if (!res.ok) return { success: false, rateLimited: res.status >= 500 };

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return { success: false, rateLimited: false };

    const parsed = parseAIResponse(text);
    if (!parsed) return { success: false, rateLimited: false };

    return { success: true, data: parsed };
  } catch {
    return { success: false, rateLimited: false };
  }
}

async function groqProvider(prompt: string): Promise<ProviderResult> {
  const apiKey = getEnv("GROQ_API_KEY");
  if (!apiKey) return { success: false, rateLimited: false };

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
        max_tokens: 500,
      }),
    });

    if (res.status === 429) return { success: false, rateLimited: true };
    if (!res.ok) return { success: false, rateLimited: false };

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) return { success: false, rateLimited: false };

    const parsed = parseAIResponse(text);
    if (!parsed) return { success: false, rateLimited: false };

    return { success: true, data: parsed };
  } catch {
    return { success: false, rateLimited: false };
  }
}

async function openRouterProvider(prompt: string): Promise<ProviderResult> {
  const apiKey = getEnv("OPENROUTER_API_KEY");
  if (!apiKey) return { success: false, rateLimited: false };

  const models = [
    "cognitivecomputations/dolphin3.0-mistral-24b:free",
    "microsoft/phi-3-mini-4k-instruct:free",
  ];

  for (const model of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://loadsaathi.app",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: `${prompt}\n\nReturn ONLY valid JSON.` }],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (res.status === 429) continue;
      if (!res.ok) continue;

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) continue;

      const parsed = parseAIResponse(text);
      if (parsed) return { success: true, data: parsed };
    } catch {
      continue;
    }
  }

  return { success: false, rateLimited: false };
}

Deno.serve(async (req: Request) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  try {
    const input: CreditInsightInput = await req.json();

    if (!input.user_id || !input.score || !input.factors) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers });
    }

    const prompt = buildInsightPrompt(input);

    const providers: { name: string; fn: (p: string) => Promise<ProviderResult> }[] = [
      { name: "Gemini", fn: geminiProvider },
      { name: "Groq", fn: groqProvider },
      { name: "OpenRouter", fn: openRouterProvider },
    ];

    for (const { name, fn } of providers) {
      const result = await fn(prompt);
      if (result.success && result.data) {
        return new Response(
          JSON.stringify({ ...result.data, provider: name }),
          { status: 200, headers },
        );
      }
    }

    const fallback = localFallback(input);
    return new Response(
      JSON.stringify({ ...fallback, provider: "data" }),
      { status: 200, headers },
    );

  } catch (err) {
    console.error("Credit insights error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers });
  }
});
```

### Task 4: TypeScript Interfaces

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add CreditScore and CreditInsights types**

Find the `User` interface in `src/types/index.ts` and add:

```typescript
export interface CreditScore {
  user_id: string;
  score: number;
  tier: 'poor' | 'fair' | 'good' | 'very_good' | 'excellent';
  factors: Record<string, { score: number; weight: number; raw: number | boolean }>;
  calculated_at: string;
  stale?: boolean;
  insufficient_data?: boolean;
}

export interface CreditInsights {
  summary: string;
  strengths: string[];
  improvements: string[];
  trend: 'stable' | 'improving' | 'declining';
  provider: string;
}
```

### Task 5: useCreditScore Hook

**Files:**
- Create: `src/hooks/useCreditScore.ts`

- [ ] **Step 1: Create the hook**

```typescript
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'
import { createClerkSupabaseClient } from '@/utils/supabaseClient'
import type { CreditScore, CreditInsights } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

export function useCreditScore(userId?: string) {
  const { userProfile } = useAuth()
  const { getToken } = useClerkAuth()
  const targetUserId = userId || userProfile?.id

  return useQuery<CreditScore | null>({
    queryKey: ['creditScore', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null

      const token = await getToken({ template: 'supabase' })
      if (!token) return null

      const url = userId
        ? `${supabaseUrl}/functions/v1/credit-score?user_id=${userId}`
        : `${supabaseUrl}/functions/v1/credit-score`

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      })

      if (!response.ok) return null
      return await response.json()
    },
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

export function useCreditInsights(creditScore: CreditScore | null | undefined) {
  return useQuery<CreditInsights | null>({
    queryKey: ['creditInsights', creditScore?.user_id, creditScore?.score],
    queryFn: async () => {
      if (!creditScore || creditScore.insufficient_data) return null

      const response = await fetch(
        `${supabaseUrl}/functions/v1/credit-insights`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: creditScore.user_id,
            score: creditScore.score,
            tier: creditScore.tier,
            factors: creditScore.factors,
          }),
          signal: AbortSignal.timeout(10000),
        },
      )

      if (!response.ok) return null
      return await response.json()
    },
    enabled: !!creditScore && !creditScore.insufficient_data,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  })
}
```

### Task 6: Credit Score Badge Component

**Files:**
- Create: `src/components/credit-score/CreditScoreBadge.tsx`

- [ ] **Step 1: Create the badge component**

```tsx
import { cn } from '@/lib/utils'
import type { CreditScore } from '@/types'

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  poor: { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  fair: { bg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  good: { bg: 'bg-yellow-50 dark:bg-yellow-950', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' },
  very_good: { bg: 'bg-teal-50 dark:bg-teal-950', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800' },
  excellent: { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
}

interface Props {
  score: CreditScore | null | undefined
  className?: string
  size?: 'sm' | 'md'
}

export function CreditScoreBadge({ score, className, size = 'sm' }: Props) {
  if (!score) return null

  const tier = score.tier || 'fair'
    const colors = TIER_COLORS[tier] || TIER_COLORS.fair
  const isSmall = size === 'sm'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-semibold',
        colors.bg, colors.text, colors.border,
        isSmall ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        className,
      )}
      title={`Credit Score: ${score.score}/900 - ${tier.replace('_', ' ')}`}
    >
      <span className={cn('rounded-full', isSmall ? 'h-1.5 w-1.5' : 'h-2 w-2', colors.bg.replace('50', '500').replace('950', '500'))} />
      {score.score}
      {!isSmall && <span className="opacity-70 font-normal ml-0.5">· {tier.replace('_', ' ')}</span>}
    </span>
  )
}
```

### Task 7: Credit Score Gauge Component

**Files:**
- Create: `src/components/credit-score/CreditScoreGauge.tsx`

- [ ] **Step 1: Create the gauge component**

```tsx
import { cn } from '@/lib/utils'

const TIER_COLORS: Record<string, string> = {
  poor: 'text-red-500 stroke-red-500',
  fair: 'text-orange-500 stroke-orange-500',
  good: 'text-yellow-500 stroke-yellow-500',
  very_good: 'text-teal-500 stroke-teal-500',
  excellent: 'text-green-500 stroke-green-500',
}

interface Props {
  score: number
  tier: string
  className?: string
}

export function CreditScoreGauge({ score, tier, className }: Props) {
  const color = TIER_COLORS[tier] || TIER_COLORS.fair
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const normalizedScore = ((score - 300) / 600) * 100
  const offset = circumference - (normalizedScore / 100) * circumference

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-gray-100 dark:text-gray-800"
        />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={cn('text-4xl font-black', color.split(' ')[0])}>{score}</span>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {tier.replace('_', ' ')}
        </span>
      </div>
    </div>
  )
}
```

### Task 8: Credit Score Detail Component

**Files:**
- Create: `src/components/credit-score/CreditScoreDetail.tsx`

- [ ] **Step 1: Create the detail component**

```tsx
import { cn } from '@/lib/utils'
import type { CreditScore } from '@/types'

interface Props {
  score: CreditScore | null | undefined
  className?: string
}

const FACTOR_LABELS: Record<string, string> = {
  trip_completion: 'Trip Completion',
  request_acceptance: 'Request Acceptance',
  average_rating: 'Average Rating',
  rating_volume: 'Rating Volume',
  account_age: 'Account Age',
  verification: 'Verification',
}

function getBarColor(scoreValue: number): string {
  if (scoreValue >= 80) return 'bg-green-500'
  if (scoreValue >= 60) return 'bg-teal-500'
  if (scoreValue >= 40) return 'bg-yellow-500'
  if (scoreValue >= 20) return 'bg-orange-500'
  return 'bg-red-500'
}

export function CreditScoreDetail({ score, className }: Props) {
  if (!score) return null

  const factorEntries = Object.entries(score.factors || {})

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Factor Breakdown
      </h3>
      <div className="space-y-3">
        {factorEntries.map(([key, factor]) => {
          const factorScore = typeof factor.score === 'number' ? factor.score : 0
          const weight = typeof factor.weight === 'number' ? factor.weight * 100 : 0

          return (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {FACTOR_LABELS[key] || key}
                </span>
                <span className="text-xs text-gray-400">
                  {factorScore}/100 · {weight}% weight
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', getBarColor(factorScore))}
                  style={{ width: `${factorScore}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### Task 9: AI Insights Component

**Files:**
- Create: `src/components/credit-score/AIInsights.tsx`

- [ ] **Step 1: Create the AI insights component**

```tsx
import { cn } from '@/lib/utils'
import { useCreditInsights } from '@/hooks/useCreditScore'
import type { CreditScore } from '@/types'
import { Sparkles, TrendingUp, TrendingDown, Minus, Lightbulb, Star, AlertTriangle } from 'lucide-react'

interface Props {
  creditScore: CreditScore | null | undefined
  className?: string
}

export function AIInsights({ creditScore, className }: Props) {
  const { data: insights, isLoading } = useCreditInsights(creditScore)

  if (!creditScore || creditScore.insufficient_data) {
    return (
      <div className={cn('rounded-lg border border-gray-100 dark:border-gray-800 p-4', className)}>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Lightbulb className="h-4 w-4" />
          Complete more transactions to unlock AI-powered credit insights.
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn('rounded-lg border border-purple-100 dark:border-purple-900 p-4 animate-pulse', className)}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
      </div>
    )
  }

  if (!insights) {
    return (
      <div className={cn('rounded-lg border border-gray-100 dark:border-gray-800 p-4', className)}>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Sparkles className="h-4 w-4 text-purple-500" />
          AI insights temporarily unavailable.
        </div>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border border-purple-100 dark:border-purple-900 p-4 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-purple-700 dark:text-purple-400">
          <Sparkles className="h-4 w-4" />
          AI Credit Insights
        </div>
        <span className="text-[10px] text-gray-400">{insights.provider}</span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300">{insights.summary}</p>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        {insights.trend === 'improving' && <TrendingUp className="h-3.5 w-3.5 text-green-500" />}
        {insights.trend === 'declining' && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
        {insights.trend === 'stable' && <Minus className="h-3.5 w-3.5 text-gray-400" />}
        <span className="capitalize">{insights.trend}</span>
      </div>

      {insights.strengths.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-green-600 dark:text-green-500">
            <Star className="h-3 w-3" /> Strengths
          </div>
          <ul className="space-y-1">
            {insights.strengths.map((s, i) => (
              <li key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-1.5">
                <span className="text-green-500 mt-0.5">•</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {insights.improvements.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-orange-600 dark:text-orange-500">
            <AlertTriangle className="h-3 w-3" /> Areas to Improve
          </div>
          <ul className="space-y-1">
            {insights.improvements.map((imp, i) => (
              <li key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-1.5">
                <span className="text-orange-500 mt-0.5">•</span> {imp}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

### Task 10: Credit Score History Chart

**Files:**
- Create: `src/components/credit-score/CreditScoreHistory.tsx`

Note: This shows a static/placeholder chart since we don't have historical score data yet. The chart will populate over time as scores are calculated periodically.

- [ ] **Step 1: Create the history chart component**

```tsx
import { cn } from '@/lib/utils'

interface ScoreSnapshot {
  score: number
  date: string
}

interface Props {
  history?: ScoreSnapshot[]
  className?: string
}

export function CreditScoreHistory({ history, className }: Props) {
  const hasHistory = history && history.length > 1

  return (
    <div className={cn('rounded-lg border border-gray-100 dark:border-gray-800 p-4', className)}>
      <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Score History
      </h3>
      {hasHistory ? (
        <div className="h-32 flex items-end gap-1">
          {history!.map((snap, i) => {
            const height = ((snap.score - 300) / 600) * 100
            return (
              <div
                key={i}
                className="flex-1 bg-orange-200 dark:bg-orange-800 rounded-t hover:bg-orange-400 dark:hover:bg-orange-600 transition-colors relative group"
                style={{ height: `${height}%` }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                  {snap.score}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center text-sm text-gray-400">
          Score history will appear as your credit score is tracked over time.
        </div>
      )}
    </div>
  )
}
```

### Task 11: Credit Score Page

**Files:**
- Create: `src/pages/CreditScore.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create the credit score page**

```tsx
import { useAuth } from '@/contexts/AuthContext'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'
import { createClerkSupabaseClient } from '@/utils/supabaseClient'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditScoreBadge } from '@/components/credit-score/CreditScoreBadge'
import { CreditScoreGauge } from '@/components/credit-score/CreditScoreGauge'
import { CreditScoreDetail } from '@/components/credit-score/CreditScoreDetail'
import { CreditScoreHistory } from '@/components/credit-score/CreditScoreHistory'
import { AIInsights } from '@/components/credit-score/AIInsights'
import type { User } from '@/types'
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function CreditScorePage() {
  const { userProfile } = useAuth()
  const { getToken } = useClerkAuth()
  const navigate = useNavigate()
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  const { data: creditScore, isLoading, refetch } = useQuery({
    queryKey: ['creditScore', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return null
      const token = await getToken({ template: 'supabase' })
      if (!token) return null

      const res = await fetch(`${supabaseUrl}/functions/v1/credit-score`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return null
      return await res.json()
    },
    enabled: !!userProfile?.id,
    staleTime: 60_000,
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Freight Credit Score</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Your trust and reliability score based on platform activity
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      ) : !creditScore ? (
        <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700">
          <CardContent className="py-20 text-center">
            <p className="text-gray-500 dark:text-gray-400">Unable to load credit score. Please try again.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Gauge + Score */}
          <Card className="border-orange-100 dark:border-orange-800">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center relative">
                <CreditScoreGauge score={creditScore.score} tier={creditScore.tier} />
                {creditScore.insufficient_data && (
                  <p className="text-xs text-gray-400 mt-2 text-center max-w-xs">
                    Limited activity detected. Complete more trips and transactions to build your credit profile.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Factor Breakdown */}
          {!creditScore.insufficient_data && (
            <Card className="border-gray-100 dark:border-gray-800">
              <CardContent className="pt-6">
                <CreditScoreDetail score={creditScore} />
              </CardContent>
            </Card>
          )}

          {/* AI Insights */}
          {!creditScore.insufficient_data && (
            <Card className="border-purple-100 dark:border-purple-900">
              <CardContent className="pt-6">
                <AIInsights creditScore={creditScore} />
              </CardContent>
            </Card>
          )}

          {/* History */}
          <Card className="border-gray-100 dark:border-gray-800">
            <CardContent className="pt-6">
              <CreditScoreHistory />
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <CardContent className="pt-6 space-y-3 text-sm text-gray-500 dark:text-gray-400">
              <h3 className="font-bold text-gray-700 dark:text-gray-300">How is my score calculated?</h3>
              <ul className="space-y-2 list-disc pl-4">
                <li><strong>Trip Completion (30%)</strong> — Completing trips reliably increases your score. Cancelling trips hurts it.</li>
                <li><strong>Request Acceptance (20%)</strong> — Accepting booking requests shows you are responsive and reliable.</li>
                <li><strong>Average Rating (20%)</strong> — Higher ratings from your peers improve your score.</li>
                <li><strong>Rating Volume (10%)</strong> — More reviews make your rating more trustworthy.</li>
                <li><strong>Account Age (10%)</strong> — Longer platform membership demonstrates commitment.</li>
                <li><strong>Verification (10%)</strong> — Verified users get a significant boost.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add route to App.tsx**

Find the existing lazy imports and add:
```typescript
const CreditScore = React.lazy(() => import('@/pages/CreditScore'))
```

Find the authenticated routes (inside `<Route element={<Layout><Outlet /></Layout>}>`) and add:
```tsx
<Route path="credit-score" element={
  <ErrorBoundary><Suspense fallback={<IndexSkeleton />}><CreditScore /></Suspense></ErrorBoundary>
} />
```

### Task 12: Credit Score Badge on Trip Detail Page

**Files:**
- Modify: `src/pages/TripDetail.tsx`

- [ ] **Step 1: Add badge next to trucker info**

Add import:
```typescript
import { CreditScoreBadge } from '@/components/credit-score/CreditScoreBadge'
import { useCreditScore } from '@/hooks/useCreditScore'
```

Inside the `<div className="flex items-center">` section showing trucker details (around line 246-260), add the credit badge after the rating:

```tsx
// After the Star/Rating line, add:
<CreditScoreBadge score={creditScore} />
```

And add the hook call:
```typescript
const { data: creditScore } = useCreditScore(trip?.trucker_id)
```

### Task 13: Credit Score Badge on Browse Trips

**Files:**
- Modify: `src/pages/shipper/BrowseTrips.tsx`

- [ ] **Step 1: Add credit score badge on trip cards**

This is more complex because we need to fetch scores for all displayed truckers. Use a batched approach — fetch scores for visible trucker IDs.

Add import:
```typescript
import { useQuery } from '@tanstack/react-query'
import { CreditScoreBadge } from '@/components/credit-score/CreditScoreBadge'
```

In the trip card rendering (around line 452-462, the trucker info section), add after the rating span:
```tsx
{/* After the existing rating span, add: */}
<CreditScoreBadge score={creditScores?.[trip.trucker_id]} />
```

Add a batch credit score query that fetches scores for visible trucker IDs.

### Task 14: Navigation Link to Credit Score Page

**Files:**
- Modify: `src/components/Layout.tsx`

- [ ] **Step 1: Add Credit Score link to profile dropdown**

In the profile dropdown section of Layout.tsx, find the "Profile Settings" link and add after it:
```tsx
<Link to="/credit-score" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
  Credit Score
</Link>
```

This adds it to the user dropdown accessible from the top nav.

### Task 15: Credit Score Badge on Profile Page

**Files:**
- Modify: `src/pages/Profile.tsx`

- [ ] **Step 1: Add credit score section to profile page**

Add import:
```typescript
import { CreditScoreBadge } from '@/components/credit-score/CreditScoreBadge'
import { useCreditScore } from '@/hooks/useCreditScore'
import { Link } from 'react-router-dom'
```

Add after the user info section:
```tsx
const { data: creditScore } = useCreditScore(userProfile?.id)

// In the render, add a credit score card:
{creditScore && (
  <Link to="/credit-score">
    <Card className="border-orange-100 dark:border-orange-800 hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Freight Credit Score</p>
          <p className="text-xs text-gray-400 mt-0.5">Your trust & reliability score</p>
        </div>
        <CreditScoreBadge score={creditScore} size="md" />
      </CardContent>
    </Card>
  </Link>
)}
```

---
## Spec Coverage Check

| Spec Requirement | Task |
|-----------------|------|
| `credit_scores` table | Task 1 |
| `calculate_credit_score()` PG function | Task 1 |
| Trigger refresh pattern | Task 1 |
| RLS policies | Task 1 |
| Credit score edge function (GET) | Task 2 |
| AI enrichment edge function | Task 3 |
| TypeScript interfaces | Task 4 |
| `useCreditScore` hook | Task 5 |
| `useCreditInsights` hook | Task 5 |
| Score badge component | Task 6 |
| Score gauge component | Task 7 |
| Factor breakdown component | Task 8 |
| AI insights component | Task 9 |
| Score history component | Task 10 |
| Credit score page (`/credit-score`) | Task 11 |
| Badge on Trip Detail page | Task 12 |
| Badge on Browse Trips page | Task 13 |
| Nav link to credit score | Task 14 |
| Badge on Profile page | Task 15 |
