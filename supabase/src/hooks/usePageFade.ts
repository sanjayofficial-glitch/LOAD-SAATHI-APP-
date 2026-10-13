import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * Restarts a subtle opacity fade on the element it is attached to every time
 * the route changes. Opacity-only on purpose: a transform animation on an
 * ancestor would make `position: fixed` children (dock, FABs, tab bar) resolve
 * against that ancestor instead of the viewport.
 *
 * Usage: `const ref = usePageFade(); return <main ref={ref} className="...">`
 * (a `page-fade` animation is applied automatically).
 */
export function usePageFade<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);
  const { pathname } = useLocation();
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    // Restart the CSS animation: remove, force reflow, re-add.
    el.classList.remove("page-fade");
    void el.offsetWidth;
    el.classList.add("page-fade");
  }, [pathname, reduce]);

  return ref;
}

export default usePageFade;
