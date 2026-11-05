// Freddy voice: Fish Audio TTS (free tier) with browser speech fallback.
//
// Primary path: POST to the Supabase edge function /functions/v1/tts, which
// synthesizes with the free model (s2.1-pro-free) server-side — the Fish API
// key never appears in the browser bundle. The edge function also caches
// identical (text, lang) pairs in Supabase Storage, so repeat replies reuse
// cached audio and never consume Fish quota again.
//
// Fallback path: when the user is unauthenticated, the endpoint is
// unavailable, or the free quota is exhausted, we gracefully degrade to the
// browser's built-in speechSynthesis (matching language when possible) so
// Freddy's voice never silently breaks.
//
// Quota guardrails:
//   - Per-text result cache (bounded) avoids re-synthesizing identical lines.
//   - Starting a new utterance cancels the previous one (no overlap).
//   - On 429 (quota exhausted) we stop calling the paid endpoint for this
//     page session and switch to the browser voice.

const TTS_FUNCTION = "/functions/v1/tts";
const AUDIO_CACHE_MAX = 12;
const UPSTREAM_TIMEOUT_MS = 30_000;

type Lang = "en" | "hi";

const audioCache = new Map<string, Blob>();
let currentAudio: HTMLAudioElement | null = null;
let quotaExhausted = false;
let activeStatus: ((status: "start" | "end") => void) | null = null;

/** Loose Devanagari + Romanized-Hindi markers for reply-language detection. */
const HINGLISH_MARKERS = [
  "hai", "hoon", "hain", "kya", "nahi", "nahin", "mujhe", "chahiye",
  "liye", "karein", "karo", "bahut", "theek", "thik", "batao",
  "bataiye", "sakta", "sakti", "kaise", "kyon", "kahan", "kab",
  "raha", "rahi", "bhai", "dost", "kaam", "baat", "ghar", "aap",
  "aapka", "aapki", "hum", "hamko", "sawaal", "jawab",
];

export function detectLanguage(text: string): Lang {
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  const words = new Set(text.toLowerCase().split(/[^\p{L}\p{N}]+/u));
  for (const marker of HINGLISH_MARKERS) {
    if (words.has(marker)) return "hi";
  }
  return "en";
}

function browserSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Last-resort voice: native browser speech (best language match possible). */
function fallbackToBrowserSpeech(text: string, lang: Lang): void {
  if (!browserSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1.05;
    if (lang === "hi") utterance.lang = "hi-IN";
    utterance.onend = () => activeStatus?.("end");
    window.speechSynthesis.speak(utterance);
  } catch {
    activeStatus?.("end");
  }
}

/** Cancel any in-flight Fish Audio playback and browser speech. */
export function cancelVoice(): void {
  try {
    currentAudio?.pause();
  } catch {
    // ignore
  }
  currentAudio = null;
  if (browserSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  const status = activeStatus;
  activeStatus = null;
  status?.("end");
}

export interface SpeakOptions {
  lang?: Lang;
  /** Called once when playback starts and once when it ends/cancels. */
  onStatus?: (status: "start" | "end") => void;
}

/**
 * Speak a line of assistant text. Returns true when Fish Audio playback
 * started; false when it fell back to browser speech (or nothing played).
 */
export async function speakAssistantText(
  text: string,
  getToken: () => Promise<string | null>,
  opts: SpeakOptions = {},
): Promise<boolean> {
  const clean = text.trim();
  if (!clean) return false;

  const lang = opts.lang ?? detectLanguage(clean);
  const onStatus = opts.onStatus ?? null;

  // Replace any previous utterance first.
  cancelVoice();
  activeStatus = onStatus;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!supabaseUrl || quotaExhausted) {
    fallbackToBrowserSpeech(clean, lang);
    return false;
  }

  // Per-text cache (keyed with language so hi/en variants stay separate).
  const cacheKey = `${lang}\u0000${clean}`;
  const cached = audioCache.get(cacheKey);
  if (cached) {
    playBlob(cached, onStatus);
    return true;
  }

  let token: string | null = null;
  try {
    token = await getToken();
  } catch {
    token = null;
  }
  if (!token) {
    fallbackToBrowserSpeech(clean, lang);
    return false;
  }

  let res: Response;
  try {
    res = await fetch(`${supabaseUrl}${TTS_FUNCTION}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: clean, lang }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    fallbackToBrowserSpeech(clean, lang);
    return false;
  }

  if (!res.ok) {
    if (res.status === 429) {
      // Free-tier quota exhausted — stop calling the endpoint this session.
      quotaExhausted = true;
    }
    fallbackToBrowserSpeech(clean, lang);
    return false;
  }

  const blob = await res.blob().catch(() => null);
  if (!blob || blob.size === 0) {
    fallbackToBrowserSpeech(clean, lang);
    return false;
  }

  audioCache.set(cacheKey, blob);
  if (audioCache.size > AUDIO_CACHE_MAX) {
    const oldest = audioCache.keys().next().value;
    if (oldest !== undefined) audioCache.delete(oldest);
  }
  playBlob(blob, onStatus);
  return true;
}

function playBlob(
  blob: Blob,
  onStatus: ((status: "start" | "end") => void) | null,
): void {
  if (typeof window === "undefined") return;
  try {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    onStatus?.("start");
    audio.play().catch(() => {
      URL.revokeObjectURL(url);
      currentAudio = null;
      onStatus?.("end");
    });
    audio.addEventListener("ended", () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      onStatus?.("end");
    });
  } catch {
    onStatus?.("end");
  }
}
