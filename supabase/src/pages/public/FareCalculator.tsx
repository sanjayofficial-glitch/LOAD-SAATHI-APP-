import { useState, useCallback, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Truck, ArrowRight, IndianRupee, TrendingUp, TrendingDown, Minus, Loader2, MapPin, Weight, Sparkles, Info, Fuel, Route, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SeoMeta from "@/components/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { posthog } from "@/utils/posthog";
import QuoteLeadCard from "@/components/QuoteLeadCard";
import VehicleRateCard, { VEHICLE_RATES } from "@/components/VehicleRateCard";
import { trackCalculatorStarted, trackEstimateGenerated } from "@/utils/analytics";
import PriceTrendChart from "@/components/PriceTrendChart";
import { routes } from "@/data/routes";
import distancesData from "@/data/distances.json";

interface BreakdownItem {
  label: string;
  value: number;
  detail?: string;
}

interface FareResult {
  avgPrice: number;
  minPrice: number;
  maxProduct: number;
  totalEstimate: number;
  trend: "rising" | "falling" | "stable";
  dataPoints: number;
  avgPerTonne: number;
  fuelSurcharge?: number;
  returnFactor?: number;
  perKmRate?: number;
  breakdown?: BreakdownItem[];
  dieselPrice?: number;
  provider?: string;
}

const VEHICLE_OPTIONS = VEHICLE_RATES.map((v) => ({ value: v.vehicleType, label: v.label }));

interface DistanceEntry {
  distanceKm: number;
  transitHours: number;
  highway?: string;
}

const DISTANCES: Record<string, DistanceEntry> = (distancesData as { routes: Record<string, DistanceEntry> }).routes;

function lookupDistanceKm(from: string, to: string): number | null {
  const a = from.trim().toLowerCase();
  const b = to.trim().toLowerCase();
  if (!a || !b || a === b) return null;
  const route = routes.find(
    (r) =>
      (r.from.toLowerCase() === a && r.to.toLowerCase() === b) ||
      (r.from.toLowerCase() === b && r.to.toLowerCase() === a)
  );
  if (route?.distanceKm) return route.distanceKm;
  const leg = DISTANCES[`${a}-${b}`] ?? DISTANCES[`${b}-${a}`];
  return leg?.distanceKm ?? null;
}

function buildStaticFallback(
  from: string,
  to: string,
  weightTonnes: number,
  vehicleClass: string,
  shipmentMode: "ftl" | "ptl"
): FareResult | null {
  const km = lookupDistanceKm(from, to);
  if (!km || !(weightTonnes > 0)) return null;
  const vehicle =
    (vehicleClass ? VEHICLE_RATES.find((v) => v.vehicleType === vehicleClass) : undefined) ??
    VEHICLE_RATES.find((v) => v.capacityTonnes >= weightTonnes) ??
    VEHICLE_RATES[VEHICLE_RATES.length - 1]!;
  const ftl = km * vehicle.ratePerKm;
  let total = ftl;
  if (shipmentMode === "ptl" && weightTonnes < vehicle.capacityTonnes) {
    const share = (weightTonnes / vehicle.capacityTonnes) * 1.25;
    total = Math.max(500, ftl * share);
  }
  const minTotal = total * 0.85;
  const maxTotal = total * 1.2;
  const perTonne = total / weightTonnes;
  return {
    avgPrice: perTonne,
    minPrice: minTotal / weightTonnes,
    maxProduct: maxTotal / weightTonnes,
    totalEstimate: total,
    trend: "stable",
    dataPoints: 0,
    avgPerTonne: perTonne,
    provider: "estimate",
  };
}

export default function FareCalculator() {
  const [searchParams] = useSearchParams();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [weight, setWeight] = useState("");
  const [vehicleClass, setVehicleClass] = useState("");
  const [shipmentMode, setShipmentMode] = useState<"ftl" | "ptl">("ftl");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FareResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const applyStaticFallback = useCallback((): boolean => {
    const weightNum = Number(weight);
    const fallback = buildStaticFallback(origin.trim(), destination.trim(), weightNum, vehicleClass, shipmentMode);
    if (!fallback) return false;
    setResult(fallback);
    posthog.capture("fare_estimated", {
      weight_tonnes: weightNum,
      recommended_price_per_tonne: fallback.avgPerTonne,
      historical_loads: 0,
      estimate_source: "static_estimate",
      vehicle_class: vehicleClass || "default",
      shipment_mode: shipmentMode,
      fuel_surcharge: 0,
      diesel_price: null,
    });
    trackEstimateGenerated({
      origin: origin.trim(),
      destination: destination.trim(),
      route: `${origin.trim()} → ${destination.trim()}`,
      weight: weightNum,
      avg_price: fallback.avgPerTonne,
      min_price: fallback.minPrice,
      max_price: fallback.maxProduct,
      source: "fallback",
    });
    return true;
  }, [origin, destination, weight, vehicleClass, shipmentMode]);

  const calculateFare = useCallback(async () => {
    if (!origin.trim() || !destination.trim() || !weight || Number(weight) <= 0) {
      setError("Please fill in all required fields");
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
          vehicleClass: vehicleClass || undefined,
          shipmentMode,
          includeFuelSurcharge: true,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const httpErr = new Error(`HTTP_${response.status}`) as Error & { status?: number };
        httpErr.status = response.status;
        throw httpErr;
      }

      const data = await response.json();
      const weightNum = Number(weight);
      const recommended = data.recommendedPrice || 0;

      setResult({
        avgPrice: recommended,
        minPrice: data.range?.min || 0,
        maxProduct: data.range?.max || 0,
        totalEstimate: recommended * weightNum,
        trend: data.trend || "stable",
        dataPoints: data.historicalLoads || 0,
        avgPerTonne: recommended,
        fuelSurcharge: data.fuelSurcharge,
        returnFactor: data.returnFactor,
        perKmRate: data.perKmRate,
        breakdown: data.breakdown
          ? Object.entries(data.breakdown).map(([k, v]) => ({
              label: k.charAt(0).toUpperCase() + k.slice(1),
              value: Number(v),
            }))
          : undefined,
        dieselPrice: data.dieselPrice,
        provider: data.provider,
      });

      posthog.capture("fare_estimated", {
        weight_tonnes: weightNum,
        recommended_price_per_tonne: recommended,
        historical_loads: data.historicalLoads || 0,
        estimate_source: data.provider || "market_data",
        vehicle_class: vehicleClass || "default",
        shipment_mode: shipmentMode,
        fuel_surcharge: data.fuelSurcharge || 0,
        diesel_price: data.dieselPrice || null,
      });
      trackEstimateGenerated({
        origin: origin.trim(),
        destination: destination.trim(),
        route: `${origin.trim()} → ${destination.trim()}`,
        weight: weightNum,
        avg_price: recommended,
        min_price: data.range?.min || 0,
        max_price: data.range?.max || 0,
        source: data.provider || "market_data",
      });
    } catch (err) {
      posthog.capture("fare_estimate_failed", {
        origin: origin.trim(),
        destination: destination.trim(),
        error: (err as Error).message,
      });

      if (applyStaticFallback()) {
        setError(null);
        return;
      }

      const status = (err as { status?: number }).status;
      if (status === 429) {
        setError("Rate limit reached — please wait a minute and try again.");
      } else if (status === 401) {
        setError("Sign-in issue with the pricing service. Please try again in a moment.");
      } else if (err instanceof DOMException && (err.name === "TimeoutError" || err.name === "AbortError")) {
        setError("The request timed out. Please try again.");
      } else if (err instanceof TypeError) {
        setError("Network error — check your connection and try again.");
      } else if ((err as Error).message === "Service unavailable") {
        setError("Service temporarily unavailable. Please try again later.");
      } else {
        setError("Unable to calculate fare. Please try again or contact support.");
      }
    } finally {
      setLoading(false);
    }
  }, [origin, destination, weight, vehicleClass, shipmentMode, applyStaticFallback]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") calculateFare();
  };

  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px', fontFamily: 'system-ui' }}>
          <h1>AI Fare Calculator — Get Instant Freight Estimates</h1>
          <p>LoadSaathi's AI-powered fare calculator provides accurate freight cost estimates in real-time. Enter your route and cargo details to get instant pricing with market intelligence, historical trends, and a fairness index.</p>
          <h2>How to Use the Fare Calculator</h2>
          <ol>
            <li><strong>Select Route:</strong> Choose origin and destination cities.</li>
            <li><strong>Enter Cargo Details:</strong> Provide weight in tonnes, select vehicle type, and choose FTL or PTL shipment mode.</li>
            <li><strong>Click Calculate:</strong> Get instant AI-powered price estimate with fare breakdown including fuel surcharge, return-leg factor, tolls, and driver bhatta.</li>
          </ol>
          <h2>What the Estimate Includes</h2>
          <ul>
            <li>Fair price estimate based on market rates and historical data</li>
            <li>Confidence level (Low, Medium, High)</li>
            <li>Rate per kilometer and rate per tonne</li>
            <li>Fuel surcharge based on live Odisha diesel prices</li>
            <li>Return-leg factor for empty-truck backhaul</li>
            <li>Toll and driver bhatta estimates</li>
            <li>Historical price trends for the route</li>
          </ul>
          <h2>Vehicle Types Supported</h2>
          <ul>
            <li>Mini Truck (0.75T) — ₹26/km</li>
            <li>Pickup (1.5T) — ₹28/km</li>
            <li>14ft Truck (5T) — ₹32/km</li>
            <li>17ft Truck (7T) — ₹40/km</li>
            <li>22ft Truck (12T) — ₹52/km</li>
            <li>Container Truck (16T) — ₹68/km</li>
            <li>Trailer (25T) — ₹82/km</li>
          </ul>
          <h2>Frequently Asked Questions</h2>
          <h3>How accurate is the AI fare estimate?</h3>
          <p>Our AI analyzes market rates, fuel costs, seasonal demand, and historical data. Rates are benchmarked against TruckGuru and CRISIL data.</p>
          <h3>Is the fare calculator free?</h3>
          <p>Yes. The AI fare calculator is completely free to use. No registration required.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Freight Fare Calculator — Estimate PTL/LTL Rates"
        description="Calculate estimated freight rates for PTL and LTL shipments across India. AI-powered fare estimates with vehicle-specific per-km rates, fuel surcharge, and live diesel prices."
        keywords="freight fare calculator India, PTL LTL rate calculator, truck freight cost estimation, vehicle rate card"
        canonical="/tools/fare-calculator"
        breadcrumbs={[{ name: "Fare Calculator", url: "/tools/fare-calculator" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "LoadSaathi Freight Fare Calculator",
            "url": "https://loadsaathi.in/tools/fare-calculator",
            "description": "AI-powered freight fare calculator for PTL and LTL shipments across India. Get instant estimates with vehicle-specific rates, fuel surcharge, and live diesel prices.",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "INR",
              "description": "Free to use"
            },
            "creator": {
              "@type": "Organization",
              "name": "LoadSaathi",
              "url": "https://loadsaathi.in"
            },
            "featureList": [
              "AI-powered price prediction",
              "Vehicle-specific rate cards",
              "Fuel surcharge calculation",
              "Live diesel prices",
              "PTL and FTL support"
            ]
          },
          {
            "@context": "https://schema.org",
            "@type": "QAPage",
            "mainEntity": {
              "@type": "Question",
              "name": "How do I estimate freight charges for PTL or LTL shipment?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Enter your origin city, destination city, cargo weight, and vehicle type in LoadSaathi's fare calculator. It uses AI to estimate PTL/LTL rates based on distance, weight, fuel surcharge, and live diesel prices. Typical PTL rates are ₹8–20 per kg depending on the route and cargo type."
              }
            }
          }
        ]}
      />
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-background dark:from-orange-950/10 dark:to-background">
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

              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-purple-500" />
                  Vehicle Type
                </Label>
                <Select value={vehicleClass} onValueChange={setVehicleClass}>
                  <SelectTrigger className="h-12 text-base border-orange-200 dark:border-orange-800 focus:ring-orange-500">
                    <SelectValue placeholder="Select a vehicle (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                  <Route className="h-3.5 w-3.5 text-indigo-500" />
                  Shipment Mode
                </Label>
                <Tabs value={shipmentMode} onValueChange={(v) => setShipmentMode(v as "ftl" | "ptl")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-12">
                    <TabsTrigger value="ftl" className="text-base font-bold">Full Truckload (FTL)</TabsTrigger>
                    <TabsTrigger value="ptl" className="text-base font-bold">Partial Truckload (PTL)</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

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

          {result && (
            <>
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

                  <div className="text-center mb-6">
                    <p className="text-5xl sm:text-6xl font-black text-orange-600 dark:text-orange-400">
                      ₹{result.totalEstimate.toLocaleString("en-IN")}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      for {weight} tonnes · ₹{result.avgPerTonne.toLocaleString("en-IN")}/tonne
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-100 dark:border-green-800">
                      <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">Low End</p>
                      <p className="text-2xl font-black text-green-700 dark:text-green-300">₹{result.minPrice.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-green-600/60 dark:text-green-400/60">per tonne</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center border border-red-100 dark:border-red-800">
                      <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">High End</p>
                      <p className="text-2xl font-black text-red-700 dark:text-red-300">₹{result.maxProduct.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-red-600/60 dark:text-red-400/60">per tonne</p>
                    </div>
                  </div>

                  {/* Diesel Badge & Provider */}
                  <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
                    {result.dieselPrice && (
                      <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full text-xs font-medium">
                        <Fuel className="h-3.5 w-3.5" />
                        Diesel: ₹{result.dieselPrice.toFixed(2)}/L (Odisha)
                      </div>
                    )}
                    {result.provider && (
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full text-xs font-medium">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Data: {result.provider}
                      </div>
                    )}
                  </div>

                  {/* Breakdown */}
                  {result.breakdown && result.breakdown.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                        <Info className="h-4 w-4" />
                        Price Breakdown
                      </h4>
                      <div className="space-y-2 text-sm">
                        {result.breakdown.map((item) => (
                          <div key={item.label} className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                            <span className="font-medium text-gray-900 dark:text-white">₹{item.value.toLocaleString("en-IN")}</span>
                          </div>
                        ))}
                      </div>
                      {result.fuelSurcharge !== undefined && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          Fuel surcharge: ₹{result.fuelSurcharge} on base freight
                        </p>
                      )}
                      {result.returnFactor !== undefined && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Return-leg factor: {result.returnFactor}x
                        </p>
                      )}
                      {result.perKmRate !== undefined && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Rate: ₹{result.perKmRate}/km
                        </p>
                      )}
                    </div>
                  )}

                  {result.dataPoints > 0 && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-6">
                      <Info className="h-3.5 w-3.5" />
                      Based on {result.dataPoints} recent shipment{result.dataPoints !== 1 ? "s" : ""} on this route
                    </div>
                  )}

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

              <QuoteLeadCard
                origin={origin.trim()}
                destination={destination.trim()}
                weight={Number(weight)}
                avgPrice={result.avgPrice}
                route={`${origin.trim()} → ${destination.trim()}`}
              />

              <PriceTrendChart origin={origin.trim()} destination={destination.trim()} />

              <div className="mt-12">
                <VehicleRateCard />
              </div>
            </>
          )}

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
