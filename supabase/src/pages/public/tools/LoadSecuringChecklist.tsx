import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ClipboardList, Printer, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SeoMeta from "@/components/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trackToolCompleted } from "@/utils/analytics";

type CargoCategory = "general" | "fragile" | "liquid" | "machinery" | "perishable" | "agriculture" | "auto_parts" | "textiles";

interface ChecklistSection {
  title: string;
  items: string[];
}

interface HandlingOption {
  key: string;
  label: string;
}

const CARGO_CATEGORIES: { value: CargoCategory; label: string }[] = [
  { value: "general", label: "General / carton goods" },
  { value: "fragile", label: "Fragile / glass" },
  { value: "liquid", label: "Liquid / drums" },
  { value: "machinery", label: "Machinery / heavy items" },
  { value: "perishable", label: "Perishable / food" },
  { value: "agriculture", label: "Agricultural produce" },
  { value: "auto_parts", label: "Automobile parts" },
  { value: "textiles", label: "Textile bales" },
];

const HANDLING_OPTIONS: HandlingOption[] = [
  { key: "stackable", label: "Cargo can be stacked" },
  { key: "forklift", label: "Forklift available at dock" },
  { key: "upright", label: "Must stay upright" },
  { key: "weather", label: "Needs rain / sun protection" },
  { key: "two_person", label: "Needs two-person handling" },
  { key: "sealed", label: "Seal / tamper evidence required" },
];

const BASE_PACKING = [
  "Inspect cargo for damage or leaks before packing",
  "Use strong, intact cartons, crates or pallets — no torn packaging",
  "Cushion fragile items with bubble wrap, foam or thermocol",
  "Weight-mark every package (gross weight) on at least two sides",
  "Label handling marks: this side up, fragile, do not stack (as applicable)",
];

const BASE_LOADING = [
  "Check the truck body is clean, dry and free of sharp debris",
  "Verify the vehicle is positioned and chocked safely before loading",
  "Distribute weight evenly — heavy items low and over the axles",
  "Load heavier packages first, lighter ones on top",
  "Leave no loose gaps; fill voids with dunnage, air bags or rope lashing",
];

const BASE_DISPATCH = [
  "Count packages against the invoice / packing list with the driver",
  "Photograph the loaded truck and sealed packages before departure",
  "Share LR / e-way bill, invoice and delivery address with the driver",
  "Confirm delivery contact person and unloading hours at destination",
  "Note any pre-existing damages on the LR before signing",
];

const CATEGORY_EXTRAS: Record<CargoCategory, Partial<Record<"packing" | "loading" | "dispatch", string[]>>> = {
  general: {},
  fragile: {
    loading: ["Load upright only; never place heavy items on fragile cartons", "Use anti-vibration padding between stacks"],
    dispatch: ["Mark 'FRAGILE — HANDLE WITH CARE' on all exposed faces"],
  },
  liquid: {
    packing: ["Use UN-approved drums / carboys with intact seals and caps", "Fill drums to recommended level — allow for expansion"],
    loading: ["Secure drums upright in a bunded area; never lay drums on their side", "Keep drums away from heavy cargo that could puncture them"],
  },
  machinery: {
    packing: ["Fix machinery to a skid or pallet; block wheels and moving parts", "Cover precision surfaces with protective film"],
    loading: ["Use forklift or crane rated for the weight — never roll heavy machinery aboard", "Lash machinery separately from general cargo"],
  },
  perishable: {
    packing: ["Pre-cool cargo before loading; keep packaging ventilated", "Separate ethylene-producing and sensitive produce"],
    loading: ["Minimise door-open time during loading — load reefer last", "Check reefer set-point with the driver before dispatch"],
    dispatch: ["Record cargo temperature at dispatch on the LR"],
  },
  agriculture: {
    packing: ["Ensure produce is dry — damp grain or pulses will spoil in transit", "Use gunny bags / liners appropriate to the crop"],
    loading: ["Avoid mixing grades or crops in one stack", "Do not stack bags above safe height for the vehicle"],
  },
  auto_parts: {
    loading: ["Secure parts so metal cannot rub against finished surfaces", "Keep fasteners and small components boxed, not loose"],
  },
  textiles: {
    loading: ["Compress bales evenly; do not exceed stacking height for the vehicle", "Protect bales from moisture with tarpaulin"],
  },
};

const HANDLING_PACKING: Record<string, string> = {
  upright: "Print and attach 'THIS SIDE UP' arrows on every package",
  weather: "Wrap in waterproof tarpaulin / shrink wrap before dispatch",
  sealed: "Apply numbered tamper-evident seals and record seal numbers",
  two_person: "Brief loaders that items are two-person lift — no solo lifting",
};

const HANDLING_LOADING: Record<string, string> = {
  stackable: "Stack to the marked maximum height only",
  forklift: "Use forklift for palletised loading; inspect forks and straps first",
  weather: "Check weather cover is complete and tied down before departure",
};

const HANDLING_DISPATCH: Record<string, string> = {
  sealed: "Photograph seals at dispatch and share seal numbers with consignee",
};

