import { useEffect, useState } from 'react';
import type { DishaMood } from './DishaMascot';
// Guide engine - no React hooks needed beyond subscribe-based state management

export interface GuideStep {
  id: string;
  target: string;
  message: string;
  mood: DishaMood;
  action?: 'click' | 'fill' | 'select' | 'wait' | 'hover';
  validation?: (value: unknown) => boolean;
  example?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  trigger?: 'page-enter' | 'field-focus' | 'validation-error' | 'idle' | 'success' | 'manual';
  delay?: number;
  required?: boolean;
  skipIf?: () => boolean;
}

export interface GuideFlow {
  id: string;
  name: string;
  pages: string[];
  steps: GuideStep[];
  autoStart?: boolean;
  oncePerUser?: boolean;
  priority?: number;
  /**
   * Ask before guiding. When true, the mascot shows a small "Can I guide you?"
   * offer bubble instead of diving straight into the walkthrough. The flow
   * starts only after the user accepts; declining/ignoring parks the mascot
   * back in its circle.
   */
  offerFirst?: boolean;
}

export interface GuideState {
  activeFlowId: string | null;
  currentStepIndex: number;
  isActive: boolean;
  isPaused: boolean;
  /** A flow is waiting for the user to accept the guided walkthrough (offer bubble). */
  offerPending: boolean;
  completedFlows: Set<string>;
  dismissedSteps: Set<string>;
  userPreferences: {
    autoGuide: boolean;
    verbosity: 'minimal' | 'normal' | 'verbose';
    showSpotlight: boolean;
  };
  targetPosition?: { x: number; y: number; side: string; targetRect?: DOMRect | null };
}

export interface TargetElementInfo {
  element: HTMLElement | null;
  rect: DOMRect | null;
  selector: string;
}

const GUIDE_STORAGE_KEY = 'loadsaathi-disha-guide-state';

const defaultPreferences: GuideState['userPreferences'] = {
  autoGuide: true,
  verbosity: 'normal',
  showSpotlight: true,
};

