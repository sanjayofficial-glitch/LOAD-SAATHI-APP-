import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { guideEngine } from './DishaGuideEngine';

import { DishaGuideContext, type DishaGuideContextValue } from './DishaGuideProvider.shared';

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

  const currentStep = useMemo(() => {
    void state.currentStepIndex;
    return guideEngine.getCurrentStep();
  }, [state.currentStepIndex]);
  const targetPosition = useMemo(() => {
    void state.currentStepIndex;
    return guideEngine.getCurrentTargetPosition();
  }, [state.currentStepIndex]);

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
    [state, currentStep, targetPosition, registerPageElements]
  );

  return (
    <DishaGuideContext.Provider value={value}>
      {children}
    </DishaGuideContext.Provider>
  );
}


