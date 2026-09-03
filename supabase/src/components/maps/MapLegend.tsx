import React from 'react';

interface MapLegendProps {
  showTrucks?: boolean;
  showLoads?: boolean;
  showInTransit?: boolean;
  className?: string;
}

export default React.memo(function MapLegend({
  showTrucks = true,
  showLoads = true,
  showInTransit = true,
  className = '',
}: MapLegendProps) {
  return (
    <div
      className={`absolute bottom-4 left-4 z-[1000] bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg border px-3 py-2 text-xs ${className}`}
    >
      <p className="font-semibold text-foreground mb-1.5">Legend</p>
      <div className="flex flex-col gap-1">
        {showTrucks && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">Available Truck</span>
          </div>
        )}
        {showInTransit && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">In Transit</span>
          </div>
        )}
        {showLoads && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Load Demand</span>
          </div>
        )}
      </div>
    </div>
  );
});
