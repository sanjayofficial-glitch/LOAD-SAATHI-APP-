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

interface MatchRequest {
  shipmentOriginCity: string;
  shipmentDestCity: string;
  tripOriginCity: string;
  tripDestCity: string;
  shipmentWeightTonnes: number;
  tripCapacityTonnes: number;
  shipmentBudgetPerTonne?: number;
  tripPricePerTonne?: number;
  shipmentDate?: string;
  tripDate?: string;
  truckerRating?: number;
}

interface MatchResult {
  aiScore: number;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

interface ProviderResult {
  success: boolean;
  data?: MatchResult & { provider?: string };
  rateLimited?: boolean;
}

function parseAIResponse(text: string): MatchResult | null {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function buildPrompt(body: MatchRequest): string {
  return `You are a logistics matchmaking expert for the Indian freight platform.

Trip details:
  Route: ${body.tripOriginCity} → ${body.tripDestCity}
  Available capacity: ${body.tripCapacityTonnes ?? "N/A"} tonnes
  Asking price: ₹${body.tripPricePerTonne ?? "N/A"}/tonne
  Departure: ${body.tripDate ?? "N/A"}
  Trucker rating: ${body.truckerRating ?? "N/A"}/5

Shipment details:
  Route: ${body.shipmentOriginCity} → ${body.shipmentDestCity}
  Weight: ${body.shipmentWeightTonnes} tonnes
  Budget: ₹${body.shipmentBudgetPerTonne ?? "N/A"}/tonne
  Ready date: ${body.shipmentDate ?? "N/A"}

Evaluate match quality. Consider route alignment, price compatibility, capacity fit, timing, and reliability.

Return ONLY valid JSON (no markdown):
{
  "aiScore": number 0–100,
  "confidence": "high" | "medium" | "low",
  "reasoning": "one-line explanation of the key factor driving this score"
}`;
}

async function geminiProvider(body: MatchRequest): Promise<ProviderResult> {
  const apiKey = getEnv("GEMINI_API_KEY");
  if (!apiKey) return { success: false, rateLimited: false };
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: buildPrompt(body) }] }] }),
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

async function groqProvider(body: MatchRequest): Promise<ProviderResult> {
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
        messages: [{ role: "user", content: buildPrompt(body) }],
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

async function openRouterProvider(body: MatchRequest): Promise<ProviderResult> {
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
          messages: [{ role: "user", content: `${buildPrompt(body)}

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
      const parsed = parseAIResponse(text);
      if (parsed) return { success: true, data: parsed };
    } catch {
      continue;
    }
  }
  return { success: false, rateLimited: false };
}

function localFallback(body: MatchRequest): MatchResult & { provider: string } {
  let score = 0;
  const reasons: string[] = [];

  const so = body.shipmentOriginCity.toLowerCase().trim();
  const sd = body.shipmentDestCity.toLowerCase().trim();
  const to = body.tripOriginCity.toLowerCase().trim();
  const td = body.tripDestCity.toLowerCase().trim();

  if (so === to || so.includes(to) || to.includes(so)) { score += 15; reasons.push("origin city match"); }
  if (sd === td || sd.includes(td) || td.includes(sd)) { score += 15; reasons.push("destination city match"); }
  if (so === sd && to === td) { score += 10; reasons.push("exact route match"); }

  if (body.tripCapacityTonnes > 0) {
    const ratio = body.shipmentWeightTonnes / body.tripCapacityTonnes;
    if (ratio <= 0.5) { score += 15; reasons.push("good capacity fit"); }
    else if (ratio <= 1.0) { score += 8; reasons.push("capacity fits"); }
  }

  if (body.shipmentBudgetPerTonne && body.tripPricePerTonne && body.tripPricePerTonne > 0) {
    const priceRatio = body.shipmentBudgetPerTonne / body.tripPricePerTonne;
    if (priceRatio >= 1.0) { score += 10; reasons.push("price within budget"); }
    else if (priceRatio >= 0.85) { score += 6; reasons.push("price close to budget"); }
  }

  if (body.shipmentDate && body.tripDate) {
    const sDate = new Date(body.shipmentDate).getTime();
    const tDate = new Date(body.tripDate).getTime();
    const dayDiff = Math.abs(sDate - tDate) / (1000 * 60 * 60 * 24);
    if (dayDiff <= 3) { score += 10; reasons.push("dates align well"); }
    else if (dayDiff <= 7) { score += 5; reasons.push("dates within a week"); }
  }

  if (body.truckerRating != null) {
    if (body.truckerRating >= 4.5) { score += 10; reasons.push("top-rated trucker"); }
    else if (body.truckerRating >= 4.0) { score += 6; reasons.push("good trucker rating"); }
    else if (body.truckerRating >= 3.5) { score += 3; reasons.push("decent trucker rating"); }
  }

  const finalScore = Math.min(score, 100);
  return {
    aiScore: finalScore,
    confidence: finalScore >= 70 ? "high" : finalScore >= 40 ? "medium" : "low",
    reasoning: reasons.length > 0 ? reasons.join(", ") : "Basic route and capacity compatibility",
    provider: "local",
  };
}

const RATE_LIMIT_MAX = 20;
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
    const body: MatchRequest = await req.json();

    if (!body.shipmentOriginCity || !body.shipmentDestCity ||
        !body.tripOriginCity || !body.tripDestCity) {
      return errorResponse("Missing required fields: origin/destination cities", 400, headers, requestId);
    }

    const providers: { name: string; fn: (b: MatchRequest) => Promise<ProviderResult> }[] = [
      { name: "Gemini", fn: geminiProvider },
      { name: "Groq", fn: groqProvider },
      { name: "OpenRouter", fn: openRouterProvider },
    ];

    for (const { name, fn } of providers) {
      const result = await fn(body);
      if (result.success && result.data) {
        return new Response(
          JSON.stringify({ ...result.data, provider: name }),
          { status: 200, headers },
        );
      }
    }

    const fallback = localFallback(body);
    return new Response(JSON.stringify(fallback), { status: 200, headers });
  } catch (err) {
    console.error(`[${requestId}] Match-ML error:`, err);
    return errorResponse("Internal server error", 500, headers, requestId);
  }
});