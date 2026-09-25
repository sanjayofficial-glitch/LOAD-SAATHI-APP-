import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, MapPin, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SeoMeta from "@/components/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { geocodeCity } from "@/utils/geocode";
import { getRoute } from "@/utils/osrm";
import { getDriverWage } from "@/data/driverWages";
import { lookupToll } from "@/data/tollData";
import { trackEstimateGenerated } from "@/utils/analytics";

interface ProfitResult {
  distanceKm: number;
  revenueINR: number;
  fuelCost: number;
  tollCost: number;
  driverCost: number;
  maintenanceCost: number;
  totalCost: number;
  netProfit: number;
  profitMargin: number;
}

const DIESEL_RATE = 95;
const TRUCK_MPG = 4;
const MAINTENANCE_PER_KM: Record<string, number> = {
  light: 3.5,
  medium: 5.5,
  heavy: 8.0,
};

export default function TripProfitCalculator() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [loadWeight, setLoadWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProfitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async () => {
    if (!origin.trim() || !destination.trim() || !loadWeight) {
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
      if (!o || !d) throw new Error("Could not locate cities. Please check spelling.");

      const route = await getRoute(d.lon, d.lat, o.lon, o.lat);
      if (!route) throw new Error("Could not calculate route.");

      const distanceKm = route.distance_km;
      const weightTonnes = Number(loadWeight) || 0;

      const vehicleClass = vehicleType.toLowerCase();
      let vc: "light" | "medium" | "heavy" = "heavy";
      if (/mini|ace|intra|jeeto|pickup|bolero/.test(vehicleClass)) vc = "light";
      else if (/407|eicher|furio|loadking|boss/.test(vehicleClass)) vc = "medium";

      const ratePerKm = vc === "light" ? 28 : vc === "medium" ? 38 : 52;
      const revenueINR = distanceKm * ratePerKm + weightTonnes * 150;

      const fuelLiters = distanceKm / TRUCK_MPG;
      const fuelCost = Math.round(fuelLiters * DIESEL_RATE);

      const highway = "NH-33";
      const tollCost = lookupToll(highway, origin.trim(), destination.trim(), vehicleClass);

      const wage = getDriverWage(origin.trim());
      const driverCost = Math.round(distanceKm * wage.wagePerKm + wage.allowancePerDay);

      const maintenanceCost = Math.round(distanceKm * (MAINTENANCE_PER_KM[vc] ?? 8));

      const totalCost = fuelCost + tollCost + driverCost + maintenanceCost;
      const netProfit = revenueINR - totalCost;
      const profitMargin = revenueINR > 0 ? Math.round((netProfit / revenueINR) * 100) : 0;

      setResult({
        distanceKm,
        revenueINR,
        fuelCost,
        tollCost,
        driverCost,
        maintenanceCost,
        totalCost,
        netProfit,
        profitMargin,
      });

      trackEstimateGenerated({
        origin: origin.trim(),
        destination: destination.trim(),
        route: `${origin.trim()} → ${destination.trim()}`,
        weight: weightTonnes,
        avg_price: revenueINR,
        min_price: 0,
        max_price: 0,
        source: "market_data",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not calculate profit. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [origin, destination, vehicleType, loadWeight]);

  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h1>Trip Profit Calculator for Truckers — LoadSaathi</h1>
          <p>Calculate net profit for a truck trip by entering origin, destination, vehicle type, and load weight. See fuel costs, tolls, driver wages, and maintenance breakdown.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Truck Trip Profit Calculator India | Calculate Net Profit Per Trip"
        description="Calculate net profit for truck trips in India. Enter route, vehicle type, and load weight to estimate revenue, fuel costs, tolls, driver wages, and maintenance."
        keywords="trip profit calculator, truck profit calculator India, net profit per trip, truck operational costs, driver wage calculator"
        canonical="/tools/trip-profit"
        breadcrumbs={[{ name: "Trip Profit Calculator", url: "/tools/trip-profit" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "LoadSaathi Trip Profit Calculator",
            "url": "https://loadsaathi.in/tools/trip-profit",
            "applicationCategory": "BusinessApplication",
            "description": "Calculate net profit for truck trips with fuel cost, tolls, driver wages, and maintenance breakdown.",
          },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to LoadSaathi
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-black mb-4 text-foreground">Trip Profit Calculator</h1>
            <p className="text-lg text-muted-foreground mb-2">
              Estimate your net profit for any truck trip. Enter route details, vehicle type, and load weight to see revenue, costs, and margins.
            </p>
          </div>

          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-400" /> Trip Details
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
                      <SelectValue placeholder="Select vehicle" />
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
                  <Input type="number" value={loadWeight} onChange={(e) => setLoadWeight(e.target.value)} placeholder="e.g. 5" className="mt-1" />
                </div>
              </div>

              <Button onClick={calculate} disabled={loading || !origin.trim() || !destination.trim() || !loadWeight} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Calculating...</> : <><TrendingUp className="h-4 w-4 mr-2" /> Calculate Profit</>}
              </Button>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </CardContent>
          </Card>

          {result && (
            <Card className="mt-6 glass-card border-green-700/30">
              <CardContent className="p-6 space-y-5">
                <p className="text-xs text-green-300 uppercase tracking-wider font-semibold">Profit Breakdown</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-green-900/10 border border-green-700/20">
                    <p className="text-xs text-muted-foreground font-semibold">Revenue</p>
                    <p className="text-2xl font-black text-green-400">₹{result.revenueINR.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-900/10 border border-red-700/20">
                    <p className="text-xs text-muted-foreground font-semibold">Total Cost</p>
                    <p className="text-2xl font-black text-red-400">₹{result.totalCost.toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-700/20">
                  <p className="text-xs text-muted-foreground font-semibold mb-2">Net Profit</p>
                  <p className="text-3xl font-black text-blue-400">₹{result.netProfit.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Margin: {result.profitMargin}%</p>
                </div>

                <div className="space-y-2 text-sm">
                  {[
                    { label: "Fuel Cost", value: result.fuelCost, color: "text-orange-400" },
                    { label: "Toll Cost", value: result.tollCost, color: "text-purple-400" },
                    { label: "Driver Cost", value: result.driverCost, color: "text-blue-400" },
                    { label: "Maintenance", value: result.maintenanceCost, color: "text-yellow-400" },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className={`font-medium ${item.color}`}>₹{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  Estimates based on diesel rate ₹{DIESEL_RATE}/L and ~{TRUCK_MPG} km/L. Actual costs vary.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link to="/register?type=trucker" className="flex-1">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">Start Earning</Button>
                  </Link>
                  <Link to="/tools/fare-calculator" className="flex-1">
                    <Button variant="outline" className="w-full font-bold">Estimate Freight Rates</Button>
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
