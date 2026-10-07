import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import handler from '../../../api/agent.js';

/**
 * The CSP collector is the one endpoint that accepts unauthenticated POSTs from
 * any origin on a same-origin path, so its edge cases are the security-relevant
 * part: no reflection of input, bounded reads, and a non-2xx for bad input.
 */
function post(body: string, method = 'POST') {
  return new Request('https://loadsaathi.in/csp-report', {
    method,
    headers: { 'content-type': 'application/csp-report' },
    body,
  });
}

describe('api/agent: /csp-report', () => {
  it('acknowledges a legacy csp-report payload with 204 and empty body', async () => {
    const res = await handler(
      post(JSON.stringify({
        'csp-report': {
          'document-uri': 'https://loadsaathi.in/routes',
          'violated-directive': 'script-src',
          'blocked-uri': 'https://evil.example/x.js',
        },
      }))
    );
    expect(res.status).toBe(204);
    // Nothing is echoed: a report endpoint that reflects input is a same-origin
    // reflected-XSS vector.
    expect(await res.text()).toBe('');
  });

  it('accepts the CSP3 reporting-endpoint shape', async () => {
    const res = await handler(
      post(JSON.stringify({
        type: 'csp-violation',
        documentURL: 'https://loadsaathi.in/',
        effectiveDirective: 'connect-src',
        blockedURL: 'https://tracker.example',
      }))
    );
    expect(res.status).toBe(204);
  });

  it('accepts a JSON array of reports', async () => {
    const res = await handler(
      post(JSON.stringify([
        { type: 'csp-violation', effectiveDirective: 'img-src', blockedURL: 'https://a.example' },
        { type: 'csp-violation', effectiveDirective: 'style-src', blockedURL: 'inline' },
      ]))
    );
    expect(res.status).toBe(204);
  });

  it('rejects malformed JSON with 400 instead of throwing', async () => {
    const res = await handler(post('{not json'));
    expect(res.status).toBe(400);
  });

  it('rejects an oversized body without processing it', async () => {
    const res = await handler(post('x'.repeat(70 * 1024)));
    expect(res.status).toBe(400);
  });

  it('rejects non-POST methods with 405 and an Allow header', async () => {
    const res = await handler(
      new Request('https://loadsaathi.in/csp-report', { method: 'GET' })
    );
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('POST');
  });

  it('truncates hostile field lengths rather than logging them whole', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const res = await handler(
      post(JSON.stringify({
        'csp-report': {
          'blocked-uri': 'https://x.example/' + 'a'.repeat(5000),
          'violated-directive': 'script-src ' + 'b'.repeat(5000),
        },
      }))
    );
    expect(res.status).toBe(204);
    const logged = spy.mock.calls.map((c) => String(c[0])).join('\n');
    spy.mockRestore();
    expect(logged.length).toBeLessThan(1000);
    expect(logged).toContain('blocked=https://x.example/');
  });

  it('is reachable: the catch-all rewrite delegates /csp-report to this handler', () => {
    // Guards the wiring, not the code. The SPA catch-all rewrite excludes
    // /api/, /assets/ and anything containing a dot. "/csp-report" satisfies
    // none of those, so it must be delegated to the edge function — otherwise
    // report-uri posts would land on the 404 page and stop arriving silently.
    const path = '/csp-report';
    const excludedByApi = /^\/api\//.test(path);
    const excludedByAssets = /^\/assets\//.test(path);
    const excludedByDot = /\..*$/m.test(path);
    expect({ excludedByApi, excludedByAssets, excludedByDot }).toEqual({
      excludedByApi: false,
      excludedByAssets: false,
      excludedByDot: false,
    });

    const cfg = JSON.parse(
      readFileSync(resolve(__dirname, '../../../vercel.json'), 'utf-8')
    );
    const catchAll = cfg.rewrites.find((r: { source: string }) => r.source.includes('(?!'));
    expect(catchAll.destination).toBe('/api/agent.js');
  });
});