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

interface CreditProfile {
  score: number
  factors: Record<string, unknown>
  userType: string
  userName: string
}

interface InsightResult {
  summary: string
  strengths: string[]
  improvements: string[]
  tips: string[]
  projection: string
}

interface ProviderResult {
  success: boolean
  data?: InsightResult & { provider?: string }
  rateLimited?: boolean
}

function buildPrompt(profile: CreditProfile): string {
  const factors = profile.factors
  const tier = (factors as Record<string, unknown>).tier as string || "fair"

  return `You are a credit score analyst for Load Saathi, an Indian freight marketplace.

Analyze this user's Digital Freight Credit Score and provide actionable insights.

User: ${profile.userName} (${profile.userType})
Score: ${profile.score}/900 (${tier.toUpperCase()})

Score Breakdown:
${JSON.stringify(profile.factors, null, 2)}

Return ONLY a JSON object (no markdown, no explanation outside the JSON):
{
  "summary": "2-3 sentence overall assessment of their credit standing",
  "strengths": ["list of 2-3 areas where they're performing well"],
  "improvements": ["list of 2-3 specific actionable improvements to raise their score"],
  "tips": ["2-3 practical tips specific to Indian freight/logistics context"],
  "projection": "one sentence on what their score could be if they follow the advice"
}`
}

function parseAIResponse(text: string): InsightResult | null {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim()
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

async function geminiProvider(profile: CreditProfile): Promise<ProviderResult> {
  const apiKey = getEnv("GEMINI_API_KEY")
  if (!apiKey) return { success: false, rateLimited: false }

  const prompt = buildPrompt(profile)

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    )

    if (res.status === 429) return { success: false, rateLimited: true }
    if (!res.ok) return { success: false, rateLimited: res.status >= 500 }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return { success: false, rateLimited: false }

    const parsed = parseAIResponse(text)
    if (!parsed) return { success: false, rateLimited: false }

    return { success: true, data: parsed }
  } catch {
    return { success: false, rateLimited: false }
  }
}

async function groqProvider(profile: CreditProfile): Promise<ProviderResult> {
  const apiKey = getEnv("GROQ_API_KEY")
  if (!apiKey) return { success: false, rateLimited: false }

  const prompt = buildPrompt(profile)

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
        max_tokens: 800,
      }),
    })

    if (res.status === 429) return { success: false, rateLimited: true }
    if (!res.ok) return { success: false, rateLimited: false }

    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text) return { success: false, rateLimited: false }

    const parsed = parseAIResponse(text)
    if (!parsed) return { success: false, rateLimited: false }

    return { success: true, data: parsed }
  } catch {
    return { success: false, rateLimited: false }
  }
}

async function openRouterProvider(profile: CreditProfile): Promise<ProviderResult> {
  const apiKey = getEnv("OPENROUTER_API_KEY")
  if (!apiKey) return { success: false, rateLimited: false }

  const prompt = buildPrompt(profile)
  const models = [
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-3.5-lightning:free",
  ]

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
          messages: [
            {
              role: "user",
              content: `${prompt}\n\nReturn ONLY valid JSON.`,
            },
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
      })

      if (res.status === 429) continue
      if (!res.ok) continue

      const data = await res.json()
      const text = data?.choices?.[0]?.message?.content
      if (!text) continue

      const parsed = parseAIResponse(text)
      if (parsed) return { success: true, data: parsed }
    } catch {
      continue
    }
  }

  return { success: false, rateLimited: false }
}

function localFallback(profile: CreditProfile): InsightResult & { provider: string } {
  const score = profile.score
  const tier = (profile.factors as Record<string, unknown>).tier as string || "fair"

  const tips: Record<string, { strengths: string[]; improvements: string[]; tips: string[] }> = {
    excellent: {
      strengths: ["Excellent credit standing", "Strong platform reputation"],
      improvements: ["Consider applying for premium loads", "Maintain your consistent performance"],
      tips: ["Your high score qualifies you for priority matching", "Premium shippers can see your excellent rating"],
    },
    good: {
      strengths: ["Good platform history", "Above-average reliability"],
      improvements: ["Complete more trips to reach excellent tier", "Maintain high ratings through consistent service"],
      tips: ["Timely deliveries boost your score further", "Respond quickly to requests to improve communication score"],
    },
    fair: {
      strengths: ["Active on the platform", "Building your history"],
      improvements: ["Increase completion rate by avoiding cancellations", "Build more review history", "Respond to requests promptly"],
      tips: ["Complete every accepted trip to build trust", "Communicate proactively with counter-parties", "Each completed trip adds to your volume score"],
    },
    needs_improvement: {
      strengths: ["Registered on the platform", "Opportunity to build credit"],
      improvements: ["Focus on completing trips without cancellation", "Engage more with requests and messages", "Build positive review history"],
      tips: ["Start with smaller, manageable loads", "Always communicate delays early", "Consistency over time will rebuild your score"],
    },
    poor: {
      strengths: ["Still active on the platform"],
      improvements: ["Avoid cancellations at all costs", "Complete at least 3-5 trips to rebuild history", "Respond to all messages within 24 hours"],
      tips: ["Set realistic commitments you can fulfill", "Use the platform consistently to show reliability", "Your score can recover with consistent good performance"],
    },
  }

  const tierTips = tips[tier] || tips.fair

  return {
    summary: `${profile.userName} has a credit score of ${score}/900. This is considered "${tier}" on the Load Saathi platform.`,
    strengths: tierTips.strengths,
    improvements: tierTips.improvements,
    tips: tierTips.tips,
    projection: "Consistent platform activity and positive reviews will improve your credit score over time.",
    provider: "data",
  }
}

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60_000

Deno.serve(async (req: Request) => {
  const headers = getCorsHeaders(req)
  const requestId = generateRequestId()

  if (req.method === "OPTIONS") {
    return optionsResponse(headers)
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, headers, requestId)
  }

  // Require valid JWT
  const token = extractBearerToken(req)
  if (!token) {
    return errorResponse("Unauthorized", 401, headers, requestId)
  }
  const authUser = await verifyJwt(token)
  if (!authUser) {
    return errorResponse("Invalid or expired token", 401, headers, requestId)
  }

  // Rate limit by IP
  const ip = getRequestIp(req)
  if (!checkRateLimit(ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return errorResponse("Rate limit exceeded. Try again in 1 minute.", 429, headers, requestId)
  }

  try {
    const profile: CreditProfile = await req.json()

    if (!profile.userId && !profile.userName) {
      return errorResponse("Missing required fields", 400, headers, requestId)
    }

    const providers: { name: string; fn: (p: CreditProfile) => Promise<ProviderResult> }[] = [
      { name: "Gemini", fn: geminiProvider },
      { name: "Groq", fn: groqProvider },
      { name: "OpenRouter", fn: openRouterProvider },
    ]

    for (const { name, fn } of providers) {
      const result = await fn(profile)
      if (result.success && result.data) {
        return new Response(
          JSON.stringify({
            ...result.data,
            provider: name,
          }),
          { status: 200, headers },
        )
      }
    }

    const fallback = localFallback(profile)
    return new Response(JSON.stringify(fallback), { status: 200, headers })
  } catch (err) {
    console.error(`[${requestId}] Credit insights error:`, err)
    return errorResponse("Internal server error", 500, headers, requestId)
  }
})
