import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../..');

function readFile(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf-8');
}

describe('Agentic Readiness: vercel.json', () => {
  let config: Record<string, unknown>;

  beforeAll(() => {
    config = JSON.parse(readFile('vercel.json'));
  });

  it('has a catch-all route that delegates to the edge function', () => {
    const routes = config.routes as Array<{ src: string; dest: string }>;
    expect(routes).toBeDefined();
    expect(routes.length).toBeGreaterThan(0);

    const catchAll = routes.find(
      (r) => r.src.includes('((?!assets/') && r.src.includes('.*)')
    );
    expect(catchAll).toBeDefined();
    expect(catchAll!.dest).toBe('/api/agent.js');
  });

  it('has an explicit route for the edge function itself', () => {
    const routes = config.routes as Array<{ src: string; dest: string }>;
    const agentRoute = routes.find((r) => r.src.includes('/api/agent'));
    expect(agentRoute).toBeDefined();
    expect(agentRoute!.dest).toBe('/api/agent.js');
  });

  it('does NOT have a catch-all rewrite to index.html', () => {
    const routes = config.routes as Array<{ src: string; dest: string }>;
    const spaRewrite = routes.find(
      (r) => r.dest === '/index.html' && r.src.includes('.*')
    );
    expect(spaRewrite).toBeUndefined();
  });

  it('includes security headers', () => {
    const headers = config.headers as Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
    expect(headers).toBeDefined();

    const securityHeader = headers.find((h) => h.source === '/(.*)');
    expect(securityHeader).toBeDefined();

    const headerKeys = securityHeader!.headers.map((h) => h.key);
    expect(headerKeys).toContain('X-Content-Type-Options');
    expect(headerKeys).toContain('X-Frame-Options');
    expect(headerKeys).toContain('Referrer-Policy');
  });
});

describe('Agentic Readiness: public/404.html', () => {
  let content: string;

  beforeAll(() => {
    content = readFile('public/404.html');
  });

  it('has proper HTML structure with lang attribute', () => {
    expect(content).toContain('<html lang="en">');
    expect(content).toContain('<!DOCTYPE html>');
  });

  it('contains a404 status indication in the heading', () => {
    expect(content).toContain('<h1>404 - Page Not Found</h1>');
  });

  it('explains what LoadSaathi is', () => {
    expect(content).toContain('AI-powered shared freight marketplace');
    expect(content).toContain('PTL');
    expect(content).toContain('East India');
  });

  it('links to key pages', () => {
    expect(content).toContain('href="/"');
    expect(content).toContain('href="/about"');
    expect(content).toContain('href="/contact"');
    expect(content).toContain('href="/features"');
    expect(content).toContain('href="/pricing"');
    expect(content).toContain('href="/blog"');
    expect(content).toContain('href="/routes"');
    expect(content).toContain('href="/privacy"');
  });

  it('includes machine-readable resources', () => {
    expect(content).toContain('href="/llms.txt"');
    expect(content).toContain('href="/sitemap.xml"');
    expect(content).toContain('href="/robots.txt"');
  });

  it('has a markdown block in an HTML comment for AI agents', () => {
    expect(content).toContain('<!--');
    expect(content).toContain('# 404 - Page Not Found');
    expect(content).toContain('## Available Pages');
    expect(content).toContain('## Machine-Readable Resources');
    expect(content).toContain('-->');
  });

  it('marks itself as noindex', () => {
    expect(content).toContain('name="robots" content="noindex"');
  });
});

