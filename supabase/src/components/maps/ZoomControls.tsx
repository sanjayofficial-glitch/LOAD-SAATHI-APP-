import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Plus, Minus, Maximize2 } from 'lucide-react';

interface ZoomControlsProps {
  /** Marker positions used by the "fit all" button. */
  positions: [number, number][];
}

/**
 * Center the map on the given positions: a single point zooms to level 12,
 * multiple points fit the full bounds with a padding margin.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function fitPositionsToBounds(map: L.Map, positions: [number, number][]) {
  if (positions.length === 1) {
    const only = positions[0];
    if (only) map.setView(only, 12);
  } else if (positions.length > 1) {
    map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });
  }
}

/**
 * Custom zoom controls (zoom in / zoom out / fit all markers).
 *
 * Rendered inside <MapContainer> so it can reach the map instance. Positioned
 * bottom-right, clear of the legend (bottom-left) and the attribution line.
 * Every button click fires a custom `userzoom` map event so <FitBounds> stops
 * auto-refitting the view once the user has taken control of the zoom.
 */
export default React.memo(function ZoomControls({ positions }: ZoomControlsProps) {
  const map = useMap();
  const [zoomLevel, setZoomLevel] = useState<number>(() => map.getZoom());

  // Keep the +/- disabled state in sync with the actual zoom level.
  useEffect(() => {
    const onZoomEnd = () => setZoomLevel(map.getZoom());
    map.on('zoomend', onZoomEnd);
    return () => {
      map.off('zoomend', onZoomEnd);
    };
  }, [map]);

  const maxZoom = map.getMaxZoom();
  const minZoom = map.getMinZoom();
  const atMaxZoom = Number.isFinite(maxZoom) && zoomLevel >= maxZoom;
  const atMinZoom = zoomLevel <= minZoom;

  const zoomIn = () => {
    map.zoomIn();
    map.fire('userzoom');
  };

  const zoomOut = () => {
    map.zoomOut();
    map.fire('userzoom');
  };

  const fitAll = () => {
    fitPositionsToBounds(map, positions);
    map.fire('userzoom');
  };

  const buttonClass =
    'w-11 h-11 flex items-center justify-center text-gray-700 dark:text-gray-200 ' +
    'transition-colors duration-150 ' +
    'hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-600 dark:hover:text-orange-400 ' +
    'active:scale-90 disabled:opacity-35 disabled:pointer-events-none';

  return (
    <div className="absolute right-3 bottom-10 z-[1000] flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 shadow-xl shadow-black/10 dark:shadow-black/40 backdrop-blur-md">
      <button
        type="button"
        onClick={zoomIn}
        disabled={atMaxZoom}
        aria-label="Zoom in"
        title="Zoom in"
        className={buttonClass}
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <div className="h-px bg-gray-200 dark:bg-gray-700" />
      <button
        type="button"
        onClick={zoomOut}
        disabled={atMinZoom}
        aria-label="Zoom out"
        title="Zoom out"
        className={buttonClass}
      >
        <Minus className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <div className="h-px bg-gray-200 dark:bg-gray-700" />
      <button
        type="button"
        onClick={fitAll}
        disabled={positions.length === 0}
        aria-label="Fit all markers"
        title="Fit all markers"
        className={buttonClass}
      >
        <Maximize2 className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
});
