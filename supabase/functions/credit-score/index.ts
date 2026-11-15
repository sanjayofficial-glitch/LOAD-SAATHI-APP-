import {
  getCorsHeaders,
  checkRateLimit,
  checkRateLimitShared,
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

interface CreditScoreRow {
  score: number
  factors: Record<string, unknown>
  calculated_at: string
}

const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60_000

Deno.serve(async (req: Request) => {
  const headers = getCorsHeaders(req)
  const requestId = generateRequestId()

  if (req.method === "OPTIONS") {
    return optionsResponse(headers)
  }

  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get("userId")

    // Require valid JWT
    const token = extractBearerToken(req)
    if (!token) {
      return errorResponse("Unauthorized", 401, headers, requestId)
    }
    const authUser = await verifyJwt(token)
    if (!authUser) {
      return errorResponse("Invalid or expired token", 401, headers, requestId)
    }

    // Ownership check: users can only query their own score (admins can query any)
    // For now, restrict to own score only
    if (authUser.userId !== userId) {
      return errorResponse("You can only query your own credit score", 403, headers, requestId)
    }

    if (!userId) {
      return errorResponse("Missing required query param: userId", 400, headers, requestId)
    }

    // Rate limit by IP
    const ip = getRequestIp(req)
    if (!(await checkRateLimitShared(ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS))) {
      return errorResponse("Rate limit exceeded. Try again in 1 minute.", 429, headers, requestId)
    }

    const supabaseUrl = getEnv("SUPABASE_URL")
    const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !supabaseKey) {
      return errorResponse("Server configuration error", 500, headers, requestId)
    }

    const serviceAuthHeader = `Bearer ${supabaseKey}`

    let score: CreditScoreRow | null = null

    const getRes = await fetch(`${supabaseUrl}/rest/v1/credit_scores?user_id=eq.${encodeURIComponent(userId)}&select=score,factors,calculated_at`, {
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: serviceAuthHeader,
      },
    })

    if (getRes.ok) {
      const rows: CreditScoreRow[] = await getRes.json()
      if (rows.length > 0) {
        score = rows[0]
      }
    }

    if (!score) {
      const calcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/calculate_credit_score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: serviceAuthHeader,
        },
        body: JSON.stringify({ p_user_id: userId }),
      })

      if (calcRes.ok) {
        const data = await calcRes.json()
        if (data && data.length > 0) {
          score = {
            score: data[0].score,
            factors: data[0].factors,
            calculated_at: new Date().toISOString(),
          }
        }
      }
    }

    if (!score) {
      score = {
        score: 550,
        factors: { tier: "fair" },
        calculated_at: new Date().toISOString(),
      }
    }

    return new Response(JSON.stringify(score), { status: 200, headers })
  } catch (err) {
    console.error(`[${requestId}] Credit score error:`, err)
    return errorResponse("Internal server error", 500, headers, requestId)
  }
})
