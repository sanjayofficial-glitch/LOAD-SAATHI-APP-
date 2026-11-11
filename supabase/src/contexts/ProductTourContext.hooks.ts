import { useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { consumeTourEntryFlag } from '@/hooks/useProductTour';
import { ProductTourContext } from './ProductTourContext.shared';

export function useProductTourContext() {
  const ctx = useContext(ProductTourContext);
  if (ctx === undefined) {
    throw new Error('useProductTourContext must be used within a ProductTourProvider');
  }
  return ctx;
}

export function useProductTour() {
  const { userProfile } = useAuth();
  const ctx = useProductTourContext();
  const rawRole = userProfile?.user_type;
  const role = rawRole === 'trucker' || rawRole === 'shipper' ? rawRole : undefined;
  const userId = userProfile?.id;

  return useMemo(
    () => ({
      ...ctx,
      role,
      userId,
      tryConsumeAutoStartFlag: () => {
        if (!userId) return false;
        return consumeTourEntryFlag(userId);
      },
      markDone: () => {
        if (!userId) return;
      },
      setStartFlag: () => {
        if (!userId) return;
      },
    }),
    [ctx, userId, role],
  );
}
