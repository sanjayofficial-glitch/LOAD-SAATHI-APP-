import * as React from "react";

import { cn } from "@/lib/utils";
import { useReveal } from "@/hooks/useReveal";

type RevealTag =
  | "div"
  | "section"
  | "article"
  | "aside"
  | "header"
  | "footer"
  | "li"
  | "ul"
  | "span";

export interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  /** Element to render. Defaults to `div`. */
  as?: RevealTag;
  /** Stagger index — each step adds 60ms of delay. Perfect for lists/grids. */
  index?: number;
  /** Travel distance in px before revealing. Defaults to the CSS token (16px). */
  distance?: number;
  /** Extra delay in ms, on top of any `index` stagger. */
  delay?: number;
  onReveal?: () => void;
}

/**
 * Scroll-reveal wrapper. Content is visible by default and animates in on
 * scroll — safe on SPA navigation, honours reduced motion, and carries an
 * automatic failsafe so content can never stay hidden.
 *
 * Prefer this over hand-rolled IntersectionObserver effects (the old
 * `.fade-section` pattern duplicated across ~30 pages).
 */
export const Reveal = React.forwardRef<HTMLElement, RevealProps>(
  (
    { as = "div", index = 0, distance, delay, onReveal, className, style, ...props },
    forwardedRef,
  ) => {
    const ref = useReveal<HTMLElement>({ onReveal });

    const setRefs = React.useCallback(
      (node: HTMLElement | null) => {
        (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      },
      [ref, forwardedRef],
    );

    return React.createElement(as, {
      ref: setRefs,
      className: cn("reveal", className),
      style: {
        ...(index ? { ["--reveal-i" as string]: String(index) } : null),
        ...(distance != null
          ? { ["--reveal-distance" as string]: `${distance}px` }
          : null),
        ...(delay != null
          ? { ["--reveal-delay" as string]: `${delay}ms` }
          : null),
        ...style,
      } as React.CSSProperties,
      ...props,
    });
  },
);
Reveal.displayName = "Reveal";

export default Reveal;
