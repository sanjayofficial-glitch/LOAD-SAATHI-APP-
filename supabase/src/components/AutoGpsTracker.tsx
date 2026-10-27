import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { logger } from '@/lib/logger';
// showError no longer used

/**
 * AutoGpsTracker - Invisible component that auto-tracks GPS for logged-in truckers.
 * Placed in Layout to ensure authenticated truckers share location for the command center.
 * Sends updates every 30 seconds with trip context for live map display.
 *
 * Uses Clerk JWT → createClerkSupabaseClient for authenticated writes to driver_locations.
 */
// Live-map freshness: 30s between writes keeps markers moving in real time.
// Raise this if free-tier write volume becomes a concern (each active user
// writes ~2 rows/min while the tab is open).
const LOCATION_UPDATE_INTERVAL_MS = 30 * 1000;

export default function AutoGpsTracker() {
  const { userProfile, getSupabaseToken } = useAuth();
  const { locationPermission, setGpsTrackingState } = useLocation();
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const tripRefreshRef = useRef<number | null>(null);
  const activeTripRef = useRef<{
    trip_id: string;
    origin_city: string;
    destination_city: string;
    vehicle_type: string;
    available_capacity_tonnes: number;
    trip_status: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!userProfile || !mounted) return;

      const ut = userProfile.user_type;
      if (ut !== 'trucker' && ut !== 'shipper') return;

      // Do not attempt GPS if permission has not been granted. The banner
      // UI will prompt the user to grant permission.
      if (locationPermission !== 'granted') {
        setGpsTrackingState('no-location');
        return;
      }

      // Get Clerk JWT for authenticated Supabase client. MUST use the
      // 'supabase' template — the default session token fails Supabase JWT
      // verification (wrong aud), so writes silently 401 otherwise.
      const token = await getSupabaseToken();
      if (!token || !mounted) return;

      // Fetch active trip context for truckers (for map display). Both
      // 'active' and 'in_transit' are tracked so the command center keeps
      // monitoring the truck the moment a trip is started.
      const refreshTripContext = async () => {
        if (ut !== 'trucker' || !mounted) return;
        const freshToken = await getSupabaseToken();
        if (!freshToken) return;
        const client = createClerkSupabaseClient(freshToken);
        const { data: trip } = await client
          .from('trips')
          .select('id, origin_city, destination_city, vehicle_type, available_capacity_tonnes, status')
          .eq('trucker_id', userProfile.id)
          .in('status', ['active', 'in_transit'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (trip) {
          activeTripRef.current = {
            trip_id: trip.id,
            origin_city: trip.origin_city,
            destination_city: trip.destination_city,
            vehicle_type: trip.vehicle_type,
            available_capacity_tonnes: trip.available_capacity_tonnes,
            trip_status: trip.status,
          };
        } else {
          activeTripRef.current = null;
        }
      };

      await refreshTripContext();

      // Start watching position
      if (!navigator.geolocation) return;

      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          if (!mounted) return;

          const tripCtx = activeTripRef.current;

          const now = Date.now();
          setGpsTrackingState(tripCtx ? 'active' : 'idle');
          // Throttle writes to every 30s so the live map stays fresh.
          if (now - lastUpdateRef.current < LOCATION_UPDATE_INTERVAL_MS) return;
          lastUpdateRef.current = now;

          const { latitude: lat, longitude: lng } = position.coords;

          // Refresh token if needed (Clerk tokens expire ~60s)
          const freshToken = await getSupabaseToken();
          if (!freshToken) return;
          const client = createClerkSupabaseClient(freshToken);

          try {
            const { error: upsertError } = await client.from('driver_locations').upsert(
              {
                driver_id: userProfile.id,
                lat,
                lng,
                heading: position.coords.heading ?? null,
                speed: position.coords.speed ?? null,
                accuracy: position.coords.accuracy ?? null,
                last_seen_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_sharing: true,
                // Trip context for live map if available
                trip_id: tripCtx?.trip_id || null,
                origin_city: tripCtx?.origin_city || null,
                destination_city: tripCtx?.destination_city || null,
                vehicle_type: tripCtx?.vehicle_type || null,
                available_capacity_tonnes: tripCtx?.available_capacity_tonnes || null,
                trip_status: tripCtx?.trip_status || null,
              },
              { onConflict: 'driver_id' }
            );

            if (upsertError) {
              throw upsertError;
            }
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            logger.warn('AutoGpsTracker upsert failed (silently throttled retry)', { error: errMsg }, 'AutoGpsTracker');
          }
        },
        (err) => {
          if (err?.code === err?.PERMISSION_DENIED) {
            setGpsTrackingState('no-location');
            logger.warn('AutoGpsTracker permission denied', { error: err?.message ?? err }, 'AutoGpsTracker');
          } else {
            setGpsTrackingState('error');
            logger.warn('AutoGpsTracker geolocation error', { error: err?.message ?? err }, 'AutoGpsTracker');
          }
        },
        {
          enableHighAccuracy: ut === 'trucker',
          maximumAge: LOCATION_UPDATE_INTERVAL_MS,
          // Generous timeout — a slow GPS fix (common indoors) must not spam
          // the error handler every 30s; the throttle gates write frequency.
          timeout: 60000,
        }
      );

      // Keep trip context fresh (every 60s) so a newly started trip shows on
      // the command center map without requiring the trucker to reload.
      tripRefreshRef.current = window.setInterval(() => {
        refreshTripContext();
      }, 60 * 1000);
    };

    init();

    return () => {
      mounted = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (tripRefreshRef.current !== null) {
        window.clearInterval(tripRefreshRef.current);
        tripRefreshRef.current = null;
      }

      // Best-effort: stop sharing when unmounted (do not block unmount).
      const uid = userProfile?.id;
      if (uid) {
        void (async () => {
          try {
            const token = await getSupabaseToken();
            if (!token) return;
            const client = createClerkSupabaseClient(token);
            await client
              .from('driver_locations')
              .update({ is_sharing: false, trip_id: null })
              .eq('driver_id', uid);
          } catch {
            // ignore — state will be corrected on next mount or via trip completion
          }
        })();
      }
    };
  }, [userProfile, getSupabaseToken, locationPermission, setGpsTrackingState]);

  // This component renders nothing
  return null;
}
