import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/**
 * MapSizeHandler — fixes Leaflet's "0×0 map pane" bug.
 *
 * The leaflet map measures itself against its container at mount, so when the
 * container is hidden, lazy-loaded, or inside an animated tab transition the
 * measured size is 0×0 and the map renders blank. A single 150ms setTimeout
 * catches the common case but fails when the parent takes longer to lay out
 * (e.g. inside a `React.lazy` route transition, a Radix Tabs content panel,
 * or a Framer Motion height animation).
 *
 * This handler:
 *   1. Calls invalidateSize() once after the initial mount.
 *   2. Subscribes a ResizeObserver to the parent element and re-invalidates
 *      whenever the container resizes, so animated parents, font-load shifts,
 *      and orientation changes all recover the correct size.
 *   3. Fires one additional invalidateSize() via requestAnimationFrame as a
 *      safety net for layout that completes after the first microtask.
 */
export default function MapSizeHandler(): null {
  const map = useMap();

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;

    const container = map.getContainer();
    const parent = container.parentElement;
    if (!parent) return;

    // Initial invalidations cover the common mount paths.
    const initialTimer = window.setTimeout(() => map.invalidateSize(), 150);
    const rafId = window.requestAnimationFrame(() => map.invalidateSize());

    // Observe the *parent* (not the map container itself) because the map
    // container's size is what Leaflet owns — the parent is the element the
    // app actually resizes.
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(parent);

    return () => {
      window.clearTimeout(initialTimer);
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [map]);

  return null;
}