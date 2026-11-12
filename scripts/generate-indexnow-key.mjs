#!/usr/bin/env node
/**
 * IndexNow key-file integrity guard — runs in `prebuild`.
 *
 * The IndexNow verification file lives at public/<key>.txt (public by design).
 * This script keeps the committed key file and the build environment in sync:
 *
 *   - If INDEXNOW_KEY is set: validate its format and, if the matching key
 *     file does not exist yet, create it. If it exists but contains a
 *     different key, FAIL the build (drift — a wrong key silently breaks
 *     IndexNow ownership proof).
 *   - If INDEXNOW_KEY is unset (CI/local): the committed key file is the
 *     source of truth. Warn if it is missing or if multiple key files exist.
 *
 * The key is never invented here — it always comes from the environment or
 * from an already-committed key file.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const KEY_RE = /^[A-Za-z0-9-]{8,128}$/;

const key = (process.env.INDEXNOW_KEY || '').trim();

if (key) {
  if (!KEY_RE.test(key)) {
    console.error('[indexnow-key] INDEXNOW_KEY is invalid (need 8–128 chars: a-z, A-Z, 0-9, dashes).');
    process.exit(1);
  }
  const keyFile = path.join(PUBLIC_DIR, `${key}.txt`);
  if (!fs.existsSync(keyFile)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    fs.writeFileSync(keyFile, `${key}\n`, 'utf-8');
    console.log(`[indexnow-key] created ${path.relative(ROOT, keyFile)}`);
  } else {
    const existing = fs.readFileSync(keyFile, 'utf-8').trim();
    if (existing !== key) {
      console.error(
        `[indexnow-key] MISMATCH: ${path.relative(ROOT, keyFile)} contains a different key than INDEXNOW_KEY.`,
      );
      process.exit(1);
    }
    console.log(`[indexnow-key] ok — ${path.relative(ROOT, keyFile)} matches INDEXNOW_KEY`);
  }
  process.exit(0);
}

// No env key → rely on the committed file(s). Key files are detected by
// CONTENT (trimmed file is exactly 8–128 hex chars), not by filename, so
// unrelated root .txt files (llms-full.txt, security.txt, …) are ignored.
if (!fs.existsSync(PUBLIC_DIR)) {
  console.warn('[indexnow-key] public/ missing — skipping key-file check');
  process.exit(0);
}
const KEY_CONTENT_RE = /^[a-z0-9-]{8,128}$/i;
const keyFiles = fs
  .readdirSync(PUBLIC_DIR)
  .filter((f) => f.endsWith('.txt'))
  .filter((f) => {
    try {
      const content = fs.readFileSync(path.join(PUBLIC_DIR, f), 'utf-8').trim();
      return KEY_CONTENT_RE.test(content);
    } catch {
      return false;
    }
  });
if (keyFiles.length === 0) {
  console.warn('[indexnow-key] no IndexNow key file found in public/ — set INDEXNOW_KEY or commit <key>.txt');
} else if (keyFiles.length > 1) {
  console.warn(`[indexnow-key] multiple key files found in public/: ${keyFiles.join(', ')} — remove stale ones`);
} else {
  console.log(`[indexnow-key] using committed key file: ${keyFiles[0]}`);
}