export default function LoadSecuringChecklist() {
  const [category, setCategory] = useState<CargoCategory | "">("");
  const [handling, setHandling] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggleHandling = (key: string) => {
    setHandling((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    setGenerated(false);
    setChecked({});
  };

  const sections = useMemo<ChecklistSection[] | null>(() => {
    if (!category || !generated) return null;
    const extras = CATEGORY_EXTRAS[category];
    const packing = [...BASE_PACKING, ...(extras.packing ?? [])];
    const loading = [...BASE_LOADING, ...(extras.loading ?? [])];
    const dispatch = [...BASE_DISPATCH, ...(extras.dispatch ?? [])];

    for (const h of handling) {
      if (HANDLING_PACKING[h]) packing.push(HANDLING_PACKING[h]);
      if (HANDLING_LOADING[h]) loading.push(HANDLING_LOADING[h]);
      if (HANDLING_DISPATCH[h]) dispatch.push(HANDLING_DISPATCH[h]);
    }

    return [
      { title: "Packing", items: packing },
      { title: "Loading & Securing", items: loading },
      { title: "Dispatch & Handover", items: dispatch },
    ];
  }, [category, handling, generated]);

  const totalItems = sections ? sections.reduce((n, s) => n + s.items.length, 0) : 0;
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  const toggleCheck = useCallback((id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const generate = () => {
    if (!category) return;
    setGenerated(true);
    setChecked({});
    trackToolCompleted({ tool: "load-securing-checklist", cargo_category: category, handling_count: handling.length });
  };

  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px", fontFamily: "system-ui" }}>
          <h2>Load-Securing &amp; Dispatch Checklist Builder — LoadSaathi</h2>
          <p>Build a practical packing, loading and dispatch checklist for your cargo. Choose a cargo category and handling needs to get a checklist covering cargo preparation, load securing and handover — complementary to the document checklist, focused on the cargo itself.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Load Securing Checklist Builder – Cargo Preparation"
        description="Build a free packing, loading and dispatch checklist for your cargo. Choose cargo category and handling needs to get practical load-securing steps before your truck leaves."
        keywords="load securing checklist, cargo loading checklist India, truck loading procedure checklist, dispatch checklist logistics, lashing and securing cargo guide"
        canonical="/tools/load-securing-checklist"
        breadcrumbs={[{ name: "Load-Securing Checklist", url: "/tools/load-securing-checklist" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "LoadSaathi Load-Securing & Dispatch Checklist Builder",
            "url": "https://loadsaathi.in/tools/load-securing-checklist",
            "applicationCategory": "BusinessApplication",
            "description": "Generate a practical packing, loading and dispatch checklist by cargo category and handling needs.",
          },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <Link to="/tools" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> All Tools
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-black mb-4 text-foreground">Load-Securing &amp; Dispatch Checklist</h1>
            <p className="text-lg text-muted-foreground mb-2">
              Packing, securing and handover steps for your cargo — not paperwork. Choose your cargo type and handling needs.
            </p>
          </div>

          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-orange-400" /> Cargo &amp; Handling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Cargo Category</Label>
                <Select value={category} onValueChange={(v) => { setCategory(v as CargoCategory); setGenerated(false); setChecked({}); }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select cargo category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARGO_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Handling Needs — optional</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {HANDLING_OPTIONS.map((opt) => (
                    <label
                      key={opt.key}
                      className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border cursor-pointer hover:border-orange-500/30 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={handling.includes(opt.key)}
                        onChange={() => toggleHandling(opt.key)}
                        className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={generate} disabled={!category} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                <ClipboardList className="h-4 w-4 mr-2" /> Build My Checklist
              </Button>
            </CardContent>
          </Card>

          {sections && (
            <Card className="mt-6 glass-card border-green-700/30">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-green-300 uppercase tracking-wider font-semibold">Your Checklist</p>
                  <span className="text-xs text-muted-foreground">{checkedCount}/{totalItems} checked</span>
                </div>

                <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>

                {sections.map((section) => (
                  <div key={section.title} className="space-y-2">
                    <p className="text-sm font-bold text-foreground">{section.title}</p>
                    {section.items.map((item, idx) => {
                      const id = `${section.title}-${idx}`;
                      return (
                        <label
                          key={id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border cursor-pointer hover:border-orange-500/30 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={!!checked[id]}
                            onChange={() => toggleCheck(id)}
                            className="h-4 w-4 mt-0.5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-sm font-medium">{item}</span>
                        </label>
                      );
                    })}
                  </div>
                ))}

                <div className="p-3 rounded-lg bg-yellow-900/10 border border-yellow-700/20">
                  <p className="text-xs text-yellow-400 font-semibold flex items-center gap-1">
                    <Info className="h-3.5 w-3.5" /> Not a substitute for paperwork
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This checklist covers cargo preparation and handover. For mandatory transport documents (RC, insurance, permit, e-way bill), use the Document Checklist tool.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button onClick={() => window.print()} variant="outline" className="flex-1 font-bold">
                    <Printer className="h-4 w-4 mr-2" /> Print Checklist
                  </Button>
                  <Link to="/tools/document-checklist" className="flex-1">
                    <Button variant="outline" className="w-full font-bold">Document Checklist</Button>
                  </Link>
                </div>

                <Link to="/register?type=shipper">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">Post a Load</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
