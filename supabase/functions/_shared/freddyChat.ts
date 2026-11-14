// Freddy chat generation — the "brain" for open-ended conversation.
//
// Uses the free Google Gemini tier (GEMINI_API_KEY) to answer questions about
// LoadSaathi using the knowledge pack. This is a pure read-only call: the
// output is plain text shown as Freddy's reply. No tools, no data writes.
//
// Degradation contract: when no key is configured, or the provider is
// rate-limited/unavailable, this module returns { ok: false } and the caller
// (agent-router) falls through to the local knowledge base.

import { KNOWLEDGE_PACK, KNOWLEDGE_VERSION } from "./freddyKnowledge.ts";

const CHAT_TIMEOUT_MS = 6_000;
const CHAT_MODEL = "gemini-flash-lite-latest";

export interface ChatAnswerDeps {
  fetchImpl?: typeof fetch;
  env?: (name: string) => string | undefined;
}

export interface ChatAnswerOptions {
  message: string;
  /** Recent conversation, oldest first, for continuity. */
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  /** Current page pathname, e.g. "/shipper/post-shipment". */
  pathname?: string;
  lang?: "en" | "hi";
}

export type ChatAnswerResult =
  | { ok: true; answer: string; provider: string }
  | { ok: false; reason?: "no-key" | "rate-limited" | "unavailable" };

function buildChatPrompt(opts: ChatAnswerOptions): string {
  const history = (opts.history ?? []).slice(-6);
  const historyBlock =
    history.length === 0
      ? "(no prior conversation)"
      : history
          .map((m) => `${m.role === "user" ? "User" : "Freddy"}: ${m.content}`)
          .join("\n");

  const pageNote = opts.pathname
    ? `\nThe user is currently on page: ${opts.pathname}. Use this to give precise navigation guidance.`
    : "";

  return `${KNOWLEDGE_PACK}

Knowledge pack version: ${KNOWLEDGE_VERSION}.

Recent conversation:
${historyBlock}
${pageNote}

User: ${opts.message}

Freddy:`;
}

export async function freddyChatAnswer(
  opts: ChatAnswerOptions,
  deps: ChatAnswerDeps = {},
): Promise<ChatAnswerResult> {
  const env = deps.env ?? ((name: string) => Deno.env.get(name) ?? undefined);
  const apiKey = env("GEMINI_API_KEY");
  if (!apiKey) return { ok: false, reason: "no-key" };

  const fetchImpl = deps.fetchImpl ?? fetch;
  try {
    const res = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildChatPrompt(opts) }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 500,
            topP: 0.95,
          },
        }),
        signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
      },
    );
    if (res.status === 429) return { ok: false, reason: "rate-limited" };
    if (!res.ok) return { ok: false, reason: "unavailable" };

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const answer = typeof text === "string" ? text.trim() : "";
    if (!answer) return { ok: false, reason: "unavailable" };

    return { ok: true, answer, provider: "gemini" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

/**
 * Deterministic "how do I…" → flow hint. Cheap and safe: it only maps a few
 * well-known verbs to guide flows that exist in the app's Disha engine.
 */
export function suggestGuideFlow(
  message: string,
  pathname?: string,
): { flowId: string } | null {
  const q = message.toLowerCase();
  const onPage = (p: string) => pathname?.startsWith(p) ?? false;

  if (q.includes("post") && (q.includes("load") || q.includes("shipment") || q.includes("goods"))) {
    // If they're already on the post-shipment page, there is nothing to guide.
    if (!onPage("/shipper/post-shipment")) return { flowId: "post-load" };
  }
  if (q.includes("post") && (q.includes("trip") || q.includes("truck"))) {
    if (!onPage("/trucker/post-trip")) return { flowId: "post-trip" };
  }
  if (q.includes("register") || q.includes("sign up") || q.includes("signup")) {
    if (!onPage("/register")) return { flowId: "signup" };
  }
  if (q.includes("log in") || q.includes("login") || q.includes("sign in")) {
    if (!onPage("/login")) return { flowId: "login" };
  }
  if ((q.includes("browse") || q.includes("find")) && q.includes("truck")) {
    if (!onPage("/shipper/browse-trips")) return { flowId: "browse-trips" };
  }
  if ((q.includes("browse") || q.includes("find")) && (q.includes("load") || q.includes("shipment"))) {
    if (!onPage("/trucker/browse-shipments")) return { flowId: "browse-shipments" };
  }
  return null;
}
