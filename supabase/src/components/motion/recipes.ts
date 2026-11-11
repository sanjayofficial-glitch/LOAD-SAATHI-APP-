/**
 * recipes.ts — the single source of truth for enter/exit motion.
 *
 * Every component animates with these variants + transition presets, which map
 * 1:1 onto the CSS tokens in globals.css (--ease-*, --dur-*) and the spring
 * presets in lib/motion. Nothing new should hand-roll an animation — pull
 * from here. All variants are opacity/transform only (compositor-friendly)
 * and are fully neutralized by <MotionConfig reducedMotion="user"> in App.tsx.
 */

import { EASE_IOS, EASE_OUT_QUINT, SPRING } from "@/lib/motion";
import type { Transition, Variants } from "framer-motion";

/* ──────────────────────────── Variants ──────────────────────────── */

export const VARIANTS = {
  /** Pure opacity cross-fade — the reduced-motion fallback shape. */
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  /** Small rise + fade — content entrances. */
  fadeUp: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 6 },
  },

  /** Scale-in for popovers, menus, chips. */
  scaleIn: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
  },

  /** Directional slide (e.g. right) for panels. */
  slideRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },

  /**
   * A surface arriving as a real material — scale + rise + fade together,
   * not a plain opacity fade. Use for sheets, dialogs, toasts.
   */
  materialize: {
    initial: { opacity: 0, scale: 0.96, y: 2 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.96, y: 2 },
  },
} satisfies Record<string, Variants>;

export type VariantKey = keyof typeof VARIANTS;

/* ──────────────────────────── Transitions ──────────────────────────── */

/**
 * CSS-transition-style presets for framer-motion `transition` props. These
 * mirror the --dur-* tokens; they are for non-gesture entrances where a
 * spring would be overkill. Gesture surfaces use SPRING instead.
 */
export const TRANSITIONS = {
  /** Micro state change — 120ms. */
  fast: { duration: 0.12, ease: EASE_OUT_QUINT },
  /** Element enter/exit — 180ms. */
  base: { duration: 0.18, ease: EASE_OUT_QUINT },
  /** Surface / large reposition — 260ms, fluid. */
  slow: { duration: 0.26, ease: EASE_IOS },
  /** Reveal + large scroll-driven entrances — 420ms. */
  reveal: { duration: 0.42, ease: EASE_OUT_QUINT },
} satisfies Record<string, Transition>;

export { SPRING };

/* ─────────────────────── Preset convenience ─────────────────────── */

export interface MotionPreset {
  initial: NonNullable<Variants["initial"]>;
  animate: NonNullable<Variants["animate"]>;
  exit?: NonNullable<Variants["exit"]>;
  transition?: Transition;
}

/** Pull a variant + optional transition in one call. */
export function preset(key: VariantKey, transition?: Transition): MotionPreset {
  return {
    initial: VARIANTS[key].initial,
    animate: VARIANTS[key].animate,
    exit: VARIANTS[key].exit,
    transition,
  };
}
