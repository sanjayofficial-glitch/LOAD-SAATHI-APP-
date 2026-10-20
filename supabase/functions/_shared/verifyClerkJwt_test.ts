// Tests for verifyClerkJwt. Named `*_test.ts` on purpose: Deno's test runner
// discovers this pattern while vitest's default `*.test.*` include does not,
// so the Node-side test pipeline is untouched.
//
// Fully self-contained: mints its own HS256 tokens with a disposable,
// obviously-fake test secret. No network, no env vars, no real secrets,
// no tokens from any real system. The injected clock (nowSec) makes every
// case deterministic.

import { verifyClerkJwt } from "./verifyClerkJwt.ts";

const TEST_SECRET = "test-only-secret-0123456789abcdef-discardable";
const TEST_ISSUER = "https://test-instance.clerk.accounts.dev";
const TEST_AUDIENCE = "authenticated";
const NOW = 1_760_000_000; // fixed epoch seconds, injected into every call

const enc = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(
    /=+$/,
    "",
  );
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return base64UrlEncode(new Uint8Array(sig));
}

interface MintOptions {
  alg?: string;
  typ?: string | null;
  secret?: string;
  rawPayload?: string;
}

async function mint(
  claims: Record<string, unknown>,
  mintOpts: MintOptions = {},
): Promise<string> {
  const header: Record<string, unknown> = { alg: mintOpts.alg ?? "HS256" };
  if (mintOpts.typ !== null) header.typ = mintOpts.typ ?? "JWT";
  const h = base64UrlEncode(enc.encode(JSON.stringify(header)));
  const p = mintOpts.rawPayload ??
    base64UrlEncode(enc.encode(JSON.stringify(claims)));
  const s = await hmacSign(`${h}.${p}`, mintOpts.secret ?? TEST_SECRET);
  return `${h}.${p}.${s}`;
}

// Clerk "supabase" template shape: sub + email + role, plus the registered
// claims Clerk adds by default (iss, aud where present, iat, nbf, exp, jti).
function baseClaims(overrides: Record<string, unknown> = {}): Record<
  string,
  unknown
> {
  return {
    sub: "user_2abcDEF123",
    email: "driver@example.com",
    role: "authenticated",
    iss: TEST_ISSUER,
    aud: TEST_AUDIENCE,
    iat: NOW - 10,
    nbf: NOW - 10,
    exp: NOW + 60,
    ...overrides,
  };
}

interface VerifyOptions {
  jwtSecret: string;
  expectedIssuer: string;
  expectedAudience: string | string[];
  clockSkewSec?: number;
  nowSec?: number;
}

function opts(
  overrides: Partial<VerifyOptions> = {},
): VerifyOptions {
  return {
    jwtSecret: TEST_SECRET,
    expectedIssuer: TEST_ISSUER,
    expectedAudience: TEST_AUDIENCE,
    nowSec: NOW,
    ...overrides,
  };
}

function expectNull(result: unknown, label: string): void {
  if (result !== null) {
    throw new Error(`${label}: expected null, got ${JSON.stringify(result)}`);
  }
}

function expectUser(result: unknown, label: string): {
  userId: string;
  email?: string;
} {
  if (result === null || typeof result !== "object") {
    throw new Error(`${label}: expected a user object, got null`);
  }
  const user = result as { userId: string; email?: string };
  if (typeof user.userId !== "string" || user.userId.length === 0) {
    throw new Error(`${label}: userId missing or not a string`);
  }
  return user;
}

Deno.test("accepts a valid template-shaped token and preserves sub byte-exact", async () => {
  const token = await mint(baseClaims());
  const user = expectUser(
    await verifyClerkJwt(token, opts()),
    "valid token",
  );
  if (user.userId !== "user_2abcDEF123") {
    throw new Error(
      `sub not preserved byte-exact: got "${user.userId}"`,
    );
  }
  if (user.email !== "driver@example.com") {
    throw new Error(`email claim not passed through: got "${user.email}"`);
  }
});

Deno.test("rejects a token signed with the wrong secret", async () => {
  const token = await mint(baseClaims(), {
    secret: "a-completely-different-test-secret-value-000",
  });
  expectNull(
    await verifyClerkJwt(token, opts()),
    "wrong-secret signature",
  );
});

Deno.test("rejects a tampered payload", async () => {
  const token = await mint(baseClaims());
  const [, , sig] = token.split(".");
  const forgedPayload = base64UrlEncode(
    enc.encode(JSON.stringify(baseClaims({ sub: "user_ATTACKER" }))),
  );
  const forged = `${token.split(".")[0]}.${forgedPayload}.${sig}`;
  expectNull(await verifyClerkJwt(forged, opts()), "tampered payload");
});

Deno.test("rejects an expired token", async () => {
  const token = await mint(baseClaims({ exp: NOW - 120 }));
  expectNull(await verifyClerkJwt(token, opts()), "expired token");
});

Deno.test("accepts a token inside the default clock skew of expiry", async () => {
  const token = await mint(baseClaims({ exp: NOW - 10 }));
  expectUser(await verifyClerkJwt(token, opts()), "exp within skew");
});

Deno.test("honors a custom clockSkewSec", async () => {
  const token = await mint(baseClaims({ exp: NOW - 120 }));
  expectUser(
    await verifyClerkJwt(token, { ...opts(), clockSkewSec: 200 }),
    "large custom skew",
  );
  expectNull(
    await verifyClerkJwt(token, { ...opts(), clockSkewSec: 5 }),
    "tight custom skew",
  );
});

