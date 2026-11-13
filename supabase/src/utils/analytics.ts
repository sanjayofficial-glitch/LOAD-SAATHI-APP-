import { track } from "@vercel/analytics/react";
import { isPostHogEnabled } from "@/utils/posthogConfig";

// posthog-js is loaded on demand instead of statically: a static import here
// would put the SDK in the entry chunk (analytics is imported by App.tsx), and
// every route that tracks an event would drag it in too. The dynamic import is
// deduped, so the SDK still only ever loads once — off the critical path.
let posthogModule: Promise<typeof import("@/utils/posthog")> | null = null;
const loadPostHog = () => {
  if (!posthogModule) posthogModule = import("@/utils/posthog");
  return posthogModule;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    cookiehub?: { open: () => void; close: () => void; hasAnswered: () => boolean };
  }
}

export const GA_MEASUREMENT_ID = "G-GEFWPQNHT6";

/**
 * Send custom events to Google Analytics
 */
export const trackGAEvent = (eventName: string, eventParams?: Record<string, unknown>) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, eventParams);
  }
};

// Typed event names for the public acquisition funnel
export const EVENTS = {
  ORGANIC_LANDING: "organic_landing",
  CALCULATOR_STARTED: "calculator_started",
  ESTIMATE_GENERATED: "estimate_generated",
  ROUTE_VIEW: "route_view",
  QUOTE_REQUESTED: "quote_requested",
  QUOTE_FORM_START: "quote_form_start",
  QUOTE_FORM_SUBMIT: "quote_form_submit",
  QUOTE_FORM_SUCCESS: "quote_form_success",
  POST_LOAD_CLICK: "post_load_click",
  POST_LOAD_START: "post_load_start",
  POST_LOAD_SUBMIT: "post_load_submit",
  POST_LOAD_SUCCESS: "post_load_success",
  LOAD_FORM_START: "load_form_start",
  LOAD_SUBMITTED: "load_submitted",
  TRANSPORTER_SIGNUP_START: "transporter_signup_start",
  TRANSPORTER_SIGNUP_COMPLETE: "transporter_signup_complete",
  SHIPPER_SIGNUP_COMPLETE: "shipper_signup_complete",
  CLICK_PHONE: "phone_click",
  CLICK_EMAIL: "click_email",
  VIEW_SERVICE_PAGE: "view_service_page",
  VIEW_LOCATION_PAGE: "view_location_page",
  VIEW_ROUTE_PAGE: "view_route_page",
  VIEW_GUIDE: "view_guide",
  VIEW_PRICING_OR_RATE_GUIDE: "view_pricing_or_rate_guide",
  INTERNAL_CTA_CLICK: "internal_cta_click",
  TOOL_COMPLETED: "tool_completed",
  WHATSAPP_CLICKED: "whatsapp_click",
  REGISTER_STARTED: "register_started",
  ARTICLE_VIEW: "article_view",
  WHATSAPP_LEAD_STARTED: "whatsapp_lead_started",
  PHONE_ADDED: "phone_added",
  PHONE_SKIPPED: "phone_skipped",
  PHONE_NUDGE_CLICKED: "phone_nudge_clicked",
  FREDDY_OPEN: "freddy_open",
  FREDDY_SEND: "freddy_send",
  FREDDY_TURN: "freddy_turn",
  FREDDY_BOOK_CLICK: "freddy_book_click",
} as const;

// Shared properties for public-funnel events
interface BaseEventProps {
  role?: "shipper" | "trucker";
}

