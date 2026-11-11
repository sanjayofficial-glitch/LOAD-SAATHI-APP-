import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVisualViewportKeyboardOpen } from "./useVisualViewport";

/**
 * Fake VisualViewport that can be shrunk after mount, firing the registered
 * listeners — mirrors a real keyboard opening/closing.
 */
function makeVv(initialHeight = 600) {
  let height = initialHeight;
  const listeners: Array<() => void> = [];
  const vv = {
    get height() {
      return height;
    },
    width: 375,
    scale: 1,
    addEventListener: (_type: string, fn: () => void) => listeners.push(fn),
    removeEventListener: vi.fn(),
    setHeight: (h: number) => {
      height = h;
      listeners.forEach((fn) => fn());
    },
  };
  return vv;
}

describe("useVisualViewportKeyboardOpen", () => {
  const coarsePointer = () => {
    // The hook gates on coarse-pointer devices; jsdom lacks matchMedia.
    Object.defineProperty(window, "matchMedia", {
      value: vi.fn().mockReturnValue({ matches: true }),
      configurable: true,
    });
  };

  afterEach(() => {
    // @ts-expect-error reset the mocks between tests
    delete window.visualViewport;
    // @ts-expect-error reset the matchMedia stub between tests
    delete window.matchMedia;
  });

  it("returns true when the visual viewport shrinks beyond the threshold", () => {
    coarsePointer();
    const vv = makeVv(600);
    window.visualViewport = vv as unknown as VisualViewport;

    const { result } = renderHook(() => useVisualViewportKeyboardOpen());
    expect(result.current).toBe(false);

    act(() => vv.setHeight(400));
    expect(result.current).toBe(true);
  });

  it("returns false when the shrink is below the threshold", () => {
    coarsePointer();
    const vv = makeVv(600);
    window.visualViewport = vv as unknown as VisualViewport;

    const { result } = renderHook(() => useVisualViewportKeyboardOpen());
    act(() => vv.setHeight(560));
    expect(result.current).toBe(false);
  });

  it("falls back to false when VisualViewport is unsupported", () => {
    coarsePointer();

    const { result } = renderHook(() => useVisualViewportKeyboardOpen());
    expect(result.current).toBe(false);
  });

  it("does not treat pinch-zoom as a keyboard", () => {
    coarsePointer();
    const vv = makeVv(600);
    window.visualViewport = vv as unknown as VisualViewport;

    const { result } = renderHook(() => useVisualViewportKeyboardOpen());
    vv.scale = 1.5;
    act(() => vv.setHeight(400));
    expect(result.current).toBe(false);
  });

  it("returns false on fine-pointer devices even if the viewport shrinks", () => {
    // No matchMedia stub -> treated as fine pointer.
    const vv = makeVv(600);
    window.visualViewport = vv as unknown as VisualViewport;

    const { result } = renderHook(() => useVisualViewportKeyboardOpen());
    act(() => vv.setHeight(400));
    expect(result.current).toBe(false);
  });
});
