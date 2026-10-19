import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ExternalLink,
  ShieldCheck,
  Home,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LogoMark from '@/components/LogoMark';
import { FreddyAvatar } from '@/components/avatar';
import { cn } from '@/lib/utils';
import { ADMIN_NAV, ADMIN_EXTERNAL_LINKS, isAdminNavActive } from './adminNav';

/**
 * AdminLayout — the single full-height shell for every admin page.
 *
 * Replaces the previous arrangement where admin pages rendered inside the
 * public `Layout` (marketing header + footer + dock) AND defined their own
 * second navigation. There is now one header and one nav rail.
 */
export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string, aliases?: string[]) =>
    location.pathname === path || (aliases?.includes(location.pathname) ?? false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="h-dvh flex flex-col bg-gray-50 text-gray-900 overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="shrink-0 h-14 border-b border-gray-200 bg-white flex items-center justify-between px-3 sm:px-4 z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            aria-label="Open navigation"
            className="md:hidden p-2 -ml-1 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/admin/monitoring" className="flex items-center gap-2 shrink-0">
            <LogoMark size="h-7 w-7" />
            <span className="hidden sm:inline text-base font-bold tracking-tight">LoadSaathi</span>
          </Link>
          <span className="hidden sm:inline text-gray-300">/</span>
          <span className="hidden sm:inline text-sm font-semibold text-orange-600 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            Admin
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/"
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <Home className="h-3.5 w-3.5" />
            View app
          </Link>
          <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-gray-200">
            {userProfile ? (
              <FreddyAvatar user={userProfile} size={28} />
            ) : (
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600" />
            )}
            <div className="hidden lg:flex flex-col leading-tight">
              <span className="text-xs font-semibold truncate max-w-[140px]">
                {userProfile?.full_name || 'Admin'}
              </span>
              <span className="text-[10px] text-gray-400 capitalize">{userProfile?.user_type}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            title="Sign out"
            className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── Body: nav rail + content ────────────────────────────── */}
      <div className="flex-1 min-h-0 flex">
        {/* Desktop rail */}
        <aside
          className={cn(
            'hidden md:flex flex-col shrink-0 border-r border-gray-200 bg-white transition-[width] duration-200',
            collapsed ? 'w-[68px]' : 'w-56',
          )}
        >
          <div className={cn('flex items-center py-2', collapsed ? 'justify-center' : 'justify-end px-2')}>
            <button
              type="button"
              aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
              onClick={() => setCollapsed((c) => !c)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
            {ADMIN_NAV.map((item) => {
              const active = isAdminNavActive(item, location.pathname);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-0',
                    active
                      ? 'bg-orange-50 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
          <div className="p-2 border-t border-gray-100 space-y-1">
            {ADMIN_EXTERNAL_LINKS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900',
                  collapsed && 'justify-center px-0',
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && <ExternalLink className="h-3 w-3 ml-auto text-gray-300" />}
              </Link>
            ))}
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <div className="relative w-72 max-w-[80vw] h-full bg-white shadow-xl flex flex-col">
              <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-gray-200">
                <span className="text-sm font-bold">Admin Menu</span>
                <button
                  type="button"
                  aria-label="Close navigation"
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {ADMIN_NAV.map((item) => {
                  const active = isActive(item.path, item.aliasPaths);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                        active
                          ? 'bg-orange-50 text-orange-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="pt-2 mt-2 border-t border-gray-100 space-y-1">
                  {ADMIN_EXTERNAL_LINKS.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </nav>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto flex flex-col">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
