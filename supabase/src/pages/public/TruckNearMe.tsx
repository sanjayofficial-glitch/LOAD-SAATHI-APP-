import { Reveal } from "@/components/motion";
import { Link } from 'react-router-dom';
import { Truck, MapPin, ArrowRight, CheckCircle, Search, Shield, Clock, MessageCircle, Navigation, Eye, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SeoMeta from "@/components/SeoMeta";

const problems = [
  {
    icon: PhoneCall,
    title: 'Endless Broker Calls',
    desc: 'One truck means calling 10–15 brokers, waiting for callbacks, and still not knowing if the truck is real. Hours wasted before loading even starts.',
    color: 'text-red-500',
  },
  {
    icon: Eye,
    title: 'No Rate Clarity',
    desc: 'Every broker quotes differently for the same route. Without a market rate to compare, you never know if you are paying fairly.',
    color: 'text-orange-500',
  },
  {
    icon: Shield,
    title: 'Unverified Drivers',
    desc: 'A number from a broker tells you nothing about the driver, the truck, or whether the vehicle papers are valid.',
    color: 'text-yellow-500',
  },
  {
    icon: Navigation,
    title: 'No Shipment Visibility',
    desc: 'Once the truck leaves, you are chasing phone calls to find out where your goods are and when they will arrive.',
    color: 'text-blue-400',
  },
];

const steps = [
  { step: '1', title: 'Enter Your Route', desc: 'Add pickup city, delivery city, cargo weight and type. Takes under a minute — on any phone.' },
  { step: '2', title: 'See Nearby Trucks', desc: 'LoadSaathi shows available truckers on your route with vehicle type, capacity and their credit score.' },
  { step: '3', title: 'Book & Track', desc: 'Send a booking request, confirm the fare, and follow your load on the map with live GPS until delivery.' },
];

const benefits = [
  {
    icon: Search,
    title: 'Trucks on Your Route, Not Random Calls',
    desc: 'Search once instead of dialling repeatedly. LoadSaathi matches your load with truckers already heading from your pickup city to your delivery city.',
  },
  {
    icon: Shield,
    title: 'Verified Truckers & Credit Scores',
    desc: 'Every trucker profile carries a credit score (300–900) built from completion rate, on-time record and reviews — so you know who you are booking.',
  },
  {
    icon: Clock,
    title: 'Transparent Market Rates',
    desc: 'AI price prediction shows the going rate for your route before you confirm, so you can compare instead of haggling in the dark.',
  },
  {
    icon: MessageCircle,
    title: 'In-App Chat & Live Tracking',
    desc: 'Coordinate pickup details in chat and watch your consignment move on the map. No more calling the broker for every update.',
  },
];

const coverageCities = [
  { name: 'Ranchi', state: 'Jharkhand', slug: 'ranchi' },
  { name: 'Bhubaneswar', state: 'Odisha', slug: 'bhubaneswar' },
  { name: 'Rourkela', state: 'Odisha', slug: 'rourkela' },
  { name: 'Jamshedpur', state: 'Jharkhand', slug: 'jamshedpur' },
  { name: 'Balasore', state: 'Odisha', slug: 'balasore' },
  { name: 'Berhampur', state: 'Odisha', slug: 'berhampur' },
  { name: 'Kolkata', state: 'West Bengal', slug: 'kolkata' },
  { name: 'Durgapur', state: 'West Bengal', slug: 'durgapur' },
  { name: 'Burdwan', state: 'West Bengal', slug: 'burdwan' },
];

const faqs = [
  {
    q: 'How do I find a truck near me for loading?',
    a: 'Search "truck near me" on LoadSaathi or open the app, enter your pickup and delivery city with cargo weight, and you will see available truckers on that route with vehicle type, capacity and credit score. You can book directly without calling a single broker.',
  },
  {
    q: 'Is there a charge to search for trucks on LoadSaathi?',
    a: 'Searching and comparing trucks on LoadSaathi is free for shippers. You see market rates and trucker profiles before sending a booking request, so you can decide before committing.',
  },
  {
    q: 'How is this different from calling a local transport broker?',
    a: 'A broker gives you a phone number and a verbal quote. LoadSaathi gives you a searchable list of truckers on your route, each with a verified profile, credit score, transparent market rate and live GPS tracking after booking.',
  },
  {
    q: 'Kya main chhote town se bhi truck book kar sakta hoon?',
    a: 'Haan. LoadSaathi Jharkhand, Odisha aur West Bengal ke Tier-2 aur Tier-3 towns tak cover karta hai — jaise Balasore, Berhampur, Rourkela aur Durgapur. Aapko bas apna pickup aur delivery city select karna hai.',
  },
  {
    q: 'How do I know the trucker is reliable?',
    a: 'Every trucker on LoadSaathi has a credit score between 300 and 900, calculated from trip completion rate, on-time delivery, communication quality and reviews from other shippers. You can review the score and history before booking.',
  },
];

export default function TruckNearMe() {
  return (
    <>
      <noscript>
        <div style={{maxWidth:800,margin:'0 auto',padding:'32px',fontFamily:'system-ui'}}>
          <h2>Find a Truck Near You Without Calling a Broker — LoadSaathi</h2>
          <p>Searching for "truck near me"? LoadSaathi is a truck booking platform for Indian shippers that shows available trucks on your route — with vehicle type, capacity, transparent market rates and trucker credit scores — so you can book a goods carrier nearby without calling multiple brokers. Live in Jharkhand, Odisha and West Bengal, including Tier-2 and Tier-3 towns.</p>
          <h2>Why Book a Truck Online Instead of Calling Brokers?</h2>
          <ul>
            <li><strong>Search once, not 15 calls:</strong> Enter pickup city, delivery city and cargo weight to see every available trucker on your route.</li>
            <li><strong>Rate clarity:</strong> AI price prediction shows the going market rate for your route before you confirm.</li>
            <li><strong>Verified truckers:</strong> Each trucker carries a 300–900 credit score based on completion rate, on-time record and reviews.</li>
            <li><strong>Live GPS tracking:</strong> Follow your consignment on the map after pickup instead of chasing phone updates.</li>
          </ul>
          <h2>How It Works</h2>
          <ol>
            <li>Enter pickup city, delivery city, cargo weight and type</li>
            <li>Compare nearby trucks with capacity, vehicle type and credit score</li>
            <li>Confirm the fare, book the truck, and track the load live until delivery</li>
          </ol>
          <h2>Cities Covered</h2>
          <p>Trucks available across Ranchi, Bhubaneswar, Rourkela, Jamshedpur, Balasore, Berhampur, Kolkata, Durgapur and Burdwan, plus surrounding towns in Jharkhand, Odisha and West Bengal.</p>
          <h2>Get Started</h2>
          <p>Visit loadsaathi.in/register as a shipper to find a truck near you and book in minutes.</p>
        </div>
      </noscript>
      <SeoMeta
        title="Truck Near Me — Find a Truck for Loading Nearby | LoadSaathi"
        description="Searching 'truck near me'? Find trucks near you on LoadSaathi: compare vehicle types, capacity, market rates and trucker credit scores, then book without calling brokers. Live in Odisha, Jharkhand & West Bengal."
        keywords="truck near me, transport service near me, truck booking near me, hire truck for loading, goods carrier near me, lorry near me, tempo booking near me"
        canonical="/truck-near-me"
        breadcrumbs={[{ name: "Truck Near Me", url: "/truck-near-me" }]}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "LoadSaathi Truck Booking — Find Trucks Nearby",
            "description": "Search available trucks on your route by city, vehicle type and capacity, compare market rates, and book with GPS-tracked delivery across Odisha, Jharkhand and West Bengal.",
            "provider": {
              "@type": "Organization",
              "name": "LoadSaathi",
              "url": "https://loadsaathi.in"
            },
            "areaServed": ["Odisha", "Jharkhand", "West Bengal"],
            "serviceType": "Truck Booking"
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map((f) => ({
              "@type": "Question",
              "name": f.q,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": f.a
              }
            }))
          }
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased overflow-x-hidden">

      {/* HERO */}
      <section className="relative min-h-[620px] flex items-center overflow-hidden pt-24">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.12] dark:opacity-[0.15]"
            style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.10] dark:opacity-[0.12]"
            style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 w-full relative z-10 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col space-y-8">
              <div className="inline-flex items-center gap-2 w-fit">
                <span className="text-xs font-semibold tracking-widest uppercase bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-700/30">
                  For Shippers & MSMEs
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
                Find a Truck<br />
                <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">Near You.</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Stop calling ten brokers for one truck. Search trucks on your route, compare capacity and market rates, see each trucker's credit score — and book in minutes.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <Link to="/register?type=shipper">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-6 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.4)] group">
                    Find a Truck Now
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/tools/fare-calculator">
                  <Button variant="outline" className="text-sm font-bold tracking-wider uppercase px-8 py-6 h-auto rounded-lg border-border hover:border-orange-400 hover:text-orange-500 dark:hover:text-orange-400 transition-all text-foreground">
                    Check Market Rate
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative animate-float h-full min-h-[400px] flex items-center justify-center">
              <div className="glass-panel w-full h-[520px] rounded-xl p-6 flex flex-col shadow-2xl">
                <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse-ring" />
                    <span className="text-xs text-muted-foreground dark:text-gray-300 uppercase tracking-widest">Trucks Near You</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-orange-900/50 text-orange-300 px-2 py-1 rounded border border-orange-700/50">LIVE</span>
                  </div>
                </div>
                <div className="flex-grow relative bg-card/50 rounded border border-border overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-30" />
                  <div className="p-5 space-y-4 relative z-10">
                    <div className="glass-card p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase mb-1">Pickup</div>
                        <div className="text-2xl font-black text-foreground">Rourkela</div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-orange-400" />
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase mb-1">Delivery</div>
                        <div className="text-2xl font-black text-foreground">Kolkata</div>
                      </div>
                    </div>
                    <div className="glass-card p-4 rounded-lg">
                      <div className="text-xs text-muted-foreground uppercase mb-3">Available Trucks</div>
                      <div className="space-y-2">
                        {[
                          { truck: '32 FT MXL', cap: '16 Ton', score: 'Score 780' },
                          { truck: 'Tata 407', cap: '7 Ton', score: 'Score 745' },
                          { truck: 'Trailer', cap: '25 Ton', score: 'Score 712' },
                        ].map((item, i) => (
                          <div key={i} className="flex justify-between items-center border-b border-border pb-2 last:border-b-0 last:pb-0">
                            <div className="flex items-center gap-2">
                              <Truck className="h-3 w-3 text-orange-400" />
                              <span className="text-xs font-semibold text-foreground">{item.truck}</span>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <span className="text-xs font-bold text-foreground">{item.cap}</span>
                              <span className="text-[10px] font-semibold text-green-400">{item.score}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="glass-card p-3 rounded-lg flex items-center gap-3">
                      <Clock className="h-4 w-4 text-orange-400 shrink-0" />
                      <span className="text-xs text-muted-foreground">Market rate shown before you confirm — compare, then book</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMS */}
      <Reveal as="section" className="py-24 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.08] dark:opacity-[0.12] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Why "Truck Near Me" Searches Fail Offline</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">Finding a goods carrier through local brokers is slow, opaque and risky. Here is what shippers deal with today.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {problems.map((problem, i) => (
              <div key={i} className="glass-card p-8 rounded-xl hover:border-orange-500/30 elevate group">
                <problem.icon className={`${problem.color} text-3xl mb-4 group-hover:scale-110 transition-transform duration-300`} />
                <h3 className="text-lg font-bold text-foreground mb-2">{problem.title}</h3>
                <p className="text-sm text-muted-foreground">{problem.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* HOW IT WORKS */}
      <Reveal as="section" className="py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Book a Truck in 3 Steps</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">From searching to live tracking — on any phone, in under a minute.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="glass-card p-8 rounded-xl text-center hover:border-orange-500/30 elevate relative">
                <div className="bg-orange-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-black">{step.step}</div>
                <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* BENEFITS */}
      <Reveal as="section" className="py-24 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">One Search Instead of Fifteen Calls</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">Everything a broker promised — search, price, trust and visibility — in one app.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, i) => (
              <div key={i} className="glass-card p-8 rounded-xl hover:border-green-500/30 elevate group">
                <div className="flex items-start gap-5">
                  <div className="bg-green-600/10 dark:bg-green-900/20 p-3 rounded-xl shrink-0">
                    <benefit.icon className="text-green-500 text-2xl group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* COVERAGE */}
      <Reveal as="section" className="py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Trucks Available Near You</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">Active corridors across Jharkhand, Odisha and West Bengal — including Tier-2 and Tier-3 towns that brokers often ignore.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coverageCities.map((city, i) => (
              <Link key={i} to={`/transport-service/${city.slug}`} className="glass-card p-5 rounded-xl hover:border-orange-500/30 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-orange-400" />
                    <div>
                      <span className="text-sm font-semibold text-foreground block">{city.name}</span>
                      <span className="text-xs text-muted-foreground">{city.state}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      {/* FAQ */}
      <Reveal as="section" className="py-24 relative">
        <div className="max-w-3xl mx-auto px-6 sm:px-12 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">Common questions about finding a truck nearby on LoadSaathi.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((item, i) => (
              <div key={i} className="glass-card p-6 rounded-xl border-border dark:border-white/[0.08]">
                <h3 className="font-bold text-foreground mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* RELATED ROUTES */}
      <Reveal as="section" className="py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Popular Routes Near You</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">Browse freight rates on the busiest East India corridors.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { from: 'Ranchi', to: 'Kolkata', slug: 'ranchi-to-kolkata' },
              { from: 'Rourkela', to: 'Bhubaneswar', slug: 'rourkela-to-bhubaneswar' },
              { from: 'Balasore', to: 'Bhubaneswar', slug: 'balasore-to-bhubaneswar' },
              { from: 'Jamshedpur', to: 'Kolkata', slug: 'jamshedpur-to-kolkata' },
              { from: 'Bhubaneswar', to: 'Kolkata', slug: 'bhubaneswar-to-kolkata' },
              { from: 'Dhanbad', to: 'Jamshedpur', slug: 'dhanbad-to-jamshedpur' },
            ].map((route, i) => (
              <Link key={i} to={`/routes/${route.slug}`} className="glass-card p-5 rounded-xl hover:border-orange-500/30 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-orange-400" />
                    <span className="text-sm font-semibold text-foreground">{route.from} → {route.to}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      {/* CTA */}
      <Reveal as="section" className="py-32 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-900/5 to-transparent dark:bg-[radial-gradient(ellipse_at_center,_rgba(249,115,22,0.12),transparent_70%)]" />
        <div className="max-w-xl w-full mx-auto px-6 sm:px-12 relative z-10">
          <div className="glass-card p-10 sm:p-14 rounded-2xl border border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.1)] text-center">
            <div className="bg-orange-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Truck className="h-8 w-8 text-orange-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">Find Your Truck.<br />Skip the Broker.</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md mx-auto">Search trucks on your route, compare rates and credit scores, and book with live GPS tracking — all from one app.</p>
            <div className="space-y-3">
              <Link to="/register?type=shipper">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-6 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)] group">
                  Find a Truck Now <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <div className="flex items-center justify-center gap-6 pt-2">
                {['Free to search', 'Verified truckers', 'Live GPS tracking'].map((item, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle className="h-3 w-3 text-orange-400" /> {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

    </div>
    </>
  );
}
