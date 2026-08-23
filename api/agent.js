export const config = { runtime: 'edge' };

// Exact static routes that map to SPA
const EXACT_ROUTES = new Set([
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/features',
  '/how-it-works',
  '/pricing',
  '/faq',
  '/fare-calculator',
  '/compare',
  '/safety-trust',
  '/solutions/shippers',
  '/solutions/truckers',
  '/screens/dashboard',
  '/screens/matching',
  '/screens/chat',
  '/screens/credit-score',
  '/screens/reviews',
  '/screens/admin',
  '/blog',
  '/routes',
  '/gallery',
  '/return-load',
  '/ptl-transport',
  '/ltl-transport',
  '/truck-load-booking',
  '/freight-marketplace',
  '/transport-cost-calculator',
  '/truck-load-calculator',
  '/ptl-vs-ftl-calculator',
  '/freight-rate-calculator',
  '/return-load-calculator',
  '/for-msmes',
  '/ai-logistics',
  '/data',
  '/freight-intelligence',
  '/login',
  '/register',
  '/choose-role',
  '/forgot-password',
  '/onboarding',
  '/profile',
  '/favorites',
  '/credit-score',
  '/browse-trucks',
  '/messages',
]);

// Prefixes for dynamic routes — any sub-path under these is considered a valid SPA route
const PREFIXES = [
  '/share/trip/',
  '/share/shipment/',
  '/blog/',
  '/routes/',
  '/location/',
  '/guide/',
  '/transport/',
  '/admin/',
  '/trucker/',
  '/shipper/',
  '/trips/',
  '/chat/',
];

// HTML files that have dedicated prerendered variants (served instead of generic index.html)
// This ensures trust-anchor pages have 500+ chars in raw HTML without JS
const DEDICATED_HTML = new Set(['/about', '/contact', '/privacy']);

function normalizePath(path) {
  // Remove trailing slash except for root
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path;
}

function isKnownRoute(path) {
  const n = normalizePath(path);
  if (EXACT_ROUTES.has(n)) return true;
  // Prefix match
  for (const p of PREFIXES) {
    if (path.startsWith(p)) return true;
  }
  // Special: /blog with prefix already covers /blog/, but exact /blog handled
  // Also handle /routes with slug etc via prefix
  return false;
}

function markdownForPath(path) {
  const n = normalizePath(path);
  // Map known HTML paths to markdown sources where we have dedicated files
  const map = {
    '/': '/index.md',
    '/pricing': '/pricing.md',
  };
  return map[n] || null;
}

export default async function handler(req) {
  const url = new URL(req.url);
  const rawPath = url.pathname;
  const path = normalizePath(rawPath);
  const accept = (req.headers.get('accept') || '').toLowerCase();

  const wantsMarkdown = accept.includes('text/markdown') || accept.includes('text/x-markdown');

  // Content negotiation: Accept: text/markdown
  if (wantsMarkdown) {
    // Known route: try to serve dedicated markdown, else generic index.md
    if (isKnownRoute(path)) {
      const mdPath = markdownForPath(path);
      if (mdPath) {
        try {
          const mdRes = await fetch(new URL(mdPath, url.origin));
          if (mdRes.ok) {
            const body = await mdRes.text();
            return new Response(body, {
              status: 200,
              headers: {
                'Content-Type': 'text/markdown; charset=utf-8',
                'Vary': 'Accept, Accept-Encoding',
                'Cache-Control': 'public, max-age=3600',
              },
            });
          }
        } catch {
          // fall through
        }
      }
      // Known route but no dedicated markdown -> serve index.md as fallback with 200
      // This ensures agents still get useful markdown for any valid page
      try {
        const mdRes = await fetch(new URL('/index.md', url.origin));
        if (mdRes.ok) {
          const body = await mdRes.text();
          return new Response(body, {
            status: 200,
            headers: {
              'Content-Type': 'text/markdown; charset=utf-8',
              'Vary': 'Accept, Accept-Encoding',
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      } catch {
        // fall through to generic
      }
    }
    // Unknown path or failed fetch -> 404 markdown with helpful body
    const notFoundMd = `# 404 - Page Not Found

The page \`${rawPath}\` does not exist on LoadSaathi.

## LoadSaathi

LoadSaathi is India's AI-powered shared freight marketplace connecting shippers and truckers for PTL (Partial Truckload) and LTL (Less Than Truckload) loads across East India. The platform uses AI matching, real-time GPS tracking, digital credit scores, and escrow-backed payments to eliminate empty return trips and reduce freight costs by up to 40%.

## Available Pages

- [Home](https://loadsaathi.in/) - Platform overview and getting started
- [About](https://loadsaathi.in/about) - Company story and team
- [Contact](https://loadsaathi.in/contact) - Get in touch with LoadSaathi
- [Features](https://loadsaathi.in/features) - Platform capabilities
- [How It Works](https://loadsaathi.in/how-it-works) - Step-by-step guide
- [Pricing](https://loadsaathi.in/pricing) - Plans and transaction fees
- [FAQ](https://loadsaathi.in/faq) - Frequently asked questions
- [Blog](https://loadsaathi.in/blog) - Articles and guides
- [All Freight Routes](https://loadsaathi.in/routes) - 30+ freight corridors
- [Privacy Policy](https://loadsaathi.in/privacy) - Data handling and privacy
- [Terms of Service](https://loadsaathi.in/terms) - Platform terms

## Machine-Readable Resources

- [llms.txt](https://loadsaathi.in/llms.txt) - Site summary for AI agents
- [sitemap.xml](https://loadsaathi.in/sitemap.xml) - XML sitemap with all pages
- [robots.txt](https://loadsaathi.in/robots.txt) - Crawler directives

## Contact

- Website: https://loadsaathi.in
- Email: support@loadsaathi.in
`;
    return new Response(notFoundMd, {
      status: 404,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Vary': 'Accept, Accept-Encoding',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }

  // HTML handling
  if (isKnownRoute(path)) {
    try {
      // Prefer dedicated HTML for trust anchors if available
      let htmlPath = '/index.html';
      if (DEDICATED_HTML.has(path)) {
        // Try dedicated file first (e.g. /about.html)
        const candidate = `/${path.slice(1)}.html`;
        try {
          const probe = await fetch(new URL(candidate, url.origin));
          if (probe.ok) {
            htmlPath = candidate;
          }
        } catch {
          // keep index.html
        }
      }
      const htmlRes = await fetch(new URL(htmlPath, url.origin));
      if (!htmlRes.ok) throw new Error('html fetch failed');
      // Stream body through with correct headers
      return new Response(htmlRes.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Vary': 'Accept, Accept-Encoding',
          'Cache-Control': 'public, max-age=0, must-revalidate',
        },
      });
    } catch {
      return new Response('Service temporarily unavailable', {
        status: 503,
        headers: { 'Vary': 'Accept, Accept-Encoding' },
      });
    }
  }

  // Unknown path -> 404.html with proper status
  try {
    const notFoundRes = await fetch(new URL('/404.html', url.origin));
    if (notFoundRes.ok) {
      return new Response(notFoundRes.body, {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Vary': 'Accept, Accept-Encoding',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }
  } catch {
    // fall through
  }
  return new Response('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>404 - Not Found</title><meta name="robots" content="noindex"></head><body><h1>404 - Page Not Found</h1><p>The page does not exist.</p><ul><li><a href="/">Home</a></li><li><a href="/sitemap.xml">sitemap.xml</a></li><li><a href="/llms.txt">llms.txt</a></li></ul></body></html>', {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Vary': 'Accept, Accept-Encoding',
    },
  });
}
