// Fish Audio TTS (free tier) — Freddy voice endpoint.
//
// Converts assistant text into MP3 speech using the Fish Audio REST API with
// the FREE model explicitly set (s2.1-pro-free). The SDK's own default is the
// PAYING s2.1-pro model, so this endpoint hard-codes the free model and never
// exposes the API key to the browser.
//
// Cost/quota safeguards:
//   - Server-side audio cache (Supabase Storage, private "tts-cache"
//     bucket): identical (text, lang) pairs are reused across all users, so
//     repeat Freddy replies never consume Fish quota again. Best-effort —
//     storage failures degrade to fresh synthesis, never errors.
//   - Rate limiting per IP before any paid third-party call.
//   - Optional FISH_REFERENCE_ID secret switches the voice to a custom Fish
//     Audio reference voice when set (e.g., a cloned Hindi voice).
//
// Security / posture (mirrors agent-router):
//   - Kill switch FISH_TTS_ENABLED=true — fail closed when off
//   - Clerk JWT verification (HS256) via verifyClerkJwt — the Supabase
//     gateway would reject Clerk "supabase"-template tokens itself, so the
//     function verifies them internally (config.toml sets verify_jwt=false)
//   - Strict request contract: JSON { text: string, lang?: "hi"|"en" },
//     bounded length
//   - The Fish API key is read server-side only (FISH_API_KEY)
//
// Deploy with:
//   supabase functions deploy tts
//   supabase secrets set FISH_API_KEY=... FISH_TTS_ENABLED=true \
//     FISH_JWT_SECRET=... FISH_EXPECTED_ISSUER=... FISH_EXPECTED_AUDIENCE=...
// (JWT values fall back to FREDDY_* if FISH_* are unset — same Clerk template.)
// Optional: FISH_REFERENCE_ID=<custom voice id>

import {
  checkRateLimit,
  errorResponse,
  extractBearerToken,
  generateRequestId,
  getCorsHeaders,
  getRequestIp,
  optionsResponse,
} from "../_shared/edgeHelpers.ts";
import { verifyClerkJwt } from "../_shared/verifyClerkJwt.ts";
import {
  cacheObjectKey,
  ensureCacheBucket,
  getCachedAudio,
  putCachedAudio,
  type TtsCacheDeps,
} from "../_shared/ttsCache.ts";

const FREE_MODEL = "s2.1-pro-free";
const FISH_API_BASE = "https://api.fish.audio";
const MAX_TEXT_LENGTH = 2_000;
const MAX_BODY_BYTES = 8 * 1024;
const RATE_LIMIT_REQUESTS = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_RETRY_AFTER_SECONDS = 60;
const RATE_LIMIT_KEY_PREFIX = "tts:";
const UPSTREAM_TIMEOUT_MS = 30_000;
const SUPPORTED_LANGS = ["en", "hi"] as const;
type Lang = (typeof SUPPORTED_LANGS)[number];

export interface TtsDeps {
  env?: (name: string) => string | undefined;
  fetchImpl?: typeof fetch;
  checkRateLimitImpl?: (
    key: string,
    maxRequests: number,
    windowMs: number,
  ) => boolean;
}

let bucketEnsured: Promise<void> | null = null;

/** Kill switch: fail closed. Only exact "true" (any case) enables. */
function isKillSwitchEnabled(env: (name: string) => string | undefined): boolean {
  return (env("FISH_TTS_ENABLED") ?? "").trim().toLowerCase() === "true";
}

function cacheDeps(
  env: (name: string) => string | undefined,
  fetchImpl: typeof fetch,
): TtsCacheDeps | null {
  const baseUrl = env("SUPABASE_URL") ?? "";
  const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!baseUrl || !serviceRoleKey) return null;
  return { baseUrl, serviceRoleKey, fetchImpl };
}

function audioResponse(
  audio: Uint8Array | ArrayBuffer,
  headers: Record<string, string>,
): Response {
  const body = (audio instanceof Uint8Array ? audio.buffer : audio) as ArrayBuffer;
  return new Response(body, {
    status: 200,
    headers: {
      ...headers,
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=86400",
    },
  });
}

