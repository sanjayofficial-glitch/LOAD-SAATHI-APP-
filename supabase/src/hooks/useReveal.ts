import { useCallback, useLayoutEffect, useRef } from "react";

type RevealCallback = () => void;

/**
 * A single shared IntersectionObserver for the whole app. Instead of every page
 * mounting its own observer (which the codebase used to do in ~30 files), all
 * `.reveal` elements register here. One observer, one set of thresholds.
 */
const pending = new Map<Element, RevealCallback>();
let observer: IntersectionObserver | null = null;
let failsafeTimer: number | null = null;

function flush(el: Element) {
  const cb = pending.get(el);
  if (!cb) return;
  pending.delete(el);
  observer?.unobserve(el);
  cb();
}

/** Safety net: never leave content hidden. If the observer hasn't fired within
 *  a short window, reveal everything. This is what protects against the classic
 *  "second tap" / blank-section bug this codebase has fought before. */
function ensureFailsafe() {
  if (failsafeTimer != null || typeof window === "undefined") return;
  failsafeTimer = window.setTimeout(() => {
    failsafeTimer = null;
    pending.forEach((_cb, el) => flush(el));
  }, 1600);
}

function ensureObserver(): IntersectionObserver | null {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
    return null;
  }
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) flush(entry.target);
      }
    },
    { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
  );
  return observer;
}

export interface UseRevealOptions {
  /** Called once when the element first reveals. */
  onReveal?: () => void;
  /** Keep observing after reveal (default false — reveal once, unobserve). */
  repeat?: boolean;
}

/**
 * Attach the returned ref to any element to give it a scroll reveal.
 *
 * Content is visible by default. Elements already in the viewport at mount are
 * shown immediately (no hidden frame → no flash); elements below the fold are
 * staged to `data-reveal="out"` *before paint* and flipped to `"in"` when the
 * shared observer sees them. Reduced-motion users get the resting state at once.
 */
export function useReveal<T extends HTMLElement = HTMLElement>(
  options: UseRevealOptions = {},
) {
  const ref = useRef<T | null>(null);
  const { onReveal, repeat = false } = options;
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const io = ensureObserver();

    if (reduce || !io) {
      el.dataset.reveal = "in";
      return;
    }

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const alreadyInView = rect.top < vh * 0.92 && rect.bottom > 0;

    if (alreadyInView) {
      // Above the fold: show now — no flash of hidden content.
      el.dataset.reveal = "in";
      return;
    }

    el.dataset.reveal = "out";
    pending.set(el, () => {
      el.dataset.reveal = "in";
      onRevealRef.current?.();
    });
    ensureFailsafe();
    io.observe(el);

    return () => {
      pending.delete(el);
      io.unobserve(el);
      if (!repeat) return;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}

/** Programmatic access for imperative cases (e.g. revealing dynamically-inserted rows). */
export function useRevealTrigger() {
  return useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const io = ensureObserver();
    if (!io) {
      el.dataset.reveal = "in";
      return;
    }
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top < vh * 0.92 && rect.bottom > 0) {
      el.dataset.reveal = "in";
      return;
    }
    el.dataset.reveal = "out";
    pending.set(el, () => {
      el.dataset.reveal = "in";
    });
    ensureFailsafe();
    io.observe(el);
  }, []);
}

export default useReveal;
