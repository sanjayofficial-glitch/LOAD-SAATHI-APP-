
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useSession } from '@clerk/clerk-react';
import {
  Loader2,
  Rocket,
  Sparkles,
  User,
  Phone,
  Building2,
  CheckCircle2,
  Truck,
  Package,
  ArrowRight,
  LayoutDashboard,
} from 'lucide-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { User as UserType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LogoMark from '@/components/LogoMark';
import { showSuccess, showError } from '@/utils/toast';

type Step = 'welcome' | 'profile' | 'done';

const OnboardingFlow = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { session } = useSession();
  const { userProfile, setProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('welcome');
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const role = userProfile?.user_type || null;

  const onboardedKey = user ? `loadsaathi-onboarded-${user.id}` : 'loadsaathi-onboarded';

  const dashboardPath = () => {
    if (role === 'trucker') return '/trucker/dashboard';
    if (role === 'shipper') return '/shipper/dashboard';
    if (role === 'admin') return '/admin/monitoring';
    return '/choose-role';
  };

  const firstActionPath = () => {
    if (role === 'trucker') return '/trucker/post-trip';
    return '/shipper/post-shipment';
  };

  // Guard: not authed, no role, or already onboarded
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      navigate('/login', { replace: true });
      return;
    }

    if (!role || role === 'admin') {
      navigate('/choose-role', { replace: true });
      return;
    }

    try {
      if (localStorage.getItem(onboardedKey) === '1') {
        navigate(dashboardPath(), { replace: true });
      }
    } catch {
      // localStorage unavailable — show onboarding anyway, never crash
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, user, role, navigate]);

  // Prefill fields when the profile step opens
  useEffect(() => {
    if (step !== 'profile') return;
    setFullName((prev) => prev || userProfile?.full_name || user?.fullName || '');
    setPhone((prev) => prev || userProfile?.phone || user?.primaryPhoneNumber?.phoneNumber || '');
    setCompanyName((prev) => prev || userProfile?.company_name || '');
  }, [step, userProfile, user]);

  const completeOnboarding = (target?: string) => {
    try {
      localStorage.setItem(onboardedKey, '1');
    } catch {
      // ignore — never crash on storage failure
    }
    navigate(target || dashboardPath(), { replace: true });
  };

  const handleSaveProfile = async () => {
    if (!user || !session) return;

    setSaving(true);
    setError(null);

    try {
      const supabaseToken = await session.getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('Authentication error. Please try again.');

      const supabase = createClerkSupabaseClient(supabaseToken);

      const payload: { full_name: string; phone: string; company_name?: string } = {
        full_name: fullName.trim() || user.fullName || '',
        phone: phone.trim(),
      };
      if (companyName.trim()) payload.company_name = companyName.trim();

      const { error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', user.id);

      if (error) throw error;

      const updatedProfile: UserType = {
        id: user.id,
        user_type: (role || 'trucker') as UserType['user_type'],
        full_name: payload.full_name,
        phone: payload.phone,
        company_name: payload.company_name,
        rating: userProfile?.rating ?? 0,
        total_trips: userProfile?.total_trips ?? 0,
        is_verified: userProfile?.is_verified ?? false,
        created_at: userProfile?.created_at || new Date().toISOString(),
      };
      setProfile(updatedProfile);

      showSuccess('Profile saved!');
      setStep('done');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save your profile';
      console.error('[Onboarding] Error saving profile:', err);
      setError(msg);
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || !isSignedIn || !user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 dark:text-orange-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const isTrucker = role === 'trucker';

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg mx-auto animate-scale-in">
        <div className="text-center mb-8">
          <LogoMark size="h-14 w-14" className="mx-auto mb-4" />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(['welcome', 'profile', 'done'] as Step[]).map((s) => {
            const idx = ['welcome', 'profile', 'done'].indexOf(s);
            const cur = ['welcome', 'profile', 'done'].indexOf(step);
            const isActive = idx <= cur;
            return (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isActive ? 'w-8 bg-orange-500 dark:bg-orange-400' : 'w-2 bg-gray-300 dark:bg-gray-700'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-sm text-center animate-fade-in">
            {error}
          </div>
        )}

        {/* Step 1: Welcome */}
        {step === 'welcome' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
            <div
              className={`w-16 h-16 ${
                isTrucker
                  ? 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50'
                  : 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50'
              } rounded-full flex items-center justify-center mx-auto mb-6`}
            >
              {isTrucker ? (
                <Truck className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              ) : (
                <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white text-center mb-2">
              {isTrucker ? 'Great choice, Trucker!' : 'Great choice, Shipper!'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-8">
              Let's get your account ready in under a minute.
            </p>

            <ul className="space-y-4 mb-8">
              {(isTrucker
                ? [
                    'Find loads on your route and fill your truck faster',
                    'Get instant match alerts for shipments that fit your capacity',
                    'Track earnings, trips and your credit score in one place',
                  ]
                : [
                    'Post a shipment in under 2 minutes',
                    'Get instant quotes from verified truckers on your route',
                    'Track your goods live from pickup to delivery',
                  ]
              ).map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-green-500" />
                  {bullet}
                </li>
              ))}
            </ul>

            <Button
              onClick={() => setStep('profile')}
              className={`w-full h-12 text-base ${isTrucker ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <button
              onClick={() => completeOnboarding()}
              className="w-full text-center text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mt-4 transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Step 2: Profile */}
        {step === 'profile' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-orange-500 dark:text-orange-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Complete your profile</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Help shippers and truckers know who they're working with.
            </p>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="onboarding-name">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" /> Full name
                  </span>
                </Label>
                <Input
                  id="onboarding-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="onboarding-phone">
                  <span className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" /> Phone number
                    <span className="text-xs font-normal text-gray-400 dark:text-gray-500">(recommended)</span>
                  </span>
                </Label>
                <Input
                  id="onboarding-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 98765 43210"
                  className="h-12 text-base"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Used by the other side to reach you about a load.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="onboarding-company">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" /> Company name
                    <span className="text-xs font-normal text-gray-400 dark:text-gray-500">(optional)</span>
                  </span>
                </Label>
                <Input
                  id="onboarding-company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={isTrucker ? 'e.g. Singh Logistics' : 'e.g. Acme Exports'}
                  className="h-12 text-base"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className={`w-full h-12 text-base mt-8 ${isTrucker ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  Save & Continue <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <button
              onClick={() => completeOnboarding()}
              className="w-full text-center text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mt-4 transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 'done' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
              You're all set{fullName ? `, ${fullName.split(' ')[0]}` : ''}!
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Your account is ready. Let's make your first move.
            </p>

            <Button
              onClick={() => completeOnboarding(firstActionPath())}
              className={`w-full h-12 text-base mb-3 ${isTrucker ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              <Rocket className="mr-2 h-4 w-4" />
              {isTrucker ? 'Post Your First Trip' : 'Post Your First Shipment'}
            </Button>

            <Button
              variant="outline"
              onClick={() => completeOnboarding()}
              className="w-full h-12 text-base"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;
