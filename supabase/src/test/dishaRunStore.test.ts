import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  IDLE_DISHA_RUN,
  beginDishaRun,
  completeDishaRun,
  getDishaRunSnapshot,
  resetDishaRun,
  subscribeDishaRun,
} from '@/lib/dishaRunStore';
import type { DishaBlock, DishaViewState } from '@/lib/dishaRequest';
import { useDishaCoordinator } from '@/hooks/useDishaCoordinator';

/**
 * The store is module-scoped on purpose (in-memory, same-tab only), so every
 * test must start from a clean idle state — the state leaks across tests
 * exactly as it leaks across components within one tab.
 */
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user_test' },
    getSupabaseToken: async () => 'test-jwt',
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBlock(overrides: Partial<DishaBlock> = {}): DishaBlock {
  return {
    status: 'completed',
    intent: 'route_search',
    missing: [],
    rows: [
      {
        origin: 'Patna',
        destination: 'Ranchi',
        departure_date: '2026-11-01',
        capacity_tonnes: 10,
        price_per_tonne: 1400,
      },
    ],
    explanation: 'The marketplace returned rows on the Patna to Ranchi route.',
    explanationSource: 'deterministic',
    provider: 'none',
    checkedAt: '2026-10-25T10:00:00.000Z',
    trace: [
      { step: 'shipment_analyst', status: 'completed', summary: 'Extracted 1 filter.', durationMs: 12 },
      { step: 'matching_specialist', status: 'completed', summary: 'Returned 1 row(s).', durationMs: 34 },
      { step: 'disha_coordinator', status: 'completed', summary: 'Explained 1 row(s).', durationMs: 56 },
    ],
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

beforeEach(() => {
  resetDishaRun();
});

afterEach(() => {
  resetDishaRun();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Store state machine (no React involved)
// ---------------------------------------------------------------------------

describe('dishaRunStore — state machine', () => {
  it('starts idle; reset() while idle never notifies subscribers', () => {
    expect(getDishaRunSnapshot()).toBe(IDLE_DISHA_RUN);

    const listener = vi.fn();
    const unsubscribe = subscribeDishaRun(listener);
    resetDishaRun();

    expect(listener).not.toHaveBeenCalled();
    expect(getDishaRunSnapshot()).toBe(IDLE_DISHA_RUN);
    unsubscribe();
  });

  it('begin() records a real start and is idempotent while a run is in flight', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeDishaRun(listener);

    beginDishaRun(1_000);
    expect(getDishaRunSnapshot()).toEqual({
      phase: 'running',
      startedAt: 1_000,
      finishedAt: null,
      block: null,
      message: null,
    });
    expect(listener).toHaveBeenCalledTimes(1);

    const inFlight = getDishaRunSnapshot();
    beginDishaRun(2_000); // React double-invoked effects must not restart the clock
    expect(getDishaRunSnapshot()).toBe(inFlight);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('an "ok" view becomes "done", keeping the real start time and block', () => {
    beginDishaRun(1_000);
    const block = makeBlock();
    completeDishaRun({ kind: 'ok', block } as DishaViewState, 3_000);

    expect(getDishaRunSnapshot()).toEqual({
      phase: 'done',
      startedAt: 1_000,
      finishedAt: 3_000,
      block,
      message: null,
    });
  });

  it('publishes nothing when the same done snapshot is completed twice', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeDishaRun(listener);

    const block = makeBlock();
    beginDishaRun(1_000);
    listener.mockClear(); // only count completion from here on
    completeDishaRun({ kind: 'ok', block } as DishaViewState, 3_000);
    expect(listener).toHaveBeenCalledTimes(1);

    const done = getDishaRunSnapshot();
    completeDishaRun({ kind: 'ok', block } as DishaViewState, 4_000);
    expect(getDishaRunSnapshot()).toBe(done);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('an "error" view becomes "error" with the real message, and repeats are ignored', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeDishaRun(listener);

    beginDishaRun(1_000);
    listener.mockClear(); // only count completion from here on
    completeDishaRun({ kind: 'error', message: 'The provider is unavailable.' } as DishaViewState, 2_000);
    expect(getDishaRunSnapshot()).toEqual({
      phase: 'error',
      startedAt: 1_000,
      finishedAt: 2_000,
      block: null,
      message: 'The provider is unavailable.',
    });
    expect(listener).toHaveBeenCalledTimes(1);

    const failed = getDishaRunSnapshot();
    completeDishaRun({ kind: 'error', message: 'The provider is unavailable.' } as DishaViewState, 3_000);
    expect(getDishaRunSnapshot()).toBe(failed);

    completeDishaRun({ kind: 'error', message: 'A different failure.' } as DishaViewState, 4_000);
    expect(getDishaRunSnapshot().message).toBe('A different failure.');
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it('publishes nothing for unsupported / running / idle views — a question that never ran must not look like it ran', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeDishaRun(listener);

    const neverRan: DishaViewState[] = [
      { kind: 'unsupported' },
      { kind: 'running' },
      { kind: 'idle' },
    ];
    for (const view of neverRan) {
      completeDishaRun(view, 5_000);
    }
    expect(getDishaRunSnapshot()).toBe(IDLE_DISHA_RUN);
    expect(listener).not.toHaveBeenCalled();

    // ...and a mid-flight "running" view must not overwrite a real in-flight run.
    beginDishaRun(1_000);
    completeDishaRun({ kind: 'running' } as DishaViewState, 1_500);
    expect(getDishaRunSnapshot().phase).toBe('running');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('reset() returns to idle, notifies once, and is idempotent', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeDishaRun(listener);

    beginDishaRun(1_000);
    listener.mockClear(); // only count the reset below
    resetDishaRun();
    expect(getDishaRunSnapshot()).toBe(IDLE_DISHA_RUN);
    expect(listener).toHaveBeenCalledTimes(1);

    resetDishaRun();
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('unsubscribed listeners stop receiving updates', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeDishaRun(listener);
    unsubscribe();

    beginDishaRun(1_000);
    expect(listener).not.toHaveBeenCalled();
  });

  it('never writes to localStorage or sessionStorage (module memory only)', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem');

    beginDishaRun(1_000);
    completeDishaRun({ kind: 'ok', block: makeBlock() } as DishaViewState, 2_000);
    completeDishaRun({ kind: 'error', message: 'boom' } as DishaViewState, 3_000);
    resetDishaRun();

    expect(setItem).not.toHaveBeenCalled();
    expect(getItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// The only real publisher: useDishaCoordinator, across the route change
// ---------------------------------------------------------------------------

describe('useDishaCoordinator → dishaRunStore', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('mirrors a real request: "running" while in flight, "done" with the returned block afterwards', async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn(
      (_input?: RequestInfo | URL) =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useDishaCoordinator());

    let askPromise: Promise<void> | undefined;
    act(() => {
      askPromise = result.current.ask('Trucks from Patna to Ranchi?');
    });

    // The synchronous part of ask() already flipped the hook to running, so
    // the store must show the in-progress phase before any network settles.
    expect(result.current.running).toBe(true);
    expect(getDishaRunSnapshot().phase).toBe('running');
    expect(getDishaRunSnapshot().startedAt).not.toBeNull();

    // Let ask() reach the fetch call (it awaits getSupabaseToken() first).
    await act(async () => {
      for (let i = 0; i < 10 && fetchMock.mock.calls.length === 0; i += 1) {
        await Promise.resolve();
      }
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      'https://example.supabase.co/functions/v1/agent-router',
    );
    if (!resolveFetch) throw new Error('fetch was never called');

    const block = makeBlock();
    resolveFetch(jsonResponse({ disha: block, requestId: 'req_test' }));
    await act(async () => {
      await askPromise;
    });

    const done = getDishaRunSnapshot();
    expect(done.phase).toBe('done');
    expect(done.block).toEqual(block);
    expect(done.finishedAt).not.toBeNull();
    expect(result.current.view.kind).toBe('ok');
    expect(result.current.running).toBe(false);
  });

  it('mirrors a provider outage as a real error with the real message', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('network down');
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useDishaCoordinator());

    await act(async () => {
      await result.current.ask('Trucks from Patna to Ranchi?');
    });

    expect(result.current.view).toEqual({ kind: 'error', message: 'network down' });
    expect(getDishaRunSnapshot()).toMatchObject({
      phase: 'error',
      message: 'network down',
      block: null,
    });
  });

  it('publishes nothing for an unsupported question and never touches the network', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useDishaCoordinator());

    await act(async () => {
      await result.current.ask('How do I reset my password?');
    });

    expect(result.current.view).toEqual({ kind: 'unsupported' });
    expect(getDishaRunSnapshot()).toBe(IDLE_DISHA_RUN);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reset() clears both the hook view and the shared store', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ disha: makeBlock() }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useDishaCoordinator());

    await act(async () => {
      await result.current.ask('Trucks from Patna to Ranchi?');
    });
    expect(getDishaRunSnapshot().phase).toBe('done');

    act(() => {
      result.current.reset();
    });
    expect(result.current.view).toEqual({ kind: 'idle' });
    expect(getDishaRunSnapshot()).toBe(IDLE_DISHA_RUN);
  });
});