function saveGuideState(state: Partial<GuideState>) {
  if (typeof window === 'undefined') return;
  try {
    const toStore = {
      completedFlows: Array.from(state.completedFlows || []),
      dismissedSteps: Array.from(state.dismissedSteps || []),
      userPreferences: state.userPreferences,
    };
    localStorage.setItem(GUIDE_STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // ignore
  }
}

export function createGuideEngine(flows: GuideFlow[]) {
  const flowMap = new Map(flows.map(f => [f.id, f]));
  const pageToFlows = new Map<string, GuideFlow[]>();

  flows.forEach(flow => {
    flow.pages.forEach(page => {
      const existing = pageToFlows.get(page) || [];
      existing.push(flow);
      pageToFlows.set(page, existing);
    });
  });

  pageToFlows.forEach(flows => {
    flows.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  });

  let currentState: GuideState = {
    activeFlowId: null,
    currentStepIndex: 0,
    isActive: false,
    isPaused: false,
    offerPending: false,
    completedFlows: new Set(),
    dismissedSteps: new Set(),
    userPreferences: defaultPreferences,
  };

  const listeners = new Set<(state: GuideState) => void>();
  let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let currentFlow: GuideFlow | null = null;

  function notify() {
    listeners.forEach(l => l({ ...currentState }));
  }

  function getState(): GuideState {
    return { ...currentState };
  }

  function subscribe(listener: (state: GuideState) => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }

  function setPreferences(prefs: Partial<GuideState['userPreferences']>) {
    currentState.userPreferences = { ...currentState.userPreferences, ...prefs };
    saveGuideState(currentState);
    notify();
  }

  function findTargetElement(selector: string): TargetElementInfo {
    if (typeof document === 'undefined') {
      return { element: null, rect: null, selector };
    }
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) {
      return { element: null, rect: null, selector };
    }
    const rect = element.getBoundingClientRect();
    return { element, rect, selector };
  }

  const MASCOT_SIZE = 150;
  const PARK_GAP = 12;

  function calculatePosition(targetRect: DOMRect, position: GuideStep['position'] = 'auto') {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 16;
    const half = MASCOT_SIZE / 2;

    const cx = targetRect.left + targetRect.width / 2;
    const cy = targetRect.top + targetRect.height / 2;

    type Candidate = { side: 'top' | 'bottom' | 'left' | 'right'; x: number; y: number; space: number };
    const candidates: Candidate[] = [
      { side: 'left', x: targetRect.left - PARK_GAP - half, y: cy, space: targetRect.left - margin - half - PARK_GAP },
      { side: 'right', x: targetRect.right + PARK_GAP + half, y: cy, space: viewportWidth - targetRect.right - margin - half - PARK_GAP },
      { side: 'top', x: cx, y: targetRect.top - PARK_GAP - half, space: targetRect.top - margin - half - PARK_GAP },
      { side: 'bottom', x: cx, y: targetRect.bottom + PARK_GAP + half, space: viewportHeight - targetRect.bottom - margin - half - PARK_GAP },
    ];

    const fits = (c: Candidate) =>
      c.x - half >= margin &&
      c.x + half <= viewportWidth - margin &&
      c.y - half >= margin &&
      c.y + half <= viewportHeight - margin;

    let chosen: Candidate;
    if (position && position !== 'auto') {
      chosen = candidates.find((c) => c.side === position) ?? candidates[3]!;
    } else {
      const fitting = candidates.filter(fits);
      chosen = fitting.sort((a, b) => b.space - a.space)[0] ?? candidates[3]!;
    }

    const x = Math.max(margin + half, Math.min(viewportWidth - margin - half, chosen.x));
    const y = Math.max(margin + half, Math.min(viewportHeight - margin - half, chosen.y));

    return { x, y, side: chosen.side };
  }

  function startFlow(flowId: string, startStep = 0, asOffer = false) {
    const flow = flowMap.get(flowId);
    if (!flow) return false;

    if (flow.oncePerUser && currentState.completedFlows.has(flowId)) {
      return false;
    }

    // Offer-first flows always ask before guiding (explicit opt-in). They never
    // auto-run, even if the user previously disabled auto-guide.
    const shouldOffer = asOffer || !!flow.offerFirst;
    if (!shouldOffer && !currentState.userPreferences.autoGuide && flow.autoStart) {
      return false;
    }

    // Don't restart if already active or already offered — prevents resetting
    // progress on page changes / duplicate offers.
    if (
      currentState.activeFlowId === flowId &&
      (currentState.isActive || currentState.offerPending)
    ) {
      return true;
    }

    currentFlow = flow;

    if (shouldOffer) {
      currentState = {
        ...currentState,
        activeFlowId: flowId,
        currentStepIndex: 0,
        isActive: false,
        isPaused: false,
        offerPending: true,
      };
      saveGuideState(currentState);
      notify();
      return true;
    }

    currentState = {
      ...currentState,
      activeFlowId: flowId,
      currentStepIndex: startStep,
      isActive: true,
      isPaused: false,
      offerPending: false,
    };
    saveGuideState(currentState);
    notify();
    advanceToStep(startStep);
    return true;
  }

  /**
   * The user accepted the offer — begin the guided walkthrough. Any steps that
   * were dismissed in earlier sessions are cleared for this flow so an explicit
   * "yes" always yields a full guide.
   */
  function acceptGuide() {
    if (!currentState.offerPending || !currentFlow) return false;

    const flow = currentFlow;
    flow.steps.forEach((step) => {
      currentState.dismissedSteps.delete(`${flow.id}-${step.id}`);
    });

    currentState = {
      ...currentState,
      offerPending: false,
      isActive: true,
      currentStepIndex: 0,
      isPaused: false,
    };
    saveGuideState(currentState);
    notify();
    advanceToStep(0);
    return true;
  }

  /**
   * The user declined the offer — park the mascot back in its circle. The flow
   * can still be started later via a manual tap on the mascot.
   */
  function declineGuide() {
    if (!currentState.offerPending) return false;

    currentState = {
      ...currentState,
      offerPending: false,
      activeFlowId: null,
      currentStepIndex: 0,
      isActive: false,
      isPaused: false,
    };
    saveGuideState(currentState);
    notify();
    return true;
  }

  function advanceToStep(stepIndex: number) {
    if (!currentFlow) return;
    if (stepIndex >= currentFlow.steps.length) {
      completeFlow();
      return;
    }

    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }

    const step = currentFlow.steps[stepIndex];

    if (step === undefined) {
      completeFlow();
      return;
    }

    if (step.skipIf?.()) {
      advanceToStep(stepIndex + 1);
      return;
    }

    if (currentState.dismissedSteps.has(`${currentFlow.id}-${step.id}`)) {
      advanceToStep(stepIndex + 1);
      return;
    }

    currentState.currentStepIndex = stepIndex;
    saveGuideState(currentState);
    notify();

    const targetInfo = findTargetElement(step.target);
    if (targetInfo.element && targetInfo.rect) {
      notify();
    } else {
      notify();
    }

    if (step.delay && step.delay > 0) {
      autoAdvanceTimer = setTimeout(() => {
        if (!currentState.isPaused) {
          advanceToStep(stepIndex + 1);
        }
      }, step.delay);
    }

    if (step.trigger === 'idle') {
      idleTimer = setTimeout(() => {
        if (!currentState.isPaused && currentState.currentStepIndex === stepIndex) {
          advanceToStep(stepIndex + 1);
        }
      }, 30000);
    }
  }

  function nextStep() {
    if (!currentFlow) return;
    advanceToStep(currentState.currentStepIndex + 1);
  }

  function previousStep() {
    if (!currentFlow) return;
    advanceToStep(Math.max(0, currentState.currentStepIndex - 1));
  }

  function dismissCurrentStep() {
    if (!currentFlow) return;
    const step = currentFlow.steps[currentState.currentStepIndex];
    if (!step) return;
    currentState.dismissedSteps.add(`${currentFlow.id}-${step.id}`);
    saveGuideState(currentState);
    nextStep();
  }

  function pauseGuide() {
    currentState.isPaused = true;
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
    notify();
  }

  function resumeGuide() {
    currentState.isPaused = false;
    notify();
    advanceToStep(currentState.currentStepIndex);
  }

  function completeFlow() {
    if (!currentFlow) return;
    currentState.completedFlows.add(currentFlow.id);
    currentState.activeFlowId = null;
    currentState.currentStepIndex = 0;
    currentState.isActive = false;
    currentState.offerPending = false;
    currentFlow = null;
    saveGuideState(currentState);
    notify();
  }

  function stopGuide() {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
    currentFlow = null;
    currentState = {
      ...currentState,
      activeFlowId: null,
      currentStepIndex: 0,
      isActive: false,
      isPaused: false,
      offerPending: false,
    };
    saveGuideState(currentState);
    notify();
  }

  function handlePageChange(pathname: string) {
    const flowsForPage = pageToFlows.get(pathname) || [];
    const autoFlow = flowsForPage.find(f => f.autoStart);

    if (autoFlow) {
      // If the current flow is already active (or offered) on this page, just
      // re-evaluate the current step's target (it may have moved to a new page)
      if (
        currentState.activeFlowId === autoFlow.id &&
        (currentState.isActive || currentState.offerPending)
      ) {
        // Check if current step's target still exists; if not, skip to next
        const step = currentFlow?.steps[currentState.currentStepIndex];
        if (step) {
          const targetInfo = findTargetElement(step.target);
          if (!targetInfo.element) {
            // Target not found on new page, advance to find a valid step
            advanceToStep(currentState.currentStepIndex + 1);
          } else {
            // Target exists, re-evaluate position
            getCurrentTargetPosition();
          }
        }
        return;
      }
      startFlow(autoFlow.id);
    }
  }

  function handleFieldFocus(selector: string) {
    if (!currentFlow || currentState.isPaused) return;
    const step = currentFlow.steps[currentState.currentStepIndex];

    // If current step matches, resume it
    if (step && step.target === selector && step.trigger === 'field-focus') {
      resumeGuide();
      return;
    }

    // If a FUTURE step has this target with field-focus trigger, advance to it
    for (let i = currentState.currentStepIndex + 1; i < currentFlow.steps.length; i++) {
      const futureStep = currentFlow.steps[i];
      if (futureStep && futureStep.target === selector && futureStep.trigger === 'field-focus') {
        advanceToStep(i);
        return;
      }
    }
  }

  function handleValidationError(selector: string, isValid: boolean) {
    if (!currentFlow || currentState.isPaused) return;
    const step = currentFlow.steps[currentState.currentStepIndex];

    // If current step matches, resume it
    if (step && step.target === selector && step.trigger === 'validation-error' && !isValid) {
      resumeGuide();
      return;
    }

    // If a FUTURE step matches, advance to it
    if (!isValid) {
      for (let i = currentState.currentStepIndex + 1; i < currentFlow.steps.length; i++) {
        const futureStep = currentFlow.steps[i];
        if (futureStep && futureStep.target === selector && futureStep.trigger === 'validation-error') {
          advanceToStep(i);
          return;
        }
      }
    }
  }

  function handleSuccess(selector: string) {
    if (!currentFlow || currentState.isPaused) return;
    const step = currentFlow.steps[currentState.currentStepIndex];
    if (step && step.target === selector && step.trigger === 'success') {
      nextStep();
    }
  }

  function handleClick(selector: string) {
    if (!currentFlow || currentState.isPaused) return;
    const step = currentFlow.steps[currentState.currentStepIndex];
    if (
      step &&
      (step.target === selector || step.target === `[data-guide="${selector}"]`) &&
      (step.action === 'click' || step.trigger === 'page-enter')
    ) {
      nextStep();
    }
  }

  function getCurrentStep(): GuideStep | null {
    if (!currentFlow) return null;
    return currentFlow.steps[currentState.currentStepIndex] || null;
  }

  function getCurrentTargetPosition(): { x: number; y: number; side: string; targetRect: DOMRect | null } | null {
    const step = getCurrentStep();
    if (!step) return null;
    const targetInfo = findTargetElement(step.target);
    if (!targetInfo.rect) return null;
    const pos = calculatePosition(targetInfo.rect, step.position);
    return { ...pos, targetRect: targetInfo.rect };
  }

  function recalculatePosition() {
    if (!currentState.isActive) return;
    const step = getCurrentStep();
    if (!step) return;
    const targetInfo = findTargetElement(step.target);
    if (targetInfo.rect) {
      const pos = calculatePosition(targetInfo.rect, step.position);
      currentState.targetPosition = { ...pos, targetRect: targetInfo.rect };
      notify();
    }
  }

  return {
    getState,
    subscribe,
    setPreferences,
    startFlow,
    acceptGuide,
    declineGuide,
    nextStep,
    previousStep,
    dismissCurrentStep,
    pauseGuide,
    resumeGuide,
    stopGuide,
    completeFlow,
    handlePageChange,
    handleFieldFocus,
    handleValidationError,
    handleSuccess,
    handleClick,
    getCurrentStep,
    getCurrentTargetPosition,
    recalculatePosition,
    getFlows: () => flows,
    getFlow: (id: string) => flowMap.get(id),
  };
}

