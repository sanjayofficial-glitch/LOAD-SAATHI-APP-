import { useEffect, type ReactNode } from 'react'

/**
 * PostHog is loaded lazily after first paint so the ~50KB analytics library
 * never blocks the app shell. The standalone posthog-js client handles
 * autocapture + pageview capture on its own; no React context hooks are
 * used elsewhere in the app (verified), so the provider wrapper is optional.
 *
 * We still initialize the client via '@/utils/posthog' (which self-inits) so
 * all existing `posthog.capture(...)` calls keep working.
 */
export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (
      !import.meta.env.VITE_POSTHOG_API_KEY ||
      !import.meta.env.VITE_POSTHOG_HOST ||
      import.meta.env.VITE_POSTHOG_API_KEY.includes('ROTATE_ME')
    ) {
      return
    }

    let cancelled = false
    const load = () => {
      if (cancelled) return
      // Dynamic import: pulls posthog-js into a separate chunk that only
      // downloads after the browser is idle (never on the critical path).
      import('@/utils/posthog').catch(() => {
        // Analytics failure must never break the app
      })
    }

    const idleWindow = window as Window & typeof globalThis & {
      requestIdleCallback?: (cb: () => void, options?: { timeout?: number }) => number
      cancelIdleCallback?: (id: number) => void
    }

    if (idleWindow.requestIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(load, { timeout: 3000 })
      return () => {
        cancelled = true
        idleWindow.cancelIdleCallback?.(idleId)
      }
    }

    const timeoutId = setTimeout(load, 1500)
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [])

  return <>{children}</>
}
