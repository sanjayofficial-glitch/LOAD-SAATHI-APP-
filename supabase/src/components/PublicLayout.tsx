import { Suspense, useState, useEffect, lazy } from "react";
import { DishaProvider, Disha } from "./Disha";
import { DishaGuideProvider } from "./DishaGuideProvider";
import { MascotInteractionTracker } from "@/hooks/useMascotInteractionTracker";

import { Link } from "react-router-dom";
import {
  ArrowRight,
  Menu,
  LayoutDashboard,
  Home,
  Sparkles,
  Tag,
  Phone,
  BookOpen,
  Calculator,
  Info,
  HelpCircle,
  Newspaper,
  Images,
  Lock,
  FileText,
  Rocket,
} from "lucide-react";
import OfflineBanner from "./OfflineBanner";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import LogoMark from "./LogoMark";
import MobileMenu from "./MobileMenu";
import MobileTabBar, { type MobileTabItem } from "./MobileTabBar";
import ScrollToTopFab from "./ScrollToTopFab";
import FloatingCTA from "./FloatingCTA";
import TrustStrip from "./TrustStrip";
import { usePageFade } from "@/hooks/usePageFade";
import type { BottomNavItem } from "./DockNav";

// Desktop-only animated dock. Lazy so framer-motion (~130KB) is never
// downloaded on phones — the lightweight MobileTabBar handles mobile nav.
const DockNav = lazy(() => import("./DockNav"));
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./ui/tooltip";
import { socialLinks } from "@/data/socialLinks";
import { useAuth } from "@/contexts/AuthContext";

const publicBottomNavItems: BottomNavItem[] = [
  { label: "Home", path: "/", icon: <Home className="h-5 w-5" /> },
  { label: "Features", path: "/features", icon: <Sparkles className="h-5 w-5" /> },
  { label: "How It Works", path: "/how-it-works", icon: <BookOpen className="h-5 w-5" /> },
  { label: "Pricing", path: "/pricing", icon: <Tag className="h-5 w-5" /> },
  { label: "Contact", path: "/contact", icon: <Phone className="h-5 w-5" /> },
];

// Mobile-only bottom bar: 4 quick tabs + a hamburger "Menu" button that opens
// the bottom sheet with the remaining pages (no horizontal scrolling).
const publicMobileTabs: MobileTabItem[] = [
  { label: "Home", path: "/", icon: <Home className="h-5 w-5" /> },
  { label: "Features", path: "/features", icon: <Sparkles className="h-5 w-5" /> },
  { label: "Pricing", path: "/pricing", icon: <Tag className="h-5 w-5" /> },
  { label: "Contact", path: "/contact", icon: <Phone className="h-5 w-5" /> },
];

const publicMobileMenuItems: MobileTabItem[] = [
  { label: "How It Works", path: "/how-it-works", icon: <BookOpen className="h-5 w-5" /> },
  { label: "Fare Calculator", path: "/tools/fare-calculator", icon: <Calculator className="h-5 w-5" /> },
  { label: "Freight Rate Calculator", path: "/tools/freight-rate-calculator", icon: <Calculator className="h-5 w-5" /> },
  { label: "Return Load Calculator", path: "/tools/return-load-calculator", icon: <Calculator className="h-5 w-5" /> },
  { label: "About", path: "/about", icon: <Info className="h-5 w-5" /> },
  { label: "FAQ", path: "/faq", icon: <HelpCircle className="h-5 w-5" /> },
  { label: "Blog", path: "/blog", icon: <Newspaper className="h-5 w-5" /> },
  { label: "Gallery", path: "/gallery", icon: <Images className="h-5 w-5" /> },
];

const publicMobileFooterItems: MobileTabItem[] = [
  { label: "Privacy", path: "/privacy", icon: <Lock className="h-5 w-5" /> },
  { label: "Terms", path: "/terms", icon: <FileText className="h-5 w-5" /> },
];

