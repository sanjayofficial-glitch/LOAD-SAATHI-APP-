
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SeoMeta from "@/components/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PtlVsFtlCalculator() {
  const [weight, setWeight] = useState("");
  const [urgency, setUrgency] = useState<"flexible" | "moderate" | "urgent">("flexible");

  const w = Number(weight) || 0;

  const recommendation = w === 0 ? null : w <= 3
    ? { type: "PTL", reason: "Your shipment is under 3 tonnes. PTL saves 30–40% compared to FTL.", savings: "30–40%", transit: "Add 1–2 days", color: "text-blue-400", bg: "bg-blue-900/20 border-blue-700/30" }
    : w <= 7
    ? urgency === "urgent"
      ? { type: "FTL", reason: "Your shipment is 3–7 tonnes and you need it urgent. FTL provides direct point-to-point delivery.", savings: "N/A", transit: "Fastest (direct)", color: "text-orange-400", bg: "bg-orange-900/20 border-orange-700/30" }
      : { type: "PTL or FTL", reason: "Your shipment is 3–7 tonnes. PTL is cheaper but takes 1–2 extra days. FTL is faster.", savings: "15–25% with PTL", transit: "PTL: 1–2 extra days, FTL: fastest", color: "text-green-400", bg: "bg-green-900/20 border-green-700/30" }
    : { type: "FTL", reason: "Your shipment exceeds 7 tonnes. FTL is the only option for full truck loads.", savings: "N/A", transit: "Fastest (direct)", color: "text-orange-400", bg: "bg-orange-900/20 border-orange-700/30" };

  return (
    <>
      <SeoMeta
        title="PTL vs FTL Calculator | Which Freight Option is Right for You?"
        description="Calculate whether PTL (Partial Truckload) or FTL (Full Truckload) is the right freight option for your shipment. Enter weight and urgency to get a recommendation."
        keywords="PTL vs FTL calculator, partial truckload vs full truckload, which freight option, PTL or FTL, freight decision tool"
        canonical="/ptl-vs-ftl-calculator"
        breadcrumbs={[{ name: "PTL vs FTL Calculator", url: "/ptl-vs-ftl-calculator" }]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "LoadSaathi PTL vs FTL Calculator",
          "url": "https://loadsaathi.in/ptl-vs-ftl-calculator",
          "applicationCategory": "BusinessApplication",
          "description": "Decide between PTL (Partial Truckload) and FTL (Full Truckload) based on shipment weight and urgency."
        }}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to LoadSaathi
          </Link>

          <h1 className="text-4xl sm:text-5xl font-black mb-4 text-foreground">PTL vs FTL Calculator</h1>
          <p className="text-lg text-muted-foreground mb-10">Enter your shipment details to get a recommendation.</p>

          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Shipment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Cargo Weight (Tonnes)</Label>
                <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 2" min="0.1" step="0.1" className="mt-1 text-lg" />
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Delivery Urgency</Label>
                <RadioGroup value={urgency} onValueChange={(v) => setUrgency(v as typeof urgency)} className="mt-2 space-y-2">
                  {[
                    { value: "flexible", label: "Flexible (3–5 days OK)", icon: Clock },
                    { value: "moderate", label: "Moderate (1–2 days)", icon: Clock },
                    { value: "urgent", label: "Urgent (ASAP)", icon: Clock },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-3 p-3 rounded-lg bg-background/50 border border-border">
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <Label htmlFor={opt.value} className="text-sm font-semibold cursor-pointer">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {recommendation && (
                <div className={`p-5 rounded-xl border ${recommendation.bg} space-y-3`}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Recommendation</p>
                  <p className={`text-3xl font-black ${recommendation.color}`}>{recommendation.type}</p>
                  <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/50">
                    <div>
                      <p className="text-xs text-muted-foreground">Savings with PTL</p>
                      <p className="text-lg font-bold text-green-400">{recommendation.savings}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Transit Time</p>
                      <p className="text-lg font-bold text-foreground">{recommendation.transit}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 text-center space-y-3">
            <div className="flex justify-center gap-3">
              <Link to="/guide/ptl-vs-ftl">
                <Button variant="outline" className="text-xs font-bold">Read Full Guide</Button>
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
