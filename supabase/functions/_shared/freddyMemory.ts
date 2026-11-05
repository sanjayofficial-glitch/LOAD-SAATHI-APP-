// Freddy conversation memory — server-side persistence for agent-router.
//
// Persists per-(Clerk user, client session UUID) chat context in
// public.freddy_sessions (see migrations/20261103000000_freddy_sessions.sql),
// accessed through the *caller's* verified JWT so RLS
// (user_id = auth.uid()::text) is the authority — never the service role.
//
// Security properties:
// - Same PostgREST hygiene as _shared/searchMarket.ts: caller-JWT bearer +
//   anon apikey, HTTPS-only base URL, header-injection guards, sanitized
//   failure reasons.
// - Message payloads are bounded here before touching the database.
// - Failure is best-effort: callers degrade gracefully (chat works without
//   memory rather than failing).
// - Only this table is written; no other data surface is touched.
// - Read and upsert are single-row operations keyed by the validated UUID
//   session id, so no client-controlled wildcards or bulk access exist.

export const MAX_STORED_MESSAGES = 40;
export const MEMORY_TIMEOUT_MS = 5_000;

export interface StoredChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface FreddyMemoryConfig {
  /** Supabase project origin, e.g. "https://xyz.supabase.co". */
  baseUrl: string;
  /** Public anon key — used as the apikey header. Never service-role. */
  anonKey: string;
  /** Caller JWT already verified by verifyClerkJwt. Used as bearer. */
  userJwt: string;
  /** Verified Clerk user id — must equal auth.uid()::text for RLS. */
  userId: string;
}

interface MemoryDeps {
  fetchImpl?: typeof fetch;
}

function buildMemoryHeaders(
  config: FreddyMemoryConfig,
): Record<string, string> | null {
  // no-control-regex is a false positive here: rejecting control characters
  // (header-injection guards) is the intentional purpose of this pattern.
  const safe = (value: string) =>
    value.length > 0 && !/[\s\u0000-\u001F\u007F]/.test(value); // eslint-disable-line no-control-regex
  if (!safe(config.anonKey) || !safe(config.userJwt)) return null;
  let base: URL;
  try {
    base = new URL(config.baseUrl);
  } catch {
    return null;
  }
  if (base.protocol !== "https:" || base.username || base.password) return null;
  if (base.pathname !== "/" && base.pathname !== "") return null;
  return {
    Authorization: `Bearer ${config.userJwt}`,
    apikey: config.anonKey,
    Accept: "application/json",
  };
}

function memoryBaseUrl(config: FreddyMemoryConfig): URL | null {
  try {
    return new URL(config.baseUrl);
  } catch {
    return null;
  }
}

function isStoredMessage(value: unknown): value is StoredChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    (record.role === "user" || record.role === "assistant") &&
    typeof record.content === "string"
  );
}

/** Load the stored message list for a session (bounded, best-effort). */
export async function fetchSessionHistory(
  config: FreddyMemoryConfig,
  sessionId: string,
  deps: MemoryDeps = {},
): Promise<StoredChatMessage[]> {
  const headers = buildMemoryHeaders(config);
  const base = memoryBaseUrl(config);
  if (!headers || !base) return [];
  const url = new URL("/rest/v1/freddy_sessions", base);
  url.searchParams.set("select", "messages");
  url.searchParams.set("session_id", `eq.${sessionId}`);
  url.searchParams.set("limit", "1");
  try {
    const res = await (deps.fetchImpl ?? fetch)(url.toString(), {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(MEMORY_TIMEOUT_MS),
    });
    if (!res.ok) return [];
    const rows: unknown = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return [];
    const messages = (rows[0] as Record<string, unknown>)?.messages;
    if (!Array.isArray(messages)) return [];
    return messages.filter(isStoredMessage).slice(-MAX_STORED_MESSAGES);
  } catch {
    return [];
  }
}

/**
 * Append messages to a session via an atomic upsert on
 * (user_id, session_id). Returns true on success; false on any failure
 * (caller treats memory as best-effort).
 */
export async function persistSessionHistory(
  config: FreddyMemoryConfig,
  sessionId: string,
  messages: StoredChatMessage[],
  deps: MemoryDeps = {},
): Promise<boolean> {
  if (messages.length === 0) return true;
  const headers = buildMemoryHeaders(config);
  const base = memoryBaseUrl(config);
  if (!headers || !base) return false;
  try {
    const existing = await fetchSessionHistory(config, sessionId, deps);
    const merged = [...existing, ...messages].slice(-MAX_STORED_MESSAGES);
    const url = new URL("/rest/v1/freddy_sessions", base);
    url.searchParams.set("on_conflict", "user_id,session_id");
    const res = await (deps.fetchImpl ?? fetch)(url.toString(), {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates, return=minimal",
      },
      body: JSON.stringify({
        user_id: config.userId,
        session_id: sessionId,
        messages: merged,
      }),
      signal: AbortSignal.timeout(MEMORY_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}
