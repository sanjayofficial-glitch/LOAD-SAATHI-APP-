
import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { 
   Search, 
   Calendar, 
   Package, 
   ArrowRight, 
   Loader2, 
   IndianRupee,
   Sparkles,
   User,
    MapPin,
    Clock,
    ArrowUpDown,
    Map,
    List,
  } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import VerificationBadge from '@/components/VerificationBadge';
import FavoriteButton from '@/components/FavoriteButton';
import { showSuccess, showError } from '@/utils/toast';
import { calculateMatchScore, getMatchLabel, getAIMatchBadge } from '@/utils/matching';
import { useSmartMatch } from '@/hooks/useSmartMatch';
import { useLiveDriverLocations } from '@/hooks/useLiveDriverLocations';
import { LoadSaathiMap, type LoadLocation } from '@/components/maps';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDuration } from '@/utils/format';
import { parseNaturalLanguageSearch } from '@/lib/gemini';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { notifyShipperOfTruckerOffer } from '@/utils/notifications';
import type { Shipment } from '@/types';

const INDIAN_STATES = [
  "Any", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const toLoadLocation = (s: Shipment): LoadLocation => ({
  id: s.id,
  shipper_id: s.shipper_id,
  shipment_id: s.id,
  origin_city: s.origin_city,
  dest_city: s.destination_city,
  origin_lat: null,
  origin_lng: null,
  dest_lat: null,
  dest_lng: null,
  weight_tonnes: s.weight_tonnes,
  budget_per_tonne: s.budget_per_tonne,
  goods_description: s.goods_description,
  status: s.status,
  created_at: s.created_at,
});

const BrowseShipments = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  
  const [filters, setFilters] = useState({
    originState: 'Any',
    destinationState: 'Any',
    minWeight: '',
    maxPrice: '',
    departureDate: ''
  });

  const [sortBy, setSortBy] = useState<'match' | 'budget_asc' | 'budget_desc' | 'date' | 'weight'>('match');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);

  // Fetch trucker's active trip for match scoring
  const { data: myActiveTrip } = useQuery({
    queryKey: ['myActiveTrip', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id || userProfile.user_type !== 'trucker') return null;
      const token = await getToken({ template: 'supabase' });
      if (!token) return null;
      const supabase = createClerkSupabaseClient(token);
      const { data } = await supabase
        .from('trips')
        .select('id, origin_city, destination_city, available_capacity_tonnes, price_per_tonne, origin_lat, origin_lng, destination_lat, destination_lng, departure_date, status, origin_state, destination_state')
        .eq('trucker_id', userProfile.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data || null;
    },
    enabled: !!userProfile?.id && userProfile.user_type === 'trucker',
    staleTime: 30_000,
  });

  // Fetch pending shipments with React Query caching
  const { data: shipments = [], isLoading, error, refetch } = useQuery({
    queryKey: ['pendingShipments'],
    queryFn: async () => {
      const token = await getToken({ template: 'supabase' });
      if (!token) throw new Error('No auth token');
      const supabase = createClerkSupabaseClient(token);
      const { data, error } = await supabase
        .from('shipments')
        .select('id, origin_city, destination_city, origin_state, destination_state, origin_lat, origin_lng, destination_lat, destination_lng, goods_description, weight_tonnes, budget_per_tonne, departure_date, status, created_at, shipper_id, pickup_address, delivery_address, estimated_distance_km, estimated_duration_min, shipper:users(full_name, rating, phone, total_trips, is_verified)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const mapped = (data || []).map((s: Record<string, unknown>) => ({
        ...s,
        shipper: Array.isArray(s.shipper) ? (s.shipper as Record<string, unknown>[])[0] : s.shipper
      }));
      return mapped as Shipment[];
    },
    enabled: !!userProfile?.id,
    staleTime: 15_000,
  });

  const filteredShipments = useMemo(() => {
    return shipments
      .filter(s => {
        const search = searchTerm.toLowerCase();
        const matchesSearch = s.origin_city.toLowerCase().includes(search) || 
                             s.destination_city.toLowerCase().includes(search) ||
                             s.goods_description.toLowerCase().includes(search);
        
        const matchesOrigin = filters.originState === 'Any' || (s.origin_state && s.origin_state === filters.originState);
        const matchesDest = filters.destinationState === 'Any' || (s.destination_state && s.destination_state === filters.destinationState);
        const matchesWeight = !filters.minWeight || s.weight_tonnes >= parseFloat(filters.minWeight);
        const matchesPrice = !filters.maxPrice || s.budget_per_tonne <= parseFloat(filters.maxPrice);
        const matchesDate = !filters.departureDate || new Date(s.departure_date) >= new Date(filters.departureDate);
        
        return matchesSearch && matchesOrigin && matchesDest && matchesWeight && matchesPrice && matchesDate;
      })
      .map(s => ({
        ...s,
        _matchScore: myActiveTrip ? calculateMatchScore({
          shipmentOriginCity: s.origin_city,
          shipmentDestCity: s.destination_city,
          tripOriginCity: myActiveTrip.origin_city,
          tripDestCity: myActiveTrip.destination_city,
          shipmentWeightTonnes: s.weight_tonnes,
          tripCapacityTonnes: myActiveTrip.available_capacity_tonnes,
          shipmentOriginState: s.origin_state,
          shipmentDestState: s.destination_state,
          tripOriginState: myActiveTrip.origin_state,
          tripDestState: myActiveTrip.destination_state,
          shipmentOriginLat: s.origin_lat,
          shipmentOriginLng: s.origin_lng,
          tripOriginLat: myActiveTrip.origin_lat,
          tripOriginLng: myActiveTrip.origin_lng,
          shipmentDestLat: s.destination_lat,
          shipmentDestLng: s.destination_lng,
          tripDestLat: myActiveTrip.destination_lat,
          tripDestLng: myActiveTrip.destination_lng,
          shipmentBudgetPerTonne: s.budget_per_tonne,
          tripPricePerTonne: myActiveTrip.price_per_tonne,
          shipmentDate: s.departure_date,
          tripDate: myActiveTrip.departure_date,
        }) : 0
      }))
      .sort((a, b) => {
        switch (sortBy) {
          case 'budget_asc': return a.budget_per_tonne - b.budget_per_tonne;
          case 'budget_desc': return b.budget_per_tonne - a.budget_per_tonne;
          case 'date': return new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime();
          case 'weight': return b.weight_tonnes - a.weight_tonnes;
          default: return b._matchScore - a._matchScore;
        }
      });
  }, [shipments, searchTerm, filters, sortBy, myActiveTrip]);

  const hasActiveFilters = searchTerm.trim() !== '' ||
    filters.originState !== 'Any' ||
    filters.destinationState !== 'Any' ||
    filters.minWeight !== '' ||
    filters.maxPrice !== '' ||
    filters.departureDate !== '';

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({ originState: 'Any', destinationState: 'Any', minWeight: '', maxPrice: '', departureDate: '' });
  };

  const { scores: aiScores, loadingId: aiLoadingId } = useSmartMatch(
    filteredShipments,
    (s) => myActiveTrip ? {
      shipmentOriginCity: s.origin_city,
      shipmentDestCity: s.destination_city,
      tripOriginCity: myActiveTrip.origin_city,
      tripDestCity: myActiveTrip.destination_city,
      shipmentWeightTonnes: s.weight_tonnes,
      tripCapacityTonnes: myActiveTrip.available_capacity_tonnes,
      shipmentOriginState: s.origin_state,
      shipmentDestState: s.destination_state,
      tripOriginState: myActiveTrip.origin_state,
      tripDestState: myActiveTrip.destination_state,
      shipmentOriginLat: s.origin_lat,
      shipmentOriginLng: s.origin_lng,
      tripOriginLat: myActiveTrip.origin_lat,
      tripOriginLng: myActiveTrip.origin_lng,
      shipmentDestLat: s.destination_lat,
      shipmentDestLng: s.destination_lng,
      tripDestLat: myActiveTrip.destination_lat,
      tripDestLng: myActiveTrip.destination_lng,
      shipmentBudgetPerTonne: s.budget_per_tonne,
      tripPricePerTonne: myActiveTrip.price_per_tonne,
      shipmentDate: s.departure_date,
      tripDate: myActiveTrip.departure_date,
    } : null,
    10,
  );

  // Live driver positions for map overlay
  const { driverLocations } = useLiveDriverLocations(getToken);

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSearchQuery.trim()) return;
    setAiLoading(true);
    try {
      const parsedFilters = await parseNaturalLanguageSearch(aiSearchQuery);
      const searchTerms: string[] = [];
      if (parsedFilters.origin) searchTerms.push(parsedFilters.origin);
      if (parsedFilters.destination) searchTerms.push(parsedFilters.destination);
      setSearchTerm(searchTerms.join(' '));
      if (parsedFilters.weight) setFilters(f => ({ ...f, minWeight: parsedFilters.weight!.toString() }));
      if (parsedFilters.date) setFilters(f => ({ ...f, departureDate: parsedFilters.date! }));
      showSuccess('AI parsed your search!');
    } catch (_err) {
      showError('AI search failed');
    } finally {
      setAiLoading(false);
    }
  };

  const openOfferDialog = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setProposedPrice(shipment.budget_per_tonne.toString());
    setIsOfferDialogOpen(true);
  };

  const submitOffer = async () => {
    if (!selectedShipment || !userProfile) return;
    const price = parseFloat(proposedPrice);
    if (isNaN(price) || price <= 0) {
      showError('Please enter a valid price');
      return;
    }

    setSendingOffer(true);
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) throw new Error('No auth token');
      const supabaseClient = createClerkSupabaseClient(token);
      
      const { error } = await supabaseClient.from('shipment_requests').insert({
        shipment_id: selectedShipment.id,
        trucker_id: userProfile.id,
        shipper_id: selectedShipment.shipper_id,
        proposed_price_per_tonne: price,
        message: message.trim(),
        status: 'pending'
      });

      if (error) throw error;

      await notifyShipperOfTruckerOffer({
        shipperId: selectedShipment.shipper_id,
        truckerName: userProfile.full_name || 'A trucker',
        proposedPrice: price,
        weightTonnes: selectedShipment.weight_tonnes,
        originCity: selectedShipment.origin_city,
        destinationCity: selectedShipment.destination_city,
        getToken: () => getToken({ template: 'supabase' }),
      });

      showSuccess('Offer sent to shipper!');
      setIsOfferDialogOpen(false);
      navigate('/trucker/my-trips?tab=sent');
    } catch (err) {
      const detail = err && typeof err === 'object' ? JSON.stringify(err) : String(err);
      console.error('[submitOffer] Full error:', detail);
      showError(`Failed to send offer${err instanceof Error ? `: ${err.message}` : ''}`);
    } finally {
      setSendingOffer(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Find Goods to Carry</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Browse available shipments posted by shippers and send your best offer</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-blue-100 shadow-sm overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">AI Search</Label>
                <form onSubmit={handleAiSearch} className="space-y-3">
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <Input 
                      placeholder="e.g. '10 tonnes from Mumbai'" 
                      className="pl-10 border-blue-100"
                      value={aiSearchQuery}
                      onChange={(e) => setAiSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600" disabled={aiLoading}>
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    AI Search
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-gray-700 dark:text-gray-200">Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? 'Hide' : 'Show'}
              </Button>
            </CardHeader>
            {showFilters && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Origin State</Label>
                  <Select value={filters.originState} onValueChange={(val) => setFilters({...filters, originState: val})}>
                    <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Destination State</Label>
                  <Select value={filters.destinationState} onValueChange={(val) => setFilters({...filters, destinationState: val})}>
                    <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Min Weight (t)</Label>
                  <Input type="number" value={filters.minWeight} onChange={(e) => setFilters({...filters, minWeight: e.target.value})} />
                </div>
                <Button variant="outline" className="w-full" onClick={clearAllFilters}>Clear All</Button>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input 
                placeholder="Search by city or goods type..." 
                className="pl-10 py-6 rounded-xl border-gray-200 dark:border-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex border rounded-md shrink-0">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2 py-1 text-xs ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'bg-background text-muted-foreground'}`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-2 py-1 text-xs ${viewMode === 'map' ? 'bg-orange-500 text-white' : 'bg-background text-muted-foreground'}`}
                >
                  <Map className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="w-full sm:w-48">
                <Select value={sortBy} onValueChange={(val) => setSortBy(val as 'match' | 'budget_asc' | 'budget_desc' | 'date' | 'weight')}>
                  <SelectTrigger className="py-6 rounded-xl border-gray-200 dark:border-gray-700">
                    <ArrowUpDown className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match">Best Match</SelectItem>
                    <SelectItem value="budget_asc">Budget: Low to High</SelectItem>
                    <SelectItem value="budget_desc">Budget: High to Low</SelectItem>
                    <SelectItem value="date">Earliest Date</SelectItem>
                    <SelectItem value="weight">Heaviest Load</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
            </div>
          ) : error ? (
            <ErrorState
              title="Failed to load shipments"
              description="We couldn't fetch the available loads right now. Check your connection and try again."
              retry={() => refetch()}
            />
          ) : filteredShipments.length === 0 ? (
            hasActiveFilters ? (
              <EmptyState
                accent="orange"
                icon={<Search className="h-8 w-8 sm:h-10 sm:w-10" />}
                title="No shipments match your filters"
                description="Try clearing your filters or adjusting your search to see more available loads."
                primaryAction={{ label: 'Clear All Filters', onClick: clearAllFilters }}
              />
            ) : (
              <EmptyState
                accent="orange"
                icon={<Package className="h-8 w-8 sm:h-10 sm:w-10" />}
                title="No shipments available right now"
                description="Shippers haven't posted loads on this route yet. Post your trip to attract shippers directly."
                primaryAction={{ label: 'Post a Trip', to: '/trucker/post-trip' }}
              />
            )
          ) : viewMode === 'map' ? (
            /* Map View — side-by-side on desktop, stacked on mobile */
            <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100dvh-280px)] lg:min-h-[400px]">
              {/* Map */}
              <div className="h-[45vh] lg:h-auto lg:flex-1 lg:min-h-0">
                <LoadSaathiMap
                  loads={filteredShipments.map(toLoadLocation)}
                  trucks={driverLocations}
                  height="100%"
                  showClusters
                  onTruckClick={() => {
                    navigate('/trucker/post-trip');
                  }}
                  onLoadClick={(load) => {
                    const shipment = filteredShipments.find((s) => s.id === load.id);
                    if (shipment) openOfferDialog(shipment);
                  }}
                />
              </div>
              {/* Shipment List */}
              <div className="w-full max-h-[45vh] lg:max-h-none lg:w-80 overflow-y-auto overflow-x-hidden space-y-2">
                {filteredShipments.map((shipment) => (
                  <Card
                    key={shipment.id}
                    className="border-orange-100 dark:border-orange-800 hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => openOfferDialog(shipment)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="flex items-center text-xs font-bold text-gray-900 dark:text-white truncate">
                              <MapPin className="h-3 w-3 text-orange-500 mr-0.5 shrink-0" />
                              {shipment.origin_city}
                              <ArrowRight className="h-2.5 w-2.5 mx-0.5 text-gray-300 shrink-0" />
                              {shipment.destination_city}
                            </div>
                            {shipment._matchScore > 0 && (() => {
                              const { label, color } = getMatchLabel(shipment._matchScore);
                              return <Badge className={`${color} text-[8px] font-bold shrink-0`}>{label}</Badge>;
                            })()}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500">
                            <span>{shipment.weight_tonnes}T</span>
                            <span className="font-bold text-green-600">₹{shipment.budget_per_tonne.toLocaleString()}/T</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="ml-1 bg-orange-500 hover:bg-orange-600 text-white h-7 px-2"
                          onClick={(e) => { e.stopPropagation(); openOfferDialog(shipment); }}
                        >
                          Offer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredShipments.map((shipment) => (
                <Card key={shipment.id} className="overflow-hidden border-orange-100 dark:border-orange-800 hover:shadow-lg transition-all">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full">
                              <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {shipment.origin_city} <ArrowRight className="h-4 w-4 inline mx-1 text-gray-400 dark:text-gray-500" /> {shipment.destination_city}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{shipment.goods_description}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {shipment._matchScore > 0 && (() => {
                              const { label, color } = getMatchLabel(shipment._matchScore);
                              return <Badge className={`${color} text-xs font-semibold`}>{label}</Badge>;
                            })()}
                            {aiScores[shipment.id] && (() => {
                              const ai = getAIMatchBadge(aiScores[shipment.id]!);
                              return (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge className={`${ai.color} text-xs font-semibold cursor-help`}>
                                        <Sparkles className="h-3 w-3 mr-0.5 inline" />
                                        {ai.label}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="text-xs max-w-[200px]">
                                      {aiScores[shipment.id]!.reasoning}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            })()}
                            {aiLoadingId === shipment.id && (
                              <Loader2 className="h-3 w-3 animate-spin text-purple-500" />
                            )}
                            <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {shipment.weight_tonnes} Tonnes
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">Ready Date</p>
                              <p className="font-medium">{new Date(shipment.departure_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <IndianRupee className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">Budget</p>
                              <p className="font-bold text-green-600 dark:text-green-400">₹{shipment.budget_per_tonne.toLocaleString()} /t</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">Shipper</p>
                              <span className="font-medium">{shipment.shipper?.full_name || 'Verified Shipper'}</span>
                              <VerificationBadge isVerified={shipment.shipper?.is_verified} className="ml-1" />
                            </div>
                          </div>
                          {shipment.estimated_distance_km && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">Distance</p>
                                <p className="font-medium">{shipment.estimated_distance_km.toLocaleString()} km</p>
                              </div>
                            </div>
                          )}
                          {shipment.estimated_duration_min && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">Duration</p>
                                <p className="font-medium">
                                  {formatDuration(shipment.estimated_duration_min)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="md:w-48 bg-gray-50 dark:bg-gray-800 p-6 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 flex flex-col justify-center gap-2">
                        <div className="flex justify-center mb-1">
                          <FavoriteButton entityType="shipment" entityId={shipment.id} userId={userProfile!.id} />
                        </div>
                        <Button className="w-full bg-orange-600" onClick={() => openOfferDialog(shipment)}>
                          Send Offer
                        </Button>
                        <Link to={`/shipper/shipments/${shipment.id}`}>
                          <Button variant="outline" className="w-full">View Details</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Offer to Shipper</DialogTitle>
            <DialogDescription>
              Propose your price for transporting {selectedShipment?.weight_tonnes}t of {selectedShipment?.goods_description}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-200">Your Price per Tonne (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input 
                  type="number" 
                  className="pl-10"
                  value={proposedPrice} 
                  onChange={(e) => setProposedPrice(e.target.value)} 
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Shipper's budget: ₹{selectedShipment?.budget_per_tonne}/t</p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-200">Message (Optional)</Label>
              <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. I have a 12-wheeler available." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOfferDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitOffer} className="bg-orange-600" disabled={sendingOffer}>
              {sendingOffer ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Offer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrowseShipments;