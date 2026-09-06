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

  const refreshPermission = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setIsSupported(false);
      setPermissionState('unavailable');
      return;
    }

    setIsSupported(true);

    if (typeof navigator.permissions === 'undefined' || !navigator.permissions.query) {
      // Permissions API unavailable (iOS Safari pre-16, older WebViews, non-HTTPS
      // in some browsers). Without it we cannot know the user's actual decision,
      // so default to 'prompt' — this lets the LocationPermissionBanner show
      // and ask for explicit consent instead of silently assuming 'granted'.
      setPermissionState('prompt');
      return;
    }

    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        permissionStatusRef.current = status;
        setPermissionState(status.state as LocationPermissionState);

        // Clean up any previously-attached listener before adding a new one
        // (HMR + re-mounts would otherwise leak listeners).
        if (changeListenerRef.current) {
          try {
            permissionStatusRef.current?.removeEventListener('change', changeListenerRef.current);
          } catch {
            // ignore
          }
          changeListenerRef.current = null;
        }

        const handleChange = () => {
          setPermissionState(status.state as LocationPermissionState);
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
        const cached = sessionStorage.getItem(LOCATION_STORAGE_KEY);
        if (cached === 'granted') {
          setPermissionState('granted');
        } else {
          setPermissionState('prompt');
        }
      });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return false;
    }

    // Single getCurrentPosition call. Previously this hook fired a second
    // nested call when the first one returned a non-PERMISSION_DENIED error;
    // that nested pattern could leave the outer promise dangling if the
    // browser threw synchronously on the second call. One attempt is enough:
    // a denied/timeout result is the user's answer; we surface it instead of
    // swallowing it via a retry.
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
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
        );
      });

      if (result.ok) {
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
        const next: LocationPermissionState = result.reason === 'denied' ? 'denied' : 'prompt';
        setPermissionState(next);
        try {
          sessionStorage.setItem(LOCATION_STORAGE_KEY, next);
        } catch {
          // ignore
        }
      }
      return result.ok;
    } catch (err) {
      logger.warn('requestPermission failed', { error: err }, 'useLocationPermission');
      setPermissionState('prompt');
      return false;
    }
  }, []);

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