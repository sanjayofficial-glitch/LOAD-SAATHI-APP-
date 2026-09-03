import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Truck, 
  Package, 
  Flame, 
  Route, 
  Eye, 
  EyeOff,
  ChevronDown,
  ChevronUp,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MapFilters {
  showTruckers: boolean;
  showShippers: boolean;
  showOnTripOnly: boolean;
  showHeatmap: boolean;
  showRoutes: boolean;
}

interface MapControlsProps {
  filters: MapFilters;
  onFilterChange: (filters: MapFilters) => void;
  onlineCount: number;
  onTripCount: number;
  className?: string;
}

export default React.memo(function MapControls({
  filters,
  onFilterChange,
  onlineCount,
  onTripCount,
  className,
}: MapControlsProps) {
  const [expanded, setExpanded] = useState(true);

  const toggle = (key: keyof MapFilters) => {
    onFilterChange({ ...filters, [key]: !filters[key] });
  };

  return (
    <div className={cn(
      'fixed top-[calc(3.5rem+1rem)] sm:top-[calc(4rem+1rem)] right-4 z-[9999] bg-slate-950/95 border border-slate-700/60 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-300',
      className
    )}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-100">Filters</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-800 rounded-full px-2 py-0.5">
            <Radio className="h-2.5 w-2.5 text-green-400 animate-pulse" />
            <span className="text-[9px] font-mono text-green-400">{onlineCount}</span>
          </div>
          {expanded ? (
            <ChevronUp className="h-3 w-3 text-slate-400" />
          ) : (
            <ChevronDown className="h-3 w-3 text-slate-400" />
          )}
        </div>
      </button>

      {/* Filter controls */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-slate-700/60">
          {/* User type */}
          <div className="pt-2">
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Users</p>
            <div className="space-y-1">
              <FilterToggle
                active={filters.showTruckers}
                onClick={() => toggle('showTruckers')}
                icon={<Truck className="h-3 w-3" />}
                label="Truckers"
                color="orange"
              />
              <FilterToggle
                active={filters.showShippers}
                onClick={() => toggle('showShippers')}
                icon={<Package className="h-3 w-3" />}
                label="Shippers"
                color="blue"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Status</p>
            <button
              onClick={() => toggle('showOnTripOnly')}
              className={cn(
                'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all',
                filters.showOnTripOnly
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-slate-800/50 text-slate-300 border border-slate-700/60 hover:border-slate-600'
              )}
            >
              <div className="flex items-center gap-1.5">
                {filters.showOnTripOnly ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <span>On Trip Only</span>
              </div>
              <span className="text-[9px] font-mono">{onTripCount}</span>
            </button>
          </div>

          {/* Layers */}
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Layers</p>
            <div className="space-y-1">
              <FilterToggle
                active={filters.showHeatmap}
                onClick={() => toggle('showHeatmap')}
                icon={<Flame className="h-3 w-3" />}
                label="Heatmap"
                color="red"
              />
              <FilterToggle
                active={filters.showRoutes}
                onClick={() => toggle('showRoutes')}
                icon={<Route className="h-3 w-3" />}
                label="Routes"
                color="purple"
              />
            </div>
          </div>

          {/* Legend */}
          <div className="pt-2 border-t border-slate-700/60">
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Legend</p>
            <div className="grid grid-cols-2 gap-1">
              <LegendItem color="bg-orange-500" label="Trucker" />
              <LegendItem color="bg-blue-500" label="Shipper" />
              <LegendItem color="bg-green-500" label="On Trip" pulse />
              <LegendItem color="bg-blue-600" label="Business" />
              <LegendItem color="bg-red-500" label="Heat" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
})

function FilterToggle({
  active,
  onClick,
  icon,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: 'orange' | 'blue' | 'red' | 'purple' | 'green';
}) {
  const colorMap = {
    orange: { active: 'bg-orange-500/10 text-orange-400 border-orange-500/20', dot: 'bg-orange-500' },
    blue: { active: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-500' },
    red: { active: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-500' },
    purple: { active: 'bg-purple-500/10 text-purple-400 border-purple-500/20', dot: 'bg-purple-500' },
    green: { active: 'bg-green-500/10 text-green-400 border-green-500/20', dot: 'bg-green-500' },
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border',
        active
          ? colorMap[color].active
          : 'bg-slate-800/50 text-slate-300 border-slate-700/60 hover:border-slate-600 hover:text-white'
      )}
    >
      <div className={cn('h-1.5 w-1.5 rounded-full transition-all', active ? colorMap[color].dot : 'bg-slate-600')} />
      {icon}
      <span>{label}</span>
    </button>
  );
}

function LegendItem({ color, label, pulse }: { color: string; label: string; pulse?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn('h-2 w-2 rounded-full', color, pulse && 'animate-pulse')} />
      <span className="text-[9px] text-slate-400 font-bold">{label}</span>
    </div>
  );
}
