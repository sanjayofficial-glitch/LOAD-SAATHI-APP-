import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckSquare, FileText, Printer, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SeoMeta from "@/components/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDocumentRequirements } from "@/data/requiredDocuments";

type CheckedState = Record<number, boolean>;

export default function DocumentChecklist() {
  const [route, setRoute] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [commodity, setCommodity] = useState("");
  const [checked, setChecked] = useState<CheckedState>({});
  const [submitted, setSubmitted] = useState(false);

  const requirements = useMemo(() => {
    if (!route || !vehicleType || !commodity) return null;
    return getDocumentRequirements(route, vehicleType, commodity);
  }, [route, vehicleType, commodity]);

  const toggleCheck = (idx: number) => {
    setChecked(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const totalDocs = requirements ? requirements.documents.length : 0;
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const progress = totalDocs > 0 ? Math.round((checkedCount / totalDocs) * 100) : 0;

  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h1>Trucking Document Checklist Generator — LoadSaathi</h1>
          <p>Generate a printable checklist of documents required for your trucking route. Enter route, vehicle type, and commodity to get a complete list.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Trucking Document Checklist Generator | Required Papers for Transport"
        description="Generate a printable checklist of documents required for your trucking route. Enter route, vehicle type, and commodity to get RC, insurance, permit, and other required documents."
        keywords="trucking document checklist, transport documents India, RC book, insurance certificate, transport permit checklist, required papers for truck"
        canonical="/tools/document-checklist"
        breadcrumbs={[{ name: "Document Checklist", url: "/tools/document-checklist" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "LoadSaathi Document Checklist Generator",
            "url": "https://loadsaathi.in/tools/document-checklist",
            "applicationCategory": "BusinessApplication",
            "description": "Generate a printable checklist of documents required for trucking routes in India.",
          },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to LoadSaathi
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-black mb-4 text-foreground">Document Checklist</h1>
            <p className="text-lg text-muted-foreground mb-2">
              Generate a printable checklist of documents required for your route and cargo.
            </p>
          </div>

          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-400" /> Trip Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Route</Label>
                <Select value={route} onValueChange={setRoute}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rourkela-to-ranchi">Rourkela → Ranchi</SelectItem>
                    <SelectItem value="rourkela-to-jamshedpur">Rourkela → Jamshedpur</SelectItem>
                    <SelectItem value="rourkela-to-bhubaneswar">Rourkela → Bhubaneswar</SelectItem>
                    <SelectItem value="rourkela-to-kolkata">Rourkela → Kolkata</SelectItem>
                    <SelectItem value="ranchi-to-jamshedpur">Ranchi → Jamshedpur</SelectItem>
                    <SelectItem value="ranchi-to-bhubaneswar">Ranchi → Bhubaneswar</SelectItem>
                    <SelectItem value="jamshedpur-to-kolkata">Jamshedpur → Kolkata</SelectItem>
                    <SelectItem value="bhubaneswar-to-kolkata">Bhubaneswar → Kolkata</SelectItem>
                    <SelectItem value="sambalpur-to-bhubaneswar">Sambalpur → Bhubaneswar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Vehicle Type</Label>
                <Select value={vehicleType} onValueChange={(v) => { setVehicleType(v); setSubmitted(false); }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tata Ace">Tata Ace</SelectItem>
                    <SelectItem value="Tata 407 Gold SFC">Tata 407 Gold SFC</SelectItem>
                    <SelectItem value="Tata LPT">Tata LPT</SelectItem>
                    <SelectItem value="Tata Ultra">Tata Ultra</SelectItem>
                    <SelectItem value="Tata Signa">Tata Signa</SelectItem>
                    <SelectItem value="Tata Prima">Tata Prima</SelectItem>
                    <SelectItem value="Mahindra Bolero">Mahindra Bolero</SelectItem>
                    <SelectItem value="Eicher Pro">Eicher Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Commodity</Label>
                <Select value={commodity} onValueChange={(v) => { setCommodity(v); setSubmitted(false); }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select commodity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Goods</SelectItem>
                    <SelectItem value="cement">Cement</SelectItem>
                    <SelectItem value="steel">Steel / Metals</SelectItem>
                    <SelectItem value="agricultural">Agricultural Produce</SelectItem>
                    <SelectItem value="textiles">Textiles</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="automobile">Automobile Parts</SelectItem>
                    <SelectItem value="fmcg">FMCG</SelectItem>
                    <SelectItem value="minerals">Minerals</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => setSubmitted(true)} disabled={!route || !vehicleType || !commodity} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                <CheckSquare className="h-4 w-4 mr-2" /> Generate Checklist
              </Button>
            </CardContent>
          </Card>

          {submitted && requirements && (
            <Card className="mt-6 glass-card border-green-700/30">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-green-300 uppercase tracking-wider font-semibold">Required Documents</p>
                  <span className="text-xs text-muted-foreground">{checkedCount}/{totalDocs} checked</span>
                </div>

                <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>

                <div className="space-y-2">
                  {requirements.documents.map((doc, idx) => (
                    <label key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border cursor-pointer hover:border-orange-500/30 transition-colors">
                      <input
                        type="checkbox"
                        checked={!!checked[idx]}
                        onChange={() => toggleCheck(idx)}
                        className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium">{doc}</span>
                    </label>
                  ))}
                </div>

                {requirements.special && (
                  <div className="p-3 rounded-lg bg-yellow-900/10 border border-yellow-700/20">
                    <p className="text-xs text-yellow-400 font-semibold flex items-center gap-1">
                      <Info className="h-3.5 w-3.5" /> Special Note
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{requirements.special}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button onClick={() => window.print()} variant="outline" className="flex-1 font-bold">
                    <Printer className="h-4 w-4 mr-2" /> Print Checklist
                  </Button>
                  <Link to="/register" className="flex-1">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">Book This Route</Button>
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
