import {
  ShieldCheck,
  LayoutDashboard,
  BarChart3,
  Users,
  UserCheck,
  Shield,
  FileText,
  Image as ImageIcon,
  Key,
  MessageSquare,
  Truck,
  Package,
} from 'lucide-react';

export interface AdminNavItem {
  label: string;
  path: string;
  icon: typeof ShieldCheck;
  /** Extra paths that should also mark this item active. */
  aliasPaths?: string[];
}

/**
 * Single source of truth for admin navigation.
 * Used by AdminLayout (desktop rail + mobile drawer) so the admin panel has
 * exactly one nav instead of the previous duplicated sets.
 */
export const ADMIN_NAV: AdminNavItem[] = [
  { label: 'Command Center', path: '/admin/monitoring', icon: ShieldCheck, aliasPaths: ['/admin/command-center'] },
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Overview', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Trips', path: '/admin/trips', icon: Truck },
  { label: 'Shipments', path: '/admin/shipments', icon: Package },
  { label: 'Verifications', path: '/admin/verifications', icon: UserCheck },
  { label: 'Moderation', path: '/admin/moderation', icon: Shield },
  { label: 'Audit Log', path: '/admin/audit', icon: FileText },
  { label: 'Gallery', path: '/admin/gallery', icon: ImageIcon },
  { label: 'Team', path: '/admin/team', icon: Users },
  { label: 'API Keys', path: '/admin/api-keys', icon: Key },
];

/** Secondary links that leave the admin shell. */
export const ADMIN_EXTERNAL_LINKS = [{ label: 'Messages', path: '/messages', icon: MessageSquare }];

export function isAdminNavActive(item: AdminNavItem, pathname: string): boolean {
  if (pathname === item.path) return true;
  if (item.aliasPaths?.includes(pathname)) return true;
  return false;
}
