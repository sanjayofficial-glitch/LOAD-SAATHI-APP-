import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import "./globals.css";

// Defer env validation + Capacitor OAuth to after first paint
// (they run zod validation + import heavy @capacitor/core)
function afterPaint(fn: () => void) {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(fn, { timeout: 2000 });
  } else {
    setTimeout(fn, 0);
  }
}

/**
 * In the Capacitor Android shell, the previous install's Service Worker can
 * survive APK updates (WebView data persists) and serve stale hashed chunks —
 * causing blank screens or outdated content after an update. Unregister + purge
 * caches so the native app always runs the freshly bundled build. No-op on web.
 */
function cleanupServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => reg.unregister());
    });
  }
  if (typeof caches !== 'undefined') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
}

afterPaint(() => {
  import("./config/env");
  import("@capacitor/core").then(({ Capacitor }) => {
    if (Capacitor.isNativePlatform()) {
      cleanupServiceWorker();
    }
  });
  import("./utils/capacitorOAuth").then(({ initCapacitorOAuth }) => initCapacitorOAuth());
});

async function mountApp() {
  try {
    const { default: App } = await import("./App");
    const rootElement = document.getElementById("root");
    if (!rootElement) throw new Error("Failed to find the root element");
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
        <Analytics />
        <SpeedInsights />
      </React.StrictMode>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[LoadSaathi] App failed to mount:", err);
    const rootElement = document.getElementById("root");
    if (rootElement) {
      // Build DOM safely — never inject raw error text into innerHTML
      rootElement.replaceChildren();
      const container = document.createElement('div');
      container.style.cssText = 'min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f9fafb;padding:24px;font-family:system-ui,-apple-system,sans-serif;';
      const card = document.createElement('div');
      card.style.cssText = 'max-width:480px;background:white;padding:32px;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.12);text-align:center;';
      const icon = document.createElement('div');
      icon.style.cssText = 'font-size:48px;margin-bottom:16px;';
      icon.textContent = '\u26A0\uFE0F';
      const h1 = document.createElement('h1');
      h1.style.cssText = 'font-size:20px;font-weight:700;color:#dc2626;margin:0 0 8px;';
      h1.textContent = 'Failed to Load App';
      const p = document.createElement('p');
      p.style.cssText = 'color:#6b7280;font-size:14px;margin:0 0 16px;line-height:1.5;';
      p.textContent = message;
      const btn = document.createElement('button');
      btn.textContent = 'Reload Page';
      btn.style.cssText = 'background:#ea580c;color:white;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;';
      btn.onclick = () => location.reload();
      card.append(icon, h1, p, btn);
      container.appendChild(card);
      rootElement.appendChild(container);
    }
  }
}

mountApp();