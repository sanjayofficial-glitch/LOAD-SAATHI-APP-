// HS256 verification for Clerk JWT-template tokens (the SPA's "supabase"
// template). Used by agent-router. Deliberately separate from
// edgeHelpers.verifyJwt so the eight existing verifyJwt callers keep their
// exact current behavior.
//
// Why this method (evidence, 2026-10-20):
// - GoTrue /auth/v1/user rejected a fresh template token with
//   `400 bad_jwt: sub claim must be a UUID` — a claim-format error, which
//   means the signature had already been verified OK against the project's
//   own (legacy) JWT secret. The project's public JWKS serves a single
//   EC/ES256 key, which cannot verify HS256 tokens, so JWKS-based
//   verification does not apply to this token type.
// - The Clerk "supabase" JWT template (documented in
//   src/contexts/AuthContext.tsx) mints { sub, email, role: "authenticated" }
//   and is signed HS256 with the Supabase project JWT secret.
//
// Security properties:
// - The signature is always verified via Web Crypto HMAC. A token is never
//   accepted merely because it decodes. alg is pinned to HS256 (rejects
//   "none" and any asymmetric algorithm).
// - exp is required; nbf and iat are honored when present; a small clock
//   skew (default 30s) absorbs issuer/verifier drift.
// - Issuer and audience are mandatory: a missing or mismatching claim fails
//   closed. Expected values are injected by the caller from configuration —
//   never hardcoded here.
// - sub is returned byte-exact. Clerk user ids (user_*) are preserved; they
//   are never coerced to UUIDs and never taken from client-supplied fields.
// - Pure function: no env reads, no network, no logging. Returns null for
//   every failure mode so callers emit sanitized errors.

export interface VerifyClerkJwtOptions {
  /** HS256 signing secret (the Supabase project JWT secret). Required. */
  jwtSecret: string;
  /** Exact expected `iss` claim value. Required and always enforced. */
  expectedIssuer: string;
  /**
   * Expected `aud` claim value. Required and always enforced. A single value
   * or a list of acceptable values.
   */
  expectedAudience: string | string[];
  /** Allowed clock skew in seconds (default 30). */
  clockSkewSec?: number;
  /** Injected clock for tests (epoch seconds). Defaults to Date.now() / 1000. */
  nowSec?: number;
}

export interface VerifiedClerkUser {
  /** Clerk user id, byte-exact (e.g. "user_2abc..."). Never coerced. */
  userId: string;
  /** Template `email` claim, when present as a non-empty string. */
  email?: string;
}

/** Strict base64url decode. Returns null on any invalid input. */
function base64UrlToBytes(input: string): Uint8Array<ArrayBuffer> | null {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64)) return null;
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  try {
    const raw = atob(b64 + pad);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export async function verifyClerkJwt(
  token: string,
  opts: VerifyClerkJwtOptions,
): Promise<VerifiedClerkUser | null> {
  try {
    if (typeof token !== "string" || token.length === 0) return null;

    // Configuration itself must be complete: fail closed rather than skip a
    // check when a value is missing.
    const { jwtSecret, expectedIssuer, expectedAudience } = opts;
    if (!jwtSecret || !expectedIssuer || !expectedAudience) return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const headerBytes = base64UrlToBytes(headerB64);
    const payloadBytes = base64UrlToBytes(payloadB64);
    const signatureBytes = base64UrlToBytes(signatureB64);
    if (!headerBytes || !payloadBytes || !signatureBytes) return null;

    let header: { alg?: unknown; typ?: unknown };
    try {
      header = JSON.parse(new TextDecoder().decode(headerBytes));
    } catch {
      return null;
    }

    // Algorithm pinning before any crypto work: prevents "none" and
    // algorithm-confusion attacks outright.
    if (header.alg !== "HS256") return null;
    if (header.typ !== undefined && header.typ !== "JWT") return null;

    // Signature verification against the configured secret. This is the
    // security boundary — without it nothing below may run.
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const signatureValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      new TextEncoder().encode(`${headerB64}.${payloadB64}`),
    );
    if (!signatureValid) return null;

    // Only now, with a verified signature, are claims trusted.
    let claims: Record<string, unknown>;
    try {
      claims = JSON.parse(new TextDecoder().decode(payloadBytes));
    } catch {
      return null;
    }

    const skew = opts.clockSkewSec ?? 30;
    const now = opts.nowSec ?? Math.floor(Date.now() / 1000);

    // exp is required.
    const exp = claims.exp;
    if (typeof exp !== "number" || !Number.isFinite(exp)) return null;
    if (exp <= now - skew) return null;

    const nbf = claims.nbf;
    if (nbf !== undefined) {
      if (typeof nbf !== "number" || !Number.isFinite(nbf)) return null;
      if (nbf - skew > now) return null;
    }

    const iat = claims.iat;
    if (iat !== undefined) {
      if (typeof iat !== "number" || !Number.isFinite(iat)) return null;
      if (iat - skew > now) return null; // issued implausibly far in the future
    }

    // sub is required and returned byte-exact.
    const sub = claims.sub;
    if (typeof sub !== "string" || sub.length === 0) return null;

    // role must match the authenticated role the Clerk "supabase" template
    // sets (same claim PostgREST/RLS rely on).
    if (claims.role !== "authenticated") return null;

    // Issuer: mandatory exact match.
    if (claims.iss !== expectedIssuer) return null;

    // Audience: mandatory. Token aud may be a string or an array of strings.
    const expected = Array.isArray(expectedAudience)
      ? expectedAudience
      : [expectedAudience];
    const tokenAudiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    const audienceOk = tokenAudiences.some(
      (a) => typeof a === "string" && expected.includes(a),
    );
    if (!audienceOk) return null;

    const email = typeof claims.email === "string" && claims.email.length > 0
      ? claims.email
      : undefined;
    return email === undefined ? { userId: sub } : { userId: sub, email };
  } catch {
    return null;
  }
}
