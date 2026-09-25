import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckSquare, Truck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SeoMeta from "@/components/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getVehicleDimensions } from "@/data/vehicleDimensions";

interface PayloadResult {
  vehicle: string;
  cargoVolumeCuFt: number;
  truckVolumeCuFt: number;
  volumeUtilization: number;
  cargoWeightKg: number;
  truckCapacityKg: number;
  weightUtilization: number;
  canFitMore: boolean;
}

export default function PayloadUtilization() {
  const [vehicle, setVehicle] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [result, setResult] = useState<PayloadResult | null>(null);

  const calculate = useCallback(() => {
    if (!vehicle || !length || !width || !height || !weight) return;

    const qty = Number(quantity) || 1;
    const cargoLength = Number(length);
    const cargoWidth = Number(width);
    const cargoHeight = Number(height);
    const cargoWeight = Number(weight) * qty;
    const cargoVolume = cargoLength * cargoWidth * cargoHeight * qty;

    const dims = getVehicleDimensions(vehicle);
    if (!dims) return;

    const volumeUtilization = Math.min(100, Math.round((cargoVolume / dims.capacityCuFt) * 100));
    const weightUtilization = Math.min(100, Math.round((cargoWeight / dims.capacityKg) * 100));
    const canFitMore = volumeUtilization < 90 && weightUtilization < 90;

    setResult({
      vehicle,
      cargoVolumeCuFt: Math.round(cargoVolume),
      truckVolumeCuFt: dims.capacityCuFt,
      volumeUtilization,
      cargoWeightKg: Math.round(cargoWeight),
      truckCapacityKg: dims.capacityKg,
      weightUtilization,
      canFitMore,
    });
  }, [vehicle, length, width, height, weight, quantity]);

  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h1>Payload Utilization Calculator — LoadSaathi</h1>
          <p>Calculate how much of your truck's payload capacity your cargo uses. Enter cargo dimensions and weight to get volume and weight utilization percentages.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Payload Utilization Calculator India | Volume & Weight Utilisation"
        description="Calculate payload utilization for your truck. Enter cargo dimensions and weight to see volume and weight utilisation percentages. Optimize truck loading."
        keywords="payload utilization calculator, volume utilization calculator, weight utilization truck, truck loading calculator, cargo capacity utilization"
        canonical="/tools/payload-utilization"
        breadcrumbs={[{ name: "Payload Utilization", url: "/tools/payload-utilization" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "LoadSaathi Payload Utilization Calculator",
            "url": "https://loadsaathi.in/tools/payload-utilization",
            "applicationCategory": "BusinessApplication",
            "description": "Calculate payload utilization for trucks. Optimize volume and weight utilisation.",
          },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to LoadSaathi
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-black mb-4 text-foreground">Payload Utilization</h1>
            <p className="text-lg text-muted-foreground mb-2">
              Calculate how much of your truck's capacity your cargo uses. Optimize volume and weight utilisation.
            </p>
          </div>

          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-400" /> Vehicle & Cargo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Truck Model</Label>
                <Select value={vehicle} onValueChange={setVehicle}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select truck model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tata Ace">Tata Ace</SelectItem>
                    <SelectItem value="Tata Intra V10">Tata Intra V10</SelectItem>
                    <SelectItem value="Tata 407 Gold SFC">Tata 407 Gold SFC</SelectItem>
                    <SelectItem value="Tata LPT 709">Tata LPT 709</SelectItem>
                    <SelectItem value="Tata LPT 1109">Tata LPT 1109</SelectItem>
                    <SelectItem value="Tata LPT 1615">Tata LPT 1615</SelectItem>
                    <SelectItem value="Tata Ultra Series">Tata Ultra</SelectItem>
                    <SelectItem value="Tata Signa Series">Tata Signa</SelectItem>
                    <SelectItem value="Tata Prima Series">Tata Prima</SelectItem>
                    <SelectItem value="Mahindra Bolero Pickup">Mahindra Bolero</SelectItem>
                    <SelectItem value="Eicher Pro">Eicher Pro</SelectItem>
                    <SelectItem value="Ashok Leyland Dost">Ashok Leyland Dost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Length (ft)</Label>
                  <Input type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g. 6" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Width (ft)</Label>
                  <Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g. 4" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Height (ft)</Label>
                  <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 4" className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Weight per Unit (kg)</Label>
                  <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 500" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Quantity</Label>
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" className="mt-1" />
                </div>
              </div>

              <Button onClick={calculate} disabled={!vehicle || !length || !width || !height || !weight} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                <CheckSquare className="h-4 w-4 mr-2" /> Calculate Utilization
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card className="mt-6 glass-card border-green-700/30">
              <CardContent className="p-6 space-y-5">
                <p className="text-xs text-green-300 uppercase tracking-wider font-semibold">Utilization Analysis</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-700/20">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Volume Utilization</p>
                    <p className="text-3xl font-black text-blue-400">{result.volumeUtilization}%</p>
                    <div className="w-full h-2 bg-background rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${result.volumeUtilization}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{result.cargoVolumeCuFt} / {result.truckVolumeCuFt} cu ft</p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-900/10 border border-green-700/20">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Weight Utilization</p>
                    <p className="text-3xl font-black text-green-400">{result.weightUtilization}%</p>
                    <div className="w-full h-2 bg-background rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${result.weightUtilization}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{result.cargoWeightKg} / {result.truckCapacityKg} kg</p>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${result.canFitMore ? "bg-green-900/10 border-green-700/20" : "bg-red-900/10 border-red-700/20"}`}>
                  <p className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    {result.canFitMore ? "You can fit more cargo" : "Capacity nearly full — consider splitting load"}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link to="/register" className="flex-1">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">Find Trucks</Button>
                  </Link>
                  <Link to="/tools/truck-load-calculator" className="flex-1">
                    <Button variant="outline" className="w-full font-bold">Truck Load Calculator</Button>
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
