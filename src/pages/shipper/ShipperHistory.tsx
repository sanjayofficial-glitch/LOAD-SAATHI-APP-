
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Clock, TrendingUp, Calendar, MapPin, Eye, CheckCircle, Search, Send, IndianRupee, Inbox } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';

interface ShipmentRecord {
  id: string;
  origin_city: string;
  destination_city: string;
  goods_description: string;
  weight_tonnes: number;
  budget_per_tonne: number;
  departure_date: string;
  status: string;
  created_at: string;
}

interface TripRecord {
  id: string;
  origin_city: string;
  destination_city: string;
  price_per_tonne: number;
}

interface RequestRecord {
  id: string;
  created_at: string;
  status: string;
  weight_tonnes: number;
  goods_description: string;
  trip_id: string;
  trips: TripRecord[];
}

interface ActivityItem {
  id: string;
  type: 'shipment' | 'request';
  date: string;
  title: string;
  description: string;
  status: string;
  counterparty: string;
  amount: number;
  weight: number;
  relatedId: string;
}

const ShipperHistory = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all'
  });

  const { data: activities = [], isLoading, error, refetch } = useQuery({
    queryKey: ["shipperHistory", userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('Authentication required');
      
      const supabase = createClerkSupabaseClient(supabaseToken);

      // Fetch shipments (loads posted by the shipper)
      const { data: shipmentsData, error: shipmentsError } = await supabase
        .from('shipments')
        .select('id, origin_city, destination_city, goods_description, weight_tonnes, budget_per_tonne, departure_date, status, created_at')
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (shipmentsError) console.error('[History] Shipments error:', shipmentsError);

      // Fetch requests (booking requests sent to truckers)
      // We use 'trips' for the join as it's the standard table name
      const { data: requestsData, error: requestsError } = await supabase
        .from('requests')
        .select(`
          id,
          created_at,
          status,
          weight_tonnes,
          goods_description,
          trip_id,
          trips!requests_trip_id_fkey(
            id,
            origin_city,
            destination_city,
            price_per_tonne
          )
        `)
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (requestsError) console.error('[History] Requests error:', requestsError);

      const items: ActivityItem[] = [];

      // Process shipments
      if (shipmentsData) {
        shipmentsData.forEach((s: ShipmentRecord) => {
          items.push({
            id: `ship-${s.id}`,
            relatedId: s.id,
            type: 'shipment',
            date: s.created_at || new Date().toISOString(),
            title: `${s.origin_city || 'Unknown'} → ${s.destination_city || 'Unknown'}`,
            description: s.goods_description || 'No description',
            status: s.status || 'pending',
            counterparty: 'Load Saathi Truckers',
            amount: Number(s.budget_per_tonne) || 0,
            weight: Number(s.weight_tonnes) || 0
          });
        });
      }

      // Process requests
      if (requestsData) {
        requestsData.forEach((r: RequestRecord) => {
          const trip = r.trips?.[0];
          items.push({
            id: `req-${r.id}`,
            relatedId: r.trip_id || '',
            type: 'request',
            date: r.created_at || new Date().toISOString(),
            title: `Booking: ${trip?.origin_city || 'Unknown'} → ${trip?.destination_city || 'Unknown'}`,
            description: r.goods_description || 'No description',
            status: r.status || 'pending',
            counterparty: 'Verified Trucker',
            amount: Number(trip?.price_per_tonne) || 0,
            weight: Number(r.weight_tonnes) || 0
          });
        });
      }

      // Sort by date descending
      return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    enabled: !!userProfile?.id,
  });

  const filteredActivities = useMemo(() => {
    if (!Array.isArray(activities)) return [];
    return activities.filter(activity => {
      if (filters.type !== 'all' && activity.type !== filters.type) return false;
      if (filters.status !== 'all' && activity.status !== filters.status) return false;
      return true;
    });
  }, [activities, filters]);

  const stats = useMemo(() => {
    const list = Array.isArray(activities) ? activities : [];
    const now = new Date();
    return {
      total: list.length,
      completed: list.filter(a => ['completed', 'accepted', 'matched'].includes(a.status.toLowerCase())).length,
      pending: list.filter(a => a.status.toLowerCase() === 'pending').length,
      thisMonth: list.filter(a => {
        const d = new Date(a.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length
    };
  }, [activities]);

  const getStatusBadge = (status: string = 'pending') => {
    const s = status.toLowerCase();
    const config: Record<string, string> = {
      completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
      matched: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
      accepted: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
      declined: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
      cancelled: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700',
      active: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
    };
    return (
      <Badge variant="outline" className={`${config[s] || config.pending} font-semibold`}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Invalid Date';
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  if (isLoading) return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
      <Skeleton className="h-12 w-full rounded-xl mb-6" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <ErrorState
        title="Failed to load history"
        description="We encountered an error while fetching your activity. Please try again."
        retry={() => refetch()}
      />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">History & Activity</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Review all your past loads and bookings in one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', val: stats.total, icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/50' },
          { label: 'Completed', val: stats.completed, icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/50' },
          { label: 'Pending', val: stats.pending, icon: Clock, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/50' },
          { label: 'This Month', val: stats.thisMonth, icon: Calendar, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/50' }
        ].map((stat, i) => (
          <Card key={i} className="border-gray-100 dark:border-gray-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`${stat.bg} p-3 rounded-xl`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
              <div>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{stat.val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-8 border-gray-100 dark:border-gray-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase ml-1">Activity Type</label>
              <Select value={filters.type} onValueChange={(v) => setFilters(f => ({...f, type: v}))}>
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="shipment">Posted Loads</SelectItem>
                  <SelectItem value="request">Booking Requests</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase ml-1">Status</label>
              <Select value={filters.status} onValueChange={(v) => setFilters(f => ({...f, status: v}))}>
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="ghost" onClick={() => setFilters({type: 'all', status: 'all'})} className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          activities.length === 0 ? (
            <EmptyState
              accent="blue"
              icon={<Inbox className="h-8 w-8 sm:h-10 sm:w-10" />}
              title="No activities yet"
              description="Start posting loads or booking trucks to build your history."
              primaryAction={{ label: 'Post a Shipment', to: '/shipper/post-shipment' }}
              secondaryAction={{ label: 'Find Trucks', to: '/browse-trucks' }}
            />
          ) : (
            <EmptyState
              accent="blue"
              icon={<Search className="h-8 w-8 sm:h-10 sm:w-10" />}
              title="No activities found"
              description="No results match your current filters."
              primaryAction={{ label: 'Clear Filters', onClick: () => setFilters({ type: 'all', status: 'all' }) }}
            />
          )
        ) : (
          filteredActivities.map((activity) => (
            <Card key={activity.id} className="hover:shadow-xl transition-all duration-300 border-gray-100 dark:border-gray-800 overflow-hidden group">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className={`w-2 md:w-1.5 ${activity.type === 'shipment' ? 'bg-blue-600 dark:bg-blue-500' : 'bg-orange-600 dark:bg-orange-500'}`} />
                  <div className="flex-1 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${activity.type === 'shipment' ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400' : 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'}`}>
                          {activity.type === 'shipment' ? <Package className="h-6 w-6" /> : <Send className="h-6 w-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 leading-none">{activity.title}</h3>
                            <span className="text-[10px] font-black uppercase text-gray-300 dark:text-gray-600 tracking-tighter">#{activity.id.split('-')[1]?.slice(0, 6) ?? ''}</span>
                          </div>
                          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {formatDate(activity.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">{getStatusBadge(activity.status)}</div>
                    </div>
                    
                    <div className="bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100/50 dark:border-gray-700/50 mb-6">
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{activity.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Entity</p>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-red-400 dark:text-red-500" /> {activity.counterparty}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Weight</p>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Package className="h-3 w-3 text-blue-400 dark:text-blue-500" /> {activity.weight}t
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Rate</p>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" /> {activity.amount.toLocaleString('en-IN')} /t
                        </p>
                      </div>
                      <div className="flex items-end sm:justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(activity.type === 'shipment' ? `/shipper/shipments/${activity.relatedId}` : `/trips/${activity.relatedId}`)}
                          className="text-orange-600 dark:text-orange-400 font-black text-xs hover:bg-orange-50 dark:hover:bg-orange-950/50 group-hover:translate-x-1 transition-transform"
                        >
                          DETAILS <Eye className="h-3.5 w-3.5 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ShipperHistory;