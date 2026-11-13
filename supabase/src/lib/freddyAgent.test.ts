import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import {
  askFreddyAgent,
  getOrCreateSessionId,
  type AgentChatMessage,
} from './freddyAgent';

const SUPABASE_URL = 'https://test.supabase.co';
const TOKEN = 'test-clerk-jwt';

function installEnv() {
  vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_URL);
  // Ensure import.meta.env carries the value even if the transform for it
  // differs between environments.
  (import.meta.env as Record<string, unknown>).VITE_SUPABASE_URL = SUPABASE_URL;
}

describe('getOrCreateSessionId', () => {
  it('creates a UUID v4 and persists it in localStorage', () => {
    localStorage.removeItem('freddy-session-id');
    const id = getOrCreateSessionId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(localStorage.getItem('freddy-session-id')).toBe(id);
  });

  it('reuses an existing valid session id', () => {
    localStorage.setItem('freddy-session-id', '12345678-1234-4123-8234-123456789abc');
    expect(getOrCreateSessionId()).toBe('12345678-1234-4123-8234-123456789abc');
  });

  it('replaces an invalid stored value', () => {
    localStorage.setItem('freddy-session-id', 'not-a-uuid');
    const id = getOrCreateSessionId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });
});

describe('askFreddyAgent', () => {
  beforeEach(() => {
    installEnv();
    vi.restoreAllMocks();
    localStorage.removeItem('freddy-session-id');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('POSTs to agent-router with the caller JWT and bounded history', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ ok: true, tool: 'search_market', count: 1, loads: [] }),
        { status: 200 }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const history: AgentChatMessage[] = Array.from({ length: 12 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `message ${i}`,
    }));

    const data = await askFreddyAgent({
      message: 'find trucks from Rourkela to Ranchi',
      sessionId: '12345678-1234-4123-8234-123456789abc',
      history,
      getToken: async () => TOKEN,
      lang: 'hi',
    });

    expect(data.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    if (!firstCall) return;
    const [url, init] = firstCall;
    expect(String(url)).toBe(`${SUPABASE_URL}/functions/v1/agent-router`);
    expect(init?.method).toBe('POST');
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      `Bearer ${TOKEN}`
    );

    const body = JSON.parse(init?.body as string);
    expect(body.message).toBe('find trucks from Rourkela to Ranchi');
    expect(body.sessionId).toBe('12345678-1234-4123-8234-123456789abc');
    expect(body.lang).toBe('hi');
    // Bounded to the most recent 6 messages.
    expect(body.history).toHaveLength(6);
    expect(body.history[0].content).toBe('message 6');
  });

  it('requires a token', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      askFreddyAgent({
        message: 'hi',
        sessionId: '12345678-1234-4123-8234-123456789abc',
        getToken: async () => null,
      })
    ).rejects.toThrow('Authentication required');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws on non-ok responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Rate limit exceeded' }), {
          status: 429,
        })
      )
    );

    await expect(
      askFreddyAgent({
        message: 'hi',
        sessionId: '12345678-1234-4123-8234-123456789abc',
        getToken: async () => TOKEN,
      })
    ).rejects.toThrow('Rate limit exceeded');
  });

  it('caches identical search queries within the session', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ ok: true, tool: 'search_market', count: 2, loads: [] }),
        { status: 200 }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const opts = {
      message: 'find trucks from Cuttack to Bhubaneswar',
      sessionId: '12345678-1234-4123-8234-123456789abc',
      getToken: async () => TOKEN,
    };

    const first = await askFreddyAgent(opts);
    const second = await askFreddyAgent(opts);

    expect(first.ok).toBe(true);
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('passes through disabled/enabled=false state for the kill switch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, enabled: false, phase: 1 }), {
          status: 200,
        })
      )
    );

    const data = await askFreddyAgent({
      message: 'hello',
      sessionId: '12345678-1234-4123-8234-123456789abc',
      getToken: async () => TOKEN,
    });

    expect(data.enabled).toBe(false);
    expect(data.tool).toBeUndefined();
  });
});
