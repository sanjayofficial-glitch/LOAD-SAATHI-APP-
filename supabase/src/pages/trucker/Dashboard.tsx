
import React, { Suspense, useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Truck, 
  IndianRupee, 
  ArrowRight,
  Star as StarIcon,
  WifiOff,
  Shield,
  Inbox,
  CheckCircle2,
} from 'lucide-react';
import { showError } from '@/utils/toast';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { useCreditScore, useCreditInsights } from '@/hooks/useCreditScore';
import CreditScoreBadge from '@/components/CreditScoreBadge';
import CreditScoreGauge from '@/components/CreditScoreGauge';
import LiveMap from '@/components/LiveMap';
import NearbyLoadsMap from '@/components/NearbyLoadsMap';
import LogoMark from '@/components/LogoMark';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import KycStatusCard from '@/components/KycStatusCard';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import ProfileProgressBar from '@/components/ProfileProgressBar';
import { useProfileProgress } from '@/hooks/useProfileProgress';
import type { TruckLocation } from '@/components/LiveMap';
import { useT } from '@/i18n/useT';
import { I8 } from '@/components/icons/I8';
import CountUp from '@/components/ui/CountUp';

const LazyBarChart = React.lazy(() => import('./TruckerEarningsChart'));

interface DriverLocationRow {
  driver_id: string;
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  updated_at: string;
  trip_id: string | null;
}

