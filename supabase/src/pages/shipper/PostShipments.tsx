import { useState, useEffect } from "react";
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
import { Package, Calendar, IndianRupee, Loader2, ArrowLeft, WifiOff } from "lucide-react";
import LocationSelector from "@/components/LocationSelector";
import { geocodeCity } from "@/utils/geocode";
import { safeJsonParse } from "@/lib/utils";
import { getRoute } from "@/utils/osrm";
import { PricePredictor } from "@/components/PricePredictor";
import TemplateSelector from "@/components/TemplateSelector";
import SaveAsTemplate from "@/components/SaveAsTemplate";
import { posthog } from "@/utils/posthog";

type LocationData = Record<string, Record<string, string[]>>;

const PostShipments = () => {
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

  const handleLocationChange = (field: 'origin' | 'destination', value: { state: string; district: string; city: string }) => {
    form.setValue(`${field}_city`, value.city);
    form.setValue(`${field}_state`, value.state);
  };

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
          p_destination_city: formData.destination_city.trim(),
          p_origin_state: formData.origin_state || null,
          p_destination_state: formData.destination_state || null,
          p_weight_tonnes: weight,
          p_price_per_tonne: budget,
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
              p_estimated_distance_km: route?.distance_km ?? null,
              p_estimated_duration_min: route?.duration_min ?? null,
            });
          }
        } catch {
          // Silently ignore — coordinates are optional enhancement
        }
      }

posthog.capture('shipment_posted', {
        shipment_id: shipmentData.id,
        origin_state: formData.origin_state,
        destination_state: formData.destination_state,
        weight_tonnes: weight,
        budget_per_tonne: budget,
      });
      showSuccess('Shipment posted successfully!');
      navigate('/shipper/dashboard');
    } catch (err: unknown) {
      posthog.captureException(err, { flow: 'post_shipment' });
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
        <div className="mb-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>You are offline. You cannot post shipments until reconnected.</span>
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
          Quick Post
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
          Full Details
        </button>
      </div>
      {mode === 'quick' && (
        <p className="-mt-3 mb-4 text-sm text-gray-500 dark:text-gray-400">
          Only the essentials needed — pickup & delivery addresses will default to your cities and can be edited later.
        </p>
      )}

      <Card className="border-blue-100 dark:border-blue-800 shadow-lg">
<CardHeader id="post-shipment-header" className="bg-blue-50/50 dark:bg-blue-950/50 border-b border-blue-100 dark:border-blue-800 px-4 sm:px-6">
          <CardTitle className="flex items-center text-blue-900 dark:text-blue-100 text-lg sm:text-xl">
            <Package className="mr-2 text-blue-600 dark:text-blue-400 h-5 w-5 sm:h-6 sm:w-6" />
            Post a New Shipment
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
<div id="post-shipment-origin" className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-200 font-medium">Origin Location</Label>
                <LocationSelector
                  label="Origin"
                  data={locationData || {}}
                  onChange={(value) => handleLocationChange('origin', value)}
                />
                {form.formState.errors.origin_city?.message && <p className="text-sm text-destructive mt-1">{form.formState.errors.origin_city.message}</p>}
              </div>

              <div id="post-shipment-destination" className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-200 font-medium">Destination Location</Label>
                <LocationSelector
                  label="Destination"
                  data={locationData || {}}
                  onChange={(value) => handleLocationChange('destination', value)}
                />
                {form.formState.errors.destination_city?.message && <p className="text-sm text-destructive mt-1">{form.formState.errors.destination_city.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="date">Ready Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="date"
                    type="date"
                    className="pl-10"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.departure_date}
                    onChange={(e) => form.setValue('departure_date', e.target.value)}
                    aria-invalid={!!form.formState.errors.departure_date}
                    required
                  />
                </div>
                {form.formState.errors.departure_date?.message && <p className="text-sm text-destructive mt-1">{form.formState.errors.departure_date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (Tonnes)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 5.0"
                  value={formData.weight_tonnes}
                  onChange={(e) => form.setValue('weight_tonnes', e.target.value)}
                  aria-invalid={!!form.formState.errors.weight_tonnes}
                  required
                />
                {form.formState.errors.weight_tonnes?.message && <p className="text-sm text-destructive mt-1">{form.formState.errors.weight_tonnes.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goods">Goods Description</Label>
              <Textarea
                id="goods"
                placeholder="What are you shipping? (e.g. 100 bags of rice)"
                value={formData.goods_description}
                onChange={(e) => form.setValue('goods_description', e.target.value)}
                aria-invalid={!!form.formState.errors.goods_description}
                required
              />
              {form.formState.errors.goods_description?.message && <p className="text-sm text-destructive mt-1">{form.formState.errors.goods_description.message}</p>}
            </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget per Tonne (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="budget"
                    type="number"
                    placeholder="e.g. 1500"
                    className="pl-10"
                    value={formData.budget_per_tonne}
                    onChange={(e) => form.setValue('budget_per_tonne', e.target.value)}
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
                      Estimated total: <span className="font-bold">₹{((parseFloat(formData.weight_tonnes) || 0) * (parseFloat(formData.budget_per_tonne) || 0)).toLocaleString('en-IN')}</span>
                    </p>
                  </div>
                )}
              </div>

            {mode === 'full' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="pickup">Pickup Address</Label>
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
                  <Label htmlFor="delivery">Delivery Address</Label>
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
                <span>Posting shipments is unavailable while offline.</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
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
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 text-base sm:text-lg font-bold shadow-md transition-all hover:shadow-lg"
                disabled={loading || !isOnline || form.formState.isSubmitting}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Posting Shipment...
                  </>
                ) : !isOnline ? (
                  <><WifiOff className="mr-2 h-5 w-5" /> Offline</>
                ) : 'Post Shipment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostShipments;
