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
import { trackEvent } from "@/utils/analytics";
import { useDishaGuideRegistration } from "@/hooks/useDishaGuide";
import { useT } from "@/i18n/useT";
import { useDraft, clearDraft as wipeDraft } from "@/lib/offlineDraft";

type LocationData = Record<string, Record<string, string[]>>;

const PostTrip = () => {
  const { userProfile } = useAuth();
  const { getAuthenticatedClient } = useSupabase();
  const { isOnline } = useNetworkStatus();
  const t = useT();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'quick' | 'full'>('quick');
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  useEffect(() => {
    import('@/data/locations.json').then(mod => setLocationData(mod.default.data));
  }, []);

  const {
    registerElement,
    notifyFieldFocus,
    notifySuccess,
  } = useDishaGuideRegistration({ flowId: 'post-trip' });

  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const vehicleTypeRef = useRef<HTMLDivElement>(null);
  const capacityRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    registerElement('origin-city', originRef as React.RefObject<HTMLElement>);
    registerElement('dest-city', destRef as React.RefObject<HTMLElement>);
    registerElement('vehicle-type', vehicleTypeRef as React.RefObject<HTMLElement>);
    registerElement('capacity', capacityRef as React.RefObject<HTMLElement>);
    registerElement('price', priceRef as React.RefObject<HTMLElement>);
    registerElement('submit', submitRef as React.RefObject<HTMLElement>);
  }, [registerElement]);



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
  const [draft, setDraft] = useDraft<Partial<TripFormValues>>('post-trip');

  // Restore a saved draft after a refresh/accidental navigation.
  useEffect(() => {
    if (!draft) return;
    let touched = false;
    (Object.keys(draft) as (keyof TripFormValues)[]).forEach((key) => {
      const v = draft[key];
      if (v) {
        form.setValue(key, v as never);
        touched = true;
      }
    });
    if (touched) showSuccess(t('draft.restored'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced draft save — only when the user has actually typed something.
  useEffect(() => {
    const hasContent = Object.values(formData).some((v) => typeof v === 'string' && v.trim());
    if (hasContent) setDraft({ ...formData });
  }, [formData, setDraft]);

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
          p_dest_city: formData.destination_city.trim(),
          p_origin_state: formData.origin_state || null,
          p_dest_state: formData.destination_state || null,
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
              p_distance_km: route?.distance_km ?? null,
              p_duration_min: route?.duration_min ?? null,
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
      showSuccess(t('form.postTrip') + ' ✓');
      notifySuccess('submit');
      wipeDraft('post-trip');
      navigate('/trucker/my-trips');
    } catch (err) {
      console.error('[PostTrip] Error:', err);
      import("@/utils/posthog").then(({ posthog }) => posthog.captureException(err, { flow: 'post_trip' })).catch(() => {});
      showError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> {t('common.back')}
      </Button>

      {!isOnline && (
        <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>{t('form.offlineBanner')}</span>
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
          {t('form.quickPost')}
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
          {t('form.fullDetails')}
        </button>
      </div>
      {mode === 'quick' && (
        <p className="-mt-3 mb-4 text-sm text-gray-500 dark:text-gray-400">
          {t('form.quickHint')}
        </p>
      )}

      <Card data-avoid-disha className="border-orange-100 dark:border-orange-800 shadow-lg">
        <CardHeader id="post-trip-header" className="bg-orange-50/50 dark:bg-orange-950/30 border-b border-orange-100 dark:border-orange-800 px-4 sm:px-6">
          <CardTitle className="flex items-center text-orange-900 dark:text-orange-100 text-lg sm:text-xl">
            <Truck className="mr-2 text-orange-600 dark:text-orange-400 h-5 w-5 sm:h-6 sm:w-6" /> {t('form.postTripTitle')}
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
            <div id="post-trip-origin" ref={originRef} data-guide="origin-city" className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-200 font-medium">{t('form.origin')}</Label>
              {mode === 'quick' && locationData ? (
                <VoiceLocationInput
                  label={t('form.from')}
                  data={locationData}
                   value={{ state: formData.origin_state || '', district: '', city: formData.origin_city }}
                  onChange={(value) => handleLocationChange('origin', value)}
                  onSelect={advanceToDest}
                />
              ) : (
                <LocationSelector
                  label={t('form.origin')}
                  data={locationData || {}}
                  onChange={(value) => handleLocationChange('origin', value)}
                />
              )}
            </div>

            <div id="post-trip-destination" ref={destRef} data-guide="dest-city" className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-200 font-medium">{t('form.destination')}</Label>
              {mode === 'quick' && locationData ? (
                <VoiceLocationInput
                  label={t('form.to')}
                  data={locationData}
                   value={{ state: formData.destination_state || '', district: '', city: formData.destination_city }}
                  onChange={(value) => handleLocationChange('destination', value)}
                  onSelect={advanceToDate}
                />
              ) : (
                <LocationSelector
                  label={t('form.destination')}
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
                <Label htmlFor="date">{t('form.departureDate')}</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="date"
                    ref={dateInputRef}
                    data-guide="departure-date"
                    type="date"
                    className="pl-10 h-12"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.departure_date}
                    onChange={(e) => form.setValue('departure_date', e.target.value)}
                    onFocus={() => notifyFieldFocus('departure-date')}
                    aria-invalid={!!form.formState.errors.departure_date}
                    required
                  />
                </div>
                {form.formState.errors.departure_date && (
                  <p className="text-sm text-destructive">{form.formState.errors.departure_date.message}</p>
                )}
              </div>
               <div className="space-y-2" ref={capacityRef} data-guide="capacity">
                <Label htmlFor="capacity">{t('form.capacity')}</Label>
                <Input
                  id="capacity"
                  data-guide="capacity"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 5.0"
                  className="h-12"
                  value={formData.available_capacity_tonnes}
                  onChange={(e) => form.setValue('available_capacity_tonnes', e.target.value)}
                  onFocus={() => notifyFieldFocus('capacity')}
                  aria-invalid={!!form.formState.errors.available_capacity_tonnes}
                  required
                />
                {form.formState.errors.available_capacity_tonnes && (
                  <p className="text-sm text-destructive">{form.formState.errors.available_capacity_tonnes.message}</p>
                )}
              </div>
            </div>

              <div className="space-y-2" ref={priceRef} data-guide="price">
                <Label htmlFor="price">{t('form.pricePerTonne')}</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="price"
                    data-guide="price"
                    type="number"
                    placeholder="e.g. 1500"
                    className="pl-10 h-12"
                    value={formData.price_per_tonne}
                    onChange={(e) => form.setValue('price_per_tonne', e.target.value)}
                    onFocus={() => notifyFieldFocus('price')}
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
                      {t('form.estimatedTotal')} <span className="font-bold">₹{((parseFloat(formData.available_capacity_tonnes) || 0) * (parseFloat(formData.price_per_tonne) || 0)).toLocaleString('en-IN')}</span>
                    </p>
                  </div>
                )}
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
<div className="space-y-2" ref={vehicleTypeRef} data-guide="vehicle-type">
                <Label htmlFor="vehicleType">
                  {t('form.vehicleType')} <span className="text-red-500">*</span>
                </Label>
                <VehicleSelect
                  id="vehicleType"
                  value={formData.vehicle_type}
                  onChange={(vehicle_type) => form.setValue('vehicle_type', vehicle_type)}
                  placeholder="Select Vehicle"
                  onFocus={() => notifyFieldFocus('vehicle-type')}
                />
                {form.formState.errors.vehicle_type && (
                  <p className="text-sm text-destructive">{form.formState.errors.vehicle_type.message}</p>
                )}
              </div>
              {mode === 'full' && (
                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber">{t('form.vehicleNumber')}</Label>
                  <Input
                    id="vehicleNumber"
                    placeholder="e.g. RJ 14 GB 1234"
                    className="h-12"
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
                <span>{t('form.offlinePosting')}</span>
              </div>
            )}

            <div className="sticky bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] z-10 -mx-3 mt-8 flex items-center justify-between gap-3 rounded-2xl bg-white/95 px-3 py-2.5 shadow-lg shadow-black/5 ring-1 ring-gray-100 dark:bg-gray-900/95 dark:ring-gray-800 backdrop-blur-md md:static md:z-auto md:mx-0 md:mt-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none md:ring-0 md:backdrop-blur-none">
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
                ref={submitRef}
                data-guide="submit"
                type="submit"
                className="flex-1 bg-orange-600 hover:bg-orange-700 h-14 text-base sm:text-lg font-bold"
                disabled={loading || !isOnline || form.formState.isSubmitting}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : !isOnline ? (
                  <><WifiOff className="mr-2 h-5 w-5" /> {t('common.offline')}</>
                ) : (
                  t('form.postTrip')
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