
import { createContext, useContext, useLayoutEffect, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useUser, useSession, useClerk } from '@clerk/clerk-react';
import { User } from '@/types';
import { showError } from '@/utils/toast';

interface AuthContextType {
  user: ReturnType<typeof useUser>['user'];
  session: ReturnType<typeof useSession>['session'];
  userProfile: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfile: (profile: User) => void;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  isLoaded: boolean;
  getSupabaseToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Lazy-load the supabase client factory so the ~200KB supabase-js chunk is
// only downloaded for signed-in users (public pages never fetch it). Cached
// so concurrent/retried profile fetches reuse a single import.
let supabaseClientModule: Promise<typeof import('@/utils/supabaseClient')> | null = null;
function loadSupabaseClient() {
  if (!supabaseClientModule) {
    supabaseClientModule = import('@/utils/supabaseClient');
  }
  return supabaseClientModule;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded: clerkLoaded } = useUser();
  const { session } = useSession();
  const clerk = useClerk();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchRetryRef = useRef(0);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileJustSetRef = useRef(false);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setUserProfile(null);
      setLoading(false);
      return null;
    }

    setLoading(true);

    try {
      const supabaseToken = await session?.getToken({ template: 'supabase' });
      if (!supabaseToken) {
        console.error(
          '[AuthContext] No Supabase token returned from Clerk. ' +
          'This means the "supabase" JWT template is missing or misconfigured in your Clerk Dashboard. ' +
          'Go to Clerk Dashboard → JWT Templates → New Template → name it "supabase" and add claims: ' +
          '{"sub": "{{user.id}}", "email": "{{user.primary_email_address}}", "role": "authenticated"}. ' +
          'Retrying...'
        );
        // Retry once after a short delay — token may not be ready yet
        if (fetchRetryRef.current < 1) {
          fetchRetryRef.current += 1;
          fetchTimeoutRef.current = setTimeout(() => fetchProfile(), 2000);
          return null;
        }
        setUserProfile(null);
        setLoading(false);
        return null;
      }

      const { createClerkSupabaseClient } = await loadSupabaseClient();
      const supabaseClient = createClerkSupabaseClient(supabaseToken);
      const { data, error } = await supabaseClient
        .from('users')
        .select('id, user_type, full_name, phone, company_name, rating, total_trips, is_verified, created_at')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[AuthContext] Error fetching profile:', error);
        if (fetchRetryRef.current < 1) {
          fetchRetryRef.current += 1;
          fetchTimeoutRef.current = setTimeout(() => fetchProfile(), 1500);
          return null;
        }
        showError('Failed to load your profile. Please refresh the page.');
        setUserProfile(null);
        setLoading(false);
        return null;
      }

      fetchRetryRef.current = 0;

      if (data) {
        // Guard: if setProfile was called (e.g. from ChooseRole role selection),
        // don't overwrite it with a stale in-flight fetch.
        if (!profileJustSetRef.current) {
          const profile: User = {
            id: data.id,
            user_type: data.user_type || null,
            full_name: data.full_name || '',
            phone: data.phone || '',
            company_name: data.company_name || undefined,
            rating: data.rating || 0,
            total_trips: data.total_trips || 0,
            is_verified: data.is_verified || false,
            created_at: data.created_at || new Date().toISOString(),
          };
          setUserProfile(profile);
        }
        setLoading(false);
        return data as unknown as User;
      }

      setUserProfile(null);
      setLoading(false);
      return null;
    } catch (err) {
      console.error('[AuthContext] Error:', err);
      if (fetchRetryRef.current < 1) {
        fetchRetryRef.current += 1;
        fetchTimeoutRef.current = setTimeout(() => fetchProfile(), 1500);
        return null;
      }
      showError('Something went wrong loading your account. Please refresh.');
      setUserProfile(null);
      setLoading(false);
      return null;
    }
  }, [user, session]);

  useLayoutEffect(() => {
    if (!clerkLoaded) return;
    fetchRetryRef.current = 0;
    fetchProfile();
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, [clerkLoaded, fetchProfile]);

  // Reset the profileJustSet guard when the Clerk user ID changes
  // (e.g. sign-out → different user signs in) so fetchProfile can run normally
  useEffect(() => {
    profileJustSetRef.current = false;
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    // posthog is lazy-loaded to keep it off the critical bundle
    let cancelled = false;
    import('@/utils/posthog')
      .then(({ posthog }) => {
        if (cancelled) return;
        posthog.identify(user.id, {
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName,
          role: userProfile?.user_type || undefined,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.primaryEmailAddress?.emailAddress, user?.fullName, userProfile?.user_type]);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    await fetchProfile();
  }, [fetchProfile]);

  const setProfile = useCallback((profile: User) => {
    profileJustSetRef.current = true;
    setUserProfile(profile);
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    await clerk.signOut();
    import('@/utils/posthog')
      .then(({ posthog }) => posthog.reset())
      .catch(() => {});
    supabaseTokenRef.current = null;
    supabaseTokenExpiryRef.current = 0;
    setUserProfile(null);
  }, [clerk]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      if (!clerk.client) throw new Error('Clerk client not ready');
      await clerk.client.signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      return { error: null };
    } catch (err) {
      console.error('[AuthContext] resetPassword error:', err);
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, [clerk.client]);

  // Cached Supabase token — avoids redundant Clerk token mints across
  // NotificationBell, AutoGpsTracker, realtime, useCreditScore, etc.
  const supabaseTokenRef = useRef<string | null>(null);
  const supabaseTokenExpiryRef = useRef(0);

  const getSupabaseToken = useCallback(async (): Promise<string | null> => {
    const now = Date.now();
    // Reuse cached token if it hasn't expired (with 30s safety margin)
    if (supabaseTokenRef.current && now < supabaseTokenExpiryRef.current - 30_000) {
      return supabaseTokenRef.current;
    }
    const token = await session?.getToken({ template: 'supabase' });
    if (token) {
      supabaseTokenRef.current = token;
      // Clerk tokens expire in 60s; refresh at 45s
      supabaseTokenExpiryRef.current = now + 45_000;
    }
    return token ?? null;
  }, [session]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      userProfile,
      loading: clerkLoaded ? loading : true,
      signOut,
      refreshProfile,
      setProfile,
      resetPassword,
      isLoaded: clerkLoaded,
      getSupabaseToken,
    }),
    [
      user,
      session,
      userProfile,
      clerkLoaded,
      loading,
      signOut,
      refreshProfile,
      setProfile,
      resetPassword,
      getSupabaseToken,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
