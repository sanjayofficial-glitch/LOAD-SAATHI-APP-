
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabase } from "@/hooks/useSupabase";
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
  const [formData, setFormData] = useState({
    origin_city: '',
    origin_state: '',
    destination_city: '',
    destination_state: '',
    departure_date: '',
    goods_description: '',
    weight_tonnes: '',
    pickup_address: '',
    delivery_address: '',
    budget_per_tonne: ''
  });

  const handleLocationChange = (field: 'origin' | 'destination', value: { state: string; district: string; city: string }) => {
    setFormData(prev => ({
      ...prev,
      [`${field}_city`]: value.city,
      [`${field}_state`]: value.state
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

    if (isNaN(weight) || weight <= 0) {
      showError('Please enter a valid weight.');
      return;
    }

    if (isNaN(budget) || budget <= 0) {
      showError('Please enter a valid budget.');
      return;
    }

    setLoading(true);
    try {
      const supabaseClient = await getAuthenticatedClient();
      const { data: shipmentData, error } = await supabaseClient.from('shipments').insert({
        shipper_id: userProfile.id,
        origin_city: formData.origin_city.trim(),
        origin_state: formData.origin_state,
        destination_city: formData.destination_city.trim(),
        destination_state: formData.destination_state,
        departure_date: formData.departure_date,
        goods_description: formData.goods_description.trim() || 'Freight goods',
        weight_tonnes: weight,
        pickup_address: formData.pickup_address.trim() || `${formData.origin_city.trim()}, ${formData.origin_state || 'India'}`,
        delivery_address: formData.delivery_address.trim() || `${formData.destination_city.trim()}, ${formData.destination_state || 'India'}`,
        budget_per_tonne: budget,
        status: 'pending'
      }).select('id').single();

      if (error) {
        showError(error.message);
        return;
      }

      // Save price history — fire-and-forget, non-blocking
      if (shipmentData?.id) {
        supabaseClient.from('price_history').insert({
          origin_city: formData.origin_city.trim(),
          destination_city: formData.destination_city.trim(),
          origin_state: formData.origin_state || null,
          destination_state: formData.destination_state || null,
          weight_tonnes: weight,
          price_per_tonne: budget,
          user_id: userProfile.id,
          user_type: 'shipper',
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
            await supabaseClient.from('shipments').update({
              origin_lat: originCoords.lat,
              origin_lng: originCoords.lon,
              destination_lat: destCoords.lat,
              destination_lng: destCoords.lon,
              estimated_distance_km: route?.distance_km ?? null,
              estimated_duration_min: route?.duration_min ?? null,
            }).eq('id', shipmentData.id);
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
  };

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
        <CardHeader className="bg-blue-50/50 dark:bg-blue-950/50 border-b border-blue-100 dark:border-blue-800 px-4 sm:px-6">
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
                onSelect={(data) => setFormData(prev => ({
                  ...prev,
                  origin_city: (data.origin_city as string) || prev.origin_city,
                  origin_state: (data.origin_state as string) || prev.origin_state,
                  destination_city: (data.destination_city as string) || prev.destination_city,
                  destination_state: (data.destination_state as string) || prev.destination_state,
                  departure_date: (data.departure_date as string) || prev.departure_date,
                  goods_description: (data.goods_description as string) || prev.goods_description,
                  weight_tonnes: (data.weight_tonnes as string) || prev.weight_tonnes,
                  pickup_address: (data.pickup_address as string) || prev.pickup_address,
                  delivery_address: (data.delivery_address as string) || prev.delivery_address,
                  budget_per_tonne: (data.budget_per_tonne as string) || prev.budget_per_tonne,
                }))}
              />
            )}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-200 font-medium">Origin Location</Label>
                <LocationSelector
                  label="Origin"
                  data={locationData || {}}
                  onChange={(value) => handleLocationChange('origin', value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-200 font-medium">Destination Location</Label>
                <LocationSelector
                  label="Destination"
                  data={locationData || {}}
                  onChange={(value) => handleLocationChange('destination', value)}
                />
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
                    onChange={(e) => setFormData({...formData, departure_date: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (Tonnes)</Label>
                <Input 
                  id="weight"
                  type="number" 
                  step="0.1" 
                  placeholder="e.g. 5.0"
                  value={formData.weight_tonnes} 
                  onChange={(e) => setFormData({...formData, weight_tonnes: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goods">Goods Description</Label>
              <Textarea 
                id="goods"
                placeholder="What are you shipping? (e.g. 100 bags of rice)"
                value={formData.goods_description} 
                onChange={(e) => setFormData({...formData, goods_description: e.target.value})} 
                required 
              />
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
                    onChange={(e) => setFormData({...formData, budget_per_tonne: e.target.value})} 
                    required 
                  />
                </div>
                <PricePredictor
                  originCity={formData.origin_city}
                  destinationCity={formData.destination_city}
                  originState={formData.origin_state}
                  destinationState={formData.destination_state}
                  weightTonnes={parseFloat(formData.weight_tonnes) || 0}
                  onApplyPrice={(price) => setFormData(prev => ({ ...prev, budget_per_tonne: String(price) }))}
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
                    onChange={(e) => setFormData({...formData, pickup_address: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery">Delivery Address</Label>
                  <Input 
                    id="delivery"
                    placeholder="Full delivery address"
                    value={formData.delivery_address} 
                    onChange={(e) => setFormData({...formData, delivery_address: e.target.value})} 
                    required 
                  />
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
                  disabled={loading}
                />
              )}
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 text-base sm:text-lg font-bold shadow-md transition-all hover:shadow-lg"
                disabled={loading || !isOnline}
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
