import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { useLocationPermission, type LocationPermissionState } from '@/hooks/useLocationPermission';

export type GpsTrackingState = 'idle' | 'locating' | 'active' | 'error' | 'no-location';

interface LocationContextType {
  locationPermission: LocationPermissionState;
  isLocationSupported: boolean;
  requestLocationPermission: () => Promise<boolean>;
  refreshLocationPermission: () => void;
  gpsTrackingState: GpsTrackingState;
  setGpsTrackingState: (state: GpsTrackingState) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const {
    permissionState: locationPermission,
    isSupported: isLocationSupported,
    requestPermission: requestLocationPermission,
    refreshPermission: refreshLocationPermission,
  } = useLocationPermission();

  const [gpsTrackingState, setGpsTrackingState] = useState<GpsTrackingState>('idle');

  const contextValue = useMemo(
    () => ({
      locationPermission,
      isLocationSupported,
      requestLocationPermission,
      refreshLocationPermission,
      gpsTrackingState,
      setGpsTrackingState,
    }),
    [
      locationPermission,
      isLocationSupported,
      requestLocationPermission,
      refreshLocationPermission,
      gpsTrackingState,
    ],
  );

  return <LocationContext.Provider value={contextValue}>{children}</LocationContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
