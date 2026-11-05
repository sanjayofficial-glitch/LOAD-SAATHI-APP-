import { useEffect, useState } from "react";

/**
 * Tracks whether the on-screen keyboard (soft keyboard) is currently open by
 * comparing the Visual Viewport height against the tallest height observed
 * while no keyboard was present.
 *
 * Why not `window.innerHeight - vv.height`? On Android Chrome the window
 * height shrinks together with the visual viewport when the keyboard opens,
 * so the delta stays ~0. Tracking the peak visual-viewport height as a
 * baseline works on both iOS Safari and Android Chrome. The peak resets
 * naturally on rotation (new orientation grows height again).
 *
 * Android — the detector is gated to coarse-pointer (touch) devices, so
 * desktop window resizes or Ctrl+wheel zoom never hide the bar. Pinch-zoom
 * (`visualViewport.scale > 1`) is also ignored — it shrinks the viewport too.
 *
 * @param threshold  Minimum viewport height loss (px) treated as "keyboard open".
 */
export function useVisualViewportKeyboardOpen(threshold = 150): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const coarse =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    if (!coarse || !window.visualViewport) return;

    const vv = window.visualViewport;
    let peak = vv.height;

    const update = () => {
      // Pinch-zoom: ignore while zoomed in; keep the last pre-zoom state.
      if (vv.scale && vv.scale > 1.01) return;
      if (vv.height > peak) peak = vv.height;
      setOpen(vv.height < peak - threshold);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [threshold]);

  return open;
}
