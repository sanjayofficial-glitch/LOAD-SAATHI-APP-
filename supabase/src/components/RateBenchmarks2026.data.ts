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
