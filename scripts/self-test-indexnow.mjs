#!/usr/bin/env node
/**
 * Self-test harness for the IndexNow implementation.
 *
 * Runs the validation logic and handler flow of api/indexnow.js and
 * api/cron/indexnow.js against mock fetch responses (no real network,
 * no IndexNow pings). Run with:
 *
 *   node scripts/self-test-indexnow.mjs
 *
 * Exit code 0 = all checks passed.
 */

import assert from 'node:assert/strict';

process.env.INDEXNOW_API_TOKEN = 'test-secret-token';
process.env.INDEXNOW_KEY = '9524fce83efa44d6845fabaaa587ee5c';
process.env.CRON_SECRET = '';

const { default: indexnowHandler } = await import('../api/indexnow.js');
const { default: indexnowCron } = await import('../api/cron/indexnow.js');

const makeRes = () => {
  const res = { statusCode: 200, headers: {}, body: null };
  res.statusCode = 200;
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.end = (b) => { res.body = b; };
  return res;
};

const call = (fn, req) => {
  const res = makeRes();
  return fn(req, res).then(() => ({ status: res.statusCode, body: JSON.parse(res.body) }));
};

/** Stub global fetch with a responder. */
function stubFetch(responder) {
  const original = globalThis.fetch;
  globalThis.fetch = async (...args) => {
    const r = await responder(...args);
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      text: async () => r.body ?? '',
    };
  };
  return () => { globalThis.fetch = original; };
}

let passed = 0;
const check = (name, fn) => {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
};

console.log('api/indexnow.js');
{
  check('GET → 405', async () => {
    const r = await call(indexnowHandler, { method: 'GET', headers: {}, body: '' });
    assert.equal(r.status, 405);
  });

  check('missing token → 401', async () => {
    const r = await call(indexnowHandler, { method: 'POST', headers: {}, body: '{}' });
    assert.equal(r.status, 401);
  });

  check('wrong token → 401', async () => {
    const r = await call(indexnowHandler, { method: 'POST', headers: { authorization: 'Bearer nope' }, body: '{}' });
    assert.equal(r.status, 401);
  });

  check('invalid JSON → 400', async () => {
    const r = await call(indexnowHandler, { method: 'POST', headers: { authorization: 'Bearer test-secret-token' }, body: '{bad' });
    assert.equal(r.status, 400);
  });

  check('empty urls → 400', async () => {
    const r = await call(indexnowHandler, { method: 'POST', headers: { authorization: 'Bearer test-secret-token' }, body: '{}' });
    assert.equal(r.status, 400);
  });

  const auth = { authorization: 'Bearer test-secret-token' };

  check('http:// rejected → 400', async () => {
    const r = await call(indexnowHandler, { method: 'POST', headers: auth, body: JSON.stringify({ urls: ['http://loadsaathi.in/'] }) });
    assert.equal(r.status, 400);
  });

  check('www host rejected → 400', async () => {
    const r = await call(indexnowHandler, { method: 'POST', headers: auth, body: JSON.stringify({ urls: ['https://www.loadsaathi.in/'] }) });
    assert.equal(r.status, 400);
  });

  check('query-string URL rejected → 400', async () => {
    const r = await call(indexnowHandler, { method: 'POST', headers: auth, body: JSON.stringify({ urls: ['https://loadsaathi.in/search?q=x'] }) });
    assert.equal(r.status, 400);
  });

  check('admin/login/api/share/screens paths rejected → 400', async () => {
    const bad = [
      'https://loadsaathi.in/admin/users',
      'https://loadsaathi.in/login',
      'https://loadsaathi.in/trucker/dashboard',
      'https://loadsaathi.in/shipper/dashboard',
      'https://loadsaathi.in/profile',
      'https://loadsaathi.in/messages',
      'https://loadsaathi.in/api/agent',
      'https://loadsaathi.in/share/trip/123',
      'https://loadsaathi.in/screens/phone',
      'https://loadsaathi.in/onboarding',
    ];
    const r = await call(indexnowHandler, { method: 'POST', headers: auth, body: JSON.stringify({ urls: bad }) });
    assert.equal(r.status, 400);
  });

  check('valid URLs submitted, unknown path rejected → 200/200', async () => {
    const unstick = stubFetch(async (url, init) => {
      assert.equal(url, 'https://api.indexnow.org/indexnow');
      const payload = JSON.parse(init.body);
      assert.equal(payload.host, 'loadsaathi.in');
      assert.equal(payload.key, '9524fce83efa44d6845fabaaa587ee5c');
      assert.equal(payload.keyLocation, 'https://loadsaathi.in/9524fce83efa44d6845fabaaa587ee5c.txt');
      assert.deepEqual(payload.urlList, [
        'https://loadsaathi.in/',
        'https://loadsaathi.in/blog/reduce-empty-kilometers',
        'https://loadsaathi.in/routes/rourkela-to-ranchi',
      ]);
      return { status: 200, body: 'ok' };
    });
    try {
      const urls = [
        'https://loadsaathi.in/',
        'https://loadsaathi.in/blog/reduce-empty-kilometers',
        'https://loadsaathi.in/routes/rourkela-to-ranchi',
        'https://loadsaathi.in/some-unknown-page',
      ];
      const r = await call(indexnowHandler, { method: 'POST', headers: auth, body: JSON.stringify({ urls }) });
      assert.equal(r.status, 200);
      assert.equal(r.body.ok, true);
      assert.equal(r.body.submitted, 3);
      assert.equal(r.body.rejected.length, 1);
    } finally {
      unstick();
    }
  });

  check('429 rate limit surfaces as 429', async () => {
    const unstick = stubFetch(async () => ({ status: 429, body: 'rate limited' }));
    try {
      const r = await call(indexnowHandler, { method: 'POST', headers: auth, body: JSON.stringify({ urls: ['https://loadsaathi.in/'] }) });
      assert.equal(r.status, 429);
    } finally {
      unstick();
    }
  });
}

