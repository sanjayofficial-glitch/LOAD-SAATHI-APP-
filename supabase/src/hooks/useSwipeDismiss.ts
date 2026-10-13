import { useCallback, useRef } from "react";
import type * as React from "react";

import { project, rubberband } from "@/lib/motion";

export type SwipeDirection = "down" | "up" | "right" | "left";

export interface SwipeDismissOptions {
  /** Only track while enabled (e.g. disable while a nested scroll is active). */
  enabled?: boolean;
  /** Which way the surface is dismissed. Default `"down"` (bottom sheets). */
  direction?: SwipeDirection;
  /** Called once the gesture commits to a dismissal. */
  onDismiss: () => void;
  /** Fraction of the element size past which the surface dismisses. Default 0.35. */
  threshold?: number;
  /** Minimum flick velocity (px/s) that dismisses regardless of distance. Default 500. */
  velocityThreshold?: number;
  /** Movement (px) before the gesture is considered a drag rather than a tap. */
  activationThreshold?: number;
}

interface Point {
  t: number;
  x: number;
  y: number;
}

const RESIST = 0.55;

/**
 * Drag-to-dismiss for bottom sheets / drawers, built on Pointer Events with a
 * grab offset, velocity history, momentum projection and rubber-banding.
 *
 * The interaction is interruptible and the release animates *from the current
 * value at the finger's velocity* — no seam between dragging and animating.
 * Attach the returned handlers to the sheet's drag handle/header (not the
 * scrollable body) so it never fights content scrolling.
 */
export function useSwipeDismiss<T extends HTMLElement = HTMLElement>(
  options: SwipeDismissOptions,
) {
  const {
    enabled = true,
    direction = "down",
    onDismiss,
    threshold = 0.35,
    velocityThreshold = 500,
    activationThreshold = 8,
  } = options;

  const ref = useRef<T | null>(null);
  const state = useRef({
    active: false,
    started: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    size: 1,
    offset: 0,
    history: [] as Point[],
  });

  const axis = direction === "down" || direction === "up" ? "y" : "x";
  const sign = direction === "down" || direction === "right" ? 1 : -1;

  const setTransform = useCallback(
    (value: number, animate: boolean, fromVelocity = 0) => {
      const el = ref.current;
      if (!el) return;
      const prop = axis === "y" ? "translateY" : "translateX";
      if (!animate) {
        el.style.transition = "none";
        el.style.transform = `${prop}(${value}px)`;
        return;
      }
      // Time to cover the remaining distance, bounded — so a fast flick with
      // little distance left settles quickly (velocity continuity).
      const remaining = Math.abs(value - state.current.offset);
      const speed = Math.max(Math.abs(fromVelocity), 1);
      const dur = Math.min(360, Math.max(160, (remaining / speed) * 1000));
      el.style.transition = `transform ${dur}ms var(--ease-ios)`;
      el.style.transform = `${prop}(${value}px)`;
    },
    [axis],
  );

  const clearTransform = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "";
    el.style.transform = "";
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<T>) => {
      if (!enabled || e.button !== 0) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      state.current = {
        active: true,
        started: false,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        size: (axis === "y" ? rect.height : rect.width) || 1,
        offset: 0,
        history: [{ t: e.timeStamp, x: e.clientX, y: e.clientY }],
      };
      el.setPointerCapture?.(e.pointerId);
    },
    [enabled, axis],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      const s = state.current;
      if (!s.active) return;
      const rawDx = e.clientX - s.startX;
      const rawDy = e.clientY - s.startY;
      const raw = axis === "y" ? rawDy : rawDx;

      if (!s.started) {
        if (Math.abs(raw) < activationThreshold) return;
        // Only claim the gesture if it's moving the dismiss way.
        if (Math.sign(raw) !== sign) return;
        s.started = true;
        s.history = [{ t: e.timeStamp, x: e.clientX, y: e.clientY }];
      }

      s.history.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
      if (s.history.length > 6) s.history.shift();

      // 1:1 in the dismiss direction; rubber-band (soft boundary) the other way.
      const along = raw * sign;
      const resisted = along > 0 ? along : rubberband(along, s.size, RESIST);
      const offset = resisted * sign;
      s.offset = offset;
      setTransform(offset, false);
      e.preventDefault?.();
    },
    [axis, sign, activationThreshold, setTransform],
  );

  const release = useCallback(() => {
    const s = state.current;
    if (!s.active || !s.started) {
      state.current.active = false;
      return;
    }
    const first = s.history[0];
    const last = s.history[s.history.length - 1];
    if (!first || !last) {
      state.current.active = false;
      setTransform(0, true, 0);
      return;
    }
    const dt = Math.max(last.t - first.t, 1) / 1000;
    const dv = (axis === "y" ? last.y - first.y : last.x - first.x) / dt;
    const velocity = dv; // px/s in natural axis coords
    const projected = s.offset + project(velocity, 0.998);
    const commit =
      Math.sign(velocity) === sign &&
      (Math.abs(projected) > s.size * threshold ||
        Math.abs(velocity) > velocityThreshold);

    if (commit) {
      const target = s.size * sign * 1.05;
      setTransform(target, true, velocity);
      const el = ref.current;
      const finish = () => {
        el?.removeEventListener("transitionend", finish);
        onDismiss();
        // Reset so the next open starts clean, after the exit paints.
        requestAnimationFrame(() => clearTransform());
      };
      if (el) {
        el.addEventListener("transitionend", finish, { once: true });
        // Failsafe in case transitionend is missed.
        window.setTimeout(finish, 420);
      } else {
        onDismiss();
      }
    } else {
      setTransform(0, true, velocity);
      const el = ref.current;
      const settle = () => {
        el?.removeEventListener("transitionend", settle);
        clearTransform();
        state.current.offset = 0;
      };
      if (el) {
        el.addEventListener("transitionend", settle, { once: true });
        window.setTimeout(settle, 420);
      }
    }
    state.current.active = false;
  }, [axis, sign, threshold, velocityThreshold, onDismiss, setTransform, clearTransform]);

  const onPointerUp = useCallback(
    (e: React.PointerEvent<T>) => {
      if (state.current.pointerId === e.pointerId) {
        ref.current?.releasePointerCapture?.(e.pointerId);
      }
      release();
    },
    [release],
  );

  const onPointerCancel = useCallback(() => {
    // Treat cancel as a snap-back, never a dismiss.
    const s = state.current;
    s.active = false;
    s.started = false;
    clearTransform();
  }, [clearTransform]);

  return {
    ref,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}

export default useSwipeDismiss;
