import { useContext } from 'react';
import { DishaGuideContext } from './DishaGuideProvider.shared';

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
