import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../..');

function readFile(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf-8');
}

describe('Security: vercel.json headers', () => {
  const config = JSON.parse(readFile('vercel.json'));
  const global = config.headers.find(
    (h: { source: string }) => h.source === '/(.*)'
  );

  function valueFor(key: string): string | undefined {
    return global?.headers.find(
      (kv: { key: string }) => kv.key === key
    )?.value;
  }

  it('keeps the pre-existing hardening headers', () => {
    expect(valueFor('X-Content-Type-Options')).toBe('nosniff');
    expect(valueFor('X-Frame-Options')).toBe('SAMEORIGIN');
    expect(valueFor('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('adds HSTS with a two-year max-age and preload', () => {
    const hsts = valueFor('Strict-Transport-Security');
    expect(hsts).toBeDefined();
    expect(hsts).toContain('max-age=63072000');
    expect(hsts).toContain('includeSubDomains');
    expect(hsts).toContain('preload');
  });

  it('adds a Permissions-Policy that allows geolocation only to self', () => {
    const policy = valueFor('Permissions-Policy');
    expect(policy).toBeDefined();
    // The map/GPS tracking feature needs geolocation; everything else is off.
    expect(policy).toContain('geolocation=(self)');
    expect(policy).toContain('camera=()');
    expect(policy).toContain('microphone=()');
  });

  it('ships the CSP in report-only mode so it cannot break the app', () => {
    // Enforcing a first CSP on a site with Clerk, Supabase, PostHog, GA/GTM and
    // four map tile providers is how you turn a security fix into an outage.
    // Report-only collects violations first; enforce once the log is clean.
    expect(valueFor('Content-Security-Policy')).toBeUndefined();
    const csp = valueFor('Content-Security-Policy-Report-Only');
    expect(csp).toBeDefined();
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain('report-uri /csp-report');
  });

  it('allows the third-party origins the app actually calls', () => {
    const csp = valueFor('Content-Security-Policy-Report-Only')!;
    // Auth
    expect(csp).toContain('https://*.clerk.com');
    expect(csp).toContain('https://*.clerk.accounts.dev');
    // Realtime + REST, both the https and wss transports
    expect(csp).toContain('https://*.supabase.co');
    expect(csp).toContain('wss://*.supabase.co');
    // Routing and geocoding
    expect(csp).toContain('https://router.project-osrm.org');
    expect(csp).toContain('https://nominatim.openstreetmap.org');
    // Analytics
    expect(csp).toContain('https://www.googletagmanager.com');
    expect(csp).toContain('https://us.posthog.com');
    // Map tiles load as images, which img-src covers via https:
    expect(csp).toContain('img-src');
  });

  it('scopes the CSP report cache rule to the path the policy actually posts to', () => {
    const csp = valueFor('Content-Security-Policy-Report-Only')!;
    const postedTo = csp.match(/report-uri\s+(\S+)/)?.[1];
    expect(postedTo).toBeDefined();
    const rule = config.headers.find(
      (h: { source: string }) => h.source === postedTo
    );
    expect(rule).toBeDefined();
    expect(
      rule.headers.find((kv: { key: string }) => kv.key === 'Cache-Control').value
    ).toBe('no-store');
  });

  it('serves security.txt as text/plain', () => {
    const rule = config.headers.find(
      (h: { source: string }) => h.source === '/security.txt'
    );
    expect(rule).toBeDefined();
    const ct = rule.headers.find((kv: { key: string }) => kv.key === 'Content-Type').value;
    expect(ct).toContain('text/plain');
  });
});

describe('Security: security.txt', () => {
  const body = readFile('public/security.txt');

  it('declares the RFC 9496 required fields', () => {
    expect(body).toMatch(/^Contact: /m);
    expect(body).toMatch(/^Expires: /m);
    expect(body).toMatch(/^Preferred-Languages: /m);
    expect(body).toMatch(/^Canonical: /m);
  });

  it('has an expiry in the future', () => {
    const expires = body.match(/^Expires:\s*(\S+)/m)?.[1];
    expect(expires).toBeDefined();
    expect(new Date(expires!).getTime()).toBeGreaterThan(Date.now());
  });
});

describe('Security: robots.txt', () => {
  const robots = readFile('public/robots.txt');

  it('blocks the CSP report collector from being indexed', () => {
    expect(robots).toMatch(/^Disallow: \/csp-report/m);
  });

  it('still advertises the XML sitemap', () => {
    expect(robots).toMatch(/^Sitemap: https:\/\/loadsaathi\.in\/sitemap\.xml/m);
  });
});