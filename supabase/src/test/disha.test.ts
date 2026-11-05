import { describe, it, expect, vi } from 'vitest';
import {
  askDisha,
  DishaRequestError,
  interpretDishaResponse,
  isDishaUiEnabled,
  isSupportedDishaRequest,
  parseDishaBlock,
} from '@/lib/dishaRequest';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function errorResponse(message: string, status: number): Response {
  return {
    ok: false,
    status,
    json: async () => ({ error: message, requestId: 'req_test' }),
  } as Response;
}

const COMPLETE_BLOCK = {
  status: 'completed',
  intent: 'route_search',
  missing: ['max_price_per_tonne'],
  rows: [
    {
      origin: 'Patna',
      destination: 'Ranchi',
      departure_date: '2026-11-01',
      capacity_tonnes: 10,
      price_per_tonne: 1400,
      vehicle_type: 'Truck',
    },
  ],
  explanation: 'The marketplace returned rows on the Patna to Ranchi route.',
  explanationSource: 'model',
  provider: 'gemini',
  checkedAt: '2026-10-25T10:00:00.000Z',
  trace: [
    { step: 'shipment_analyst', status: 'completed', summary: 'Extracted 2 filters.', durationMs: 12 },
    { step: 'matching_specialist', status: 'completed', summary: 'Returned 1 row(s).', durationMs: 34 },
    { step: 'disha_coordinator', status: 'completed', summary: 'Explained 1 row(s).', durationMs: 56 },
  ],
};

// ---------------------------------------------------------------------------
// isSupportedDishaRequest — the client pre-flight gate
// ---------------------------------------------------------------------------

describe('isSupportedDishaRequest', () => {
  it('accepts a route question with a concrete constraint', () => {
    expect(isSupportedDishaRequest('Any trucks from Patna to Ranchi under ₹1500 per tonne?')).toBe(true);
  });

  it('accepts a route-only logistics question', () => {
    expect(isSupportedDishaRequest('Find loads to Delhi')).toBe(true);
  });

  it('accepts a capacity question', () => {
    expect(isSupportedDishaRequest('I need 10 tonnes capacity for a truck')).toBe(true);
  });

  it('accepts a price question', () => {
    expect(isSupportedDishaRequest('Cheapest freight rate Delhi')).toBe(true);
  });

  it('ignores surrounding whitespace and casing', () => {
    expect(isSupportedDishaRequest('  LOAD FROM KOLKATA TO GUWAHATI  ')).toBe(true);
  });

  it('rejects account/help questions', () => {
    expect(isSupportedDishaRequest('How do I reset my password?')).toBe(false);
  });

  it('rejects non-logistics questions', () => {
    expect(isSupportedDishaRequest('What is the weather in Ranchi?')).toBe(false);
  });

  it('rejects a logistics question with no concrete constraint', () => {
    expect(isSupportedDishaRequest('Find me a load')).toBe(false);
  });

  it('rejects shipment status questions (not a marketplace search)', () => {
    expect(isSupportedDishaRequest('What is the status of my shipment?')).toBe(false);
  });

  it('rejects empty and whitespace-only input', () => {
    expect(isSupportedDishaRequest('')).toBe(false);
    expect(isSupportedDishaRequest('   ')).toBe(false);
  });

  it('does not match the product name alone', () => {
    expect(isSupportedDishaRequest('Tell me about LoadSaathi')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isDishaUiEnabled — default-off feature flag
// ---------------------------------------------------------------------------

describe('isDishaUiEnabled', () => {
  it('is on only for the exact string "true"', () => {
    expect(isDishaUiEnabled({ VITE_DISHA_UI: 'true' })).toBe(true);
  });

  it('is off for "false", other casing, and unset', () => {
    expect(isDishaUiEnabled({ VITE_DISHA_UI: 'false' })).toBe(false);
    expect(isDishaUiEnabled({ VITE_DISHA_UI: 'TRUE' })).toBe(false);
    expect(isDishaUiEnabled({ VITE_DISHA_UI: undefined })).toBe(false);
    expect(isDishaUiEnabled({})).toBe(false);
  });

  it('defaults to the build environment without throwing', () => {
    expect(typeof isDishaUiEnabled()).toBe('boolean');
  });
});

// ---------------------------------------------------------------------------
// askDisha — transport contract
// ---------------------------------------------------------------------------

describe('askDisha', () => {
  const supabaseUrl = 'https://example.supabase.co';

  it('POSTs { message, disha: true } with the caller JWT', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ ok: true, disha: COMPLETE_BLOCK }));

    const body = await askDisha({
      message: 'Trucks from Patna to Ranchi',
      supabaseUrl,
      token: 'jwt-token',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://example.supabase.co/functions/v1/agent-router');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Authorization']).toBe('Bearer jwt-token');
    // Exact body: no filters, no session, no token, nothing writable.
    expect(JSON.parse(String(init.body))).toEqual({
      message: 'Trucks from Patna to Ranchi',
      disha: true,
    });
    expect(body).toHaveProperty('disha');
  });

  it('omits the Authorization header when no token is available', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ ok: true, disha: COMPLETE_BLOCK }));

    await askDisha({
      message: 'Loads to Delhi',
      supabaseUrl,
      token: null,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.headers as Record<string, string>).not.toHaveProperty('Authorization');
  });

  it('returns the body of a non-OK response that carries a disha block', async () => {
    // The server reports search failures honestly inside a 502 + disha block.
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ error: 'upstream', requestId: 'r1', disha: { ...COMPLETE_BLOCK, status: 'failed' } }, 502),
    );

    const body = await askDisha({
      message: 'Loads to Pune',
      supabaseUrl,
      token: 'jwt-token',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(body).toHaveProperty('disha');
    expect(interpretDishaResponse(body)).toMatchObject({ kind: 'ok' });
  });

  it('throws with the server error and status for a non-OK response without a disha block', async () => {
    const fetchImpl = vi.fn(async () => errorResponse('Too many requests.', 429));

    const error = await askDisha({
      message: 'Loads to Pune',
      supabaseUrl,
      token: 'jwt-token',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    }).catch((err: unknown) => err);

    expect(error).toBeInstanceOf(DishaRequestError);
    expect((error as DishaRequestError).message).toBe('Too many requests.');
    expect((error as DishaRequestError).status).toBe(429);
  });

  it('throws when the response body is not readable JSON', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON');
      },
    })) as unknown as typeof fetch;

    await expect(
      askDisha({ message: 'Loads to Pune', supabaseUrl, token: 't', fetchImpl }),
    ).rejects.toThrow(DishaRequestError);
  });

  it('throws when the JSON body is not an object', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(['not', 'an', 'object']));

    await expect(
      askDisha({
        message: 'Loads to Pune',
        supabaseUrl,
        token: 't',
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow('unexpected response');
  });

  it('propagates network failures untouched', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });

    await expect(
      askDisha({
        message: 'Loads to Pune',
        supabaseUrl,
        token: 't',
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow('fetch failed');
  });
});

