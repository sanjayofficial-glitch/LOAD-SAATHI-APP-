
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useSupabase } from '@/hooks/useSupabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Truck,
  Calendar,
  IndianRupee,
  Trash2,
  Eye,
  Loader2,
  ArrowRight,
  Plus,
  Send,
  Inbox,
  Package,
  CheckCircle,
  MessageSquare,
  Phone,
  Check,
  X,
  Flag
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import RouteMap from '@/components/RouteMap';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { showSuccess, showError } from '@/utils/toast';
import {
  notifyShipperOfRequestAccepted,
  notifyShipperOfRequestDeclined,
  notifyShipperOfTripCompletion,
  notifyShipperOfTripDelivered,
} from '@/utils/notifications';
import type { Trip, ShipmentRequest, Request } from '@/types';

const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, string> = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    accepted: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    declined: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    cancelled: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  };
  return (
    <Badge className={`font-semibold border ${cfg[status] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
      {status.toUpperCase()}
    </Badge>
  );
};

const TruckerHub = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'trips';

  const [trips, setTrips] = useState<Trip[]>([]);
  const [sentOffers, setSentOffers] = useState<ShipmentRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const supabase = await getAuthenticatedClient();

      // 1. My Posted Trips
      const { data: tripsData } = await supabase
        .from('trips')
        .select('id, origin_city, destination_city, origin_lat, origin_lng, destination_lat, destination_lng, estimated_distance_km, estimated_duration_min, departure_date, available_capacity_tonnes, price_per_tonne, status, created_at, trucker_id, vehicle_type, vehicle_number')
        .eq('trucker_id', userProfile.id)
        .order('created_at', { ascending: false });

      // 2. Offers sent to shippers (trucker -> shipper)
      const { data: sent } = await supabase
        .from('shipment_requests')
        .select(`
          id, created_at, status, proposed_price_per_tonne, message, shipment_id, trucker_id, shipper_id,
          shipment:shipments!inner(id, origin_city, destination_city, departure_date, weight_tonnes, status, shipper_id, shipper:users!shipments_shipper_id_fkey(full_name, phone))
        `)
        .eq('trucker_id', userProfile.id)
        .order('created_at', { ascending: false });

      // 3. Booking requests from shippers (shipper -> trucker)
      const { data: incoming } = await supabase
        .from('requests')
        .select(`
          id, created_at, status, weight_tonnes, goods_description, shipper_id, trip_id, pickup_address, delivery_address,
          trip:trips!requests_trip_id_fkey(id, origin_city, destination_city, departure_date, available_capacity_tonnes, price_per_tonne)
        `)
        .eq('receiver_id', userProfile.id)
        .order('created_at', { ascending: false });

      const mappedSent = (sent || []).map((o: Record<string, unknown>) => ({
        ...o,
        shipment: o.shipment ? {
          ...(o.shipment as Record<string, unknown>),
          shipper: Array.isArray((o.shipment as Record<string, unknown>).shipper)
            ? ((o.shipment as Record<string, unknown>).shipper as Record<string, unknown>[])[0]
            : (o.shipment as Record<string, unknown>).shipper
        } : o.shipment
      })) as ShipmentRequest[];

      const mappedIncoming = (incoming || []).map((r: Record<string, unknown>) => ({
        ...r,
        trip: Array.isArray(r.trip) ? (r.trip as Record<string, unknown>[])[0] : r.trip
      })) as unknown as Request[];

      setTrips(tripsData || []);
      setSentOffers(mappedSent);
      setIncomingRequests(mappedIncoming);
      setFetchError(false);
    } catch (_err) {
      setFetchError(true);
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getAuthenticatedClient]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDeleteTrip = async (tripId: string) => {
    setActionLoading(tripId);
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase.rpc('delete_trip', { p_trip_id: tripId });
      if (error) throw error;
      showSuccess('Trip deleted successfully');
      fetchData();
    } catch (_err) {
      showError('Failed to delete trip');
    } finally {
      setActionLoading(null);
    }
  };

  const updateLinkedShipmentStatuses = async (supabase: SupabaseClient, tripId: string, newStatus: string) => {
    const linked = incomingRequests.filter(r => r.trip_id === tripId && r.status === 'accepted' && r.shipment_id);
    if (linked.length === 0) return;
    const shipmentIds = linked.map(r => r.shipment_id!);
    await supabase
      .from('shipments')
      .update({ status: newStatus })
      .in('id', shipmentIds);
  };

  const handleCompleteTrip = async (tripId: string) => {
    setActionLoading(tripId);
    try {
      const supabase = await getAuthenticatedClient();
      const { data, error } = await supabase.rpc('complete_trip', { p_trip_id: tripId });

      if (error) throw error;
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      if (result?.error) throw new Error(result.error);

      // Fire-and-forget: update linked shipments and notify shippers.
      void (async () => {
        try {
          const supabase = await getAuthenticatedClient();
          updateLinkedShipmentStatuses(supabase, tripId, 'completed').catch(() =>
            console.warn('[handleCompleteTrip] Failed to update linked shipment statuses')
          );
        } catch (_e) {
          console.warn('[handleCompleteTrip] Failed to get client for side effects');
        }
      })();

      const tripRequests = incomingRequests.filter(r => r.trip_id === tripId && r.status === 'accepted');
      Promise.all(tripRequests.map(request =>
        notifyShipperOfTripCompletion({
          shipperId: request.shipper_id,
          truckerName: userProfile?.full_name || 'The trucker',
          originCity: request.trip?.origin_city || '',
          destinationCity: request.trip?.destination_city || '',
          tripId,
          getToken: () => getToken({ template: 'supabase' }),
        })
      )).catch(() =>
        console.warn('[handleCompleteTrip] Failed to notify some shippers')
      );

      showSuccess('Trip marked as completed!');
      fetchData();
    } catch (_err) {
      showError('Failed to complete trip');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkDelivered = async (tripId: string) => {
    setActionLoading(tripId);
    try {
      const supabase = await getAuthenticatedClient();
      const { data, error } = await supabase.rpc('mark_trip_delivered', { p_trip_id: tripId });

      if (error) throw error;
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      if (result?.error) throw new Error(result.error);

      // Fire-and-forget: update linked shipments and notify shippers.
      void (async () => {
        try {
          const supabase = await getAuthenticatedClient();
          updateLinkedShipmentStatuses(supabase, tripId, 'delivered').catch(() =>
            console.warn('[handleMarkDelivered] Failed to update linked shipment statuses')
          );
        } catch (_e) {
          console.warn('[handleMarkDelivered] Failed to get client for side effects');
        }
      })();

      const tripRequests = incomingRequests.filter(r => r.trip_id === tripId && r.status === 'accepted');
      Promise.all(tripRequests.map(request =>
        notifyShipperOfTripDelivered({
          shipperId: request.shipper_id,
          truckerName: userProfile?.full_name || 'The trucker',
          originCity: request.trip?.origin_city || '',
          destinationCity: request.trip?.destination_city || '',
          tripId,
          getToken: () => getToken({ template: 'supabase' }),
        })
      )).catch(() =>
        console.warn('[handleMarkDelivered] Failed to notify some shippers')
      );

      showSuccess('Trip marked as delivered!');
      fetchData();
    } catch (_err) {
      showError('Failed to mark trip as delivered');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBookingAction = async (request: Request, status: 'accepted' | 'declined') => {
    setActionLoading(request.id);
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase
        .from('requests')
        .update({ status })
        .eq('id', request.id);

      if (error) throw error;

      // Update local state immediately for better UX
      setIncomingRequests(prev => 
        prev.map(r => r.id === request.id ? { ...r, status } : r)
      );

      if (status === 'accepted') {
        await notifyShipperOfRequestAccepted({
          shipperId: request.shipper_id,
          truckerName: userProfile?.full_name || 'The trucker',
          truckerPhone: userProfile?.phone || 'N/A',
          originCity: request.trip?.origin_city || '',
          destinationCity: request.trip?.destination_city || '',
          requestId: request.id,
          getToken: () => getToken({ template: 'supabase' }),
        });
        showSuccess('✅ Request accepted!');
      } else {
        await notifyShipperOfRequestDeclined({
          shipperId: request.shipper_id,
          truckerName: userProfile?.full_name || 'The trucker',
          originCity: request.trip?.origin_city || '',
          destinationCity: request.trip?.destination_city || '',
          getToken: () => getToken({ template: 'supabase' }),
        });
        showSuccess('Request declined.');
      }
      
      // Refresh all data to ensure consistency
      await fetchData();
    } catch (err) {
      console.error('[handleBookingAction] Error:', err);
      showError(`Failed to ${status} request. Please check your permissions.`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <Skeleton className="h-10 w-full max-w-[600px] mb-6" />
      <div className="grid gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-orange-100 dark:border-orange-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (fetchError) return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <ErrorState
        title="Failed to load your hub"
        description="We couldn't fetch your trips and requests right now. Check your connection and try again."
        retry={fetchData}
      />
    </div>
  );

  const pendingIncoming = incomingRequests.filter(r => r.status === 'pending');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
           <h1 id="trucker-hub-header" className="text-3xl font-bold text-gray-900 dark:text-gray-100">Trucker Hub</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your trips, sent offers, and incoming bookings</p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-green-600 hover:bg-green-700 shadow-md"
            onClick={() => navigate('/trucker/browse-shipments?view=card')}
          >
            <Package className="mr-2 h-4 w-4" /> Show me loads
          </Button>
          <Link to="/trucker/post-trip">
            <Button className="bg-orange-600 hover:bg-orange-700 shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Post New Trip
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList id="trucker-hub-tabs" className="flex w-full max-w-[600px] overflow-x-auto">
          <TabsTrigger value="trips" className="flex flex-1 min-w-max items-center gap-2">
            <Truck className="h-4 w-4" />
            My Trips
            {trips.length > 0 && <Badge className="ml-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">{trips.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex flex-1 min-w-max items-center gap-2">
            <Send className="h-4 w-4" />
            Sent Offers
            {sentOffers.length > 0 && <Badge className="ml-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">{sentOffers.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="incoming" className="flex flex-1 min-w-max items-center gap-2 relative">
            <Inbox className="h-4 w-4" />
            Booking Requests
            {pendingIncoming.length > 0 && (
              <Badge className="ml-1 bg-orange-600 text-white">{pendingIncoming.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trips">
          {trips.length === 0 ? (
            <EmptyState
              accent="orange"
              icon={<Truck className="h-8 w-8 sm:h-10 sm:w-10" />}
              title="No trips posted yet"
              description="Post a trip to start finding loads to carry and earn more."
              primaryAction={{ label: 'Post Your First Trip', to: '/trucker/post-trip' }}
              secondaryAction={{ label: 'Find Shipments', to: '/trucker/browse-shipments' }}
            />
          ) : (
            <div id="trucker-hub-my-trips-grid" className="grid gap-6">
              {trips.map(trip => (
                <Card key={trip.id} className="overflow-hidden border-orange-100 dark:border-orange-800 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center text-xl font-bold text-gray-900 dark:text-gray-100">
                            {trip.origin_city} <ArrowRight className="h-4 w-4 mx-2 text-gray-400 dark:text-gray-500" /> {trip.destination_city}
                          </div>
                          <StatusBadge status={trip.status} />
                        </div>
                        {(trip.origin_lat || trip.origin_lng || trip.destination_lat || trip.destination_lng) && (
                          <div className="rounded-xl overflow-hidden border border-orange-100 dark:border-orange-800">
                            <RouteMap
                              originCity={trip.origin_city}
                              destinationCity={trip.destination_city}
                              originLat={trip.origin_lat}
                              originLng={trip.origin_lng}
                              destLat={trip.destination_lat}
                              destLng={trip.destination_lng}
                              distanceKm={trip.estimated_distance_km}
                              durationMin={trip.estimated_duration_min}
                              height="150px"
                              interactive={false}
                            />
                          </div>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-orange-600" />{new Date(trip.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                          <div className="flex items-center font-semibold text-gray-900 dark:text-gray-100"><IndianRupee className="h-4 w-4 mr-1 text-green-600" />{trip.price_per_tonne.toLocaleString()} /t</div>
                          <div className="flex items-center"><Package className="h-4 w-4 mr-2 text-blue-600" />{trip.available_capacity_tonnes}t available</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0 dark:border-gray-700">
                        <Link to={`/trucker/trips/${trip.id}`}><Button variant="outline" size="sm" className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950"><Eye className="h-4 w-4 mr-2" />View</Button></Link>
                        
                        {trip.status === 'in_transit' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950">
                                <Flag className="h-4 w-4 mr-2" />
                                Mark Delivered
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Mark as delivered?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Confirm that goods have been delivered. Shippers will be notified to confirm and leave a review.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => { if (!actionLoading) handleMarkDelivered(trip.id); }}
                                  disabled={!!actionLoading}
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  {actionLoading === trip.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    'Mark Delivered'
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {trip.status === 'delivered' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Trip Completed
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Mark trip as completed?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will mark the trip as finished. You won't be able to make further changes.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => { if (!actionLoading) handleCompleteTrip(trip.id); }}
                                  disabled={!!actionLoading}
                                  className="bg-orange-600 hover:bg-orange-700"
                                >
                                  {actionLoading === trip.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    'Trip Completed'
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {trip.status !== 'completed' && trip.status !== 'cancelled' && (
                          <Button asChild variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950">
                            <Link to={`/trucker/trips/${trip.id}/edit`}>Edit</Link>
                          </Button>
                        )}
                        {trip.status !== 'completed' && trip.status !== 'cancelled' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete your trip listing.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => { if (!actionLoading) handleDeleteTrip(trip.id); }}
                                  disabled={!!actionLoading}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {actionLoading === trip.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    'Delete'
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent">
          {sentOffers.length === 0 ? (
            <EmptyState
              accent="orange"
              icon={<Send className="h-8 w-8 sm:h-10 sm:w-10" />}
              title="No offers sent yet"
              description="Browse shipments to find loads for your truck and send an offer."
              primaryAction={{ label: 'Find Shipments', to: '/trucker/browse-shipments' }}
            />
          ) : (
            <div className="grid gap-6">
              {sentOffers.map((offer) => (
                <Card key={offer.id} className="overflow-hidden border-orange-100 dark:border-orange-800 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-lg font-bold text-gray-900 dark:text-gray-100">
                            {offer.shipment?.origin_city} <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 mx-2" /> {offer.shipment?.destination_city}
                          </div>
                          <StatusBadge status={offer.status} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-orange-500" />Ready: {offer.shipment ? new Date(offer.shipment.departure_date).toLocaleDateString() : ''}</div>
                          <div className="flex items-center font-bold text-green-700 dark:text-green-400"><IndianRupee className="h-4 w-4 mr-1" />Offer: {offer.proposed_price_per_tonne?.toLocaleString()} /t</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Shipper</p>
                          <p className="text-sm font-semibold dark:text-gray-200">{offer.shipment?.shipper?.full_name}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[160px] justify-center">
                        {offer.status === 'accepted' && (
                          <>
                            <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => navigate(`/chat/${offer.id}`)}>
                              <MessageSquare className="h-4 w-4 mr-2" />Chat
                            </Button>
                            {offer.shipment?.shipper?.phone && (
                              <a href={`tel:${offer.shipment.shipper.phone}`} className="block">
                                <Button variant="outline" className="w-full"><Phone className="h-4 w-4 mr-2" />Call</Button>
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="incoming">
          {incomingRequests.length === 0 ? (
            <EmptyState
              accent="orange"
              icon={<Inbox className="h-8 w-8 sm:h-10 sm:w-10" />}
              title="No booking requests"
              description="When shippers book space on your trips, they'll appear here. Post a trip to start receiving requests."
              primaryAction={{ label: 'Post a Trip', to: '/trucker/post-trip' }}
            />
          ) : (
            <div className="grid gap-6">
              {incomingRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden border-orange-100 dark:border-orange-800 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-lg font-bold text-gray-900 dark:text-gray-100">
                            {request.trip?.origin_city} <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 mx-2" /> {request.trip?.destination_city}
                          </div>
                          <StatusBadge status={request.status} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-orange-500" />Trip: {request.trip ? new Date(request.trip.departure_date).toLocaleDateString() : ''}</div>
                          <div className="flex items-center"><Package className="h-4 w-4 mr-2 text-blue-500" />{request.weight_tonnes}t — {request.goods_description}</div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg border border-orange-100 dark:border-orange-800">
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Shipper</p>
                          <p className="font-semibold dark:text-gray-200">{request.shipper?.full_name}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[160px] justify-center">
                        {request.status === 'pending' ? (
                          <>
                            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleBookingAction(request, 'accepted')} disabled={!!actionLoading}>
                              {actionLoading === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" />Accept</>}
                            </Button>
                            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950" onClick={() => handleBookingAction(request, 'declined')} disabled={!!actionLoading}>
                              <X className="h-4 w-4 mr-2" />Decline
                            </Button>
                          </>
                        ) : request.status === 'accepted' && (
                          <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => navigate(`/chat/${request.id}`)}>
                            <MessageSquare className="h-4 w-4 mr-2" />Chat
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TruckerHub;
