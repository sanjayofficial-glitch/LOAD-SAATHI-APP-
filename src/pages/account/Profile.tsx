
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react'; // Clerk's useAuth for getToken
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { useNavigate, Link } from 'react-router-dom';
import { useCreditScore } from '@/hooks/useCreditScore';
import CreditScoreBadge from '@/components/CreditScoreBadge';
import { 
  User, 
  Phone, 
  Building, 
  Star as StarIcon, 
  Shield, 
  Truck, 
  Package, 
  Calendar,
  Mail,
  Lock,
  Loader2,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import Star from '@/components/Star';
import type { Review } from '@/types';

const ALLOWED_ADMIN_ID = import.meta.env.VITE_ADMIN_USER_ID || '';

const Profile = () => {
  const { userProfile, loading: authLoading, refreshProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [companyName, setCompanyName] = useState(userProfile?.company_name || '');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [stats, setStats] = useState({ count: 0, rating: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const { data: creditData } = useCreditScore();

  const fetchStats = useCallback(async () => {
    if (!userProfile) return;
    setStatsLoading(true);
    
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) return;
      
      const supabase = createClerkSupabaseClient(supabaseToken);
      
      if (userProfile.user_type === 'trucker') {
        const { count } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('trucker_id', userProfile.id);
        setStats({ count: count || 0, rating: userProfile.rating || 0 });
      } else if (userProfile.user_type === 'shipper') {
        const [countRes, ratingRes] = await Promise.all([
          supabase
            .from('requests')
            .select('*', { count: 'exact', head: true })
            .eq('shipper_id', userProfile.id),
          supabase
            .from('reviews')
            .select('rating')
            .eq('shipper_id', userProfile.id)
            .eq('reviewer_role', 'trucker')
        ]);
        const rating = ratingRes.data && ratingRes.data.length > 0
          ? ratingRes.data.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / ratingRes.data.length
          : 0;
        setStats({ count: countRes.count || 0, rating });
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, [userProfile, getToken]);

  const fetchReviews = useCallback(async () => {
    if (!userProfile) return;
    setReviewsLoading(true);
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) return;
      
      const supabase = createClerkSupabaseClient(supabaseToken);
      
      const { data } = await supabase
        .from('reviews')
        .select('*, shipper:shipper_id(full_name), trucker:trucker_id(full_name)')
        .or(`trucker_id.eq.${userProfile.id},shipper_id.eq.${userProfile.id}`)
        .order('created_at', { ascending: false });
      
      if (data) {
        setReviews(data);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  }, [userProfile, getToken]);

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.full_name || '');
      setPhone(userProfile.phone || '');
      setCompanyName(userProfile.company_name || '');
      fetchStats();
      fetchReviews();
    }
  }, [userProfile, fetchStats, fetchReviews]);

  const handleUpdate = async () => {
    if (!fullName.trim()) {
      showError('Please enter your full name');
      return;
    }
    setLoading(true);
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) {
        showError('Authentication error');
        return;
      }
      
      const supabase = createClerkSupabaseClient(supabaseToken);
      
      const { error } = await supabase
        .from('users')
        .update({ 
          full_name: fullName.trim(), 
          phone,
          company_name: companyName.trim() || null
        })
        .eq('id', userProfile?.id);

      if (error) {
        showError(error.message);
      } else {
        showSuccess('Profile updated successfully!');
        refreshProfile();
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('Authentication error');
      
      const supabase = createClerkSupabaseClient(supabaseToken);
      
      const { error } = await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('id', userProfile?.id);

      if (error) throw error;

      showSuccess('Account verified successfully!');
      await refreshProfile();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to verify account');
    } finally {
      setVerifying(false);
    }
  };

  const handleSwitchRole = async (newRole: 'shipper' | 'trucker' | 'admin') => {
    setSwitching(true);
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('Authentication error');
      
      const supabase = createClerkSupabaseClient(supabaseToken);
      
      const { error } = await supabase
        .from('users')
        .update({ user_type: newRole })
        .eq('id', userProfile?.id);

      if (error) throw error;

      showSuccess(`Switched to ${newRole} mode!`);
      await refreshProfile();
      
      // Redirect to appropriate dashboard
      if (newRole === 'admin') navigate('/admin/monitoring');
      else if (newRole === 'trucker') navigate('/trucker/dashboard');
      else navigate('/shipper/dashboard');
      
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to switch role');
    } finally {
      setSwitching(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-10 w-full lg:w-[500px] mb-6" />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center shadow-lg shrink-0',
            userProfile?.user_type === 'shipper'
              ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-200/50 dark:shadow-blue-900/30'
              : userProfile?.user_type === 'admin'
                ? 'bg-gradient-to-br from-purple-400 to-purple-600 shadow-purple-200/50 dark:shadow-purple-900/30'
                : 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-200/50 dark:shadow-orange-900/30'
          )}>
            <span className="text-2xl font-bold text-white">
              {(userProfile?.full_name || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{userProfile?.full_name || 'User'}</h1>
              {userProfile?.is_verified && (
                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className={cn(
                'capitalize',
                userProfile?.user_type === 'shipper'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800'
                  : userProfile?.user_type === 'admin'
                    ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800'
                    : 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-800'
              )}>
                {userProfile?.user_type}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!userProfile?.is_verified && (
            <Button 
              variant="outline" 
              onClick={handleVerify}
              disabled={verifying}
              className="border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950"
            >
              {verifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              Verify Account
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-[500px] lg:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-orange-100 dark:border-orange-800 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-orange-500 to-orange-400" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {userProfile?.user_type === 'trucker' ? 'Total Trips' : 'Total Shipments'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-black text-gray-900 dark:text-white">
                    {statsLoading ? <Loader2 className="h-6 w-6 animate-spin text-orange-600" /> : stats.count}
                  </div>
                  {userProfile?.user_type === 'trucker' ? (
                    <Truck className="h-8 w-8 text-orange-200 dark:text-orange-800" />
                  ) : (
                    <Package className="h-8 w-8 text-blue-200 dark:text-blue-800" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-100 dark:border-yellow-800 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-yellow-500 to-yellow-400" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {userProfile?.user_type === 'trucker' ? 'Average Rating' : 'Shipper Rating'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-black flex items-center text-gray-900 dark:text-white">
                    {stats.rating > 0 ? stats.rating.toFixed(1) : (userProfile?.rating?.toFixed(1) || '0.0')}
                    <StarIcon className="h-5 w-5 text-yellow-500 ml-2 fill-current" />
                  </div>
                  <StarIcon className="h-8 w-8 text-yellow-100 dark:text-yellow-900" />
                </div>
              </CardContent>
            </Card>

            <Link to="/credit-score" className="block">
              <Card className="border-emerald-100 dark:border-emerald-800 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Credit Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {creditData ? (
                        <CreditScoreBadge score={creditData.score} size="lg" />
                      ) : (
                        <div className="text-sm text-gray-400">View your score</div>
                      )}
                    </div>
                    <Shield className="h-8 w-8 text-emerald-200 dark:text-emerald-800" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="md:col-span-2 border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Account Summary</CardTitle>
                <CardDescription className="dark:text-gray-400">Your basic contact and account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Phone className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Phone Number</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{userProfile?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{clerkUser?.primaryEmailAddress?.emailAddress || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Building className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Company</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{userProfile?.company_name || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Member Since</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reviews">
          <Card className="border-orange-100 dark:border-orange-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Reviews</CardTitle>
              <CardDescription className="dark:text-gray-400">
                {userProfile?.user_type === 'trucker'
                  ? 'What shippers are saying about your service'
                  : 'What truckers are saying about you'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border border-gray-100 dark:border-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4 mt-2" />
                    </div>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed dark:border-gray-700">
                  <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {userProfile?.user_type === 'trucker'
                      ? 'No reviews yet. Complete trips to get feedback!'
                      : 'No reviews yet. Complete shipments to get feedback!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews
                    .filter((review) => {
                      if (!userProfile) return false;
                      return userProfile.user_type === 'trucker'
                        ? review.trucker_id === userProfile.id && review.reviewer_role === 'shipper'
                        : review.shipper_id === userProfile.id && review.reviewer_role === 'trucker';
                    })
                    .map((review) => (
                      <div key={review.id} className="p-4 border border-gray-100 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} filled={review.rating >= s} className="h-4 w-4" />
                              ))}
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {review.reviewer_role === 'shipper'
                                ? (review.shipper as { full_name?: string })?.full_name || 'Shipper'
                                : (review.trucker as { full_name?: string })?.full_name || 'Trucker'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{review.comment}"</p>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal">
          <Card className="border-orange-100 dark:border-orange-800 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-orange-500 to-orange-400" />
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Personal Information</CardTitle>
              <CardDescription className="dark:text-gray-400">Update your profile details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="dark:text-gray-300">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input 
                      id="fullName"
                      className="pl-10 border-orange-100 dark:border-orange-800"
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="dark:text-gray-300">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input 
                      id="phone"
                      className="pl-10 border-orange-100 dark:border-orange-800"
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyName" className="dark:text-gray-300">Company Name <span className="text-xs text-gray-400 font-normal">(optional)</span></Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input 
                      id="companyName"
                      className="pl-10 border-orange-100 dark:border-orange-800"
                      value={companyName} 
                      onChange={(e) => setCompanyName(e.target.value)} 
                      placeholder="Your transport company (optional)"
                    />
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleUpdate} 
                className="w-full md:w-auto bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-md"
                disabled={loading || !fullName.trim()}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            <Card className="border-red-100 dark:border-red-900/50 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-red-500 to-red-400" />
              <CardHeader>
                <CardTitle className="flex items-center text-red-900 dark:text-red-300">
                  <Shield className="mr-2 h-5 w-5 text-red-600 dark:text-red-400" />
                  Security Settings
                </CardTitle>
                <CardDescription className="dark:text-gray-400">Manage your password and account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900/50">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-red-900 dark:text-red-300">Password Management</h4>
                      <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                        Manage your password through your Clerk account settings.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Account Safety</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your account is protected by industry-standard encryption. Always ensure you use a strong, unique password.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-100 dark:border-blue-900/50 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
              <CardHeader>
                <CardTitle className="flex items-center text-blue-900 dark:text-blue-300">
                  <RefreshCw className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Switch Account Type
                </CardTitle>
                <CardDescription className="dark:text-gray-400">Change how you use LoadSaathi (for testing purposes)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button 
                    variant={userProfile?.user_type === 'shipper' ? 'default' : 'outline'}
                    onClick={() => handleSwitchRole('shipper')}
                    disabled={switching || userProfile?.user_type === 'shipper'}
                    className={`w-full ${userProfile?.user_type === 'shipper' ? 'bg-gradient-to-r from-blue-600 to-blue-500' : ''}`}
                  >
                    {switching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Package className="h-4 w-4 mr-2" />}
                    Shipper
                  </Button>
                  <Button 
                    variant={userProfile?.user_type === 'trucker' ? 'default' : 'outline'}
                    onClick={() => handleSwitchRole('trucker')}
                    disabled={switching || userProfile?.user_type === 'trucker'}
                    className={`w-full ${userProfile?.user_type === 'trucker' ? 'bg-gradient-to-r from-orange-600 to-orange-500' : ''}`}
                  >
                    {switching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Truck className="h-4 w-4 mr-2" />}
                    Trucker
                  </Button>
                  
                  {userProfile?.id === ALLOWED_ADMIN_ID && (
                    <Button 
                      variant={userProfile?.user_type === 'admin' ? 'default' : 'outline'}
                      onClick={() => handleSwitchRole('admin')}
                      disabled={switching || userProfile?.user_type === 'admin'}
                      className="w-full border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950 sm:col-span-2"
                    >
                      {switching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                      Admin Mode
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 italic text-center">
                  Note: Switching roles will change your dashboard and available features.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;