// ---------------------------------------------------------------------------
// interpretDishaResponse / parseDishaBlock — view states
// ---------------------------------------------------------------------------

describe('interpretDishaResponse', () => {
  it('maps a complete block to an ok view', () => {
    const view = interpretDishaResponse({ ok: true, requestId: 'req_1', disha: COMPLETE_BLOCK });

    expect(view.kind).toBe('ok');
    if (view.kind !== 'ok') throw new Error('expected ok view');
    expect(view.block.status).toBe('completed');
    expect(view.block.intent).toBe('route_search');
    expect(view.block.missing).toEqual(['max_price_per_tonne']);
    expect(view.block.rows).toHaveLength(1);
    expect(view.block.rows[0]?.origin).toBe('Patna');
    expect(view.block.trace).toHaveLength(3);
    expect(view.requestId).toBe('req_1');
    expect(view.serverError).toBeUndefined();
  });

  it('keeps the server error string for failed blocks', () => {
    const view = interpretDishaResponse({
      error: 'The marketplace search did not complete',
      requestId: 'req_2',
      disha: { ...COMPLETE_BLOCK, status: 'failed' },
    });

    expect(view.kind).toBe('ok');
    if (view.kind !== 'ok') throw new Error('expected ok view');
    expect(view.block.status).toBe('failed');
    expect(view.serverError).toBe('The marketplace search did not complete');
  });

  it('returns an error view when the disha block is missing', () => {
    const view = interpretDishaResponse({ ok: true, requestId: 'req_3' });
    expect(view).toEqual({
      kind: 'error',
      message: expect.stringContaining('Nothing was booked'),
    });
  });

  it('returns an error view for non-object bodies', () => {
    expect(interpretDishaResponse(null).kind).toBe('error');
    expect(interpretDishaResponse('nope').kind).toBe('error');
    expect(interpretDishaResponse(['nope']).kind).toBe('error');
  });

  it('returns an error view for an unknown block status', () => {
    const view = interpretDishaResponse({ disha: { ...COMPLETE_BLOCK, status: 'best' } });
    expect(view.kind).toBe('error');
  });

  it('coerces malformed fields instead of trusting them', () => {
    const view = interpretDishaResponse({
      disha: {
        status: 'unavailable',
        intent: 'not-a-real-intent',
        missing: ['origin', 'evil-key', 42],
        rows: [
          { origin: 'A', destination: 'B', departure_date: '2026-11-01' },
          { origin: 'missing-destination' },
          null,
          'row-string',
        ],
        explanation: 'Deterministic summary.',
        explanationSource: 'not-a-source',
        provider: 12345,
        checkedAt: { nested: true },
        trace: [
          { step: 'shipment_analyst', status: 'completed', summary: 'ok', durationMs: 5 },
          { step: 'unknown_step', status: 'completed', summary: 'bad', durationMs: 5 },
          { step: 'shipment_analyst', status: 'teleported', summary: 'bad', durationMs: 5 },
          'not-an-event',
        ],
      },
    });

    expect(view.kind).toBe('ok');
    if (view.kind !== 'ok') throw new Error('expected ok view');
    expect(view.block.status).toBe('unavailable');
    expect(view.block.intent).toBe('unconstrained');
    expect(view.block.missing).toEqual(['origin']);
    expect(view.block.rows).toHaveLength(1);
    expect(view.block.rows[0]?.destination).toBe('B');
    expect(view.block.explanationSource).toBe('deterministic');
    expect(view.block.provider).toBe('none');
    expect(view.block.checkedAt).toBe('');
    expect(view.block.trace).toHaveLength(1);
  });

  it('treats a missing trace or rows as empty lists', () => {
    const view = interpretDishaResponse({ disha: { status: 'skipped', explanation: 'skipped' } });
    expect(view.kind).toBe('ok');
    if (view.kind !== 'ok') throw new Error('expected ok view');
    expect(view.block.rows).toEqual([]);
    expect(view.block.trace).toEqual([]);
  });
});

describe('parseDishaBlock', () => {
  it('rejects non-object input', () => {
    expect(parseDishaBlock(undefined)).toBeNull();
    expect(parseDishaBlock('completed')).toBeNull();
    expect(parseDishaBlock([])).toBeNull();
  });

  it('accepts every documented status', () => {
    for (const status of ['completed', 'failed', 'unavailable', 'skipped']) {
      expect(parseDishaBlock({ status })?.status).toBe(status);
    }
  });
});
