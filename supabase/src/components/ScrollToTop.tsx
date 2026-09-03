import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls the window to the top on every route change.
 *
 * React Router does not reset the scroll position when navigating, so tapping
 * a footer/layout link (Blog, Gallery, etc.) would otherwise land the user at
 * the bottom of the new page with the content above the fold unreachable
 * without scrolling up.
 *
 * Uses an instant jump: the global `scroll-behavior: smooth` on <html> is
 * temporarily disabled so route changes snap to the top instead of animating
 * a slow scroll from the previous position.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    const prevScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = prevScrollBehavior;
  }, [pathname]);

  return null;
}
