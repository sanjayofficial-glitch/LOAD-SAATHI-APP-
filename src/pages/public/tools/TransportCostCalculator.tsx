
import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Truck, IndianRupee, Loader2, MapPin, Weight, Info, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SeoMeta from "@/components/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FareResult {
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  totalEstimate: number;
  trend: "rising" | "falling" | "stable";
  dataPoints: number;
}

export default function TransportCostCalculator() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FareResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateCost = useCallback(async () => {
    if (!origin.trim() || !destination.trim() || !weight || Number(weight) <= 0) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) throw new Error("Service unavailable");
      const response = await fetch(`${supabaseUrl}/functions/v1/price-predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originCity: origin.trim(), destinationCity: destination.trim(), weightTonnes: Number(weight) }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("Could not fetch pricing data");
      const data = await response.json();
      const w = Number(weight);
      setResult({
        avgPrice: data.recommendedPrice || 0,
        minPrice: data.range?.min || 0,
        maxPrice: data.range?.max || 0,
        totalEstimate: (data.recommendedPrice || 0) * w,
        trend: data.trend || "stable",
        dataPoints: data.historicalLoads || 0,
      });
    } catch {
      setError("Could not fetch pricing data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [origin, destination, weight]);

  return (
    <>
      <SeoMeta
        title="Transport Cost Calculator | Estimate Freight Rates"
        description="Calculate estimated transport costs for PTL, LTL, and FTL shipments across India. AI-powered rate estimates based on origin, destination, and weight."
        keywords="transport cost calculator, freight rate calculator, truck transport cost, shipping cost calculator India"
        canonical="/transport-cost-calculator"
        breadcrumbs={[{ name: "Transport Cost Calculator", url: "/transport-cost-calculator" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "LoadSaathi Transport Cost Calculator",
          "url": "https://loadsaathi.in/transport-cost-calculator",
          "applicationCategory": "BusinessApplication",
          "description": "Estimate freight costs for PTL, LTL, and FTL shipments across East India corridors."
        }}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to LoadSaathi
          </Link>

          <h1 className="text-4xl sm:text-5xl font-black mb-4 text-foreground">Transport Cost Calculator</h1>
          <p className="text-lg text-muted-foreground mb-10">Estimate freight rates for your shipment across India's East India corridors.</p>

          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-orange-400" /> Enter Shipment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Origin City</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="e.g. Rourkela" className="pl-9" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Destination City</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Ranchi" className="pl-9" />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Weight (Tonnes)</Label>
                <div className="relative mt-1">
                  <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 2" className="pl-9" min="0.1" step="0.1" />
                </div>
              </div>
              <Button onClick={calculateCost} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Truck className="h-4 w-4 mr-2" />}
                Calculate Estimated Cost
              </Button>
              {error && <p className="text-sm text-red-400">{error}</p>}
              {result && (
                <div className="mt-6 p-5 rounded-xl bg-green-900/20 border border-green-700/30 space-y-3">
                  <p className="text-xs text-green-300 uppercase tracking-wider font-semibold">Estimated Freight Range</p>
                  <p className="text-3xl font-black text-green-400">₹{result.minPrice.toLocaleString()} – ₹{result.maxPrice.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Per tonne · Recommended: ₹{result.avgPrice.toLocaleString()}/tonne</p>
                  <p className="text-sm font-semibold text-foreground">Total Estimate: ₹{result.totalEstimate.toLocaleString()}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <Info className="h-3 w-3" />
                    <span>Based on {result.dataPoints} historical data points. Rates may vary by season, fuel, and availability.</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Need a full freight booking?</p>
            <div className="flex justify-center gap-3">
              <Link to="/fare-calculator">
                <Button variant="outline" className="text-xs font-bold">AI Price Predictor</Button>
              </Link>
              <Link to="/register?type=shipper">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold">Book a Shipment</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
