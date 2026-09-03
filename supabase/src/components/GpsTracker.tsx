import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Navigation, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { logger } from '@/lib/logger';

export interface GpsPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  speed: number | null;
  heading: number | null;
}

interface GpsTrackerProps {
  tripId?: string;
  driverId?: string;
  userType?: 'trucker' | 'shipper';
  onPositionUpdate?: (position: GpsPosition) => void;
  className?: string;
}

export default function GpsTracker({
  tripId,
  driverId,
  userType = 'trucker',
  onPositionUpdate,
  className = '',
}: GpsTrackerProps) {
  const { isOnline } = useNetworkStatus();
  const { getToken } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<GpsPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastPersistRef = useRef<number>(0);
  const permissionHandlerRef = useRef<(() => void) | null>(null);

  const clearTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (permissionHandlerRef.current) {
      permissionHandlerRef.current();
      permissionHandlerRef.current = null;
    }
  }, []);

  // Persist location to Supabase driver_locations table (throttled to every 10s)
  const persistLocation = useCallback(
    async (gpsPos: GpsPosition) => {
      if (!driverId) return;
      const now = Date.now();
      if (now - lastPersistRef.current < 10000) return;
      lastPersistRef.current = now;
      try {
        const token = await getToken({ template: 'supabase' });
        if (!token) return;
        const supabase = createClerkSupabaseClient(token);
        const { error: upsertError } = await supabase
          .from('driver_locations')
          .upsert(
            {
              driver_id: driverId,
              user_type: userType,
              trip_id: tripId || null,
              lat: gpsPos.lat,
              lng: gpsPos.lng,
              heading: gpsPos.heading,
              speed: gpsPos.speed,
              accuracy: gpsPos.accuracy,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'driver_id' }
          );
        if (upsertError) {
          logger.warn('GpsTracker upsert failed', { error: upsertError.message }, 'GpsTracker');
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        logger.warn('GpsTracker geolocation error', { error: errMsg }, 'GpsTracker');
      }
    },
    [driverId, tripId, userType, getToken]
  );

  const handlePosition = useCallback(
    (pos: GeolocationPosition) => {
      const gpsPos: GpsPosition = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
        speed: pos.coords.speed ?? null,
        heading: pos.coords.heading ?? null,
      };
      setCurrentPosition(gpsPos);
      setError(null);
      onPositionUpdate?.(gpsPos);
      persistLocation(gpsPos);
    },
    [onPositionUpdate, persistLocation]
  );

  const handleError = useCallback((err: GeolocationPositionError) => {
    const messages: Record<number, string> = {
      1: 'Location permission denied. Please enable location access in your browser settings.',
      2: 'Location unavailable. Check your device GPS or try again.',
      3: 'Location request timed out. Please try again.',
    };
    setError(messages[err.code] || 'Unknown location error');
    setIsTracking(false);
    clearTracking();
  }, [clearTracking]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setError(null);

    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((status) => {
        setPermissionState(status.state);
        const handleChange = () => setPermissionState(status.state);
        status.addEventListener('change', handleChange);
        permissionHandlerRef.current = () => status.removeEventListener('change', handleChange);
      });
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    setIsTracking(true);
  }, [handlePosition, handleError]);

  const stopTracking = useCallback(() => {
    clearTracking();
    setIsTracking(false);
    setCurrentPosition(null);
  }, [clearTracking]);

  useEffect(() => {
    return () => clearTracking();
  }, [clearTracking]);

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className={`rounded-lg border bg-card p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-sm">Live GPS Tracking</h3>
        </div>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
          {isTracking ? (
            <Badge variant="default" className="bg-green-600">
              <span className="h-2 w-2 rounded-full bg-white mr-1 animate-pulse" />
              Live
            </Badge>
          ) : (
            <Badge variant="secondary">Paused</Badge>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2 rounded bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs">
          {error}
        </div>
      )}

      {permissionState === 'denied' && !error && (
        <div className="mb-3 p-2 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs">
          Location permission was denied. Please enable location access in your browser settings and try again.
        </div>
      )}

      {currentPosition && (
        <div className="space-y-2 mb-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {currentPosition.lat.toFixed(5)}, {currentPosition.lng.toFixed(5)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>Accuracy: {Math.round(currentPosition.accuracy)}m</div>
            <div>
              Speed:{' '}
              {currentPosition.speed !== null
                ? `${Math.round(currentPosition.speed * 3.6)} km/h`
                : 'N/A'}
            </div>
            <div>
              Heading:{' '}
              {currentPosition.heading !== null
                ? `${Math.round(currentPosition.heading)} deg`
                : 'N/A'}
            </div>
            <div>Updated: {formatTimestamp(currentPosition.timestamp)}</div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {!isTracking ? (
          <Button
            onClick={startTracking}
            size="sm"
            className="flex-1"
          >
            <Navigation className="h-4 w-4 mr-1" />
            Start Tracking
          </Button>
        ) : (
          <Button
            onClick={stopTracking}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Stop Tracking
          </Button>
        )}
      </div>

      {tripId && (
        <p className="mt-2 text-xs text-muted-foreground">
          Trip: {tripId.slice(0, 8)}...
        </p>
      )}
    </div>
  );
}