function toVercelProps(props?: Record<string, unknown>): Record<string, string | number | boolean> | undefined {
  if (!props) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === "string" || typeof value === "boolean") {
      out[key] = value;
    } else if (typeof value === "number" && Number.isFinite(value)) {
      out[key] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function trackEvent(name: string, props?: Record<string, unknown> & BaseEventProps) {
  if (isPostHogEnabled()) {
    loadPostHog()
      .then(({ posthog }) => posthog.capture(name, props))
      .catch(() => {
        // Analytics failure must never break the app
      });
  }
  try {
    const vercelProps = toVercelProps(props);
    if (vercelProps) {
      track(name, vercelProps);
    } else {
      track(name);
    }
  } catch {
    // Vercel analytics unavailable — silent no-op
  }
}

// Convenience wrappers

const ORGANIC_TRACKED_KEY = "ls_organic_landing_tracked";

/**
 * Track the first landing attributed to organic search (once per session).
 * No PII. Uses referrer + UTM source; safe to call on every page mount.
 */
export function trackOrganicLanding() {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(ORGANIC_TRACKED_KEY)) return;
    sessionStorage.setItem(ORGANIC_TRACKED_KEY, "1");
  } catch {
    // sessionStorage unavailable — best-effort tracking only
  }
  const referrer = typeof document !== "undefined" ? document.referrer : "";
  let utmSource = "";
  try {
    utmSource = new URLSearchParams(window.location.search).get("utm_source") || "";
  } catch {
    // ignore malformed query
  }
  const isOrganic =
    !referrer ||
    /google|bing|duckduckgo|yahoo|yandex|baidu|ecosia/i.test(referrer) ||
    utmSource.toLowerCase() === "organic" ||
    utmSource.toLowerCase() === "google";
  if (!isOrganic) return;
  let referrerHost = "direct";
  try {
    referrerHost = referrer ? new URL(referrer).hostname : "direct";
  } catch {
    referrerHost = "direct";
  }
  trackEvent(EVENTS.ORGANIC_LANDING, { referrer: referrerHost, utm_source: utmSource });
}

/** User clicks the "Post a Load / Get a Transport Quote" CTA. No PII. */
export function trackPostLoadClick(props: { source: string }) {
  trackEvent(EVENTS.POST_LOAD_CLICK, props);
}

/** User starts completing the structured load form (fires once per mount). */
export function trackLoadFormStart(props?: Record<string, unknown>) {
  trackEvent(EVENTS.LOAD_FORM_START, props);
}

/** Valid load form submission succeeds (an enquiry, not necessarily qualified). */
export function trackLoadSubmitted(props?: Record<string, unknown>) {
  trackEvent(EVENTS.LOAD_SUBMITTED, props);
}

export function trackCalculatorStarted(props?: { origin?: string; destination?: string; weight?: number }) {
  trackEvent(EVENTS.CALCULATOR_STARTED, {
    origin: props?.origin,
    destination: props?.destination,
    weight: props?.weight,
  });
}

export function trackEstimateGenerated(props: {
  origin: string;
  destination: string;
  route: string;
  weight: number;
  avg_price: number;
  min_price: number;
  max_price: number;
  source: "market_data" | "fallback" | string;
}) {
  trackEvent(EVENTS.ESTIMATE_GENERATED, props);
}

export function trackRouteView(props: {
  route_slug: string;
  origin: string;
  destination: string;
  distance_km?: number;
}) {
  trackEvent(EVENTS.ROUTE_VIEW, props);
}

/**
 * Track a quote request. NEVER include PII (name, phone, email, address).
 * Use a privacy-safe lead ID or omit identifying fields entirely.
 */
export function trackQuoteRequested(props: {
  role?: "shipper" | "trucker";
  route?: string;
  origin?: string;
  destination?: string;
  weight?: number;
  lead_id?: string; // privacy-safe internal ID, not PII
}) {
  trackEvent(EVENTS.QUOTE_REQUESTED, props);
}

export function trackQuoteFormStart(props?: {
  origin?: string;
  destination?: string;
  weight?: number;
}) {
  trackEvent(EVENTS.QUOTE_FORM_START, props);
}

export function trackQuoteFormSubmit(props?: {
  origin?: string;
  destination?: string;
  weight?: number;
}) {
  trackEvent(EVENTS.QUOTE_FORM_SUBMIT, props);
}

