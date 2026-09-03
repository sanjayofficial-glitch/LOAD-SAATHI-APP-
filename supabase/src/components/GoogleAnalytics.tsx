import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { GA_MEASUREMENT_ID } from "@/utils/analytics";

/**
 * Custom hook / component to track SPA page views in Google Analytics 4
 */
export function GoogleAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("config", GA_MEASUREMENT_ID, {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return null;
}
