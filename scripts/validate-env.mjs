import { readFileSync } from 'node:fs';

// Minimal build-time guard: check that the .env exists and declares required keys.
// We intentionally do NOT ship secret values — CI/production use Vercel env + secrets.
const REQUIRED = [
  'VITE_CLERK_PUBLISHABLE_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

let content = '';
try {
  content = readFileSync('.env', 'utf8');
} catch {
  console.error(
    '\n[validate-env] Missing .env file.\n' +
      'Copy .env.example → .env and fill the required keys (or set them on Vercel).\n',
  );
  process.exit(1);
}

const lines = content.split(/\r?\n/);
const values = {};
for (const line of lines) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) {
    values[m[1]] = m[2];
  }
}

const missing = REQUIRED.filter((key) => !values[key] || values[key].startsWith('pk_') === false && key === 'VITE_CLERK_PUBLISHABLE_KEY');
const empty = REQUIRED.filter((key) => !values[key]);

if (empty.length) {
  console.error(
    `\n[validate-env] Missing required values: ${empty.join(', ')}\n` +
      'Provide them in .env (local) or as Vercel build environment variables.\n',
  );
  process.exit(1);
}

console.log('[validate-env] required keys detected — proceeding.');
