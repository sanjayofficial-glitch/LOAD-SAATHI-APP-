import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import VehicleSelect from '@/components/VehicleSelect';
import {
  Search,
  Calendar,
  ArrowRight,
  IndianRupee,
  Filter,
  Truck,
  MapPin,
  Package as PackageIcon,
  AlertCircle,
  Clock,
  Sparkles,
  Loader2,
  ArrowUpDown,
  Map,
  List,
} from 'lucide-react';

import VerificationBadge from '@/components/VerificationBadge';
import FavoriteButton from '@/components/FavoriteButton';
import { calculateMatchScore, getMatchLabel, getAIMatchBadge } from '@/utils/matching';
import { useSmartMatch } from '@/hooks/useSmartMatch';
import { useLiveDriverLocations } from '@/hooks/useLiveDriverLocations';
import { useTripMapMarkers } from '@/hooks/useTripMapMarkers';
import { LoadSaathiMap, type TruckLocation } from '@/components/maps';
import { formatDuration } from '@/utils/format';
import type { Trip } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const TripList = () => {
  const { userProfile } = useAuth();
  const { getSupabaseToken } = useAuth();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    minCapacity: '',
    maxPrice: '',
    vehicle_type: ''
  });

  const [sortBy, setSortBy] = useState<'match' | 'price_asc' | 'price_desc' | 'date' | 'distance'>('match');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch current shipper's pending shipment for match scoring
  const { data: myShipment } = useQuery({
    queryKey: ['myShipment', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id || userProfile.user_type !== 'shipper') return null;
      const token = await getSupabaseToken();
      if (!token) return null;
      const supabase = createClerkSupabaseClient(token);
      const { data } = await supabase
        .from('shipments')
        .select('id, origin_city, destination_city, weight_tonnes, origin_state, destination_state, origin_lat, origin_lng, destination_lat, destination_lng, budget_per_tonne, departure_date, status')
        .eq('shipper_id', userProfile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data || null;
    },
    enabled: !!userProfile?.id && userProfile.user_type === 'shipper',
    staleTime: 30_000,
  });

  // Fetch active trips with React Query caching
  const { data: trips = [], isLoading, error, refetch } = useQuery({
    queryKey: ['activeTrips', filters.origin, filters.destination, filters.minCapacity, filters.maxPrice, filters.vehicle_type],
    queryFn: async () => {
      const token = await getSupabaseToken();
      if (!token) throw new Error('Authentication required');
      const supabase = createClerkSupabaseClient(token);

      let query = supabase
        .from('trips')
        .select(`
          id, origin_city, destination_city, origin_state, destination_state, origin_lat, origin_lng, destination_lat, destination_lng, available_capacity_tonnes, price_per_tonne, departure_date, created_at, trucker_id, status, estimated_distance_km, estimated_duration_min, vehicle_type,
          trucker:users!trips_trucker_id_fkey(
            full_name,
            rating,
            total_trips,
            is_verified
          )
        `)
        .in('status', ['active', 'in_transit'])
        .order('departure_date', { ascending: true })
        .limit(50);

      if (filters.origin) {
        query = query.ilike('origin_city', `%${filters.origin}%`);
      }
      if (filters.destination) {
        query = query.ilike('destination_city', `%${filters.destination}%`);
      }
      if (filters.minCapacity) {
        query = query.gte('available_capacity_tonnes', parseFloat(filters.minCapacity));
      }
      if (filters.maxPrice) {
        query = query.lte('price_per_tonne', parseFloat(filters.maxPrice));
      }
      if (filters.vehicle_type) {
        query = query.ilike('vehicle_type', `%${filters.vehicle_type}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      const mapped = (data || []).map((t: Record<string, unknown>) => ({
        ...t,
        trucker: Array.isArray(t.trucker) ? (t.trucker as Record<string, unknown>[])[0] : t.trucker
      }));
      return mapped as Trip[];
    },
    enabled: !!userProfile?.id,
    staleTime: 15_000,
  });

  const filteredTrips = useMemo(() => {
    return trips
      .filter(t => {
        const matchesSearch = !searchTerm || 
          t.origin_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.destination_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.trucker?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
      })
      .map(t => ({
        ...t,
        _matchScore: myShipment ? calculateMatchScore({
          shipmentOriginCity: myShipment.origin_city,
          shipmentDestCity: myShipment.destination_city,
          tripOriginCity: t.origin_city,
          tripDestCity: t.destination_city,
          shipmentWeightTonnes: myShipment.weight_tonnes,
          tripCapacityTonnes: t.available_capacity_tonnes,
          shipmentOriginState: myShipment.origin_state,
          shipmentDestState: myShipment.destination_state,
          tripOriginState: t.origin_state,
          tripDestState: t.destination_state,
          shipmentOriginLat: myShipment.origin_lat,
          shipmentOriginLng: myShipment.origin_lng,
          tripOriginLat: t.origin_lat,
          tripOriginLng: t.origin_lng,
          shipmentDestLat: myShipment.destination_lat,
          shipmentDestLng: myShipment.destination_lng,
          tripDestLat: t.destination_lat,
          tripDestLng: t.destination_lng,
          shipmentBudgetPerTonne: myShipment.budget_per_tonne,
          tripPricePerTonne: t.price_per_tonne,
          shipmentDate: myShipment.departure_date,
          tripDate: t.departure_date,
          truckerRating: t.trucker?.rating,
        }) : 0
      }))
      .sort((a, b) => {
        switch (sortBy) {
          case 'price_asc': return a.price_per_tonne - b.price_per_tonne;
          case 'price_desc': return b.price_per_tonne - a.price_per_tonne;
          case 'date': return new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime();
          case 'distance': return (a.estimated_distance_km || 0) - (b.estimated_distance_km || 0);
          default: return b._matchScore - a._matchScore;
        }
      });
  }, [trips, searchTerm, myShipment, sortBy]);

  const { scores: aiScores, loadingId: aiLoadingId } = useSmartMatch(
    filteredTrips,
    (t) => myShipment ? {
      shipmentOriginCity: myShipment.origin_city,
      shipmentDestCity: myShipment.destination_city,
      tripOriginCity: t.origin_city,
      tripDestCity: t.destination_city,
      shipmentWeightTonnes: myShipment.weight_tonnes,
      tripCapacityTonnes: t.available_capacity_tonnes,
      shipmentOriginState: myShipment.origin_state,
      shipmentDestState: myShipment.destination_state,
      tripOriginState: t.origin_state,
      tripDestState: t.destination_state,
      shipmentOriginLat: myShipment.origin_lat,
      shipmentOriginLng: myShipment.origin_lng,
      tripOriginLat: t.origin_lat,
      tripOriginLng: t.origin_lng,
      shipmentDestLat: myShipment.destination_lat,
      shipmentDestLng: myShipment.destination_lng,
      tripDestLat: t.destination_lat,
      tripDestLng: t.destination_lng,
      shipmentBudgetPerTonne: myShipment.budget_per_tonne,
      tripPricePerTonne: t.price_per_tonne,
      shipmentDate: myShipment.departure_date,
      tripDate: t.departure_date,
      truckerRating: t.trucker?.rating,
    } : null,
    10,
  );

  // Live driver positions for map overlay
  const { driverLocations } = useLiveDriverLocations();

  // Map markers: every listed trip's truck gets a marker — its live GPS position
  // if the driver is sharing one, otherwise a pin at the trip's origin city
  // (stored coords first, geocoded city name as fallback). This guarantees every
  // truck in the list (e.g. a trucker who posted a trip but isn't broadcasting
  // GPS) also shows up on the map.
  const tripMarkers = useTripMapMarkers(filteredTrips, driverLocations, viewMode === 'map');

  // Legacy behaviour: also surface live trucks sitting at a listed trip's
  // origin city, so nearby trucks show up even without a posted trip match.
  const mapTrucks = useMemo<TruckLocation[]>(() => {
    const seen = new Set(tripMarkers.map((t) => t.driver_id));
    const extra = driverLocations.filter(
      (d) => !seen.has(d.driver_id) && filteredTrips.some((t) => t.origin_city === d.origin_city),
    );
    return [...tripMarkers, ...extra];
  }, [tripMarkers, driverLocations, filteredTrips]);

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-orange-600 dark:text-orange-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Please log in to browse trucks</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 py-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-orange-100">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : error && typeof error === 'object' && 'message' in error
          ? String((error as { message: unknown }).message)
          : String(error);
    return (
      <div className="py-8">
        <ErrorState
          title="Failed to load trucks"
          description="We couldn't fetch available trucks right now. Check your connection and try again."
          retry={() => refetch()}
        />
        {errorMessage && (
          <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500 break-words max-w-md mx-auto">
            Details: {errorMessage}
          </p>
        )}
      </div>
    );
  }

  const hasActiveFilters = filters.origin || filters.destination || filters.minCapacity || filters.maxPrice || filters.vehicle_type;

  return (
    <div className="space-y-6 animate-fade-in">
      <div id="browse-trips-header" className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Browse Trips</div>
      <p className="text-sm text-gray-500 dark:text-gray-400">Find verified truckers moving goods on routes you need.</p>
      {/* Search and Filters */}
      <Card className="border-orange-100 dark:border-orange-800 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-orange-500 to-orange-400" />
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-4">
             <div id="browse-trips-search" className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search by city, trucker name..."
                className="pl-10 border-orange-100 dark:border-orange-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex border rounded-md">
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
              <Select value={sortBy} onValueChange={(value: 'match' | 'price_asc' | 'price_desc' | 'date' | 'distance') => setSortBy(value)}>
                <SelectTrigger className="flex-1 min-w-[140px] sm:flex-none sm:w-[160px] border-gray-200 dark:border-gray-700">
                  <ArrowUpDown className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="match">Best Match</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="date">Departure Date</SelectItem>
                  <SelectItem value="distance">Distance</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilters({ origin: '', destination: '', minCapacity: '', maxPrice: '', vehicle_type: '' });
                  setSearchTerm('');
                }}
                className="border-gray-200 dark:border-gray-700"
              >
                Clear
              </Button>
              <Button 
                id="browse-trips-filters-btn"
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className={`${hasActiveFilters ? 'border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950' : 'border-gray-200 dark:border-gray-700'}`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters {hasActiveFilters ? 'Applied' : ''}
              </Button>
            </div>
          </div>

          {/* Filter inputs collapsible */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Origin</Label>
                <Input
                  placeholder="e.g. Mumbai"
                  value={filters.origin}
                  onChange={(e) => setFilters({ ...filters, origin: e.target.value })}
                  className="border-orange-100 dark:border-orange-800"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Destination</Label>
                <Input
                  placeholder="e.g. Delhi"
                  value={filters.destination}
                  onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
                  className="border-orange-100 dark:border-orange-800"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Min Capacity</Label>
                <Input
                  type="number"
                  placeholder="e.g. 5"
                  value={filters.minCapacity}
                  onChange={(e) => setFilters({ ...filters, minCapacity: e.target.value })}
                  className="border-orange-100 dark:border-orange-800"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Max Price</Label>
                <Input
                  type="number"
                  placeholder="e.g. 2000"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="border-orange-100 dark:border-orange-800"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Vehicle Type</Label>
                <VehicleSelect
                  value={filters.vehicle_type}
                  onChange={(vehicle_type) => setFilters({ ...filters, vehicle_type })}
                  placeholder="Select Vehicle"
                  className="border-orange-100 dark:border-orange-800"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div id="browse-trips-results" className="grid gap-4">
        {filteredTrips.length === 0 ? (
          <EmptyState
            accent="blue"
            icon={<Search className="h-8 w-8 sm:h-10 sm:w-10" />}
            title="No trucks found"
            description="Try adjusting your search or filters, or post your load and let truckers come to you."
            primaryAction={{
              label: 'Clear All Filters',
              onClick: () => setFilters({ origin: '', destination: '', minCapacity: '', maxPrice: '', vehicle_type: '' }),
            }}
            secondaryAction={{ label: 'Post Your Load', to: '/shipper/post-shipment' }}
          />
        ) : viewMode === 'map' ? (
          /* Map View — side-by-side on desktop, stacked on mobile */
          <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100dvh-280px)] lg:min-h-[400px]">
            {/* Map */}
            <div className="h-[45vh] lg:h-auto lg:flex-1 lg:min-h-0">
              <LoadSaathiMap
                trucks={mapTrucks}
                height="100%"
                showClusters
                onTruckClick={(truck) => {
                  const trip = filteredTrips.find((t) => t.trucker_id === truck.driver_id);
                  if (trip) navigate(`/trips/${trip.id}`);
                }}
              />
            </div>
            {/* Trip List */}
            <div className="w-full max-h-[45vh] lg:max-h-none lg:w-80 overflow-y-auto overflow-x-hidden space-y-2">
              {filteredTrips.map((trip) => (
                <Card
                  key={trip.id}
                  className="border-orange-100 dark:border-orange-800 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/trips/${trip.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="flex items-center text-xs font-bold text-gray-900 dark:text-white truncate">
                            <MapPin className="h-3 w-3 text-orange-500 mr-0.5 shrink-0" />
                            {trip.origin_city}
                            <ArrowRight className="h-2.5 w-2.5 mx-0.5 text-gray-300 shrink-0" />
                            {trip.destination_city}
                          </div>
                          {trip._matchScore > 0 && (() => {
                            const { label, color } = getMatchLabel(trip._matchScore);
                            return <Badge className={`${color} text-[8px] font-bold shrink-0`}>{label}</Badge>;
                          })()}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          <span>{trip.vehicle_type || 'Truck'}</span>
                          <span>{trip.available_capacity_tonnes}T</span>
                          <span className="font-bold text-green-600">₹{trip.price_per_tonne.toLocaleString()}/T</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="ml-1 bg-orange-500 hover:bg-orange-600 text-white h-7 px-2"
                        onClick={(e) => { e.stopPropagation(); navigate(`/trips/${trip.id}`); }}
                      >
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTrips.map((trip, i) => (
              <Card 
                key={trip.id} 
                className="border-orange-100 dark:border-orange-800 hover:shadow-md transition-all duration-300 cursor-pointer hover:-translate-y-0.5 animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => navigate(`/trips/${trip.id}`)}
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <div className="flex items-center text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                          <MapPin className="h-5 w-5 text-orange-500 mr-1.5 shrink-0" />
                          {trip.origin_city}
                          <ArrowRight className="h-4 w-4 mx-2 text-gray-300 dark:text-gray-600" />
                          {trip.destination_city}
                        </div>
                        <Badge 
                          variant={trip.status === 'active' ? 'default' : 'secondary'}
                          className="text-[10px] font-bold uppercase tracking-wider"
                        >
                          {trip.status}
                        </Badge>
                        {trip._matchScore > 0 && (() => {
                          const { label, color } = getMatchLabel(trip._matchScore);
                          return <Badge className={`${color} text-[10px] font-bold`}>{label}</Badge>;
                        })()}
                        {aiScores[trip.id] && (() => {
                          const ai = getAIMatchBadge(aiScores[trip.id]!);
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge className={`${ai.color} text-[10px] font-bold cursor-help`}>
                                    <Sparkles className="h-3 w-3 mr-0.5 inline" />
                                    {ai.label}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs max-w-[200px]">
                                  {aiScores[trip.id]!.reasoning}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })()}
                        {aiLoadingId === trip.id && (
                          <Loader2 className="h-3 w-3 animate-spin text-purple-500" />
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4 mr-2 text-orange-500 shrink-0" />
                          <span className="truncate">{new Date(trip.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <PackageIcon className="h-4 w-4 mr-2 text-purple-500 shrink-0" />
                          <span>{trip.available_capacity_tonnes}t available</span>
                        </div>
                        <div className="flex items-center font-bold text-gray-900 dark:text-white">
                          <IndianRupee className="h-4 w-4 mr-1 text-green-500 shrink-0" />
                          ₹{trip.price_per_tonne.toLocaleString()} /t
                        </div>
                        {trip.estimated_distance_km && (
                          <div className="flex items-center text-gray-500 dark:text-gray-400">
                            <MapPin className="h-4 w-4 mr-2 text-blue-500 shrink-0" />
                            <span>{trip.estimated_distance_km.toLocaleString()} km</span>
                          </div>
                        )}
                        {trip.estimated_duration_min && !trip.estimated_distance_km && (
                          <div className="flex items-center text-gray-500 dark:text-gray-400">
                            <Clock className="h-4 w-4 mr-2 text-blue-500 shrink-0" />
                            <span>{formatDuration(trip.estimated_duration_min)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <div className="bg-orange-100 dark:bg-orange-900/30 w-7 h-7 rounded-full flex items-center justify-center mr-2">
                          <Truck className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {trip.trucker?.full_name || 'Verified Trucker'}
                        </span>
                        <VerificationBadge isVerified={trip.trucker?.is_verified} />
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                          {trip.trucker?.rating ? `⭐ ${trip.trucker.rating.toFixed(1)}` : 'New'}
                        </span>
                      </div>
                    </div>

                    <div className="md:w-44 flex flex-row md:flex-col gap-2 items-center">
                      <FavoriteButton entityType="trip" entityId={trip.id} userId={userProfile!.id} className="md:mb-1" />
                      <Button
                        className="flex-1 md:w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/trips/${trip.id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripList;
