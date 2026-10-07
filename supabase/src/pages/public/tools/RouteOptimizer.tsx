import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, MapPin, Route, TrendingDown, Info, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SeoMeta from "@/components/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { geocodeCity } from "@/utils/geocode";
import { optimizeRoute, type Waypoint, getRoute } from "@/utils/osrm";
import { trackEstimateGenerated } from "@/utils/analytics";

interface OptimizeResult {
  originalOrder: Waypoint[];
  optimizedOrder: Waypoint[];
  originalDistanceKm: number;
  optimizedDistanceKm: number;
  originalDurationMin: number;
  optimizedDurationMin: number;
  savingsKm: number;
  savingsPercent: number;
}

export default function RouteOptimizer() {
  const [origin, setOrigin] = useState("");
  const [stops, setStops] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");

  const updateStop = (idx: number, value: string) => {
    setStops(prev => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const calculate = useCallback(async () => {
    if (!origin.trim()) {
      setError("Please enter an origin city.");
      return;
    }
    const filledStops = stops.filter(s => s.trim());
    if (filledStops.length < 1) {
      setError("Please enter at least one destination stop.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress("Geocoding locations...");

    try {
      const allCities = [origin.trim(), ...filledStops] as string[];
      const coords: { city: string; lat: number; lon: number }[] = [];

      for (let i = 0; i < allCities.length; i++) {
        setProgress(`Geocoding stop ${i + 1} of ${allCities.length}: ${allCities[i]}...`);
        const c = await geocodeCity(allCities[i]!);
        if (!c) {
          throw new Error(`Could not locate "${allCities[i]!}". Please check spelling.`);
        }
        coords.push({ city: allCities[i]!, lat: c.lat, lon: c.lon });
      }

      const waypoints: Waypoint[] = coords.map(c => ({ lat: c.lat, lng: c.lon, label: c.city }));

      setProgress("Optimizing route sequence...");
      const optimized = await optimizeRoute(waypoints);

      if (!optimized) {
        throw new Error("Could not calculate optimized route. OSRM may be unavailable.");
      }

      const originalDistance = waypoints.length > 1
        ? await computeSequentialDistance(waypoints)
        : 0;
      const originalDuration = waypoints.length > 1
        ? await computeSequentialDuration(waypoints)
        : 0;

      const savingsKm = Math.max(0, Math.round((originalDistance - optimized.totalDistanceKm) * 10) / 10);
      const savingsPercent = originalDistance > 0 ? Math.round((savingsKm / originalDistance) * 100) : 0;

      setResult({
        originalOrder: waypoints,
        optimizedOrder: optimized.waypoints,
        originalDistanceKm: Math.round(originalDistance * 10) / 10,
        optimizedDistanceKm: optimized.totalDistanceKm,
        originalDurationMin: originalDuration,
        optimizedDurationMin: optimized.totalDurationMin,
        savingsKm,
        savingsPercent,
      });

      trackEstimateGenerated({
        origin: origin.trim(),
        destination: filledStops.join(", "),
        route: `${origin.trim()} → ${filledStops.length} stops`,
        weight: 0,
        avg_price: 0,
        min_price: 0,
        max_price: 0,
        source: "market_data",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not optimize route. Please try again.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  }, [origin, stops]);

  async function computeSequentialDistance(wps: Waypoint[]): Promise<number> {
    let total = 0;
    for (let i = 0; i < wps.length - 1; i++) {
      const wp = wps[i]!;
      const next = wps[i + 1]!;
      const seg = await getRoute(wp.lng, wp.lat, next.lng, next.lat);
      if (seg) total += seg.distance_km;
    }
    return total;
  }

  async function computeSequentialDuration(wps: Waypoint[]): Promise<number> {
    let total = 0;
    for (let i = 0; i < wps.length - 1; i++) {
      const wp = wps[i]!;
      const next = wps[i + 1]!;
      const seg = await getRoute(wp.lng, wp.lat, next.lng, next.lat);
      if (seg) total += seg.duration_min;
    }
    return total;
  }

  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h2>Multi-Stop Route Optimizer — LoadSaathi</h2>
          <p>Optimize your multi-stop truck route with our AI-powered route sequencing tool. Enter your origin and up to 6 destination stops to find the most efficient order that minimizes distance and fuel costs.</p>
          <h2>How Route Optimization Works</h2>
          <p>Our algorithm uses nearest-neighbor heuristics to reorder your stops, reducing empty kilometres and total trip distance. For 7 stops, optimization typically saves 15-30% on route distance compared to visiting stops in the order you entered them.</p>
          <h2>Benefits</h2>
          <ul>
            <li>Reduce fuel costs by up to 30%</li>
            <li>Save time on long-haul routes</li>
            <li>Lower CO2 emissions per trip</li>
            <li>Increase truck utilisation</li>
          </ul>
        </div>
      </noscript>
      <SeoMeta
        title="Multi-Stop Route Optimizer India | Reduce Empty Kilometres"
        description="Optimize multi-stop truck routes in India. Reduce distance, fuel costs, and emissions with AI-powered route sequencing. Enter origin and up to 6 stops."
        keywords="route optimizer India, multi-stop route planner, truck route optimization, reduce empty km, logistics route planner"
        canonical="/tools/route-optimizer"
        breadcrumbs={[{ name: "Route Optimizer", url: "/tools/route-optimizer" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "LoadSaathi Route Optimizer",
            "url": "https://loadsaathi.in/tools/route-optimizer",
            "applicationCategory": "BusinessApplication",
            "description": "AI-powered multi-stop route optimizer for Indian truckers. Reduce distance, fuel costs, and CO2 emissions.",
          },
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "How to optimize a multi-stop truck route",
            "description": "Step-by-step guide to using LoadSaathi's route optimizer",
            "step": [
              { "@type": "HowToStep", "name": "Enter origin", "text": "Type your starting city in the origin field." },
              { "@type": "HowToStep", "name": "Add stops", "text": "Add up to 6 destination cities in the stop fields." },
              { "@type": "HowToStep", "name": "Calculate", "text": "Click Optimize Route to get the best sequence and distance savings." },
            ],
          },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to LoadSaathi
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-black mb-4 text-foreground">Route Optimizer</h1>
            <p className="text-lg text-muted-foreground mb-2">
              Plan multi-stop trips smarter. Enter your origin and up to 6 stops to find the optimal sequence that saves distance, fuel, and time.
            </p>
            <p className="text-sm text-muted-foreground">
              Powered by nearest-neighbor heuristic and live OSRM road routing.
            </p>
          </div>

          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Navigation className="h-5 w-5 text-orange-400" /> Route Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Origin City</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="e.g. Rourkela" className="pl-9" />
                </div>
              </div>

              {stops.map((stop, idx) => (
                <div key={idx}>
                  <Label className="text-sm font-semibold text-muted-foreground">Stop {idx + 1}</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={stop} onChange={(e) => updateStop(idx, e.target.value)} placeholder={`e.g. ${["Ranchi", "Jamshedpur", "Bhubaneswar", "Kolkata", "Sambalpur", "Cuttack"][idx] || "City name"}`} className="pl-9" />
                  </div>
                </div>
              ))}

              <Button onClick={calculate} disabled={loading || !origin.trim() || stops.every(s => !s.trim())} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {progress || "Optimizing..."}</> : <><Navigation className="h-4 w-4 mr-2" /> Optimize Route</>}
              </Button>
              {loading && progress && <p className="text-xs text-muted-foreground text-center">{progress}</p>}
              {error && <p className="text-sm text-red-400">{error}</p>}
            </CardContent>
          </Card>

          {result && (
            <Card className="mt-6 glass-card border-green-700/30">
              <CardContent className="p-6 space-y-5">
                <p className="text-xs text-green-300 uppercase tracking-wider font-semibold">Optimization Results</p>

                <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-green-900/10 border border-green-700/20">
                  <div className="text-center">
                    <Route className="h-4 w-4 mx-auto text-green-400 mb-1" />
                    <p className="text-2xl font-black text-green-400">{result.optimizedDistanceKm} km</p>
                    <p className="text-xs text-muted-foreground">optimized</p>
                  </div>
                  <div className="text-center">
                    <TrendingDown className="h-4 w-4 mx-auto text-orange-400 mb-1" />
                    <p className="text-2xl font-black text-orange-400">{result.savingsKm} km</p>
                    <p className="text-xs text-muted-foreground">saved</p>
                  </div>
                  <div className="text-center">
                    <Info className="h-4 w-4 mx-auto text-blue-400 mb-1" />
                    <p className="text-2xl font-black text-blue-400">{result.savingsPercent}%</p>
                    <p className="text-xs text-muted-foreground">reduction</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-orange-900/10 border border-orange-700/20">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Original Route</p>
                    <p className="text-lg font-black text-orange-400">{result.originalDistanceKm} km</p>
                    <p className="text-xs text-muted-foreground">{Math.round(result.originalDurationMin)} min</p>
                    <p className="text-xs text-muted-foreground mt-1">{result.originalOrder.map(w => w.label || "").filter(Boolean).join(" → ")}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-900/10 border border-green-700/20">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Optimized Route</p>
                    <p className="text-lg font-black text-green-400">{result.optimizedDistanceKm} km</p>
                    <p className="text-xs text-muted-foreground">{result.optimizedDurationMin} min</p>
                    <p className="text-xs text-muted-foreground mt-1">{result.optimizedOrder.map(w => w.label || "").filter(Boolean).join(" → ")}</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Estimates based on OSRM road routing. Actual distances may vary due to road closures, traffic, and local restrictions.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link to="/register" className="flex-1">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">Book This Route</Button>
                  </Link>
                  <Link to="/tools/freight-rate-calculator" className="flex-1">
                    <Button variant="outline" className="w-full font-bold">Estimate Freight Cost</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-10 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Related tools</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/tools/return-load-calculator">
                <Button variant="outline" className="text-xs font-bold">Return Load Calculator</Button>
              </Link>
              <Link to="/tools/freight-rate-calculator">
                <Button variant="outline" className="text-xs font-bold">Freight Rate Calculator</Button>
              </Link>
              <Link to="/tools/fare-calculator">
                <Button variant="outline" className="text-xs font-bold">Fare Calculator</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
