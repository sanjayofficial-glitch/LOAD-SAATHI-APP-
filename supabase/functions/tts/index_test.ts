// Network-free tests for the Fish Audio TTS edge function.
// - env, fetch and rate limiter are injected; real verifyClerkJwt is used
//   with tokens minted locally using a discardable test secret.
// - No Deno network/env permissions are needed, no ports are bound (tests
//   import handler.ts, never the Deno.serve entrypoint).

import { handleTts } from "./handler.ts";

const TEST_SECRET = "test-only-secret-0123456789abcdef-discardable";
const TEST_ISSUER = "https://test-instance.clerk.accounts.dev";
const TEST_AUDIENCE = "supabase";

const baseEnv: Record<string, string> = {
  FISH_TTS_ENABLED: "true",
  FISH_JWT_SECRET: TEST_SECRET,
  FISH_EXPECTED_ISSUER: TEST_ISSUER,
  FISH_EXPECTED_AUDIENCE: TEST_AUDIENCE,
  FISH_API_KEY: "test_fish_api_key_placeholder",
};

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Mint an HS256 JWT signed with the given secret (Clerk template shape). */
async function mintToken(
  secret: string,
  claims: Record<string, unknown>,
): Promise<string> {
  const enc = new TextEncoder();
  const header = b64url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = b64url(enc.encode(JSON.stringify(claims)));
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, enc.encode(`${header}.${payload}`)),
  );
  return `${header}.${payload}.${b64url(sig)}`;
}

async function authToken(now = Math.floor(Date.now() / 1000)): Promise<string> {
  return mintToken(TEST_SECRET, {
    sub: "user_2abcDEF123",
    email: "tester@example.com",
    role: "authenticated",
    iss: TEST_ISSUER,
    aud: TEST_AUDIENCE,
    nbf: now,
    iat: now,
    exp: now + 3600,
  });
}

interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

interface FetchCapture {
  request: CapturedRequest | null;
  callCount: number;
}

function injectFetch(
  capture: FetchCapture,
  respond: () => Response,
): typeof fetch {
  const impl = async (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    capture.callCount += 1;
    capture.request = {
      url: String(input),
      method: init?.method ?? "GET",
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: typeof init?.body === "string" ? init.body : "",
    };
    return respond();
  };
  return impl as unknown as typeof fetch;
}

function audioResponse(status = 200): Response {
  const bytes = new Uint8Array([0x49, 0x44, 0x33]);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (status >= 200 && status < 300 ? "" : "upstream-error"),
    arrayBuffer: async () => bytes.buffer,
    body: status >= 200 && status < 300
      ? new ReadableStream({
          start(controller) {
            controller.enqueue(bytes);
            controller.close();
          },
        })
      : null,
  } as unknown as Response;
}

function rateLimitOk(): boolean {
  return true;
}

function makeRequest(overrides: {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
} = {}): Request {
  return {
    method: overrides.method ?? "POST",
    url: "https://example.supabase.co/functions/v1/tts",
    headers: new Headers(overrides.headers ?? {}),
    text: async () => overrides.body ?? "",
  } as unknown as Request;
}

