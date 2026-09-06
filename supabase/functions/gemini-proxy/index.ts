// Supabase Edge Function: gemini-proxy
// Multi-provider natural language search proxy.
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

interface SearchFilters {
  origin?: string;
  destination?: string;
  weight?: number;
  date?: string;
}

interface SearchResult {
  query: string;
  provider: string;
  results: Array<{ id: string; title: string; snippet: string; source: string }>;
}

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

function buildSearchPrompt(filters: SearchFilters): string {
  return `You are a logistics search assistant for an Indian freight platform.

User search intent: Find available trucks/shipments matching these criteria:
  Origin: ${filters.origin || "any"}
  Destination: ${filters.destination || "any"}
  Weight: ${filters.weight ? filters.weight + " tonnes" : "any"}
  Date: ${filters.date || "any"}

Generate 3-5 realistic search result entries in JSON format:
{
  "query": "normalized search query",
  "provider": "gemini",
  "results": [
    {
      "id": "result-1",
      "title": "trip/shipment title",
      "snippet": "brief description with route and price",
      "source": "platform"
    }
  ]
}

Return ONLY valid JSON (no markdown).`;
}

async function geminiProvider(filters: SearchFilters): Promise<{ success: boolean; data?: SearchResult; rateLimited?: boolean }> {
  const apiKey = getEnv("GEMINI_API_KEY");
  if (!apiKey) return { success: false, rateLimited: false };
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: buildSearchPrompt(filters) }] }] }),
      },
    );
    if (res.status === 429) return { success: false, rateLimited: true };
    if (!res.ok) return { success: false, rateLimited: res.status >= 500 };
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return { success: false, rateLimited: false };
    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned) as SearchResult;
      return { success: true, data: { ...parsed, provider: "Gemini" } };
    } catch {
      return { success: false, rateLimited: false };
    }
  } catch {
    return { success: false, rateLimited: false };
  }
}

async function groqProvider(filters: SearchFilters): Promise<{ success: boolean; data?: SearchResult; rateLimited?: boolean }> {
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
        messages: [{ role: "user", content: buildSearchPrompt(filters) }],
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
    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned) as SearchResult;
      return { success: true, data: { ...parsed, provider: "Groq" } };
    } catch {
      return { success: false, rateLimited: false };
    }
  } catch {
    return { success: false, rateLimited: false };
  }
}

async function openRouterProvider(filters: SearchFilters): Promise<{ success: boolean; data?: SearchResult; rateLimited?: boolean }> {
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
          "HTTP-Referer": "https://loadsaathi.in",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: `${buildSearchPrompt(filters)}

Return ONLY valid JSON.` }],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });
      if (res.status === 429) continue;
      if (!res.ok) continue;
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) continue;
      try {
        const cleaned = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned) as SearchResult;
        return { success: true, data: { ...parsed, provider: "OpenRouter" } };
      } catch {
        continue;
      }
    } catch {
      continue;
    }
  }
  return { success: false, rateLimited: false };
}

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

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
    const filters: SearchFilters = await req.json();

    if (!filters.origin && !filters.destination) {
      return errorResponse("Provide at least origin or destination", 400, headers, requestId);
    }

    const providers = [
      { name: "Gemini", fn: geminiProvider },
      { name: "Groq", fn: groqProvider },
      { name: "OpenRouter", fn: openRouterProvider },
    ];

    for (const provider of providers) {
      const result = await provider.fn(filters);
      if (result.success && result.data) {
        return new Response(JSON.stringify(result.data), { status: 200, headers });
      }
    }

    return new Response(
      JSON.stringify({ query: `${filters.origin || ""} → ${filters.destination || ""}`, provider: "local", results: [] }),
      { status: 200, headers },
    );
  } catch (err) {
    console.error(`[${requestId}] gemini-proxy error:`, err);
    return errorResponse("Internal server error", 500, headers, requestId);
  }
});