describe('Agentic Readiness: public/index.md', () => {
  let content: string;

  beforeAll(() => {
    content = readFile('public/index.md');
  });

  it('is valid markdown with heading', () => {
    expect(content).toContain('# LoadSaathi');
  });

  it('explains the platform concisely', () => {
    expect(content).toContain('AI-powered shared freight marketplace');
    expect(content).toContain('PTL');
    expect(content).toContain('LTL');
    expect(content).toContain('East India');
  });

  it('has a last updated date', () => {
    expect(content).toMatch(/Last updated:.+2026/);
  });

  it('lists who the platform is for', () => {
    expect(content).toContain('Shippers');
    expect(content).toContain('Truckers');
  });

  it('describes key features', () => {
    expect(content).toContain('AI-Powered Matching');
    expect(content).toContain('GPS Tracking');
    expect(content).toContain('Credit Score');
    expect(content).toContain('Escrow Payments');
  });

  it('includes pricing information', () => {
    expect(content).toContain('Free to join');
    expect(content).toMatch(/2[-–]5%/);
  });

  it('lists cities served', () => {
    expect(content).toContain('Rourkela');
    expect(content).toContain('Ranchi');
    expect(content).toContain('Kolkata');
    expect(content).toContain('Bhubaneswar');
  });

  it('has FAQ section', () => {
    expect(content).toContain('## FAQ');
    expect(content).toContain('What is LoadSaathi?');
  });

  it('links to key pages', () => {
    expect(content).toContain('](https://loadsaathi.in/about)');
    expect(content).toContain('](https://loadsaathi.in/contact)');
    expect(content).toContain('](https://loadsaathi.in/features)');
    expect(content).toContain('](https://loadsaathi.in/pricing)');
  });
});

describe('Agentic Readiness: index.html metadata', () => {
  let content: string;

  beforeAll(() => {
    content = readFile('index.html');
  });

  it('has NO site-wide canonical (per-route canonicals are injected by api/agent.js and prerender; a hardcoded apex canonical would tell Google every URL is the homepage)', () => {
    expect(content).not.toContain('<link rel="canonical"');
  });

  it('has og:type', () => {
    expect(content).toContain('<meta property="og:type" content="website" />');
  });

  it('has og:image', () => {
    expect(content).toContain('<meta property="og:image" content="https://loadsaathi.in/og-image.png" />');
  });

  it('has NO site-wide og:url (same reason as canonical above)', () => {
    expect(content).not.toContain('property="og:url"');
  });

  it('has lang attribute on html tag', () => {
    expect(content).toContain('<html lang="en">');
  });

  it('has robots meta tag', () => {
    expect(content).toContain('name="robots" content="index, follow"');
  });
});