function jsonHeaders(token?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Content-Length": "100",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

Deno.test("tts: OPTIONS returns 204", async () => {
  const res = await handleTts(makeRequest({ method: "OPTIONS" }), {
    env: (n) => baseEnv[n],
  });
  if (res.status !== 204) throw new Error(`expected 204, got ${res.status}`);
});

Deno.test("tts: kill switch off fails closed with 503", async () => {
  const res = await handleTts(makeRequest(), {
    env: (n) => (n === "FISH_TTS_ENABLED" ? "false" : baseEnv[n]),
  });
  if (res.status !== 503) throw new Error(`expected 503, got ${res.status}`);
});

Deno.test("tts: non-POST method rejected (405)", async () => {
  const res = await handleTts(makeRequest({ method: "GET" }), {
    env: (n) => baseEnv[n],
  });
  if (res.status !== 405) throw new Error(`expected 405, got ${res.status}`);
});

Deno.test("tts: missing bearer token rejected (401)", async () => {
  const res = await handleTts(makeRequest({ headers: jsonHeaders() }), {
    env: (n) => baseEnv[n],
  });
  if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
});

Deno.test("tts: invalid token rejected (401)", async () => {
  const bad = `not-a-jwt.${"x".repeat(40)}.${"y".repeat(40)}`;
  const res = await handleTts(
    makeRequest({ headers: jsonHeaders(bad) }),
    { env: (n) => baseEnv[n] },
  );
  if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
});

Deno.test("tts: rate limit blocks (429)", async () => {
  const res = await handleTts(
    makeRequest({ headers: jsonHeaders(await authToken()) }),
    {
      env: (n) => baseEnv[n],
      checkRateLimitImpl: () => false,
    },
  );
  if (res.status !== 429) throw new Error(`expected 429, got ${res.status}`);
});

Deno.test("tts: non-JSON content type rejected (415)", async () => {
  const res = await handleTts(
    makeRequest({
      headers: { Authorization: `Bearer ${await authToken()}`, "Content-Type": "text/plain" },
      body: "hello",
    }),
    { env: (n) => baseEnv[n] },
  );
  if (res.status !== 415) throw new Error(`expected 415, got ${res.status}`);
});

Deno.test("tts: oversized body rejected (413)", async () => {
  const big = JSON.stringify({ text: "x".repeat(9000) });
  const res = await handleTts(
    makeRequest({
      headers: {
        "Content-Type": "application/json",
        "Content-Length": String(big.length),
        Authorization: `Bearer ${await authToken()}`,
      },
      body: big,
    }),
    { env: (n) => baseEnv[n] },
  );
  if (res.status !== 413) throw new Error(`expected 413, got ${res.status}`);
});

Deno.test("tts: invalid JSON rejected (400)", async () => {
  const res = await handleTts(
    makeRequest({
      headers: jsonHeaders(await authToken()),
      body: "{not-json",
    }),
    { env: (n) => baseEnv[n] },
  );
  if (res.status !== 400) throw new Error(`expected 400, got ${res.status}`);
});

Deno.test("tts: unknown fields rejected (400)", async () => {
  const res = await handleTts(
    makeRequest({
      headers: jsonHeaders(await authToken()),
      body: JSON.stringify({ text: "hi", model: "paid-model" }),
    }),
    { env: (n) => baseEnv[n] },
  );
  if (res.status !== 400) throw new Error(`expected 400, got ${res.status}`);
});

Deno.test("tts: empty text rejected (400)", async () => {
  const res = await handleTts(
    makeRequest({
      headers: jsonHeaders(await authToken()),
      body: JSON.stringify({ text: "   " }),
    }),
    { env: (n) => baseEnv[n] },
  );
  if (res.status !== 400) throw new Error(`expected 400, got ${res.status}`);
});

Deno.test("tts: missing FISH_API_KEY fails closed (500)", async () => {
  const env: Record<string, string> = { ...baseEnv, FISH_API_KEY: "" };
  const res = await handleTts(
    makeRequest({
      headers: jsonHeaders(await authToken()),
      body: JSON.stringify({ text: "hello" }),
    }),
    { env: (n) => env[n] },
  );
  if (res.status !== 500) throw new Error(`expected 500, got ${res.status}`);
});

Deno.test("tts: success proxies audio and sends free model", async () => {
  const capture: FetchCapture = { request: null, callCount: 0 };
  const res = await handleTts(
    makeRequest({
      headers: jsonHeaders(await authToken()),
      body: JSON.stringify({ text: "LoadSaathi Assistant audio check." }),
    }),
    {
      env: (n) => baseEnv[n],
      fetchImpl: injectFetch(capture, () => audioResponse(200)),
      checkRateLimitImpl: rateLimitOk,
    },
  );
  if (res.status !== 200) throw new Error(`expected 200, got ${res.status}`);
  if (res.headers.get("content-type") !== "audio/mpeg") {
    throw new Error("expected audio/mpeg content type");
  }
  if (!capture.request) throw new Error("upstream was not called");
  if (!capture.request.url.endsWith("/v1/tts")) {
    throw new Error(`unexpected upstream url: ${capture.request.url}`);
  }
  if (capture.request.headers.Authorization !== "Bearer test_fish_api_key_placeholder") {
    throw new Error("upstream Authorization header mismatch");
  }
  const upstreamBody = JSON.parse(capture.request.body);
  if (upstreamBody.model !== "s2.1-pro-free") {
    throw new Error(`free model not sent: ${upstreamBody.model}`);
  }
  if (upstreamBody.format !== "mp3") {
    throw new Error(`expected mp3 format, got ${upstreamBody.format}`);
  }
  if (upstreamBody.text !== "LoadSaathi Assistant audio check.") {
    throw new Error("text mismatch");
  }
});

Deno.test("tts: upstream 402 (quota) mapped to 429", async () => {
  const capture: FetchCapture = { request: null, callCount: 0 };
  const env: Record<string, string> = { ...baseEnv, FISH_API_KEY: "low-quota-key" };
  const res = await handleTts(
    makeRequest({
      headers: jsonHeaders(await authToken()),
      body: JSON.stringify({ text: "hello" }),
    }),
    {
      env: (n) => env[n],
      fetchImpl: injectFetch(capture, () => audioResponse(402)),
      checkRateLimitImpl: rateLimitOk,
    },
  );
  if (res.status !== 429) throw new Error(`expected 429, got ${res.status}`);
});

Deno.test("tts: upstream 401 (bad key) mapped to 502", async () => {
  const capture: FetchCapture = { request: null, callCount: 0 };
  const env: Record<string, string> = { ...baseEnv, FISH_API_KEY: "bad-key" };
  const res = await handleTts(
    makeRequest({
      headers: jsonHeaders(await authToken()),
      body: JSON.stringify({ text: "hello" }),
    }),
    {
      env: (n) => env[n],
      fetchImpl: injectFetch(capture, () => audioResponse(401)),
      checkRateLimitImpl: rateLimitOk,
    },
  );
  if (res.status !== 502) throw new Error(`expected 502, got ${res.status}`);
});

Deno.test("tts: invalid lang rejected (400)", async () => {
  const res = await handleTts(
    makeRequest({
      headers: jsonHeaders(await authToken()),
      body: JSON.stringify({ text: "hello", lang: "fr" }),
    }),
    { env: (n) => baseEnv[n] },
  );
  if (res.status !== 400) throw new Error(`expected 400, got ${res.status}`);
});

Deno.test("tts: lang=hi accepted; upstream body stays clean", async () => {
  const capture: FetchCapture = { request: null, callCount: 0 };
  const res = await handleTts(
    makeRequest({
      headers: jsonHeaders(await authToken()),
      body: JSON.stringify({ text: "नमस्ते", lang: "hi" }),
    }),
    {
      env: (n) => baseEnv[n],
      fetchImpl: injectFetch(capture, () => audioResponse(200)),
      checkRateLimitImpl: rateLimitOk,
    },
  );
  if (res.status !== 200) throw new Error(`expected 200, got ${res.status}`);
  if (!capture.request) throw new Error("upstream was not called");
  const upstreamBody = JSON.parse(capture.request.body);
  if (upstreamBody.lang !== undefined) throw new Error("lang must not leak upstream");
  if (upstreamBody.text !== "नमस्ते") throw new Error("text mismatch");
  if (upstreamBody.model !== "s2.1-pro-free") throw new Error("free model missing");
});

Deno.test("tts: storage cache hit skips Fish entirely", async () => {
  const callLog: string[] = [];
  const routedFetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    callLog.push(`${init?.method ?? "GET"} ${url}`);
    if (url.includes("/storage/v1/bucket")) {
      return { ok: true, status: 200, statusText: "OK" } as unknown as Response;
    }
    if (url.includes("/object/tts-cache/")) {
      return audioResponse(200); // cache hit
    }
    throw new Error(`unexpected upstream call: ${url}`);
  };

  const env: Record<string, string> = {
    ...baseEnv,
    SUPABASE_URL: "https://test-project.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test_service_role_key",
  };
  const res = await handleTts(
    makeRequest({
      headers: jsonHeaders(await authToken()),
      body: JSON.stringify({ text: "repeat question" }),
    }),
    {
      env: (n) => env[n],
      fetchImpl: routedFetch as unknown as typeof fetch,
      checkRateLimitImpl: rateLimitOk,
    },
  );
  if (res.status !== 200) throw new Error(`expected 200, got ${res.status}`);
  if (res.headers.get("content-type") !== "audio/mpeg") {
    throw new Error("expected audio/mpeg");
  }
  const fishCalls = callLog.filter((l) => l.includes("/v1/tts"));
  if (fishCalls.length !== 0) {
    throw new Error(`Fish should not be called on cache hit: ${callLog.join("; ")}`);
  }
});

