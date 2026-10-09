import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, GitCompareArrows, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SeoMeta from "@/components/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trackToolCompleted } from "@/utils/analytics";

const PAYMENT_TERMS = ["Advance", "On delivery", "Credit 7 days", "Credit 15 days", "Credit 30 days"];

interface Quote {
  name: string;
  baseFreight: string;
  fuelSurcharge: string;
  tolls: string;
  loadingUnloading: string;
  waiting: string;
  taxes: string;
  insurance: string;
  transitDays: string;
  paymentTerms: string;
}

interface QuoteTotal {
  index: number;
  name: string;
  total: number;
  perKm: number | null;
  transitDays: string;
  paymentTerms: string;
}

const EMPTY_QUOTE: Quote = {
  name: "",
  baseFreight: "",
  fuelSurcharge: "",
  tolls: "",
  loadingUnloading: "",
  waiting: "",
  taxes: "",
  insurance: "",
  transitDays: "",
  paymentTerms: "",
};

const CHARGE_FIELDS: { key: keyof Omit<Quote, "name" | "transitDays" | "paymentTerms">; label: string }[] = [
  { key: "baseFreight", label: "Base Freight (₹)" },
  { key: "fuelSurcharge", label: "Fuel Surcharge (₹)" },
  { key: "tolls", label: "Tolls / Fastag (₹)" },
  { key: "loadingUnloading", label: "Loading / Unloading (₹)" },
  { key: "waiting", label: "Waiting Charges (₹)" },
  { key: "taxes", label: "Taxes / GST (₹)" },
  { key: "insurance", label: "Insurance (₹)" },
];

