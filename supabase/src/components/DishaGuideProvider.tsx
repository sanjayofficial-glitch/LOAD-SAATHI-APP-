import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { guideEngine, type GuideEngine, type GuideState, type GuideStep } from './DishaGuideEngine';

interface DishaGuideContextValue {
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

const DishaGuideContext = createContext<DishaGuideContextValue | null>(null);

export function DishaGuideProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [state, setState] = useState(guideEngine.getState());

  useEffect(() => {
    const unsubscribe = guideEngine.subscribe(setState);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    guideEngine.handlePageChange(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    if (!state.isActive) return;
    const handleScroll = () => guideEngine.recalculatePosition();
    const handleResize = () => guideEngine.recalculatePosition();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [state.isActive, state.currentStepIndex]);

  const currentStep = useMemo(() => guideEngine.getCurrentStep(), [state]);
  const targetPosition = useMemo(() => guideEngine.getCurrentTargetPosition(), [state]);

  const registerPageElements = useCallback(() => {}, []);

  const value = useMemo<DishaGuideContextValue>(
    () => ({
      engine: guideEngine,
      state,
      currentStep,
      targetPosition,
      registerPageElements,
      startFlow: guideEngine.startFlow,
      offerPending: state.offerPending,
      acceptGuide: guideEngine.acceptGuide,
      declineGuide: guideEngine.declineGuide,
      nextStep: guideEngine.nextStep,
      previousStep: guideEngine.previousStep,
      dismissStep: guideEngine.dismissCurrentStep,
      pause: guideEngine.pauseGuide,
      resume: guideEngine.resumeGuide,
      stop: guideEngine.stopGuide,
      setPreferences: guideEngine.setPreferences,
      handleFieldFocus: guideEngine.handleFieldFocus,
      handleValidationError: guideEngine.handleValidationError,
      handleSuccess: guideEngine.handleSuccess,
      handleClick: guideEngine.handleClick,
    }),
    [state, currentStep, targetPosition]
  );

  return (
    <DishaGuideContext.Provider value={value}>
      {children}
    </DishaGuideContext.Provider>
  );
}

export function useDishaGuide() {
  const context = useContext(DishaGuideContext);
  if (!context) {
    throw new Error('useDishaGuide must be used within DishaGuideProvider');
  }
  return context;
}

export function useDishaGuideStep() {
  const { currentStep, targetPosition, nextStep, previousStep, dismissStep, pause, resume, stop } = useDishaGuide();
  return { currentStep, targetPosition, nextStep, previousStep, dismissStep, pause, resume, stop };
}

export function useDishaGuidePreferences() {
  const { state, setPreferences } = useDishaGuide();
  return { preferences: state.userPreferences, setPreferences };
}

export function useDishaGuideFlow() {
  const { state, startFlow, stop } = useDishaGuide();
  return { activeFlowId: state.activeFlowId, isActive: state.isActive, startFlow, stop };
}
