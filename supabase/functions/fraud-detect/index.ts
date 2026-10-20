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

interface FraudFlag {
  rule: string;
  severity: "low" | "medium" | "high";
  detail: string;
}

interface FraudResult {
  riskScore: number;
  flags: FraudFlag[];
  explanation: string;
  checkedAt: string;
}

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function buildExplanation(flags: FraudFlag[], riskScore: number): string {
  if (flags.length === 0) {
    return "No suspicious patterns detected. This activity appears legitimate based on available data.";
  }

  const highFlags = flags.filter((f) => f.severity === "high");
  const mediumFlags = flags.filter((f) => f.severity === "medium");

  let explanation = `Fraud risk score: ${riskScore}/100. `;

  if (highFlags.length > 0) {
    explanation += `High-risk indicators found: ${highFlags.map((f) => f.detail).join("; ")}. `;
  }
  if (mediumFlags.length > 0) {
    explanation += `Moderate concerns: ${mediumFlags.map((f) => f.detail).join("; ")}. `;
  }

  if (riskScore >= 70) {
    explanation +=
      "This activity shows strong patterns associated with fraudulent behavior. Manual review is strongly recommended before proceeding.";
  } else if (riskScore >= 40) {
    explanation +=
      "Some unusual patterns detected. Consider additional verification before approving.";
  } else {
    explanation +=
      "Minor anomalies detected. These may be legitimate but warrant awareness.";
  }

  return explanation;
}

Deno.serve(async (req: Request) => {
  const headers = getCorsHeaders(req);
  const requestId = generateRequestId();

  if (req.method === "OPTIONS") {
    return optionsResponse(headers);
  }

  try {
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
      return errorResponse(
        "Rate limit exceeded. Try again in 1 minute.",
        429,
        headers,
        requestId
      );
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return errorResponse("Server configuration error", 500, headers, requestId);
    }

    const serviceAuthHeader = `Bearer ${supabaseKey}`;

    // Body content is no longer used for authorization purposes. Parse
    // defensively so malformed JSON yields a clean 400 instead of a 500.
    try {
      await req.json();
    } catch {
      return errorResponse("Invalid JSON body", 400, headers, requestId);
    }

    // Ownership guard (closes an IDOR): every query below runs with the
    // service-role key and bypasses RLS, so the caller may only ever inspect
    // their OWN account. A client-supplied userId (body.userId) used to be
    // trusted here — any signed-in user could pull another user's trips and
    // pricing profile. If an admin console ever needs cross-user checks,
    // gate them behind a verified admin role first.
    const userId = authUser.userId;
    const flags: FraudFlag[] = [];

    // Rule 1: Check for rapid account creation + immediate high-value activity
    const { data: userData } = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(userId)}&select=created_at`,
      {
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: serviceAuthHeader,
        },
      }
    ).then((r) => r.json());

    if (userData && userData.length > 0) {
      const createdAt = new Date(userData[0].created_at);
      const hoursSinceCreation =
        (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceCreation < 24) {
        // Check if they already have multiple trips
        const tripCountRes = await fetch(
          `${supabaseUrl}/rest/v1/trips?trucker_id=eq.${encodeURIComponent(userId)}&select=id`,
          {
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseKey,
              Authorization: serviceAuthHeader,
            },
          }
        );
        const trips = await tripCountRes.json();
        if (trips && trips.length >= 3) {
          flags.push({
            rule: "rapid_activity_new_account",
            severity: "high",
            detail: `New account (${Math.round(hoursSinceCreation)}h old) with ${trips.length} trips posted`,
          });
        }
      }
    }

    // Rule 2: Check for duplicate/suspicious location patterns
    const { data: userTrips } = await fetch(
      `${supabaseUrl}/rest/v1/trips?trucker_id=eq.${encodeURIComponent(userId)}&select=origin_city,destination_city,origin_lat,origin_lng,destination_lat,destination_lng&limit=20`,
      {
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: serviceAuthHeader,
        },
      }
    ).then((r) => r.json());

    if (userTrips && userTrips.length >= 5) {
      const cityPairs = new Set<string>();
      for (const trip of userTrips) {
        cityPairs.add(`${trip.origin_city}->${trip.destination_city}`);
      }
      if (cityPairs.size <= 2 && userTrips.length >= 5) {
        flags.push({
          rule: "repetitive_routes",
          severity: "medium",
          detail: `${userTrips.length} trips across only ${cityPairs.size} unique routes`,
        });
      }
    }

    // Rule 3: Check for suspicious pricing (way above/below market)
    const { data: priceData } = await fetch(
      `${supabaseUrl}/rest/v1/price_history?user_id=eq.${encodeURIComponent(userId)}&select=price_per_tonne&limit=10&order=created_at.desc`,
      {
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: serviceAuthHeader,
        },
      }
    ).then((r) => r.json());

    if (priceData && priceData.length > 0) {
      const prices: number[] = priceData.map(
        (p: { price_per_tonne: number }) => p.price_per_tonne
      );
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const outliers = prices.filter((p) => p > avg * 3 || p < avg * 0.3);
      if (outliers.length >= 2) {
        flags.push({
          rule: "suspicious_pricing",
          severity: "medium",
          detail: `${outliers.length} prices significantly deviate from user average of ₹${Math.round(avg)}/tonne`,
        });
      }
    }

    // Rule 4: Check cancellation ratio
    const { count: cancelCount } = await fetch(
      `${supabaseUrl}/rest/v1/trips?trucker_id=eq.${encodeURIComponent(userId)}&status=eq.cancelled&select=id`,
      {
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: serviceAuthHeader,
          Prefer: "count=exact",
        },
      }
    ).then((r) => {
      const cnt = r.headers.get("content-range");
      return { count: cnt ? parseInt(cnt.split("/")[1]) : 0 };
    });

    if (cancelCount > 5) {
      flags.push({
        rule: "high_cancellation_count",
        severity: "low",
        detail: `${cancelCount} cancelled trips`,
      });
    }

    // Calculate risk score
    const severityWeights = { high: 35, medium: 20, low: 10 };
    const riskScore = Math.min(
      100,
      flags.reduce((sum, f) => sum + severityWeights[f.severity], 0)
    );

    const explanation = buildExplanation(flags, riskScore);

    const result: FraudResult = {
      riskScore,
      flags,
      explanation,
      checkedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err) {
    console.error(`[${requestId}] Fraud detection error:`, err);
    return errorResponse("Internal server error", 500, headers, requestId);
  }
});
