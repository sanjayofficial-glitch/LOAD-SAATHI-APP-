import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Calculator, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SeoMeta from "@/components/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type GstType = "igst" | "cgst_sgst";

export default function GstCalculator() {
  const [chargeAmount, setChargeAmount] = useState("");
  const [originState, setOriginState] = useState("");
  const [destinationState, setDestinationState] = useState("");
  const [serviceType, setServiceType] = useState("general");
  const [result, setResult] = useState<{
    igst: number;
    cgst: number;
    sgst: number;
    total: number;
    type: GstType;
    inputCredit: boolean;
  } | null>(null);

  const calculate = useCallback(() => {
    const amount = Number(chargeAmount) || 0;
    if (amount <= 0) return;

    const isInterstate = originState.toLowerCase() !== destinationState.toLowerCase();
    let igst = 0, cgst = 0, sgst = 0;
    let rate = 0.05;

    if (serviceType === "special") rate = 0.28;
    else if (serviceType === "general") rate = 0.05;

    if (isInterstate) {
      igst = Math.round(amount * rate * 100) / 100;
    } else {
      cgst = Math.round(amount * rate * 100) / 2 / 100;
      sgst = Math.round(amount * rate * 100) / 2 / 100;
    }

    const total = Math.round((igst + cgst + sgst) * 100) / 100;
    const inputCredit = isInterstate ? true : true;

    setResult({
      igst: Math.round(igst * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      total,
      type: isInterstate ? "igst" : "cgst_sgst",
      inputCredit,
    });
  }, [chargeAmount, originState, destinationState, serviceType]);

  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h1>GST Calculator for Freight — LoadSaathi</h1>
          <p>Calculate GST for freight shipments. Enter charge amount, origin state, destination state, and service type to get IGST or CGST+SGST breakdown.</p>
        </div>
      </noscript>
      <SeoMeta
        title="GST Calculator for Freight India | Calculate IGST, CGST, SGST on Transport"
        description="Calculate GST for freight shipments in India. Get IGST or CGST+SGST breakdown for transport charges based on origin and destination states."
        keywords="GST calculator freight, IGST calculator transport, CGST SGST calculator, freight GST India, transport charges GST"
        canonical="/tools/gst-calculator"
        breadcrumbs={[{ name: "GST Calculator", url: "/tools/gst-calculator" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "LoadSaathi GST Calculator for Freight",
            "url": "https://loadsaathi.in/tools/gst-calculator",
            "applicationCategory": "BusinessApplication",
            "description": "Calculate GST for freight shipments in India with IGST or CGST+SGST breakdown.",
          },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to LoadSaathi
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-black mb-4 text-foreground">GST Calculator for Freight</h1>
            <p className="text-lg text-muted-foreground mb-2">
              Calculate IGST or CGST+SGST for your freight charges. Enter charge amount and route details.
            </p>
          </div>

          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Calculator className="h-5 w-5 text-orange-400" /> Charge Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Charge Amount (INR)</Label>
                <Input type="number" value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value)} placeholder="e.g. 25000" className="mt-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Origin State</Label>
                  <Input value={originState} onChange={(e) => setOriginState(e.target.value)} placeholder="e.g. Odisha" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Destination State</Label>
                  <Input value={destinationState} onChange={(e) => setDestinationState(e.target.value)} placeholder="e.g. West Bengal" className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Service Type</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Freight (5%)</SelectItem>
                    <SelectItem value="special">Special Category (28% + cess)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={calculate} disabled={!chargeAmount || Number(chargeAmount) <= 0 || !originState || !destinationState} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                <Percent className="h-4 w-4 mr-2" /> Calculate GST
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card className="mt-6 glass-card border-green-700/30">
              <CardContent className="p-6 space-y-5">
                <p className="text-xs text-green-300 uppercase tracking-wider font-semibold">GST Breakdown</p>

                {result.type === "igst" ? (
                  <div className="p-4 rounded-xl bg-green-900/10 border border-green-700/20">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">IGST (Interstate)</p>
                    <p className="text-3xl font-black text-green-400">₹{result.igst.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">on ₹{Number(chargeAmount).toLocaleString()} charge</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-green-900/10 border border-green-700/20">
                      <p className="text-xs text-muted-foreground font-semibold mb-1">CGST</p>
                      <p className="text-2xl font-black text-green-400">₹{result.cgst.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-green-900/10 border border-green-700/20">
                      <p className="text-xs text-muted-foreground font-semibold mb-1">SGST</p>
                      <p className="text-2xl font-black text-green-400">₹{result.sgst.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-700/20">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">Total GST</p>
                  <p className="text-3xl font-black text-blue-400">₹{result.total.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Input tax credit: {result.inputCredit ? "Eligible" : "Not eligible"}</p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Rates are indicative. Consult a GST practitioner for exact liability. Input tax credit eligibility depends on your GST registration status.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