Deno.test("rejects a not-yet-valid token (future nbf)", async () => {
  const token = await mint(baseClaims({ nbf: NOW + 300 }));
  expectNull(await verifyClerkJwt(token, opts()), "future nbf");
});

Deno.test("rejects a future-issued token (future iat)", async () => {
  const token = await mint(baseClaims({ iat: NOW + 300 }));
  expectNull(await verifyClerkJwt(token, opts()), "future iat");
});

Deno.test("rejects a missing exp", async () => {
  const token = await mint(baseClaims({ exp: undefined }));
  expectNull(await verifyClerkJwt(token, opts()), "missing exp");
});

Deno.test("rejects a missing sub", async () => {
  const token = await mint(baseClaims({ sub: undefined }));
  expectNull(await verifyClerkJwt(token, opts()), "missing sub");
});

Deno.test("rejects an empty sub", async () => {
  const token = await mint(baseClaims({ sub: "" }));
  expectNull(await verifyClerkJwt(token, opts()), "empty sub");
});

Deno.test("rejects a missing role", async () => {
  const token = await mint(baseClaims({ role: undefined }));
  expectNull(await verifyClerkJwt(token, opts()), "missing role");
});

Deno.test("rejects a non-authenticated role", async () => {
  const token = await mint(baseClaims({ role: "anon" }));
  expectNull(await verifyClerkJwt(token, opts()), "role=anon");
});

Deno.test("rejects an issuer mismatch", async () => {
  const token = await mint(baseClaims({ iss: "https://evil.example.com" }));
  expectNull(await verifyClerkJwt(token, opts()), "issuer mismatch");
});

Deno.test("rejects when iss is absent from the token", async () => {
  const token = await mint(baseClaims({ iss: undefined }));
  expectNull(await verifyClerkJwt(token, opts()), "absent iss");
});

Deno.test("rejects an audience mismatch", async () => {
  const token = await mint(baseClaims({ aud: "other-audience" }));
  expectNull(await verifyClerkJwt(token, opts()), "audience mismatch");
});

Deno.test("rejects when aud is absent from the token", async () => {
  const token = await mint(baseClaims({ aud: undefined }));
  expectNull(await verifyClerkJwt(token, opts()), "absent aud");
});

Deno.test("accepts aud as an array containing the expected audience", async () => {
  const token = await mint(baseClaims({ aud: ["authenticated", "other"] }));
  expectUser(await verifyClerkJwt(token, opts()), "aud array hit");
});

Deno.test("rejects an aud array without the expected value", async () => {
  const token = await mint(baseClaims({ aud: ["other", "another"] }));
  expectNull(await verifyClerkJwt(token, opts()), "aud array miss");
});

Deno.test("supports expectedAudience as a list of acceptable values", async () => {
  const token = await mint(baseClaims({ aud: "other" }));
  expectUser(
    await verifyClerkJwt(
      token,
      opts({ expectedAudience: ["other", "third"] }),
    ),
    "expectedAudience list hit",
  );
  expectNull(
    await verifyClerkJwt(
      token,
      opts({ expectedAudience: ["fourth", "fifth"] }),
    ),
    "expectedAudience list miss",
  );
});

Deno.test("rejects alg none even with a valid signature attached", async () => {
  const token = await mint(baseClaims(), { alg: "none" });
  expectNull(await verifyClerkJwt(token, opts()), "alg=none");
});

Deno.test("rejects a non-HS256 algorithm", async () => {
  const token = await mint(baseClaims(), { alg: "RS256" });
  expectNull(await verifyClerkJwt(token, opts()), "alg=RS256 with HMAC key");
});

Deno.test("rejects a wrong typ header", async () => {
  const token = await mint(baseClaims(), { typ: "FOO" });
  expectNull(await verifyClerkJwt(token, opts()), "typ=FOO");
});

Deno.test("rejects tokens without a typ header only when typ is wrong, not absent", async () => {
  const token = await mint(baseClaims(), { typ: null });
  expectUser(await verifyClerkJwt(token, opts()), "absent typ is allowed");
});

Deno.test("rejects malformed tokens", async () => {
  const valid = await mint(baseClaims());
  const [h, p, s] = valid.split(".");
  expectNull(await verifyClerkJwt("", opts()), "empty token");
  expectNull(await verifyClerkJwt(`${h}.${p}`, opts()), "two segments");
  expectNull(await verifyClerkJwt(`${h}.${p}.${s}.extra`, opts()), "four segments");
  expectNull(
    await verifyClerkJwt(`${h}.${"!!!"}.${s}`, opts()),
    "invalid base64url payload",
  );
  expectNull(
    await verifyClerkJwt(
      `${h}.${
        base64UrlEncode(enc.encode("not-json"))
      }.${s}`,
      opts(),
    ),
    "non-JSON payload with valid signature",
  );
});

Deno.test("fails closed when configuration is missing", async () => {
  const token = await mint(baseClaims());
  expectNull(
    await verifyClerkJwt(token, { ...opts(), jwtSecret: "" }),
    "missing secret",
  );
  expectNull(
    await verifyClerkJwt(token, { ...opts(), expectedIssuer: "" }),
    "missing expected issuer",
  );
  expectNull(
    await verifyClerkJwt(token, { ...opts(), expectedAudience: "" }),
    "missing expected audience",
  );
});

Deno.test("honors the injected clock exactly", async () => {
  const token = await mint(baseClaims({ exp: NOW + 1 }));
  expectUser(
    await verifyClerkJwt(token, { ...opts(), nowSec: NOW }),
    "valid at injected now",
  );
  expectNull(
    await verifyClerkJwt(token, { ...opts(), nowSec: NOW + 100 }),
    "expired at a later injected now",
  );
});
