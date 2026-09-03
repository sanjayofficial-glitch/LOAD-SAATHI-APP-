import { useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';

/**
 * Tracks whether the user has manually taken control of the map view
 * (drag, double-click, mouse wheel, touch/pinch, or the custom zoom
 * buttons — which fire a `userzoom` map event). Returns a ref that
 * flips to `true` on first interaction and stays true afterwards.
 *
 * Used by <FitBounds> so auto-fit hands over control once the user
 * zooms or pans manually, instead of yanking the view back.
 */
export function useMapUserInteraction(map: LeafletMap) {
  const userInteracted = useRef(false);

  useEffect(() => {
    const mark = () => {
      userInteracted.current = true;
    };
    const container = map.getContainer();

    map.on('dragstart', mark);
    map.on('dblclick', mark);
    map.on('userzoom', mark);
    container.addEventListener('wheel', mark, { passive: true });
    container.addEventListener('touchstart', mark, { passive: true });

    return () => {
      map.off('dragstart', mark);
      map.off('dblclick', mark);
      map.off('userzoom', mark);
      container.removeEventListener('wheel', mark);
      container.removeEventListener('touchstart', mark);
    };
  }, [map]);

  return userInteracted;
}
