import React, { useState } from 'react';
import { Layers, Map, Globe, Moon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TileLayerId = 'standard' | 'satellite' | 'dark' | 'night';

export interface TileLayerOption {
  id: TileLayerId;
  label: string;
  icon: React.ReactNode;
  url: string;
  attribution: string;
}

export const TILE_LAYERS: TileLayerOption[] = [
  {
    id: 'standard',
    label: 'Standard',
    icon: <Map className="h-4 w-4" />,
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    id: 'satellite',
    label: 'Satellite',
    icon: <Globe className="h-4 w-4" />,
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGPSW, and the GIS User Community',
  },
  {
    id: 'dark',
    label: 'Dark',
    icon: <Moon className="h-4 w-4" />,
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  {
    id: 'night',
    label: 'Night',
    icon: <Moon className="h-4 w-4" />,
    url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
];

export function getTileLayer(id: TileLayerId): TileLayerOption {
  return TILE_LAYERS.find((l) => l.id === id) ?? TILE_LAYERS[0]!;
}

interface TileLayerSwitcherProps {
  currentLayer: TileLayerId;
  onLayerChange: (layer: TileLayerId) => void;
  className?: string;
}

export default React.memo(function TileLayerSwitcher({
  currentLayer,
  onLayerChange,
  className = '',
}: TileLayerSwitcherProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('absolute top-3 right-3 z-[1000]', className)}>
      {open ? (
        <div className="flex flex-col gap-1 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 shadow-xl shadow-black/10 dark:shadow-black/40 backdrop-blur-md">
          <div className="flex items-center justify-between px-2 pb-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Map Style</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-0.5 rounded hover:bg-muted transition-colors"
              aria-label="Close map style picker"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
          {TILE_LAYERS.map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => {
                onLayerChange(layer.id);
                setOpen(false);
              }}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                currentLayer === layer.id
                  ? 'bg-orange-500/15 text-orange-600 dark:bg-orange-400/15 dark:text-orange-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-600 dark:hover:text-orange-400'
              )}
            >
              {layer.icon}
              {layer.label}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-11 h-11 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 shadow-xl shadow-black/10 dark:shadow-black/40 backdrop-blur-md text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-600 dark:hover:text-orange-400 transition-colors active:scale-95"
          aria-label="Change map style"
          title="Change map style"
        >
          <Layers className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
    </div>
  );
});
