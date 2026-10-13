/**
 * Extract a user-facing message from an unknown caught value.
 *
 * supabase-js returns DB errors as plain objects ({ code, message, details, hint })
 * on its non-throwing path — `err instanceof Error` is false for them — so a naive
 * instanceof check masks the real Postgres/RLS message behind a generic fallback.
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err.trim()) return err;

  if (err && typeof err === 'object') {
    const maybe = err as { message?: unknown; code?: unknown; details?: unknown };
    if (typeof maybe.message === 'string' && maybe.message.trim()) {
      return typeof maybe.code === 'string' && maybe.code
        ? `${maybe.message} (${maybe.code})`
        : maybe.message;
    }
  }

  return fallback;
}
