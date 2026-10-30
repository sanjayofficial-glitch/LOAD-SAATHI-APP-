import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

export type LocationPermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable';

interface UseLocationPermissionReturn {
  permissionState: LocationPermissionState;
  isSupported: boolean;
  requestPermission: () => Promise<boolean>;
  refreshPermission: () => void;
}

const LOCATION_STORAGE_KEY = 'loadsaathi-location-permission-cache';

export function useLocationPermission(): UseLocationPermissionReturn {
  const [permissionState, setPermissionState] = useState<LocationPermissionState>('unavailable');
  const [isSupported, setIsSupported] = useState(false);
  const permissionStatusRef = useRef<PermissionStatus | null>(null);
  const changeListenerRef = useRef<(() => void) | null>(null);

  const queryLive = useCallback(async (): Promise<LocationPermissionState | null> => {
    if (typeof navigator === 'undefined' || !navigator.permissions || !navigator.permissions.query) {
      return null;
    }
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      return status.state as LocationPermissionState;
    } catch {
      return null;
    }
  }, []);

  const refreshPermission = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setIsSupported(false);
      setPermissionState('unavailable');
      return;
    }

    setIsSupported(true);

    if (typeof navigator.permissions === 'undefined' || !navigator.permissions.query) {
      // Permissions API unavailable. Never trust a stale cached grant; fall
      // back to the conservative 'prompt' so the banner keeps offering consent.
      setPermissionState('prompt');
      return;
    }

    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        // Clean up any previously-attached listener before adding a new one
        // (HMR + re-mounts would otherwise leak listeners).
        if (changeListenerRef.current && permissionStatusRef.current) {
          try {
            permissionStatusRef.current.removeEventListener('change', changeListenerRef.current);
          } catch {
            // ignore
          }
          changeListenerRef.current = null;
        }

        permissionStatusRef.current = status;
        setPermissionState(status.state as LocationPermissionState);

        const handleChange = () => {
          setPermissionState(status.state as LocationPermissionState);
          // Best-effort cache write only; reads never override a live check.
          try {
            sessionStorage.setItem(LOCATION_STORAGE_KEY, status.state);
          } catch {
            // sessionStorage may be unavailable (private mode)
          }
        };
        status.addEventListener('change', handleChange);
        changeListenerRef.current = handleChange;
      })
      .catch((err: { message?: string }) => {
        logger.warn('Failed to query geolocation permission', { error: err?.message ?? err }, 'useLocationPermission');
        // Never assume 'granted' from a stale cache. Conservative fallback.
        setPermissionState('prompt');
      });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return false;
    }

    let ok = false;
    let denied = false;
    try {
      const result = await new Promise<{ ok: boolean; reason?: string }>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve({ ok: true }),
          (geoErr: GeolocationPositionError) => {
            if (geoErr.code === geoErr.PERMISSION_DENIED) {
              resolve({ ok: false, reason: 'denied' });
            } else if (geoErr.code === geoErr.POSITION_UNAVAILABLE) {
              resolve({ ok: false, reason: 'unavailable' });
            } else if (geoErr.code === geoErr.TIMEOUT) {
              resolve({ ok: false, reason: 'timeout' });
            } else {
              resolve({ ok: false, reason: 'unknown' });
            }
          },
          // This call is used by the permission banner to detect the user's
          // decision. On slow devices/networks a GPS lock can take longer
          // than the default 10s and surface a spurious TIMEOUT. Lengthening
          // this to 20s is still snappy for permission detection but avoids
          // flapping the banner on slow locks.
          { enableHighAccuracy: false, timeout: 20000, maximumAge: 0 }
        );
      });

      ok = result.ok;
      denied = result.reason === 'denied';

      if (ok) {
        setPermissionState('granted');
        try {
          sessionStorage.setItem(LOCATION_STORAGE_KEY, 'granted');
        } catch {
          // ignore
        }
      } else {
        // For 'denied' the OS-level decision is final — leave that state alone
        // (the browser caches the denial). For unavailable/timeout/unknown,
        // surface as 'prompt' so the banner keeps offering retry.
        const next: LocationPermissionState = denied ? 'denied' : 'prompt';
        setPermissionState(next);
        try {
          sessionStorage.setItem(LOCATION_STORAGE_KEY, next);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      logger.warn('requestPermission failed', { error: err }, 'useLocationPermission');
      setPermissionState('prompt');
    }

    // Second verification path: re-query the live permission state if available.
    // On iPad the Permissions API may lag or be stuck; reconcile with the
    // practical geolocation outcome when it is unavailable or stuck.
    const live = await queryLive();
    if (live !== null) {
      if (live === 'denied' || live === 'prompt') {
        // Live check must not be overridden by an optimistic granted.
        setPermissionState(live);
        try {
          sessionStorage.setItem(LOCATION_STORAGE_KEY, live);
        } catch {
          // ignore
        }
      } else if (live === 'granted' && ok) {
        setPermissionState('granted');
        try {
          sessionStorage.setItem(LOCATION_STORAGE_KEY, 'granted');
        } catch {
          // ignore
        }
      }
    } else {
      // No live API: rely on the geolocation outcome already applied above.
      if (denied) {
        setPermissionState('denied');
      }
    }

    return ok && !denied;
  }, [queryLive]);

  useEffect(() => {
    refreshPermission();
    return () => {
      // Detach the permissions change listener on unmount so HMR / route
      // changes don't leave dangling handlers that update unmounted state.
      if (changeListenerRef.current && permissionStatusRef.current) {
        try {
          permissionStatusRef.current.removeEventListener('change', changeListenerRef.current);
        } catch {
          // ignore
        }
        changeListenerRef.current = null;
      }
    };
  }, [refreshPermission]);

  return { permissionState, isSupported, requestPermission, refreshPermission };
}