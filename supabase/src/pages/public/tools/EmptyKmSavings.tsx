import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, MapPin, Fuel, TrendingDown, IndianRupee, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SeoMeta from "@/components/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { geocodeCity } from "@/utils/geocode";
import { getRoute } from "@/utils/osrm";
import { calculateEmissions } from "@/utils/emissions";
import { trackEstimateGenerated } from "@/utils/analytics";

interface EmptyKmResult {
  distanceKm: number;
  transitHours: number;
  dedicatedKm: number;
  dedicatedCost: number;
  sharedKm: number;
  sharedCost: number;
  savingsKm: number;
  savingsINR: number;
  savingsPercent: number;
  co2SavedKg: number;
}

const DIESEL_RATE = 95;
const TRUCK_MPG = 4;

export default function EmptyKmSavings() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmptyKmResult | null>(null);
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
      if (!o || !d) throw new Error("Could not locate cities. Please check spelling.");

      const route = await getRoute(d.lon, d.lat, o.lon, o.lat);
      if (!route) throw new Error("Could not calculate route. OSRM may be unavailable.");

      const distanceKm = route.distance_km;
      const transitHours = route.duration_min / 60;

      const dedicatedKm = distanceKm * 2;
      const dedicatedCost = Math.round((dedicatedKm / TRUCK_MPG) * DIESEL_RATE);

      const sharedKm = distanceKm;
      const sharedCost = Math.round((sharedKm / TRUCK_MPG) * DIESEL_RATE);

      const savingsKm = dedicatedKm - sharedKm;
      const savingsINR = dedicatedCost - sharedCost;
      const savingsPercent = dedicatedKm > 0 ? Math.round((savingsKm / dedicatedKm) * 100) : 0;

      const emissions = calculateEmissions({ distanceKm: savingsKm, vehicleType: vehicleType || undefined });
      const co2SavedKg = emissions.totalKg;

      setResult({
        distanceKm,
        transitHours,
        dedicatedKm,
        dedicatedCost,
        sharedKm,
        sharedCost,
        savingsKm,
        savingsINR,
        savingsPercent,
        co2SavedKg,
      });

      trackEstimateGenerated({
        origin: origin.trim(),
        destination: destination.trim(),
        route: `${origin.trim()} → ${destination.trim()}`,
        weight: 0,
        avg_price: 0,
        min_price: 0,
        max_price: 0,
        source: "market_data",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not calculate savings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [origin, destination, vehicleType]);

  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h2>Empty Kilometer Savings Calculator — LoadSaathi</h2>
          <p>Calculate how much you save by sharing truck capacity instead of running dedicated trips. Compare dedicated truck costs versus shared freight costs for your route.</p>
          <h2>How Empty Kilometer Savings Work</h2>
          <p>A dedicated truck travels full load to destination and returns empty, doubling the kilometres. A shared truck carries cargo in both directions, eliminating empty return kilometres. This saves fuel, reduces CO2 emissions, and cuts costs by up to 50%.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Empty Kilometer Savings Calculator | Reduce Truck Operational Costs"
        description="Calculate empty km savings by switching from dedicated to shared freight. Compare costs, CO2 emissions, and fuel savings for your route."
        keywords="empty kilometer savings, reduce truck costs, shared freight savings, operational cost reduction, empty return km"
        canonical="/tools/empty-km-savings"
        breadcrumbs={[{ name: "Empty km Savings", url: "/tools/empty-km-savings" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "LoadSaathi Empty Kilometer Savings Calculator",
            "url": "https://loadsaathi.in/tools/empty-km-savings",
            "applicationCategory": "BusinessApplication",
            "description": "Calculate savings from shared freight vs dedicated trucks. Reduce empty kilometres, fuel costs, and CO2 emissions.",
          },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to LoadSaathi
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-black mb-4 text-foreground">Empty Kilometer Savings</h1>
            <p className="text-lg text-muted-foreground mb-2">
              Compare dedicated truck costs versus shared freight costs. See how much you save by eliminating empty return kilometres.
            </p>
          </div>

          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-400" /> Route Details
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
                <Label className="text-sm font-semibold text-muted-foreground">Vehicle Type (optional)</Label>
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light Commercial Vehicle</SelectItem>
                    <SelectItem value="medium">Medium Commercial Vehicle</SelectItem>
                    <SelectItem value="heavy">Heavy Commercial Vehicle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={calculate} disabled={loading || !origin.trim() || !destination.trim()} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Calculating...</> : <><TrendingDown className="h-4 w-4 mr-2" /> Calculate Savings</>}
              </Button>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </CardContent>
          </Card>

          {result && (
            <Card className="mt-6 glass-card border-green-700/30">
              <CardContent className="p-6 space-y-5">
                <p className="text-xs text-green-300 uppercase tracking-wider font-semibold">Savings Analysis</p>

                <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-green-900/10 border border-green-700/20">
                  <div className="text-center">
                    <TrendingDown className="h-4 w-4 mx-auto text-green-400 mb-1" />
                    <p className="text-2xl font-black text-green-400">{result.savingsPercent}%</p>
                    <p className="text-xs text-muted-foreground">savings</p>
                  </div>
                  <div className="text-center">
                    <IndianRupee className="h-4 w-4 mx-auto text-orange-400 mb-1" />
                    <p className="text-2xl font-black text-orange-400">₹{result.savingsINR.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">saved</p>
                  </div>
                  <div className="text-center">
                    <Fuel className="h-4 w-4 mx-auto text-blue-400 mb-1" />
                    <p className="text-2xl font-black text-blue-400">{Math.round(result.co2SavedKg)} kg</p>
                    <p className="text-xs text-muted-foreground">CO2 saved</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-red-900/10 border border-red-700/20">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Dedicated Truck</p>
                    <p className="text-2xl font-black text-red-400">{result.dedicatedKm} km</p>
                    <p className="text-xs text-muted-foreground">₹{result.dedicatedCost.toLocaleString()} fuel cost</p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-900/10 border border-green-700/20">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Shared Freight</p>
                    <p className="text-2xl font-black text-green-400">{result.sharedKm} km</p>
                    <p className="text-xs text-muted-foreground">₹{result.sharedCost.toLocaleString()} fuel cost</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-700/20">
                  <p className="text-sm font-bold text-foreground">Route Overview</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    One-way distance: {result.distanceKm} km | Transit time: ~{result.transitHours.toFixed(1)} hours
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Estimates based on diesel rate ₹{DIESEL_RATE}/L and ~{TRUCK_MPG} km/L fuel efficiency. Actual costs vary by vehicle, terrain, and load.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link to="/register" className="flex-1">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">Start Sharing Loads</Button>
                  </Link>
                  <Link to="/tools/return-load-calculator" className="flex-1">
                    <Button variant="outline" className="w-full font-bold">Return Load Calculator</Button>
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
