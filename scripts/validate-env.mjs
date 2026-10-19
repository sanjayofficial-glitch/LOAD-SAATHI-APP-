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

console.log('[validate-env] required keys detected — proceeding.');
