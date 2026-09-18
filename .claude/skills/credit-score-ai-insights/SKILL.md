---
name: credit-score-ai-insights
description: >-
  Credit score system with AI insights for marketplace trust. Use when building
  reputation systems, trust scores, or AI-powered user insights.
  Triggers: credit score, trust score, driver rating, AI insights, marketplace reputation.
metadata:
  author: LoadSaathi
  version: 1.0.0
---

# Credit Score + AI Insights

Credit/trust score system for marketplace participants with factor breakdown and AI-powered improvement tips.

## Key Files

- `src/hooks/useCreditScore.ts` — `useCreditScore()` and `useCreditInsights()` hooks
- `src/components/CreditScoreGauge.tsx` — Gauge visualization
- `src/components/CreditScoreDetail.tsx` — Detailed breakdown
- `src/components/CreditScoreBadge.tsx` — Badge component
- `src/components/CreditScoreHistory.tsx` — Historical trend
- `src/components/AIInsights.tsx` — AI-generated strengths and improvements

## Pattern

### Hooks
```tsx
const { data: score } = useCreditScore(userId);
const { data: insights } = useCreditInsights(score);
```
- `useCreditScore` calls `/functions/v1/credit-score?userId=...`
- `useCreditInsights` calls `/functions/v1/credit-insights` with score, factors, userType
- Both use Clerk JWT auth, 8-15s timeouts, 2-10min stale times

### Score Factors (RPC)
- Completion rate (30%)
- On-time delivery (25%)
- Communication quality (15%)
- Review ratings (20%)
- Account tenure (10%)

### AI Insights Component
Shows:
- Overall trend (up/down/stable) with icon
- Strengths list with green `+` prefix
- Improvements list with orange `→` prefix
- Provider badge

## Best Practices

- Cache scores for 2+ minutes, insights for 10+ minutes
- Show loading skeleton while fetching
- Display provider attribution for AI-generated insights
- Link insights to actionable next steps