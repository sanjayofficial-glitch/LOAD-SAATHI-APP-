import { Capacitor } from "@capacitor/core";

/**
 * Initialize Capacitor OAuth handler for Clerk + Google sign-in.
 *
 * In a Capacitor Android app, after Google OAuth completes, Clerk redirects
 * to a URL like https://in.loadsaathi.app/choose-role or /?__clerk_oauth_redirect=...
 * This handler intercepts those redirects and ensures the SPA handles them
 * instead of the system browser opening a broken page.
 */
export function initCapacitorOAuth() {
  if (!Capacitor.isNativePlatform()) return;

  // Listen for the app being opened via a URL (OAuth callback)
  import("@capacitor/app").then(({ App }) => {
    App.addListener("appUrlOpen", (event) => {
      const url = event.url;
      console.log("[CapacitorOAuth] App opened via URL:", url);

      // Clerk OAuth callbacks contain these patterns
      const isClerkCallback =
        url.includes("__clerk_oauth_redirect") ||
        url.includes("__clerk_handshake") ||
        url.includes("__clerk_ticket") ||
        url.includes("/choose-role") ||
        url.includes("clerk.shared.lcl.dev") ||
        url.includes("clerk.loadsaathi.in");

      if (!isClerkCallback) return;

      // Preserve the full path + query string so Clerk can finish the
      // handshake (dropping the query breaks OAuth on the next load).
      let path = "/choose-role";
      try {
        const urlObj = new URL(url);
        const target = urlObj.pathname + urlObj.search;
        if (target && target !== "/") path = target;
      } catch {
        // Malformed URL — fall back to choose-role
      }

      console.log("[CapacitorOAuth] Navigating to:", path);

      // Navigate the SPA to handle the OAuth callback
      // Use replace to avoid back-button loop
      window.location.replace(path);
    });

    // Also handle when the app is restored from background
    App.addListener("resume", () => {
      console.log("[CapacitorOAuth] App resumed");
    });
  }).catch((err) => {
    console.warn("[CapacitorOAuth] Could not load @capacitor/app:", err);
  });
}
