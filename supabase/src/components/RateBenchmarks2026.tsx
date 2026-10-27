import { IndianRupee, Fuel, Route, Undo2 } from "lucide-react";

/**
 * 2026 truck rate benchmarks shared by the fare, truck load and return load
 * calculators. Figures come from the site's published 2026 rate-benchmark
 * article — keep them in sync with the per-km rate table in the blog content.
 */

export const RATE_BENCHMARK_ROWS: {
  vehicle: string;
  capacity: string;
  rate: string;
  use: string;
}[] = [
  {
    vehicle: "Tata Ace / Bolero Pickup",
    capacity: "0.75 – 1.5 Ton",
    rate: "₹18 – ₹28 / km",
    use: "Intra-city, local farm produce, parcel delivery",
  },
  {
    vehicle: "14 ft / 17 ft (Eicher / LPT)",
    capacity: "3.5 – 5.0 Ton",
    rate: "₹28 – ₹38 / km",
    use: "FMCG, light industrial goods, regional routes (100–300 km)",
  },
  {
    vehicle: "19 ft / 22 ft (Medium Duty)",
    capacity: "7.0 – 10.0 Ton",
    rate: "₹36 – ₹48 / km",
    use: "Steel pipes, hardware, wholesale agriculture",
  },
  {
    vehicle: "28 ft – 32 ft Single Axle",
    capacity: "9.0 – 15.0 Ton",
    rate: "₹45 – ₹58 / km",
    use: "Volume cargo, e-commerce, white goods, textiles",
  },
  {
    vehicle: "32 ft Multi-Axle (Container)",
    capacity: "18.0 – 25.0 Ton",
    rate: "₹55 – ₹70 / km",
    use: "Heavy industrial, steel coils, long-haul cross-state",
  },
  {
    vehicle: "Trailer / 40 ft (Multi-Axle)",
    capacity: "30.0 – 40.0 Ton+",
    rate: "₹75 – ₹110 / km",
    use: "Heavy machinery, raw steel, infrastructure materials",
  },
];

export const RATE_BENCHMARK_FAQ: { question: string; answer: string }[] = [
  {
    question: "What is the average truck transport rate per km in India in 2026?",
    answer:
      "Rates range from ₹18–₹28/km for a Tata Ace or Bolero pickup (0.75–1.5 ton) up to ₹75–₹110/km for a 40-ft multi-axle trailer (30–40 ton). Mid-size trucks — 14 ft to 22 ft in the 3.5–10 ton range — typically run ₹28–₹48/km. Actual rates move with diesel prices, terrain, season and return-load availability.",
  },
  {
    question: "How much of the freight rate is fuel?",
    answer:
      "Diesel accounts for roughly 45–55% of total operating cost per kilometre, which is why freight rates track diesel prices closely. Tolls add a further ₹3–₹8/km on national highways.",
  },
  {
    question: "Why do truckers charge more for one-way loads?",
    answer:
      "If a trucker expects to return empty, they quote 1.5× to 1.8× the one-way base rate to recover the deadhead cost. Securing a return load through a board like LoadSaathi typically drops the onward quote by 20–30% because the truck gets paid in both directions.",
  },
  {
    question: "What is the per-tonne-km rate for FTL vs PTL?",
    answer:
      "Full truckload (FTL) runs about ₹2.20–₹3.80 per tonne per km, decreasing over distances beyond 500 km. Part truckload (PTL) runs higher at ₹4.50–₹8.00 per tonne per km because of hub handling and sorting overhead.",
  },
];

export const rateBenchmarkFaqJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: RATE_BENCHMARK_FAQ.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
});

const COST_FACTORS = [
  {
    icon: Fuel,
    title: "Fuel (diesel)",
    text: "About 45–55% of total operating cost per km — the single biggest driver of rate movement.",
  },
  {
    icon: Route,
    title: "Tolls",
    text: "₹3–₹8/km on national highways, depending on the corridor and number of check-posts.",
  },
  {
    icon: Undo2,
    title: "Return trip (empty miles)",
    text: "One-way loads are quoted at 1.5×–1.8× base rate. A booked return load cuts the onward quote by 20–30%.",
  },
];

export default function RateBenchmarks2026() {
  return (
    <section className="px-6 sm:px-12 pb-16" aria-labelledby="rate-benchmarks-2026">
      <div className="max-w-3xl mx-auto">
        <h2
          id="rate-benchmarks-2026"
          className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2"
        >
          2026 Truck Rate Benchmarks (₹ per km)
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Indicative all-India rate ranges by vehicle type for 2026. Actual rates vary with
          diesel prices, terrain, season and return-load availability — use these as a sanity
          check before you book.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-orange-100 dark:border-orange-900/30 bg-white/60 dark:bg-gray-900/50">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-orange-100 dark:border-orange-900/30 bg-orange-50/60 dark:bg-orange-900/10">
                <th className="text-left px-4 py-3 font-black text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Vehicle Type
                </th>
                <th className="text-left px-4 py-3 font-black text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Payload
                </th>
                <th className="text-left px-4 py-3 font-black text-xs uppercase tracking-wider text-orange-700 dark:text-orange-400">
                  Avg Rate / km
                </th>
                <th className="text-left px-4 py-3 font-black text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Common Use
                </th>
              </tr>
            </thead>
            <tbody>
              {RATE_BENCHMARK_ROWS.map((row) => (
                <tr
                  key={row.vehicle}
                  className="border-b border-orange-50 dark:border-orange-900/10 last:border-0"
                >
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                    {row.vehicle}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {row.capacity}
                  </td>
                  <td className="px-4 py-3 font-black text-orange-700 dark:text-orange-400 whitespace-nowrap">
                    {row.rate}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{row.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-black text-gray-900 dark:text-white mt-10 mb-1">
          How freight charges are calculated
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Per tonne-kilometre, full truckload (FTL) freight runs about ₹2.20–₹3.80 per tonne
          per km — cheaper over long distances because the whole vehicle is utilised. Part
          truckload (PTL) runs ₹4.50–₹8.00 per tonne per km, reflecting hub handling and
          sorting overhead. Three factors move the final number the most:
        </p>
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {COST_FACTORS.map((item) => (
            <div
              key={item.title}
              className="p-4 rounded-2xl bg-white/50 dark:bg-gray-900/50 border border-orange-100 dark:border-orange-900/20"
            >
              <div className="bg-orange-100 dark:bg-orange-900/30 w-9 h-9 rounded-xl flex items-center justify-center mb-2">
                <item.icon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1">
                <IndianRupee className="h-3 w-3 text-orange-500" />
                {item.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">
          Freight rate FAQs
        </h3>
        <div className="space-y-3">
          {RATE_BENCHMARK_FAQ.map((item) => (
            <details
              key={item.question}
              className="rounded-xl border border-orange-100 dark:border-orange-900/30 bg-white/60 dark:bg-gray-900/50 px-4 py-3 group"
            >
              <summary className="font-bold text-sm text-gray-900 dark:text-white cursor-pointer list-none flex items-center justify-between gap-2">
                {item.question}
                <span className="text-orange-500 text-xs shrink-0">+</span>
              </summary>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
