import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ClipboardCopy, Download, FileText, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SeoMeta from "@/components/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trackToolCompleted } from "@/utils/analytics";

const CARGO_TYPES = [
  "General goods",
  "Fragile / glass",
  "Electronics",
  "Agricultural produce",
  "Textiles",
  "FMCG",
  "Steel / metals",
  "Automobile parts",
  "Machinery",
  "Perishable (cold chain)",
  "Hazardous / chemical",
  "Other",
];

const LOADING_NEEDS = [
  "Loading dock available",
  "Forklift needed",
  "Manual labour needed",
  "Tail-lift needed",
  "Not sure yet",
];

const VEHICLE_PREFERENCES = [
  "Open to suggestion",
  "Tata Ace / pickup (up to 750 kg)",
  "Tata 407 (up to 2.5 T)",
  "1109 / 14-ft truck (up to 5.5 T)",
  "1615 / 16-ft truck (up to 7.5 T)",
  "20-ft closed container",
  "22-ft / 24-ft container",
  "Trailer / multi-axle",
];

interface BriefForm {
  pickup: string;
  drop: string;
  cargoType: string;
  weightKg: string;
  packages: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  readyDate: string;
  loadingNeed: string;
  vehicle: string;
  notes: string;
}

const EMPTY_FORM: BriefForm = {
  pickup: "",
  drop: "",
  cargoType: "",
  weightKg: "",
  packages: "1",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  readyDate: "",
  loadingNeed: "",
  vehicle: "",
  notes: "",
};

