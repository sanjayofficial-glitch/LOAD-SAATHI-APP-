import { createContext } from 'react';
import type { GuideEngine, GuideState, GuideStep } from './DishaGuideEngine';

export interface DishaGuideContextValue {
  engine: GuideEngine;
  state: GuideState;
  currentStep: GuideStep | null;
  targetPosition: { x: number; y: number; side: string; targetRect: DOMRect | null } | null;
  registerPageElements: (elements: Record<string, HTMLElement>) => void;
  startFlow: (flowId: string) => boolean;
  /** True when the mascot is showing a "Can I guide you?" offer bubble. */
  offerPending: boolean;
  /** Accept the pending offer and begin the guided walkthrough. */
  acceptGuide: () => boolean;
  /** Decline the pending offer and park the mascot back in its circle. */
  declineGuide: () => boolean;
  nextStep: () => void;
  previousStep: () => void;
  dismissStep: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setPreferences: (prefs: Partial<GuideState['userPreferences']>) => void;
  handleFieldFocus: (selector: string) => void;
  handleValidationError: (selector: string, isValid: boolean) => void;
  handleSuccess: (selector: string) => void;
  handleClick: (selector: string) => void;
}

export const DishaGuideContext = createContext<DishaGuideContextValue | null>(null);
