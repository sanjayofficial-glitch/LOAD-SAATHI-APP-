import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating action button that appears when the user scrolls down.
 * Tapping it instantly scrolls to the top. Uses CSS transitions for
 * the appear/disappear animation — no Framer Motion needed.
 */
export default function ScrollToTopFab() {
  const [visible, setVisible] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    const onFabOpen = (e: Event) => {
      setFabOpen((e as CustomEvent).detail.open);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("lsaathi-fab-open", onFabOpen);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("lsaathi-fab-open", onFabOpen);
    };
  }, []);

  const scrollToTop = () => {
    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = prev;
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={cn(
        "fixed right-4 z-[90] flex h-11 w-11 items-center justify-center rounded-full",
        "bg-orange-600 text-white shadow-lg shadow-orange-600/25",
        "transition-all duration-200 ease-out",
        "hover:bg-orange-700 hover:shadow-xl hover:scale-105",
        "active:scale-95",
        "md:bottom-28",
        "backdrop-blur-sm",
        "bottom-[calc(8rem+env(safe-area-inset-bottom,0px))]",
        visible && !fabOpen
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
    </button>
  );
}
