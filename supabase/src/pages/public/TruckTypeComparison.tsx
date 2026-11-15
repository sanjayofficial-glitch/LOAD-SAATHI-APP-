import { useParams, Link } from "react-router-dom";
import { Scale, Ruler, Weight, Boxes, ArrowRight, CheckCircle2, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import SeoMeta from "@/components/SeoMeta";
import { rateBand, formatINR, RATES_UPDATED_LABEL } from "@/data/routes";
import { getVehicleDimensions } from "@/data/vehicleDimensions";
import {
  TRUCK_TYPE_PAIRS,
  truckPairTitle,
  truckPairMetaDescription,
  type TruckTypePair,
} from "@/data/truckTypes";

/** Convert kilograms to a compact Indian rendering ("2.5 t"). */
const tonnes = (kg: number) => (kg >= 1000 ? `${(kg / 1000).toFixed(1).replace(/\.0$/, "")} t` : `${kg} kg`);

/** Cubic feet with Indian digit grouping. */
const cuFt = (n: number) => n.toLocaleString("en-IN");

/** The lane-level FTL/PTL band used by all pages. */
const bandsFor = (pair: TruckTypePair) => rateBand({ distanceKm: pair.comparisonDistanceKm });

export default function TruckTypeComparison() {
  const { slug } = useParams<{ slug: string }>();
  const pair = slug ? TRUCK_TYPE_PAIRS[slug.toLowerCase()] : undefined;

  if (!pair) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-[#050816]">
        <SeoMeta title="Truck Comparison Not Found" description="The truck comparison you are looking for does not exist." robots="noindex, nofollow" />
        <div className="text-center max-w-md mx-auto px-6">
          <Scale className="h-16 w-16 text-orange-400/50 mx-auto mb-6" />
          <h1 className="text-3xl font-black text-foreground mb-3">Comparison Not Found</h1>
          <p className="text-muted-foreground mb-6">That truck comparison doesn't exist or has been removed.</p>
          <Link to="/tools/truck-load-calculator">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              Use the Truck Load Calculator <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const bands = bandsFor(pair);
  const dimA = pair.a.modelName ? getVehicleDimensions(pair.a.modelName) : undefined;
  const dimB = pair.b.modelName ? getVehicleDimensions(pair.b.modelName) : undefined;

  const faqs = pair.faq;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://loadsaathi.in/" },
          { "@type": "ListItem", position: 2, name: "Tools", item: "https://loadsaathi.in/tools" },
          { "@type": "ListItem", position: 3, name: truckPairTitle(pair), item: `https://loadsaathi.in/truck-types/${pair.slug}` },
        ],
      },
      {
        "@type": "FAQPage",
        name: `Frequently Asked Questions — ${pair.a.label} vs ${pair.b.label}`,
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  const specRows: { label: string; a: string; b: string }[] = [];
  if (dimA && dimB) {
    specRows.push(
      { label: "Deck length", a: `${dimA.lengthFt} ft`, b: `${dimB.lengthFt} ft` },
      { label: "Deck width", a: `${dimA.widthFt} ft`, b: `${dimB.widthFt} ft` },
      { label: "Load height", a: `${dimA.heightFt} ft`, b: `${dimB.heightFt} ft` },
      { label: "Payload", a: tonnes(dimA.capacityKg), b: tonnes(dimB.capacityKg) },
      { label: "Cubic capacity", a: `${cuFt(dimA.capacityCuFt)} cu ft`, b: `${cuFt(dimB.capacityCuFt)} cu ft` },
    );
  } else {
    specRows.push(
      { label: "Payload (benchmark class)", a: pair.a.benchmark.capacity, b: pair.b.benchmark.capacity },
      { label: "Rate (benchmark class)", a: pair.a.benchmark.rate, b: pair.b.benchmark.rate },
    );
  }

  return (
    <>
      <SeoMeta
        title={truckPairTitle(pair)}
        description={truckPairMetaDescription(pair)}
        canonical={`/truck-types/${pair.slug}`}
        keywords={`${pair.a.label}, ${pair.b.label}, truck comparison, which truck to book, PTL truck size, Indian truck capacity`}
        jsonLd={jsonLd}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <header className="mb-10">
          <nav className="text-xs text-muted-foreground mb-3" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-orange-600">Home</Link>
            <span className="mx-1.5">/</span>
            <Link to="/tools" className="hover:text-orange-600">Tools</Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">{pair.a.label} vs {pair.b.label}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground dark:text-white tracking-tight text-balance">
            {pair.a.label} vs {pair.b.label}
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-3xl">
            Which truck should you book? Compare payload, volume, per-km class rates and the
            full-truck / part-load economics on a real East-India lane.
          </p>
        </header>

        {/* Spec comparison */}
        <section aria-labelledby="spec-heading" className="glass-card rounded-2xl border border-border p-5 sm:p-7 mb-8">
          <h2 id="spec-heading" className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
            <Ruler className="h-5 w-5 text-orange-600 dark:text-orange-400" /> Specs at a glance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Comparison of {pair.a.label} and {pair.b.label}</caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="text-left py-3 pr-4 font-semibold text-muted-foreground">Measure</th>
                  <th scope="col" className="text-left py-3 pr-4 font-bold text-foreground">{pair.a.label}</th>
                  <th scope="col" className="text-left py-3 font-bold text-foreground">{pair.b.label}</th>
                </tr>
              </thead>
              <tbody>
                {specRows.map((row) => (
                  <tr key={row.label} className="border-b border-border/60 last:border-0">
                    <th scope="row" className="text-left py-3 pr-4 font-medium text-muted-foreground whitespace-nowrap">{row.label}</th>
                    <td className="py-3 pr-4 tabular-nums font-semibold text-foreground">{row.a}</td>
                    <td className="py-3 tabular-nums font-semibold text-foreground">{row.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {dimA && dimB && (
            <p className="mt-4 text-xs text-muted-foreground">
              Dimensions for {pair.a.modelName} and {pair.b.modelName} from the LoadSaathi vehicle catalogue.
            </p>
          )}
        </section>

        {/* Rate economics on a real lane */}
        <section aria-labelledby="rate-heading" className="glass-card rounded-2xl border border-border p-5 sm:p-7 mb-8">
          <h2 id="rate-heading" className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
            <IndianRupee className="h-5 w-5 text-orange-600 dark:text-orange-400" /> Rate economics on {pair.comparisonLane}
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Indicative bands for {pair.comparisonDistanceKm} km, generated by the same rate model as the
            <Link to={`/routes/${pair.comparisonRouteSlug}`} className="text-orange-600 dark:text-orange-400 font-semibold hover:underline"> route page</Link>.
            Rates updated {RATES_UPDATED_LABEL}.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Full truck (FTL)</p>
              <p className="text-xl font-black tabular-nums text-foreground">
                ₹{formatINR(bands.perTruckMin)}–₹{formatINR(bands.perTruckMax)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">per trip · ₹{bands.perKmMin}–₹{bands.perKmMax}/km</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Part load (PTL)</p>
              <p className="text-xl font-black tabular-nums text-foreground">
                ₹{formatINR(bands.perTonneMin)}–₹{formatINR(bands.perTonneMax)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">per tonne · ₹{bands.perKgMin}–₹{bands.perKgMax}/kg</p>
            </div>
            <div className="rounded-xl border border-orange-300/40 bg-orange-50/60 dark:bg-orange-500/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300 mb-1">Which fits your load?</p>
              <p className="text-sm font-semibold text-foreground">
                {pair.verdictA}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-foreground">{pair.a.label}</p>
                  <p className="text-sm text-muted-foreground mt-1">{pair.verdictA}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-foreground">{pair.b.label}</p>
                  <p className="text-sm text-muted-foreground mt-1">{pair.verdictB}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benchmark class rates */}
        <section aria-labelledby="class-heading" className="glass-card rounded-2xl border border-border p-5 sm:p-7 mb-8">
          <h2 id="class-heading" className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
            <Weight className="h-5 w-5 text-orange-600 dark:text-orange-400" /> 2026 class rates (per km)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[pair.a, pair.b].map((side) => (
              <div key={side.label} className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="font-bold text-foreground">{side.label}</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <Boxes className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="ml-auto font-semibold tabular-nums text-foreground">{side.benchmark.capacity}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Rate</span>
                  <span className="ml-auto font-semibold tabular-nums text-foreground">{side.benchmark.rate}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{side.benchmark.use}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="glass-card rounded-2xl border border-border p-5 sm:p-7 mb-8">
          <h2 id="faq-heading" className="text-lg font-bold text-foreground mb-4">{pair.a.label} vs {pair.b.label}: FAQ</h2>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <h3 className="font-semibold text-foreground">{f.q}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-orange-300/40 bg-orange-50/60 dark:bg-orange-500/10 p-6 sm:p-8 text-center">
          <h2 className="text-xl font-black text-foreground mb-2">Not sure your load fits?</h2>
          <p className="text-sm text-muted-foreground mb-5 max-w-lg mx-auto">
            Use the truck-load calculator to check weight and volume against every vehicle in the LoadSaathi catalogue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/tools/truck-load-calculator">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto">
                Truck Load Calculator <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/tools/fare-calculator">
              <Button variant="outline" className="w-full sm:w-auto">
                Get a Freight Quote
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
