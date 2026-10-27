import { readFileSync } from 'node:fs';

// Build-time guard: the three keys the client bundle needs must exist somewhere.
// Vercel/CI injects them as real environment variables (no .env file is ever
// materialized there); local dev keeps using .env. We intentionally do NOT
// ship secret values — CI/production use Vercel env + secrets.
const REQUIRED = [
  'VITE_CLERK_PUBLISHABLE_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

// Start from the process environment, then let a local .env file override.
const values = { ...process.env };
try {
  const lines = readFileSync('.env', 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) {
      values[m[1]] = m[2].trim();
    }
  }
} catch {
  // No .env file — fine on CI/production, which use Vercel env vars.
}

const empty = REQUIRED.filter((key) => !values[key]);
if (empty.length) {
  console.error(
    `\n[validate-env] Missing required values: ${empty.join(', ')}\n` +
      'Set them in .env (local) or as Vercel build environment variables.\n',
  );
  process.exit(1);
}

if (!values.VITE_CLERK_PUBLISHABLE_KEY.startsWith('pk_')) {
  console.error('\n[validate-env] VITE_CLERK_PUBLISHABLE_KEY must be a publishable key (pk_...).\n');
  process.exit(1);
}

// PostHog is optional — the client disables itself without a usable key — so
// this warns instead of failing the build. But a placeholder left in .env
// ships a build that *looks* instrumented while recording nothing, which is
// exactly the failure we want surfaced here.
const posthogKey = (values.VITE_POSTHOG_API_KEY || '').trim();
const posthogLooksReal = /^phc_[A-Za-z0-9_-]{16,}$/.test(posthogKey) && !/^x+$/i.test(posthogKey.slice(4));
if (!posthogKey) {
  console.warn('[validate-env] VITE_POSTHOG_API_KEY not set — PostHog analytics will be OFF.');
} else if (!posthogLooksReal) {
  console.warn(
    '[validate-env] VITE_POSTHOG_API_KEY is a placeholder — PostHog analytics will be OFF.\n' +
      '               Set the real project key (phc_...) in Vercel → Settings → Environment Variables.',
  );
}

// Web Push is optional — without VITE_VAPID_PUBLIC_KEY the bell's
// "Enable push notifications" button reports push as unconfigured and the
// app falls back to in-app-only notifications. Warn so the gap is visible
// at build time rather than discovered by a user.
const vapidPublicKey = (values.VITE_VAPID_PUBLIC_KEY || '').trim();
if (!vapidPublicKey) {
  console.warn('[validate-env] VITE_VAPID_PUBLIC_KEY not set — Web Push notifications will be OFF.');
} else if (!/^[A-Za-z0-9_-]{80,}$/.test(vapidPublicKey)) {
  console.warn(
    '[validate-env] VITE_VAPID_PUBLIC_KEY does not look like a base64url VAPID key — Web Push will fail.',
  );
}

console.log('[validate-env] required keys detected — proceeding.');
