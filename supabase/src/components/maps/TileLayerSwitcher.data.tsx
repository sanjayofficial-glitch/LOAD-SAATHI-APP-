import React from 'react';
import { Map, Globe, Moon } from 'lucide-react';

export type TileLayerId = 'standard' | 'satellite' | 'dark' | 'night';

export interface TileLayerOption {
  id: TileLayerId;
  label: string;
  icon: React.ReactNode;
  url: string;
  attribution: string;
  /**
   * Optional transparent label/place-name overlay drawn on top of `url`.
   * Used to keep a dark base map readable without a keyed tile provider.
   */
  labelsUrl?: string;
}

// NOTE: All basemaps below are keyless. CARTO basemaps now require an API key
// (legacy URLs watermarked "API key required" after 23 Sep 2026), so dark
// styles fall back to Esri's free World Dark Gray Canvas instead.
const ESRI_DARK_ATTRIBUTION =
  '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    labelsUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attribution: ESRI_DARK_ATTRIBUTION,
  },
  {
    id: 'night',
    label: 'Night',
    icon: <Moon className="h-4 w-4" />,
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: ESRI_DARK_ATTRIBUTION,
  },
];

export function getTileLayer(id: TileLayerId): TileLayerOption {
  return TILE_LAYERS.find((l) => l.id === id) ?? TILE_LAYERS[0]!;
}
