import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useVisualViewportKeyboardOpen } from "@/hooks/useVisualViewport";
import { useT } from "@/i18n/useT";
import { I8 } from "@/components/icons/I8";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface MobileTabItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export type NavAccent = "orange" | "blue";

interface MobileTabBarProps {
  /** Quick-access tabs rendered directly in the bar (max 4, or 3 with a centerAction). */
  tabs: MobileTabItem[];
  /** Every item shown in the "More" sheet (usually the full navigation). */
  menuItems: MobileTabItem[];
  /** Optional prominent center action button (e.g. "Post Trip"/"Post Load"). */
  centerAction?: MobileTabItem;
  /** When true, the whole bar is hidden (e.g. another menu is open). */
  visible?: boolean;
  /** Optional footer content rendered at the bottom of the More sheet. */
  footer?: React.ReactNode;
  /** Role accent used for the active pill + icon color (trucker: orange, shipper: blue). */
  accent?: NavAccent;
  className?: string;
}

const ACCENTS: Record<NavAccent, { text: string; pill: string }> = {
  orange: {
    text: "text-orange-600 dark:text-orange-400",
    pill: "bg-orange-500/15 dark:bg-orange-400/15",
  },
  blue: {
    text: "text-blue-600 dark:text-blue-400",
    pill: "bg-blue-500/15 dark:bg-blue-400/15",
  },
};

/**
 * Mobile-only bottom navigation — a floating, rounded "island" pill centered
 * near the bottom of the screen. Replaces the animated desktop dock on phones:
 * every button is equal size (including the center action) and the active item
 * gets a CSS-transition pill that slides between buttons — no Framer Motion
 * layoutId needed, avoiding layout thrashing on every navigation.
 *
 * The island hides itself while the on-screen keyboard is open (VisualViewport)
 * so form inputs and the chat composer are never crowded by it.
 */
const MobileTabBar = React.memo(
  ({ tabs, menuItems, centerAction, visible, footer, accent = "orange", className }: MobileTabBarProps) => {
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const keyboardOpen = useVisualViewportKeyboardOpen();
    const t = useT();

    if (visible) return null;

    const isActive = (path: string) =>
      location.pathname === path || location.pathname.startsWith(path + "/");

    const a = ACCENTS[accent];

    const tabActive = tabs.some((t) => isActive(t.path));
    const centerActive = !!centerAction && isActive(centerAction.path);
    // If the current page isn't a visible tab, highlight the Menu button instead.
    const menuActive = !tabActive && !centerActive;

    const itemClass =
      "press flex min-h-[3.5rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl";

    const labelClass = (active: boolean) =>
      cn(
        "max-w-full truncate text-[11px] font-semibold transition-colors duration-fast ease-ios",
        active ? a.text : "text-gray-500 dark:text-gray-400"
      );

    const iconBox = (active: boolean, children: React.ReactNode) => (
      <span
        className={cn(
          "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors duration-150",
          active ? a.text : "text-gray-500 dark:text-gray-400"
        )}
      >
        {active && (
          <span
            className={cn(
              "absolute inset-0 rounded-2xl transition-all duration-200 ease-out",
              a.pill
            )}
          />
        )}
        <span className="relative flex items-center justify-center">{children}</span>
      </span>
    );

    return (
      <>
        <div
          className={cn(
            "fixed bottom-[calc(0.5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-[100] md:hidden w-[min(calc(100%-1.25rem),420px)] -translate-x-1/2 transition-all duration-300 ease-out motion-reduce:transition-none",
            keyboardOpen && "invisible pointer-events-none -translate-y-[150%] opacity-0",
            className
          )}
        >
          <nav
            aria-label="Mobile navigation"
            className={cn(
              "flex items-stretch border border-gray-200/70 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/90 rounded-[2rem] shadow-xl"
            )}
          >
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                aria-label={tab.label}
                aria-current={isActive(tab.path) ? "page" : undefined}
                className={itemClass}
              >
                {iconBox(isActive(tab.path), tab.icon)}
                <span className={labelClass(isActive(tab.path))}>{tab.label}</span>
              </Link>
            ))}

            {centerAction && (
              <Link
                to={centerAction.path}
                aria-label={centerAction.label}
                aria-current={centerActive ? "page" : undefined}
                className={itemClass}
              >
                {iconBox(centerActive, centerAction.icon)}
                <span className={labelClass(centerActive)}>{centerAction.label}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t('nav.openMenu')}
              aria-haspopup="dialog"
              aria-expanded={open}
              className={itemClass}
            >
              {iconBox(menuActive, <I8 name="menu" className="h-5 w-5" />)}
              <span className={labelClass(menuActive)}>{t('nav.menu')}</span>
            </button>
          </nav>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="z-[110] max-h-[75dvh] overflow-y-auto rounded-t-3xl border-t border-gray-200/70 bg-white/95 p-0 pb-[max(env(safe-area-inset-bottom),1rem)] backdrop-blur-lg dark:border-white/10 dark:bg-gray-950/95"
          >
            <div className="flex justify-center pt-3">
              <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true" />
            </div>
            <SheetHeader className="px-5 pb-1 pt-2 text-left">
              <SheetTitle className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                {t('nav.menu')}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Primary and secondary navigation links
              </SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-1 px-3 pb-4 pt-2">
              {menuItems.map((item, i) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    style={{ animationDelay: `${i * 25}ms` }}
                    className={cn(
                      "animate-materialize flex flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-4 text-[11px] font-medium transition-colors duration-fast ease-ios",
                      active
                        ? `${a.pill} ${a.text}`
                        : "text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/5"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-150",
                        active
                          ? `${a.pill} ${a.text}`
                          : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300"
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="max-w-full truncate text-center leading-tight">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
            {footer && (
              <div className="border-t border-gray-100 px-5 py-4 dark:border-white/10">
                {footer}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </>
    );
  }
);
MobileTabBar.displayName = "MobileTabBar";

export default MobileTabBar;
