import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Boxes, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SeoMeta from "@/components/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VEHICLE_DIMENSIONS } from "@/data/vehicleDimensions";
import { trackToolCompleted } from "@/utils/analytics";

const CBM_TO_CU_FT = 35.3147;
const CM_TO_M = 0.01;

interface VolumeResult {
  totalVolumeCuM: number;
  totalVolumeCuFt: number;
  totalWeightKg: number;
  densityKgPerCuM: number;
  constraint: "volume" | "weight" | "balanced";
  smallestFittingVehicle: string | null;
  fittingVehicleNote: string;
}

function round(n: number, dp = 1): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

export default function CargoVolumePlanner() {
  const [lengthCm, setLengthCm] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [weightPerPackage, setWeightPerPackage] = useState("");
  const [result, setResult] = useState<VolumeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(() => {
    const l = Number(lengthCm);
    const w = Number(widthCm);
    const h = Number(heightCm);
    const qty = Number(quantity) || 0;
    const weightEach = Number(weightPerPackage);

    if (!(l > 0) || !(w > 0) || !(h > 0)) {
      setError("Please enter package length, width and height in cm.");
      return;
    }
    if (!(qty > 0)) {
      setError("Please enter a quantity of at least 1.");
      return;
    }
    if (!(weightEach > 0)) {
      setError("Please enter the weight per package in kg.");
      return;
    }
    setError(null);

    const volumeCuM = l * CM_TO_M * w * CM_TO_M * h * CM_TO_M * qty;
    const totalWeightKg = weightEach * qty;
    const volumeCuFt = volumeCuM * CBM_TO_CU_FT;
    const density = volumeCuM > 0 ? totalWeightKg / volumeCuM : 0;

    // Vehicle-fit reference: smallest common vehicle whose volume AND weight
    // capacity can take the whole load. This is sizing guidance only — exact
    // utilisation against a chosen truck is the Payload Utilization tool.
    const fitting = [...VEHICLE_DIMENSIONS]
      .sort((a, b) => a.capacityCuFt - b.capacityCuFt)
      .find((v) => v.capacityCuFt >= volumeCuFt && v.capacityKg >= totalWeightKg);

    let constraint: VolumeResult["constraint"] = "balanced";
    if (density < 150) constraint = "volume"; // light, bulky cargo runs out of space first
    else if (density > 400) constraint = "weight"; // dense cargo hits weight limit first

    setResult({
      totalVolumeCuM: round(volumeCuM, 2),
      totalVolumeCuFt: round(volumeCuFt, 0),
      totalWeightKg: round(totalWeightKg, 1),
      densityKgPerCuM: round(density, 0),
      constraint,
      smallestFittingVehicle: fitting ? fitting.model : null,
      fittingVehicleNote: fitting
        ? `A ${fitting.model} (${fitting.capacityCuFt} cu ft / ${fitting.capacityKg} kg) is the smallest common vehicle that could take this load as a full consignment.`
        : "This load exceeds the largest common vehicle in our catalogue — it likely needs multiple vehicles or a trailer.",
    });

    trackToolCompleted({ tool: "cargo-volume-planner", total_volume_cbm: round(volumeCuM, 2) });
  }, [lengthCm, widthCm, heightCm, quantity, weightPerPackage]);

  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h2>PTL Cargo Volume & Space Planner — LoadSaathi</h2>
          <p>Plan part-load cargo space: enter package dimensions, quantity and weight to get total volume in cubic metres and cubic feet, total weight, density, and a basic space estimate for planning a PTL shipment.</p>
        </div>
      </noscript>
      <SeoMeta
        title="PTL Cargo Volume Planner – Part Load Size Calculator"
        description="Plan your part-load shipment: enter package dimensions, quantity and weight to get total volume (cbm and cu ft), weight, density and a basic space estimate for PTL cargo."
        keywords="cargo volume calculator, cbm calculator for transport, part load volume calculator, PTL space planner, shipment volume calculator India, cubic meter calculator freight"
        canonical="/tools/cargo-volume-planner"
        breadcrumbs={[{ name: "Cargo Volume Planner", url: "/tools/cargo-volume-planner" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "LoadSaathi PTL Cargo Volume & Space Planner",
            "url": "https://loadsaathi.in/tools/cargo-volume-planner",
            "applicationCategory": "BusinessApplication",
            "description": "Calculate total cargo volume and weight for part-load shipments with a basic space estimate.",
          },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <Link to="/tools" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> All Tools
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-black mb-4 text-foreground">PTL Cargo Volume &amp; Space Planner</h1>
            <p className="text-lg text-muted-foreground mb-2">
              Enter package dimensions, quantity and weight — get total volume, weight and a basic space estimate for your part-load shipment.
            </p>
          </div>

          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Boxes className="h-5 w-5 text-orange-400" /> Package Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Package Dimensions (cm)</Label>
                <div className="grid grid-cols-3 gap-3 mt-1">
                  <Input type="number" min="0" value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} placeholder="Length" />
                  <Input type="number" min="0" value={widthCm} onChange={(e) => setWidthCm(e.target.value)} placeholder="Width" />
                  <Input type="number" min="0" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="Height" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Dimensions of one package, in centimetres.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Number of Packages</Label>
                  <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Weight per Package (kg)</Label>
                  <Input type="number" min="0" value={weightPerPackage} onChange={(e) => setWeightPerPackage(e.target.value)} placeholder="e.g. 25" className="mt-1" />
                </div>
              </div>

              <Button
                onClick={calculate}
                disabled={!lengthCm || !widthCm || !heightCm || !weightPerPackage}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                <Boxes className="h-4 w-4 mr-2" /> Calculate Volume &amp; Space
              </Button>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </CardContent>
          </Card>

          {result && (
            <Card className="mt-6 glass-card border-green-700/30">
              <CardContent className="p-6 space-y-5">
                <p className="text-xs text-green-300 uppercase tracking-wider font-semibold">Volume &amp; Space Estimate</p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-green-900/10 border border-green-700/20 text-center">
                    <p className="text-2xl font-black text-green-400">{result.totalVolumeCuM}</p>
                    <p className="text-xs text-muted-foreground">cubic metres (cbm)</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-700/20 text-center">
                    <p className="text-2xl font-black text-blue-400">{result.totalVolumeCuFt}</p>
                    <p className="text-xs text-muted-foreground">cubic feet (cu ft)</p>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-900/10 border border-purple-700/20 text-center">
                    <p className="text-2xl font-black text-purple-400">{result.totalWeightKg.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground">kg total weight</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-background/50 border border-border">
                  <p className="text-sm font-bold text-foreground mb-1">
                    Density: {result.densityKgPerCuM} kg/cbm
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {result.constraint === "volume"
                      ? "Light and bulky — this shipment will run out of space before it runs out of weight capacity."
                      : result.constraint === "weight"
                        ? "Dense cargo — this shipment will hit its weight limit before it fills the space."
                        : "Balanced — volume and weight fill up at a similar pace."}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-yellow-900/10 border border-yellow-700/20">
                  <p className="text-xs text-yellow-400 font-semibold flex items-center gap-1">
                    <Info className="h-3.5 w-3.5" /> Space estimate
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{result.fittingVehicleNote}</p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Reference capacities are nominal and vary by vehicle body. For the utilisation percentage of a specific truck you plan to use, see the Payload Utilization tool.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link to="/tools/payload-utilization" className="flex-1">
                    <Button variant="outline" className="w-full font-bold">Check Truck Utilization</Button>
                  </Link>
                  <Link to="/register?type=shipper" className="flex-1">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">Post a PTL Load</Button>
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
