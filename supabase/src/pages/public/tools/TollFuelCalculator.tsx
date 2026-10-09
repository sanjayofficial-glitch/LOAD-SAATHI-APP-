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
  fuelLiters: number;
  dieselPriceUsed: number;
  mileageUsed: number;
}

// Assumed defaults — NOT live fuel prices. The default rate is a planning
// assumption with an explicit "set" date shown in the UI, and users can
// overwrite it with their local pump price.
const DEFAULT_DIESEL_RATE = 95;
const DEFAULT_DIESEL_RATE_AS_OF = "October 2026";
const DEFAULT_MILEAGE_KM_PER_L = 4;
const SCENARIO_PERCENTS = [-10, -5, 5, 10, 15];

export default function TollFuelCalculator() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [dieselPrice, setDieselPrice] = useState(String(DEFAULT_DIESEL_RATE));
  const [mileage, setMileage] = useState(String(DEFAULT_MILEAGE_KM_PER_L));
  const [scenarioPct, setScenarioPct] = useState(5);
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
      const priceUsed = Number(dieselPrice) > 0 ? Number(dieselPrice) : DEFAULT_DIESEL_RATE;
      const mileageUsed = Number(mileage) > 0 ? Number(mileage) : DEFAULT_MILEAGE_KM_PER_L;
      const fuelLiters = distanceKm / mileageUsed;
      const fuelCost = Math.round(fuelLiters * priceUsed);

      const highway = "NH-33";
      const tollCost = lookupToll(highway, origin.trim(), destination.trim(), vehicleType || "heavy");

      const totalCost = fuelCost + tollCost;
      const perKmCost = Math.round((totalCost / distanceKm) * 100) / 100;

      setResult({ distanceKm, fuelCost, tollCost, totalCost, perKmCost, fuelLiters, dieselPriceUsed: priceUsed, mileageUsed });

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
  }, [origin, destination, vehicleType, dieselPrice, mileage]);

  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h2>Toll + Fuel Cost Calculator — LoadSaathi</h2>
          <p>Calculate toll and fuel costs for your truck route. Enter origin, destination, and vehicle type to get a detailed cost breakdown.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Toll + Fuel Cost Calculator India | Truck Operating Cost Breakdown"
        description="Calculate toll and fuel costs for truck routes in India with your own diesel price and mileage assumptions, plus a fuel price scenario comparison. Get detailed cost breakdown per kilometre for trip planning."
        keywords="toll cost calculator India, fuel cost calculator truck, truck operating costs, per km cost calculator, diesel cost calculator, fuel price scenario calculator"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Diesel Price (₹/litre)</Label>
                  <Input type="number" min="0" step="0.01" value={dieselPrice} onChange={(e) => setDieselPrice(e.target.value)} className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Defaults to an assumed ₹{DEFAULT_DIESEL_RATE}/L (set {DEFAULT_DIESEL_RATE_AS_OF}) — enter your local pump price.
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Mileage (km/litre)</Label>
                  <Input type="number" min="0" step="0.1" value={mileage} onChange={(e) => setMileage(e.target.value)} className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Defaults to an assumed {DEFAULT_MILEAGE_KM_PER_L} km/L for a loaded truck.
                  </p>
                </div>
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

                <div className="p-4 rounded-xl bg-background/50 border border-border space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-sm font-bold text-foreground">Fuel price scenario</p>
                    <div className="flex gap-1.5">
                      {SCENARIO_PERCENTS.map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setScenarioPct(pct)}
                          className={`px-2 py-1 text-xs font-bold rounded-md border transition-colors ${
                            scenarioPct === pct
                              ? "bg-orange-600 border-orange-500 text-white"
                              : "bg-background border-border text-muted-foreground hover:border-orange-500/50"
                          }`}
                        >
                          {pct > 0 ? `+${pct}` : pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                  {(() => {
                    const scenarioFuel = Math.round(result.fuelLiters * result.dieselPriceUsed * (1 + scenarioPct / 100));
                    const delta = scenarioFuel - result.fuelCost;
                    return (
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3 rounded-lg bg-background/60 border border-border">
                          <p className="text-lg font-black text-foreground">₹{result.fuelCost.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">baseline fuel</p>
                        </div>
                        <div className="p-3 rounded-lg bg-background/60 border border-border">
                          <p className="text-lg font-black text-orange-400">₹{scenarioFuel.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">at {scenarioPct > 0 ? "+" : ""}{scenarioPct}%</p>
                        </div>
                        <div className="p-3 rounded-lg bg-background/60 border border-border">
                          <p className={`text-lg font-black ${delta > 0 ? "text-red-400" : delta < 0 ? "text-green-400" : "text-foreground"}`}>
                            {delta > 0 ? "+" : ""}₹{delta.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">change</p>
                        </div>
                      </div>
                    );
                  })()}
                  <p className="text-xs text-muted-foreground">
                    Scenario comparison only — a what-if on your entered assumptions, not a verified current or future fuel price.
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Estimate based on your inputs: diesel ₹{result.dieselPriceUsed}/L, mileage {result.mileageUsed} km/L over {result.distanceKm} km.
                  Default assumptions (₹{DEFAULT_DIESEL_RATE}/L, {DEFAULT_MILEAGE_KM_PER_L} km/L) were set {DEFAULT_DIESEL_RATE_AS_OF} and are not live prices. Actual tolls may vary.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link to="/register?type=trucker" className="flex-1">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">Book This Route</Button>
                  </Link>
                  <Link to="/tools/trip-profit" className="flex-1">
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
