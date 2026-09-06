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

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

const MANAGEMENT_API = "https://api.supabase.com/v1";

// Secrets that admins can manage from the UI.
const MANAGEABLE_SECRETS = [
  "GEMINI_API_KEY",
  "GROQ_API_KEY",
  "OPENROUTER_API_KEY",
];

// Functions that share these secrets.
const FUNCTION_SLUGS = ["match-ml", "gemini-proxy"];

function extractProjectRef(): string | null {
  const url = getEnv("SUPABASE_URL");
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    const match = host.match(/^([a-z0-9-]+)\./i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

interface SecretEntry {
  name: string;
  value: string | null;
  has_value: boolean;
}

Deno.serve(async (req: Request) => {
  const headers = getCorsHeaders(req);
  const requestId = generateRequestId();

  if (req.method === "OPTIONS") {
    return optionsResponse(headers);
  }

  if (req.method !== "GET" && req.method !== "POST" && req.method !== "DELETE") {
    return errorResponse("Method not allowed", 405, headers, requestId);
  }

  // Require valid JWT
  const token = extractBearerToken(req);
  if (!token) {
    return errorResponse("Unauthorized", 401, headers, requestId);
  }
  const authUser = await verifyJwt(token);
  if (!authUser) {
    return errorResponse("Invalid or expired token", 401, headers, requestId);
  }

  // Rate limit
  const ip = getRequestIp(req);
  if (!checkRateLimit(ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return errorResponse("Rate limit exceeded. Try again in 1 minute.", 429, headers, requestId);
  }

  // Check admin via Supabase service role (look up user in users table)
  const supabaseUrl = getEnv("SUPABASE_URL");
  const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    return errorResponse("Server configuration error", 500, headers, requestId);
  }

  const serviceAuthHeader = `Bearer ${supabaseKey}`;

  try {
    const { data: userData, error: userErr } = await (async () => {
      const res = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${authUser.userId}`, {
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: serviceAuthHeader,
        },
      });
      if (!res.ok) return { data: null, error: new Error(`User lookup failed: ${res.status}`) };
      const data = await res.json();
      return { data: data[0] || null, error: null };
    })();

    if (userErr) {
      console.error(`[${requestId}] admin-secrets: user lookup error:`, userErr.message);
      return errorResponse("Admin access required", 500, headers, requestId);
    }

    if (!userData || userData.user_type !== "admin") {
      return errorResponse("Admin access required", 403, headers, requestId);
    }

    const projectRef = extractProjectRef();
    const accessToken = getEnv("SUPABASE_ACCESS_TOKEN");

    if (!projectRef || !accessToken) {
      console.error(`[${requestId}] admin-secrets: missing project ref or access token`);
      return errorResponse("Server configuration error: management credentials not set", 500, headers, requestId);
    }

    const mgmtHeaders = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    if (req.method === "GET") {
      // List current secret status for each manageable key
      const results: SecretEntry[] = [];

      for (const secretName of MANAGEABLE_SECRETS) {
        let hasValue = false;
        try {
          const res = await fetch(
            `${MANAGEMENT_API}/projects/${projectRef}/functions/secrets`,
            { headers: mgmtHeaders },
          );
          if (res.ok) {
            const secrets: Array<{ name: string }> = await res.json();
            hasValue = secrets.some((s) => s.name === secretName);
          }
        } catch (err) {
          console.error(`[${requestId}] admin-secrets: error listing secret ${secretName}:`, err);
        }
        results.push({ name: secretName, value: null, has_value: hasValue });
      }

      console.log(`[${requestId}] admin-secrets: list requested by admin ${authUser.userId}`);
      return new Response(JSON.stringify({ requestId, secrets: results }), { status: 200, headers });
    }

    if (req.method === "POST") {
      const body = await req.json() as { secret: string; value: string };
      if (!body.secret || !body.value) {
        return errorResponse("Missing required fields: secret and value", 400, headers, requestId);
      }
      if (!MANAGEABLE_SECRETS.includes(body.secret)) {
        return errorResponse(`Cannot manage secret: ${body.secret}. Allowed: ${MANAGEABLE_SECRETS.join(", ")}`, 400, headers, requestId);
      }

      console.log(`[${requestId}] admin-secrets: setting ${body.secret} for admin ${authUser.userId}`);

      let lastError: string | null = null;
      let success = false;

      for (const fnSlug of FUNCTION_SLUGS) {
        try {
          const res = await fetch(
            `${MANAGEMENT_API}/projects/${projectRef}/functions/${fnSlug}/secrets`,
            {
              method: "POST",
              headers: mgmtHeaders,
              body: JSON.stringify([{ name: body.secret, value: body.value }]),
            },
          );
          if (res.ok) {
            success = true;
          } else {
            lastError = `function ${fnSlug}: ${res.status}`;
          }
        } catch (err) {
          lastError = `function ${fnSlug}: ${(err as Error).message}`;
        }
      }

      if (success) {
        return new Response(JSON.stringify({ requestId, success: true, secret: body.secret }), { status: 200, headers });
      } else {
        console.error(`[${requestId}] admin-secrets: failed to set ${body.secret}: ${lastError}`);
        return errorResponse(`Failed to update secret: ${lastError}`, 500, headers, requestId);
      }
    }

    if (req.method === "DELETE") {
      const body = await req.json().catch(() => null) as { secret?: string } | null;
      const secretName = body?.secret;

      if (!secretName) {
        return errorResponse("Missing required field: secret", 400, headers, requestId);
      }
      if (!MANAGEABLE_SECRETS.includes(secretName)) {
        return errorResponse(`Cannot manage secret: ${secretName}`, 400, headers, requestId);
      }

      console.log(`[${requestId}] admin-secrets: unsetting ${secretName} for admin ${authUser.userId}`);

      let success = false;
      let lastError: string | null = null;

      for (const fnSlug of FUNCTION_SLUGS) {
        try {
          const res = await fetch(
            `${MANAGEMENT_API}/projects/${projectRef}/functions/${fnSlug}/secrets`,
            {
              method: "DELETE",
              headers: mgmtHeaders,
              body: JSON.stringify({ names: [secretName] }),
            },
          );
          if (res.ok) success = true;
          else lastError = `function ${fnSlug}: ${res.status}`;
        } catch (err) {
          lastError = `function ${fnSlug}: ${(err as Error).message}`;
        }
      }

      if (success) {
        return new Response(JSON.stringify({ requestId, success: true, secret: secretName }), { status: 200, headers });
      } else {
        return errorResponse(`Failed to unset secret: ${lastError}`, 500, headers, requestId);
      }
    }

    return errorResponse("Method not handled", 405, headers, requestId);
  } catch (err) {
    console.error(`[${requestId}] admin-secrets: unexpected error:`, err);
    return errorResponse("Internal server error", 500, headers, requestId);
  }
});
