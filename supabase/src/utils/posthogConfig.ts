/**
 * Single source of truth for "is PostHog configured in this build?".
 *
 * Deliberately free of any `posthog-js` import so eagerly-loaded modules
 * (analytics, PostHogProvider) can consult it without pulling the ~324KB SDK
 * into the entry chunk.
 *
 * A placeholder key (the `phc_xxxx...` shipped in .env / .env.example, or a
 * `ROTATE_ME` marker) counts as *not configured*: initializing with it makes
 * the SDK inject `array/<bad-token>/config.js` and POST events that PostHog
 * silently drops, which looks like "PostHog is installed" while recording
 * nothing at all.
 */

const REAL_KEY = /^phc_[A-Za-z0-9_-]{16,}$/;
const PLACEHOLDER_KEY = /^(x+|ROTATE_ME)/i;

export function getPostHogApiKey(): string | undefined {
  const key = import.meta.env.VITE_POSTHOG_API_KEY?.trim();
  if (!key || !REAL_KEY.test(key) || PLACEHOLDER_KEY.test(key.slice(4))) {
    return undefined;
  }
  return key;
}

export function getPostHogHost(): string | undefined {
  const host = import.meta.env.VITE_POSTHOG_HOST?.trim();
  return host || undefined;
}

export function isPostHogEnabled(): boolean {
  return Boolean(getPostHogApiKey() && getPostHogHost());
}
