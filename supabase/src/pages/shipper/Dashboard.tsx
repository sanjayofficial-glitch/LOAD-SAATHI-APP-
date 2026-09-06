
import React, { Suspense, useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

import { 
  Package, 
  Search, 
  Clock, 
  TrendingUp, 
  PlusCircle, 
  DollarSign, 
  Calendar, 
  Truck,
  ArrowRight,
  WifiOff,
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import ErrorState from '@/components/ErrorState';
import LiveTruckMap from '@/features/shipper/components/LiveTruckMap';

const LazyBarChart = React.lazy(() => import('./ShipperSpendingChart'));

const StatCardSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </CardHeader>
    <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
      <Skeleton className="h-8 w-16 mt-1" />
    </CardContent>
  </Card>
);

interface UpcomingShipment {
  id: string;
  origin_city: string;
  destination_city: string;
  goods_description: string;
  weight_tonnes: number;
  departure_date: string;
  status: string;
}

interface PriceHistoryEntry {
  price_per_tonne: number | null;
  weight_tonnes: number | null;
  created_at: string;
  origin_city: string;
  destination_city: string;
}

const ShipperDashboard = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const { isOnline } = useNetworkStatus();
  const [stats, setStats] = useState({ 
    activeShipments: 0, 
    pendingRequests: 0, 
    completedShipments: 0,
    totalSpent: 0,
    upcomingShipments: [] as UpcomingShipment[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [monthlyData, setMonthlyData] = useState<{month: string, spending: number}[]>([]);
  const [routeHistory, setRouteHistory] = useState<{route: string, cost: number, date: string}[]>([]);
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');

  const loadStats = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      const supabase = createClerkSupabaseClient(supabaseToken);

      const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Parallel independent queries
      const [
        activeResult,
        completedResult,
        pendingOffersResult,
        requestSpentResult,
        offerSpentResult,
        upcomingResult,
        monthlyResult,
      ] = await Promise.all([
        supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('shipper_id', userProfile.id).eq('status', 'pending'),
        supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('shipper_id', userProfile.id).eq('status', 'completed'),
        supabase.from('shipment_requests').select('*', { count: 'exact', head: true }).eq('shipper_id', userProfile.id).eq('status', 'pending'),
        supabase.from('requests').select('weight_tonnes, trip:trips(price_per_tonne)').eq('shipper_id', userProfile.id).eq('status', 'accepted'),
        supabase.from('shipment_requests').select('proposed_price_per_tonne, shipment:shipments(weight_tonnes)').eq('shipper_id', userProfile.id).eq('status', 'accepted'),
        supabase.from('shipments').select('id, origin_city, destination_city, goods_description, weight_tonnes, departure_date, status').eq('shipper_id', userProfile.id).eq('status', 'pending').order('departure_date', { ascending: true }).limit(3),
        supabase.from('price_history').select('price_per_tonne, weight_tonnes, created_at, origin_city, destination_city').eq('user_id', userProfile.id).eq('user_type', 'shipper').gte('created_at', startDate).order('created_at', { ascending: true }),
      ]);

      // Process totals
      const requestSpent = requestSpentResult.data;
      const offerSpent = offerSpentResult.data;
      const totalSpent = (
        (requestSpent?.reduce((sum: number, r: { weight_tonnes: number; trip: { price_per_tonne: number }[] }) => sum + (r.weight_tonnes * (r.trip?.[0]?.price_per_tonne || 0)), 0) || 0) +
        (offerSpent?.reduce((sum: number, o: { proposed_price_per_tonne: number; shipment: { weight_tonnes: number }[] }) => sum + ((o.proposed_price_per_tonne || 0) * (o.shipment?.[0]?.weight_tonnes || 0)), 0) || 0)
      );

      const monthlySpending = monthlyResult.data;

      if (monthlySpending && monthlySpending.length > 0) {
        const monthMap: Record<string, { display: string; total: number }> = {};
        for (const entry of monthlySpending) {
          const d = new Date(entry.created_at);
          const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
          const display = d.toLocaleString('default', { month: 'short', year: '2-digit' });
          const cost = (entry.price_per_tonne || 0) * (entry.weight_tonnes || 0);
          if (!monthMap[key]) monthMap[key] = { display, total: 0 };
          monthMap[key].total += cost;
        }
        setMonthlyData(
          Object.entries(monthMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, v]) => ({ month: v.display, spending: v.total }))
        );

        const last5 = monthlySpending.slice(-5).reverse().map((entry: PriceHistoryEntry) => ({
          route: `${entry.origin_city} → ${entry.destination_city}`,
          cost: (entry.price_per_tonne || 0) * (entry.weight_tonnes || 0),
          date: new Date(entry.created_at).toLocaleDateString(),
        }));
        setRouteHistory(last5);
      }

      setStats({ 
        activeShipments: activeResult.count || 0, 
        pendingRequests: pendingOffersResult.count || 0, 
        completedShipments: completedResult.count || 0,
        totalSpent,
        upcomingShipments: (upcomingResult.data || []) as UpcomingShipment[]
      });
    } catch (err: unknown) {
      console.error('[ShipperDashboard] Error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      showError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getToken, range]);

  useEffect(() => { loadStats(); }, [loadStats]);



  const handleCancelShipment = async (shipmentId: string) => {
    if (!isOnline) {
      showError('You are offline. Cannot cancel shipment.');
      return;
    }
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      const supabase = createClerkSupabaseClient(supabaseToken);
      
      const { error } = await supabase
        .from('shipments')
        .update({ status: 'cancelled' })
        .eq('id', shipmentId);
        
      if (error) throw error;
      showSuccess('Shipment cancelled successfully');
      loadStats();
    } catch {
      showError('Failed to cancel shipment');
    }
  };

  const statCards = useMemo(() => [
    {
      title: 'Active Loads',
      value: stats.activeShipments,
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-100 dark:border-blue-800',
      iconBg: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      title: 'New Offers',
      value: stats.pendingRequests,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-100 dark:border-yellow-800',
      iconBg: 'bg-yellow-50 dark:bg-yellow-900/30',
    },
    {
      title: 'Completed',
      value: stats.completedShipments,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-100 dark:border-green-800',
      iconBg: 'bg-green-50 dark:bg-green-900/30',
    },
    {
      title: 'Total Spent',
      value: `₹${stats.totalSpent.toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-100 dark:border-green-800',
      iconBg: 'bg-green-50 dark:bg-green-900/30',
      isCurrency: true,
    },
  ], [stats]);

  const statCardLinks = useMemo(() => [
    '/shipper/my-shipments?tab=active',
    '/shipper/my-shipments?tab=incoming',
    '/shipper/history',
    '/shipper/history',
  ], []);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 animate-fade-in">
      {error && (
        <ErrorState
          title="Failed to load dashboard"
          description={error.message}
          retry={() => {
            setError(null);
            loadStats();
          }}
        />
      )}
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-1.5 rounded-lg shadow-sm">
            <Package className="h-4 w-4 text-white" />
          </div>
          <h1 id="shipper-dashboard-header" className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Shipper Dashboard</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
          Welcome back, {userProfile?.full_name || 'Shipper'}! {isOnline ? 'Manage your loads and find the best trucks.' : <span className="text-yellow-600">You are offline. Showing cached data.</span>}
        </p>
      </div>

      {!isOnline && (
        <div className="mb-4 sm:mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300 animate-fade-in">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>You are offline. Data shown may be out of date.</span>
        </div>
      )}

{/* Live Truck Map — hero for first-time & returning shippers */}
      <div id="live-truck-map" className="mb-8 sm:mb-10 animate-fade-in">
        <LiveTruckMap />
      </div>

      {/* Onboarding Checklist */}
      {!loading && !(stats.activeShipments === 0 && stats.completedShipments === 0 && stats.pendingRequests === 0) && userProfile?.id && (
        <div className="mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <OnboardingChecklist
            accent="blue"
            userId={userProfile.id}
            items={[
              { label: 'Post your first load', done: stats.activeShipments > 0, to: '/shipper/post-shipment' },
              { label: 'Complete your profile', done: Boolean(userProfile.full_name?.trim() && userProfile.phone?.trim()), to: '/profile' },
              { label: 'Get a trucker offer', done: stats.pendingRequests > 0, to: '/shipper/my-shipments?tab=incoming' },
            ]}
          />
        </div>
      )}

{/* Stats Grid */}
      <div id="shipper-stat-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          statCards.map((card, i) => (
            <Link key={card.title} to={statCardLinks[i] ?? '/'} className="block group">
              <Card className={`${card.border} shadow-sm group-hover:shadow-md group-hover:scale-[1.02] transition-all duration-200 animate-fade-in-up`} style={{ animationDelay: `${i * 80}ms` }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                  <CardTitle className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{card.title}</CardTitle>
                  <div className={`${card.iconBg} p-2 rounded-lg`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className={`text-2xl sm:text-3xl font-black ${card.isCurrency ? card.color : 'text-gray-900 dark:text-white'}`}>
                    {card.value}
                  </div>
                  {card.title !== 'Total Spent' && (
                    <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${card.title === 'Active Loads' ? 'bg-blue-500' : card.title === 'New Offers' ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(100, (card.title === 'Active Loads' ? stats.activeShipments : card.title === 'New Offers' ? stats.pendingRequests : stats.completedShipments) * 20)}%` }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Action Cards */}
      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 mb-10 sm:mb-12">
        <Card id="shipper-quick-actions" className="border-blue-200 dark:border-blue-800 shadow-md overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
          <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 px-4 sm:px-6">
            <Link to="/shipper/post-shipment" className="block">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 h-12 sm:h-14 text-base sm:text-lg font-bold shadow-md hover:shadow-lg transition-all" disabled={!isOnline}>
                <PlusCircle className="mr-2 h-5 w-5" /> Post New Load
              </Button>
            </Link>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/browse-trucks">
                <Button variant="outline" className="w-full border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 h-10 sm:h-12 font-bold text-sm sm:text-base">
                  <Search className="mr-2 h-4 w-4" /> Find Trucks
                </Button>
              </Link>
              <Link to="/shipper/my-shipments">
                <Button variant="outline" className="w-full border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 h-10 sm:h-12 font-bold text-sm sm:text-base">
                  <Package className="mr-2 h-4 w-4" /> My Loads
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 dark:border-gray-800 shadow-md overflow-hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-400" />
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 px-4 sm:px-6">
            <div className="space-y-4">
              <Link to="/shipper/my-shipments?tab=incoming" className="flex items-center justify-between p-3 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl transition-all group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg shrink-0"><Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" /></div>
                  <span className="font-bold text-gray-700 dark:text-gray-300 text-sm sm:text-base truncate">Check Incoming Offers</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
              </Link>
              <Link to="/shipper/history" className="flex items-center justify-between p-3 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl transition-all group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg shrink-0"><Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
                  <span className="font-bold text-gray-700 dark:text-gray-300 text-sm sm:text-base truncate">View Activity History</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
              </Link>
              <Link to="/profile" className="flex items-center justify-between p-3 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl transition-all group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg shrink-0"><Truck className="h-4 w-4 text-gray-600 dark:text-gray-400" /></div>
                  <span className="font-bold text-gray-700 dark:text-gray-300 text-sm sm:text-base truncate">Update Profile Settings</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Shipments */}
      {!loading && stats.upcomingShipments.length > 0 && (
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Upcoming Shipments</h2>
          <div className="grid gap-4">
            {stats.upcomingShipments.map((shipment: UpcomingShipment, i: number) => (
              <Card key={shipment.id} className={`border-blue-100 dark:border-blue-800 hover:shadow-md transition-all duration-300 group overflow-hidden animate-fade-in-up`} style={{ animationDelay: `${i * 100 + 400}ms` }}>
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="flex-1 p-4 sm:p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-2 sm:p-3 rounded-2xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors shrink-0">
                          <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white truncate">
                            {shipment.origin_city} → {shipment.destination_city}
                          </h3>
                          <div className="flex items-center gap-4 text-xs font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(shipment.departure_date).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {shipment.weight_tonnes}t load</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                        {shipment.goods_description}
                      </p>
                    </div>
                    <div className="sm:w-48 bg-blue-50/30 dark:bg-blue-900/10 p-4 sm:p-6 flex flex-row sm:flex-col justify-center gap-2 border-t sm:border-t-0 sm:border-l border-blue-50 dark:border-blue-800">
                      <Link to={`/shipper/shipments/${shipment.id}`} className="flex-1 sm:flex-none">
                        <Button className="w-full bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-600 dark:hover:bg-blue-700 hover:text-white dark:hover:text-white transition-all shadow-sm text-sm">
                          Details
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCancelShipment(shipment.id)}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 text-sm"
                        disabled={!isOnline}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Section */}
      <div className="grid md:grid-cols-2 gap-6 mt-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        {/* Monthly Spending */}
        <Card className="border-blue-100 dark:border-blue-800 shadow-md overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg font-black text-gray-900 dark:text-white">Monthly Spending</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            <div className="mb-4 flex gap-1 p-0.5 bg-muted rounded-lg w-fit">
              <Button variant={range === '7d' ? 'default' : 'outline'} size="sm" onClick={() => setRange('7d')}>Last 7 days</Button>
              <Button variant={range === '30d' ? 'default' : 'outline'} size="sm" onClick={() => setRange('30d')}>Last 30 days</Button>
              <Button variant={range === '90d' ? 'default' : 'outline'} size="sm" onClick={() => setRange('90d')}>Last 90 days</Button>
            </div>
            {monthlyData.length > 0 ? (
              <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
                <LazyBarChart data={monthlyData} />
              </Suspense>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400 dark:text-gray-500">
                <p className="text-sm font-medium">No data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Routes */}
        <Card className="border-blue-100 dark:border-blue-800 shadow-md overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg font-black text-gray-900 dark:text-white">Recent Routes</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            {routeHistory.length > 0 ? (
              <div className="space-y-3">
                {routeHistory.map((route, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{route.route}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{route.date}</p>
                    </div>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400 shrink-0 ml-4">₹{route.cost.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400 dark:text-gray-500">
                <p className="text-sm font-medium">No routes yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {!loading && stats.upcomingShipments.length === 0 && (
        <div className="bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-8 sm:p-12 text-center animate-scale-in">
          <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Package className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">No upcoming shipments</h3>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
            You don't have any active loads posted. Start by creating a new shipment request.
          </p>
          <Link to="/shipper/post-shipment" className="inline-block mt-6 sm:mt-8">
            <Button className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-md text-sm sm:text-base">
              Create My First Shipment
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ShipperDashboard;
