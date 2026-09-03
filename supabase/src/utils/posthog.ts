import posthog from 'posthog-js'

const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST

if (POSTHOG_API_KEY && POSTHOG_HOST && !POSTHOG_API_KEY.includes('ROTATE_ME')) {
  posthog.init(POSTHOG_API_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: 'https://us.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: {
      dom_event_allowlist: ['click', 'submit', 'change'],
      url_allowlist: ['/dashboard', '/trucker', '/shipper', '/admin', '/favorites', '/chat', '/profile', '/browse-trips', '/browse-shipments'],
      element_allowlist: ['a', 'button', 'input', 'select', 'textarea', 'form'],
      css_selector_allowlist: ['[data-attr]', '[data-capture]'],
    },
    capture_exceptions: true,
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
