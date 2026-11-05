import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDishaGuide } from '@/components/DishaGuideProvider';
import type { GuideFlow } from '@/components/DishaGuideEngine';

interface UseDishaGuideOptions {
  flowId?: string;
  customFlow?: GuideFlow;
  elements?: Record<string, React.RefObject<HTMLElement> | HTMLElement | null>;
  autoRegister?: boolean;
}

export function useDishaGuideRegistration(options: UseDishaGuideOptions = {}) {
  const {
    flowId,
    customFlow,
    elements = {},
    autoRegister = true,
  } = options;

  const {
    engine,
    state,
    registerPageElements,
    startFlow,
    handleFieldFocus,
    handleValidationError,
    handleSuccess,
  } = useDishaGuide();

  const elementRefs = useRef<Record<string, React.RefObject<HTMLElement>>>({});
  const mountedElements = useRef<Record<string, HTMLElement>>({});

  const registerElement = useCallback((key: string, ref: React.RefObject<HTMLElement> | HTMLElement | null) => {
    if (!ref) return;
    if ('current' in ref) {
      elementRefs.current[key] = ref;
    } else {
      const refObj = { current: ref } as React.RefObject<HTMLElement>;
      elementRefs.current[key] = refObj;
    }
  }, []);

  const unregisterElement = useCallback((key: string) => {
    delete elementRefs.current[key];
    delete mountedElements.current[key];
  }, []);

  useEffect(() => {
    if (!autoRegister) return;

    const toRegister: Record<string, HTMLElement> = {};
    Object.entries(elements).forEach(([key, el]) => {
      if (el && 'current' in el) {
        toRegister[`[data-guide="${key}"]`] = el.current as HTMLElement;
        mountedElements.current[key] = el.current as HTMLElement;
      } else if (el && (el as HTMLElement).tagName !== undefined) {
        toRegister[`[data-guide="${key}"]`] = el as HTMLElement;
        mountedElements.current[key] = el as HTMLElement;
      }
    });

    Object.entries(elementRefs.current).forEach(([key, ref]) => {
      if (ref.current) {
        toRegister[`[data-guide="${key}"]`] = ref.current;
        mountedElements.current[key] = ref.current;
      }
    });

    if (Object.keys(toRegister).length > 0) {
      registerPageElements(toRegister);
    }

    return () => {
      registerPageElements({});
    };
  }, [registerPageElements, autoRegister, elements]);

  useEffect(() => {
    if (customFlow) {
      engine.getFlows();
    }
  }, [customFlow, engine]);

  useEffect(() => {
    if (!flowId) return;
    // Offer-first flows always present their "Can I guide you?" ask (the offer
    // itself is the opt-in), even if auto-guide was turned off.
    const flow = engine.getFlow(flowId);
    if (flow?.offerFirst || state.userPreferences.autoGuide) {
      startFlow(flowId);
    }
  }, [flowId, state.userPreferences.autoGuide, startFlow, engine]);

  const getElementRef = useCallback((key: string) => {
    return elementRefs.current[key] || { current: null };
  }, []);

  const setElementRef = useCallback((key: string) => {
    return (el: HTMLElement | null) => {
      if (el) {
        const ref = { current: el } as React.RefObject<HTMLElement>;
        elementRefs.current[key] = ref;
        mountedElements.current[key] = el;
      } else {
        delete elementRefs.current[key];
        delete mountedElements.current[key];
      }
    };
  }, []);

  const notifyFieldFocus = useCallback((key: string) => {
    handleFieldFocus(`[data-guide="${key}"]`);
  }, [handleFieldFocus]);

  const notifyValidationError = useCallback((key: string, isValid: boolean) => {
    handleValidationError(`[data-guide="${key}"]`, isValid);
  }, [handleValidationError]);

  const notifySuccess = useCallback((key: string) => {
    handleSuccess(`[data-guide="${key}"]`);
  }, [handleSuccess]);

  const guideProps = useMemo(() => ({
    'data-guide': '',
  }), []);

  return {
    registerElement,
    unregisterElement,
    getElementRef,
    setElementRef,
    notifyFieldFocus,
    notifyValidationError,
    notifySuccess,
    guideProps,
    engine,
    state,
    currentStep: engine.getCurrentStep(),
    targetPosition: engine.getCurrentTargetPosition(),
  };
}

export function createGuideRefs<T extends Record<string, React.RefObject<HTMLElement>>>(keys: (keyof T)[]): T {
  const refs = {} as T;
  keys.forEach(key => {
    refs[key] = { current: null } as unknown as T[keyof T];
  });
  return refs;
}

export function withGuide<T extends React.ComponentType<any>>(
  Component: T,
  flowId: string,
  elementKeys: string[]
): T {
  const displayName = Component.displayName || Component.name || 'Component';
  const WithGuide = (props: any) => {
    const guide = useDishaGuideRegistration({ flowId });
    const refs = useMemo(() => createGuideRefs<Record<string, React.RefObject<HTMLElement>>>(elementKeys), [elementKeys]);

    useEffect(() => {
      elementKeys.forEach(key => {
        const ref = refs[key];
        if (ref && ref.current) {
          guide.registerElement(key, ref);
        }
      });
    }, [elementKeys, refs, guide]);

    return <Component {...props} {...guide} guideRefs={refs} />;
  };
  WithGuide.displayName = `withGuide(${displayName})`;
  return WithGuide as T;
}
