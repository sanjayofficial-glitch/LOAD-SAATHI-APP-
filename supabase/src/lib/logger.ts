const isDev = import.meta.env.DEV;

function formatMessage(tag: string, message: string): string {
  return `[${tag}] ${message}`;
}

let posthogReady = false;
let posthogRef: { capture: (event: string, props: Record<string, unknown>) => void } | null = null;

async function ensurePosthog(): Promise<typeof posthogRef> {
  if (posthogReady) return posthogRef;
  try {
    const mod = await import('@/utils/posthog');
    posthogRef = mod.posthog as unknown as typeof posthogRef;
    posthogReady = true;
  } catch {
    posthogReady = true;
  }
  return posthogRef;
}

export function createLogger(tag: string) {
  return {
    debug: (message: string, ...args: unknown[]) => {
      if (isDev) console.debug(formatMessage(tag, message), ...args);
    },
    info: (message: string, ...args: unknown[]) => {
      if (isDev) console.info(formatMessage(tag, message), ...args);
    },
    warn: (message: string, ...args: unknown[]) => {
      console.warn(formatMessage(tag, message), ...args);
      ensurePosthog()?.then((ph) => ph?.capture('log_warn', { tag, message, extra: args }));
    },
    error: (message: string, ...args: unknown[]) => {
      console.error(formatMessage(tag, message), ...args);
      ensurePosthog()?.then((ph) => ph?.capture('log_error', { tag, message, extra: args }));
    },
  };
}

export const logger = createLogger('app');