function buildBriefText(form: BriefForm): string {
  const lines: string[] = [
    "SHIPMENT BRIEF / FREIGHT REQUEST",
    "Prepared with LoadSaathi's free Shipment Brief Builder (loadsaathi.in/tools/shipment-brief)",
    `Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
    "",
    "ROUTE",
    `Pickup: ${form.pickup.trim()}`,
    `Drop-off: ${form.drop.trim()}`,
    "",
    "CARGO",
    `Cargo type: ${form.cargoType}`,
    `Total weight: ${form.weightKg} kg`,
    `Packages: ${form.packages}`,
  ];
  if (form.lengthCm && form.widthCm && form.heightCm) {
    lines.push(`Package dimensions (L × W × H): ${form.lengthCm} × ${form.widthCm} × ${form.heightCm} cm`);
  }
  lines.push(
    "",
    "SCHEDULE & HANDLING",
    `Ready date: ${form.readyDate || "Flexible"}`,
    `Loading needs: ${form.loadingNeed}`,
    `Preferred vehicle: ${form.vehicle}`
  );
  if (form.notes.trim()) {
    lines.push("", "SPECIAL INSTRUCTIONS", form.notes.trim());
  }
  lines.push("", "Share this brief with transporters to get accurate quotes.");
  return lines.join("\n");
}

export default function ShipmentBriefBuilder() {
  const [form, setForm] = useState<BriefForm>(EMPTY_FORM);
  const [brief, setBrief] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof BriefForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const generate = useCallback(() => {
    if (!form.pickup.trim() || !form.drop.trim()) {
      setError("Please enter both pickup and drop-off locations.");
      return;
    }
    if (!form.cargoType) {
      setError("Please select a cargo type.");
      return;
    }
    if (!form.weightKg || Number(form.weightKg) <= 0) {
      setError("Please enter the total weight in kg.");
      return;
    }
    setError(null);
    const text = buildBriefText(form);
    setBrief(text);
    setCopied(false);
    trackToolCompleted({
      tool: "shipment-brief",
      has_dimensions: Boolean(form.lengthCm && form.widthCm && form.heightCm),
      has_ready_date: Boolean(form.readyDate),
    });
  }, [form]);

  const copyBrief = useCallback(async () => {
    if (!brief) return;
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }, [brief]);

  const downloadBrief = useCallback(() => {
    if (!brief) return;
    const blob = new Blob([brief], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shipment-brief-${form.pickup.trim().toLowerCase().replace(/\s+/g, "-")}-to-${form.drop.trim().toLowerCase().replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [brief, form.pickup, form.drop]);

  const canSubmit = form.pickup.trim() && form.drop.trim() && form.cargoType && form.weightKg && Number(form.weightKg) > 0;

  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h2>Shipment Brief / Freight Request Builder — LoadSaathi</h2>
          <p>Prepare a complete freight request in minutes. Enter pickup, drop-off, cargo type, weight, dimensions, ready date, loading needs and preferred vehicle to get a clean shipment brief you can copy or download and share with transporters for accurate quotes.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Shipment Brief Builder – Free Freight Request Template"
        description="Build a complete shipment brief in minutes. Enter pickup, drop-off, cargo type, weight, dimensions, ready date and loading needs — then copy or download a clean freight request to share with transporters."
        keywords="shipment brief template, freight request builder, load request format, cargo details format for transporter, shipment specification sheet India"
        canonical="/tools/shipment-brief"
        breadcrumbs={[{ name: "Shipment Brief Builder", url: "/tools/shipment-brief" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "LoadSaathi Shipment Brief Builder",
            "url": "https://loadsaathi.in/tools/shipment-brief",
            "applicationCategory": "BusinessApplication",
            "description": "Free tool to build a complete freight request brief — route, cargo, schedule and handling details — ready to copy or download.",
          },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <Link to="/tools" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> All Tools
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-black mb-4 text-foreground">Shipment Brief Builder</h1>
            <p className="text-lg text-muted-foreground mb-2">
              Prepare a complete freight request in minutes. Copy or download a clean brief and share it with transporters for accurate quotes.
            </p>
          </div>

          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-400" /> Shipment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Pickup Location</Label>
                  <Input value={form.pickup} onChange={(e) => set("pickup")(e.target.value)} placeholder="e.g. Rourkela, Odisha" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Drop-off Location</Label>
                  <Input value={form.drop} onChange={(e) => set("drop")(e.target.value)} placeholder="e.g. Kolkata, West Bengal" className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Cargo Type</Label>
                <Select value={form.cargoType} onValueChange={set("cargoType")}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select cargo type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARGO_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Total Weight (kg)</Label>
                  <Input type="number" min="1" value={form.weightKg} onChange={(e) => set("weightKg")(e.target.value)} placeholder="e.g. 1200" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Number of Packages</Label>
                  <Input type="number" min="1" value={form.packages} onChange={(e) => set("packages")(e.target.value)} className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Package Dimensions (cm) — optional</Label>
                <div className="grid grid-cols-3 gap-3 mt-1">
                  <Input type="number" min="0" value={form.lengthCm} onChange={(e) => set("lengthCm")(e.target.value)} placeholder="Length" />
                  <Input type="number" min="0" value={form.widthCm} onChange={(e) => set("widthCm")(e.target.value)} placeholder="Width" />
                  <Input type="number" min="0" value={form.heightCm} onChange={(e) => set("heightCm")(e.target.value)} placeholder="Height" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Ready Date — optional</Label>
                  <Input type="date" value={form.readyDate} onChange={(e) => set("readyDate")(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Loading Needs</Label>
                  <Select value={form.loadingNeed} onValueChange={set("loadingNeed")}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select loading needs" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOADING_NEEDS.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Preferred Vehicle</Label>
                <Select value={form.vehicle} onValueChange={set("vehicle")}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select preferred vehicle (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_PREFERENCES.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Special Instructions — optional</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => set("notes")(e.target.value)}
                  placeholder="e.g. goods must stay upright, delivery before 5 PM, dock closed on Sundays…"
                  className="mt-1"
                  rows={3}
                />
              </div>

              <Button
                onClick={generate}
                disabled={!canSubmit}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                <FileText className="h-4 w-4 mr-2" /> Generate Shipment Brief
              </Button>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </CardContent>
          </Card>

          {brief && (
            <Card className="mt-6 glass-card border-green-700/30">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-green-300 uppercase tracking-wider font-semibold">Your Shipment Brief</p>
                  <span className="text-xs text-muted-foreground">Free — no signup needed</span>
                </div>

                <pre className="whitespace-pre-wrap text-sm bg-background/60 border border-border rounded-xl p-4 font-mono leading-relaxed">
                  {brief}
                </pre>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={copyBrief} variant="outline" className="flex-1 font-bold">
                    {copied ? <CheckSquare className="h-4 w-4 mr-2 text-green-500" /> : <ClipboardCopy className="h-4 w-4 mr-2" />}
                    {copied ? "Copied!" : "Copy Brief"}
                  </Button>
                  <Button onClick={downloadBrief} variant="outline" className="flex-1 font-bold">
                    <Download className="h-4 w-4 mr-2" /> Download .txt
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link to="/register?type=shipper" className="flex-1">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">Post This Load</Button>
                  </Link>
                  <Link to="/tools/freight-rate-calculator" className="flex-1">
                    <Button variant="outline" className="w-full font-bold">Estimate Freight Rate</Button>
                  </Link>
                </div>

                <p className="text-xs text-muted-foreground">
                  Your brief stays in your browser — nothing is uploaded. Share it with transporters to get complete, comparable quotes.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
