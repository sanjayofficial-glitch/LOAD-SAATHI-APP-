// Network-free tests for the Disha provider chain.
//
// Every fetch, env lookup and timeout is injected: no Deno network permission,
// no real provider key, no ports. The point of these tests is the fail-closed
// contract — closed failure reasons, hard prompt/output bounds, and the fact
// that a provider's response BODY can never leak into a failure result.

import {
  LLM_MAX_OUTPUT_CHARS,
  LLM_MAX_PROMPT_CHARS,
  boundPrompt,
  llmChat,
} from "./llmChat.ts";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function geminiReply(text: string): Response {
  return jsonResponse({ candidates: [{ content: { parts: [{ text }] } }] });
}

function openAiReply(text: string): Response {
  return jsonResponse({ choices: [{ message: { content: text } }] });
}

interface RecordedCall {
  url: string;
  body: string;
}

function stubFetch(
  route: (call: RecordedCall, index: number) => Response,
): { fetchImpl: typeof fetch; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const fetchImpl = (async (input: unknown, init?: RequestInit) => {
    const call = {
      url: String(input),
      body: typeof init?.body === "string" ? init.body : "",
    };
    calls.push(call);
    return route(call, calls.length - 1);
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

function envOf(values: Record<string, string>): (name: string) => string | undefined {
  return (name) => values[name];
}

function providerHost(url: string): string {
  if (url.includes("generativelanguage.googleapis.com")) return "gemini";
  if (url.includes("api.groq.com")) return "groq";
  if (url.includes("openrouter.ai")) return "openrouter";
  return "unknown";
}

const GEMINI_ENV = { GEMINI_API_KEY: "test-gemini-key-not-real" };
const GROQ_ENV = { GROQ_API_KEY: "test-groq-key-not-real" };
const OPENROUTER_ENV = { OPENROUTER_API_KEY: "test-openrouter-key-not-real" };

// ---------------------------------------------------------------------------
// Chain order and fallback
// ---------------------------------------------------------------------------

Deno.test("Gemini answers first and the chain stops there", async () => {
  const { fetchImpl, calls } = stubFetch(() => geminiReply('{"origin":"Pune"}'));
  const result = await llmChat("find trucks", {
    env: envOf({ ...GEMINI_ENV, ...GROQ_ENV, ...OPENROUTER_ENV }),
    fetchImpl,
  });
  assert(result.ok, "expected a successful completion");
  const provider = result.ok ? result.provider : "(failed)";
  assert(result.ok && provider === "Gemini", `unexpected provider ${provider}`);
  assert(result.ok && result.text === '{"origin":"Pune"}', "text must round-trip");
  assert(calls.length === 1, `chain must stop after the first success, got ${calls.length}`);
  assert(providerHost(calls[0].url) === "gemini", "first call must be Gemini");
});

Deno.test("a 429 falls through to Groq, in the documented order", async () => {
  const { fetchImpl, calls } = stubFetch((_call, index) =>
    index === 0 ? jsonResponse({}, 429) : openAiReply('{"destination":"Surat"}')
  );
  const result = await llmChat("q", {
    env: envOf({ ...GEMINI_ENV, ...GROQ_ENV }),
    fetchImpl,
  });
  assert(result.ok, "expected Groq to answer");
  const provider = result.ok ? result.provider : "(failed)";
  assert(result.ok && provider === "Groq", `unexpected provider ${provider}`);
  assert(calls.length === 2, `expected 2 calls, got ${calls.length}`);
  assert(providerHost(calls[0].url) === "gemini", "Gemini must be tried first");
  assert(providerHost(calls[1].url) === "groq", "Groq must be tried second");
});

Deno.test("a Gemini 5xx with Groq unconfigured lands on OpenRouter", async () => {
  const { fetchImpl, calls } = stubFetch((_call, index) =>
    index === 0 ? jsonResponse({}, 503) : openAiReply("answer")
  );
  const result = await llmChat("q", {
    env: envOf({ ...GEMINI_ENV, ...OPENROUTER_ENV }),
    fetchImpl,
  });
  assert(result.ok && result.provider === "OpenRouter", "OpenRouter must answer");
  assert(calls.length === 2, `Gemini + 1 successful OpenRouter model expected, got ${calls.length}`);
  assert(providerHost(calls[1].url) === "openrouter", "second call must be OpenRouter");
  assert(
    JSON.parse(calls[1].body).model === "nvidia/nemotron-3-super-120b-a12b:free",
    "first free model must be attempted first",
  );
});

Deno.test("OpenRouter retries its second model when the first fails", async () => {
  const { fetchImpl, calls } = stubFetch((_call, index) =>
    index === 0 ? jsonResponse({}, 400) : openAiReply("second model wins")
  );
  const result = await llmChat("q", { env: envOf(OPENROUTER_ENV), fetchImpl });
  assert(result.ok && result.provider === "OpenRouter", "second model must be tried");
  assert(calls.length === 2, `expected 2 OpenRouter calls, got ${calls.length}`);
});

// ---------------------------------------------------------------------------
// Closed failure reasons
// ---------------------------------------------------------------------------

Deno.test("no provider key is configured => not_configured, and no network call", async () => {
  const { fetchImpl, calls } = stubFetch(() => geminiReply("should never happen"));
  const result = await llmChat("q", { env: envOf({}), fetchImpl });
  assert(!result.ok, "expected failure");
  assert(!result.ok && result.reason === "not_configured", `got ${!result.ok && result.reason}`);
  assert(calls.length === 0, "no key must mean no outbound request");
});

Deno.test("every configured provider rate limited => rate_limited", async () => {
  const { fetchImpl, calls } = stubFetch(() => jsonResponse({}, 429));
  const result = await llmChat("q", {
    env: envOf({ ...GEMINI_ENV, ...GROQ_ENV, ...OPENROUTER_ENV }),
    fetchImpl,
  });
  assert(!result.ok && result.reason === "rate_limited", `got ${!result.ok && result.reason}`);
  assert(calls.length === 4, `3 providers (OpenRouter has 2 models) expected, got ${calls.length}`);
});

Deno.test("a provider error is reported as provider_error with no body leak", async () => {
  const { fetchImpl } = stubFetch(() => ({
    ok: true,
    status: 200,
    json: async () => {
      throw new Error("poisoned upstream body: sk-live-secret");
    },
  }) as unknown as Response);
  const result = await llmChat("q", { env: envOf(GEMINI_ENV), fetchImpl });
  assert(!result.ok && result.reason === "provider_error", `got ${!result.ok && result.reason}`);
  assert(
    !JSON.stringify(result).includes("poisoned"),
    "a failure result must never carry a provider body",
  );
});

Deno.test("a non-2xx body is never read", async () => {
  const { fetchImpl } = stubFetch(() => ({
    ok: false,
    status: 500,
    json: async () => {
      throw new Error("must not be read on a failure status");
    },
  }) as unknown as Response);
  const result = await llmChat("q", { env: envOf(GEMINI_ENV), fetchImpl });
  assert(!result.ok && result.reason === "provider_error", "5xx must be a provider error");
});

// ---------------------------------------------------------------------------
// Bounds and never-throw
// ---------------------------------------------------------------------------

Deno.test("the prompt is hard-bounded before it leaves the process", async () => {
  const { fetchImpl, calls } = stubFetch(() => geminiReply("ok"));
  const huge = "x".repeat(LLM_MAX_PROMPT_CHARS * 3);
  const result = await llmChat(huge, { env: envOf(GEMINI_ENV), fetchImpl });
  assert(result.ok, "expected success");
  const sent = JSON.parse(calls[0].body).contents[0].parts[0].text as string;
  assert(sent.length <= LLM_MAX_PROMPT_CHARS + 20, `prompt not bounded: ${sent.length}`);
  assert(sent.includes("[truncated]"), "truncation must be visible in the prompt");
});

Deno.test("the model output is hard-bounded", async () => {
  const { fetchImpl } = stubFetch(() => geminiReply("y".repeat(50_000)));
  const result = await llmChat("q", { env: envOf(GEMINI_ENV), fetchImpl });
  assert(result.ok, "expected success");
  assert(
    result.ok && result.text.length <= LLM_MAX_OUTPUT_CHARS,
    `output not bounded: ${result.ok && result.text.length}`,
  );
});

Deno.test("network errors and aborts never throw and collapse to provider_error", async () => {
  const throwing = (async () => {
    throw new TypeError("socket hang up");
  }) as unknown as typeof fetch;
  const networkFailure = await llmChat("q", { env: envOf(GEMINI_ENV), fetchImpl: throwing });
  assert(
    !networkFailure.ok && networkFailure.reason === "provider_error",
    "network failure must be a closed reason",
  );

  const aborting = (async () => {
    throw new DOMException("The operation was aborted.", "AbortError");
  }) as unknown as typeof fetch;
  const timeout = await llmChat("q", { env: envOf(GEMINI_ENV), fetchImpl: aborting });
  assert(!timeout.ok && timeout.reason === "provider_error", "timeout must be a closed reason");
});

Deno.test("boundPrompt trims CRLF and caps length", () => {
  const short = boundPrompt("a\r\nb");
  assert(short === "a\nb", `CRLF must normalise, got ${JSON.stringify(short)}`);
  const long = boundPrompt("z".repeat(LLM_MAX_PROMPT_CHARS + 10));
  assert(long.length <= LLM_MAX_PROMPT_CHARS + 20, "long prompts must be capped");
});
