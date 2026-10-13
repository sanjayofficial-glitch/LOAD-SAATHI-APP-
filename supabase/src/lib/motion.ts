/**
 * motion.ts — shared Apple-aligned motion primitives.
 *
 * The through-line (from Apple's *Designing Fluid Interfaces*): an interface
 * feels alive when motion starts from the current value, inherits the user's
 * velocity, projects momentum forward, and can be grabbed and reversed at any
 * instant. Springs are the tool; these helpers are the vocabulary.
 *
 * Nothing here imports a motion library — everything is plain math + string
 * tokens so it costs nothing until a component actually animates.
 */

import type * as React from "react";

/* ──────────────────────────── Easing ──────────────────────────── */

/** Fluid, decelerating curve — Apple's default feel for surfaces. */
export const EASE_IOS = [0.32, 0.72, 0, 1] as const;
/** Snappy settle — micro-feedback, press, small state changes. */
export const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;
/** Symmetric in/out — reversible transitions. */
export const EASE_IN_OUT_QUART = [0.76, 0, 0.24, 1] as const;
/** Gentle overshoot — only for momentum-carrying gestures. */
export const EASE_SPRING_SOFT = [0.34, 1.36, 0.64, 1] as const;

export const easeCss = (curve: readonly number[]) =>
  `cubic-bezier(${curve.join(", ")})`;

/* ──────────────────────────── Durations ──────────────────────────── */

/** Dwell times in ms. Springs have no fixed duration — these are for the
 *  CSS-transition surfaces where a spring would be overkill. */
export const DUR = {
  /** Instant feedback — fires on pointer-down. */
  press: 80,
  /** Micro state change (hover, focus, toggle). */
  fast: 120,
  /** Element enter / exit. */
  base: 180,
  /** Surface / sheet / large reposition. */
  slow: 260,
  /** Reveal + large scroll-driven entrances. */
  reveal: 420,
} as const;

/* ──────────────────────────── Springs ──────────────────────────── */

/**
 * Spring presets expressed in Motion / Framer Motion's designer-friendly
 * `bounce` + `duration` API (which maps cleanly to Apple's damping ratio +
 * response). Apple's shipped values:
 *
 *   move / reposition   damping 1.0, response 0.4   → no bounce
 *   rotation            damping 0.8, response 0.4   → slight bounce
 *   drawer / sheet      damping 0.8, response 0.3   → slight bounce
 *
 * `damping 1.0` (critically damped) is the house default; reserve bounce for
 * interactions the user actually threw.
 */
export const SPRING = {
  /** Critically damped, no overshoot — the default for most UI. */
  default: { type: "spring", bounce: 0, duration: 0.4 },
  /** Slightly bouncy — sheets, drawers, momentum interactions. */
  bouncy: { type: "spring", bounce: 0.2, duration: 0.4 },
  /** Snappy — small controls (switch thumbs, tabs, badges). */
  snappy: { type: "spring", stiffness: 420, damping: 32, mass: 0.9 },
  /** Loose — large surfaces, layout reflow. */
  gentle: { type: "spring", stiffness: 220, damping: 30, mass: 1.1 },
} as const;

/* ──────────────────────────── Physics ──────────────────────────── */

/** Clamp a number into an inclusive range. */
export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Rubber-banding: the further past a boundary the user drags, the less the
 * element follows. A hard stop reads as "frozen"; continuous resistance reads
 * as "responsive, but there's nothing more here".
 *
 * @param overshoot  Pixels dragged past the boundary (signed distance).
 * @param dimension  The element's size along that axis (px).
 * @param constant   Resistance constant. Apple's sample uses 0.55.
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  return (
    (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot))
  );
}

/**
 * Project where a gesture is *going* using exponential decay — exactly like
 * scroll deceleration — so a flick throws the element instead of dropping it.
 *
 * NOTE: this is Apple's shipped form, not the physics-textbook `v²/(2·decel)`.
 *
 * @param velocity        Release velocity in px/s.
 * @param decelerationRate 0.998 (normal scroll feel) → 0.99 (snappier).
 */
export function project(velocity: number, decelerationRate = 0.998) {
  return (velocity / 1000) * (decelerationRate / (1 - decelerationRate));
}

/**
 * Normalize a gesture velocity for spring APIs that want relative velocity
 * (velocity as a fraction of the remaining distance to the target). Motion /
 * Framer Motion take absolute px/s, so you usually don't need this — but it's
 * here for the CSS/custom-spring path.
 */
export function relativeVelocity(
  gestureVelocity: number,
  targetValue: number,
  currentValue: number,
) {
  const remaining = targetValue - currentValue;
  if (remaining === 0) return 0;
  return gestureVelocity / remaining;
}

/** Snap to the nearest value in a sorted list. */
export function nearestSnap(value: number, points: number[]) {
  if (points.length === 0) return value;
  return points.reduce((best, p) =>
    Math.abs(p - value) < Math.abs(best - value) ? p : best,
  );
}

/* ────────────────────── Reduced-motion awareness ────────────────────── */

/**
 * Read the user's motion preference once (cheap, SSR-safe). Prefer the React
 * hook (`usePrefersReducedMotion`) in components; this is for plain helpers.
 */
export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Inline style helper: stagger index → CSS custom property consumed by `.reveal`. */
export function revealStyle(index = 0, distance?: number, delayMs?: number) {
  return {
    ...(index ? { "--reveal-i": String(index) } : null),
    ...(distance != null ? { "--reveal-distance": `${distance}px` } : null),
    ...(delayMs != null ? { "--reveal-delay": `${delayMs}ms` } : null),
  } as React.CSSProperties;
}
