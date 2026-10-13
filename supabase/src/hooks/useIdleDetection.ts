import { useState, useEffect, useCallback } from 'react';

export function useIdleDetection(timeout = 30000) {
  const [idle, setIdle] = useState(false);
  const [lastActive, setLastActive] = useState(Date.now());

  const reset = useCallback(() => {
    setLastActive(Date.now());
    setIdle(false);
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const timer = setInterval(() => {
      if (Date.now() - lastActive > timeout) {
        setIdle(true);
      }
    }, 5000);

    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      clearInterval(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [lastActive, reset, timeout]);

  return { idle, reset };
}
