
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SeoMeta from "@/components/SeoMeta";
import { Package, MapPin, Calendar, IndianRupee, Weight, Clock, ArrowRight, Share2 } from "lucide-react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface ShipmentData {
  id: string;
  origin_city: string;
  destination_city: string;
  origin_state?: string;
  destination_state?: string;
  departure_date: string;
  goods_description?: string;
  weight_tonnes: number;
  budget_per_tonne: number;
  pickup_address?: string;
  delivery_address?: string;
  status: string;
  estimated_distance_km?: number;
  estimated_duration_min?: number;
  shipper?: { full_name: string; rating?: number; is_verified?: boolean };
}

export default function SharedShipment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !supabaseUrl || !supabaseAnonKey) {
      setError("Invalid link");
      setLoading(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    supabase
      .from("shipments")
      .select("id, origin_city, destination_city, origin_state, destination_state, departure_date, goods_description, weight_tonnes, budget_per_tonne, pickup_address, delivery_address, status, estimated_distance_km, estimated_duration_min")
      .eq("id", id)
      .single()
      .then(async ({ data, error: fetchError }) => {
        if (fetchError || !data) {
          setError("Shipment not found or no longer available");
        } else {
          const { data: owner } = await supabase
            .rpc("public_share_shipment_owner", { p_shipment_id: id })
            .maybeSingle();
          setShipment({
            ...(data as unknown as ShipmentData),
            shipper: (owner ?? null) as ShipmentData["shipper"],
          });
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <>
        <SeoMeta title="Loading Shipment Details" description="Loading shared shipment information from LoadSaathi." canonical={`/share/shipment/${id}`} robots="noindex, nofollow" />
        <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-background dark:from-blue-950/10 dark:to-background flex items-center justify-center px-6">
          <Card className="w-full max-w-lg">
            <CardContent className="p-8 space-y-4">
              <h1 className="sr-only">LoadSaathi Shipment</h1>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (error || !shipment) {
    return (
      <>
        <SeoMeta title="Shipment Not Found" description="This shared shipment link is invalid or no longer available on LoadSaathi." canonical={`/share/shipment/${id}`} robots="noindex, nofollow" />
        <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-background dark:from-blue-950/10 dark:to-background flex items-center justify-center px-6">
          <Card className="w-full max-w-lg text-center">
            <CardContent className="p-8">
              <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Shipment Not Found</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{error}</p>
              <Link to="/register">
                <Button className="bg-blue-600 hover:bg-blue-700">Join LoadSaathi</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SeoMeta
        title={`${shipment.origin_city} to ${shipment.destination_city} — Shared Freight`}
        description={`Book shared PTL/LTL freight from ${shipment.origin_city} to ${shipment.destination_city}. ${shipment.weight_tonnes}T load at ₹${shipment.budget_per_tonne}/T. ${shipment.goods_description || 'Freight'} via LoadSaathi.`}
        canonical={`/share/shipment/${id}`}
        robots="noindex, nofollow"
      />
      <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-background dark:from-blue-950/10 dark:to-background">
      {/* Header */}
      <div className="pt-24 pb-8 px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-4">
          <Share2 className="h-3.5 w-3.5" />
          Shared Load
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
          LoadSaathi Shipment
        </h1>
      </div>

      {/* Shipment Card */}
      <div className="px-6 pb-20 max-w-lg mx-auto">
        <Card className="shadow-xl border-blue-100 dark:border-blue-900/30 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-400" />
          <CardContent className="p-6 sm:p-8">
            {/* Route */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="text-center">
                  <MapPin className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-black text-gray-900 dark:text-white">{shipment.origin_city}</p>
                  {shipment.origin_state && <p className="text-xs text-gray-400">{shipment.origin_state}</p>}
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 dark:text-gray-600 shrink-0" />
                <div className="text-center">
                  <MapPin className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-lg font-black text-gray-900 dark:text-white">{shipment.destination_city}</p>
                  {shipment.destination_state && <p className="text-xs text-gray-400">{shipment.destination_state}</p>}
                </div>
              </div>
            </div>

            {/* Goods Description */}
            {shipment.goods_description && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-6 border border-blue-100 dark:border-blue-800">
                <p className="text-sm font-bold text-blue-800 dark:text-blue-200">{shipment.goods_description}</p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <DetailItem icon={Calendar} label="Pickup Date" value={new Date(shipment.departure_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
              <DetailItem icon={Weight} label="Weight" value={`${shipment.weight_tonnes} tonnes`} />
              <DetailItem icon={IndianRupee} label="Budget" value={`₹${shipment.budget_per_tonne.toLocaleString("en-IN")}/tonne`} highlight />
              {shipment.estimated_distance_km && (
                <DetailItem icon={MapPin} label="Distance" value={`${shipment.estimated_distance_km.toLocaleString()} km`} />
              )}
              {shipment.estimated_duration_min && (
                <DetailItem icon={Clock} label="Duration" value={`${Math.round(shipment.estimated_duration_min / 60)}h ${Math.round(shipment.estimated_duration_min % 60)}m`} />
              )}
            </div>

            {/* Addresses */}
            {(shipment.pickup_address || shipment.delivery_address) && (
              <div className="space-y-2 mb-6">
                {shipment.pickup_address && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-bold">Pickup:</span> {shipment.pickup_address}
                  </div>
                )}
                {shipment.delivery_address && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-bold">Delivery:</span> {shipment.delivery_address}
                  </div>
                )}
              </div>
            )}

            {/* Status Badge */}
            <div className="text-center mb-6">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                shipment.status === "pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                shipment.status === "matched" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              }`}>
                {shipment.status}
              </span>
            </div>

            {/* CTA */}
            {user ? (
              <Button
                className="w-full h-12 text-base font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg"
                onClick={() => navigate(-1)}
              >
                Back to Browse <ArrowRight className="ml-2 h-4 w-4 rotate-180" />
              </Button>
            ) : (
              <Link to="/register" className="block">
                <Button className="w-full h-12 text-base font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg">
                  Offer Your Truck <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          Powered by <Link to="/" className="text-orange-500 hover:text-orange-600 font-bold">LoadSaathi</Link> — Precision Freight Intelligence
        </p>
      </div>
    </div>
    </>
  );
}

function DetailItem({ icon: Icon, label, value, highlight = false }: { icon: React.ElementType; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-sm font-bold ${highlight ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
        {value}
      </p>
    </div>
  );
}