const footerLinks = {
  Platform: [
    { label: "Features", path: "/features" },
    { label: "How It Works", path: "/how-it-works" },
    { label: "Pricing", path: "/pricing" },
    { label: "Network", path: "/about" },
  ],
  Solutions: [
    { label: "For Shippers", path: "/solutions/shippers" },
    { label: "For Truckers", path: "/solutions/truckers" },
    { label: "For MSMEs", path: "/for-msmes" },
    { label: "AI Logistics", path: "/ai-logistics" },
  ],
  Tools: [
    { label: "All Tools", path: "/tools" },
    { label: "Fare Calculator", path: "/tools/fare-calculator" },
    { label: "Freight Rate Calculator", path: "/tools/freight-rate-calculator" },
    { label: "Return Load Calculator", path: "/tools/return-load-calculator" },
    { label: "Truck Load Calculator", path: "/tools/truck-load-calculator" },
    { label: "PTL vs FTL", path: "/tools/ptl-vs-ftl-calculator" },
    { label: "Shipment Brief Builder", path: "/tools/shipment-brief" },
  ],
  Freight: [
    { label: "All Routes", path: "/routes" },
    { label: "Return Loads", path: "/return-load" },
    { label: "PTL Transport", path: "/ptl-transport" },
    { label: "LTL Transport", path: "/ltl-transport" },
    { label: "Freight Data", path: "/data" },
  ],
  Company: [
    { label: "About", path: "/about" },
    { label: "Blog", path: "/blog" },
    { label: "Gallery", path: "/gallery" },
    { label: "Guides", path: "/guide/ptl-vs-ftl" },
    { label: "Contact", path: "/contact" },
  ],
  Legal: [
    { label: "Privacy", path: "/privacy" },
    { label: "Terms", path: "/terms" },
    { label: "Sitemap", path: "/sitemap" },
  ],
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <DishaProvider>
      <DishaGuideProvider>
        <PublicLayoutInner>{children}</PublicLayoutInner>
      </DishaGuideProvider>
    </DishaProvider>
  );
}

