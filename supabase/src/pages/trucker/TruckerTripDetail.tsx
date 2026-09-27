
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useSupabase } from '@/hooks/useSupabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Truck, MapPin, Calendar, IndianRupee, ArrowLeft, ArrowRight,
  Edit, Package, Check, X, Loader2, User, Star,
  CheckCircle, Clock, XCircle, Users, Flag
} from 'lucide-react';
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
import RouteMap from '@/components/RouteMap';
import EmissionsCard from '@/components/EmissionsCard';
import GpsTracker from '@/components/GpsTracker';
import {
  notifyShipperOfRequestAccepted,
  notifyShipperOfRequestDeclined,
  notifyShipperOfTripStarted,
  notifyShipperOfTripDelivered,
  notifyShipperOfTripCompletion,
} from '@/utils/notifications';
import ReviewDialog from '@/components/ReviewDialog';
import type { Trip, Request } from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { posthog } from '@/utils/posthog';
import { trackEvent } from '@/utils/analytics';
import { createLogger } from '@/lib/logger';

const log = createLogger('TruckerTripDetail');

const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    accepted: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    declined: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    active: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    in_transit: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    delivered: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
    completed: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  };
  return (
    <Badge className={`font-semibold border ${cfg[status] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
      {status.toUpperCase()}
    </Badge>
  );
};

const TruckerTripDetail = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const { getAuthenticatedClient, withAuthRetry } = useSupabase();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [bookingRequests, setBookingRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedShipperForReview, setSelectedShipperForReview] = useState<{ id: string; name: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!tripId || !userProfile?.id) return;
    try {
      const supabase = await getAuthenticatedClient();

      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*, trucker:users!trips_trucker_id_fkey(*)')
        .eq('id', tripId)
        .eq('trucker_id', userProfile.id)
        .single();

      if (tripError || !tripData) {
        showError('Trip not found or you are not the owner');
        navigate('/trucker/my-trips');
        return;
      }
      setTrip(tripData);

      const { data: requests, error: requestsError } = await supabase
        .from('requests')
        .select('*, shipper:users!requests_shipper_id_fkey(*)')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (!requestsError) setBookingRequests(requests || []);
    } catch (_err) {
      showError('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  }, [tripId, userProfile?.id, getAuthenticatedClient, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateLinkedShipmentStatuses = async (supabase: SupabaseClient, newStatus: string) => {
    const linked = bookingRequests.filter(r => r.status === 'accepted' && r.shipment_id);
    if (linked.length === 0) return;
    const shipmentIds = linked.map(r => r.shipment_id!);
    await supabase
      .from('shipments')
      .update({ status: newStatus })
      .in('id', shipmentIds);
  };

  const handleStartTrip = async () => {
    if (actionLoading) return;
    if (!tripId || !trip) return;
    setActionLoading('start');
    try {
      const supabase = await getAuthenticatedClient();
      const { data, error } = await supabase.rpc('start_trip', { p_trip_id: tripId });
      if (error) throw error;
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      if (result?.error) throw new Error(result.error);

      // Fire-and-forget: update linked shipments and notify shippers.
      void (async () => {
        try {
          const supabase = await getAuthenticatedClient();
          updateLinkedShipmentStatuses(supabase, 'in_transit').catch(() =>
            console.warn('[handleStartTrip] Failed to update linked shipment statuses')
          );
        } catch (_e) {
          console.warn('[handleStartTrip] Failed to get client for side effects');
        }
      })();

      const acceptedShippers = bookingRequests.filter(r => r.status === 'accepted');
      Promise.all(acceptedShippers.map(request =>
        notifyShipperOfTripStarted({
          shipperId: request.shipper_id,
          truckerName: userProfile?.full_name || 'The trucker',
          originCity: trip.origin_city,
          destinationCity: trip.destination_city,
          tripId: trip.id,
          getToken: () => getToken({ template: 'supabase' }),
        })
      )).catch(() =>
        console.warn('[handleStartTrip] Failed to notify some shippers')
      );

      trackEvent('trip_status_updated', {
        trip_id: trip.id,
        previous_status: trip.status,
        new_status: 'in_transit',
        accepted_booking_count: acceptedShippers.length,
      });
      showSuccess('Trip started! Shippers have been notified.');
      fetchData();
    } catch (err) {
      log.error('Failed to start trip', { tripId, error: err });
      showError('Failed to start trip. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkDelivered = async () => {
    if (actionLoading) return;
    if (!tripId || !trip) return;
    setActionLoading('delivered');
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
          updateLinkedShipmentStatuses(supabase, 'delivered').catch(() =>
            console.warn('[handleMarkDelivered] Failed to update linked shipment statuses')
          );
        } catch (_e) {
          console.warn('[handleMarkDelivered] Failed to get client for side effects');
        }
      })();

      const acceptedShippers = bookingRequests.filter(r => r.status === 'accepted');
      Promise.all(acceptedShippers.map(request =>
        notifyShipperOfTripDelivered({
          shipperId: request.shipper_id,
          truckerName: userProfile?.full_name || 'The trucker',
          originCity: trip.origin_city,
          destinationCity: trip.destination_city,
          tripId: trip.id,
          getToken: () => getToken({ template: 'supabase' }),
        })
      )).catch(() =>
        console.warn('[handleMarkDelivered] Failed to notify some shippers')
      );

      trackEvent('trip_status_updated', {
        trip_id: trip.id,
        previous_status: trip.status,
        new_status: 'delivered',
        accepted_booking_count: acceptedShippers.length,
      });
      showSuccess('Marked as delivered! Shippers have been notified.');
      fetchData();
    } catch (err) {
      log.error('Failed to mark delivered', { tripId, error: err });
      showError('Failed to mark delivered. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteTrip = async () => {
    if (actionLoading) return;
    if (!tripId || !trip) return;
    setActionLoading('complete');
    try {
      const supabase = await getAuthenticatedClient();
      const { data, error } = await supabase.rpc('complete_trip', { p_trip_id: tripId });

      console.log('[handleCompleteTrip] RPC response:', { data, error: error ? JSON.stringify(error) : null });

      if (error) throw error;
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      if (result?.error) throw new Error(result.error);

      // Fire-and-forget: update linked shipments and notify shippers.
      // These must NOT block the success flow — a stale/rotated token
      // in getAuthenticatedClient() should not prevent the success toast.
      void (async () => {
        try {
          const supabase = await getAuthenticatedClient();
          updateLinkedShipmentStatuses(supabase, 'completed').catch(() =>
            console.warn('[handleCompleteTrip] Failed to update linked shipment statuses')
          );
        } catch (_e) {
          console.warn('[handleCompleteTrip] Failed to get client for side effects');
        }
      })();

      const acceptedRequests = bookingRequests.filter(r => r.status === 'accepted');
      Promise.all(acceptedRequests.map(request =>
        notifyShipperOfTripCompletion({
          shipperId: request.shipper_id,
          truckerName: userProfile?.full_name || 'The trucker',
          originCity: trip.origin_city,
          destinationCity: trip.destination_city,
          tripId: trip.id,
          getToken: () => getToken({ template: 'supabase' }),
        })
      )).catch(() =>
        console.warn('[handleCompleteTrip] Failed to notify some shippers')
      );

      trackEvent('trip_status_updated', {
        trip_id: trip.id,
        previous_status: trip.status,
        new_status: 'completed',
        accepted_booking_count: acceptedRequests.length,
      });
      showSuccess('Trip marked as completed! Shippers have been notified.');
      fetchData();
    } catch (err: unknown) {
      // Serialize the error to capture Supabase-specific fields (code, details, hint, status)
      const errorDetail = err instanceof Error
        ? { name: err.name, message: err.message, stack: err.stack }
        : typeof err === "object" && err !== null
          ? { ...err as Record<string, unknown> }
          : { raw: String(err) };
      console.error('[handleCompleteTrip] FULL ERROR:', JSON.stringify(errorDetail, null, 2));
      log.error('Failed to complete trip', { tripId, error: errorDetail });
      showError('Failed to complete trip. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBookingAction = async (request: Request, status: 'accepted' | 'declined') => {
    setActionLoading(request.id);
    try {
      const { error } = await withAuthRetry(async (supabase) =>
        supabase
          .from('requests')
          .update({ status })
          .eq('id', request.id)
      );

      if (error) throw error;

      trackEvent('booking_request_updated', {
        trip_id: trip?.id,
        request_id: request.id,
        new_status: status,
        weight_tonnes: request.weight_tonnes,
      });

      if (status === 'accepted') {
        await notifyShipperOfRequestAccepted({
          shipperId: request.shipper_id,
          truckerName: userProfile?.full_name || 'The trucker',
          truckerPhone: userProfile?.phone || 'N/A',
          originCity: trip?.origin_city || '',
          destinationCity: trip?.destination_city || '',
          requestId: request.id,
          getToken: () => getToken({ template: 'supabase' }),
        });
        showSuccess('✅ Request accepted! Shipper has been notified.');
      } else {
        await notifyShipperOfRequestDeclined({
          shipperId: request.shipper_id,
          truckerName: userProfile?.full_name || 'The trucker',
          originCity: trip?.origin_city || '',
          destinationCity: trip?.destination_city || '',
          getToken: () => getToken({ template: 'supabase' }),
        });
        showSuccess('Request declined. Shipper has been notified.');
      }
      fetchData();
    } catch (err) {
      log.error('Failed to update booking request', { requestId: request.id, status, error: err });
      posthog.captureException(err, { flow: 'update_booking_request', new_status: status });
      showError(`Failed to ${status} request. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-orange-600 dark:text-orange-400" />
    </div>
  );

  if (!trip) return null;

  const pendingCount = bookingRequests.filter(r => r.status === 'pending').length;
  const canCompleteTrip = trip.status === 'in_transit' || trip.status === 'delivered';

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/trucker/my-trips')} className="text-gray-600 dark:text-gray-400">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Trips
        </Button>
        <div className="flex gap-2">
          {trip.status === 'active' && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600" disabled={actionLoading === 'start'}>
                    {actionLoading === 'start' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Truck className="h-4 w-4 mr-2" />}
                    Start Trip
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Start this trip?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Mark the trip as in transit. Shippers with accepted bookings will be notified that you are on the way.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleStartTrip} disabled={!!actionLoading} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600">
                      Start Trip
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

               <Button asChild className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600">
                 <Link to={`/trucker/trips/${trip.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit Trip</Link>
               </Button>
            </>
          )}
          {trip.status === 'in_transit' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600" disabled={actionLoading === 'delivered'}>
                  {actionLoading === 'delivered' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Flag className="h-4 w-4 mr-2" />}
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
                    <AlertDialogAction onClick={handleMarkDelivered} disabled={!!actionLoading} className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600">
                    Mark Delivered
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {canCompleteTrip && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600" disabled={actionLoading === 'complete'}>
                  {actionLoading === 'complete' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Complete Trip
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Mark trip as completed?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will finalize the trip. You won't be able to make further changes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCompleteTrip} disabled={!!actionLoading} className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600">
                    Mark Completed
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="mb-8 rounded-2xl overflow-hidden">
        <RouteMap
          originCity={trip.origin_city}
          destinationCity={trip.destination_city}
          originLat={trip.origin_lat}
          originLng={trip.origin_lng}
          destLat={trip.destination_lat}
          destLng={trip.destination_lng}
          distanceKm={trip.estimated_distance_km}
          durationMin={trip.estimated_duration_min}
          height="240px"
          interactive={false}
        />
      </div>

      {(trip.status === 'in_transit' || trip.status === 'active') && (
        <div className="mb-8">
          <GpsTracker
            tripId={trip.id}
            driverId={userProfile?.id}
          />
        </div>
      )}

      {trip.estimated_distance_km && (
        <div className="mb-8">
          <EmissionsCard
            distanceKm={trip.estimated_distance_km}
            vehicleType={trip.vehicle_type}
            loadTonnes={trip.available_capacity_tonnes}
            compact
          />
        </div>
      )}

      <Card className="mb-8 border-orange-100 shadow-sm dark:border-orange-900/30">
        <CardHeader className="bg-orange-50/60 border-b border-orange-100 dark:bg-orange-950/30 dark:border-orange-900/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                {trip.origin_city}
                <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                {trip.destination_city}
              </span>
            </CardTitle>
            <StatusBadge status={trip.status} />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 dark:text-gray-400">Departure</p>
              <div className="flex items-center font-medium text-gray-800 dark:text-gray-200">
                <Calendar className="h-4 w-4 mr-2 text-orange-500 dark:text-orange-400" />
                {new Date(trip.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 dark:text-gray-400">Capacity Available</p>
              <div className="flex items-center font-bold text-blue-600 dark:text-blue-400">
                <Package className="h-4 w-4 mr-2" />
                {trip.available_capacity_tonnes} Tonnes
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 dark:text-gray-400">Price</p>
              <div className="flex items-center font-bold text-green-600 text-lg dark:text-green-400">
                <IndianRupee className="h-4 w-4 mr-1" />
                {trip.price_per_tonne.toLocaleString()} /t
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 dark:text-gray-400">Vehicle</p>
              <div className="flex flex-col">
                <span className="flex items-center font-medium text-gray-800 dark:text-gray-200">
                  <Truck className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" /> {trip.vehicle_type}
                </span>
                <span className="text-xs text-gray-400 ml-6 dark:text-gray-500">{trip.vehicle_number}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Booking Requests
            {pendingCount > 0 && (
              <Badge className="ml-2 bg-orange-600 text-white dark:bg-orange-700">{pendingCount} pending</Badge>
            )}
          </h2>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="w-full max-w-[360px] overflow-x-auto">
            <TabsTrigger value="pending">
              Pending {pendingCount > 0 && `(${pendingCount})`}
            </TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="declined">Declined</TabsTrigger>
          </TabsList>

          {(['pending', 'accepted', 'declined'] as const).map(tab => {
            const filtered = bookingRequests.filter(r => r.status === tab);
            return (
              <TabsContent key={tab} value={tab} className="mt-4">
                {filtered.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                    <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">No {tab} requests</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filtered.map(request => (
                      <Card key={request.id} className="border-orange-100 hover:shadow-md transition-shadow dark:border-orange-900/30">
                        <CardContent className="p-5">
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                                  {request.shipper?.full_name?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 flex items-center gap-1 dark:text-white">
                                    <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                    {request.shipper?.full_name}
                                  </p>
                                  {request.shipper?.phone && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{request.shipper.phone}</p>
                                  )}
                                  <div className="flex items-center gap-1 text-xs text-yellow-500 dark:text-yellow-400">
                                    <Star className="h-3 w-3" />
                                    {request.shipper?.rating?.toFixed(1) || '0.0'} Rating
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 p-3 rounded-lg dark:bg-gray-800">
                                <div>
                                  <p className="text-xs text-gray-500 font-bold uppercase dark:text-gray-400">Goods</p>
                                  <p className="font-medium text-gray-800 dark:text-gray-200">{request.goods_description}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-bold uppercase dark:text-gray-400">Weight</p>
                                  <p className="font-bold text-blue-600 dark:text-blue-400">{request.weight_tonnes} t</p>
                                </div>
                                {request.pickup_address && (
                                  <div className="col-span-2">
                                    <p className="text-xs text-gray-500 font-bold uppercase dark:text-gray-400">Pickup</p>
                                    <p className="text-gray-700 text-xs dark:text-gray-300">{request.pickup_address}</p>
                                  </div>
                                )}
                              </div>

                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                Requested: {new Date(request.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>

                            {tab === 'pending' && (
                              <div className="flex flex-col gap-2 min-w-[140px] justify-center">
                                <Button
                                  className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                                  onClick={() => handleBookingAction(request, 'accepted')}
                                  disabled={!!actionLoading}
                                >
                                  {actionLoading === request.id
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <><Check className="h-4 w-4 mr-2" />Accept</>}
                                </Button>
                                <Button
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
                                  onClick={() => handleBookingAction(request, 'declined')}
                                  disabled={!!actionLoading}
                                >
                                  <X className="h-4 w-4 mr-2" />Decline
                                </Button>
                              </div>
                            )}
                            {tab === 'accepted' && (
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2 text-green-600 font-medium dark:text-green-400">
                                  <CheckCircle className="h-5 w-5" /> Accepted
                                </div>
                                {canCompleteTrip && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600" disabled={actionLoading === 'complete'}>
                                        {actionLoading === 'complete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                                        Trip Completed
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Mark trip as completed?</AlertDialogTitle>
                                        <AlertDialogDescription>This will finalize the trip immediately. You won't be able to make further changes.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleCompleteTrip} disabled={!!actionLoading} className="bg-orange-600 hover:bg-orange-700">Trip Completed</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                {trip.status === 'active' && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600" disabled={actionLoading === 'start'}>
                                        {actionLoading === 'start' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4 mr-1" />}
                                        Start Trip
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Start this trip?</AlertDialogTitle>
                                        <AlertDialogDescription>Mark the trip as in transit. Shippers with accepted bookings will be notified.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleStartTrip} disabled={!!actionLoading} className="bg-blue-600 hover:bg-blue-700">Start Trip</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                {trip.status === 'in_transit' && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600" disabled={actionLoading === 'delivered'}>
                                        {actionLoading === 'delivered' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4 mr-1" />}
                                        Mark Delivered
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Mark as delivered?</AlertDialogTitle>
                                        <AlertDialogDescription>Confirm that goods have been delivered.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleMarkDelivered} disabled={!!actionLoading} className="bg-purple-600 hover:bg-purple-700">Mark Delivered</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                {trip.status === 'delivered' && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600" disabled={actionLoading === 'complete'}>
                                        {actionLoading === 'complete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                                        Complete Trip
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Mark trip as completed?</AlertDialogTitle>
                                        <AlertDialogDescription>This will finalize the trip. You won't be able to make further changes.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleCompleteTrip} disabled={!!actionLoading} className="bg-green-600 hover:bg-green-700">Mark Completed</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                {trip.status === 'completed' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-950"
                                    onClick={() => {
                                      setSelectedShipperForReview({
                                        id: request.shipper_id,
                                        name: request.shipper?.full_name || 'Shipper',
                                      });
                                      setIsReviewOpen(true);
                                    }}
                                  >
                                    <Star className="h-4 w-4 mr-1" /> Rate Shipper
                                  </Button>
                                )}
                              </div>
                            )}
                            {tab === 'declined' && (
                              <div className="flex items-center gap-2 text-red-500 font-medium dark:text-red-400">
                                <XCircle className="h-5 w-5" /> Declined
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      <ReviewDialog
        isOpen={isReviewOpen}
        onClose={() => { setIsReviewOpen(false); setSelectedShipperForReview(null); }}
        tripId={trip.id}
        truckerId={userProfile?.id || ''}
        shipperId={selectedShipperForReview?.id || ''}
        truckerName={userProfile?.full_name || ''}
        shipperName={selectedShipperForReview?.name}
        reviewerRole="trucker"
        onSuccess={fetchData}
      />
    </div>
  );
};

export default TruckerTripDetail;
