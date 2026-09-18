import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, MapPin, Fuel, IndianRupee, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SeoMeta from "@/components/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { geocodeCity } from "@/utils/geocode";
import { getRoute } from "@/utils/osrm";
import { lookupToll } from "@/data/tollData";
import { trackEstimateGenerated } from "@/utils/analytics";

interface TollFuelResult {
  distanceKm: number;
  fuelCost: number;
  tollCost: number;
  totalCost: number;
  perKmCost: number;
}

const DIESEL_RATE = 95;
const TRUCK_MPG = 4;

export default function TollFuelCalculator() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TollFuelResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async () => {
    if (!origin.trim() || !destination.trim()) {
      setError("Please enter both origin and destination.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const [o, d] = await Promise.all([
        geocodeCity(origin.trim()),
        geocodeCity(destination.trim()),
      ]);
      if (!o || !d) throw new Error("Could not locate cities.");

      const route = await getRoute(d.lon, d.lat, o.lon, o.lat);
      if (!route) throw new Error("Could not calculate route.");

      const distanceKm = route.distance_km;
      const fuelLiters = distanceKm / TRUCK_MPG;
      const fuelCost = Math.round(fuelLiters * DIESEL_RATE);

      const highway = "NH-33";
      const tollCost = lookupToll(highway, origin.trim(), destination.trim(), vehicleType || "heavy");

      const totalCost = fuelCost + tollCost;
      const perKmCost = Math.round((totalCost / distanceKm) * 100) / 100;

      setResult({ distanceKm, fuelCost, tollCost, totalCost, perKmCost });

      trackEstimateGenerated({
        origin: origin.trim(),
        destination: destination.trim(),
        route: `${origin.trim()} → ${destination.trim()}`,
        weight: 0,
        avg_price: totalCost,
        min_price: 0,
        max_price: 0,
        source: "market_data",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not calculate costs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [origin, destination, vehicleType]);

  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h1>Toll + Fuel Cost Calculator — LoadSaathi</h1>
          <p>Calculate toll and fuel costs for your truck route. Enter origin, destination, and vehicle type to get a detailed cost breakdown.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Toll + Fuel Cost Calculator India | Truck Operating Cost Breakdown"
        description="Calculate toll and fuel costs for your truck route in India. Get detailed cost breakdown per kilometre for trip planning."
        keywords="toll cost calculator India, fuel cost calculator truck, truck operating costs, per km cost calculator, diesel cost calculator"
        canonical="/tools/toll-fuel"
        breadcrumbs={[{ name: "Toll + Fuel", url: "/tools/toll-fuel" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "LoadSaathi Toll + Fuel Calculator",
            "url": "https://loadsaathi.in/tools/toll-fuel",
            "applicationCategory": "BusinessApplication",
            "description": "Calculate toll and fuel costs for truck routes in India.",
          },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to LoadSaathi
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-black mb-4 text-foreground">Toll + Fuel Cost Calculator</h1>
            <p className="text-lg text-muted-foreground mb-2">
              Calculate toll and fuel costs for your truck route. Plan your operating costs per kilometre.
            </p>
          </div>

          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Fuel className="h-5 w-5 text-orange-400" /> Route Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Origin</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="e.g. Rourkela" className="pl-9" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Destination</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Kolkata" className="pl-9" />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Vehicle Class</Label>
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select vehicle class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light Commercial Vehicle</SelectItem>
                    <SelectItem value="medium">Medium Commercial Vehicle</SelectItem>
                    <SelectItem value="heavy">Heavy Commercial Vehicle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={calculate} disabled={loading || !origin.trim() || !destination.trim()} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Calculating...</> : <><TrendingUp className="h-4 w-4 mr-2" /> Calculate Costs</>}
              </Button>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </CardContent>
          </Card>

          {result && (
            <Card className="mt-6 glass-card border-green-700/30">
              <CardContent className="p-6 space-y-5">
                <p className="text-xs text-green-300 uppercase tracking-wider font-semibold">Cost Breakdown</p>

                <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-green-900/10 border border-green-700/20">
                  <div className="text-center">
                    <Fuel className="h-4 w-4 mx-auto text-orange-400 mb-1" />
                    <p className="text-2xl font-black text-orange-400">₹{result.fuelCost.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">fuel</p>
                  </div>
                  <div className="text-center">
                    <IndianRupee className="h-4 w-4 mx-auto text-purple-400 mb-1" />
                    <p className="text-2xl font-black text-purple-400">₹{result.tollCost.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">tolls</p>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="h-4 w-4 mx-auto text-green-400 mb-1" />
                    <p className="text-2xl font-black text-green-400">₹{result.totalCost.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">total</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-700/20">
                  <p className="text-sm font-bold text-foreground">Per Kilometre Cost</p>
                  <p className="text-2xl font-black text-blue-400">₹{result.perKmCost}</p>
                  <p className="text-xs text-muted-foreground">for {result.distanceKm} km route</p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Estimates based on diesel rate ₹{DIESEL_RATE}/L and ~{TRUCK_MPG} km/L. Actual tolls may vary.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link to="/register?type=trucker" className="flex-1">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">Book This Route</Button>
                  </Link>
                  <Link to="/trip-profit" className="flex-1">
                    <Button variant="outline" className="w-full font-bold">Trip Profit Calculator</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
