import { posthog } from "@/utils/posthog";

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
  CALCULATOR_STARTED: "calculator_started",
  ESTIMATE_GENERATED: "estimate_generated",
  ROUTE_VIEW: "route_view",
  QUOTE_REQUESTED: "quote_requested",
  WHATSAPP_CLICKED: "whatsapp_clicked",
  REGISTER_STARTED: "register_started",
  ARTICLE_VIEW: "article_view",
} as const;

type EventName = (typeof EVENTS)[keyof typeof EVENTS];

// Shared properties for public-funnel events
interface BaseEventProps {
  role?: "shipper" | "trucker";
}

export function trackEvent(name: EventName, props?: Record<string, unknown> & BaseEventProps) {
  try {
    posthog.capture(name, props);
  } catch {
    // PostHog may not be loaded yet — silent no-op
  }
}

// Convenience wrappers

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

export function trackQuoteRequested(props: {
  name: string;
  phone: string;
  role?: "shipper" | "trucker";
  route?: string;
  origin?: string;
  destination?: string;
  weight?: number;
}) {
  trackEvent(EVENTS.QUOTE_REQUESTED, props);
}

export function trackWhatsappClicked(props: {
  channel: "quote" | "share" | "route";
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
