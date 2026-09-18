
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const VALID_USER_TYPES = ['shipper', 'trucker', 'admin'] as const;

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'shipper' | 'trucker' | 'both' | 'admin';
}

const RoleProtectedRoute = ({ children, allowedRole }: RoleProtectedRouteProps) => {
  const { userProfile, loading, isLoaded } = useAuth();

  // Loading state – show a spinner while checking auth status
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600 dark:text-orange-400" />
      </div>
    );
  }

  // No user – redirect to login
  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  // Whitelist check: reject unknown/malformed user_type (RBAC bypass guard)
  if (userProfile.user_type && !(VALID_USER_TYPES as readonly string[]).includes(userProfile.user_type)) {
    console.warn(`[Security] Invalid user_type "${userProfile.user_type}" for user ${userProfile.id} — access denied`);
    return <Navigate to="/login" replace />;
  }

  // Admin check: user must have admin type in the database
  if (allowedRole === 'admin') {
    if (userProfile.user_type !== 'admin') {
      console.warn(`[Security] Unauthorized admin access attempt by user: ${userProfile.id}`);
      return <Navigate to="/login" replace />;
    }
  }

  // If a specific role is required and the current user doesn't match, redirect to their own dashboard
  if (allowedRole && allowedRole !== 'both' && allowedRole !== 'admin' && userProfile.user_type !== allowedRole) {
    let targetPath = '/';
    if (userProfile.user_type === 'shipper') targetPath = '/shipper/dashboard';
    else if (userProfile.user_type === 'trucker') targetPath = '/trucker/dashboard';
    else if (userProfile.user_type === 'admin') targetPath = '/admin/monitoring';
    
    return <Navigate to={targetPath} replace />;
  }

  // All checks passed – render the protected component
  return <>{children}</>;
};

export default RoleProtectedRoute;