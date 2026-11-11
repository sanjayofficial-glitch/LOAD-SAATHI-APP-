import { createContext } from 'react';
import type { TourSpec } from '@/hooks/useProductTour';

export interface ProductTourContextType {
  startTour: (spec: TourSpec) => void;
  isTourActive: boolean;
  tourCompleted: boolean;
  resetTour: () => void;
}

export const ProductTourContext = createContext<ProductTourContextType | undefined>(undefined);
