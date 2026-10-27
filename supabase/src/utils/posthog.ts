import posthog from 'posthog-js'
import { getPostHogApiKey, getPostHogHost } from '@/utils/posthogConfig'

const POSTHOG_API_KEY = getPostHogApiKey()
const POSTHOG_HOST = getPostHogHost()

if (POSTHOG_API_KEY && POSTHOG_HOST) {
  posthog.init(POSTHOG_API_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: 'https://us.posthog.com',
    // 'history_change' — not `true`. The SDK only records a $pageview on
    // React Router navigations when this is 'history_change' (or an object
    // with path/search/hash); with `true` only the full page load counts.
    capture_pageview: 'history_change',
    capture_pageleave: true,
    autocapture: {
      dom_event_allowlist: ['click', 'submit', 'change'],
      url_allowlist: ['/dashboard', '/trucker', '/shipper', '/admin', '/favorites', '/chat', '/profile', '/browse-trips', '/browse-shipments'],
      element_allowlist: ['a', 'button', 'input', 'select', 'textarea', 'form'],
      // No `css_selector_allowlist`: the SDK ANDs every allowlist, so requiring
      // [data-attr] (which no element in the app carries) silenced every
      // autocapture event. Tag elements explicitly only if we ever want to
      // narrow this again — and then drop the other allowlists to match.
    },
    capture_exceptions: true,
    // Safe to set even while Session Replay is off in project settings: the
    // recorder is only constructed from PostHog's remote config, so this only
    // supplies privacy options if/when replay gets switched on.
    session_recording: {
      maskAllInputs: true,
    },
    persistence: 'localStorage+cookie',
    rageclick: false,
    loaded: (ph) => {
      if (import.meta.env.DEV) {
        ph.loadToolbar({
          token: POSTHOG_API_KEY,
          toolbarVersion: 'toolbar',
          instrument: true,
          dataAttributes: ['data-attr'],
        })
      }
    },
  })
}

export { posthog }
