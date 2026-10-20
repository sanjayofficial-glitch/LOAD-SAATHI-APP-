// Supabase Edge Function: gemini-proxy
// Natural-language INTENT NORMALIZER for freight searches.
//
// Data honesty contract: this endpoint does NOT list loads and never will.
// An earlier version prompted the LLM to "generate realistic search result
// entries" — it returned invented trucks, routes and prices that looked like
// platform data. The LLM's only job now is to turn a free-text request into
// structured filters. Real load data comes exclusively from marketplace
// APIs (PostgREST under caller RLS / the agent-router search_market tool).
//
// Deploy with: supabase functions deploy gemini-proxy
// Set env: supabase secrets set GEMINI_API_KEY=your_key_here GROQ_API_KEY=your_key_here OPENROUTER_API_KEY=your_key_here

import {
  getCorsHeaders,
  checkRateLimit,
  getRequestIp,
  extractBearerToken,
  verifyJwt,
  errorResponse,
  optionsResponse,
  generateRequestId,
} from "../_shared/edgeHelpers.ts";

function getEnv(name: string): string {
  return Deno.env.get(name) ?? "";
}

interface NormalizedFilters {
  origin?: string;
  destination?: string;
  weight_tonnes?: number;
  date?: string;
}

interface SearchResponse {
  query: string;
  provider: string;
  filters: NormalizedFilters | null;
  /** Always empty here; real results are fetched separately from the marketplace. */
  results: Array<never>;
  detail: string;
}

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

function buildIntentPrompt(
  query: string,
  filters: { origin?: string; destination?: string; weight?: number; date?: string },
): string {
  return `You normalize a freight search request for an Indian trucking marketplace.

Search request (free text and/or structured hints):
  Text: ${query || "none"}
  Origin: ${filters.origin || "unknown"}
  Destination: ${filters.destination || "unknown"}
  Weight: ${filters.weight ? filters.weight + " tonnes" : "unknown"}
  Date: ${filters.date || "unknown"}

Extract ONLY the fields that are actually present in the request. Never invent
cities, dates, weights, load IDs, or prices. You may fix the spelling of an
Indian city name only when you are confident (e.g. "bengluru" -> "Bengaluru").

Return ONLY valid JSON (no markdown):
{"origin":"CityName","destination":"CityName","weight_tonnes":number,"date":"YYYY-MM-DD"}
Omit any key whose value is null.`;
}

/** Fail-closed sanitizer: only well-formed values survive. */
function sanitizeFilters(raw: unknown): NormalizedFilters {
  const out: NormalizedFilters = {};
  if (typeof raw !== "object" || raw === null) return out;
  const o = raw as Record<string, unknown>;

  const text = (v: unknown): string | undefined => {
    if (typeof v !== "string") return undefined;
    const s = v.trim().slice(0, 80);
    return s.length >= 2 ? s : undefined;
  };
  out.origin = text(o.origin) as string | undefined;
  out.destination = text(o.destination) as string | undefined;
  if (!out.origin) delete out.origin;
  if (!out.destination) delete out.destination;

  const weightRaw = o.weight_tonnes ?? o.weight;
  if (typeof weightRaw === "number" && Number.isFinite(weightRaw) && weightRaw > 0 && weightRaw <= 500) {
    out.weight_tonnes = Math.round(weightRaw * 10) / 10;
  }

  if (typeof o.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.date)) {
    const d = new Date(`${o.date}T00:00:00Z`);
    if (!Number.isNaN(d.getTime())) out.date = o.date;
  }

  return out;
}

type ProviderResult = { success: boolean; data?: NormalizedFilters; rateLimited?: boolean };

async function geminiProvider(prompt: string): Promise<ProviderResult> {
  const apiKey = getEnv("GEMINI_API_KEY");
  if (!apiKey) return { success: false, rateLimited: false };
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );
    if (res.status === 429) return { success: false, rateLimited: true };
    if (!res.ok) return { success: false, rateLimited: res.status >= 500 };
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return { success: false, rateLimited: false };
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return { success: true, data: sanitizeFilters(parsed) };
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
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" },
        max_tokens: 200,
      }),
    });
    if (res.status === 429) return { success: false, rateLimited: true };
    if (!res.ok) return { success: false, rateLimited: false };
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) return { success: false, rateLimited: false };
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return { success: true, data: sanitizeFilters(parsed) };
  } catch {
    return { success: false, rateLimited: false };
  }
}

async function openRouterProvider(prompt: string): Promise<ProviderResult> {
  const apiKey = getEnv("OPENROUTER_API_KEY");
  if (!apiKey) return { success: false, rateLimited: false };
  const models = [
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-3.5-lightning:free",
  ];
  for (const model of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://loadsaathi.in",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 200,
        }),
      });
      if (res.status === 429) continue;
      if (!res.ok) continue;
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) continue;
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      return { success: true, data: sanitizeFilters(parsed) };
    } catch {
      continue;
    }
  }
  return { success: false, rateLimited: false };
}

Deno.serve(async (req: Request) => {
  const headers = getCorsHeaders(req);
  const requestId = generateRequestId();

  if (req.method === "OPTIONS") {
    return optionsResponse(headers);
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, headers, requestId);
  }

  const token = extractBearerToken(req);
  if (!token) {
    return errorResponse("Unauthorized", 401, headers, requestId);
  }
  const authUser = await verifyJwt(token);
  if (!authUser) {
    return errorResponse("Invalid or expired token", 401, headers, requestId);
  }

  const ip = getRequestIp(req);
  if (!checkRateLimit(ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return errorResponse("Rate limit exceeded. Try again in 1 minute.", 429, headers, requestId);
  }

  try {
    const bodyFilters: { query?: string; origin?: string; destination?: string; weight?: number; date?: string } = await req.json();
    const query = typeof bodyFilters.query === "string" ? bodyFilters.query.trim().slice(0, 120) : "";

    if (!query && !bodyFilters.origin && !bodyFilters.destination) {
      return errorResponse("Provide at least a query, origin or destination", 400, headers, requestId);
    }

    const prompt = buildIntentPrompt(query, bodyFilters);

    const providers: { name: string; fn: (p: string) => Promise<ProviderResult> }[] = [
      { name: "Gemini", fn: geminiProvider },
      { name: "Groq", fn: groqProvider },
      { name: "OpenRouter", fn: openRouterProvider },
    ];

    for (const { name, fn } of providers) {
      const result = await fn(prompt);
      if (result.success && result.data) {
        const resp: SearchResponse = {
          query: query || `${bodyFilters.origin || ""} → ${bodyFilters.destination || ""}`,
          provider: name,
          filters: result.data,
          results: [],
          detail:
            "Search intent normalized into filters only. Fetch real loads from the marketplace APIs (caller-RLS PostgREST / agent-router search_market) — this endpoint never invents loads or prices.",
        };
        return new Response(JSON.stringify(resp), { status: 200, headers });
      }
    }

    return new Response(
      JSON.stringify({
        query: query || `${bodyFilters.origin || ""} → ${bodyFilters.destination || ""}`,
        provider: "none",
        filters: null,
        results: [],
        detail: "Intent normalization unavailable right now (no LLM provider responded). Use the marketplace filter UI instead.",
      } satisfies SearchResponse),
      { status: 503, headers },
    );
  } catch (err) {
    console.error(`[${requestId}] gemini-proxy error:`, err);
    return errorResponse("Internal server error", 500, headers, requestId);
  }
});
