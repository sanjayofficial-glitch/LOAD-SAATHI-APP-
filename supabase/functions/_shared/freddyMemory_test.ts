// Focused, network-free tests for Freddy server-side conversation memory
// (freddyMemory.ts). All fetch calls are injected; no Deno network/env
// permissions are needed.

import {
  fetchSessionHistory,
  persistSessionHistory,
  MAX_STORED_MESSAGES,
  type FreddyMemoryConfig,
} from "./freddyMemory.ts";

const CONFIG: FreddyMemoryConfig = {
  baseUrl: "https://test-project.supabase.co",
  anonKey: "test_anon_key_placeholder_not_real",
  userJwt: "test.jwt.token",
  userId: "user_2routerCopilotTest",
};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

function makeFetch(
  respond: () => Response,
  capture?: { request: CapturedRequest | null; callCount: number },
): typeof fetch {
  const state = capture ?? { request: null, callCount: 0 };
  const impl = async (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    state.callCount += 1;
    state.request = {
      url: String(input),
      method: init?.method ?? "GET",
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: typeof init?.body === "string" ? init.body : undefined,
    };
    return respond();
  };
  return impl as unknown as typeof fetch;
}

function okJsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

Deno.test("fetchSessionHistory returns [] for an empty result set", async () => {
  const capture = { request: null as CapturedRequest | null, callCount: 0 };
  const messages = await fetchSessionHistory(CONFIG, "cbaa9320-7a9e-4bfa-8b8a-5db3a9d3b111", {
    fetchImpl: makeFetch(() => okJsonResponse([]), capture),
  });
  assert(messages.length === 0, "empty rows must yield empty history");
  assert(capture.callCount === 1, "exactly one GET expected");
  assert(capture.request?.method === "GET", "must be a GET");
  const url = new URL(capture.request!.url);
  assert(url.pathname === "/rest/v1/freddy_sessions", "unexpected path");
  assert(
    url.searchParams.get("session_id") === "eq.cbaa9320-7a9e-4bfa-8b8a-5db3a9d3b111",
    "session filter mismatch",
  );
  assert(url.searchParams.get("limit") === "1", "limit must be 1");
});

Deno.test("fetchSessionHistory parses valid rows and filters malformed entries", async () => {
  const rows = [
    {
      messages: [
        { role: "user", content: "find trucks" },
        { role: "assistant", content: "Found 2 trucks." },
        { role: "system", content: "should be dropped" },
        { content: "no role" },
        "not-an-object",
      ],
    },
  ];
  const messages = await fetchSessionHistory(CONFIG, "cbaa9320-7a9e-4bfa-8b8a-5db3a9d3b111", {
    fetchImpl: makeFetch(() => okJsonResponse(rows)),
  });
  assert(messages.length === 2, "only valid user/assistant messages survive");
  assert(messages[0]!.role === "user" && messages[0]!.content === "find trucks", "first message mismatch");
  assert(messages[1]!.role === "assistant", "second message role mismatch");
});

Deno.test("fetchSessionHistory enforces the stored-message bound", async () => {
  const messages = Array.from({ length: 60 }, (_, i) => ({
    role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
    content: `m${i}`,
  }));
  const result = await fetchSessionHistory(CONFIG, "cbaa9320-7a9e-4bfa-8b8a-5db3a9d3b111", {
    fetchImpl: makeFetch(() => okJsonResponse([{ messages }])),
  });
  assert(result.length === MAX_STORED_MESSAGES, `bounded to ${MAX_STORED_MESSAGES}`);
  assert(result[result.length - 1]!.content === "m59", "must keep the newest messages");
});

Deno.test("fetchSessionHistory is inert on invalid configuration", async () => {
  const capture = { request: null as CapturedRequest | null, callCount: 0 };
  const bad = { ...CONFIG, baseUrl: "http://insecure.supabase.co" };
  const messages = await fetchSessionHistory(bad, "cbaa9320-7a9e-4bfa-8b8a-5db3a9d3b111", {
    fetchImpl: makeFetch(() => okJsonResponse([]), capture),
  });
  assert(messages.length === 0, "non-HTTPS base URL must fail closed");
  assert(capture.callCount === 0, "no request may be issued");
});

Deno.test("persistSessionHistory upserts with on_conflict and returns success", async () => {
  const capture = { request: null as CapturedRequest | null, callCount: 0 };
  const ok = await persistSessionHistory(
    CONFIG,
    "cbaa9320-7a9e-4bfa-8b8a-5db3a9d3b111",
    [
      { role: "user", content: "orders" },
      { role: "assistant", content: "Arranged." },
    ],
    { fetchImpl: makeFetch(() => okJsonResponse(null, 201), capture) },
  );
  assert(ok === true, "successful upsert must return true");
  // GET for existing history, then POST upsert.
  assert(capture.callCount === 2, "read-then-upsert expected");
  const post = capture.request!;
  assert(post.method === "POST", "upsert must be a POST");
  const url = new URL(post.url);
  assert(
    url.searchParams.get("on_conflict") === "user_id,session_id",
    "on_conflict must target the unique key",
  );
  const pref = post.headers["Prefer"] ?? "";
  assert(pref.includes("resolution=merge-duplicates"), "merge-duplicates expected");
  const body = JSON.parse(post.body ?? "{}") as Record<string, unknown>;
  assert(body.user_id === CONFIG.userId, "user_id must be the verified Clerk id");
  assert(body.session_id === "cbaa9320-7a9e-4bfa-8b8a-5db3a9d3b111", "session_id mismatch");
  assert(Array.isArray(body.messages) && (body.messages as unknown[]).length === 2, "messages payload expected");
});

Deno.test("persistSessionHistory returns false when the database call fails", async () => {
  const failing = (async () => {
    throw new TypeError("gossip about the internal network");
  }) as unknown as typeof fetch;
  const ok = await persistSessionHistory(
    CONFIG,
    "cbaa9320-7a9e-4bfa-8b8a-5db3a9d3b111",
    [{ role: "user", content: "hi" }],
    { fetchImpl: failing },
  );
  assert(ok === false, "network failure must surface as false");
});
