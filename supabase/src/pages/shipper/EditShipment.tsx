
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { geocodeCity } from "@/utils/geocode";
import { getRoute } from "@/utils/osrm";

const EditShipment = () => {
  const { getToken } = useClerkAuth();
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    goods_description: "",
    weight_tonnes: "",
    budget_per_tonne: "",
    origin_city: "",
    origin_state: "",
    destination_city: "",
    destination_state: "",
  });

  const { data: shipment, isLoading } = useQuery({
    queryKey: ["shipment", shipmentId],
    queryFn: async () => {
      const token = await getToken({ template: 'supabase' });
      if (!token) throw new Error('No auth token');
      const supabase = createClerkSupabaseClient(token);
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', shipmentId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!shipmentId,
  });

  useEffect(() => {
    if (shipment) {
      setFormData({
        goods_description: shipment.goods_description || "",
        weight_tonnes: shipment.weight_tonnes?.toString() || "",
        budget_per_tonne: shipment.budget_per_tonne?.toString() || "",
        origin_city: shipment.origin_city || "",
        origin_state: shipment.origin_state || "",
        destination_city: shipment.destination_city || "",
        destination_state: shipment.destination_state || "",
      });
    }
  }, [shipment]);

  const saveCoords = async (supabase: ReturnType<typeof createClerkSupabaseClient>, id: string) => {
    try {
      const [originCoords, destCoords] = await Promise.all([
        geocodeCity(formData.origin_city),
        geocodeCity(formData.destination_city),
      ]);
      if (originCoords && destCoords) {
        const route = await getRoute(
          originCoords.lon, originCoords.lat,
          destCoords.lon, destCoords.lat
        );
        await supabase.rpc('update_shipment_coords', {
          p_shipment_id: id,
          p_origin_lat: originCoords.lat,
          p_origin_lng: originCoords.lon,
          p_dest_lat: destCoords.lat,
          p_dest_lng: destCoords.lon,
          p_estimated_distance_km: route?.distance_km ?? null,
          p_estimated_duration_min: route?.duration_min ?? null,
        });
      }
    } catch {
      // Silently ignore — coordinates are optional
    }
  };

  const mutation = useMutation({
    mutationFn: async (updatedData: Record<string, unknown>) => {
      if (!shipmentId) throw new Error('No shipment ID');
      const token = await getToken({ template: 'supabase' });
      if (!token) throw new Error('No auth token');
      const supabase = createClerkSupabaseClient(token);
      const { error } = await supabase
        .from('shipments')
        .update(updatedData)
        .eq('id', shipmentId)
        .select('id')
        .single();

      if (error) throw error;

      await saveCoords(supabase, shipmentId);
    },
    onSuccess: () => {
      showSuccess("Shipment updated successfully");
      queryClient.invalidateQueries({ queryKey: ["shipment", shipmentId] });
      navigate("/shipper/my-shipments");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to update shipment");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      goods_description: formData.goods_description,
      weight_tonnes: parseFloat(formData.weight_tonnes),
      budget_per_tonne: parseFloat(formData.budget_per_tonne),
      origin_city: formData.origin_city,
      origin_state: formData.origin_state,
      destination_city: formData.destination_city,
      destination_state: formData.destination_state,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Shipment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Goods Description</Label>
              <Input
                value={formData.goods_description}
                onChange={(e) => setFormData({ ...formData, goods_description: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Weight (Tonnes)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.weight_tonnes}
                  onChange={(e) => setFormData({ ...formData, weight_tonnes: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Budget per Tonne (₹)</Label>
                <Input
                  type="number"
                  value={formData.budget_per_tonne}
                  onChange={(e) => setFormData({ ...formData, budget_per_tonne: e.target.value })}
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditShipment;
