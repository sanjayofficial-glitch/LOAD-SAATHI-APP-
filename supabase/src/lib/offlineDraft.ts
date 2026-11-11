import { useEffect, useRef, useState } from "react";

/**
 * Tiny offline draft persistence for the post forms. Saves form state to
 * sessionStorage (debounced) so a half-filled trip/shipment survives an
 * accidental refresh; a toast tells the user their draft came back.
 */
const DRAFT_PREFIX = "loadsaathi-draft-";

export function saveDraft<T>(key: string, value: T) {
  try {
    sessionStorage.setItem(`${DRAFT_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function loadDraft<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(`${DRAFT_PREFIX}${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearDraft(key: string) {
  try {
    sessionStorage.removeItem(`${DRAFT_PREFIX}${key}`);
  } catch {
    /* ignore */
  }
}

/**
 * Returns [draft, setDraft, clear] — setDraft persists (throttled by the
 * caller's own debounce when needed) and clear wipes both state + storage.
 */
export function useDraft<T>(key: string, initial: T | null = null) {
  const [draft, setDraftState] = useState<T | null>(() => loadDraft<T>(key) ?? initial);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const setDraft = (value: T) => {
    setDraftState(value);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => saveDraft(key, value), 400);
  };

  const clear = () => {
    clearDraft(key);
    setDraftState(null);
  };

  return [draft, setDraft, clear] as const;
}
