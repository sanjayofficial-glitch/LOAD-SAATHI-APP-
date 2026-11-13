
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Package, 
  ArrowRight, 
  Loader2, 
  IndianRupee, 
  Star, 
  Plus, 
  Inbox, 
  MessageSquare, 
  Check, 
  Trash2, 
  Eye, 
  Edit, 
  Send,
  X
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
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import type { Shipment, Request, ShipmentRequest } from '@/types';


const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, string> = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    accepted: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    matched: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    declined: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    cancelled: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700',
  };
  return (
    <Badge className={`font-semibold border ${cfg[status] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
      {status.toUpperCase()}
    </Badge>
  );
};

const MyShipments = () => {
  const { userProfile } = useAuth();
  const { getAuthenticatedClient } = useSupabase();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'loads';

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [sentRequests, setSentRequests] = useState<Request[]>([]);
  const [incomingOffers, setIncomingOffers] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const supabase = await getAuthenticatedClient();

      const { data: shipmentsData, error: shipmentsError } = await supabase
        .from('shipments')
        .select('id, origin_city, destination_city, goods_description, weight_tonnes, budget_per_tonne, departure_date, status, created_at, shipper_id, pickup_address, delivery_address')
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      // A failed read must not look like "you have posted nothing" — throw so
      // the page shows its error state instead of a fake empty list.
      if (shipmentsError) throw shipmentsError;

      const { data: sent, error: sentError } = await supabase
        .from('requests')
        .select(`
          id, created_at, status, weight_tonnes, goods_description, trip_id, shipper_id, pickup_address, delivery_address,
          trip:trips!inner(id, origin_city, destination_city, departure_date, available_capacity_tonnes, price_per_tonne, trucker_id)
        `)
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      const { data: incoming, error: incomingError } = await supabase
        .from('shipment_requests')
        .select(`
          id, created_at, status, proposed_price_per_tonne, message, trucker_id, shipment_id, shipper_id,
          shipment:shipments!inner(id, origin_city, destination_city, goods_description, weight_tonnes, budget_per_tonne, departure_date),
          trucker:users!shipment_requests_trucker_id_fkey(full_name, rating, id)
        `)
        .eq('shipper_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (incomingError) throw incomingError;

      const mappedShipments = (shipmentsData || []).map(s => ({
        ...s
      })) as unknown as Shipment[];

      const mappedSent = (sent || []).map(r => ({
        ...r
      })) as unknown as Request[];

      const mappedIncoming = (incoming || []).map((o: Record<string, unknown>) => ({
        ...o,
        trucker: Array.isArray(o.trucker) ? (o.trucker as Record<string, unknown>[])[0] : o.trucker
      })) as ShipmentRequest[];

      setShipments(mappedShipments);
      setSentRequests(mappedSent);
      setIncomingOffers(mappedIncoming);
      setFetchError(false);
    } catch {
      setFetchError(true);
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getAuthenticatedClient]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDeleteShipment = async (id: string) => {
    setActionLoading(id);
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase.rpc('delete_shipment', { p_shipment_id: id });
      if (error) throw error;
      showSuccess('Shipment deleted successfully');
      fetchData();
    } catch {
      showError('Failed to delete shipment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOfferAction = async (offer: ShipmentRequest, status: 'accepted' | 'declined') => {
    setActionLoading(offer.id);
    try {
      const supabase = await getAuthenticatedClient();
      
      const { error } = await supabase
        .from('shipment_requests')
        .update({ status })
        .eq('id', offer.id);

      if (error) throw error;

      // Notification to the trucker is created by the DB trigger on
      // shipment_requests UPDATE — same transaction, cannot be lost.
      if (status === 'accepted') {
        await supabase
          .from('shipments')
          .update({ status: 'matched' })
          .eq('id', offer.shipment_id);

        showSuccess('Offer accepted!');
      } else {
        showSuccess('Offer declined.');
      }
      
      fetchData();
    } catch {
      showError(`Failed to ${status} offer`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-10 w-full max-w-[600px] mb-6" />
      <div className="grid gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-orange-100 dark:border-orange-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (fetchError) return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <ErrorState
        title="Failed to load your loads"
        description="We couldn't fetch your shipments right now. Check your connection and try again."
        retry={fetchData}
      />
    </div>
  );

  const pendingOffers = incomingOffers.filter(o => o.status === 'pending');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
           <h1 id="shipper-hub-header" className="text-3xl font-bold text-gray-900 dark:text-white">Shipper Hub</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your loads, sent requests, and incoming offers</p>
        </div>
        <Link to="/shipper/post-shipment">
          <Button className="bg-blue-600 hover:bg-blue-700 shadow-md">
            <Plus className="mr-2 h-4 w-4" /> Post New Load
          </Button>
        </Link>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList id="shipper-hub-tabs" className="flex w-full max-w-[600px] overflow-x-auto">
          <TabsTrigger value="loads" className="flex flex-1 min-w-max items-center gap-2">
            <Package className="h-4 w-4" />
            My Loads
            {shipments.length > 0 && <Badge className="ml-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{shipments.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex flex-1 min-w-max items-center gap-2">
            <Send className="h-4 w-4" />
            Sent Requests
            {sentRequests.length > 0 && <Badge className="ml-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{sentRequests.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="incoming" className="flex flex-1 min-w-max items-center gap-2 relative">
            <Inbox className="h-4 w-4" />
            Incoming Offers
            {pendingOffers.length > 0 && (
              <Badge className="ml-1 bg-orange-600 text-white">{pendingOffers.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loads">
          {shipments.length === 0 ? (
            <EmptyState
              accent="blue"
              icon={<Package className="h-8 w-8 sm:h-10 sm:w-10" />}
              image="/illustrations/delivered-boxes.png"
              title="No loads posted yet"
              description="Post a shipment to start receiving offers from truckers."
              primaryAction={{ label: 'Post Your First Load', to: '/shipper/post-shipment' }}
              secondaryAction={{ label: 'Find Trucks', to: '/browse-trucks' }}
            />
          ) : (
            <div id="shipper-hub-my-loads-grid" className="grid gap-6">
              {shipments.map(shipment => (
                <Card key={shipment.id} className="overflow-hidden border-blue-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center text-xl font-bold text-gray-900 dark:text-white">
                            {shipment.origin_city} <ArrowRight className="h-4 w-4 mx-2 text-gray-400 dark:text-gray-500" /> {shipment.destination_city}
                          </div>
                          <StatusBadge status={shipment.status} />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />{new Date(shipment.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                          <div className="flex items-center font-semibold text-gray-900 dark:text-white"><IndianRupee className="h-4 w-4 mr-1 text-green-600 dark:text-green-400" />{shipment.budget_per_tonne.toLocaleString()} /t</div>
                          <div className="flex items-center"><Package className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />{shipment.weight_tonnes}t load</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                        <Button asChild variant="outline" size="sm" className="border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950">
                          <Link to={`/shipper/shipments/${shipment.id}`}><Eye className="h-4 w-4 mr-2" />View</Link>
                        </Button>
                        
                        {shipment.status === 'pending' && (
                          <>
                            <Button asChild variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950">
                              <Link to={`/shipper/shipments/${shipment.id}/edit`}><Edit className="h-4 w-4 mr-2" />Edit</Link>
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete your shipment listing.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => { if (!actionLoading) handleDeleteShipment(shipment.id); }}
                                    disabled={!!actionLoading}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {actionLoading === shipment.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                      'Delete'
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

        <TabsContent value="sent">
          {sentRequests.length === 0 ? (
            <EmptyState
              accent="blue"
              icon={<Send className="h-8 w-8 sm:h-10 sm:w-10" />}
              image="/illustrations/shipping-box.png"
              title="No requests sent yet"
              description="Browse available trucks to book space for your goods."
              primaryAction={{ label: 'Find Trucks', to: '/browse-trucks' }}
            />
          ) : (
            <div className="grid gap-6">
              {sentRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden border-blue-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-lg font-bold text-gray-900 dark:text-white">
                            {request.trip?.origin_city ?? 'Unknown'} <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 mx-2" /> {request.trip?.destination_city ?? 'Unknown'}
                          </div>
                          <StatusBadge status={request.status} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />Trip Date: {request.trip?.departure_date ? new Date(request.trip.departure_date).toLocaleDateString() : 'N/A'}</div>
                          <div className="flex items-center font-bold text-green-700 dark:text-green-400"><IndianRupee className="h-4 w-4 mr-1" />Price: {request.trip?.price_per_tonne?.toLocaleString() ?? 'N/A'} /t</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Goods</p>
                          <p className="text-sm font-semibold">{request.weight_tonnes}t — {request.goods_description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[160px] justify-center">
                        {request.status === 'accepted' && (
                          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/chat/${request.id}`)}>
                            <MessageSquare className="h-4 w-4 mr-2" />Chat with Trucker
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

        <TabsContent value="incoming">
          {incomingOffers.length === 0 ? (
            <EmptyState
              accent="blue"
              icon={<Inbox className="h-8 w-8 sm:h-10 sm:w-10" />}
              image="/illustrations/chat-bubble.png"
              title="No offers received"
              description="When truckers send offers for your loads, they'll appear here. Post a load to start receiving offers."
              primaryAction={{ label: 'Post a Load', to: '/shipper/post-shipment' }}
            />
          ) : (
            <div className="grid gap-6">
              {incomingOffers.map((offer) => (
                <Card key={offer.id} className="overflow-hidden border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-lg font-bold text-gray-900 dark:text-white">
                            {offer.shipment?.origin_city ?? 'Unknown'} <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 mx-2" /> {offer.shipment?.destination_city ?? 'Unknown'}
                          </div>
                          <StatusBadge status={offer.status} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />Ready: {offer.shipment?.departure_date ? new Date(offer.shipment.departure_date).toLocaleDateString() : 'N/A'}</div>
                          <div className="flex items-center font-bold text-orange-600 dark:text-orange-400"><IndianRupee className="h-4 w-4 mr-1" />Offer: {offer.proposed_price_per_tonne?.toLocaleString()} /t</div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                              {offer.trucker?.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{offer.trucker?.full_name}</p>
                              <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                                <Star className="h-3 w-3 fill-current" />
                                {offer.trucker?.rating?.toFixed(1) || '0.0'} Rating
                              </div>
                            </div>
                          </div>
                          {offer.message && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 italic">"{offer.message}"</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[140px] justify-center">
                        {offer.status === 'pending' ? (
                          <>
                            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleOfferAction(offer, 'accepted')} disabled={!!actionLoading}>
                              {actionLoading === offer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" />Accept</>}
                            </Button>
                            <Button variant="outline" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleOfferAction(offer, 'declined')} disabled={!!actionLoading}>
                              <X className="h-4 w-4 mr-2" />Decline
                            </Button>
                          </>
                        ) : offer.status === 'accepted' && (
                          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/chat/${offer.id}`)}>
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

export default MyShipments;
