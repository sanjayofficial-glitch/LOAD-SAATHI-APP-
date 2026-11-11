import { IndianRupee, Fuel, Route, Undo2 } from "lucide-react";

/**
 * 2026 truck rate benchmarks shared by the fare, truck load and return load
 * calculators. Figures come from the site's published 2026 rate-benchmark
 * article — keep them in sync with the per-km rate table in the blog content.
 */

import {
  RATE_BENCHMARK_ROWS,
  RATE_BENCHMARK_FAQ,
} from './RateBenchmarks2026.data';

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
