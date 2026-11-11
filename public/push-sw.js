// LoadSaathi Web Push worker.
//
// Deliberately minimal: push + notificationclick only. No fetch handler, so
// this worker never intercepts page requests (public/sw.js is a separate
// caching worker and is NOT registered by the app).
//
// Payload shape written by supabase/functions/push-notifier:
//   { title, body, url, tag, id }

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'LoadSaathi';
  const options = {
    body: data.body || '',
    tag: data.tag || 'notification',
    icon: '/logo-192.png',
    badge: '/logo-128.webp',
    data: { url: data.url || '/', id: data.id || null },
  };

  event.waitUntil(self.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  const ALLOWED_ORIGINS = ['loadsaathi.in', 'www.loadsaathi.in', 'localhost'];
  let safeUrl = '/';
  try {
    const u = new URL(targetUrl, self.location.origin);
    if ((u.protocol === 'http:' || u.protocol === 'https:') && ALLOWED_ORIGINS.includes(u.hostname)) {
      safeUrl = u.href;
    }
  } catch (_) {
    safeUrl = '/';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus an already-open tab and take it to the right page.
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) return client.navigate(safeUrl);
          return undefined;
        }
      }
      // Nothing open — open a new window.
      return self.clients.openWindow(safeUrl);
    })
  );
});
