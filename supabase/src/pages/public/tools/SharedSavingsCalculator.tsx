import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, MapPin, IndianRupee, Truck, TrendingDown, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SeoMeta from "@/components/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { geocodeCity } from "@/utils/geocode";
import { getRoute } from "@/utils/osrm";
import { calculateEmissions } from "@/utils/emissions";
import { trackEstimateGenerated } from "@/utils/analytics";

interface SharedSavingsResult {
  distanceKm: number;
  ftlTrucks: number;
  ftlCost: number;
  sharedTrucks: number;
  sharedCost: number;
  savingsINR: number;
  savingsPercent: number;
  co2SavedKg: number;
  treesEquivalent: number;
}

const FTL_RATE_PER_TONNE = 2800;
const PTL_RATE_PER_TONNE = 1800;

export default function SharedSavingsCalculator() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [cargoWeight, setCargoWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SharedSavingsResult | null>(null);
  const [error, setError] = useState<string |null>(null);

  const calculate = useCallback(async () => {
    if (!origin.trim() || !destination.trim() || !cargoWeight) {
      setError("Please fill in all fields.");
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
      const weightTonnes = Number(cargoWeight) || 0;
      const truckCapacity = 9;

      const ftlTrucks = Math.ceil(weightTonnes / truckCapacity);
      const ftlCost = Math.round(ftlTrucks * distanceKm * FTL_RATE_PER_TONNE * truckCapacity / 1000);

      const sharedTrucks = Math.ceil(weightTonnes / (truckCapacity * 0.7));
      const sharedCost = Math.round(sharedTrucks * distanceKm * PTL_RATE_PER_TONNE * truckCapacity / 1000);

      const savingsINR = ftlCost - sharedCost;
      const savingsPercent = ftlCost > 0 ? Math.round((savingsINR / ftlCost) * 100) : 0;

      const ftlEmissions = calculateEmissions({ distanceKm, vehicleType: "heavy", loadTonnes: weightTonnes / ftlTrucks });
      const sharedEmissions = calculateEmissions({ distanceKm, vehicleType: "heavy", loadTonnes: weightTonnes / sharedTrucks });
      const co2SavedKg = Math.round((ftlEmissions.totalKg - sharedEmissions.totalKg) * 10) / 10;
      const treesEquivalent = Math.round(co2SavedKg / 21);

      setResult({
        distanceKm,
        ftlTrucks,
        ftlCost,
        sharedTrucks,
        sharedCost,
        savingsINR,
        savingsPercent,
        co2SavedKg,
        treesEquivalent,
      });

      trackEstimateGenerated({
        origin: origin.trim(),
        destination: destination.trim(),
        route: `${origin.trim()} → ${destination.trim()}`,
        weight: weightTonnes,
        avg_price: sharedCost / weightTonnes,
        min_price: 0,
        max_price: 0,
        source: "market_data",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not calculate savings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [origin, destination, cargoWeight]);

  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h1>Shared Freight Savings Calculator — LoadSaathi</h1>
          <p>Calculate how much you save by choosing shared freight (PTL) instead of dedicated trucks (FTL). Compare costs, CO2 emissions, and truck utilisation.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Shared Freight Savings Calculator | PTL vs FTL Cost Comparison"
        description="Compare shared freight (PTL) versus dedicated trucks (FTL) costs. Calculate savings percentage, CO2 emissions reduction, and truck utilisation."
        keywords="shared freight savings, PTL vs FTL, shared truck savings calculator, freight cost comparison India, PTL savings"
        canonical="/tools/shared-savings"
        breadcrumbs={[{ name: "Shared Savings", url: "/tools/shared-savings" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "LoadSaathi Shared Savings Calculator",
            "url": "https://loadsaathi.in/tools/shared-savings",
            "applicationCategory": "BusinessApplication",
            "description": "Compare shared freight savings vs dedicated trucks. Calculate cost savings and CO2 reduction.",
          },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to LoadSaathi
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-black mb-4 text-foreground">Shared Freight Savings</h1>
            <p className="text-lg text-muted-foreground mb-2">
              Compare dedicated trucks (FTL) versus shared freight (PTL). See exactly how much you save in cost and CO2 emissions.
            </p>
          </div>

          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-400" /> Shipment Details
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
                <Label className="text-sm font-semibold text-muted-foreground">Cargo Weight (tonnes)</Label>
                <Input type="number" value={cargoWeight} onChange={(e) => setCargoWeight(e.target.value)} placeholder="e.g. 4" className="mt-1" />
              </div>

              <Button onClick={calculate} disabled={loading || !origin.trim() || !destination.trim() || !cargoWeight} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Calculating...</> : <><TrendingDown className="h-4 w-4 mr-2" /> Compare Savings</>}
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
                    <IndianRupee className="h-4 w-4 mx-auto text-green-400 mb-1" />
                    <p className="text-2xl font-black text-green-400">{result.savingsPercent}%</p>
                    <p className="text-xs text-muted-foreground">cost savings</p>
                  </div>
                  <div className="text-center">
                    <IndianRupee className="h-4 w-4 mx-auto text-orange-400 mb-1" />
                    <p className="text-2xl font-black text-orange-400">₹{result.savingsINR.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">saved</p>
                  </div>
                  <div className="text-center">
                    <Leaf className="h-4 w-4 mx-auto text-blue-400 mb-1" />
                    <p className="text-2xl font-black text-blue-400">{result.treesEquivalent}</p>
                    <p className="text-xs text-muted-foreground">trees equiv.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-red-900/10 border border-red-700/20">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Dedicated (FTL)</p>
                    <p className="text-lg font-black text-red-400">{result.ftlTrucks} truck{result.ftlTrucks > 1 ? "s" : ""}</p>
                    <p className="text-xs text-muted-foreground">₹{result.ftlCost.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-900/10 border border-green-700/20">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Shared (PTL)</p>
                    <p className="text-lg font-black text-green-400">{result.sharedTrucks} truck{result.sharedTrucks > 1 ? "s" : ""}</p>
                    <p className="text-xs text-muted-foreground">₹{result.sharedCost.toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-700/20">
                  <p className="text-xs text-muted-foreground">CO2 saved: {result.co2SavedKg} kg by sharing truck capacity</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link to="/register" className="flex-1">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">Ship Shared Freight</Button>
                  </Link>
                  <Link to="/ptl-vs-ftl-calculator" className="flex-1">
                    <Button variant="outline" className="w-full font-bold">PTL vs FTL Guide</Button>
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