export type GuideEngine = ReturnType<typeof createGuideEngine>;

export const guideFlows: GuideFlow[] = [
  {
    id: 'home',
    name: 'Home Page Guide',
    pages: ['/'],
    autoStart: true,
    oncePerUser: true,
    priority: 15,
    steps: [
      {
        id: 'hero-cta',
        target: '[data-guide="hero-shipper-cta"], [data-guide="hero-trucker-cta"]',
        message: 'Ready to get started? Tap "I Want to Ship Goods" or "I Have Truck Space" to begin.',
        mood: 'excited',
        trigger: 'page-enter',
        position: 'top',
        skipIf: () => {
          if (typeof document === 'undefined') return true
          return !document.querySelector('[data-guide="hero-shipper-cta"], [data-guide="hero-trucker-cta"]')
        },
      },
    ],
  },
  {
    id: 'shipper-dashboard',
    name: 'Shipper Dashboard Guide',
    pages: ['/shipper/dashboard'],
    autoStart: true,
    oncePerUser: true,
    priority: 10,
    steps: [
      {
        id: 'post-load',
        target: '[data-guide="post-load-btn"]',
        message: 'Start by posting your load — fill in pickup and drop-off details.',
        mood: 'excited',
        trigger: 'page-enter',
        position: 'top',
        skipIf: () => {
          if (typeof document === 'undefined') return true
          return !document.querySelector('[data-guide="post-load-btn"]')
        },
      },
      {
        id: 'find-trucks',
        target: '[data-guide="find-trucks-btn"]',
        message: 'Or browse available trucks for your route.',
        mood: 'listening',
        trigger: 'idle',
        delay: 15000,
        position: 'top',
        skipIf: () => {
          if (typeof document === 'undefined') return true
          return !document.querySelector('[data-guide="find-trucks-btn"]')
        },
      },
      {
        id: 'my-shipments',
        target: '[data-guide="my-shipments-btn"]',
        message: 'Track your existing loads here.',
        mood: 'idle',
        trigger: 'idle',
        delay: 30000,
        position: 'top',
        skipIf: () => {
          if (typeof document === 'undefined') return true
          return !document.querySelector('[data-guide="my-shipments-btn"]')
        },
      },
    ],
  },
  {
    id: 'trucker-dashboard',
    name: 'Trucker Dashboard Guide',
    pages: ['/trucker/dashboard'],
    autoStart: true,
    oncePerUser: true,
    priority: 10,
    steps: [
      {
        id: 'post-trip',
        target: '[data-guide="post-trip-btn"]',
        message: 'Got a trip? Post it and get matched with shippers automatically.',
        mood: 'excited',
        trigger: 'page-enter',
        position: 'top',
        skipIf: () => {
          if (typeof document === 'undefined') return true
          return !document.querySelector('[data-guide="post-trip-btn"]')
        },
      },
      {
        id: 'find-loads',
        target: '[data-guide="find-loads-btn"]',
        message: 'Looking for loads? Browse available shipments matching your route.',
        mood: 'listening',
        trigger: 'idle',
        delay: 15000,
        position: 'top',
        skipIf: () => {
          if (typeof document === 'undefined') return true
          return !document.querySelector('[data-guide="find-loads-btn"]')
        },
      },
      {
        id: 'manage-trips',
        target: '[data-guide="manage-trips-btn"]',
        message: 'Manage your active trips and update status.',
        mood: 'idle',
        trigger: 'idle',
        delay: 30000,
        position: 'top',
        skipIf: () => {
          if (typeof document === 'undefined') return true
          return !document.querySelector('[data-guide="manage-trips-btn"]')
        },
      },
    ],
  },
  {
    id: 'post-load',
    name: 'Post a Load',
    pages: ['/shipper/post-shipment'],
    autoStart: true,
    oncePerUser: false,
    offerFirst: true,
    priority: 10,
    steps: [
      {
        id: 'origin-city',
        target: '[name="originCity"], [name="origin_city"], [data-guide="origin-city"]',
        message: 'Where does the load start? Pick a pickup city.',
        mood: 'listening',
        trigger: 'page-enter',
        position: 'top',
        required: true,
      },
      {
        id: 'dest-city',
        target: '[name="destCity"], [name="dest_city"], [data-guide="dest-city"]',
        message: 'Where is the load going? Choose a delivery city.',
        mood: 'listening',
        trigger: 'field-focus',
        position: 'top',
        required: true,
      },
      {
        id: 'weight',
        target: '[name="weightKg"], [name="weight_kg"], [data-guide="weight"]',
        message: 'Enter weight in kg (e.g., 5000 for 5 tons).',
        mood: 'idle',
        trigger: 'field-focus',
        position: 'top',
        example: '5000',
        required: true,
      },
      {
        id: 'budget',
        target: '[name="budgetPerTonne"], [name="budget_per_tonne"], [data-guide="budget"]',
        message: 'Enter your budget per tonne (₹). The AI can suggest a fair price!',
        mood: 'thinking',
        trigger: 'field-focus',
        position: 'top',
        example: '1500',
      },
      {
        id: 'departure-date',
        target: '[name="departureDate"], [name="departure_date"], [data-guide="date"]',
        message: 'When do you need the load picked up?',
        mood: 'idle',
        trigger: 'field-focus',
        position: 'top',
      },
      {
        id: 'submit',
        target: 'button[type="submit"], [data-guide="submit"]',
        message: 'All set! Tap to post your load and find trucks.',
        mood: 'excited',
        action: 'click',
        trigger: 'success',
        position: 'bottom',
      },
    ],
  },
  {
    id: 'post-trip',
    name: 'Post a Trip',
    pages: ['/trucker/post-trip'],
    autoStart: true,
    oncePerUser: false,
    offerFirst: true,
    priority: 10,
    steps: [
      {
        id: 'origin-city',
        target: '[name="originCity"], [name="origin_city"], [data-guide="origin-city"]',
        message: 'Where does your trip start? Pick a city.',
        mood: 'listening',
        trigger: 'page-enter',
        position: 'top',
        required: true,
      },
      {
        id: 'dest-city',
        target: '[name="destCity"], [name="dest_city"], [data-guide="dest-city"]',
        message: 'Where are you heading? Choose destination.',
        mood: 'listening',
        trigger: 'field-focus',
        position: 'top',
        required: true,
      },
      {
        id: 'vehicle-type',
        target: '[name="vehicleType"], [name="vehicle_type"], [data-guide="vehicle-type"]',
        message: 'What truck are you driving?',
        mood: 'idle',
        trigger: 'field-focus',
        position: 'top',
        required: true,
      },
      {
        id: 'capacity',
        target: '[name="capacityKg"], [name="capacity_kg"], [data-guide="capacity"]',
        message: 'How much weight can you carry? (kg)',
        mood: 'idle',
        trigger: 'field-focus',
        position: 'top',
        example: '10000',
        required: true,
      },
      {
        id: 'price',
        target: '[name="pricePerKg"], [name="price_per_kg"], [data-guide="price"]',
        message: 'Your rate per kg. AI can suggest market price!',
        mood: 'thinking',
        trigger: 'field-focus',
        position: 'top',
        example: '3',
      },
      {
        id: 'departure-date',
        target: '[name="departureDate"], [name="departure_date"], [data-guide="departure-date"]',
        message: 'When do you depart?',
        mood: 'idle',
        trigger: 'field-focus',
        position: 'top',
      },
      {
        id: 'submit',
        target: 'button[type="submit"], [data-guide="submit"]',
        message: 'Trip ready! Post it and shippers will see your truck.',
        mood: 'excited',
        action: 'click',
        trigger: 'success',
        position: 'bottom',
      },
    ],
  },
  {
    id: 'signup',
    name: 'Sign Up & Onboarding',
    pages: ['/register', '/choose-role', '/onboarding'],
    autoStart: true,
    oncePerUser: true,
    priority: 20,
    steps: [
      {
        id: 'role-choice',
        target: '[data-guide="role-shipper"], [data-guide="role-trucker"]',
        message: 'Are you a Trucker (have a truck) or Shipper (have loads)? Tap your role.',
        mood: 'playful',
        trigger: 'page-enter',
        position: 'top',
        required: true,
        action: 'click',
        delay: 15000,
        skipIf: () => {
          if (typeof document === 'undefined') return true
          const shipperBtn = document.querySelector('[data-guide="role-shipper"]')
          const truckerBtn = document.querySelector('[data-guide="role-trucker"]')
          return !shipperBtn && !truckerBtn
        },
      },
      {
        id: 'email',
        target: '[data-guide="email"]',
        message: 'Enter your email — we\'ll send a verification code.',
        mood: 'playful',
        trigger: 'page-enter',
        position: 'top',
        required: true,
        skipIf: () => {
          if (typeof document === 'undefined') return true
          return !document.querySelector('[data-guide="email"]')
        },
      },
      {
        id: 'password',
        target: '[data-guide="password"]',
        message: 'Create a strong password (8+ chars, mix of letters/numbers).',
        mood: 'idle',
        trigger: 'field-focus',
        position: 'top',
        required: true,
      },
      {
        id: 'oauth',
        target: '[data-guide="oauth-google"]',
        message: 'Or sign up quickly with your Google account.',
        mood: 'listening',
        trigger: 'page-enter',
        position: 'top',
        skipIf: () => {
          if (typeof document === 'undefined') return true
          return !document.querySelector('[data-guide="oauth-google"]')
        },
      },
      {
        id: 'full-name',
        target: '[data-guide="full-name"]',
        message: 'Your full name — helps others know who they\'re working with.',
        mood: 'listening',
        trigger: 'field-focus',
        position: 'top',
        required: true,
      },
      {
        id: 'phone',
        target: '[data-guide="phone"]',
        message: 'Phone number (10 digits) — needed for load coordination.',
        mood: 'idle',
        trigger: 'field-focus',
        position: 'top',
        example: '9876543210',
        required: true,
      },
      {
        id: 'company',
        target: '[data-guide="company"]',
        message: 'Company name (optional) — builds trust with partners.',
        mood: 'idle',
        trigger: 'field-focus',
        position: 'top',
        example: 'Singh Logistics',
      },
      {
        id: 'complete',
        target: '[data-guide="complete-onboarding"], button[type="submit"]',
        message: 'You\'re all set! Tap to complete setup.',
        mood: 'celebrate',
        action: 'click',
        trigger: 'page-enter',
        position: 'bottom',
      },
    ],
  },
   {
    id: 'login',
    name: 'Sign In',
    pages: ['/login'],
    autoStart: true,
    oncePerUser: false,
    priority: 15,
    steps: [
      {
        id: 'email',
        target: '[data-guide="email"]',
        message: 'Welcome back! Enter your email to sign in.',
        mood: 'playful',
        trigger: 'page-enter',
        position: 'top',
        skipIf: () => {
          if (typeof document === 'undefined') return true
          return !document.querySelector('[data-guide="email"]')
        },
      },
      {
        id: 'password',
        target: '[data-guide="password"]',
        message: 'Your password. Forgot it? Tap "Forgot password".',
        mood: 'idle',
        trigger: 'field-focus',
        position: 'top',
      },
      {
        id: 'submit',
        target: '[data-guide="login-submit"], button[type="submit"]',
        message: 'Sign in to access your dashboard.',
        mood: 'excited',
        action: 'click',
        trigger: 'success',
        position: 'bottom',
        skipIf: () => {
          if (typeof document === 'undefined') return true
          return !document.querySelector('[data-guide="login-submit"], button[type="submit"]')
        },
      },
    ],
  },
  {
    id: 'browse-shipments',
    name: 'Find Loads',
    pages: ['/trucker/browse-shipments', '/browse-trucks'],
    autoStart: false,
    oncePerUser: false,
    priority: 5,
    steps: [
      {
        id: 'filters',
        target: '[data-guide="filters"], .filter-panel, [role="search"]',
        message: 'Use filters to find loads matching your route and truck.',
        mood: 'listening',
        trigger: 'page-enter',
        position: 'top',
      },
      {
        id: 'load-card',
        target: '[data-guide="load-card"], .shipment-card',
        message: 'Tap a load to see details and request it.',
        mood: 'idle',
        trigger: 'idle',
        delay: 10000,
        position: 'bottom',
      },
      {
        id: 'request-btn',
        target: '[data-guide="request-btn"], button:has-text("Request")',
        message: 'Request this load — the shipper will get notified.',
        mood: 'excited',
        action: 'click',
        trigger: 'success',
        position: 'bottom',
      },
    ],
  },
  {
    id: 'browse-trips',
    name: 'Find Trucks',
    pages: ['/shipper/browse-trips', '/trucker/browse-shipments'],
    autoStart: false,
    oncePerUser: false,
    priority: 5,
    steps: [
      {
        id: 'filters',
        target: '[data-guide="filters"], .filter-panel, [role="search"]',
        message: 'Filter trucks by route, capacity, and vehicle type.',
        mood: 'listening',
        trigger: 'page-enter',
        position: 'top',
      },
      {
        id: 'trip-card',
        target: '[data-guide="trip-card"], .trip-card',
        message: 'Tap a trip to see truck details and request it.',
        mood: 'idle',
        trigger: 'idle',
        delay: 10000,
        position: 'bottom',
      },
    ],
  },
];

export const guideEngine = createGuideEngine(guideFlows);

export function useGuideEngine() {
  const [state, setState] = useState(guideEngine.getState());

  useEffect(() => {
    const unsubscribe = guideEngine.subscribe(setState);
    return () => unsubscribe();
  }, []);

  return {
    ...guideEngine,
    state,
  };
}