console.log('api/cron/indexnow.js');
{
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://loadsaathi.in/</loc><lastmod>2026-10-01</lastmod></url>
  <url><loc>https://loadsaathi.in/about</loc><lastmod>2026-10-01</lastmod></url>
  <url><loc>https://loadsaathi.in/blog/new-post-today</loc><lastmod>2026-11-12</lastmod></url>
  <url><loc>https://loadsaathi.in/routes/ranchi-to-kolkata</loc><lastmod>2026-11-11</lastmod></url>
  <url><loc>https://loadsaathi.in/blog/old-post</loc><lastmod>2026-08-01</lastmod></url>
</urlset>`;

  check('eligible = homepage + lastmod ≤72h; old posts skipped → 200', async () => {
    const unstick = stubFetch(async (url, init) => {
      if (String(url).includes('sitemap.xml')) {
        return { status: 200, body: sitemapXml };
      }
      const payload = JSON.parse(init.body);
      assert.deepEqual(payload.urlList.sort(), [
        'https://loadsaathi.in/',
        'https://loadsaathi.in/blog/new-post-today',
        'https://loadsaathi.in/routes/ranchi-to-kolkata',
      ].sort());
      return { status: 200, body: 'ok' };
    });
    try {
      const r = await call(indexnowCron, { method: 'GET', headers: {} });
      assert.equal(r.status, 200);
      assert.equal(r.body.submitted, 3);
    } finally {
      unstick();
    }
  });

  check('missing INDEXNOW_KEY → 503', async () => {
    const saved = process.env.INDEXNOW_KEY;
    delete process.env.INDEXNOW_KEY;
    try {
      const r = await call(indexnowCron, { method: 'GET', headers: {} });
      assert.equal(r.status, 503);
    } finally {
      process.env.INDEXNOW_KEY = saved;
    }
  });
}

console.log(`\nAll ${passed} check(s) passed.`);
