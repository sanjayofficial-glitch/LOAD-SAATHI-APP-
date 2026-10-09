import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Info, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SeoMeta from "@/components/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trackToolCompleted } from "@/utils/analytics";

interface WaitResult {
  totalWaitHours: number;
  billableHours: number;
  hourlyRate: number;
  truckHourly: number;
  driverHourly: number;
  missedTrip: number;
  totalCost: number;
  truckCost: number;
  driverCost: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export default function WaitingTimeCostCalculator() {
  const [loadingWait, setLoadingWait] = useState("");
  const [unloadingWait, setUnloadingWait] = useState("");
  const [freeHours, setFreeHours] = useState("2");
  const [truckPerDay, setTruckPerDay] = useState("");
  const [driverPerDay, setDriverPerDay] = useState("");
  const [missedTrip, setMissedTrip] = useState("");
  const [result, setResult] = useState<WaitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(() => {
    const loading = Number(loadingWait) || 0;
    const unloading = Number(unloadingWait) || 0;
    const free = Number(freeHours) || 0;
    const truck = Number(truckPerDay) || 0;
    const driver = Number(driverPerDay) || 0;
    const missed = Number(missedTrip) || 0;

    if (loading <= 0 && unloading <= 0) {
      setError("Please enter at least one waiting time.");
      return;
    }
    if (truck <= 0 && driver <= 0 && missed <= 0) {
      setError("Please enter at least one cost estimate (truck, driver, or missed trip).");
      return;
    }
    setError(null);

    const billableLoading = Math.max(0, loading - free);
    const billableUnloading = Math.max(0, unloading - free);
    const billableHours = round2(billableLoading + billableUnloading);

    const truckHourly = round2(truck / 24);
    const driverHourly = round2(driver / 24);
    const hourlyRate = round2(truckHourly + driverHourly);

    const truckCost = round2(billableHours * truckHourly);
    const driverCost = round2(billableHours * driverHourly);
    const totalCost = round2(truckCost + driverCost + missed);

    setResult({
      totalWaitHours: round2(loading + unloading),
      billableHours,
      hourlyRate,
      truckHourly,
      driverHourly,
      missedTrip: missed,
      totalCost,
      truckCost,
      driverCost,
    });

    trackToolCompleted({
      tool: "waiting-time-cost",
      total_wait_hours: round2(loading + unloading),
      total_cost: totalCost,
    });
  }, [loadingWait, unloadingWait, freeHours, truckPerDay, driverPerDay, missedTrip]);

  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h2>Truck Waiting-Time Cost Calculator — LoadSaathi</h2>
          <p>Estimate what truck waiting time costs at loading and unloading. Enter wait hours, your truck and driver costs, and any missed-trip cost to get an estimate with all assumptions shown. This is an estimate only, not a legally owed detention charge.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Truck Waiting Time Cost Calculator India | Detention Cost Estimate"
        description="Estimate the cost of truck waiting time at loading and unloading points in India. Enter wait hours, truck and driver costs, and missed-trip costs to see a transparent estimate with assumptions shown."
        keywords="truck waiting time calculator, detention cost calculator India, truck demurrage charges, loading waiting charges calculator, truck delay cost estimate"
        canonical="/tools/waiting-time-cost"
        breadcrumbs={[{ name: "Waiting-Time Cost Calculator", url: "/tools/waiting-time-cost" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "LoadSaathi Truck Waiting-Time Cost Calculator",
            "url": "https://loadsaathi.in/tools/waiting-time-cost",
            "applicationCategory": "BusinessApplication",
            "description": "Estimate the cost of truck waiting time at loading and unloading with assumptions shown. Estimate only — not a legally owed detention charge.",
          },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <Link to="/tools" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> All Tools
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-black mb-4 text-foreground">Truck Waiting-Time Cost Calculator</h1>
            <p className="text-lg text-muted-foreground mb-2">
              Make delays visible. Estimate what waiting time at loading and unloading really costs — with every assumption shown.
            </p>
          </div>

          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-400" /> Waiting Time & Costs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Loading Wait (hours)</Label>
                  <Input type="number" min="0" step="0.5" value={loadingWait} onChange={(e) => setLoadingWait(e.target.value)} placeholder="e.g. 4" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Unloading Wait (hours)</Label>
                  <Input type="number" min="0" step="0.5" value={unloadingWait} onChange={(e) => setUnloadingWait(e.target.value)} placeholder="e.g. 3" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Free Waiting Allowance (hrs each)</Label>
                  <Input type="number" min="0" step="0.5" value={freeHours} onChange={(e) => setFreeHours(e.target.value)} className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Truck Cost per Day (₹)</Label>
                  <Input type="number" min="0" value={truckPerDay} onChange={(e) => setTruckPerDay(e.target.value)} placeholder="e.g. 5000" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Driver Cost per Day (₹)</Label>
                  <Input type="number" min="0" value={driverPerDay} onChange={(e) => setDriverPerDay(e.target.value)} placeholder="e.g. 700" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Missed Trip Cost (₹) — optional</Label>
                  <Input type="number" min="0" value={missedTrip} onChange={(e) => setMissedTrip(e.target.value)} placeholder="e.g. 2000" className="mt-1" />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-900/10 border border-blue-700/20">
                <p className="text-xs text-blue-300 font-semibold flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" /> How it works
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Daily costs are converted to hourly rates (÷24). The free waiting allowance is deducted separately at loading and at unloading, then the remaining billable hours are charged at your hourly rate.
                </p>
              </div>

              <Button
                onClick={calculate}
                disabled={!loadingWait && !unloadingWait}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                <Timer className="h-4 w-4 mr-2" /> Calculate Waiting Cost
              </Button>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </CardContent>
          </Card>

          {result && (
            <Card className="mt-6 glass-card border-green-700/30">
              <CardContent className="p-6 space-y-5">
                <p className="text-xs text-green-300 uppercase tracking-wider font-semibold">Estimated Cost of Waiting</p>

                <div className="p-4 rounded-xl bg-green-900/10 border border-green-700/20 text-center">
                  <p className="text-4xl font-black text-green-400">₹{result.totalCost.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    for {result.totalWaitHours} hrs waiting ({result.billableHours} hrs billable)
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-background/50 border border-border text-center">
                    <p className="text-lg font-black text-orange-400">₹{result.hourlyRate}</p>
                    <p className="text-xs text-muted-foreground">per hour total</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50 border border-border text-center">
                    <p className="text-lg font-black text-blue-400">₹{result.truckCost.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground">truck share</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50 border border-border text-center">
                    <p className="text-lg font-black text-purple-400">₹{result.driverCost.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground">driver share</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50 border border-border text-center">
                    <p className="text-lg font-black text-yellow-400">₹{result.missedTrip.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground">missed trip</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-700/20">
                  <p className="text-sm font-bold text-foreground mb-2">Assumptions used</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Truck: ₹{truckPerDay || 0}/day → ₹{result.truckHourly}/hour · Driver: ₹{driverPerDay || 0}/day → ₹{result.driverHourly}/hour</li>
                    <li>Free waiting allowance: {freeHours || 0} hrs at loading and {freeHours || 0} hrs at unloading</li>
                    <li>Missed-trip cost entered: ₹{result.missedTrip.toLocaleString("en-IN")}</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-yellow-900/10 border border-yellow-700/20">
                  <p className="text-xs text-yellow-400 font-semibold flex items-center gap-1">
                    <Info className="h-3.5 w-3.5" /> Estimate only
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This is a planning estimate based on the costs you entered — not a standard rate, not a legally owed detention or demurrage charge. Actual claims depend on your contract and applicable terms.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link to="/register?type=trucker" className="flex-1">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">Join as Trucker</Button>
                  </Link>
                  <Link to="/tools/trip-profit" className="flex-1">
                    <Button variant="outline" className="w-full font-bold">Trip Profit Calculator</Button>
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