describe('Agentic Readiness: index.html noscript content', () => {
  let content: string;

  beforeAll(() => {
    content = readFile('index.html');
  });

  it('has a substantial noscript block (500+ chars)', () => {
    const noscriptMatch = content.match(/<noscript>([\s\S]*?)<\/noscript>/g);
    expect(noscriptMatch).not.toBeNull();
    expect(noscriptMatch!.length).toBeGreaterThan(0);

    // Find the substantial noscript (not the GTM one)
    const mainNoscript = noscriptMatch!.find(
      (n) => n.length > 500 && !n.includes('googletagmanager')
    );
    expect(mainNoscript).toBeDefined();
    expect(mainNoscript!.length).toBeGreaterThanOrEqual(500);
  });

  it('noscript contains H1 heading', () => {
    expect(content).toContain('<noscript>');
    // Find the main noscript (not the GTM iframe one) — it's the one with <div inside
    const allNoscriptMatches = [...content.matchAll(/<noscript>([\s\S]*?)<\/noscript>/g)];
    const mainNoscript = allNoscriptMatches.find(
      (m) => m[1]?.includes('<div') && m[1]?.includes('<h1')
    );
    expect(mainNoscript).toBeDefined();
    expect(mainNoscript![1]).toContain('<h1>');
  });

  it('noscript describes what LoadSaathi does', () => {
    // Find the main noscript block (second one, with LoadSaathi content)
    const firstClose = content.indexOf('</noscript>', content.indexOf('<noscript>'));
    const secondOpen = content.indexOf('<noscript>', firstClose);
    const secondClose = content.indexOf('</noscript>', secondOpen);
    const noscriptContent = content.substring(secondOpen, secondClose);
    expect(noscriptContent).toContain('AI-Powered');
    expect(noscriptContent).toContain('freight');
    expect(noscriptContent).toContain('PTL');
  });

  it('noscript links to key pages', () => {
    const firstClose = content.indexOf('</noscript>', content.indexOf('<noscript>'));
    const secondOpen = content.indexOf('<noscript>', firstClose);
    const secondClose = content.indexOf('</noscript>', secondOpen);
    const noscriptContent = content.substring(secondOpen, secondClose);
    expect(noscriptContent).toContain('href="/about"');
    expect(noscriptContent).toContain('href="/contact"');
    expect(noscriptContent).toContain('href="/features"');
    expect(noscriptContent).toContain('href="/pricing"');
    expect(noscriptContent).toContain('href="/blog"');
    expect(noscriptContent).toContain('href="/routes"');
    expect(noscriptContent).toContain('href="/privacy"');
  });

  it('noscript links to machine-readable resources', () => {
    const firstClose = content.indexOf('</noscript>', content.indexOf('<noscript>'));
    const secondOpen = content.indexOf('<noscript>', firstClose);
    const secondClose = content.indexOf('</noscript>', secondOpen);
    const noscriptContent = content.substring(secondOpen, secondClose);
    expect(noscriptContent).toContain('href="/llms.txt"');
    expect(noscriptContent).toContain('href="/sitemap.xml"');
    expect(noscriptContent).toContain('href="/robots.txt"');
  });

  it('noscript mentions JavaScript is required', () => {
    const firstClose = content.indexOf('</noscript>', content.indexOf('<noscript>'));
    const secondOpen = content.indexOf('<noscript>', firstClose);
    const secondClose = content.indexOf('</noscript>', secondOpen);
    const noscriptContent = content.substring(secondOpen, secondClose);
    expect(noscriptContent).toContain('JavaScript is required');
  });
});

describe('Agentic Readiness: edge function (api/agent.js)', () => {
  let content: string;

  beforeAll(() => {
    content = readFile('api/agent.js');
  });

  it('exports edge runtime config', () => {
    expect(content).toContain("runtime: 'edge'");
  });

  it('has a list of known SPA routes', () => {
    // Accept either SPA_ROUTES (legacy) or EXACT_ROUTES + PREFIXES (modern)
    const hasRouteList = content.includes("SPA_ROUTES") || content.includes("EXACT_ROUTES");
    expect(hasRouteList).toBe(true);
    expect(content).toContain("'/'");
    expect(content).toContain("'/about'");
    expect(content).toContain("'/contact'");
    expect(content).toContain("'/privacy'");
    expect(content).toContain("'/features'");
    expect(content).toContain("'/pricing'");
    expect(content).toContain("'/blog'");
    expect(content).toContain("'/routes'");
  });

  it('handles text/markdown Accept header', () => {
    expect(content).toContain('text/markdown');
  });

  it('serves index.md for markdown requests to homepage', () => {
    expect(content).toContain('/index.md');
  });

  it('returns 404 for unknown paths', () => {
    expect(content).toContain('404');
    expect(content).toContain('/404.html');
  });

  it('serves index.html for known SPA routes', () => {
    expect(content).toContain('/index.html');
  });

  it('sets Vary header for content negotiation', () => {
    expect(content).toContain('Vary');
    expect(content).toContain('Accept');
  });

  it('includes Vary: Accept, Accept-Encoding in responses', () => {
    expect(content).toContain('Vary');
    expect(content).toContain('Accept, Accept-Encoding');
  });

  it('handles dedicated HTML for trust anchors', () => {
    expect(content).toContain('DEDICATED_HTML');
    expect(content).toContain("'/about'");
  });

  it('normalizes trailing slashes', () => {
    expect(content).toContain('normalizePath');
  });
});