Deno.test("tts: storage miss synthesizes and fills cache", async () => {
  const callLog: string[] = [];
  const routedFetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    callLog.push(`${init?.method ?? "GET"} ${url}`);
    if (url.includes("/storage/v1/bucket")) {
      return { ok: true, status: 200, statusText: "OK" } as unknown as Response;
    }
    if (url.includes("/object/tts-cache/")) {
      return { ok: false, status: 404, statusText: "Not Found" } as unknown as Response;
    }
    if (url.includes("/v1/tts")) {
      return audioResponse(200);
    }
    throw new Error(`unexpected call: ${url}`);
  };

  const env: Record<string, string> = {
    ...baseEnv,
    SUPABASE_URL: "https://test-project.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test_service_role_key",
  };
  const res = await handleTts(
    makeRequest({
      headers: jsonHeaders(await authToken()),
      body: JSON.stringify({ text: "unique question" }),
    }),
    {
      env: (n) => env[n],
      fetchImpl: routedFetch as unknown as typeof fetch,
      checkRateLimitImpl: rateLimitOk,
    },
  );
  if (res.status !== 200) throw new Error(`expected 200, got ${res.status}`);
  const fishCalls = callLog.filter((l) => l.includes("/v1/tts"));
  if (fishCalls.length !== 1) throw new Error("expected exactly one Fish call");
  const uploads = callLog.filter((l) => l.includes("POST https://test-project.supabase.co/storage/v1/object/tts-cache/"));
  if (uploads.length !== 1) throw new Error(`expected one cache upload: ${callLog.join("; ")}`);
});
