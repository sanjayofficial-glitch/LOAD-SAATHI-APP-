/**
 * haptics.ts — tactile feedback for meaningful commits.
 *
 * Multimodal feedback rule: a haptic fires on the *same frame* as the visual
 * signal that caused it, and only where it earns its place (success, commit,
 * validation) — over-feedback trains users to ignore it. Falls back to a
 * no-op in browsers without the Vibration API (desktop, Safari iOS).
 */

export type HapticPreset = "selection" | "light" | "medium" | "success" | "error";

const PATTERNS: Record<HapticPreset, number[]> = {
  /** Tab / segmented control change — barely perceptible. */
  selection: [8],
  /** Small confirm (toggle, checkbox). */
  light: [12],
  /** Commit — accept, submit, snap. */
  medium: [18, 40, 14],
  /** Milestone — match accepted, action completed. */
  success: [20, 60, 24, 60, 16],
  /** Failure / reject. */
  error: [60, 40, 60],
};

/**
 * Fire a haptic pattern. Safe to call anywhere: no-ops when unsupported,
 * when the user prefers reduced motion (heavier haptics can be vestibular
 * triggers), or when the document is hidden.
 */
export function haptic(preset: HapticPreset = "light"): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  if (document.hidden) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    // Reduced motion: halve intensity (rhythm kept, amplitude halved).
    navigator.vibrate(PATTERNS[preset].map((ms) => Math.max(4, Math.round(ms / 2))));
    return;
  }
  navigator.vibrate(PATTERNS[preset]);
}

export default haptic;
