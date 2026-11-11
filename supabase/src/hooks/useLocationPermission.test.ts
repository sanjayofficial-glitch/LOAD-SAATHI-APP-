import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLocationPermission } from '@/hooks/useLocationPermission';

function setNavigator(geo?: Geolocation, perms?: Permissions) {
  try {
    Object.defineProperty(window.navigator, 'geolocation', { value: geo, configurable: true, writable: true });
  } catch {
    (window.navigator as unknown as { geolocation?: Geolocation }).geolocation = geo;
  }
  try {
    Object.defineProperty(window.navigator, 'permissions', { value: perms, configurable: true, writable: true });
  } catch {
    (window.navigator as unknown as { permissions?: Permissions }).permissions = perms;
  }
}

describe('useLocationPermission', () => {
  beforeEach(() => {
    try { sessionStorage.clear(); } catch {}
    vi.restoreAllMocks();
  });

  afterEach(() => {
    try { sessionStorage.clear(); } catch {}
  });

  it('reflects denied from Permissions API even with stale granted cache', async () => {
    sessionStorage.setItem('loadsaathi-location-permission-cache', 'granted');
    const geo = { getCurrentPosition: vi.fn(), watchPosition: vi.fn(), clearWatch: vi.fn() };
    const perms = {
      query: vi.fn().mockResolvedValue({ state: 'denied', addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    };
    setNavigator(geo, perms);

    const { result } = renderHook(() => useLocationPermission());
    await waitFor(() => expect(result.current.permissionState).toBe('denied'));
    expect(result.current.permissionState).not.toBe('granted');
  });

  it('falls back to prompt (not granted) when permissions query rejects', async () => {
    sessionStorage.setItem('loadsaathi-location-permission-cache', 'granted');
    const geo = { getCurrentPosition: vi.fn(), watchPosition: vi.fn(), clearWatch: vi.fn() };
    const perms = { query: vi.fn().mockRejectedValue(new Error('nope')) };
    setNavigator(geo, perms);

    const { result } = renderHook(() => useLocationPermission());
    await waitFor(() => expect(result.current.permissionState).toBe('prompt'));
  });

  it('falls back to prompt when Permissions API is unavailable', async () => {
    const geo = { getCurrentPosition: vi.fn(), watchPosition: vi.fn(), clearWatch: vi.fn() };
    setNavigator(geo, undefined);

    const { result } = renderHook(() => useLocationPermission());
    await waitFor(() => expect(result.current.permissionState).toBe('prompt'));
  });

  it('returns unavailable when geolocation itself is missing', async () => {
    setNavigator(undefined, undefined);
    const { result } = renderHook(() => useLocationPermission());
    await waitFor(() => expect(result.current.permissionState).toBe('unavailable'));
    expect(result.current.isSupported).toBe(false);
  });

  it('treats geolocation PERMISSION_DENIED as denied', async () => {
    sessionStorage.setItem('loadsaathi-location-permission-cache', 'granted');
    const geo = {
      getCurrentPosition: vi.fn((_success, error) => {
        error({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: 'denied' });
      }),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    };
    // permissions unavailable to force geolocation path
    setNavigator(geo, undefined);

    const { result } = renderHook(() => useLocationPermission());
    // initial refresh sets prompt (no permissions API)
    await waitFor(() => expect(result.current.permissionState).toBe('prompt'));

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.requestPermission();
    });
    expect(ok).toBe(false);
    expect(result.current.permissionState).toBe('denied');
  });

  it('re-queries live permission after requestPermission when available', async () => {
    const status = { state: 'denied', addEventListener: vi.fn(), removeEventListener: vi.fn() };
    const geo = {
      getCurrentPosition: vi.fn((success) => success({ coords: { latitude: 1, longitude: 2 } })),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    };
    const perms = { query: vi.fn().mockResolvedValue(status) };
    setNavigator(geo, perms);

    const { result } = renderHook(() => useLocationPermission());
    await waitFor(() => expect(result.current.permissionState).toBe('denied'));

    // make live query report granted now (simulate OS change) - not needed; test denied stays
    await act(async () => {
      await result.current.requestPermission();
    });
    // geolocation succeeded -> optimistic granted, but live query says denied -> reconcile to denied
    expect(result.current.permissionState).toBe('denied');
  });
});