const TruckerDashboard = () => {
  const { userProfile, getSupabaseToken } = useAuth();
  const { isOnline } = useNetworkStatus();
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState({
    activeTrips: 0,
    pendingRequests: 0,
    completedTrips: 0,
    totalEarnings: 0
  });
  const [monthlyData, setMonthlyData] = useState<{ month: string; earnings: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ route: string; earnings: number; date: string }[]>([]);
  const [activeTrucks, setActiveTrucks] = useState<TruckLocation[]>([]);
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const profileProgress = useProfileProgress();

  const { data: creditScore } = useCreditScore(userProfile?.id);
  const { data: insights } = useCreditInsights(creditScore);

  const fetchDashboardData = useCallback(async () => {
    if (!userProfile?.id) return;

    try {
      const supabaseToken = await getSupabaseToken();
      if (!supabaseToken) throw new Error('No Supabase token');
      
      const supabase = createClerkSupabaseClient(supabaseToken);

      const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Parallel independent queries
      const [
        activeResult,
        pendingResult,
        completedResult,
        bookingResult,
        offerResult,
        monthlyResult,
        recentResult,
        locationsResult,
      ] = await Promise.all([
        supabase.from('trips').select('*', { count: 'exact', head: true }).eq('trucker_id', userProfile.id).eq('status', 'active'),
        supabase.from('requests').select('*', { count: 'exact', head: true }).eq('receiver_id', userProfile.id).eq('status', 'pending'),
        supabase.from('trips').select('*', { count: 'exact', head: true }).eq('trucker_id', userProfile.id).eq('status', 'completed'),
        supabase.from('requests').select('weight_tonnes, trip:trips(price_per_tonne)').eq('receiver_id', userProfile.id).eq('status', 'accepted'),
        supabase.from('shipment_requests').select('proposed_price_per_tonne, shipment:shipments(weight_tonnes)').eq('trucker_id', userProfile.id).eq('status', 'accepted'),
        supabase.from('price_history').select('price_per_tonne, weight_tonnes, created_at').eq('user_id', userProfile.id).eq('user_type', 'trucker').gte('created_at', startDate).order('created_at', { ascending: true }),
        supabase.from('price_history').select('origin_city, destination_city, price_per_tonne, weight_tonnes, created_at').eq('user_id', userProfile.id).eq('user_type', 'trucker').gte('created_at', startDate).order('created_at', { ascending: false }).limit(5),
        supabase.from('driver_locations').select('driver_id, lat, lng, heading, speed, updated_at, trip_id').gte('updated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()),
      ]);

      // Process stats
      type BookingEarning = { weight_tonnes: number; trip: { price_per_tonne: number } | null };
      type OfferEarning = { proposed_price_per_tonne: number; shipment: { weight_tonnes: number } | null };
      const totalEarnings = (
        ((bookingResult.data ?? []) as unknown as BookingEarning[]).reduce((sum, r) => sum + (r.weight_tonnes * (r.trip?.price_per_tonne || 0)), 0) +
        ((offerResult.data ?? []) as unknown as OfferEarning[]).reduce((sum, o) => sum + ((o.proposed_price_per_tonne || 0) * (o.shipment?.weight_tonnes || 0)), 0)
      );

      // Process monthly data
      const aggregated: Record<string, { display: string; total: number }> = {};
      for (const entry of (monthlyResult.data ?? []) as { price_per_tonne: number; weight_tonnes: number; created_at: string }[]) {
        const d = new Date(entry.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
        const display = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!aggregated[key]) aggregated[key] = { display, total: 0 };
        aggregated[key].total += (entry.price_per_tonne * entry.weight_tonnes);
      }
      setMonthlyData(
        Object.entries(aggregated)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, v]) => ({ month: v.display, earnings: v.total }))
      );

      // Process recent activity
      setRecentActivity(((recentResult.data ?? []) as { origin_city: string; destination_city: string; price_per_tonne: number; weight_tonnes: number; created_at: string }[]).map(t => ({
        route: `${t.origin_city} → ${t.destination_city}`,
        earnings: (t.price_per_tonne || 0) * (t.weight_tonnes || 0),
        date: new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      })));

      setStats({
        activeTrips: activeResult.count || 0,
        pendingRequests: pendingResult.count || 0,
        completedTrips: completedResult.count || 0,
        totalEarnings
      });

      // Process driver locations (depends on locationsResult from parallel batch)
      const locations = locationsResult.data;
      if (locations && locations.length > 0) {
        const driverIds = [...new Set(locations.map((l: { driver_id: string }) => l.driver_id))];
        const { data: drivers } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', driverIds);

        const driverMap = new Map(drivers?.map((d: { id: string; full_name: string }) => [d.id, d.full_name]) || []);

        const truckLocations: TruckLocation[] = locations.map((loc: DriverLocationRow, i: number) => ({
          id: `loc-${i}`,
          driverId: loc.driver_id,
          driverName: driverMap.get(loc.driver_id) || 'Unknown',
          lat: loc.lat,
          lng: loc.lng,
          heading: loc.heading,
          speed: loc.speed,
          tripId: loc.trip_id,
          originCity: null,
          destinationCity: null,
          lastUpdated: loc.updated_at,
        }));
        setActiveTrucks(truckLocations);
      }
    } catch (err) {
      console.error('[TruckerDashboard] Error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      showError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getSupabaseToken, range]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);



  const statCards = useMemo(() => [
    {
      titleKey: 'trucker.activeTrips',
      value: stats.activeTrips,
      icon: Truck,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-100 dark:border-orange-800',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      titleKey: 'trucker.newRequests',
      value: stats.pendingRequests,
      icon: Inbox,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-100 dark:border-yellow-800',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      titleKey: 'trucker.completed',
      value: stats.completedTrips,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-100 dark:border-green-800',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      titleKey: 'trucker.totalEarnings',
      value: stats.totalEarnings,
      icon: IndianRupee,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-100 dark:border-green-800',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      isCurrency: true,
    },
  ], [stats]);

  const statCardLinks = useMemo(() => [
    '/trucker/my-trips',
    '/trucker/my-trips?tab=incoming',
    '/trucker/history',
    '/trucker/history',
  ], []);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 animate-fade-in">
      {error && (
        <ErrorState
          title={t('trucker.loadFailed')}
          description={error.message}
          image="/illustrations/offline.png"
          retry={() => {
            setError(null);
            fetchDashboardData();
          }}
        />
      )}
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LogoMark size="h-8 w-8" />
            <h1 id="trucker-dashboard-header" className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{t('trucker.title')}</h1>
          </div>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            {t('trucker.hello')}, {userProfile?.full_name || t('common.partner')}! {isOnline ? (
              <>{t('trucker.activeTripsLine').replace('{count}', String(stats.activeTrips))}</>
            ) : (
              <span className="text-yellow-600 dark:text-yellow-400">{t('common.offline')}</span>
            )}
          </p>
        </div>
        <div role="status" className="bg-yellow-50 dark:bg-yellow-900/30 px-3 sm:px-4 py-2 rounded-2xl border border-yellow-200 dark:border-yellow-800 flex items-center gap-2 self-start sm:self-auto">
            <StarIcon className="h-4 w-4 text-yellow-500 fill-current" aria-hidden="true" />
          <span className="text-sm font-black text-yellow-700 dark:text-yellow-400">{userProfile?.rating?.toFixed(1) || '0.0'} {t('trucker.rating')}</span>
        </div>
      </div>

      {!isOnline && (
        <div className="mb-4 sm:mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300 animate-fade-in">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>{t('common.offlineBanner')}</span>
        </div>
      )}

      {/* Verification nudge — hides itself once the trucker is verified */}
      <KycStatusCard className="mb-4 sm:mb-6 animate-fade-in" />

      {/* First-Time Welcome */}
      {!loading && stats.activeTrips === 0 && stats.completedTrips === 0 && stats.pendingRequests === 0 && (
        <div className="mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <EmptyState
            accent="orange"
            icon={<Truck />}
            image="/illustrations/truck-delivery.png"
            title={t('trucker.emptyTitle')}
            description={t('trucker.emptyDesc')}
            primaryAction={{ label: t('trucker.postFirstTrip'), to: '/trucker/post-trip' }}
            secondaryAction={{ label: t('trucker.browseLoads'), to: '/trucker/browse-shipments' }}
          />
        </div>
      )}

      {/* Progress + Onboarding Checklist */}
      {!loading && userProfile?.id && (
        <div className="mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <ProfileProgressBar progress={profileProgress} className="mb-4" />
          <OnboardingChecklist
            accent="orange"
            userId={userProfile.id}
            userPhone={userProfile.phone}
            items={[
              { label: t('trucker.postFirstTripCheck'), done: stats.activeTrips > 0, to: '/trucker/post-trip' },
              { label: t('trucker.getBookingRequest'), done: stats.pendingRequests > 0, to: '/trucker/my-trips?tab=incoming' },
            ]}
          />
        </div>
      )}

{/* Stats Grid */}
      <div id="trucker-stat-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {statCards.map((card, i) => (
          <Link key={card.titleKey} to={statCardLinks[i] ?? '/'} className="block group">
            <Card className={`${card.border} shadow-sm group-hover:shadow-md group-hover:scale-[1.02] transition-all duration-200 animate-fade-in-up`} style={{ animationDelay: `${i * 80}ms` }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-[11px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t(card.titleKey)}</CardTitle>
                <div className={`${card.iconBg} p-2 rounded-lg`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className={`text-xl sm:text-3xl font-black ${card.isCurrency ? card.color : 'text-gray-900 dark:text-white'}`}>
                    {card.isCurrency ? (
                      <CountUp prefix="₹" value={card.value} />
                    ) : (
                      <CountUp value={card.value} />
                    )}
                  </div>
                )}
                {/* Mini progress bar for visual interest */}
                {!loading && card.titleKey !== 'trucker.totalEarnings' && (
                  <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${card.titleKey === 'trucker.activeTrips' ? 'bg-orange-500' : card.titleKey === 'trucker.newRequests' ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(100, (card.titleKey === 'trucker.activeTrips' ? stats.activeTrips : card.titleKey === 'trucker.newRequests' ? stats.pendingRequests : stats.completedTrips) * 20)}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

{/* Nearby Loads Map */}
      <div id="nearby-loads-map" className="mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '180ms' }}>
        <NearbyLoadsMap />
      </div>

      {/* Action Cards */}
      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
        <Card id="trucker-quick-actions" className="border-orange-200 dark:border-orange-800 shadow-md overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="h-1 bg-gradient-to-r from-orange-500 to-orange-400" />
          <CardHeader className="bg-orange-50/50 dark:bg-orange-900/10 px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{t('trucker.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 px-4 sm:px-6">
            <Link to="/trucker/post-trip" data-guide="post-trip-btn" className="block">
              <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 h-14 sm:h-14 text-base sm:text-lg font-bold shadow-md hover:shadow-lg transition-all" disabled={!isOnline}>
                <I8 name="plus" className="mr-2 h-5 w-5" /> {t('trucker.postNewTrip')}
              </Button>
            </Link>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/trucker/browse-shipments" data-guide="find-loads-btn">
                <Button variant="outline" className="w-full border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950 h-14 font-bold text-sm">
                  <I8 name="search" className="mr-2 h-4 w-4" /> {t('trucker.findLoads')}
                </Button>
              </Link>
              <Link to="/trucker/my-trips" data-guide="manage-trips-btn">
                <Button variant="outline" className="w-full border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950 h-14 font-bold text-sm">
                  <I8 name="truck" className="mr-2 h-4 w-4" /> {t('trucker.manageTrips')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 dark:border-gray-800 shadow-md overflow-hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{t('trucker.quickLinks')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 px-4 sm:px-6">
            <div className="space-y-3">
              <Link to="/trucker/my-trips?tab=incoming" className="flex items-center justify-between p-3 sm:p-4 hover:bg-orange-50 dark:hover:bg-orange-950/50 rounded-2xl transition-all group border border-transparent hover:border-orange-100 dark:hover:border-orange-800">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-xl group-hover:bg-orange-600 dark:group-hover:bg-orange-700 transition-colors shrink-0">
                    <I8 name="box" className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm sm:text-base truncate">{t('trucker.bookingRequests')}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-widest truncate">{t('trucker.incomingShippers')}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-200 dark:text-gray-700 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:translate-x-1 transition-all shrink-0" />
              </Link>
              <Link to="/trucker/history" className="flex items-center justify-between p-3 sm:p-4 hover:bg-orange-50 dark:hover:bg-orange-950/50 rounded-2xl transition-all group border border-transparent hover:border-orange-100 dark:hover:border-orange-800">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-xl group-hover:bg-blue-600 dark:group-hover:bg-blue-700 transition-colors shrink-0">
                    <I8 name="history" className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm sm:text-base truncate">{t('trucker.workHistory')}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-widest truncate">{t('trucker.pastTrips')}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-200 dark:text-gray-700 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:translate-x-1 transition-all shrink-0" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

{/* Driver Risk & Credit Score */}
      {creditScore && (
        <div id="trucker-credit-score" className="mb-6 sm:mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="border-orange-200 dark:border-orange-800 shadow-md overflow-hidden animate-fade-in-up" style={{ animationDelay: '350ms' }}>
            <div className="h-1 bg-gradient-to-r from-red-500 to-orange-400" />
            <CardHeader className="px-4 sm:px-6 pb-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                <CardTitle className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{t('trucker.driverRiskScore')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4">
              <CreditScoreGauge score={creditScore.score} />
              {insights && insights.tips && insights.tips.length > 0 && (
                <div className="mt-3 text-xs text-muted-foreground">
                  {insights.tips.slice(0, 2).map((tip: string, i: number) => (
                    <p key={i} className="flex items-start gap-1 mt-1">
                      <span className="text-orange-500 mt-0.5">•</span>
                      {tip}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <CreditScoreBadge score={creditScore.score} />
        </div>
      )}

      {/* Live Fleet Map */}
      {activeTrucks.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <Card className="border-orange-200 dark:border-orange-800 shadow-md overflow-hidden animate-fade-in-up">
            <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
            <CardHeader className="bg-green-50/50 dark:bg-green-900/10 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <I8 name="truck" className="h-6 w-6" />
                  <CardTitle className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{t('trucker.liveFleet')}</CardTitle>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{activeTrucks.length} {t('trucker.trucksActive')}</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <LiveMap trucks={activeTrucks} className="rounded-none border-0" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Earnings & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-6 sm:mt-8">
        <Card className="border-orange-200 dark:border-orange-800 shadow-md overflow-hidden animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="h-1 bg-gradient-to-r from-orange-500 to-orange-400" />
          <CardHeader className="bg-orange-50/50 dark:bg-orange-900/10 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{t('trucker.monthlyEarnings')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            <div className="mb-4 flex gap-1 p-0.5 bg-muted rounded-lg w-fit">
              <Button variant={range === '7d' ? 'default' : 'outline'} size="sm" onClick={() => setRange('7d')}>{t('trucker.last7')}</Button>
              <Button variant={range === '30d' ? 'default' : 'outline'} size="sm" onClick={() => setRange('30d')}>{t('trucker.last30')}</Button>
              <Button variant={range === '90d' ? 'default' : 'outline'} size="sm" onClick={() => setRange('90d')}>{t('trucker.last90')}</Button>
            </div>
            {loading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : monthlyData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                <I8 name="history" className="h-10 w-10 mb-2 opacity-50" />
                <p className="font-medium">{t('trucker.noDataYet')}</p>
                <p className="text-sm">{t('trucker.completeTripsForTrend')}</p>
              </div>
            ) : (
              <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
                <LazyBarChart data={monthlyData} />
              </Suspense>
            )}
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800 shadow-md overflow-hidden animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <div className="h-1 bg-gradient-to-r from-orange-500 to-orange-400" />
          <CardHeader className="bg-orange-50/50 dark:bg-orange-900/10 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{t('trucker.recentActivity')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                <I8 name="history" className="h-10 w-10 mb-2 opacity-50" />
                <p className="font-medium">{t('trucker.noActivityYet')}</p>
                <p className="text-sm">{t('trucker.recentTripsHere')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{item.route}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{item.date}</p>
                    </div>
                    <div className="text-green-600 font-black text-sm ml-4 shrink-0">
                      ₹{item.earnings.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TruckerDashboard;
