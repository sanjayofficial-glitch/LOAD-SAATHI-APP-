import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TruckLocation } from '@/components/maps/TruckMarker.utils';
import { getCityCoords } from './cityCoordCache';

interface PredictiveETAProps {
  truck: TruckLocation;
  className?: string;
}

interface OSRMRoute {
  distance: number; // km
  duration: number; // hours
}

interface Eta {
  hoursRemaining: number;
  distanceRemaining: number;
  status: 'on_time' | 'delayed' | 'critical';
  predictedArrival: Date;
  avgSpeed: number;
  /**
   * True when OSRM could not produce a road route and we fell back to a
   * straight-line estimate. Surfaced in the UI so nobody mistakes the
   * approximation for a routing result.
   */
  approximate: boolean;
}

/**
 * PredictiveETA — real-time ETA from the truck's CURRENT position to its
 * destination via a two-point OSRM route request.
 *
 * Honest failure modes: when the destination can't be resolved or routing is
 * offline, the widget shows "unavailable" with a reason. It never fabricates
 * an arrival time (an earlier version silently returned "4h / On Time"
 * whenever OSRM failed — that was misleading in an ops console).
 */
export default function PredictiveETA({ truck, className }: PredictiveETAProps) {
  const [eta, setEta] = useState<Eta | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  // Compute straight-line distance between two lat/lng points
  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Resolve the truck's destination coordinates from the corridor cache
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!truck.destination_city) {
      setDestCoords(null);
      return;
    }
    let cancelled = false;
    getCityCoords(truck.destination_city).then((coords) => {
      if (!cancelled) setDestCoords(coords);
    });
    return () => { cancelled = true; };
  }, [truck.destination_city]);

  useEffect(() => {
    let cancelled = false;

    const computeETA = async () => {
      setLoading(true);
      setUnavailable(null);

      try {
        if (!destCoords || truck.lat == null || truck.lng == null) {
          setEta(null);
          if (!cancelled) {
            setUnavailable(
              destCoords
                ? 'Live truck position unavailable'
                : 'Destination location unknown',
            );
          }
          return;
        }

        const currentSpeed =
          truck.speed != null && truck.speed > 0 ? truck.speed * 3.6 : 40; // km/h, default 40

        // Real road route: truck's current position → destination.
        // (An earlier version fed OSRM a single coordinate and treated the
        // destination cache entry as the origin — the request was malformed.)
        const url = `https://router.project-osrm.org/route/v1/driving/${truck.lng},${truck.lat};${destCoords[1]},${destCoords[0]}?overview=false`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          const route: OSRMRoute = {
            distance: data.routes[0].distance / 1000, // km
            duration: data.routes[0].duration / 3600, // hours
          };

          if (cancelled) return;
          setEta({
            hoursRemaining: route.duration,
            distanceRemaining: route.distance,
            status: route.duration > 8 ? 'critical' : route.duration > 5 ? 'delayed' : 'on_time',
            predictedArrival: new Date(Date.now() + route.duration * 3600000),
            avgSpeed: route.distance / Math.max(route.duration, 0.01),
            approximate: false,
          });
          return;
        }

        // OSRM reachable but no road route: straight-line approximation,
        // computed from the truck's CURRENT position to the destination.
        if (cancelled) return;
        const straightKm = haversine(truck.lat, truck.lng, destCoords[0], destCoords[1]);
        const hoursRemaining = straightKm / currentSpeed;
        setEta({
          hoursRemaining,
          distanceRemaining: straightKm,
          status: hoursRemaining > 8 ? 'critical' : hoursRemaining > 5 ? 'delayed' : 'on_time',
          predictedArrival: new Date(Date.now() + hoursRemaining * 3600000),
          avgSpeed: currentSpeed,
          approximate: true,
        });
      } catch {
        // OSRM offline / network error: say so. Never a hardcoded "4h / On Time".
        if (!cancelled) {
          setEta(null);
          setUnavailable('Routing service unreachable');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    computeETA();
    return () => {
      cancelled = true;
    };
  }, [truck.lat, truck.lng, truck.speed, truck.destination_city, destCoords]);

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
        <Clock className="h-3 w-3 animate-spin" />
        <span>Computing ETA...</span>
      </div>
    );
  }

  if (unavailable || !eta) {
    return (
      <div className={cn('rounded-lg border p-3 space-y-2', className)}>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Navigation className="h-3 w-3" /> ETA
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
          {unavailable ?? 'ETA unavailable'}
        </p>
      </div>
    );
  }

  const statusColors = {
    on_time: 'text-green-500',
    delayed: 'text-amber-500',
    critical: 'text-red-500',
  };

  const statusLabels = {
    on_time: 'On Time',
    delayed: 'Delayed',
    critical: 'Critical',
  };

  return (
    <div className={cn('rounded-lg border p-3 space-y-2', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Navigation className="h-3 w-3" /> ETA
        </p>
        <span className={cn('text-xs font-bold', statusColors[eta.status])}>
          {statusLabels[eta.status]}
        </span>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold tabular-nums">
          {eta.hoursRemaining < 1
            ? `${Math.round(eta.hoursRemaining * 60)}m`
            : `${eta.hoursRemaining.toFixed(1)}h`}
        </span>
        <span className="text-xs text-muted-foreground">remaining</span>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{Math.round(eta.distanceRemaining)} km left{eta.approximate ? ' (approx.)' : ''}</span>
        <span className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Arrives {eta.predictedArrival.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
