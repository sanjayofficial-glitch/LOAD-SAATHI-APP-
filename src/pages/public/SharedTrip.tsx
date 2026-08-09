
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SeoMeta from "@/components/SeoMeta";
import { Truck, MapPin, Calendar, IndianRupee, Weight, Clock, ArrowRight, ExternalLink, Share2 } from "lucide-react";
import { generateWhatsAppLink } from "@/utils/whatsapp";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface TripData {
  id: string;
  origin_city: string;
  destination_city: string;
  origin_state?: string;
  destination_state?: string;
  departure_date: string;
  available_capacity_tonnes: number;
  price_per_tonne: number;
  vehicle_type?: string;
  vehicle_number?: string;
  status: string;
  estimated_distance_km?: number;
  estimated_duration_min?: number;
  origin_lat?: number;
  origin_lng?: number;
  destination_lat?: number;
  destination_lng?: number;
  trucker?: { full_name: string; rating?: number; is_verified?: boolean; phone?: string };
}

export default function SharedTrip() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<TripData | null>(null);
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
      .from("trips")
      .select("id, origin_city, destination_city, origin_state, destination_state, departure_date, available_capacity_tonnes, price_per_tonne, vehicle_type, vehicle_number, status, estimated_distance_km, estimated_duration_min, origin_lat, origin_lng, destination_lat, destination_lng, trucker:users!trips_trucker_id_fkey(full_name, rating, is_verified)")
      .eq("id", id)
      .single()
      .then(({ data, error: fetchError }) => {
        if (fetchError || !data) {
          setError("Trip not found or no longer available");
        } else {
          setTrip(data as unknown as TripData);
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <>
        <SeoMeta title="Loading Trip Details" description="Loading shared trip information from LoadSaathi." canonical={`/share/trip/${id}`} />
        <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-background dark:from-orange-950/10 dark:to-background flex items-center justify-center px-6">
          <Card className="w-full max-w-lg">
            <CardContent className="p-8 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (error || !trip) {
    return (
      <>
        <SeoMeta title="Trip Not Found" description="This shared trip link is invalid or no longer available on LoadSaathi." canonical={`/share/trip/${id}`} />
        <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-background dark:from-orange-950/10 dark:to-background flex items-center justify-center px-6">
          <Card className="w-full max-w-lg text-center">
            <CardContent className="p-8">
              <Truck className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Trip Not Found</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{error}</p>
              <Link to="/register">
                <Button className="bg-orange-600 hover:bg-orange-700">Join LoadSaathi</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const trucker = trip.trucker;
  const whatsAppUrl = trucker?.phone
    ? generateWhatsAppLink(trucker.phone, {
        id: trip.id,
        goods_description: "Cargo",
        pickup_city: trip.origin_city,
        drop_city: trip.destination_city,
        weight: trip.available_capacity_tonnes * 1000,
      })
    : null;

  return (
    <>
      <SeoMeta
        title={`${trip.origin_city} to ${trip.destination_city} — Shared Truck Space`}
        description={`Available truck space from ${trip.origin_city} to ${trip.destination_city}. ${trip.available_capacity_tonnes}T capacity at ₹${trip.price_per_tonne}/T. ${trip.vehicle_type || 'Truck'} via LoadSaathi.`}
        canonical={`/share/trip/${id}`}
      />
      <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-background dark:from-orange-950/10 dark:to-background">
      {/* Header */}
      <div className="pt-24 pb-8 px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-4">
          <Share2 className="h-3.5 w-3.5" />
          Shared Trip
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
          LoadSaathi Trip
        </h1>
      </div>

      {/* Trip Card */}
      <div className="px-6 pb-20 max-w-lg mx-auto">
        <Card className="shadow-xl border-orange-100 dark:border-orange-900/30 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-orange-500 to-orange-400" />
          <CardContent className="p-6 sm:p-8">
            {/* Route */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="text-center">
                  <MapPin className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-lg font-black text-gray-900 dark:text-white">{trip.origin_city}</p>
                  {trip.origin_state && <p className="text-xs text-gray-400 dark:text-gray-500">{trip.origin_state}</p>}
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 dark:text-gray-600 shrink-0" />
                <div className="text-center">
                  <MapPin className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-black text-gray-900 dark:text-white">{trip.destination_city}</p>
                  {trip.destination_state && <p className="text-xs text-gray-400 dark:text-gray-500">{trip.destination_state}</p>}
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <DetailItem icon={Calendar} label="Departure" value={new Date(trip.departure_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
              <DetailItem icon={Weight} label="Capacity" value={`${trip.available_capacity_tonnes} tonnes`} />
              <DetailItem icon={IndianRupee} label="Price" value={`₹${trip.price_per_tonne.toLocaleString("en-IN")}/tonne`} highlight />
              <DetailItem icon={Truck} label="Vehicle" value={trip.vehicle_type || "Any"} />
              {trip.estimated_distance_km && (
                <DetailItem icon={MapPin} label="Distance" value={`${trip.estimated_distance_km.toLocaleString()} km`} />
              )}
              {trip.estimated_duration_min && (
                <DetailItem icon={Clock} label="Duration" value={`${Math.round(trip.estimated_duration_min / 60)}h ${Math.round(trip.estimated_duration_min % 60)}m`} />
              )}
            </div>

            {/* Trucker Info */}
            {trucker && (
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 mb-6 border border-orange-100 dark:border-orange-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                    {(trucker.full_name || "T").charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{trucker.full_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {trucker.rating ? `⭐ ${trucker.rating.toFixed(1)} rating` : "New trucker"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Badge */}
            <div className="text-center mb-6">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                trip.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                trip.status === "in_transit" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              }`}>
                {trip.status}
              </span>
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <Link to="/register" className="block">
                <Button className="w-full h-12 text-base font-bold bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg">
                  Book This Load <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              {whatsAppUrl && (
                <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="outline" className="w-full h-12 text-base font-bold border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950">
                    Contact via WhatsApp <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
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
        <Icon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-sm font-bold ${highlight ? "text-orange-600 dark:text-orange-400" : "text-gray-900 dark:text-white"}`}>
        {value}
      </p>
    </div>
  );
}
