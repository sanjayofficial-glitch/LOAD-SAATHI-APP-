
import React, { Suspense, useState, useMemo, useCallback, useEffect } from "react";
import { DishaProvider, Disha } from "./Disha";
import { DishaGuideProvider } from "./DishaGuideProvider";
import { FreddyAvatar } from "./avatar";
import { MascotInteractionTracker } from "@/hooks/useMascotInteractionTracker";

import { useAuth } from "@/contexts/AuthContext";
import { useSupabase } from "@/hooks/useSupabase";
import { useProductTour } from "@/contexts/ProductTourContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { supabase as supabaseAnon } from "@/integrations/supabase/client";
import { authorizeRealtime } from "@/utils/realtime";
import { startPresence, stopPresence } from "@/utils/presence";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Search,
  Clock,
  Truck,
  Menu,
  X,
  LogOut,
  MessageSquare,
  History,
  PlusCircle,
  ShieldCheck,
  Shield,
  Users,
  Home,
  LayoutDashboard,
  Heart,
  ImageIcon,
  Phone,
  Info,
  Calculator,
  Key,
  Trophy,
  Lock,
  FileText,
  HelpCircle,
} from "lucide-react";
import LogoMark from "./LogoMark";
import SeoMeta from "./SeoMeta";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import NotificationBell from "./NotificationBell";
import OfflineBanner from "./OfflineBanner";
import LocationPermissionBanner from "./LocationPermissionBanner";
import VerificationBadge from "./VerificationBadge";
import AutoGpsTracker from "./AutoGpsTracker";
import DockNav, { type NavAccent } from "./DockNav";
import MobileTabBar, { type MobileTabItem } from "./MobileTabBar";
import ScrollToTopFab from "./ScrollToTopFab";
import { usePageFade } from "@/hooks/usePageFade";
import PhoneNudgeBanner from "./PhoneNudgeBanner";
import { DockItem, DockIcon, DockLabel } from "@/components/ui/dock";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { socialLinks } from "@/data/socialLinks";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

function navLinkId(path: string): string {
  if (path.endsWith('/dashboard')) return 'nav-dashboard';
  if (path.endsWith('/post-trip') || path.endsWith('/post-shipment')) return 'nav-post';
  if (path.endsWith('/browse-shipments') || path.endsWith('/browse-trucks')) return 'nav-find';
  if (path.endsWith('/my-trips') || path.endsWith('/my-shipments')) return 'nav-my-trips';
  if (path.endsWith('/history')) return 'nav-history';
  if (path.endsWith('/favorites')) return 'nav-favorites';
  return `nav-${path.split('/').filter(Boolean).join('-')}`;
}

