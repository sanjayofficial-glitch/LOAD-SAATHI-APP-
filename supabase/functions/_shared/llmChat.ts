// Disha provider chain — ONE bounded, injectable LLM client for the
// agent-router's Disha workflow.
//
// Scope (deliberately narrow): this module asks a model for text and hands the
// text back. It does NOT parse tool arguments (that is _shared/dishaWorkflow.ts),
// does NOT touch the database, and does NOT return an HTTP response body,
// status text, header, or key — failures are the closed union below and
// nothing else.
//
// Fallback order and endpoint details are mirrored from
// gemini-proxy/index.ts (Gemini -> Groq -> OpenRouter, every key optional,
// 429 = rate limited, any other failure = try the next provider) so both
// functions behave the same. gemini-proxy keeps its own copy and is
// intentionally NOT modified by this milestone; if the two ever drift, that
// is a review item, not a silent behavior change.
//
// Fail-closed properties:
// - Every provider key is OPTIONAL. None configured => "not_configured", so
//   the caller falls back to its deterministic path. Nothing is invented.
// - The prompt and the model output are hard-bounded on both sides.
// - Every attempt carries its own timeout (AbortSignal).
// - No Deno.env read outside the injected env lookup, so tests stay
//   network-free and env-free.

export const LLM_TIMEOUT_MS = 12_000;
export const LLM_MAX_PROMPT_CHARS = 4_000;
export const LLM_MAX_OUTPUT_CHARS = 2_000;
/** Output bound for both Disha calls (a short filter object / one paragraph). */
export const LLM_MAX_TOKENS = 400;

/** Closed failure vocabulary — never a body, status text, or stack trace. */
export type LlmFailureReason = "not_configured" | "rate_limited" | "provider_error";

export type LlmChatResult =
  | { ok: true; text: string; provider: string }
  | { ok: false; reason: LlmFailureReason };

export interface LlmChatOptions {
  /** Injectable env lookup (tests). Defaults to Deno.env.get. */
  env?: (name: string) => string | undefined;
  /** Injectable fetch (tests). Defaults to the global fetch. */
  fetchImpl?: typeof fetch;
  /** Per-attempt timeout. Defaults to LLM_TIMEOUT_MS. */
  timeoutMs?: number;
  /** Hard cap on returned text. Defaults to LLM_MAX_OUTPUT_CHARS. */
  maxOutputChars?: number;
}

type ProviderOutcome =
  | { kind: "text"; text: string }
  | { kind: "rate_limited" }
  | { kind: "error" }
  | { kind: "not_configured" };

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3.5-lightning:free",
];
const OPENROUTER_REFERER = "https://loadsaathi.in";

/** Hard prompt bound — the caller's text is already bounded upstream too. */
export function boundPrompt(prompt: string): string {
  const text = prompt.replace(/\r\n/g, "\n");
  if (text.length <= LLM_MAX_PROMPT_CHARS) return text;
  return `${text.slice(0, LLM_MAX_PROMPT_CHARS)}\n[truncated]`;
}

function truncate(text: string, maxChars: number): string {
  return text.length <= maxChars ? text : text.slice(0, maxChars);
}

/** Path walk over an untyped JSON body; returns undefined instead of throwing. */
function readPath(root: unknown, ...path: Array<string | number>): unknown {
  let current: unknown = root;
  for (const key of path) {
    if (current === null || typeof current !== "object") return undefined;
    // Array indices are addressed by their string form, which works for both
    // JSON objects and JSON arrays.
    current = (current as Record<string, unknown>)[String(key)];
  }
  return current;
}

type HttpJson =
  | { ok: true; json: unknown }
  | { ok: false; rateLimited: boolean };

/**
 * One HTTP attempt. Reads the body ONLY on 2xx: failure paths never touch a
 * response body, so a poisoned or oversized upstream error cannot leak here.
 */
async function requestJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<HttpJson> {
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.status === 429) return { ok: false, rateLimited: true };
    if (!response.ok) return { ok: false, rateLimited: false };
    const json: unknown = await response.json();
    return { ok: true, json };
  } catch {
    return { ok: false, rateLimited: false };
  }
}

function asText(value: unknown, maxChars: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  return truncate(trimmed, maxChars);
}