export function trackQuoteFormSuccess(props?: {
  origin?: string;
  destination?: string;
  weight?: number;
  lead_id?: string;
}) {
  trackEvent(EVENTS.QUOTE_FORM_SUCCESS, props);
}

export function trackPostLoadStart(props?: {
  origin?: string;
  destination?: string;
  weight?: number;
}) {
  trackEvent(EVENTS.POST_LOAD_START, props);
}

export function trackPostLoadSubmit(props?: {
  origin?: string;
  destination?: string;
  weight?: number;
}) {
  trackEvent(EVENTS.POST_LOAD_SUBMIT, props);
}

export function trackPostLoadSuccess(props?: {
  origin?: string;
  destination?: string;
  weight?: number;
  lead_id?: string;
}) {
  trackEvent(EVENTS.POST_LOAD_SUCCESS, props);
}

export function trackTransporterSignupStart(props?: { source?: string }) {
  trackEvent(EVENTS.TRANSPORTER_SIGNUP_START, props);
}

export function trackTransporterSignupComplete(props?: { lead_id?: string }) {
  trackEvent(EVENTS.TRANSPORTER_SIGNUP_COMPLETE, props);
}

export function trackShipperSignupComplete(props?: { lead_id?: string }) {
  trackEvent(EVENTS.SHIPPER_SIGNUP_COMPLETE, props);
}

export function trackPhoneClick(props?: { page_type?: string; cta_location?: string }) {
  trackEvent(EVENTS.CLICK_PHONE, props);
}

export function trackEmailClick(props?: { page_type?: string; cta_location?: string }) {
  trackEvent(EVENTS.CLICK_EMAIL, props);
}

export function trackServicePageView(props: {
  service_type: string;
  state?: string;
  city?: string;
}) {
  trackEvent(EVENTS.VIEW_SERVICE_PAGE, props);
}

export function trackLocationPageView(props: {
  city: string;
  state: string;
}) {
  trackEvent(EVENTS.VIEW_LOCATION_PAGE, props);
}

export function trackRoutePageView(props: {
  route_slug: string;
  origin: string;
  destination: string;
  distance_km?: number;
}) {
  trackEvent(EVENTS.VIEW_ROUTE_PAGE, props);
}

export function trackGuideView(props: {
  slug: string;
  category?: string;
}) {
  trackEvent(EVENTS.VIEW_GUIDE, props);
}

export function trackPricingView(props?: { page_type?: string }) {
  trackEvent(EVENTS.VIEW_PRICING_OR_RATE_GUIDE, props);
}

export function trackInternalCtaClick(props: {
  cta_location: string;
  cta_text: string;
  page_type: string;
}) {
  trackEvent(EVENTS.INTERNAL_CTA_CLICK, props);
}

export function trackWhatsappClicked(props: {
  channel: "quote" | "share" | "route" | "owner";
  origin?: string;
  destination?: string;
  route?: string;
}) {
  trackEvent(EVENTS.WHATSAPP_CLICKED, props);
}

export function trackRegisterStarted(props?: { role?: "shipper" | "trucker"; source?: string }) {
  trackEvent(EVENTS.REGISTER_STARTED, props);
}

export function trackArticleView(props: {
  slug: string;
  title: string;
  category?: string;
}) {
  trackEvent(EVENTS.ARTICLE_VIEW, props);
}

/**
 * Fired when a public tool produces a result (a "tool completion").
 * Used to measure tool completions rather than raw page visits.
 */
export function trackToolCompleted(props: { tool: string; [key: string]: unknown }) {
  trackEvent(EVENTS.TOOL_COMPLETED, props);
}

export type FreddyTurnProps = {
  ok: boolean;
  tool?: string | null;
  fallback?: boolean;
  latency_ms?: number;
};

/** One completed Freddy chat turn (any outcome). No PII. */
export function trackFreddyTurn(props: FreddyTurnProps) {
  trackEvent(EVENTS.FREDDY_TURN, props);
}
