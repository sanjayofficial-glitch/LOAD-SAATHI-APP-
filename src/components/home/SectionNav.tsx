import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface SectionItem {
  id: string;
  label: string;
}

const SECTIONS: SectionItem[] = [
  { id: "problems", label: "Problems" },
  { id: "what-is", label: "What is it" },
  { id: "how-it-works", label: "How It Works" },
  { id: "platform", label: "Platform" },
  { id: "locations", label: "Cities" },
  { id: "faq", label: "FAQ" },
];

/**
 * Sticky pill-style section navigation that appears after scrolling past
 * the hero section. Highlights the current section based on scroll position
 * and allows smooth-scrolling to any section.
 */
export default function SectionNav() {
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState(SECTIONS[0].id);

  useEffect(() => {
    const onScroll = () => {
      // Show after scrolling past the hero (~80vh)
      setVisible(window.scrollY > window.innerHeight * 0.6);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track which section is currently in view
  useEffect(() => {
    if (!visible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [visible]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    root.style.scrollBehavior = prev;
  }, []);

  return (
    <div
      className={cn(
        "sticky top-[calc(4rem+env(safe-area-inset-top,0px))] z-[90] flex justify-center py-2 transition-all duration-300",
        "bg-background/80 dark:bg-[#050816]/80 backdrop-blur-lg border-b border-border/50",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 -translate-y-4 pointer-events-none"
      )}
    >
      <nav
        aria-label="Section navigation"
        className="flex gap-1 overflow-x-auto px-4 py-1 scrollbar-none max-w-full"
      >
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollTo(id)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150",
              activeId === id
                ? "bg-orange-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
