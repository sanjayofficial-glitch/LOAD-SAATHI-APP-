import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabase } from "@/hooks/useSupabase";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { shipmentSchema, type ShipmentFormValues } from '@/lib/validations';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { showSuccess, showError } from "@/utils/toast";
import { Package, Calendar, IndianRupee, Loader2, ArrowLeft, WifiOff, Mic } from "lucide-react";
import LocationSelector from "@/components/LocationSelector";
import VoiceLocationInput from "@/components/VoiceLocationInput";
import { geocodeCity } from "@/utils/geocode";
import { safeJsonParse } from "@/lib/utils";
import { getRoute } from "@/utils/osrm";
import ReturnLoadProbability from "@/components/ReturnLoadProbability";
import { PricePredictor } from "@/components/PricePredictor";
import TemplateSelector from "@/components/TemplateSelector";
import SaveAsTemplate from "@/components/SaveAsTemplate";
import { trackEvent, EVENTS } from "@/utils/analytics";
import { useDishaGuideRegistration } from "@/hooks/useDishaGuide";
import { useT } from "@/i18n/useT";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useDraft, clearDraft as wipeDraft } from "@/lib/offlineDraft";

type LocationData = Record<string, Record<string, string[]>>;

const PostShipments = () => {
  const { userProfile } = useAuth();
  const { getAuthenticatedClient } = useSupabase();
  const { isOnline } = useNetworkStatus();
  const t = useT();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'quick' | 'full'>('quick');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const formStartedRef = useRef(false);

  useEffect(() => {
    import('@/data/locations.json').then(mod => setLocationData(mod.default.data));
  }, []);

  // Form start — fires once per page mount (a view of the form is not a lead).
  useEffect(() => {
    if (formStartedRef.current) return;
    formStartedRef.current = true;
    trackEvent(EVENTS.LOAD_FORM_START);
  }, []);

  const {
    registerElement,
    notifyFieldFocus,
    notifySuccess,
  } = useDishaGuideRegistration({ flowId: 'post-load' });

  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const weightRef = useRef<HTMLInputElement>(null);
  const budgetRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    registerElement('origin-city', originRef as React.RefObject<HTMLElement>);
    registerElement('dest-city', destRef as React.RefObject<HTMLElement>);
    registerElement('weight', weightRef as React.RefObject<HTMLElement>);
    registerElement('budget', budgetRef as React.RefObject<HTMLElement>);
    registerElement('date', dateRef as React.RefObject<HTMLElement>);
    registerElement('submit', submitRef as React.RefObject<HTMLElement>);
  }, [registerElement]);



  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      origin_city: '', origin_state: '', destination_city: '', destination_state: '',
      departure_date: '', goods_description: '', weight_tonnes: '', pickup_address: '',
      delivery_address: '', budget_per_tonne: '',
    },
    mode: 'onBlur',
  });
  const formData = form.watch();
  const { supported: speechSupported, isListening, start: startSpeech } = useSpeechToText();
  const [draft, setDraft] = useDraft<Partial<ShipmentFormValues>>('post-shipment');

  // Restore a saved draft after a refresh/accidental navigation.
  useEffect(() => {
    if (!draft) return;
    let touched = false;
    (Object.keys(draft) as (keyof ShipmentFormValues)[]).forEach((key) => {
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
      showError('You must be logged in to post a shipment.');
      return;
    }

    if (!isOnline) {
      showError('You are offline. Please check your internet connection and try again.');
      return;
    }

    const weight = parseFloat(formData.weight_tonnes);
    const budget = parseFloat(formData.budget_per_tonne);

    setLoading(true);
    try {
      const supabaseClient = await getAuthenticatedClient();
      const { data, error } = await supabaseClient.rpc('insert_shipment', {
        p_shipper_id: userProfile.id,
        p_origin_city: formData.origin_city.trim(),
        p_origin_state: formData.origin_state,
        p_destination_city: formData.destination_city.trim(),
        p_destination_state: formData.destination_state,
        p_departure_date: formData.departure_date,
        p_goods_description: formData.goods_description.trim() || 'Freight goods',
        p_weight_tonnes: weight,
        p_pickup_address: (formData.pickup_address || '').trim() || `${formData.origin_city.trim()}, ${formData.origin_state || 'India'}`,
        p_delivery_address: (formData.delivery_address || '').trim() || `${formData.destination_city.trim()}, ${formData.destination_state || 'India'}`,
        p_budget_per_tonne: budget,
      });

      if (error) throw error;
      const shipmentData = safeJsonParse<{ id: string; error?: string }>(data);
      if (!shipmentData) { showError('Unable to create shipment'); return; }
      if (shipmentData?.error) throw new Error(shipmentData.error);

      // Save price history — fire-and-forget, non-blocking
      if (shipmentData?.id) {
        supabaseClient.rpc('insert_price_history', {
          p_origin_city: formData.origin_city.trim(),
          p_dest_city: formData.destination_city.trim(),
          p_origin_state: formData.origin_state || null,
          p_dest_state: formData.destination_state || null,
          p_weight_tonnes: weight,
          p_price_per_tonne: budget,
          // A shipment has no vehicle, and this argument has no default, so
          // it must be sent explicitly even though the value is null.
          p_vehicle_type: null,
          p_user_id: userProfile.id,
          p_user_type: 'shipper',
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
            await supabaseClient.rpc('update_shipment_coords', {
              p_shipment_id: shipmentData.id,
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

      trackEvent('shipment_posted', {
        shipment_id: shipmentData.id,
        origin_state: formData.origin_state,
        destination_state: formData.destination_state,
        weight_tonnes: weight,
        budget_per_tonne: budget,
      });
      // Valid submission = an enquiry; qualification happens separately.
      trackEvent(EVENTS.LOAD_SUBMITTED, {
        shipment_id: shipmentData.id,
        weight_tonnes: weight,
      });
      showSuccess(t('form.postLoad') + ' ✓');
      notifySuccess('submit');
      wipeDraft('post-shipment');
      navigate('/shipper/dashboard');
    } catch (err: unknown) {
      import("@/utils/posthog").then(({ posthog }) => posthog.captureException(err, { flow: 'post_shipment' })).catch(() => {});
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
        <div className="mb-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
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
              ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-700 dark:text-blue-300'
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
              ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-700 dark:text-blue-300'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          {t('form.fullDetails')}
        </button>
      </div>
      {mode === 'quick' && (
        <p className="-mt-3 mb-4 text-sm text-gray-500 dark:text-gray-400">
          Only the essentials needed — pickup & delivery addresses will default to your cities and can be edited later.
        </p>
      )}

      <Card data-avoid-disha className="border-blue-100 dark:border-blue-800 shadow-lg">
<CardHeader id="post-shipment-header" className="bg-blue-50/50 dark:bg-blue-950/50 border-b border-blue-100 dark:border-blue-800 px-4 sm:px-6">
          <CardTitle className="flex items-center text-blue-900 dark:text-blue-100 text-lg sm:text-xl">
            <Package className="mr-2 text-blue-600 dark:text-blue-400 h-5 w-5 sm:h-6 sm:w-6" />
            {t('form.postLoadTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {userProfile?.id && (
              <TemplateSelector
                userId={userProfile.id}
                type="shipment"
                onSelect={(data) => {
                  if (data.origin_city) form.setValue('origin_city', data.origin_city as string);
                  if (data.origin_state) form.setValue('origin_state', data.origin_state as string);
                  if (data.destination_city) form.setValue('destination_city', data.destination_city as string);
                  if (data.destination_state) form.setValue('destination_state', data.destination_state as string);
                  if (data.departure_date) form.setValue('departure_date', data.departure_date as string);
                  if (data.goods_description) form.setValue('goods_description', data.goods_description as string);
                  if (data.weight_tonnes) form.setValue('weight_tonnes', data.weight_tonnes as string);
                  if (data.pickup_address) form.setValue('pickup_address', data.pickup_address as string);
                  if (data.delivery_address) form.setValue('delivery_address', data.delivery_address as string);
                  if (data.budget_per_tonne) form.setValue('budget_per_tonne', data.budget_per_tonne as string);
                }}
              />
            )}
  <div id="post-shipment-origin" ref={originRef} data-guide="origin-city" className="space-y-2">
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
              {form.formState.errors.origin_city?.message && <p className="text-sm text-destructive mt-1">{form.formState.errors.origin_city.message}</p>}
            </div>

            <div id="post-shipment-destination" ref={destRef} data-guide="dest-city" className="space-y-2">
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
              {form.formState.errors.destination_city?.message && <p className="text-sm text-destructive mt-1">{form.formState.errors.destination_city.message}</p>}
            </div>

              {(formData.origin_city || formData.destination_city) && (
                <ReturnLoadProbability origin={formData.origin_city} destination={formData.destination_city} />
              )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="date">{t('form.readyDate')}</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                   <Input
                     id="date"
                     ref={dateRef}
                     data-guide="date"
                     type="date"
                     className="pl-10 h-12"
                     min={new Date().toISOString().split('T')[0]}
                     value={formData.departure_date}
                     onChange={(e) => form.setValue('departure_date', e.target.value)}
                     onFocus={() => notifyFieldFocus('date')}
                     aria-invalid={!!form.formState.errors.departure_date}
                     required
                   />
                </div>
                {form.formState.errors.departure_date?.message && <p className="text-sm text-destructive mt-1">{form.formState.errors.departure_date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">{t('form.weight')}</Label>
 <Input
   id="weight"
   ref={weightRef}
   data-guide="weight"
   type="number"
                   step="0.1"
                   placeholder="e.g. 5.0"
                   value={formData.weight_tonnes}
                   onChange={(e) => form.setValue('weight_tonnes', e.target.value)}
                   onFocus={() => notifyFieldFocus('weight')}
                   aria-invalid={!!form.formState.errors.weight_tonnes}
                   required
                 />
                {form.formState.errors.weight_tonnes?.message && <p className="text-sm text-destructive mt-1">{form.formState.errors.weight_tonnes.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="goods">{t('form.goodsDesc')}</Label>
                {speechSupported && (
                  <button
                    type="button"
                    onClick={() => startSpeech((transcript) => form.setValue('goods_description', transcript))}
                    className={`press flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                      isListening
                        ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 animate-pulse'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                    aria-label={t('voice.mic')}
                  >
                    <Mic className="h-3.5 w-3.5" />
                    {isListening ? t('voice.listen') : t('voice.mic')}
                  </button>
                )}
              </div>
              <Textarea
                id="goods"
                placeholder={t('voice.speakGoods')}
                value={formData.goods_description}
                onChange={(e) => form.setValue('goods_description', e.target.value)}
                aria-invalid={!!form.formState.errors.goods_description}
                required
              />
              {form.formState.errors.goods_description?.message && <p className="text-sm text-destructive mt-1">{form.formState.errors.goods_description.message}</p>}
            </div>

              <div className="space-y-2">
                <Label htmlFor="budget">{t('form.budgetPerTonne')}</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
<Input
   id="budget"
   ref={budgetRef}
   data-guide="budget"
   type="number"
                     placeholder="e.g. 1500"
                     className="pl-10"
                     value={formData.budget_per_tonne}
                     onChange={(e) => form.setValue('budget_per_tonne', e.target.value)}
                     onFocus={() => notifyFieldFocus('budget')}
                     aria-invalid={!!form.formState.errors.budget_per_tonne}
                     required
                   />
                </div>
                {form.formState.errors.budget_per_tonne?.message && <p className="text-sm text-destructive mt-1">{form.formState.errors.budget_per_tonne.message}</p>}
                <PricePredictor
                  originCity={formData.origin_city}
                  destinationCity={formData.destination_city}
                  originState={formData.origin_state}
                  destinationState={formData.destination_state}
                  weightTonnes={parseFloat(formData.weight_tonnes) || 0}
                  onApplyPrice={(price) => form.setValue('budget_per_tonne', String(price))}
                />
                {formData.weight_tonnes && formData.budget_per_tonne && (
                  <div className="mt-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {t('form.estimatedTotal')} <span className="font-bold">₹{((parseFloat(formData.weight_tonnes) || 0) * (parseFloat(formData.budget_per_tonne) || 0)).toLocaleString('en-IN')}</span>
                    </p>
                  </div>
                )}
              </div>

            {mode === 'full' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="pickup">{t('form.pickupAddress')}</Label>
                  <Input
                    id="pickup"
                    placeholder="Full pickup address"
                    value={formData.pickup_address}
                    onChange={(e) => form.setValue('pickup_address', e.target.value)}
                    aria-invalid={!!form.formState.errors.pickup_address}
                    required
                  />
                  {form.formState.errors.pickup_address?.message && <p className="text-sm text-destructive mt-1">{form.formState.errors.pickup_address.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery">{t('form.deliveryAddress')}</Label>
                  <Input
                    id="delivery"
                    placeholder="Full delivery address"
                    value={formData.delivery_address}
                    onChange={(e) => form.setValue('delivery_address', e.target.value)}
                    aria-invalid={!!form.formState.errors.delivery_address}
                    required
                  />
                  {form.formState.errors.delivery_address?.message && <p className="text-sm text-destructive mt-1">{form.formState.errors.delivery_address.message}</p>}
                </div>
              </div>
            )}

            {!isOnline && (
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                <WifiOff className="h-4 w-4 shrink-0" />
                <span>{t('form.offlinePosting')}</span>
              </div>
            )}

            <div className="sticky bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] z-10 -mx-3 mt-8 flex items-center justify-between gap-3 rounded-2xl bg-white/95 px-3 py-2.5 shadow-lg shadow-black/5 ring-1 ring-gray-100 dark:bg-gray-900/95 dark:ring-gray-800 backdrop-blur-md md:static md:z-auto md:mx-0 md:mt-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none md:ring-0 md:backdrop-blur-none">
              {userProfile?.id && (
                <SaveAsTemplate
                  userId={userProfile.id}
                  type="shipment"
                  data={formData}
                  disabled={loading || form.formState.isSubmitting}
                />
              )}
<Button
  id="post-shipment-submit"
  ref={submitRef}
  data-guide="submit"
  type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 h-14 text-base sm:text-lg font-bold shadow-md transition-all hover:shadow-lg"
                disabled={loading || !isOnline || form.formState.isSubmitting}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('form.postLoad')}...
                  </>
                ) : !isOnline ? (
                  <><WifiOff className="mr-2 h-5 w-5" /> {t('common.offline')}</>
                ) : t('form.postLoad')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostShipments;