const NavLinks = React.memo(({ navItems, currentPath, onClick, mobile }: { navItems: NavItem[]; currentPath: string; onClick?: () => void; mobile?: boolean }) => (
  <>
    {navItems.map((item) => {
      const active = item.path === '/trucker/dashboard' || item.path === '/shipper/dashboard'
        ? currentPath === item.path
        : currentPath.startsWith(item.path);
      return (
        <Link
          key={item.path}
          id={navLinkId(item.path)}
          to={item.path}
          onClick={onClick}
          className={cn(
            "press px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2",
            active
              ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-800",
            mobile && "text-base py-3"
          )}
        >
          {item.icon}
          {item.label}
          {active && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 dark:bg-orange-400 ml-auto" />}
        </Link>
      );
    })}
  </>
));
NavLinks.displayName = "NavLinks";

const DOCK_ACCENTS: Record<NavAccent, { text: string; pill: string }> = {
  orange: {
    text: "text-orange-600 dark:text-orange-400",
    pill: "bg-orange-500/15 text-orange-600 dark:bg-orange-400/15 dark:text-orange-400",
  },
  blue: {
    text: "text-blue-600 dark:text-blue-400",
    pill: "bg-blue-500/15 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400",
  },
};

const DockNavExtra = React.memo(({ currentPath, accent = "orange" }: { currentPath: string; accent?: NavAccent }) => {
  const a = DOCK_ACCENTS[accent];
  return (
    <Link to="/messages" aria-label="Chat" className="outline-none min-w-11 min-h-11 flex items-center justify-center rounded-2xl focus-visible:outline-2 focus-visible:outline-orange-500 focus-visible:outline-offset-1">
      <DockItem
        className={cn(
          currentPath === "/messages" && a.text
        )}
      >
        <DockIcon>
          <span
            className={cn(
              "flex h-full w-full items-center justify-center rounded-2xl transition-colors",
              currentPath === "/messages"
                ? a.pill
                : "bg-transparent text-gray-500 hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/10"
            )}
          >
            <MessageSquare className="h-6 w-6" />
          </span>
        </DockIcon>
        <DockLabel>Chat</DockLabel>
      </DockItem>
    </Link>
  );
});
DockNavExtra.displayName = "DockNavExtra";

const FooterSocialLinks = React.memo(() => (
  <TooltipProvider>
    <div className="flex items-center justify-center gap-3">
      {socialLinks.map((social) => (
        <Tooltip key={social.name}>
          <TooltipTrigger asChild>
            <a
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${social.color} hover:bg-gray-200 dark:hover:bg-gray-700 transition-all`}
              aria-label={social.label}
            >
              {social.icon}
            </a>
          </TooltipTrigger>
          <TooltipContent>{social.name}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  </TooltipProvider>
));
FooterSocialLinks.displayName = "FooterSocialLinks";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DishaProvider>
      <DishaGuideProvider>
        <LayoutInner>{children}</LayoutInner>
      </DishaGuideProvider>
    </DishaProvider>
  );
}

function LayoutInner({ children }: { children: React.ReactNode }) {
  const pageFadeRef = usePageFade<HTMLElement>();
  const { userProfile, signOut, getSupabaseToken } = useAuth();
  const { getAuthenticatedClient } = useSupabase();
  const { role: tourRole } = useProductTour();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const currentPath = location.pathname;
  // for multi-page handoff (dashboard tour → form page) without doing a
  // full reload. The tour's onNextClick on the last dashboard step sets
  // the next-path localStorage flag and invokes this helper if available.
  useEffect(() => {
    const w = window as Window & { __loadsaathiNav?: (p: string) => void };
    w.__loadsaathiNav = (p: string) => navigate(p);
    return () => {
      try {
        const ww = window as Window & { __loadsaathiNav?: (p: string) => void };
        delete ww.__loadsaathiNav;
      } catch {
        /* ignore */
      }
    };
  }, [navigate]);



  useEffect(() => {
    if (!userProfile?.id) return;

    const fetchUnread = async () => {
      const supabase = await getAuthenticatedClient();
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userProfile.id)
        .eq('is_read', false);
      setUnreadCount(count || 0);
    };

    fetchUnread();

    let cancelled = false;
    let channel: ReturnType<typeof supabaseAnon.channel> | null = null;

    void (async () => {
      // Authorize the shared realtime socket with the Clerk JWT — RLS on
      // `messages` is `TO authenticated`, anon is denied.
      await authorizeRealtime(getSupabaseToken);
      if (cancelled) return;

      channel = supabaseAnon
        .channel('layout-unread')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userProfile.id}`,
        }, () => {
          setUnreadCount(prev => prev + 1);
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userProfile.id}`,
        }, (payload) => {
          if (payload.new?.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        })
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) {
        void (async () => {
          try {
            await supabaseAnon.removeChannel(channel);
          } catch (err) {
            if (import.meta.env.DEV) console.warn('[channel cleanup]', err);
          }
        })();
      }
    };
  }, [userProfile?.id, getSupabaseToken]);

  // App-wide presence: other users see a real "Online" dot in chat while this
  // tab is open. Stops when the user signs out (Layout unmounts).
  useEffect(() => {
    if (!userProfile?.id) return;
    void startPresence(userProfile.id, getSupabaseToken);
    return () => {
      void stopPresence();
    };
  }, [userProfile?.id, getSupabaseToken]);

  const navItems = useMemo(() => {
    if (userProfile?.user_type === 'admin') {
      return [
        { label: "Command Center", path: "/admin/command-center", icon: <ShieldCheck className="h-4 w-4" /> },
        { label: "Dashboard", path: "/admin/analytics", icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: "Users", path: "/admin/users", icon: <Users className="h-4 w-4" /> },
        { label: "Moderation", path: "/admin/moderation", icon: <Shield className="h-4 w-4" /> },
        { label: "Audit Log", path: "/admin/audit", icon: <FileText className="h-4 w-4" /> },
        { label: "Gallery", path: "/admin/gallery", icon: <ImageIcon className="h-4 w-4" /> },
        { label: "Team", path: "/admin/team", icon: <Users className="h-4 w-4" /> },
        { label: "API Keys", path: "/admin/api-keys", icon: <Key className="h-4 w-4" /> },
        { label: "Messages", path: "/messages", icon: <MessageSquare className="h-4 w-4" /> },
      ];
    }
    return userProfile?.user_type === 'trucker' ? [
      { label: "Dashboard", path: "/trucker/dashboard", icon: <Clock className="h-4 w-4" /> },
      { label: "Post Trip", path: "/trucker/post-trip", icon: <PlusCircle className="h-4 w-4" /> },
      { label: "Find Goods", path: "/trucker/browse-shipments", icon: <Search className="h-4 w-4" /> },
      { label: "My Trips", path: "/trucker/my-trips", icon: <Truck className="h-4 w-4" /> },
      { label: "Favorites", path: "/favorites", icon: <Heart className="h-4 w-4" /> },
      { label: "History", path: "/trucker/history", icon: <History className="h-4 w-4" /> },
    ] : [
      { label: "Dashboard", path: "/shipper/dashboard", icon: <Clock className="h-4 w-4" /> },
      { label: "Post Load", path: "/shipper/post-shipment", icon: <PlusCircle className="h-4 w-4" /> },
      { label: "Find Trucks", path: "/browse-trucks", icon: <Truck className="h-4 w-4" /> },
      { label: "My Loads", path: "/shipper/my-shipments", icon: <Search className="h-4 w-4" /> },
      { label: "Favorites", path: "/favorites", icon: <Heart className="h-4 w-4" /> },
      { label: "History", path: "/shipper/history", icon: <History className="h-4 w-4" /> },
    ];
  }, [userProfile?.user_type]);

  const dockNavItems = useMemo(
    () => navItems.filter((item) => item.path !== "/messages"),
    [navItems]
  );

  const isAdmin = userProfile?.user_type === "admin";
  const isTrucker = userProfile?.user_type === "trucker";
  // Truckers get the brand orange accent, shippers get blue.
  const navAccent: NavAccent = isTrucker ? "orange" : "blue";

  const dashboardPath = userProfile?.user_type === 'admin'
    ? '/admin/dashboard'
    : userProfile?.user_type === 'trucker'
      ? '/trucker/dashboard'
      : userProfile?.user_type === 'shipper'
        ? '/shipper/dashboard'
        : '/';

  // Mobile-only bottom bar: a few quick tabs + a hamburger "Menu" button that
  // opens a bottom sheet with the full navigation. No horizontal scrolling.
  const mobileTabs = useMemo<MobileTabItem[]>(() => {
    if (isAdmin) {
      return [
        { label: "Command Center", path: "/admin/monitoring", icon: <ShieldCheck className="h-5 w-5" /> },
        { label: "Dashboard", path: "/admin/analytics", icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: "Messages", path: "/messages", icon: <MessageSquare className="h-5 w-5" /> },
      ];
    }
    return [
      {
        label: "Dashboard",
        path: isTrucker ? "/trucker/dashboard" : "/shipper/dashboard",
        icon: <Clock className="h-5 w-5" />,
      },
      {
        label: isTrucker ? "Find Goods" : "Find Trucks",
        path: isTrucker ? "/trucker/browse-shipments" : "/browse-trucks",
        icon: <Search className="h-5 w-5" />,
      },
      {
        label: "Chat",
        path: "/messages",
        icon: (
          <span className="relative">
            <MessageSquare className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>
        ),
      },
    ];
  }, [isAdmin, isTrucker, unreadCount]);

  const mobileCenterAction = useMemo<MobileTabItem | undefined>(() => {
    if (isAdmin) return undefined;
    return {
      label: isTrucker ? "Post Trip" : "Post Load",
      path: isTrucker ? "/trucker/post-trip" : "/shipper/post-shipment",
      icon: <PlusCircle className="h-6 w-6" />,
    };
  }, [isAdmin, isTrucker]);

  const mobileMenuItems = useMemo<MobileTabItem[]>(() => {
    const bumpIcon = (node: React.ReactNode) =>
      React.isValidElement<{ className?: string }>(node)
        ? React.cloneElement(node, { className: "h-5 w-5" })
        : node;
    const excluded = new Set<string>([
      ...mobileTabs.map((t) => t.path),
      ...(mobileCenterAction ? [mobileCenterAction.path] : []),
    ]);
    const primaryItems = navItems
      .filter((item) => !excluded.has(item.path))
      .map((item) => ({ ...item, icon: bumpIcon(item.icon) }));
    const accountItems: MobileTabItem[] = [
      { label: "Profile", path: "/profile", icon: <User className="h-5 w-5" /> },
      { label: "Credit Score", path: "/credit-score", icon: <Shield className="h-5 w-5" /> },
    ];
    const toolsItems: MobileTabItem[] = [
      { label: "Contact", path: "/contact", icon: <Phone className="h-5 w-5" /> },
      { label: "About", path: "/about", icon: <Info className="h-5 w-5" /> },
      { label: "Fare Calculator", path: "/tools/fare-calculator", icon: <Calculator className="h-5 w-5" /> },
      { label: "Cricket Score", path: "/cricket-score", icon: <Trophy className="h-5 w-5" /> },
    ];
    const footerItems: MobileTabItem[] = [
      { label: "Privacy", path: "/privacy", icon: <Lock className="h-5 w-5" /> },
      { label: "Terms", path: "/terms", icon: <FileText className="h-5 w-5" /> },
      { label: "Safety & Trust", path: "/safety-trust", icon: <ShieldCheck className="h-5 w-5" /> },
    ];
    return [...primaryItems, ...accountItems, ...toolsItems, ...footerItems];
  }, [navItems, mobileTabs, mobileCenterAction]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/");
  }, [signOut, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
      {/* All routes behind this layout require auth — keep them out of the index */}
      <SeoMeta title="LoadSaathi App" description="Your LoadSaathi dashboard." robots="noindex, nofollow" />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to content
      </a>
      <OfflineBanner />

      {userProfile?.user_type !== 'admin' && (
        <>
          <LocationPermissionBanner />
          <AutoGpsTracker />
        </>
      )}
      
      <nav id="app-sidebar" className="bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-[100] shadow-sm backdrop-blur-lg pt-[env(safe-area-inset-top)]" style={{ contain: 'layout style' }}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between h-14 sm:h-16">
            <div className="flex items-center gap-4 sm:gap-8">
              <Link id="layout-brand" to={dashboardPath} className="flex items-center gap-2 shrink-0">
                <LogoMark size="h-8 w-8 sm:h-9 sm:w-9" />
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
                  <span className="sm:hidden">LS</span>
                  <span className="hidden sm:inline">LoadSaathi</span>
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              <span id="app-notifications"><NotificationBell /></span>

              <Link id="layout-messages" to="/messages" aria-label="Messages">
                <Button variant="ghost" size="icon" className="relative text-gray-600 dark:text-gray-400 h-11 w-11" aria-label="Messages">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-orange-600 text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>

              <div className="hidden md:block lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-600 dark:text-gray-400 h-11 w-11"
                  onClick={() => setMobileNavOpen(!mobileNavOpen)}
                  aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
                >
                  {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div id="app-profile-menu">
                    <Button id="layout-account-menu" variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400 h-11 w-11 rounded-full" aria-label="Account menu">
                      {userProfile ? (
                        <FreddyAvatar user={userProfile} size={32} />
                      ) : (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                          U
                        </div>
                      )}
                    </Button>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="truncate flex items-center gap-1">
                        {userProfile?.full_name || "My Account"}
                        <VerificationBadge isVerified={userProfile?.is_verified} size="md" />
                      </span>
                      <span className="text-xs font-normal text-gray-500 dark:text-gray-400 capitalize">{userProfile?.user_type}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/credit-score" className="flex items-center gap-2 cursor-pointer">
                      <Shield className="h-4 w-4" />
                      Credit Score
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/" className="flex items-center gap-2 cursor-pointer">
                      <Home className="h-4 w-4" />
                      Home
                    </Link>
                  </DropdownMenuItem>
                  {tourRole && (
                    <DropdownMenuItem
                      onClick={() => {}}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <HelpCircle className="h-4 w-4" />
                      Take a product tour
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="lg:hidden border-t border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 px-4 py-3 space-y-1 animate-fade-in-up shadow-lg backdrop-blur-lg" style={{ contain: 'layout style' }}>
            <NavLinks navItems={navItems} currentPath={currentPath} onClick={() => setMobileNavOpen(false)} mobile />
          </div>
        )}
      </nav>

      <main id="main-content" ref={pageFadeRef} className="flex-grow pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-24">
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Skeleton className="h-8 w-48" /></div>}>
          <PhoneNudgeBanner />
          {children}
        </Suspense>
      </main>

      <DockNav
        items={dockNavItems}
        visible={mobileNavOpen}
        extra={<DockNavExtra currentPath={currentPath} accent={navAccent} />}
        accent={navAccent}
        className="hidden md:flex"
      />
      <MobileTabBar
        tabs={mobileTabs}
        menuItems={mobileMenuItems}
        centerAction={mobileCenterAction}
        accent={navAccent}
        visible={mobileNavOpen}
        footer={
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
              <ThemeToggle />
            </div>
            <Button
              variant="ghost"
              className="w-full text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        }
      />
      <ScrollToTopFab bottomClass="bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))]" />
      <Disha accent={isTrucker ? 'orange' : 'blue'} />
      <MascotInteractionTracker />
      <footer className="hidden lg:block bg-white/80 dark:bg-gray-900/80 border-t border-gray-200 dark:border-gray-800 pt-6 sm:pt-8 pb-24 mt-auto backdrop-blur-lg" style={{ contain: 'layout style' }}>
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <LogoMark size="h-8 w-8" />
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">LoadSaathi</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-4">
            Connecting India's truckers with shippers directly.
          </p>
          <div className="flex justify-center space-x-6 text-xs sm:text-sm text-gray-400 dark:text-gray-500 mb-4">
            <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-[color,transform] duration-fast ease-ios hover:-translate-y-0.5">Home</Link>
            <Link to="/profile" className="hover:text-gray-600 dark:hover:text-gray-300 transition-[color,transform] duration-fast ease-ios hover:-translate-y-0.5">Profile</Link>
            <Link to="/messages" className="hover:text-gray-600 dark:hover:text-gray-300 transition-[color,transform] duration-fast ease-ios hover:-translate-y-0.5">Messages</Link>
          </div>
          <FooterSocialLinks />
        </div>
      </footer>
    </div>
  );
}
