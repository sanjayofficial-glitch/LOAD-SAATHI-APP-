
import { useState, useCallback, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Truck, ArrowRight, IndianRupee, TrendingUp, TrendingDown, Minus, Loader2, MapPin, Weight, Sparkles, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SeoMeta from "@/components/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { posthog } from "@/utils/posthog";
import QuoteLeadCard from "@/components/QuoteLeadCard";
import { trackCalculatorStarted, trackEstimateGenerated } from "@/utils/analytics";

interface FareResult {
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  totalEstimate: number;
  trend: "rising" | "falling" | "stable";
  dataPoints: number;
  avgPerTonne: number;
}

export default function FareCalculator() {
  const [searchParams] = useSearchParams();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FareResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill from URL params (?from=Mumbai&to=Delhi) and fire calculator_started
  useEffect(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from) setOrigin(from);
    if (to) setDestination(to);
    if (from || to) {
      trackCalculatorStarted({
        origin: from || undefined,
        destination: to || undefined,
      });
    }
  }, [searchParams]);

  const calculateFare = useCallback(async () => {
    if (!origin.trim() || !destination.trim() || !weight || Number(weight) <= 0) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error("Service unavailable");
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/price-predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originCity: origin.trim(),
          destinationCity: destination.trim(),
          weightTonnes: Number(weight),
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error("Could not fetch pricing data");
      }

      const data = await response.json();
      const weightNum = Number(weight);

      setResult({
        avgPrice: data.recommendedPrice || 0,
        minPrice: data.range?.min || 0,
        maxPrice: data.range?.max || 0,
        totalEstimate: (data.recommendedPrice || 0) * weightNum,
        trend: data.trend || "stable",
        dataPoints: data.historicalLoads || 0,
        avgPerTonne: data.recommendedPrice || 0,
      });
      posthog.capture("fare_estimated", {
        weight_tonnes: weightNum,
        recommended_price_per_tonne: data.recommendedPrice || 0,
        historical_loads: data.historicalLoads || 0,
        estimate_source: "market_data",
      });
      trackEstimateGenerated({
        origin: origin.trim(),
        destination: destination.trim(),
        route: `${origin.trim()} → ${destination.trim()}`,
        weight: weightNum,
        avg_price: data.recommendedPrice || 0,
        min_price: data.range?.min || 0,
        max_price: data.range?.max || 0,
        source: "market_data",
      });
    } catch (_err) {
      // Fallback: simple distance-based estimate
      setError(null);
      const weightNum = Number(weight);
      // Rough estimate: ₹8-12 per tonne-km for Indian freight
      // Assuming avg 500km route if we can't get real data
      const baseRatePerTonne = 9; // ₹/tonne-km average
      const estimatedDistance = 500; // km fallback
      const avgPrice = baseRatePerTonne * estimatedDistance;
      const minPrice = Math.round(avgPrice * 0.8);
      const maxPrice = Math.round(avgPrice * 1.2);

      setResult({
        avgPrice: Math.round(avgPrice),
        minPrice,
        maxPrice,
        totalEstimate: Math.round(avgPrice * weightNum),
        trend: "stable",
        dataPoints: 0,
        avgPerTonne: Math.round(avgPrice),
      });
      posthog.capture("fare_estimated", {
        weight_tonnes: weightNum,
        recommended_price_per_tonne: Math.round(avgPrice),
        historical_loads: 0,
        estimate_source: "fallback",
      });
      trackEstimateGenerated({
        origin: origin.trim(),
        destination: destination.trim(),
        route: `${origin.trim()} → ${destination.trim()}`,
        weight: weightNum,
        avg_price: Math.round(avgPrice),
        min_price: minPrice,
        max_price: maxPrice,
        source: "fallback",
      });
    } finally {
      setLoading(false);
    }
  }, [origin, destination, weight]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") calculateFare();
  };

  return (
    <>
      <noscript>
        <div style={{maxWidth:800,margin:'0 auto',padding:'32px',fontFamily:'system-ui'}}>
          <h1>AI Fare Calculator — Get Instant Freight Estimates</h1>
          <p>LoadSaathi's AI-powered fare calculator provides accurate freight cost estimates in real-time. Enter your route and cargo details to get instant pricing with market intelligence, historical trends, and a fairness index.</p>
          <h2>How to Use the Fare Calculator</h2>
          <ol>
            <li><strong>Select Route:</strong> Choose origin and destination states and cities from the dropdown menus.</li>
            <li><strong>Enter Cargo Details:</strong> Provide weight in kilograms and select your vehicle type.</li>
            <li><strong>Click Calculate:</strong> Get instant AI-powered price estimate with fair price range, rate per kilogram, and market intelligence.</li>
          </ol>
          <h2>What the Estimate Includes</h2>
          <ul>
            <li>Fair price estimate based on market rates and historical data</li>
            <li>Confidence level (Low, Medium, High, Very High)</li>
            <li>Fairness index showing how the price compares to market averages</li>
            <li>Rate per kilometer and rate per kilogram</li>
            <li>Current market demand indicator</li>
            <li>Historical price trends for the route</li>
            <li>AI-powered recommendations for optimal pricing</li>
          </ul>
          <h2>Vehicle Types Supported</h2>
          <ul>
            <li>Open Body — General goods transport</li>
            <li>Container — Secured, weather-protected cargo</li>
            <li>Tanker — Liquid and bulk transport</li>
            <li>Flatbed — Oversized and heavy cargo</li>
            <li>Refrigerated — Temperature-sensitive goods</li>
          </ul>
          <h2>Frequently Asked Questions</h2>
          <h3>How accurate is the AI fare estimate?</h3>
          <p>Our AI analyzes market rates, fuel costs, seasonal demand, and historical data. The accuracy level is indicated in the results.</p>
          <h3>Is the fare calculator free?</h3>
          <p>Yes. The AI fare calculator is completely free to use. No registration required.</p>
        </div>
      </noscript>
      <SeoMeta
      title="Freight Fare Calculator — Estimate PTL/LTL Rates"
      description="Calculate estimated freight rates for PTL and LTL shipments across East India. AI-powered fare estimates for Rourkela, Ranchi, Burdwan, and more."
      keywords="freight fare calculator India, PTL LTL rate calculator, truck freight cost estimation, Rourkela Ranchi transport rate"
      canonical="/fare-calculator"
      breadcrumbs={[{ name: "Fare Calculator", url: "/fare-calculator" }]}
    />
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-background dark:from-orange-950/10 dark:to-background">
      {/* Hero */}
      <section className="pt-24 pb-16 px-6 sm:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Free Freight Cost Estimator
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
            Estimate Your{" "}
            <span className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              Shipping Cost
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Get instant fare estimates for any route in India. Powered by real market data from thousands of completed shipments.
          </p>
        </div>
      </section>

      {/* Calculator Card */}
      <section className="px-6 sm:px-12 pb-20">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-orange-100 dark:border-orange-900/30 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-orange-500 to-orange-400" />
            <CardHeader className="bg-orange-50/50 dark:bg-orange-900/10 px-6 sm:px-8 pt-6 pb-4">
              <CardTitle className="flex items-center gap-2 text-xl font-black text-gray-900 dark:text-white">
                <IndianRupee className="h-5 w-5 text-orange-600" />
                Calculate Freight Cost
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 sm:px-8 py-6 space-y-5">
              {/* Origin */}
              <div className="space-y-2">
                <Label htmlFor="origin" className="text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-orange-500" />
                  Pickup City
                </Label>
                <Input
                  id="origin"
                  placeholder="e.g. Mumbai, Delhi, Chennai"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-12 text-base border-orange-200 dark:border-orange-800 focus-visible:ring-orange-500"
                />
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination" className="text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-500" />
                  Delivery City
                </Label>
                <Input
                  id="destination"
                  placeholder="e.g. Bangalore, Kolkata, Hyderabad"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-12 text-base border-orange-200 dark:border-orange-800 focus-visible:ring-orange-500"
                />
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                  <Weight className="h-3.5 w-3.5 text-green-500" />
                  Cargo Weight (Tonnes)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="e.g. 5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-12 text-base border-orange-200 dark:border-orange-800 focus-visible:ring-orange-500"
                />
              </div>

              {/* Calculate Button */}
              <Button
                onClick={calculateFare}
                disabled={loading || !origin.trim() || !destination.trim() || !weight}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <IndianRupee className="mr-2 h-5 w-5" />
                    Estimate Fare
                  </>
                )}
              </Button>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <Card className="mt-6 shadow-xl border-green-100 dark:border-green-900/30 overflow-hidden animate-fade-in-up">
              <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-400" />
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">Estimated Fare</h3>
                  <div className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full ${
                    result.trend === "rising"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : result.trend === "falling"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}>
                    {result.trend === "rising" ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : result.trend === "falling" ? (
                      <TrendingDown className="h-3.5 w-3.5" />
                    ) : (
                      <Minus className="h-3.5 w-3.5" />
                    )}
                    Market {result.trend}
                  </div>
                </div>

                {/* Main Price */}
                <div className="text-center mb-6">
                  <p className="text-5xl sm:text-6xl font-black text-orange-600 dark:text-orange-400">
                    ₹{result.totalEstimate.toLocaleString("en-IN")}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    for {weight} tonnes · ₹{result.avgPerTonne.toLocaleString("en-IN")}/tonne
                  </p>
                </div>

                {/* Range */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-100 dark:border-green-800">
                    <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">Low End</p>
                    <p className="text-2xl font-black text-green-700 dark:text-green-300">₹{result.minPrice.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-green-600/60 dark:text-green-400/60">per tonne</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center border border-red-100 dark:border-red-800">
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">High End</p>
                    <p className="text-2xl font-black text-red-700 dark:text-red-300">₹{result.maxPrice.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-red-600/60 dark:text-red-400/60">per tonne</p>
                  </div>
                </div>

                {/* Data info */}
                {result.dataPoints > 0 && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-6">
                    <Info className="h-3.5 w-3.5" />
                    Based on {result.dataPoints} recent shipment{result.dataPoints !== 1 ? "s" : ""} on this route
                  </div>
                )}

                {/* CTA */}
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Ready to ship? Get matched with verified truckers instantly.
                  </p>
                  <Link to="/register">
                    <Button className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 h-12 px-8 text-base font-bold shadow-lg">
                      Post This Shipment <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quote Lead Card — shown after estimate is generated */}
          {result && (
            <QuoteLeadCard
              origin={origin.trim()}
              destination={destination.trim()}
              weight={Number(weight)}
              avgPrice={result.avgPrice}
              route={`${origin.trim()} → ${destination.trim()}`}
            />
          )}

          {/* Info Cards */}
          <div className="grid sm:grid-cols-3 gap-4 mt-10">
            {[
              { icon: Truck, title: "10,000+ Routes", desc: "Fare data across all major Indian corridors" },
              { icon: TrendingUp, title: "Real-Time Pricing", desc: "Updated daily with actual transaction data" },
              { icon: IndianRupee, title: "No Hidden Costs", desc: "Transparent estimates, what you see is what you pay" },
            ].map((item) => (
              <div key={item.title} className="text-center p-5 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-orange-100 dark:border-orange-900/20">
                <div className="bg-orange-100 dark:bg-orange-900/30 w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <item.icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{item.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
