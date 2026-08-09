
import { useState } from "react";
import { Link } from "react-router-dom";
import { Truck, ArrowLeft, Package, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SeoMeta from "@/components/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TruckRecommendation {
  name: string;
  capacity: string;
  type: string;
  bestFor: string;
}

const truckData: { min: number; max: number; trucks: TruckRecommendation[] }[] = [
  { min: 0, max: 1, trucks: [
    { name: "Tata Ace Gold", capacity: "0.7T", type: "Mini Truck", bestFor: "Local deliveries, small parcels" },
    { name: "Mahindra Jeeto", capacity: "0.6T", type: "Mini Truck", bestFor: "Urban, last-mile" },
    { name: "Tata Ace EV", capacity: "0.5T", type: "Electric Mini", bestFor: "Eco-friendly local delivery" },
  ]},
  { min: 1, max: 2.5, trucks: [
    { name: "Tata Intra V10", capacity: "1.5T", type: "Pickup", bestFor: "Short-haul, light cargo" },
    { name: "Mahindra Bolero Pik-Up", capacity: "2T", type: "Pickup", bestFor: "Rural + urban, mixed cargo" },
    { name: "Tata Yodha 2.0", capacity: "2T", type: "Pickup", bestFor: "Medium distances, rugged routes" },
  ]},
  { min: 2.5, max: 5, trucks: [
    { name: "Tata 407 Gold SFC", capacity: "4T", type: "LCV", bestFor: "PTL/LTL, multi-stop" },
    { name: "Eicher Pro 2049", capacity: "5T", type: "LCV", bestFor: "Medium-haul, commercial goods" },
    { name: "Tata Ultra Series", capacity: "5T", type: "LCV", bestFor: "City-to-city, time-sensitive" },
  ]},
  { min: 5, max: 10, trucks: [
    { name: "Tata LPT 1613", capacity: "10T", type: "MLCV", bestFor: "Regional, bulk cargo" },
    { name: "Eicher Pro 3015", capacity: "10T", type: "MLCV", bestFor: "Long-haul, industrial goods" },
  ]},
  { min: 10, max: 16, trucks: [
    { name: "Tata Signa Series", capacity: "16T", type: "HCV", bestFor: "Heavy cargo, intercity" },
    { name: "Mahindra Blazo X 25", capacity: "16T", type: "HCV", bestFor: "Bulk, steel, cement" },
  ]},
  { min: 16, max: 25, trucks: [
    { name: "Tata Prima Series", capacity: "25T", type: "Trailer", bestFor: "Bulk, containerized cargo" },
    { name: "Tata Tractor Trailer", capacity: "25T", type: "Tractor-Trailer", bestFor: "FTL, heavy industrial" },
  ]},
];

export default function TruckLoadCalculator() {
  const [weight, setWeight] = useState("");
  const recommendations = weight && Number(weight) > 0
    ? truckData.find(g => Number(weight) >= g.min && Number(weight) < g.max)?.trucks ?? truckData[truckData.length - 1]!.trucks
    : null;

  return (
    <>
      <SeoMeta
        title="Truck Load Calculator | Find the Right Truck for Your Cargo"
        description="Calculate which truck type fits your cargo weight. From Tata Ace (0.5T) to tractor-trailers (25T). AI recommends the best truck for your shipment."
        keywords="truck load calculator, which truck for cargo, truck capacity calculator, cargo weight to truck, truck size guide"
        canonical="/truck-load-calculator"
        breadcrumbs={[{ name: "Truck Load Calculator", url: "/truck-load-calculator" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "LoadSaathi Truck Load Calculator",
          "url": "https://loadsaathi.in/truck-load-calculator",
          "applicationCategory": "BusinessApplication",
          "description": "Find the right truck for your cargo weight. From mini trucks to tractor-trailers."
        }}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to LoadSaathi
          </Link>

          <h1 className="text-4xl sm:text-5xl font-black mb-4 text-foreground">Truck Load Calculator</h1>
          <p className="text-lg text-muted-foreground mb-10">Enter your cargo weight and we'll recommend the right truck type.</p>

          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-400" /> Cargo Weight
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Weight (Tonnes)</Label>
                <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 2.5" min="0.1" step="0.1" className="mt-1 text-lg" />
              </div>

              {recommendations && (
                <div className="space-y-3">
                  <p className="text-xs text-green-300 uppercase tracking-wider font-semibold">Recommended Trucks</p>
                  {recommendations.map((truck, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-green-900/20 border border-green-700/30">
                      <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-green-400" />
                        <div>
                          <p className="text-sm font-bold text-foreground">{truck.name}</p>
                          <p className="text-xs text-muted-foreground">{truck.type} · {truck.bestFor}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-green-400">{truck.capacity}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-start gap-2 text-xs text-muted-foreground mt-3">
                    <CheckCircle className="h-3 w-3 text-green-400 mt-0.5 shrink-0" />
                    <span>For shared loads (PTL/LTL), your cargo will share this truck with other shipments heading the same direction.</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Ready to book?</p>
            <div className="flex justify-center gap-3">
              <Link to="/fare-calculator">
                <Button variant="outline" className="text-xs font-bold">Get a Price Estimate</Button>
              </Link>
              <Link to="/register?type=shipper">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold">Book Now</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