export default function FreightQuoteComparison() {
  const [quotes, setQuotes] = useState<Quote[]>([{ ...EMPTY_QUOTE }, { ...EMPTY_QUOTE }]);
  const [distanceKm, setDistanceKm] = useState("");
  const [results, setResults] = useState<QuoteTotal[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setField = useCallback((index: number, key: keyof Quote, value: string) => {
    setQuotes((prev) => prev.map((q, i) => (i === index ? { ...q, [key]: value } : q)));
  }, []);

  const addQuote = useCallback(() => {
    setQuotes((prev) => (prev.length >= 3 ? prev : [...prev, { ...EMPTY_QUOTE }]));
  }, []);

  const removeQuote = useCallback((index: number) => {
    setQuotes((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  }, []);

  const compare = useCallback(() => {
    const distance = Number(distanceKm) || 0;
    const filled = quotes
      .map((q, index) => {
        const total = CHARGE_FIELDS.reduce((sum, f) => sum + (Number(q[f.key]) || 0), 0);
        const anyFilled = CHARGE_FIELDS.some((f) => Number(q[f.key]) > 0);
        return {
          index,
          name: q.name.trim() || `Quote ${index + 1}`,
          total,
          perKm: distance > 0 ? Math.round((total / distance) * 100) / 100 : null,
          transitDays: q.transitDays,
          paymentTerms: q.paymentTerms,
          anyFilled,
        };
      })
      .filter((q) => q.anyFilled);

    if (filled.length < 2) {
      setError("Enter charge details for at least two quotes to compare.");
      return;
    }
    setError(null);
    setResults(filled);
    trackToolCompleted({ tool: "freight-quote-comparison", quote_count: filled.length });
  }, [quotes, distanceKm]);

  const cheapest = results && results.length > 0 ? Math.min(...results.map((r) => r.total)) : null;

  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h2>Freight Quote Comparison Worksheet — LoadSaathi</h2>
          <p>Compare up to three transport quotes side by side. Enter base freight, fuel surcharge, tolls, loading/unloading, waiting, taxes and insurance for each offer to get an all-in comparison — plus transit time and payment terms — so you compare true cost, not headline rates.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Freight Quote Comparison Worksheet India | Compare Transport Rates"
        description="Compare up to three freight quotes side by side — base freight, fuel surcharge, tolls, loading, waiting, taxes and insurance — and get an all-in total with transit time and payment terms."
        keywords="freight quote comparison, transport rate comparison India, compare truck quotes, lorry rate comparison worksheet, all-in freight cost calculator"
        canonical="/tools/freight-quote-comparison"
        breadcrumbs={[{ name: "Freight Quote Comparison", url: "/tools/freight-quote-comparison" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "LoadSaathi Freight Quote Comparison Worksheet",
            "url": "https://loadsaathi.in/tools/freight-quote-comparison",
            "applicationCategory": "BusinessApplication",
            "description": "Compare up to three freight quotes on an all-in basis — charges, transit time and payment terms — not just headline rates.",
          },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <Link to="/tools" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> All Tools
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-black mb-4 text-foreground">Freight Quote Comparison Worksheet</h1>
            <p className="text-lg text-muted-foreground mb-2">
              Headline rates lie. Compare offers on an all-in basis — every charge, transit time and payment terms.
            </p>
          </div>

          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <GitCompareArrows className="h-5 w-5 text-orange-400" /> Route (optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-xs">
                <Label className="text-sm font-semibold text-muted-foreground">Route Distance (km)</Label>
                <Input type="number" min="0" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} placeholder="e.g. 380" className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Used to show cost per km for each quote.</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 mt-6">
            {quotes.map((quote, idx) => (
              <Card key={idx} className="glass-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center justify-between">
                    <span>Quote {idx + 1}</span>
                    {quotes.length > 2 && (
                      <Button variant="ghost" size="sm" onClick={() => removeQuote(idx)} className="text-red-400 hover:text-red-300">
                        Remove
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-muted-foreground">Transporter / Offer Name</Label>
                      <Input value={quote.name} onChange={(e) => setField(idx, "name", e.target.value)} placeholder={`e.g. Sharma Transport`} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-muted-foreground">Transit Time (days)</Label>
                      <Input type="number" min="0" value={quote.transitDays} onChange={(e) => setField(idx, "transitDays", e.target.value)} placeholder="e.g. 2" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-muted-foreground">Payment Terms</Label>
                      <Select value={quote.paymentTerms} onValueChange={(v) => setField(idx, "paymentTerms", v)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select terms" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_TERMS.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {CHARGE_FIELDS.map((field) => (
                      <div key={field.key}>
                        <Label className="text-xs font-semibold text-muted-foreground">{field.label}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={quote[field.key]}
                          onChange={(e) => setField(idx, field.key, e.target.value)}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button onClick={compare} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold">
              <GitCompareArrows className="h-4 w-4 mr-2" /> Compare Quotes
            </Button>
            {quotes.length < 3 && (
              <Button onClick={addQuote} variant="outline" className="flex-1 font-bold">
                + Add Third Quote
              </Button>
            )}
          </div>
          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

          {results && (
            <Card className="mt-6 glass-card border-green-700/30">
              <CardContent className="p-6 space-y-5">
                <p className="text-xs text-green-300 uppercase tracking-wider font-semibold">All-In Comparison</p>

                <div className="space-y-3">
                  {results.map((r) => {
                    const isCheapest = cheapest !== null && r.total === cheapest;
                    return (
                      <div
                        key={r.index}
                        className={`p-4 rounded-xl border ${isCheapest ? "bg-green-900/10 border-green-700/40" : "bg-background/50 border-border"}`}
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <p className="font-bold text-foreground flex items-center gap-2">
                            {r.name}
                            {isCheapest && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-400">
                                <Trophy className="h-3.5 w-3.5" /> Lowest all-in
                              </span>
                            )}
                          </p>
                          <p className={`text-2xl font-black ${isCheapest ? "text-green-400" : "text-foreground"}`}>
                            ₹{r.total.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs text-muted-foreground">
                          {r.perKm !== null && <span>₹{r.perKm}/km{distanceKm ? ` over ${distanceKm} km` : ""}</span>}
                          {r.transitDays && <span>Transit: {r.transitDays} day{r.transitDays === "1" ? "" : "s"}</span>}
                          <span>Payment: {r.paymentTerms || "not stated"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-700/20">
                  <p className="text-sm font-bold text-foreground mb-1">Read beyond the total</p>
                  <p className="text-xs text-muted-foreground">
                    The cheapest all-in price is not always the best offer. Shorter transit time, favourable payment terms and a transporter you can trust can be worth more than a small price difference.
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Comparison is based only on the charges you entered. It is not a market rate assessment or a quote from LoadSaathi.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link to="/tools/freight-rate-calculator" className="flex-1">
                    <Button variant="outline" className="w-full font-bold">Sanity-Check with Rate Calculator</Button>
                  </Link>
                  <Link to="/register?type=shipper" className="flex-1">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">Post a Load</Button>
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
