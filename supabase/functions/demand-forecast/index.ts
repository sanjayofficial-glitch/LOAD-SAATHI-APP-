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

interface ForecastRequest {
  originCity?: string;
  destinationCity?: string;
  vehicleType?: string;
  daysAhead?: number;
}

interface DailyForecast {
  date: string;
  predictedDemand: number;
  confidence: "high" | "medium" | "low";
  suggestedPricePerTonne: number;
}

interface ForecastResult {
  route: string;
  forecasts: DailyForecast[];
  summary: string;
  generatedAt: string;
}

const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 60_000;

function buildSummary(forecasts: DailyForecast[], route: string): string {
  if (forecasts.length === 0) {
    return `Insufficient historical data for ${route}. Consider checking back after more trips are completed on this route.`;
  }

  const avgDemand = forecasts.reduce((s, f) => s + f.predictedDemand, 0) / forecasts.length;
  const avgPrice = forecasts.reduce((s, f) => s + f.suggestedPricePerTonne, 0) / forecasts.length;
  const trend =
    forecasts.length >= 2 &&
    forecasts[forecasts.length - 1].predictedDemand > forecasts[0].predictedDemand
      ? "increasing"
      : forecasts.length >= 2 &&
          forecasts[forecasts.length - 1].predictedDemand < forecasts[0].predictedDemand
        ? "decreasing"
        : "stable";

  return `Route ${route}: Demand is ${trend} with an average of ${Math.round(avgDemand)} expected shipments/day. Suggested price: Rs ${Math.round(avgPrice)}/tonne. Based on historical patterns from similar routes and time periods.`;
}

Deno.serve(async (req: Request) => {
  const headers = getCorsHeaders(req);
  const requestId = generateRequestId();

  if (req.method === "OPTIONS") {
    return optionsResponse(headers);
  }

  try {
    let body: ForecastRequest = {};
    try {
      body = await req.json();
    } catch {
      // use defaults
    }

    // Auth required for all requests (no allowPublic bypass)
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

    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return errorResponse("Server configuration error", 500, headers, requestId);
    }

    const serviceAuthHeader = `Bearer ${supabaseKey}`;

    const originCity = body.originCity || "";
    const destinationCity = body.destinationCity || "";
    const daysAhead = Math.min(body.daysAhead || 7, 14);
    const route = originCity && destinationCity
      ? `${originCity} to ${destinationCity}`
      : "all routes";

    let queryUrl = `${supabaseUrl}/rest/v1/price_history?select=price_per_tonne,weight_tonnes,origin_city,destination_city,created_at&order=created_at.desc&limit=200`;

    if (originCity) {
      queryUrl += `&origin_city=ilike.*${encodeURIComponent(originCity)}*`;
    }
    if (destinationCity) {
      queryUrl += `&destination_city=ilike.*${encodeURIComponent(destinationCity)}*`;
    }

    const historyRes = await fetch(queryUrl, {
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: serviceAuthHeader,
      },
    });

    const historyData: {
      price_per_tonne: number;
      weight_tonnes: number;
      origin_city: string;
      destination_city: string;
      created_at: string;
    }[] = historyRes.ok ? await historyRes.json() : [];

    const dayStats: Record<number, { count: number; totalPrice: number; totalWeight: number }> = {};

    for (const entry of historyData) {
      const day = new Date(entry.created_at).getDay();
      if (!dayStats[day]) {
        dayStats[day] = { count: 0, totalPrice: 0, totalWeight: 0 };
      }
      dayStats[day].count++;
      dayStats[day].totalPrice += entry.price_per_tonne || 0;
      dayStats[day].totalWeight += entry.weight_tonnes || 0;
    }

    const forecasts: DailyForecast[] = [];
    const now = new Date();

    for (let i = 0; i < daysAhead; i++) {
      const forecastDate = new Date(now);
      forecastDate.setDate(forecastDate.getDate() + i);
      const dayOfWeek = forecastDate.getDay();
      const stats = dayStats[dayOfWeek];

      if (stats && stats.count > 0) {
        const avgPrice = stats.totalPrice / stats.count;
        const avgWeight = stats.totalWeight / stats.count;
        const confidence: "high" | "medium" | "low" =
          stats.count >= 10 ? "high" : stats.count >= 4 ? "medium" : "low";

        forecasts.push({
          date: forecastDate.toISOString().split("T")[0],
          predictedDemand: Math.round(avgWeight * 10) / 10,
          confidence,
          suggestedPricePerTonne: Math.round(avgPrice),
        });
      } else {
        const allStats = Object.values(dayStats);
        if (allStats.length > 0) {
          const totalCount = allStats.reduce((s, d) => s + d.count, 0);
          const totalPrice = allStats.reduce((s, d) => s + d.totalPrice, 0);
          const totalWeight = allStats.reduce((s, d) => s + d.totalWeight, 0);
          forecasts.push({
            date: forecastDate.toISOString().split("T")[0],
            predictedDemand: Math.round((totalWeight / totalCount) * 10) / 10,
            confidence: "low",
            suggestedPricePerTonne: Math.round(totalPrice / totalCount),
          });
        } else {
          forecasts.push({
            date: forecastDate.toISOString().split("T")[0],
            predictedDemand: 5,
            confidence: "low",
            suggestedPricePerTonne: 2500,
          });
        }
      }
    }

    const summary = buildSummary(forecasts, route);

    const result: ForecastResult = {
      route,
      forecasts,
      summary,
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err) {
    console.error(`[${requestId}] Demand forecast error:`, err);
    return errorResponse("Internal server error", 500, headers, requestId);
  }
});
