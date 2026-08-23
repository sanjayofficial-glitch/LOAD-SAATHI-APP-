export const config = { runtime: 'edge' };

const SPA_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/features',
  '/how-it-works',
  '/pricing',
  '/faq',
  '/blog',
  '/compare',
  '/safety-trust',
  '/solutions/shippers',
  '/solutions/truckers',
  '/login',
  '/register',
  '/choose-role',
  '/forgot-password',
  '/profile',
  '/favorites',
  '/credit-score',
  '/dashboard',
  '/chat',
  '/routes',
];

export default async function handler(req) {
  const url = new URL(req.url);
  const path = url.pathname;
  const accept = req.headers.get('accept') || '';

  // Content negotiation: serve markdown for text/markdown Accept header on known pages
  if (accept.includes('text/markdown')) {
    if (path === '/' || path === '') {
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
        // Fall through to 404
      }
      return new Response('# Page Not Found\n\nThe requested page could not be served as markdown.', {
        status: 404,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Vary': 'Accept' },
      });
    }
    // Non-homepage markdown requests get404
    return new Response('# Page Not Found\n\nThe requested page could not be served as markdown.', {
      status: 404,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Vary': 'Accept' },
    });
  }

  // For HTML requests: known SPA routes -> index.html, unknown ->404.html
  if (SPA_ROUTES.includes(path)) {
    try {
      const htmlRes = await fetch(new URL('/index.html', url.origin));
      return new Response(htmlRes.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Vary': 'Accept, Accept-Encoding',
        },
      });
    } catch {
      return new Response('Service temporarily unavailable', { status: 503 });
    }
  }

  // Unknown path ->404
  try {
    const notFoundRes = await fetch(new URL('/404.html', url.origin));
    return new Response(notFoundRes.body, {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Vary': 'Accept, Accept-Encoding',
      },
    });
  } catch {
    return new Response('Page not found', { status: 404 });
  }
}
