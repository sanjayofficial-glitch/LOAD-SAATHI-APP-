// Server-side TTS audio cache (Supabase Storage, private bucket).
//
// Popular Freddy replies are synthesized once and reused for every user —
// this cuts Fish Audio free-tier quota dramatically for repeat questions.
// The cache is best-effort: any storage failure degrades to a fresh
// synthesis, never to an error response.
//
// Storage layout: bucket "tts-cache", object `{sha256(text|lang)}.mp3`.
// Access uses the service-role key (server-side only; never exposed to the
// browser).

export interface TtsCacheDeps {
  /** Supabase REST base URL (env SUPABASE_URL). */
  baseUrl: string;
  /** Service-role key (env SUPABASE_SERVICE_ROLE_KEY). */
  serviceRoleKey: string;
  /** HTTP client (injected in tests). */
  fetchImpl?: typeof fetch;
}

const BUCKET = "tts-cache";

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function cacheObjectKey(text: string, lang: string): Promise<string> {
  return sha256Hex(`${lang}\u0000${text}`);
}

async function storageRequest(
  deps: TtsCacheDeps,
  path: string,
  init: RequestInit,
): Promise<Response> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  return fetchImpl(`${deps.baseUrl}/storage/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${deps.serviceRoleKey}`,
      apikey: deps.serviceRoleKey,
      ...(init.headers as Record<string, string> | undefined),
    },
  });
}

/** Returns cached MP3 bytes, or null on miss/any failure. */
export async function getCachedAudio(
  objectKey: string,
  deps: TtsCacheDeps,
): Promise<Uint8Array | null> {
  try {
    const res = await storageRequest(deps, `/object/${BUCKET}/${objectKey}.mp3`, {
      method: "GET",
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return buf.byteLength > 0 ? new Uint8Array(buf) : null;
  } catch {
    return null;
  }
}

/** Uploads MP3 bytes. Best-effort; returns false on failure. */
export async function putCachedAudio(
  objectKey: string,
  audio: Uint8Array,
  deps: TtsCacheDeps,
): Promise<boolean> {
  try {
    const res = await storageRequest(deps, `/object/${BUCKET}/${objectKey}.mp3`, {
      method: "POST",
      headers: {
        "Content-Type": "audio/mpeg",
        "x-upsert": "true",
      },
      body: audio.buffer as ArrayBuffer,
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Ensures the cache bucket exists. A 409 (already exists) is fine. */
export async function ensureCacheBucket(deps: TtsCacheDeps): Promise<void> {
  try {
    const res = await storageRequest(deps, `/bucket`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
    });
    // 200/201 created; 400/409 already exists → fine.
    if (res.status === 400 || res.status === 409) return;
    if (!res.ok) {
      // Unknown failure — ignore (cache stays best-effort).
      await res.arrayBuffer().catch(() => undefined);
    }
  } catch {
    // ignore
  }
}
