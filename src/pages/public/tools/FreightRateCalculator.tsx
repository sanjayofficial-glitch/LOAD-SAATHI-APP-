
import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Truck, ArrowRight, IndianRupee, Loader2, MapPin, Weight, Info, ArrowLeft, Clock, Route, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SeoMeta from "@/components/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { geocodeCity } from "@/utils/geocode";
import { getRoute } from "@/utils/osrm";

interface FreightResult {
  distanceKm: number;
  transitHours: number;
  freightRange: { min: number; max: number; recommended: number };
  costPerKm: number;
  truckRecommendation: { name: string; capacity: string; type: string };
  shipmentType: "PTL" | "LTL" | "FTL";
  suitability: string;
}

const truckTypes = [
  { min: 0, max: 1, name: "Tata Ace / Mini Truck", capacity: "0.7–1T", type: "Mini Truck" },
  { min: 1, max: 2.5, name: "Tata Intra / Bolero Pik-Up", capacity: "1–2.5T", type: "Pickup" },
  { min: 2.5, max: 5, name: "Tata 407 / Eicher Pro 2049", capacity: "2.5–5T", type: "LCV" },
  { min: 5, max: 10, name: "Tata LPT 1613 / Eicher Pro 3015", capacity: "5–10T", type: "MLCV" },
  { min: 10, max: 16, name: "Tata Signa / Mahindra Blazo X 25", capacity: "10–16T", type: "HCV" },
  { min: 16, max: 999, name: "Tata Prima / Tractor-Trailer", capacity: "16–25T", type: "Trailer" },
];

const shipmentTypes = ["PTL", "LTL", "FTL"] as const;

function getTruckRec(weight: number) {
  return truckTypes.find((t) => weight >= t.min && weight < t.max) ?? truckTypes[truckTypes.length - 1];
}

function getShipmentAdvice(shipmentType: string, weight: number): string {
  if (shipmentType === "FTL") return "FTL (Full Truckload) — dedicated truck for your cargo. Fastest delivery, best for urgent or sensitive shipments.";
  if (shipmentType === "LTL") return "LTL (Less Than Truckload) — share truck space with other shippers. Ideal for small, frequent shipments under 1 tonne.";
  if (weight <= 3) return "PTL is optimal for shipments under 3 tonnes — share truck space at lower cost than FTL.";
  if (weight <= 7) return "PTL or FTL — at this weight, compare rates. PTL is cheaper but 1–2 days slower.";
  return "FTL recommended at this weight — PTL savings diminish above 7 tonnes and transit times increase.";
}

