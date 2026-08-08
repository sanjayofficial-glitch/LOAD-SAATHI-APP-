# Supabase Edge Functions

LoadSaathi runs a set of serverless **Edge Functions** (Deno runtime) on
Supabase for AI-powered features that can't run client-side.

## Function List

| Function | Purpose |
|----------|---------|
| `gemini-proxy` | Proxies calls to Google Gemini API (keeps the API key server-side) |
| `price-predict` | AI price prediction engine |
| `credit-score` | Calculates digital freight credit scores |
| `credit-insights` | Generates natural-language credit insights |
| `match-ml` | Machine-learning match scoring + logging |
| `demand-forecast` | Route/demand forecasting |
| `fraud-detect` | Fraud detection heuristics |

Shared helpers:
- `_shared/edgeHelpers.ts` — JWT verification, CORS, response helpers
- `_shared/osrm.ts` — OSRM routing helpers for the server

## Directory Layout

```
supabase/functions/
├── _shared/            # Shared server-side helpers
├── gemini-proxy/index.ts
├── price-predict/index.ts, pricing.ts, pricing_test.ts
├── credit-score/index.ts
├── credit-insights/index.ts
├── match-ml/index.ts
├── demand-forecast/index.ts
└── fraud-detect/index.ts
```

## Calling an Edge Function

```ts
const { data, error } = await supabase.functions.invoke('price-predict', {
  body: { origin, destination, weight_kg, goods_type, date },
});
```

## gemini-proxy

The Gemini API key is stored as a Supabase **secret** — it never reaches the
client. The edge function:

1. Verifies the incoming JWT (unless the function is explicitly public).
2. Reads `GEMINI_API_KEY` from the function secrets.
3. Forwards the request to Google's Gemini API.
4. Returns the parsed response.

### Deploying Secrets

```bash
supabase secrets set GEMINI_API_KEY=your-key
```

## Development

Run Edge Functions locally:

```bash
supabase start
supabase functions serve
```

Test with the local URL:

```bash
curl http://127.0.0.1:54321/functions/v1/price-predict \
  -H "Authorization: Bearer <anon-key>" \
  -d '{"origin":"Rourkela","destination":"Ranchi"}'
```

## Configuration

- `supabase/config.toml` — local project config
- Edge function environment variables are set in the Supabase Dashboard →
  **Edge Functions** → function → **Settings**, or via CLI:

```bash
supabase secrets set KEY=VALUE
```

## Security

- **Always** enable `verify_jwt` unless a function must be public.
- Never commit API keys to the repository.
- Use `_shared/edgeHelpers.ts` for consistent JWT verification and CORS.
