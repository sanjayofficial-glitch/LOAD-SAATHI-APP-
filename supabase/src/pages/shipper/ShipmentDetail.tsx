
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { supabase } from '@/integrations/supabase/client';
import { authorizeRealtime } from '@/utils/realtime';
import RouteMap from '@/components/RouteMap';
import EmissionsCard from '@/components/EmissionsCard';
import LiveMap from '@/components/LiveMap';
import type { TruckLocation } from '@/components/LiveMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Package, MapPin, Calendar, IndianRupee, ArrowLeft, Loader2,
  Clock, Edit, Send, Star, Truck, MapPin as MapPinIcon, CheckCircle2,
  CheckCircle
} from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { notifyShipperOfTruckerOffer } from '@/utils/notifications';
import { generateWhatsAppLink } from '@/utils/whatsapp';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import ReviewDialog from '@/components/ReviewDialog';
import type { Shipment, User } from '@/types';
import { posthog } from '@/utils/posthog';
import { trackEvent } from '@/utils/analytics';

const ShipmentDetail = () => {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [offerCount, setOfferCount] = useState(0);
  const [hasReview, setHasReview] = useState(false);
  const [acceptedTrucker, setAcceptedTrucker] = useState<User | null>(null);
  const [linkedTripStatus, setLinkedTripStatus] = useState<string | null>(null);

  // Offer dialog state (for truckers)
  const [offerOpen, setOfferOpen] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);
  
  // Review dialog state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTripId, setReviewTripId] = useState<string | null>(null);
  const [reviewTruckerId, setReviewTruckerId] = useState<string | null>(null);
  const [reviewTruckerName, setReviewTruckerName] = useState<string>('');
  const [truckerLocation, setTruckerLocation] = useState<TruckLocation | null>(null);

  const fetchData = async () => {
    if (!id || !userProfile) return;
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) throw new Error('No Supabase token');
      const supabase = createClerkSupabaseClient(supabaseToken);

      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .select('*, shipper:users!shipments_shipper_id_fkey(*)')
        .eq('id', id)
        .single();

      if (shipmentError) throw shipmentError;
      setShipment(shipmentData);

      // Count offers received (only visible to owner)
      if (userProfile?.id === shipmentData.shipper_id) {
        const { count } = await supabase
          .from('shipment_requests')
          .select('*', { count: 'exact', head: true })
          .eq('shipment_id', id);
        setOfferCount(count ?? 0);

        // Fetch accepted trucker info for WhatsApp button
        if (shipmentData.status === 'matched' || shipmentData.status === 'completed') {
          const { data: acceptedReq } = await supabase
            .from('shipment_requests')
            .select('*, trucker:users!shipment_requests_trucker_id_fkey(*)')
            .eq('shipment_id', id)
            .eq('status', 'accepted')
            .maybeSingle();
          if (acceptedReq?.trucker) {
            setAcceptedTrucker(acceptedReq.trucker);
          }
        }
        
        // Check for linked trip (booking flow via requests table)
        if (shipmentData.status === 'matched' || shipmentData.status === 'in_transit' || shipmentData.status === 'delivered' || shipmentData.status === 'completed') {
          const { data: linkedRequest } = await supabase
            .from('requests')
            .select('trip_id, receiver_id')
            .eq('shipment_id', id)
            .eq('status', 'accepted')
            .maybeSingle();
          let localTruckerId: string | null = null;
          let localTruckerName: string | null = null;
          if (linkedRequest?.trip_id) {
            const { data: linkedTrip } = await supabase
              .from('trips')
              .select('status')
              .eq('id', linkedRequest.trip_id)
              .single();
            if (linkedTrip) {
              setLinkedTripStatus(linkedTrip.status);
            }

            setReviewTripId(linkedRequest.trip_id);
            if (linkedRequest.receiver_id) {
              const { data: trucker } = await supabase
                .from('users')
                .select('id, full_name')
                .eq('id', linkedRequest.receiver_id)
                .maybeSingle();
              if (trucker) {
                localTruckerId = trucker.id;
                localTruckerName = trucker.full_name || 'the trucker';
                setReviewTruckerId(trucker.id);
                setReviewTruckerName(trucker.full_name || 'the trucker');
              }
            }

            // Check if already reviewed when completed
            if (shipmentData.status === 'completed') {
              const { data: review } = await supabase
                .from('reviews')
                .select('id')
                .eq('trip_id', linkedRequest.trip_id)
                .eq('shipper_id', userProfile.id)
                .limit(1);
              setHasReview(!!review?.length);
            }
          }

          // Fetch trucker's live location when in transit
          if (localTruckerId && shipmentData && (shipmentData.status === 'in_transit' || linkedTripStatus === 'in_transit')) {
            const { data: loc } = await supabase
              .from('driver_locations')
              .select('lat, lng, heading, speed, updated_at')
              .eq('driver_id', localTruckerId)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (loc) {
              setTruckerLocation({
                id: `track-${localTruckerId}`,
                driverId: localTruckerId,
                driverName: localTruckerName || acceptedTrucker?.full_name || 'Trucker',
                lat: loc.lat,
                lng: loc.lng,
                heading: loc.heading,
                speed: loc.speed,
                tripId: reviewTripId,
                originCity: shipmentData.origin_city,
                destinationCity: shipmentData.destination_city,
                lastUpdated: loc.updated_at,
              });
            }
          }
        }
      }
    } catch (error: unknown) {
      console.error('[ShipmentDetail] Error:', error);
      showError(error instanceof Error ? error.message : 'Failed to load shipment details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [id, userProfile?.id]);

  // Real-time subscription for trucker's live location
  const trackedDriverRef = useRef<string | null>(null);
  useEffect(() => {
    if (!reviewTruckerId || !shipment || (shipment.status !== 'in_transit' && linkedTripStatus !== 'in_transit')) return;

    trackedDriverRef.current = reviewTruckerId;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void (async () => {
      // RLS on driver_locations is `TO authenticated` — the anon realtime
      // socket receives nothing (verified live: 401 permission denied). Set
      // the Clerk JWT before subscribing so events flow for this driver.
      await authorizeRealtime(() => getToken({ template: 'supabase' }));
      if (cancelled) return;

      channel = supabase
        .channel(`driver-loc-${reviewTruckerId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'driver_locations',
            filter: `driver_id=eq.${reviewTruckerId}`,
          },
          (payload) => {
            const loc = payload.new as { lat: number; lng: number; heading: number | null; speed: number | null; updated_at: string };
            setTruckerLocation({
              id: `track-${reviewTruckerId}`,
              driverId: reviewTruckerId,
              driverName: acceptedTrucker?.full_name || 'Trucker',
              lat: loc.lat,
              lng: loc.lng,
              heading: loc.heading,
              speed: loc.speed,
              tripId: reviewTripId,
              originCity: shipment.origin_city,
              destinationCity: shipment.destination_city,
              lastUpdated: loc.updated_at,
            });
          }
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) {
        void (async () => {
          try {
            await supabase.removeChannel(channel);
          } catch (err) {
            if (import.meta.env.DEV) console.warn("[channel cleanup]", err);
          }
        })();
      }
      trackedDriverRef.current = null;
    };
  }, [reviewTruckerId, shipment?.status, linkedTripStatus, acceptedTrucker?.full_name, reviewTripId, shipment, getToken]);

  const handleSendOffer = async () => {
    if (!userProfile || !shipment) return;
    const price = parseFloat(proposedPrice);
    if (isNaN(price) || price <= 0) { showError('Enter a valid price'); return; }

    setSendingOffer(true);
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) throw new Error('No auth token');
      const supabase = createClerkSupabaseClient(token);

      const { data: createdRequest, error } = await supabase.rpc('insert_shipment_request', {
        p_shipment_id: shipment.id,
        p_trucker_id: userProfile.id,
        p_shipper_id: shipment.shipper_id,
        p_price: price,
        p_message: offerMessage.trim() || null,
      });
      if (error) throw error;

      await notifyShipperOfTruckerOffer({
        shipperId: shipment.shipper_id,
        truckerName: userProfile.full_name || 'A trucker',
        proposedPrice: price,
        weightTonnes: shipment.weight_tonnes,
        originCity: shipment.origin_city,
        destinationCity: shipment.destination_city,
        requestId: createdRequest?.id,
        getToken: () => getToken({ template: 'supabase' }),
      });

      trackEvent('shipment_offer_sent', {
        shipment_id: shipment.id,
        proposed_price_per_tonne: price,
        weight_tonnes: shipment.weight_tonnes,
        has_message: Boolean(offerMessage.trim()),
      });
      showSuccess('✅ Offer sent! The shipper has been notified.');
      setOfferOpen(false);
      setProposedPrice('');
      setOfferMessage('');
    } catch (err: unknown) {
      posthog.captureException(err, { flow: 'send_shipment_offer' });
      showError(err instanceof Error ? err.message : 'Failed to send offer');
    } finally {
      setSendingOffer(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
    </div>
  );

  if (!shipment) return null;

  const isOwner = userProfile?.id === shipment.shipper_id;
  const isTrucker = userProfile?.user_type === 'trucker';
  const isCompleted = shipment.status === 'completed';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back + Actions */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 dark:text-gray-300">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
          {isOwner && !isCompleted && (
            <Link to={`/shipper/shipments/${id}/edit`}>
              <Button variant="outline" className="border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950">
                <Edit className="mr-2 h-4 w-4" /> Edit Shipment
              </Button>
            </Link>
          )}
          {isOwner && isCompleted && !hasReview && reviewTripId && (
            <Button 
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
              onClick={() => setReviewOpen(true)}
            >
              <Star className="mr-2 h-4 w-4" /> Rate Trucker
            </Button>
          )}
          {isTrucker && !isCompleted && (
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => setOfferOpen(true)}
            >
              <Send className="mr-2 h-4 w-4" /> Send Offer
            </Button>
          )}
        </div>
      </div>

      {/* Route Map */}
      <div className="mb-8 rounded-2xl overflow-hidden">
        <RouteMap
          originCity={shipment.origin_city}
          destinationCity={shipment.destination_city}
          originLat={shipment.origin_lat}
          originLng={shipment.origin_lng}
          destLat={shipment.destination_lat}
          destLng={shipment.destination_lng}
          distanceKm={shipment.estimated_distance_km}
          durationMin={shipment.estimated_duration_min}
          height="260px"
          interactive={false}
        />
      </div>

      {shipment.estimated_distance_km && (
        <div className="mb-8">
          <EmissionsCard
            distanceKm={shipment.estimated_distance_km}
            vehicleType={null}
            loadTonnes={shipment.weight_tonnes}
            compact
          />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-blue-100 dark:border-blue-800 shadow-sm">
            <CardHeader className="bg-blue-50/50 dark:bg-blue-950/50 border-b border-blue-100 dark:border-blue-800">
              <div className="flex justify-between items-start">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  {shipment.origin_city} → {shipment.destination_city}
                </CardTitle>
                <Badge className={
                  shipment.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                  shipment.status === 'matched' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                  shipment.status === 'in_transit' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                  shipment.status === 'delivered' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                  shipment.status === 'completed' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                  'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                }>
                  {shipment.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Departure Date</p>
                  <div className="flex items-center font-medium">
                    <Calendar className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                    {new Date(shipment.departure_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Weight</p>
                  <div className="flex items-center font-medium">
                    <Package className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />
                    {shipment.weight_tonnes} Tonnes
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Budget</p>
                  <div className="flex items-center font-bold text-green-600 dark:text-green-400">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    {shipment.budget_per_tonne.toLocaleString()} /t
                  </div>
                </div>
                {isOwner && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Offers Received</p>
                    <div className="flex items-center font-bold text-orange-600 dark:text-orange-400">
                      <Truck className="h-4 w-4 mr-2" />
                      {offerCount} offer{offerCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Goods Description</p>
                  <p className="text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">{shipment.goods_description}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Pickup Address</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      {shipment.pickup_address}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Delivery Address</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      {shipment.delivery_address}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Shipper Info (for truckers browsing) */}
          {isTrucker && shipment.shipper && (
            <Card className="border-orange-100 dark:border-orange-800">
              <CardHeader className="bg-orange-50/50 dark:bg-orange-950/50 pb-3">
                <CardTitle className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400">Shipper Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center font-bold text-orange-600 dark:text-orange-400">
                    {shipment.shipper?.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{shipment.shipper?.full_name}</p>
                    {shipment.shipper?.city && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        {shipment.shipper.city}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center text-sm text-yellow-500 dark:text-yellow-400 gap-1">
                  <Star className="h-4 w-4" />
                  <span className="font-medium text-gray-700 dark:text-gray-200">{shipment.shipper?.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-gray-400 dark:text-gray-500">rating</span>
                </div>
                {!isCompleted && (
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={() => setOfferOpen(true)}
                  >
                    <Send className="h-4 w-4 mr-2" /> Send Offer
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status card for owner */}
          {/* Accepted Trucker Contact (for shipper) */}
          {isOwner && acceptedTrucker && acceptedTrucker.phone && (
            <Card className="border-green-100 dark:border-green-800">
              <CardHeader className="bg-green-50/50 dark:bg-green-950/50 pb-3">
                <CardTitle className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400">Trucker Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center font-bold text-green-600 dark:text-green-400">
                    {acceptedTrucker.full_name?.charAt(0) || 'T'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{acceptedTrucker.full_name || 'Trucker'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{acceptedTrucker.phone}</p>
                  </div>
                </div>
                <a
                  href={generateWhatsAppLink(acceptedTrucker.phone, {
                    id: shipment.id,
                    goods_description: shipment.goods_description,
                    pickup_city: shipment.origin_city,
                    drop_city: shipment.destination_city,
                    weight: shipment.weight_tonnes * 1000,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-green-600 hover:bg-green-700 w-full">
                    💬 Chat on WhatsApp
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}

          {isOwner && (
            <Card>
              <CardHeader><CardTitle>Shipment Status</CardTitle></CardHeader>
              <CardContent className="text-sm text-gray-600 dark:text-gray-300 space-y-4">
                {isCompleted ? (
                  <div className="flex flex-col items-center text-center py-4 space-y-3">
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                      <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white">Trip Completed!</p>
                    <p>This shipment has been successfully delivered.</p>
                    {!hasReview && (
                      <Button 
                        className="w-full bg-yellow-500 hover:bg-yellow-600 mt-2"
                        onClick={() => setReviewOpen(true)}
                      >
                        Rate the Trucker
                      </Button>
                    )}
                  </div>
                ) : linkedTripStatus ? (
                  <>
                    {linkedTripStatus === 'in_transit' && (
                      <div className="flex flex-col items-center text-center py-4 space-y-3">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                          <Truck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="font-bold text-blue-700 dark:text-blue-300">In Transit</p>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPinIcon className="h-4 w-4 text-orange-500" />
                          <span>{acceptedTrucker ? `${acceptedTrucker.full_name} is on the way from ${shipment.origin_city} → ${shipment.destination_city}` : 'Trucker is en route'}</span>
                        </div>
                      </div>
                    )}
                    {truckerLocation && (
                      <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <LiveMap trucks={[truckerLocation]} className="!h-[200px] rounded-none border-0" />
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-300 text-center">
                          Live tracking updated {new Date(truckerLocation.lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    )}
                    {linkedTripStatus === 'delivered' && (
                      <div className="flex flex-col items-center text-center py-4 space-y-3">
                        <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full">
                          <CheckCircle2 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                        </div>
                        <p className="font-bold text-orange-700 dark:text-orange-300">Delivered</p>
                        <p className="text-sm">Your goods have been delivered. Trucker will complete the trip shortly.</p>
                      </div>
                    )}
                    {linkedTripStatus === 'active' && (
                      <div className="flex flex-col items-center text-center py-4 space-y-3">
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                          <Clock className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="font-bold text-green-700 dark:text-green-300">Awaiting Departure</p>
                        <p className="text-sm">Trucker will start the trip shortly.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
                      <p>Your shipment is currently <strong>{shipment.status}</strong>.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
                      <p>Truckers can view and send offers. You have <strong>{offerCount} offer{offerCount !== 1 ? 's' : ''}</strong> so far.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
                      <p>Go to <strong>My Shipments → Incoming</strong> tab to review and accept offers.</p>
                    </div>
                    {offerCount > 0 && (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
                        onClick={() => navigate('/shipper/my-shipments?tab=incoming')}
                      >
                        Review Offers ({offerCount})
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Offer Dialog (for truckers) */}
      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Send Offer to Shipper</DialogTitle>
            <DialogDescription>
              Propose your price for {shipment.weight_tonnes}t of {shipment.goods_description}<br />
              from {shipment.origin_city} → {shipment.destination_city}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="price">Your Price per Tonne (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  id="price"
                  type="number"
                  className="pl-10"
                  value={proposedPrice}
                  onChange={e => setProposedPrice(e.target.value)}
                  placeholder={`Shipper budget: ₹${shipment.budget_per_tonne}/t`}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="msg">Message (optional)</Label>
              <Input
                id="msg"
                value={offerMessage}
                onChange={e => setOfferMessage(e.target.value)}
                placeholder="e.g. 12-wheeler available, can depart same day"
              />
            </div>
            {proposedPrice && (
              <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg text-sm flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Total offer:</span>
                <span className="font-bold text-orange-700 dark:text-orange-300">
                  ₹{((parseFloat(proposedPrice) || 0) * shipment.weight_tonnes).toLocaleString()}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOfferOpen(false)} disabled={sendingOffer}>Cancel</Button>
            <Button
              onClick={handleSendOffer}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={sendingOffer || !proposedPrice}
            >
              {sendingOffer ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Offer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      {reviewOpen && (
        <ReviewDialog
          isOpen={reviewOpen}
          onClose={() => setReviewOpen(false)}
          tripId={reviewTripId || ''}
          truckerId={reviewTruckerId || ''}
          shipperId={userProfile?.id || ''}
          truckerName={reviewTruckerName}
          shipperName={userProfile?.full_name || 'A shipper'}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default ShipmentDetail;
