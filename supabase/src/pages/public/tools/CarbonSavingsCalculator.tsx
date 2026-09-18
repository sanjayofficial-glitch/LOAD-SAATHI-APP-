import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, MapPin, Leaf, Truck, TrendingDown } from "lucide-react";
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

interface CarbonResult {
  distanceKm: number;
  ftlCo2Kg: number;
  sharedCo2Kg: number;
  savedKg: number;
  treesEquivalent: number;
}

const TREES_PER_KG_CO2 = 1 / 21;

export default function CarbonSavingsCalculator() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [cargoWeight, setCargoWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CarbonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

      const ftlEmissions = calculateEmissions({ distanceKm, vehicleType: vehicleType || undefined, loadTonnes: weightTonnes });
      const sharedEmissions = calculateEmissions({ distanceKm, vehicleType: vehicleType || undefined, loadTonnes: weightTonnes * 0.7 });

      const savedKg = Math.round((ftlEmissions.totalKg - sharedEmissions.totalKg) * 10) / 10;
      const treesEquivalent = Math.round(savedKg * TREES_PER_KG_CO2);

      setResult({
        distanceKm,
        ftlCo2Kg: Math.round(ftlEmissions.totalKg * 10) / 10,
        sharedCo2Kg: Math.round(sharedEmissions.totalKg * 10) / 10,
        savedKg,
        treesEquivalent,
      });

      trackEstimateGenerated({
        origin: origin.trim(),
        destination: destination.trim(),
        route: `${origin.trim()} → ${destination.trim()}`,
        weight: weightTonnes,
        avg_price: 0,
        min_price: 0,
        max_price: 0,
        source: "market_data",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not calculate carbon savings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [origin, destination, vehicleType, cargoWeight]);

  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h1>Carbon Savings Calculator — LoadSaathi</h1>
          <p>Calculate CO2 emissions for dedicated versus shared freight. See how much carbon you save by sharing truck capacity.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Carbon Savings Calculator for Freight | CO2 Emissions Reduction"
        description="Calculate CO2 emissions for dedicated versus shared freight. See how much carbon you save by sharing truck capacity and reducing empty kilometres."
        keywords="carbon savings calculator, CO2 emissions freight India, carbon footprint trucking, green logistics, shared freight emissions"
        canonical="/tools/carbon-savings"
        breadcrumbs={[{ name: "Carbon Savings", url: "/tools/carbon-savings" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "LoadSaathi Carbon Savings Calculator",
            "url": "https://loadsaathi.in/tools/carbon-savings",
            "applicationCategory": "BusinessApplication",
            "description": "Calculate CO2 emissions savings for shared freight vs dedicated trucks.",
          },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to LoadSaathi
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-black mb-4 text-foreground">Carbon Savings Calculator</h1>
            <p className="text-lg text-muted-foreground mb-2">
              Calculate CO2 emissions for dedicated versus shared freight. See how much carbon you save.
            </p>
          </div>

          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-400" /> Route Details
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Vehicle Type</Label>
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
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Load Weight (tonnes)</Label>
                  <Input type="number" value={cargoWeight} onChange={(e) => setCargoWeight(e.target.value)} placeholder="e.g. 5" className="mt-1" />
                </div>
              </div>

              <Button onClick={calculate} disabled={loading || !origin.trim() || !destination.trim() || !cargoWeight} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Calculating...</> : <><Leaf className="h-4 w-4 mr-2" /> Calculate CO2 Savings</>}
              </Button>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </CardContent>
          </Card>

          {result && (
            <Card className="mt-6 glass-card border-green-700/30">
              <CardContent className="p-6 space-y-5">
                <p className="text-xs text-green-300 uppercase tracking-wider font-semibold">CO2 Emissions Comparison</p>

                <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-green-900/10 border border-green-700/20">
                  <div className="text-center">
                    <Leaf className="h-4 w-4 mx-auto text-green-400 mb-1" />
                    <p className="text-2xl font-black text-green-400">{result.savedKg} kg</p>
                    <p className="text-xs text-muted-foreground">CO2 saved</p>
                  </div>
                  <div className="text-center">
                    <TrendingDown className="h-4 w-4 mx-auto text-blue-400 mb-1" />
                    <p className="text-2xl font-black text-blue-400">{result.treesEquivalent}</p>
                    <p className="text-xs text-muted-foreground">trees equiv.</p>
                  </div>
                  <div className="text-center">
                    <Truck className="h-4 w-4 mx-auto text-orange-400 mb-1" />
                    <p className="text-2xl font-black text-orange-400">{result.distanceKm} km</p>
                    <p className="text-xs text-muted-foreground">distance</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-red-900/10 border border-red-700/20">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Dedicated (FTL)</p>
                    <p className="text-2xl font-black text-red-400">{result.ftlCo2Kg} kg</p>
                    <p className="text-xs text-muted-foreground">CO2 emissions</p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-900/10 border border-green-700/20">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Shared (PTL)</p>
                    <p className="text-2xl font-black text-green-400">{result.sharedCo2Kg} kg</p>
                    <p className="text-xs text-muted-foreground">CO2 emissions</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Trees equivalent based on average absorption of 21 kg CO2 per tree per year.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link to="/register" className="flex-1">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">Ship Green Freight</Button>
                  </Link>
                  <Link to="/shared-savings" className="flex-1">
                    <Button variant="outline" className="w-full font-bold">Shared Savings Calculator</Button>
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
