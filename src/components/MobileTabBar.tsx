import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
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
 * Mobile-only bottom navigation. Replaces the animated desktop dock on phones:
 * every button is equal size (including the center action) and the active item
 * gets a CSS-transition pill that slides between buttons — no Framer Motion
 * layoutId needed, avoiding layout thrashing on every navigation.
 */
const MobileTabBar = React.memo(
  ({ tabs, menuItems, centerAction, visible, footer, accent = "orange", className }: MobileTabBarProps) => {
    const location = useLocation();
    const [open, setOpen] = useState(false);

    if (visible) return null;

    const isActive = (path: string) =>
      location.pathname === path || location.pathname.startsWith(path + "/");

    const a = ACCENTS[accent];

    const tabActive = tabs.some((t) => isActive(t.path));
    const centerActive = !!centerAction && isActive(centerAction.path);
    // If the current page isn't a visible tab, highlight the Menu button instead.
    const menuActive = !tabActive && !centerActive;

    const itemClass =
      "flex min-h-[3.5rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2";

    const labelClass = (active: boolean) =>
      cn(
        "max-w-full truncate text-[10px] font-semibold transition-colors duration-150",
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
        <div className={cn("fixed inset-x-0 bottom-2 z-[100] md:hidden contain-[layout_style] px-2", className)}>
          <nav
            aria-label="Mobile navigation"
            className={cn(
              "flex items-stretch border border-gray-200/70 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-gray-950/90 rounded-2xl shadow-lg safe-area-bottom"
            )}
          >
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                aria-label={tab.label}
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
                className={itemClass}
              >
                {iconBox(centerActive, centerAction.icon)}
                <span className={labelClass(centerActive)}>{centerAction.label}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={open}
              className={itemClass}
            >
              {iconBox(menuActive, <Menu className="h-5 w-5" />)}
              <span className={labelClass(menuActive)}>Menu</span>
            </button>
          </nav>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="z-[110] max-h-[75dvh] overflow-y-auto rounded-t-3xl border-t border-gray-200/70 bg-white/95 p-0 pb-[max(env(safe-area-inset-bottom),1rem)] backdrop-blur-lg dark:border-white/10 dark:bg-gray-950/95"
          >
            <SheetHeader className="px-5 pb-1 pt-5 text-left">
              <SheetTitle className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Menu
              </SheetTitle>
              <SheetDescription className="sr-only">
                Primary and secondary navigation links
              </SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-1 px-3 pb-4 pt-2">
              {menuItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-4 text-[11px] font-medium transition-colors duration-150",
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
