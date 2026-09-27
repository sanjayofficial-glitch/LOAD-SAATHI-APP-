import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabase } from "@/hooks/useSupabase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tripSchema, type TripFormValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Truck, Calendar, IndianRupee, WifiOff } from "lucide-react";
import LocationSelector from "@/components/LocationSelector";
import VoiceLocationInput from "@/components/VoiceLocationInput";
import { geocodeCity } from "@/utils/geocode";
import { safeJsonParse } from "@/lib/utils";
import { getRoute } from "@/utils/osrm";
import ReturnLoadProbability from "@/components/ReturnLoadProbability";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { showSuccess, showError } from "@/utils/toast";
import { PricePredictor } from "@/components/PricePredictor";
import TemplateSelector from "@/components/TemplateSelector";
import SaveAsTemplate from "@/components/SaveAsTemplate";
import VehicleSelect from "@/components/VehicleSelect";
import { posthog } from "@/utils/posthog";
import { trackEvent } from "@/utils/analytics";

type LocationData = Record<string, Record<string, string[]>>;

const PostTrip = () => {
  const { userProfile } = useAuth();
  const { getAuthenticatedClient } = useSupabase();
  const { isOnline } = useNetworkStatus();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'quick' | 'full'>('quick');
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  useEffect(() => {
    import('@/data/locations.json').then(mod => setLocationData(mod.default.data));
  }, []);



  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      origin_city: '',
      origin_state: '',
      destination_city: '',
      destination_state: '',
      departure_date: '',
      available_capacity_tonnes: '',
      price_per_tonne: '',
      vehicle_type: '',
      vehicle_number: '',
    },
    mode: 'onBlur',
  });
  const formData = form.watch();

  const handleLocationChange = (field: 'origin' | 'destination', value: { state: string; district: string; city: string }) => {
    form.setValue(`${field}_city`, value.city);
    form.setValue(`${field}_state`, value.state);
  };

  const destInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const advanceToDest = () => destInputRef.current?.focus();
  const advanceToDate = () => dateInputRef.current?.focus();

  const handleSubmit = form.handleSubmit(async () => {
    if (!userProfile?.id) {
      showError('You must be logged in to post a trip.');
      return;
    }

    if (!isOnline) {
      showError('You are offline. Please check your internet connection and try again.');
      return;
    }

    const capacity = parseFloat(formData.available_capacity_tonnes);
    const price = parseFloat(formData.price_per_tonne);

    setLoading(true);
    try {
      const client = await getAuthenticatedClient();
      const { data, error } = await client.rpc('insert_trip', {
        p_trucker_id: userProfile.id,
        p_origin_city: formData.origin_city.trim(),
        p_origin_state: formData.origin_state,
        p_destination_city: formData.destination_city.trim(),
        p_destination_state: formData.destination_state,
        p_departure_date: formData.departure_date,
        p_available_capacity_tonnes: capacity,
        p_price_per_tonne: price,
        p_vehicle_type: formData.vehicle_type,
        p_vehicle_number: (formData.vehicle_number || '').trim() || 'TBA',
      });

      if (error) throw error;
      const tripData = safeJsonParse<{ id: string; error?: string }>(data);
      if (!tripData) { showError('Unable to create trip'); return; }
      if (tripData?.error) throw new Error(tripData.error);

      // Save price history — fire-and-forget, non-blocking
      if (tripData?.id) {
        client.rpc('insert_price_history', {
          p_origin_city: formData.origin_city.trim(),
          p_destination_city: formData.destination_city.trim(),
          p_origin_state: formData.origin_state || null,
          p_destination_state: formData.destination_state || null,
          p_weight_tonnes: capacity,
          p_price_per_tonne: price,
          p_vehicle_type: formData.vehicle_type || null,
          p_user_id: userProfile.id,
          p_user_type: 'trucker',
        }).then(() => {}, () => {});

        try {
          const [originCoords, destCoords] = await Promise.all([
            geocodeCity(formData.origin_city),
            geocodeCity(formData.destination_city)
          ]);
          if (originCoords && destCoords) {
            const route = await getRoute(
              originCoords.lon, originCoords.lat,
              destCoords.lon, destCoords.lat
            );
            await client.rpc('update_trip_coords', {
              p_trip_id: tripData.id,
              p_origin_lat: originCoords.lat,
              p_origin_lng: originCoords.lon,
              p_dest_lat: destCoords.lat,
              p_dest_lng: destCoords.lon,
              p_estimated_distance_km: route?.distance_km ?? null,
              p_estimated_duration_min: route?.duration_min ?? null,
            });
          }
        } catch {
          // Silently ignore — coordinates are optional enhancement
        }
      }

      trackEvent('trip_posted', {
        trip_id: tripData.id,
        origin_state: formData.origin_state,
        destination_state: formData.destination_state,
        capacity_tonnes: capacity,
        price_per_tonne: price,
        vehicle_type: formData.vehicle_type,
      });
      showSuccess('Trip posted successfully!');
      navigate('/trucker/my-trips');
    } catch (err) {
      console.error('[PostTrip] Error:', err);
      posthog.captureException(err, { flow: 'post_trip' });
      showError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      {!isOnline && (
        <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>You are offline. You cannot post trips until reconnected.</span>
        </div>
      )}

      <div className="mb-5 inline-flex rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-1">
        <button
          type="button"
          onClick={() => setMode('quick')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            mode === 'quick'
              ? 'bg-white dark:bg-gray-800 shadow-sm text-orange-700 dark:text-orange-300'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Quick Post
        </button>
        <button
          type="button"
          onClick={() => setMode('full')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            mode === 'full'
              ? 'bg-white dark:bg-gray-800 shadow-sm text-orange-700 dark:text-orange-300'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Full Details
        </button>
      </div>
      {mode === 'quick' && (
        <p className="-mt-3 mb-4 text-sm text-gray-500 dark:text-gray-400">
          Only the essentials needed — you can add vehicle number and more later.
        </p>
      )}

      <Card className="border-orange-100 dark:border-orange-800 shadow-lg">
        <CardHeader id="post-trip-header" className="bg-orange-50/50 dark:bg-orange-950/30 border-b border-orange-100 dark:border-orange-800 px-4 sm:px-6">
          <CardTitle className="flex items-center text-orange-900 dark:text-orange-100 text-lg sm:text-xl">
            <Truck className="mr-2 text-orange-600 dark:text-orange-400 h-5 w-5 sm:h-6 sm:w-6" /> Post a New Trip
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {userProfile?.id && (
              <TemplateSelector
                userId={userProfile.id}
                type="trip"
                onSelect={(data) => {
                  form.setValue('origin_city', (data.origin_city as string) || formData.origin_city);
                  form.setValue('origin_state', (data.origin_state as string) || formData.origin_state);
                  form.setValue('destination_city', (data.destination_city as string) || formData.destination_city);
                  form.setValue('destination_state', (data.destination_state as string) || formData.destination_state);
                  form.setValue('departure_date', (data.departure_date as string) || formData.departure_date);
                  form.setValue('available_capacity_tonnes', (data.available_capacity_tonnes as string) || formData.available_capacity_tonnes);
                  form.setValue('price_per_tonne', (data.price_per_tonne as string) || formData.price_per_tonne);
                  form.setValue('vehicle_type', (data.vehicle_type as string) || formData.vehicle_type);
                  form.setValue('vehicle_number', (data.vehicle_number as string) || formData.vehicle_number);
                }}
              />
            )}
            <div id="post-trip-origin" className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-200 font-medium">Origin Location</Label>
              {mode === 'quick' && locationData ? (
                <VoiceLocationInput
                  label="From"
                  data={locationData}
                   value={{ state: formData.origin_state || '', district: '', city: formData.origin_city }}
                  onChange={(value) => handleLocationChange('origin', value)}
                  onSelect={advanceToDest}
                />
              ) : (
                <LocationSelector
                  label="Origin"
                  data={locationData || {}}
                  onChange={(value) => handleLocationChange('origin', value)}
                />
              )}
            </div>

            <div id="post-trip-destination" className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-200 font-medium">Destination Location</Label>
              {mode === 'quick' && locationData ? (
                <VoiceLocationInput
                  label="To"
                  data={locationData}
                   value={{ state: formData.destination_state || '', district: '', city: formData.destination_city }}
                  onChange={(value) => handleLocationChange('destination', value)}
                  onSelect={advanceToDate}
                />
              ) : (
                <LocationSelector
                  label="Destination"
                  data={locationData || {}}
                  onChange={(value) => handleLocationChange('destination', value)}
                />
              )}
            </div>

              {(formData.origin_city || formData.destination_city) && (
                <ReturnLoadProbability origin={formData.origin_city} destination={formData.destination_city} />
              )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="date">Departure Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="date"
                    ref={dateInputRef}
                    type="date"
                    className="pl-10"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.departure_date}
                    onChange={(e) => form.setValue('departure_date', e.target.value)}
                    aria-invalid={!!form.formState.errors.departure_date}
                    required
                  />
                </div>
                {form.formState.errors.departure_date && (
                  <p className="text-sm text-destructive">{form.formState.errors.departure_date.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Available Capacity (Tonnes)</Label>
                <Input
                  id="capacity"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 5.0"
                  value={formData.available_capacity_tonnes}
                  onChange={(e) => form.setValue('available_capacity_tonnes', e.target.value)}
                  aria-invalid={!!form.formState.errors.available_capacity_tonnes}
                  required
                />
                {form.formState.errors.available_capacity_tonnes && (
                  <p className="text-sm text-destructive">{form.formState.errors.available_capacity_tonnes.message}</p>
                )}
              </div>
            </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price per Tonne (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="price"
                    type="number"
                    placeholder="e.g. 1500"
                    className="pl-10"
                    value={formData.price_per_tonne}
                    onChange={(e) => form.setValue('price_per_tonne', e.target.value)}
                    aria-invalid={!!form.formState.errors.price_per_tonne}
                    required
                  />
                </div>
                {form.formState.errors.price_per_tonne && (
                  <p className="text-sm text-destructive">{form.formState.errors.price_per_tonne.message}</p>
                )}
                <PricePredictor
                  originCity={formData.origin_city}
                  destinationCity={formData.destination_city}
                  originState={formData.origin_state}
                  destinationState={formData.destination_state}
                  weightTonnes={parseFloat(formData.available_capacity_tonnes) || 0}
                  vehicleType={formData.vehicle_type}
                  onApplyPrice={(price) => form.setValue('price_per_tonne', String(price))}
                />
                {formData.available_capacity_tonnes && formData.price_per_tonne && (
                  <div className="mt-2 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Estimated total: <span className="font-bold">₹{((parseFloat(formData.available_capacity_tonnes) || 0) * (parseFloat(formData.price_per_tonne) || 0)).toLocaleString('en-IN')}</span>
                    </p>
                  </div>
                )}
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="vehicleType">
                  Vehicle Type <span className="text-red-500">*</span>
                </Label>
                <VehicleSelect
                  id="vehicleType"
                  value={formData.vehicle_type}
                  onChange={(vehicle_type) => form.setValue('vehicle_type', vehicle_type)}
                  placeholder="Select Vehicle"
                />
                {form.formState.errors.vehicle_type && (
                  <p className="text-sm text-destructive">{form.formState.errors.vehicle_type.message}</p>
                )}
              </div>
              {mode === 'full' && (
                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                  <Input
                    id="vehicleNumber"
                    placeholder="e.g. RJ 14 GB 1234"
                    value={formData.vehicle_number}
                    onChange={(e) => form.setValue('vehicle_number', e.target.value)}
                    aria-invalid={!!form.formState.errors.vehicle_number}
                  />
                  {form.formState.errors.vehicle_number && (
                    <p className="text-sm text-destructive">{form.formState.errors.vehicle_number.message}</p>
                  )}
                </div>
              )}
            </div>

            {!isOnline && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
                <WifiOff className="h-4 w-4 shrink-0" />
                <span>Posting trips is unavailable while offline.</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              {userProfile?.id && (
                <SaveAsTemplate
                  userId={userProfile.id}
                  type="trip"
                  data={formData}
                  disabled={loading || form.formState.isSubmitting}
                />
              )}
              <Button
                id="post-trip-submit"
                type="submit"
                className="flex-1 bg-orange-600 hover:bg-orange-700 h-12 text-base sm:text-lg font-bold"
                disabled={loading || !isOnline || form.formState.isSubmitting}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : !isOnline ? (
                  <><WifiOff className="mr-2 h-5 w-5" /> Offline</>
                ) : (
                  'Post Trip'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostTrip;