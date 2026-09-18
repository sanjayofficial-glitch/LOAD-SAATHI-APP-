import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Search,
  Calendar,
  ArrowRight,
  IndianRupee,
  Filter,
  Package,
  AlertCircle,
  Clock,
  Sparkles,
  Loader2,
  ArrowUpDown,
  Map as MapIcon,
  List as ListIcon,
  MapPin,
  ChevronLeft,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import VerificationBadge from '@/components/VerificationBadge';
import FavoriteButton from '@/components/FavoriteButton';
import { calculateMatchScore, getMatchLabel, getAIMatchBadge } from '@/utils/matching';
import { useSmartMatch } from '@/hooks/useSmartMatch';
import { useLiveLoadLocations } from '@/hooks/useLiveLoadLocations';
import { LoadSaathiMap } from '@/components/maps';
import { formatDuration } from '@/utils/format';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import LoadCardStack from '@/components/LoadCardStack';
import FloatingWhatsAppButton from '@/components/FloatingWhatsAppButton';
import type { Shipment } from '@/types';

const BrowseShipments = () => {
  const { userProfile, getSupabaseToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewModeParam = searchParams.get('view') as 'list' | 'map' | 'card' | null;

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'card'>(viewModeParam === 'card' ? 'card' : viewModeParam === 'map' ? 'map' : 'list');
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    minWeight: '',
    maxBudget: '',
  });
  const [sortBy, setSortBy] = useState<'match' | 'budget_asc' | 'budget_desc' | 'date' | 'distance'>('match');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch current trucker's active trip for match scoring
  const { data: myTrip } = useQuery({
    queryKey: ['myTrip', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id || userProfile.user_type !== 'trucker') return null;
      const token = await getSupabaseToken();
      if (!token) return null;
      const supabase = createClerkSupabaseClient(token);
      const { data } = await supabase
        .from('trips')
        .select('id, origin_city, destination_city, available_capacity_tonnes, origin_state, destination_state, origin_lat, origin_lng, destination_lat, destination_lng, departure_date')
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

  // Fetch open shipments
  const { data: shipments = [], isLoading, error, refetch } = useQuery({
    queryKey: ['openShipments', filters.origin, filters.destination, filters.minWeight, filters.maxBudget],
    queryFn: async () => {
      const token = await getSupabaseToken();
      if (!token) throw new Error('Authentication required');
      const supabase = createClerkSupabaseClient(token);

      let query = supabase
        .from('shipments')
        .select(`
          id, origin_city, destination_city, origin_state, destination_state, origin_lat, origin_lng, destination_lat, destination_lng, weight_tonnes, budget_per_tonne, departure_date, goods_description, pickup_address, delivery_address, created_at, shipper_id, status, estimated_distance_km, estimated_duration_min,
          shipper:users!shipments_shipper_id_fkey(
            full_name, rating, total_trips, is_verified
          )
        `)
        .eq('status', 'pending')
        .order('departure_date', { ascending: true })
        .limit(50);

      if (filters.origin) {
        query = query.ilike('origin_city', `%${filters.origin}%`);
      }
      if (filters.destination) {
        query = query.ilike('destination_city', `%${filters.destination}%`);
      }
      if (filters.minWeight) {
        query = query.gte('weight_tonnes', parseFloat(filters.minWeight));
      }
      if (filters.maxBudget) {
        query = query.lte('budget_per_tonne', parseFloat(filters.maxBudget));
      }

      const { data, error } = await query;
      if (error) throw error;
      const mapped = (data || []).map((s: Record<string, unknown>) => ({
        ...s,
        shipper: Array.isArray(s.shipper) ? (s.shipper as Record<string, unknown>[])[0] : s.shipper,
      }));
      return mapped as Shipment[];
    },
    enabled: !!userProfile?.id,
    staleTime: 15_000,
  });

  const filteredShipments = useMemo(() => {
    return shipments
      .filter((s) => {
        if (!searchTerm) return true;
        const t = searchTerm.toLowerCase();
        return (
          s.origin_city.toLowerCase().includes(t) ||
          s.destination_city.toLowerCase().includes(t) ||
          (s.goods_description || '').toLowerCase().includes(t) ||
          (s.shipper?.full_name || '').toLowerCase().includes(t)
        );
      })
      .map((s) => ({
        ...s,
        _matchScore: myTrip ? calculateMatchScore({
          shipmentOriginCity: s.origin_city,
          shipmentDestCity: s.destination_city,
          tripOriginCity: myTrip.origin_city,
          tripDestCity: myTrip.destination_city,
          shipmentWeightTonnes: s.weight_tonnes,
          tripCapacityTonnes: myTrip.available_capacity_tonnes,
          shipmentOriginState: s.origin_state,
          shipmentDestState: s.destination_state,
          tripOriginState: myTrip.origin_state,
          tripDestState: myTrip.destination_state,
          shipmentOriginLat: s.origin_lat,
          shipmentOriginLng: s.origin_lng,
          tripOriginLat: myTrip.origin_lat,
          tripOriginLng: myTrip.origin_lng,
          shipmentDestLat: s.destination_lat,
          shipmentDestLng: s.destination_lng,
          tripDestLat: myTrip.destination_lat,
          tripDestLng: myTrip.destination_lng,
          shipmentBudgetPerTonne: s.budget_per_tonne,
          tripDate: myTrip.departure_date,
          shipmentDate: s.departure_date,
          truckerRating: undefined,
        }) : 0,
      }))
      .sort((a, b) => {
        switch (sortBy) {
          case 'budget_asc': return a.budget_per_tonne - b.budget_per_tonne;
          case 'budget_desc': return b.budget_per_tonne - a.budget_per_tonne;
          case 'date': return new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime();
          case 'distance': return (a.estimated_distance_km || 0) - (b.estimated_distance_km || 0);
          default: return b._matchScore - a._matchScore;
        }
      });
  }, [shipments, searchTerm, myTrip, sortBy]);

  const { scores: aiScores, loadingId: aiLoadingId } = useSmartMatch(
    filteredShipments,
    (s) => myTrip ? {
      shipmentOriginCity: s.origin_city,
      shipmentDestCity: s.destination_city,
      tripOriginCity: myTrip.origin_city,
      tripDestCity: myTrip.destination_city,
      shipmentWeightTonnes: s.weight_tonnes,
      tripCapacityTonnes: myTrip.available_capacity_tonnes,
      shipmentOriginState: s.origin_state,
      shipmentDestState: s.destination_state,
      tripOriginState: myTrip.origin_state,
      tripDestState: myTrip.destination_state,
      shipmentOriginLat: s.origin_lat,
      shipmentOriginLng: s.origin_lng,
      tripOriginLat: myTrip.origin_lat,
      tripOriginLng: myTrip.origin_lng,
      shipmentDestLat: s.destination_lat,
      shipmentDestLng: s.destination_lng,
      tripDestLat: myTrip.destination_lat,
      tripDestLng: myTrip.destination_lng,
      shipmentBudgetPerTonne: s.budget_per_tonne,
      shipmentDate: s.departure_date,
      tripDate: myTrip.departure_date,
    } : null,
    10,
  );

  const { loads: liveLoads } = useLiveLoadLocations();

  const handleAcceptLoad = async (shipment: Shipment) => {
    navigate(`/trucker/shipments/${shipment.id}`);
  };

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-orange-600 dark:text-orange-400" />
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Please log in to browse shipments</p>
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    return (
      <div className="py-8">
        <ErrorState
          title="Failed to load shipments"
          description="We couldn't fetch open shipments right now. Check your connection and try again."
          retry={() => refetch()}
        />
        <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500 break-words max-w-md mx-auto">
          Details: {errorMessage}
        </p>
      </div>
    );
  }

  const hasActiveFilters = filters.origin || filters.destination || filters.minWeight || filters.maxBudget;

  if (viewMode === 'card') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/trucker/my-trips')} className="shrink-0">
            <ChevronLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">Find Loads</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Swipe through available loads — one tap to accept.</p>
          </div>
        </div>
        <LoadCardStack
          shipments={filteredShipments}
          onAccept={handleAcceptLoad}
          onViewDetails={(s) => navigate(`/trucker/shipments/${s.id}`)}
        />
        {filteredShipments.length > 0 && (() => {
          const first = filteredShipments[0]!;
          return (
            <FloatingWhatsAppButton
              type="shipment"
              id={first.id}
              originCity={first.origin_city}
              destinationCity={first.destination_city}
              weight={first.weight_tonnes}
            />
          );
        })()}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div id="browse-shipments-header" className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Browse Shipments</div>
      <p className="text-sm text-gray-500 dark:text-gray-400">Find loads posted by shippers that match your route and capacity.</p>
      <Card className="border-orange-100 dark:border-orange-800 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-orange-500 to-orange-400" />
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-4">
             <div id="browse-shipments-search" className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search by city, goods, or shipper..."
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
                  aria-label="List view"
                >
                  <ListIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-2 py-1 text-xs ${viewMode === 'map' ? 'bg-orange-500 text-white' : 'bg-background text-muted-foreground'}`}
                  aria-label="Map view"
                >
                  <MapIcon className="h-3.5 w-3.5" />
                </button>
              </div>
              <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
                <SelectTrigger className="flex-1 min-w-[140px] sm:flex-none sm:w-[160px] border-gray-200 dark:border-gray-700">
                  <ArrowUpDown className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="match">Best Match</SelectItem>
                  <SelectItem value="budget_asc">Budget: Low to High</SelectItem>
                  <SelectItem value="budget_desc">Budget: High to Low</SelectItem>
                  <SelectItem value="date">Pickup Date</SelectItem>
                  <SelectItem value="distance">Distance</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({ origin: '', destination: '', minWeight: '', maxBudget: '' });
                  setSearchTerm('');
                }}
                className="border-gray-200 dark:border-gray-700"
              >
                Clear
              </Button>
              <Button
                id="browse-shipments-filters-btn"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`${hasActiveFilters ? 'border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950' : 'border-gray-200 dark:border-gray-700'}`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters {hasActiveFilters ? 'Applied' : ''}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
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
                <Label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Min Weight (T)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 5"
                  value={filters.minWeight}
                  onChange={(e) => setFilters({ ...filters, minWeight: e.target.value })}
                  className="border-orange-100 dark:border-orange-800"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Max Budget (₹/T)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 2000"
                  value={filters.maxBudget}
                  onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })}
                  className="border-orange-100 dark:border-orange-800"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredShipments.length === 0 ? (
          <EmptyState
            accent="orange"
            icon={<Package className="h-8 w-8 sm:h-10 sm:w-10" />}
            title="No shipments found"
            description="Try adjusting your search or filters, or post a trip and let shippers come to you."
            primaryAction={{
              label: 'Clear All Filters',
              onClick: () => {
                setFilters({ origin: '', destination: '', minWeight: '', maxBudget: '' });
                setSearchTerm('');
              },
            }}
            secondaryAction={{ label: 'Post a Trip', to: '/trucker/post-trip' }}
          />
        ) : viewMode === 'map' ? (
          <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100dvh-280px)] lg:min-h-[400px]">
            <div className="h-[45vh] lg:h-auto lg:flex-1 lg:min-h-0">
              <LoadSaathiMap
                loads={liveLoads}
                height="100%"
                showClusters
                onLoadClick={(load) => navigate(`/trucker/shipments/${load.shipment_id || load.id}`)}
              />
            </div>
            <div className="w-full max-h-[45vh] lg:max-h-none lg:w-80 overflow-y-auto overflow-x-hidden space-y-2">
              {filteredShipments.map((s) => (
                <Card
                  key={s.id}
                  className="border-orange-100 dark:border-orange-800 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/trucker/shipments/${s.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="flex items-center text-xs font-bold text-gray-900 dark:text-white truncate">
                            <MapPin className="h-3 w-3 text-orange-500 mr-0.5 shrink-0" />
                            {s.origin_city}
                            <ArrowRight className="h-2.5 w-2.5 mx-0.5 text-gray-300 shrink-0" />
                            {s.destination_city}
                          </div>
                          {s._matchScore > 0 && (() => {
                            const { label, color } = getMatchLabel(s._matchScore);
                            return <Badge className={`${color} text-[8px] font-bold shrink-0`}>{label}</Badge>;
                          })()}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          <span>{s.weight_tonnes}T</span>
                          <span className="font-bold text-green-600">₹{s.budget_per_tonne.toLocaleString()}/T</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="ml-1 bg-orange-500 hover:bg-orange-600 text-white h-7 px-2"
                        onClick={(e) => { e.stopPropagation(); navigate(`/trucker/shipments/${s.id}`); }}
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
      <div id="browse-shipments-results" className="grid gap-4">
            {filteredShipments.map((s, i) => (
              <Card
                key={s.id}
                className="border-orange-100 dark:border-orange-800 hover:shadow-md transition-all duration-300 cursor-pointer hover:-translate-y-0.5 animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => navigate(`/trucker/shipments/${s.id}`)}
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <div className="flex items-center text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                          <MapPin className="h-5 w-5 text-orange-500 mr-1.5 shrink-0" />
                          {s.origin_city}
                          <ArrowRight className="h-4 w-4 mx-2 text-gray-300 dark:text-gray-600" />
                          {s.destination_city}
                        </div>
                        {s._matchScore > 0 && (() => {
                          const { label, color } = getMatchLabel(s._matchScore);
                          return <Badge className={`${color} text-[10px] font-bold`}>{label}</Badge>;
                        })()}
                        {aiScores[s.id] && (() => {
                          const ai = getAIMatchBadge(aiScores[s.id]!);
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
                                  {aiScores[s.id]!.reasoning}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })()}
                        {aiLoadingId === s.id && (
                          <Loader2 className="h-3 w-3 animate-spin text-purple-500" />
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4 mr-2 text-orange-500 shrink-0" />
                          <span className="truncate">{new Date(s.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Package className="h-4 w-4 mr-2 text-purple-500 shrink-0" />
                          <span>{s.weight_tonnes}T</span>
                        </div>
                        <div className="flex items-center font-bold text-gray-900 dark:text-white">
                          <IndianRupee className="h-4 w-4 mr-1 text-green-500 shrink-0" />
                          ₹{s.budget_per_tonne.toLocaleString()} /T
                        </div>
                        {s.estimated_distance_km && (
                          <div className="flex items-center text-gray-500 dark:text-gray-400">
                            <MapPin className="h-4 w-4 mr-2 text-blue-500 shrink-0" />
                            <span>{s.estimated_distance_km.toLocaleString()} km</span>
                          </div>
                        )}
                        {s.estimated_duration_min && !s.estimated_distance_km && (
                          <div className="flex items-center text-gray-500 dark:text-gray-400">
                            <Clock className="h-4 w-4 mr-2 text-blue-500 shrink-0" />
                            <span>{formatDuration(s.estimated_duration_min)}</span>
                          </div>
                        )}
                      </div>

                      {s.goods_description && (
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {s.goods_description}
                        </p>
                      )}

                      <div className="flex items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <div className="bg-orange-100 dark:bg-orange-900/30 w-7 h-7 rounded-full flex items-center justify-center mr-2">
                          <Package className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {s.shipper?.full_name || 'Verified Shipper'}
                        </span>
                        <VerificationBadge isVerified={s.shipper?.is_verified} />
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                          {s.shipper?.rating ? `⭐ ${s.shipper.rating.toFixed(1)}` : 'New'}
                        </span>
                      </div>
                    </div>

                    <div className="md:w-44 flex flex-row md:flex-col gap-2 items-center">
                      <FavoriteButton entityType="shipment" entityId={s.id} userId={userProfile.id} className="md:mb-1" />
                      <Button
                        className="flex-1 md:w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/trucker/shipments/${s.id}`);
                        }}
                      >
                        Send Offer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      {filteredShipments.length > 0 && (() => {
        const first = filteredShipments[0]!;
        return (
          <FloatingWhatsAppButton
            type="shipment"
            id={first.id}
            originCity={first.origin_city}
            destinationCity={first.destination_city}
            weight={first.weight_tonnes}
          />
        );
      })()}
    </div>
  );
};

export default BrowseShipments;
