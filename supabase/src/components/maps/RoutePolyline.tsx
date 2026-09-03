import React, { useEffect, useState } from 'react';
import { Polyline } from 'react-leaflet';

interface RoutePolylineProps {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  color?: string;
  weight?: number;
  opacity?: number;
}

// Simple route fetcher using OSRM public API
async function fetchRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<[number, number][]> {
  try {
    // OSRM expects lng,lat order
    const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (data.routes?.[0]?.geometry?.coordinates) {
      // Convert [lng, lat] to [lat, lng] for Leaflet
      return data.routes[0].geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]] as [number, number],
      );
    }
  } catch {
    // Silently fail — map still works without route line
  }
  return [];
}

export default React.memo(function RoutePolyline({
  originLat,
  originLng,
  destLat,
  destLng,
  color = '#3b82f6',
  weight = 3,
  opacity = 0.7,
}: RoutePolylineProps) {
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchRoute(originLat, originLng, destLat, destLng).then((coords) => {
      if (!cancelled) setCoordinates(coords);
    });
    return () => {
      cancelled = true;
    };
  }, [originLat, originLng, destLat, destLng]);

  if (coordinates.length === 0) return null;

  return (
    <Polyline
      positions={coordinates}
      pathOptions={{ color, weight, opacity }}
    />
  );
});