async function geminiAttempt(
  prompt: string,
  env: (name: string) => string | undefined,
  fetchImpl: typeof fetch,
  timeoutMs: number,
  maxChars: number,
): Promise<ProviderOutcome> {
  const apiKey = (env("GEMINI_API_KEY") ?? "").trim();
  if (!apiKey) return { kind: "not_configured" };
  const result = await requestJson(
    GEMINI_URL,
    { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    { contents: [{ parts: [{ text: prompt }] }] },
    fetchImpl,
    timeoutMs,
  );
  if (!result.ok) return result.rateLimited ? { kind: "rate_limited" } : { kind: "error" };
  const text = asText(
    readPath(result.json, "candidates", 0, "content", "parts", 0, "text"),
    maxChars,
  );
  return text ? { kind: "text", text } : { kind: "error" };
}

async function openAiStyleAttempt(
  url: string,
  apiKey: string,
  extraHeaders: Record<string, string>,
  model: string,
  prompt: string,
  fetchImpl: typeof fetch,
  timeoutMs: number,
  maxChars: number,
): Promise<ProviderOutcome> {
  const result = await requestJson(
    url,
    {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    {
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: LLM_MAX_TOKENS,
    },
    fetchImpl,
    timeoutMs,
  );
  if (!result.ok) return result.rateLimited ? { kind: "rate_limited" } : { kind: "error" };
  const text = asText(readPath(result.json, "choices", 0, "message", "content"), maxChars);
  return text ? { kind: "text", text } : { kind: "error" };
}

async function groqAttempt(
  prompt: string,
  env: (name: string) => string | undefined,
  fetchImpl: typeof fetch,
  timeoutMs: number,
  maxChars: number,
): Promise<ProviderOutcome> {
  const apiKey = (env("GROQ_API_KEY") ?? "").trim();
  if (!apiKey) return { kind: "not_configured" };
  return await openAiStyleAttempt(
    GROQ_URL,
    apiKey,
    {},
    "openai/gpt-oss-120b",
    prompt,
    fetchImpl,
    timeoutMs,
    maxChars,
  );
}

async function openRouterAttempt(
  prompt: string,
  env: (name: string) => string | undefined,
  fetchImpl: typeof fetch,
  timeoutMs: number,
  maxChars: number,
): Promise<ProviderOutcome> {
  const apiKey = (env("OPENROUTER_API_KEY") ?? "").trim();
  if (!apiKey) return { kind: "not_configured" };

  let sawRateLimit = false;
  for (const model of OPENROUTER_MODELS) {
    const outcome = await openAiStyleAttempt(
      OPENROUTER_URL,
      apiKey,
      { "HTTP-Referer": OPENROUTER_REFERER },
      model,
      prompt,
      fetchImpl,
      timeoutMs,
      maxChars,
    );
    if (outcome.kind === "text") return outcome;
    if (outcome.kind === "rate_limited") sawRateLimit = true;
    // Any other failure: try the next free model, mirroring gemini-proxy.
  }
  return sawRateLimit ? { kind: "rate_limited" } : { kind: "error" };
}

function classify(attempts: ProviderOutcome[]): LlmFailureReason {
  const configured = attempts.filter((attempt) => attempt.kind !== "not_configured");
  if (configured.length === 0) return "not_configured";
  if (configured.every((attempt) => attempt.kind === "rate_limited")) {
    return "rate_limited";
  }
  return "provider_error";
}

/**
 * Run the provider chain for ONE bounded call. Never throws: every failure
 * collapses to { ok: false, reason } so the caller can take its
 * deterministic path instead of inventing an answer.
 */
export async function llmChat(
  prompt: string,
  options: LlmChatOptions = {},
): Promise<LlmChatResult> {
  const env = options.env ?? ((name: string) => Deno.env.get(name));
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? LLM_TIMEOUT_MS;
  const maxChars = options.maxOutputChars ?? LLM_MAX_OUTPUT_CHARS;
  const bounded = boundPrompt(prompt);

  const attempts: ProviderOutcome[] = [];
  const providers: Array<{ name: string; run: () => Promise<ProviderOutcome> }> = [
    { name: "Gemini", run: () => geminiAttempt(bounded, env, fetchImpl, timeoutMs, maxChars) },
    { name: "Groq", run: () => groqAttempt(bounded, env, fetchImpl, timeoutMs, maxChars) },
    { name: "OpenRouter", run: () => openRouterAttempt(bounded, env, fetchImpl, timeoutMs, maxChars) },
  ];

  for (const provider of providers) {
    const outcome = await provider.run();
    if (outcome.kind === "text") {
      return { ok: true, text: outcome.text, provider: provider.name };
    }
    attempts.push(outcome);
  }

  return { ok: false, reason: classify(attempts) };
}