export async function handleTts(
  req: Request,
  deps: TtsDeps = {},
): Promise<Response> {
  const env = deps.env ?? ((name: string) => Deno.env.get(name));
  const checkRateLimitImpl = deps.checkRateLimitImpl ?? checkRateLimit;
  const fetchImpl = deps.fetchImpl ?? fetch;

  const requestId = generateRequestId();
  const headers = { ...getCorsHeaders(req), "X-Request-Id": requestId };

  if (req.method === "OPTIONS") {
    return optionsResponse(headers);
  }

  if (!isKillSwitchEnabled(env)) {
    return errorResponse("TTS is disabled.", 503, headers, requestId);
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed. Use POST with a JSON body.", 405, {
      ...headers,
      Allow: "POST, OPTIONS",
    }, requestId);
  }

  const ip = getRequestIp(req);
  if (
    !checkRateLimitImpl(
      `${RATE_LIMIT_KEY_PREFIX}${ip}`,
      RATE_LIMIT_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    )
  ) {
    return errorResponse(
      "Rate limit exceeded. Retry shortly.",
      429,
      { ...headers, "Retry-After": String(RATE_LIMIT_RETRY_AFTER_SECONDS) },
      requestId,
    );
  }

  const token = extractBearerToken(req);
  if (!token) {
    return errorResponse("Missing bearer token.", 401, headers, requestId);
  }

  const jwtSecret = env("FISH_JWT_SECRET") ?? env("FREDDY_JWT_SECRET") ?? "";
  const expectedIssuer =
    env("FISH_EXPECTED_ISSUER") ?? env("FREDDY_EXPECTED_ISSUER") ?? "";
  const expectedAudience =
    env("FISH_EXPECTED_AUDIENCE") ?? env("FREDDY_EXPECTED_AUDIENCE") ?? "";
  if (!jwtSecret || !expectedIssuer || !expectedAudience) {
    console.error(
      `[${requestId}] tts: auth configuration missing (FISH/FREDDY_JWT_SECRET, EXPECTED_ISSUER, EXPECTED_AUDIENCE)`,
    );
    return errorResponse("Server configuration error.", 500, headers, requestId);
  }

  const user = await verifyClerkJwt(token, {
    jwtSecret,
    expectedIssuer,
    expectedAudience,
  });
  if (!user) {
    return errorResponse("Invalid or expired token.", 401, headers, requestId);
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return errorResponse(
      "Unsupported Media Type: Content-Type must be application/json.",
      415,
      headers,
      requestId,
    );
  }

  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  const rawBody = await req.text();
  if (declaredLength > MAX_BODY_BYTES || rawBody.length > MAX_BODY_BYTES) {
    return errorResponse(
      `Request body too large (max ${MAX_BODY_BYTES} bytes).`,
      413,
      headers,
      requestId,
    );
  }

  let body: { text?: unknown; lang?: unknown };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return errorResponse("Invalid JSON body.", 400, headers, requestId);
  }

  // Strict contract: `text` required, optional `lang` in {en, hi}; no other
  // fields are accepted so the endpoint cannot be probed with hidden params.
  const allowedKeys = Object.keys(body);
  const contractOk =
    (allowedKeys.length === 1 && allowedKeys[0] === "text") ||
    (allowedKeys.length === 2 &&
      allowedKeys.includes("text") &&
      allowedKeys.includes("lang"));
  if (!contractOk) {
    return errorResponse(
      'Request must contain {"text": "..."} and optionally {"lang": "en"|"hi"}.',
      400,
      headers,
      requestId,
    );
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return errorResponse("text must be a non-empty string.", 400, headers, requestId);
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return errorResponse(
      `text too long (max ${MAX_TEXT_LENGTH} characters).`,
      400,
      headers,
      requestId,
    );
  }

  let lang: Lang = "en";
  if (body.lang !== undefined) {
    if (typeof body.lang !== "string" || !(SUPPORTED_LANGS as readonly string[]).includes(body.lang)) {
      return errorResponse('lang must be "en" or "hi".', 400, headers, requestId);
    }
    lang = body.lang as Lang;
  }

  const fishApiKey = env("FISH_API_KEY") ?? "";
  if (!fishApiKey) {
    return errorResponse("FISH_API_KEY is not configured.", 500, headers, requestId);
  }

  // ── Server-side cache (best-effort): identical (text, lang) reuse ──
  const storage = cacheDeps(env, fetchImpl);
  let objectKey: string | null = null;
  if (storage) {
    objectKey = await cacheObjectKey(text, lang);
    if (!bucketEnsured) {
      bucketEnsured = ensureCacheBucket(storage).catch(() => undefined);
    }
    await bucketEnsured;
    const cached = await getCachedAudio(objectKey, storage);
    if (cached) {
      return audioResponse(cached, headers);
    }
  }

  // ── Upstream Fish Audio call (free model hard-coded) ──
  const referenceId = env("FISH_REFERENCE_ID") ?? "";
  const upstreamBody: Record<string, string> = {
    text,
    model: FREE_MODEL,
    format: "mp3",
  };
  if (referenceId) upstreamBody.reference_id = referenceId;

  let upstream: Response;
  try {
    upstream = await fetchImpl(`${FISH_API_BASE}/v1/tts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${fishApiKey}`,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify(upstreamBody),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (err) {
    console.error(`[${requestId}] tts: upstream fetch failed:`, err);
    return errorResponse("Speech service unavailable.", 502, headers, requestId);
  }

  if (!upstream.ok) {
    // 401 → misconfigured key; 402/429 → quota (free tier is limited).
    const detail = await upstream.text().catch(() => "");
    console.error(
      `[${requestId}] tts: Fish API ${upstream.status}: ${detail.slice(0, 300)}`,
    );
    if (upstream.status === 401) {
      return errorResponse("FISH_API_KEY rejected by Fish Audio.", 502, headers, requestId);
    }
    if (upstream.status === 402 || upstream.status === 429) {
      return errorResponse(
        "Speech quota exhausted on the free tier. Try again later.",
        429,
        { ...headers, "Retry-After": "3600" },
        requestId,
      );
    }
    return errorResponse("Speech service error.", 502, headers, requestId);
  }

  // ── Response: cache (if storage configured), otherwise stream directly ──
  if (storage && objectKey) {
    const audio = await upstream.arrayBuffer().catch(() => null);
    if (!audio || audio.byteLength === 0) {
      return errorResponse("Speech service returned empty audio.", 502, headers, requestId);
    }
    const bytes = new Uint8Array(audio);
    // Fire-and-forget cache fill; a failure is never surfaced to the user.
    void putCachedAudio(objectKey, bytes, storage).catch(() => false);
    return audioResponse(bytes, headers);
  }

  // No storage configured → stream Fish Audio's body through chunk-by-chunk
  // (audio starts reaching the client immediately, no full buffering).
  return new Response(upstream.body, {
    status: 200,
    headers: {
      ...headers,
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