describe('Agentic Readiness: vercel.json Vary & install', () => {
  let config: Record<string, unknown>;
  let raw: string;

  beforeAll(() => {
    raw = readFile('vercel.json');
    config = JSON.parse(raw);
  });

  it('has Vary header with Accept', () => {
    expect(raw).toContain('"Vary"');
    expect(raw).toContain('Accept');
    const headers = config.headers as Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
    const varyHeader = headers.find(h => h.headers.some(v => v.key === 'Vary' && v.value.includes('Accept')));
    expect(varyHeader).toBeDefined();
    expect(varyHeader!.headers.find(v => v.key === 'Vary')!.value).toContain('Accept, Accept-Encoding');
  });

  it('uses pnpm install command', () => {
    expect(raw).toContain('pnpm');
    expect((config as unknown as { installCommand: string }).installCommand).toBe('pnpm install');
  });

  it('has correct buildCommand and outputDirectory', () => {
    const c = config as unknown as { buildCommand: string; outputDirectory: string; framework: string };
    expect(c.buildCommand).toBe('pnpm run build');
    expect(c.outputDirectory).toBe('dist');
    expect(c.framework).toBe('vite');
  });

  it('has cleanUrls enabled', () => {
    expect((config as unknown as { cleanUrls: boolean }).cleanUrls).toBe(true);
  });
});

describe('Agentic Readiness: index.html SSR fallback (no-JS content)', () => {
  let content: string;

  beforeAll(() => {
    content = readFile('index.html');
  });

  it('has SSR fallback div with H1 visible without JS', () => {
    expect(content).toContain('id="ssr-fallback"');
    expect(content).toContain('<h1>LoadSaathi - India');
  });

  it('SSR fallback has 500+ chars of text', () => {
    const fallbackMatch = content.match(/id="ssr-fallback"[\s\S]*?<\/div>/);
    expect(fallbackMatch).not.toBeNull();
    const start = content.indexOf('id="ssr-fallback"');
    const slice = content.slice(start, start + 4000);
    const textOnly = slice.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    expect(textOnly.length).toBeGreaterThan(500);
  });

  it('SSR fallback is hidden by JS and boot-loader shown', () => {
    expect(content).toContain("document.getElementById('ssr-fallback')");
    expect(content).toContain('id="boot-loader"');
  });

  it('raw HTML text outside scripts is 500+ chars (H1 + body)', () => {
    // Simulate no-JS: strip scripts, styles, but keep fallback + noscript
    const withoutScripts = content.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
    const text = withoutScripts.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    expect(text.length).toBeGreaterThan(500);
    expect(text).toContain('LoadSaathi');
    expect(text).toContain('PTL');
  });
});

describe('Agentic Readiness: trust anchor pages', () => {
  const anchors = ['about', 'contact', 'privacy'];

  for (const page of anchors) {
    describe(`public/${page}.html`, () => {
      let content: string;

      beforeAll(() => {
        content = readFile(`public/${page}.html`);
      });

      it('exists and has lang attribute', () => {
        expect(content).toContain('<html lang="en">');
      });

      it('has canonical URL', () => {
        expect(content).toContain(`<link rel="canonical" href="https://loadsaathi.in/${page}"`);
      });

      it('has og:image and og:type', () => {
        expect(content).toContain('property="og:image"');
        expect(content).toContain('property="og:type"');
        expect(content).toContain('https://loadsaathi.in/og-image.png');
      });

      it('has 500+ chars of text content', () => {
        const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        expect(text.length).toBeGreaterThan(500);
      });

      it('has H1 heading', () => {
        expect(content).toContain('<h1>');
      });

      it('contains relevant keywords for trust', () => {
        if (page === 'about') expect(content).toContain('Rourkela');
        if (page === 'contact') expect(content).toContain('support@loadsaathi.in');
        if (page === 'privacy') expect(content).toContain('Privacy Policy');
      });

      it('links to machine-readable resources', () => {
        expect(content).toContain('href="/llms.txt"');
        expect(content).toContain('href="/sitemap.xml"');
      });
    });
  }
});