export default function FreightRateCalculator() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [weight, setWeight] = useState("");
  const [truckType, setTruckType] = useState("any");
  const [shipmentType, setShipmentType] = useState<"PTL" | "LTL" | "FTL">("PTL");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FreightResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async () => {
    if (!origin.trim() || !destination.trim() || !weight || Number(weight) <= 0) {
      setError("Please fill in origin, destination, and weight.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const w = Number(weight);

      // Geocode both cities
      const [originCoords, destCoords] = await Promise.all([
        geocodeCity(origin.trim()),
        geocodeCity(destination.trim()),
      ]);
      if (!originCoords || !destCoords) {
        throw new Error("Could not locate one or both cities. Please check spelling.");
      }

      // OSRM route
      const route = await getRoute(originCoords.lon, originCoords.lat, destCoords.lon, destCoords.lat);
      if (!route) {
        throw new Error("Could not calculate route between these cities.");
      }

      // Price-predict
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      let freightRange = { min: 0, max: 0, recommended: 0 };
      if (supabaseUrl) {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/price-predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ originCity: origin.trim(), destinationCity: destination.trim(), weightTonnes: w }),
            signal: AbortSignal.timeout(10000),
          });
          if (response.ok) {
            const data = await response.json();
            freightRange = {
              min: data.range?.min ?? 0,
              max: data.range?.max ?? 0,
              recommended: data.recommendedPrice ?? 0,
            };
          }
        } catch {
          // Price-predict unavailable — use distance-based estimate
          const estPerKm = 15 + w * 2; // rough heuristic
          freightRange = {
            min: Math.round(route.distance_km * estPerKm * 0.8),
            max: Math.round(route.distance_km * estPerKm * 1.3),
            recommended: Math.round(route.distance_km * estPerKm),
          };
        }
      }

      const totalFreight = freightRange.recommended * w;
      const costPerKm = route.distance_km > 0 ? Math.round(totalFreight / route.distance_km) : 0;
      const truckRec = getTruckRec(w);
      const suitability = getShipmentAdvice(shipmentType, w);

      setResult({
        distanceKm: route.distance_km,
        transitHours: Math.round((route.duration_min / 60) * 10) / 10,
        freightRange,
        costPerKm,
        truckRecommendation: { name: truckRec!.name, capacity: truckRec!.capacity, type: truckRec!.type },
        shipmentType,
        suitability,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not calculate freight rate. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [origin, destination, weight, shipmentType]);

  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h1>Freight Rate Calculator India — LoadSaathi</h1>
          <p>Estimate truck freight rates across India. Enter origin, destination, weight, truck type, and shipment type to get distance, cost per km, and estimated freight range.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Freight Rate Calculator India | Estimate Truck Rates & Cost per KM"
        description="Calculate estimated freight rates for PTL, LTL, and FTL shipments across India. Get distance, cost/km, truck recommendation, and freight range."
        keywords="freight rate calculator India, truck rate per km, transport cost calculator, freight charges India, PTL LTL rate estimate"
        canonical="/freight-rate-calculator"
        breadcrumbs={[{ name: "Freight Rate Calculator", url: "/freight-rate-calculator" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "LoadSaathi Freight Rate Calculator",
            "url": "https://loadsaathi.in/freight-rate-calculator",
            "applicationCategory": "BusinessApplication",
            "description": "Estimate freight rates for PTL, LTL, and FTL shipments across India. Calculate cost per km, truck recommendation, and freight range.",
          },
          {
            "@context": "https://schema.org",
            "@type": "QAPage",
            "mainEntity": {
              "@type": "Question",
              "name": "How do you calculate truck freight rates in India?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Truck freight rates in India are calculated based on distance (km), cargo weight (tonnes), truck type, and shipment type (PTL, LTL, or FTL). A typical range is ₹12–30 per km per tonne depending on route, cargo type, and market conditions. Use LoadSaathi's freight rate calculator above to get an instant estimate for your specific route.",
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

          {/* GEO: self-contained answer block in first 30% */}
          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-black mb-4 text-foreground">Freight Rate Calculator India</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Truck freight rates in India depend on distance, cargo weight, truck type, and whether you ship PTL (Partial Truckload), LTL (Less Than Truckload), or FTL (Full Truckload). Enter your route details below to get an instant estimate with distance, cost per km, and a recommended truck for your cargo.
            </p>
          </div>

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
                <Label className="text-sm font-semibold text-muted-foreground">Cargo Weight (Tonnes)</Label>
                <div className="relative mt-1">
                  <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 2" className="pl-9" min="0.1" step="0.1" />
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Truck Type</Label>
                <RadioGroup value={truckType} onValueChange={setTruckType} className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    { value: "any", label: "Any (auto-select)" },
                    { value: "mini", label: "Mini Truck (≤1T)" },
                    { value: "pickup", label: "Pickup (1–2.5T)" },
                    { value: "lcv", label: "LCV (2.5–5T)" },
                    { value: "mlcv", label: "MLCV (5–10T)" },
                    { value: "hcv", label: "HCV (10–16T)" },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2 p-2 rounded-lg bg-background/50 border border-border">
                      <RadioGroupItem value={opt.value} id={`truck-${opt.value}`} />
                      <Label htmlFor={`truck-${opt.value}`} className="text-xs font-semibold cursor-pointer">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Shipment Type</Label>
                <RadioGroup value={shipmentType} onValueChange={(v) => setShipmentType(v as typeof shipmentType)} className="mt-2 flex gap-3">
                  {shipmentTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2 p-3 rounded-lg bg-background/50 border border-border flex-1">
                      <RadioGroupItem value={type} id={`ship-${type}`} />
                      <Label htmlFor={`ship-${type}`} className="text-sm font-bold cursor-pointer">{type}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button onClick={calculate} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Truck className="h-4 w-4 mr-2" />}
                Calculate Freight Rate
              </Button>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </CardContent>
          </Card>

          {result && (
            <Card className="mt-6 glass-card border-green-700/30">
              <CardContent className="p-6 space-y-5">
                <p className="text-xs text-green-300 uppercase tracking-wider font-semibold">Estimated Freight Rate</p>

                {/* Route overview */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-orange-400" />
                  <span className="font-semibold text-foreground">{origin}</span>
                  <ArrowRight className="h-3 w-3 text-orange-400" />
                  <span className="font-semibold text-foreground">{destination}</span>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-green-900/10 border border-green-700/20">
                  <div className="text-center">
                    <Route className="h-4 w-4 mx-auto text-green-400 mb-1" />
                    <p className="text-2xl font-black text-green-400">{result.distanceKm}</p>
                    <p className="text-xs text-muted-foreground">km</p>
                  </div>
                  <div className="text-center">
                    <IndianRupee className="h-4 w-4 mx-auto text-green-400 mb-1" />
                    <p className="text-2xl font-black text-green-400">₹{result.costPerKm}</p>
                    <p className="text-xs text-muted-foreground">per km</p>
                  </div>
                  <div className="text-center">
                    <Clock className="h-4 w-4 mx-auto text-green-400 mb-1" />
                    <p className="text-2xl font-black text-foreground">{result.transitHours}h</p>
                    <p className="text-xs text-muted-foreground">transit</p>
                  </div>
                </div>

                {/* Freight range */}
                <div className="p-4 rounded-xl bg-green-900/20 border border-green-700/30 space-y-2">
                  <p className="text-sm font-semibold text-foreground">Estimated Freight Range (per tonne)</p>
                  <p className="text-3xl font-black text-green-400">₹{result.freightRange.min.toLocaleString()} – ₹{result.freightRange.max.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Recommended: ₹{result.freightRange.recommended.toLocaleString()}/tonne</p>
                </div>

                {/* Truck recommendation */}
                <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-700/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-400" />
                    <p className="text-sm font-semibold text-foreground">Recommended Truck: {result.truckRecommendation.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Capacity: {result.truckRecommendation.capacity} · Type: {result.truckRecommendation.type}</p>
                </div>

                {/* Shipment type advice */}
                <div className="p-4 rounded-xl bg-background/50 border border-border space-y-1">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-orange-400" />
                    <p className="text-sm font-bold text-foreground">{result.shipmentType} — {result.suitability}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="h-3 w-3 shrink-0" />
                  <span>Estimates based on distance and market data. Final rates depend on cargo type, season, fuel price, and availability.</span>
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link to="/register?type=shipper" className="flex-1">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">Book Now</Button>
                  </Link>
                  <Link to="/transport-cost-calculator" className="flex-1">
                    <Button variant="outline" className="w-full font-bold">Compare Cost Calculator</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-10 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Explore more freight tools</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/transport-cost-calculator">
                <Button variant="outline" className="text-xs font-bold">Transport Cost Calculator</Button>
              </Link>
              <Link to="/truck-load-calculator">
                <Button variant="outline" className="text-xs font-bold">Truck Load Calculator</Button>
              </Link>
              <Link to="/ptl-vs-ftl-calculator">
                <Button variant="outline" className="text-xs font-bold">PTL vs FTL Calculator</Button>
              </Link>
              <Link to="/return-load-calculator">
                <Button variant="outline" className="text-xs font-bold">Return Load Calculator</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
