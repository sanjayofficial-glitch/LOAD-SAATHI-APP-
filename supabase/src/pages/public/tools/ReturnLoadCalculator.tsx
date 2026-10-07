
import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Loader2, MapPin, Fuel, RotateCcw, Info, IndianRupee, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SeoMeta from "@/components/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { geocodeCity } from "@/utils/geocode";
import { getRoute } from "@/utils/osrm";

interface ReturnLoadResult {
  deliveryKm: number;
  emptyKm: number;
  returnKm: number;
  fuelCostEstimate: number;
  potentialRevenue: number;
  savingsPercent: number;
  deliveryTransit: number;
  returnTransit: number;
}

const DIESEL_RATE_PER_LITER = 95;
const TRUCK_MPG = 4;

export default function ReturnLoadCalculator() {
  const [delOrigin, setDelOrigin] = useState("");
  const [delDest, setDelDest] = useState("");
  const [retOrigin, setRetOrigin] = useState("");
  const [retDest, setRetDest] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReturnLoadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async () => {
    if (!delOrigin.trim() || !delDest.trim()) {
      setError("Please fill in at least the delivery route (origin and destination).");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Delivery route
      const [dO, dD] = await Promise.all([
        geocodeCity(delOrigin.trim()),
        geocodeCity(delDest.trim()),
      ]);
      if (!dO || !dD) throw new Error("Could not locate delivery cities. Please check spelling.");
      const deliveryRoute = await getRoute(dO.lon, dO.lat, dD.lon, dD.lat);
      if (!deliveryRoute) throw new Error("Could not calculate delivery route.");

      let returnKm = 0;
      let returnTransit = 0;

      if (retOrigin.trim() && retDest.trim()) {
        // Explicit return route
        const [rO, rD] = await Promise.all([
          geocodeCity(retOrigin.trim()),
          geocodeCity(retDest.trim()),
        ]);
        if (rO && rD) {
          const returnRoute = await getRoute(rO.lon, rO.lat, rD.lon, rD.lat);
          if (returnRoute) {
            returnKm = returnRoute.distance_km;
            returnTransit = returnRoute.duration_min;
          }
        }
      }

      // If no explicit return route, estimate empty distance = delivery distance (truck returns empty along same corridor)
      if (returnKm === 0) {
        returnKm = deliveryRoute.distance_km;
      }

      const emptyKm = Math.abs(deliveryRoute.distance_km - returnKm);
      const totalKm = deliveryRoute.distance_km + returnKm;
      const fuelLiters = totalKm / TRUCK_MPG;
      const fuelCost = Math.round(fuelLiters * DIESEL_RATE_PER_LITER);

      // Rough potential revenue: ₹8–15 per km for return loads (conservative middle)
      const potentialRevenue = Math.round(returnKm * 11);
      const savingsPercent = totalKm > 0 ? Math.round((emptyKm / totalKm) * 100) : 0;

      setResult({
        deliveryKm: deliveryRoute.distance_km,
        emptyKm,
        returnKm,
        fuelCostEstimate: fuelCost,
        potentialRevenue,
        savingsPercent,
        deliveryTransit: deliveryRoute.duration_min,
        returnTransit,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not calculate return load. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [delOrigin, delDest, retOrigin, retDest]);

  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h2>Return Load Calculator India — LoadSaathi</h2>
          <p>Calculate how many empty kilometres your truck drives on the return journey and estimate the revenue you could earn by finding a return load. Reducing empty miles saves fuel, cuts costs, and increases truck utilisation.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Return Load Calculator India | Estimate Empty Miles & Revenue"
        description="Calculate empty kilometres, fuel cost, and potential return-load revenue for your truck route. Reduce empty miles and increase truck utilisation with LoadSaathi."
        keywords="return load calculator, empty miles calculator, backhaul calculator India, truck empty return trip, find return load revenue"
        canonical="/tools/return-load-calculator"
        breadcrumbs={[{ name: "Return Load Calculator", url: "/tools/return-load-calculator" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "LoadSaathi Return Load Calculator",
            "url": "https://loadsaathi.in/tools/return-load-calculator",
            "applicationCategory": "BusinessApplication",
            "description": "Calculate empty kilometres, fuel cost, and potential return-load revenue for your truck routes in India.",
          },
          {
            "@context": "https://schema.org",
            "@type": "QAPage",
            "mainEntity": {
              "@type": "Question",
              "name": "How do you calculate return load revenue and empty miles?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "To calculate return load revenue, subtract the return-route distance from the delivery distance. The difference is your empty kilometres. Multiply total kilometres by fuel consumption and diesel rate to estimate fuel cost. Potential return-load revenue is estimated at ₹8–15 per km depending on route and cargo type. Use LoadSaathi's return load calculator above for an instant estimate on your specific route.",
              },
            },
          },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to LoadSaathi
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-black mb-4 text-foreground">Return Load Calculator</h1>
            <p className="text-lg text-muted-foreground mb-2">
              Every empty kilometre a truck drives is lost revenue and wasted fuel. Calculate how many empty kilometres your return trip involves and how much you could earn by finding a return load.
            </p>
            <p className="text-sm text-muted-foreground">
              Return loads reduce empty miles, cut fuel costs, and increase truck utilisation — directly improving your bottom line.
            </p>
          </div>

          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-orange-400" /> Delivery Route
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">From (Origin)</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={delOrigin} onChange={(e) => setDelOrigin(e.target.value)} placeholder="e.g. Rourkela" className="pl-9" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">To (Destination)</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={delDest} onChange={(e) => setDelDest(e.target.value)} placeholder="e.g. Kolkata" className="pl-9" />
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-2 mb-4">
                  <ArrowRight className="h-3 w-3 text-orange-400" /> Return Route (optional — defaults to same delivery route in reverse)
                </CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">From</Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={retOrigin} onChange={(e) => setRetOrigin(e.target.value)} placeholder="e.g. Kolkata" className="pl-9" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">To</Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={retDest} onChange={(e) => setRetDest(e.target.value)} placeholder="e.g. Rourkela" className="pl-9" />
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={calculate} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                Calculate Return Load
              </Button>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </CardContent>
          </Card>

          {result && (
            <Card className="mt-6 glass-card border-green-700/30">
              <CardContent className="p-6 space-y-5">
                <p className="text-xs text-green-300 uppercase tracking-wider font-semibold">Return Load Analysis</p>

                {/* Route overview */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                  <span className="font-semibold text-foreground">{delOrigin}</span>
                  <ArrowRight className="h-3 w-3 text-orange-400" />
                  <span className="font-semibold text-foreground">{delDest}</span>
                  {retOrigin && retDest && (
                    <>
                      <span className="mx-1 text-muted-foreground">→</span>
                      <span className="font-semibold text-foreground">{retOrigin}</span>
                      <ArrowRight className="h-3 w-3 text-orange-400" />
                      <span className="font-semibold text-foreground">{retDest}</span>
                    </>
                  )}
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-green-900/10 border border-green-700/20">
                  <div className="text-center">
                    <Route className="h-4 w-4 mx-auto text-green-400 mb-1" />
                    <p className="text-2xl font-black text-green-400">{result.deliveryKm}</p>
                    <p className="text-xs text-muted-foreground">delivery km</p>
                  </div>
                  <div className="text-center">
                    <RotateCcw className="h-4 w-4 mx-auto text-orange-400 mb-1" />
                    <p className="text-2xl font-black text-orange-400">{result.returnKm}</p>
                    <p className="text-xs text-muted-foreground">return km</p>
                  </div>
                  <div className="text-center">
                    <MapPin className="h-4 w-4 mx-auto text-red-400 mb-1" />
                    <p className="text-2xl font-black text-red-400">{result.emptyKm}</p>
                    <p className="text-xs text-muted-foreground">empty km</p>
                  </div>
                </div>

                {/* Financials */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-orange-900/10 border border-orange-700/20 space-y-1">
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-orange-400" />
                      <p className="text-xs text-muted-foreground font-semibold">Fuel Cost (est.)</p>
                    </div>
                    <p className="text-2xl font-black text-orange-400">₹{result.fuelCostEstimate.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Diesel ₹{DIESEL_RATE_PER_LITER}/L · ~{TRUCK_MPG} km/L</p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-900/20 border border-green-700/30 space-y-1">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-green-400" />
                      <p className="text-xs text-muted-foreground font-semibold">Potential Return Revenue</p>
                    </div>
                    <p className="text-2xl font-black text-green-400">₹{result.potentialRevenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">~₹11/km estimate · varies by route & cargo</p>
                  </div>
                </div>

                {/* Utilisation insight */}
                <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-700/20 space-y-2">
                  <p className="text-sm font-bold text-foreground">Truck Utilisation Insight</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.max(0, 100 - result.savingsPercent)}%` }} />
                    </div>
                    <span className="text-sm font-bold text-green-400">{Math.max(0, 100 - result.savingsPercent)}% utilised</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {result.emptyKm > 0
                      ? `${result.emptyKm} empty km on the return leg. Finding a return load could save ₹${Math.round(result.potentialRevenue * 0.8).toLocaleString()} in fuel costs.`
                      : "Your return route covers the full distance — no empty miles detected."}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="h-3 w-3 shrink-0" />
                  <span>Estimates based on OSRM routing, diesel rate ₹{DIESEL_RATE_PER_LITER}/L, and ~{TRUCK_MPG} km/L. Actual costs vary by truck, terrain, load, and market conditions.</span>
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link to="/return-load" className="flex-1">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">Browse Return Loads</Button>
                  </Link>
                  <Link to="/register?type=trucker" className="flex-1">
                    <Button variant="outline" className="w-full font-bold">Sign Up as Trucker</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-10 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Learn more about empty miles</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/return-load">
                <Button variant="outline" className="text-xs font-bold">What Are Return Loads?</Button>
              </Link>
              <Link to="/tools/freight-rate-calculator">
                <Button variant="outline" className="text-xs font-bold">Freight Rate Calculator</Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" className="text-xs font-bold">Find Loads Now</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
