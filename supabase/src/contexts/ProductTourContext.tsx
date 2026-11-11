import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { driver } from 'driver.js';
import type { Driver } from 'driver.js';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  buildDriverConfig,
  consumeTourEntryFlag,
  filterPresentSteps,
  isReturningUser,
  isTourDone,
  markTourDone,
  matchSpecForPath,
  resetTour as resetTourFlags,
  TOUR_REGISTRY,
  type TourSpec,
} from '@/hooks/useProductTour';

import { ProductTourContext, type ProductTourContextType } from './ProductTourContext.shared';

interface ProductTourProviderProps {
  children: ReactNode;
}

export function ProductTourProvider({ children }: ProductTourProviderProps) {
  const { userProfile, loading: authLoading } = useAuth();
  const location = useLocation();
  const driverRef = useRef<Driver | null>(null);
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourCompleted, setTourCompleted] = useState<boolean>(() => false);

  const userId = userProfile?.id;
  const userType = (userProfile?.user_type === 'trucker' || userProfile?.user_type === 'shipper')
    ? userProfile.user_type
    : undefined;

  const pathname = location.pathname;

  useEffect(() => {
    if (!userId) {
      setTourCompleted(false);
      return;
    }
    let completed = true;
    for (const spec of TOUR_REGISTRY) {
      if (!isTourDone(userId, spec.id)) {
        completed = false;
        break;
      }
    }
    setTourCompleted(completed);
  }, [userId]);

  const destroyDriver = useCallback(() => {
    if (driverRef.current) {
      try {
        driverRef.current.destroy();
      } catch {
        /* ignore */
      }
      driverRef.current = null;
    }
    setIsTourActive(false);
  }, []);

  useEffect(() => {
    const onBeforeUnload = () => {
      destroyDriver();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      destroyDriver();
    };
  }, [destroyDriver]);

  const startDriver = useCallback((spec: TourSpec) => {
    destroyDriver();

    const steps = filterPresentSteps(spec.buildSteps());
    if (steps.length === 0) {
      if (userId) markTourDone(userId, spec.id);
      return;
    }

    const config = buildDriverConfig(spec, userId!);
    const driverObj = driver(config);
    driverObj.setSteps(steps);
    driverRef.current = driverObj;
    setIsTourActive(true);

    driverObj.drive();
  }, [destroyDriver, userId]);

  const startTour = useCallback((spec: TourSpec) => {
    if (!userId || !userType || isTourActive) return;
    if (!spec.roles.includes(userType)) return;
    if (isTourDone(userId, spec.id)) return;

    const timer = setTimeout(() => {
      startDriver(spec);
    }, 350);

    return () => clearTimeout(timer);
  }, [userId, userType, isTourActive, startDriver]);

  useEffect(() => {
    if (authLoading || !userId || !userType || isTourActive) return;
    if (!pathname) return;

    const entryFlag = consumeTourEntryFlag(userId);
    const entrySpec = matchSpecForPath(pathname, userType);
    const isEntryPage = entrySpec && (entrySpec.id === 'entry.trucker' || entrySpec.id === 'entry.shipper');

    if (entryFlag && isEntryPage) {
      const timer = setTimeout(() => startTour(entrySpec!), 350);
      return () => clearTimeout(timer);
    }

    if (isEntryPage) return;
    if (isReturningUser(userId)) return;

    const spec = matchSpecForPath(pathname, userType);
    if (!spec) return;
    if (isTourDone(userId, spec.id)) return;

    const timer = setTimeout(() => startTour(spec), 350);
    return () => clearTimeout(timer);
  }, [authLoading, userId, userType, pathname, isTourActive, startTour]);

  useEffect(() => {
    if (authLoading || !userId || !userType || isTourActive) return;
    if (!pathname) return;
    if (isReturningUser(userId)) return;

    let cancelled = false;
    const chromeSpec = TOUR_REGISTRY.find((s) => s.id === 'chrome.universal');
    if (!chromeSpec) return;
    if (isTourDone(userId, 'chrome.universal')) return;

    const timer = setTimeout(() => {
      if (!cancelled) {
        startDriver(chromeSpec);
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [authLoading, userId, userType, pathname, isTourActive, startDriver]);

  const resetTour = useCallback(() => {
    if (!userId) return;
    resetTourFlags(userId);
    setTourCompleted(false);
  }, [userId]);

  const value = useMemo<ProductTourContextType>(
    () => ({
      startTour,
      isTourActive,
      tourCompleted,
      resetTour,
    }),
    [startTour, isTourActive, tourCompleted, resetTour],
  );

  return <ProductTourContext.Provider value={value}>{children}</ProductTourContext.Provider>;
}


