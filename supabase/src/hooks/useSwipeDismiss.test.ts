import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { useSwipeDismiss } from "@/hooks/useSwipeDismiss";

/**
 * Apple-fidelity tests for the drag-to-dismiss mechanic:
 *   §2  Direct manipulation — the surface tracks the finger 1:1
 *   §9  Rubber-banding — past the bound, resistance increases progressively
 *   §5/§6 Velocity handoff + momentum projection — a flick throws the sheet
 *   §10 Hysteresis — a small wobble must not start a drag
 *
 * jsdom 26 has no `PointerEvent`, so the handlers are invoked with plain
 * event-like objects (the hook only reads button/pointerId/clientX/clientY/
 * timeStamp). The arithmetic under test is the real implementation.
 */

const SHEET_HEIGHT = 400;

function makeSheet() {
  const el = document.createElement("div");
  Object.assign(el, {
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
  });
  el.getBoundingClientRect = () =>
    ({
      height: SHEET_HEIGHT,
      width: 320,
      top: 0,
      left: 0,
      bottom: SHEET_HEIGHT,
      right: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
  return el;
}

function ev(init: Partial<React.PointerEvent> & { clientX: number; clientY: number }) {
  return {
    button: 0,
    pointerId: 1,
    timeStamp: 0,
    preventDefault: vi.fn(),
    ...init,
  } as unknown as React.PointerEvent;
}

function setup(onDismiss = vi.fn(), threshold = 0.3) {
  const hook = renderHook(() =>
    useSwipeDismiss<HTMLDivElement>({ direction: "down", onDismiss, threshold }),
  );
  const el = makeSheet();
  hook.result.current.ref.current = el;
  return { el, h: hook.result.current.handlers, onDismiss };
}

const translateY = (el: HTMLElement) =>
  Number(/translateY\((-?[\d.]+)px\)/.exec(el.style.transform)?.[1] ?? "0");

describe("useSwipeDismiss — Apple drag mechanics", () => {
  it("tracks the drag 1:1 with the finger (§2)", () => {
    const { el, h } = setup();

    h.onPointerDown(ev({ clientX: 100, clientY: 100, timeStamp: 0 }));
    h.onPointerMove(ev({ clientX: 100, clientY: 180, timeStamp: 16 }));

    // 80px of travel → 80px of movement, exactly.
    expect(translateY(el)).toBe(80);
  });

  it("ignores a wobble below the activation threshold (§10 hysteresis)", () => {
    const { el, h } = setup();

    h.onPointerDown(ev({ clientX: 100, clientY: 100, timeStamp: 0 }));
    h.onPointerMove(ev({ clientX: 100, clientY: 104, timeStamp: 16 }));

    expect(el.style.transform).toBe("");
  });

  it("rubber-bands when dragged back past the bound (§9)", () => {
    const { el, h } = setup();

    // The gesture is claimed in the dismiss direction first…
    h.onPointerDown(ev({ clientX: 100, clientY: 100, timeStamp: 0 }));
    h.onPointerMove(ev({ clientX: 100, clientY: 120, timeStamp: 16 }));
    // …then reversed upward, past the bound.
    h.onPointerMove(ev({ clientX: 100, clientY: 20, timeStamp: 32 }));

    const moved = translateY(el);
    expect(moved).toBeLessThan(0); // resisted upward
    // Progressive resistance: 100px of drag yields strictly less than 100px.
    expect(Math.abs(moved)).toBeLessThan(100);
  });

  it("commits on a fast flick even before the distance threshold (§5/§6)", async () => {
    const { h, onDismiss } = setup();

    h.onPointerDown(ev({ clientX: 100, clientY: 100, timeStamp: 0 }));
    h.onPointerMove(ev({ clientX: 100, clientY: 140, timeStamp: 16 }));
    // A second sample is needed for the velocity history to span a real
    // interval (the first sample is the gesture-claim frame).
    h.onPointerMove(ev({ clientX: 100, clientY: 180, timeStamp: 32 }));
    h.onPointerUp(ev({ clientX: 100, clientY: 180, timeStamp: 32 }));

    // 40px per 16ms = 2500px/s — well past the 500px/s flick threshold, so the
    // momentum projection commits the dismissal even at 20% of the sheet
    // height. The dismissal lands with the release animation (transitionend
    // or its failsafe timer), so it is not synchronous.
    await waitFor(() => expect(onDismiss).toHaveBeenCalled());
  });

  it("snaps back when the gesture is slow and short (§10)", () => {
    const { el, h, onDismiss } = setup();

    h.onPointerDown(ev({ clientX: 100, clientY: 100, timeStamp: 0 }));
    // Slow drag: 10px every 400ms = 25px/s — far below the flick threshold.
    h.onPointerMove(ev({ clientX: 100, clientY: 110, timeStamp: 400 }));
    h.onPointerMove(ev({ clientX: 100, clientY: 120, timeStamp: 800 }));
    h.onPointerUp(ev({ clientX: 100, clientY: 120, timeStamp: 1200 }));

    expect(onDismiss).not.toHaveBeenCalled();
    // It animates back to rest (inline transform cleared on settle).
    expect(el.style.transform).toBe("translateY(0px)");
  });

  it("does not dismiss on a cancel — it snaps back instead", () => {
    const { el, h, onDismiss } = setup();

    h.onPointerDown(ev({ clientX: 100, clientY: 100, timeStamp: 0 }));
    h.onPointerMove(ev({ clientX: 100, clientY: 200, timeStamp: 16 }));
    h.onPointerCancel(ev({ clientX: 100, clientY: 200, timeStamp: 32 }));

    expect(onDismiss).not.toHaveBeenCalled();
    expect(el.style.transform).toBe("");
  });
});