function PublicLayoutInner({ children }: { children: React.ReactNode }) {
  const pageFadeRef = usePageFade<HTMLElement>();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { userProfile } = useAuth();
  // Whether we're on a desktop viewport. Initialized synchronously from the
  // media query so phones never render (and never download) the animated dock
  // — useIsMobile() starts as falsy until its effect runs, which would load
  // the dock's lazy chunk on mobile. Listens for changes so rotating a phone
  // to landscape still swaps the dock in/out.
  const [isDesktopView, setIsDesktopView] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
  );
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => setIsDesktopView(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dashboardPath = userProfile?.user_type === 'admin'
    ? '/admin/dashboard'
    : userProfile?.user_type === 'trucker'
      ? '/trucker/dashboard'
      : userProfile?.user_type === 'shipper'
        ? '/shipper/dashboard'
        : null;

  const publicMobileCenterAction: MobileTabItem | undefined = dashboardPath
    ? { label: "Track Load", path: dashboardPath, icon: <LayoutDashboard className="h-6 w-6" /> }
    : { label: "Get Started", path: "/register", icon: <Rocket className="h-6 w-6" /> };
  return (
    <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to content
      </a>
      <OfflineBanner />
      <nav className={`fixed top-0 w-full z-[100] backdrop-blur-lg border-b border-border dark:border-white/10 pt-[env(safe-area-inset-top)] transition-colors duration-300 ${scrolled ? 'bg-background/95 dark:bg-[#050816]/95 shadow-md' : 'bg-background/70 dark:bg-[#050816]/70'}`} style={{ contain: 'layout style' }}>
        <div className="flex justify-between items-center w-full px-6 sm:px-12 max-w-[1440px] mx-auto h-16">
          <Link to="/" className="flex items-center gap-2">
            <LogoMark size="h-11 w-11" />
            <span className="text-lg sm:text-xl font-bold text-orange-600 dark:text-orange-400">LoadSaathi</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            {dashboardPath ? (
              <Link to={dashboardPath} className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground dark:hover:text-orange-400 transition-colors duration-fast ease-ios hover:-translate-y-0.5">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-block text-sm font-semibold text-muted-foreground hover:text-foreground dark:hover:text-orange-400 transition-colors duration-fast ease-ios hover:-translate-y-0.5">
                  Sign In
                </Link>
                <Link to="/register" className="hidden sm:inline-block">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold tracking-wider uppercase px-5 py-2 h-auto shadow-lg">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden press p-2.5 rounded-lg text-foreground hover:bg-accent min-h-11 min-w-11 flex items-center justify-center"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>
      <main id="main-content" ref={pageFadeRef} className="pt-[calc(4rem+env(safe-area-inset-top))] min-h-screen pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-24">
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Skeleton className="h-8 w-48" /></div>}>
          {children}
        </Suspense>
      </main>
      <TrustStrip />
      <footer className="bg-muted dark:bg-[#0B1220] border-t border-border dark:border-white/5 w-full pt-16 pb-20 sm:pb-24">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 md:gap-8 px-6 sm:px-12 max-w-[1440px] mx-auto">
          <div className="col-span-2 md:col-span-1 mb-4 md:mb-0">
            <div className="flex items-center gap-2 mb-4">
              <LogoMark size="h-10 w-10" />
              <span className="text-xl font-bold text-orange-600 dark:text-orange-400">LoadSaathi</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Precision Freight Intelligence — matching every load to its perfect space using AI.
            </p>
            <div className="flex items-center gap-2">
              <Link to="/register">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold tracking-wider uppercase px-4 py-2 h-auto rounded-lg">
                  Join Now <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div
              className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg bg-muted dark:bg-white/5 border border-border dark:border-white/10 text-xs font-bold text-muted-foreground cursor-not-allowed opacity-70"
              aria-disabled="true"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>
              Coming Soon on Google Play
            </div>
          </div>
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group} className="flex flex-col gap-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{group}</span>
              {links.map((link, i) => (
                <Link key={`${group}-${i}`} to={link.path} className="text-sm text-muted-foreground hover:text-foreground dark:hover:text-orange-400 transition-[color,transform] duration-fast ease-ios hover:-translate-y-0.5">
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-border dark:border-white/5 mt-12 pt-8">
          <TooltipProvider>
          <div className="flex flex-row flex-wrap items-center justify-center gap-3 px-6 sm:px-12 max-w-[1440px] mx-auto mb-6">
            {socialLinks.map((social) => (
              <Tooltip key={social.name}>
                <TooltipTrigger asChild>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={`elevate w-9 h-9 rounded-full bg-muted dark:bg-white/5 flex items-center justify-center ${social.color} hover:bg-muted-foreground/10 dark:hover:bg-white/10`}
                  >
                    {social.icon}
                  </a>
                </TooltipTrigger>
                <TooltipContent>{social.name}</TooltipContent>
              </Tooltip>
            ))}
          </div>
          </TooltipProvider>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} LoadSaathi. All rights reserved.{' '}
              <button
                type="button"
                onClick={() => {
                  try {
                    if (window.cookiehub) {
                      window.cookiehub.open();
                    } else {
                      // CookieHub script was skipped (consent already given).
                      // Load it on-demand so the settings panel can open.
                      const s = document.createElement('script');
                      s.async = true;
                      s.src = 'https://cdn.cookiehub.eu/c2/ca96bc89.js';
                      s.onload = () => { try { window.cookiehub?.open(); } catch (_) {} };
                      document.head.appendChild(s);
                    }
                  } catch (e) {}
                }}
                className="underline hover:text-foreground dark:hover:text-orange-400 transition-colors ml-1"
              >
                Cookie settings
              </button>
            </p>
          </div>
        </div>
      </footer>
      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      {isDesktopView && <DockNav items={publicBottomNavItems} className="hidden md:flex" />}
      <MobileTabBar
        tabs={publicMobileTabs}
        menuItems={publicMobileMenuItems}
        centerAction={publicMobileCenterAction}
        visible={mobileMenuOpen}
        footer={
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-2 gap-2">
              {publicMobileFooterItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>
            {!dashboardPath && (
              <div className="flex gap-2 mt-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                  <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-wider py-2 h-auto">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider py-2 h-auto">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        }
      />
      <ScrollToTopFab bottomClass="bottom-[calc(9rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))]" />
      <FloatingCTA />
      <Disha accent="orange" />
      <MascotInteractionTracker />
    </div>
  );
}
