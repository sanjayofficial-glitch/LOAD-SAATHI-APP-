import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Package, ChevronRight } from 'lucide-react';

const shipperBenefits = [
  { title: 'Up to 40% Cost Reduction', desc: 'AI-optimized pricing and shared truck capacity mean you pay less per ton — PTL and LTL rates that brokers cannot match.' },
  { title: 'No More Broker Dependency', desc: 'Direct access to verified truckers. Transparent pricing. No hidden commissions eating into your margins.' },
  { title: 'Real-Time Visibility', desc: 'GPS tracking from pickup to delivery. Share live ETAs with your customers. No more "where is my shipment?" calls.' },
  { title: 'Trusted Truckers', desc: 'Every trucker has a credit score (300-900), verified profile, and bidirectional reviews. Choose with confidence.' },
  { title: 'Flexible PTL/LTL', desc: 'Ship 1 kg or 10 tons. Share truck space with other shippers. Pay only for what you use.' },
] as const;

const truckerBenefits = [
  { title: 'Zero Empty Return Trips', desc: 'AI finds return loads for every route. Fill your truck both ways and earn on every kilometer — not just half the journey.' },
  { title: 'Higher Earnings', desc: 'Direct shipper access means no broker commissions. AI price prediction helps you bid competitively and win more loads.' },
  { title: 'Build Your Digital Reputation', desc: 'Credit score, reviews, completion rate — your track record follows you. Higher scores unlock premium, higher-paying loads.' },
  { title: 'Instant Payments', desc: 'Escrow-backed digital settlements. No more chasing payments for weeks. Get paid as soon as delivery is confirmed.', comingSoon: true },
  { title: 'Smart Route Optimization', desc: 'AI suggests the best routes, loads, and pricing for your vehicle type and location. Maximize fleet utilization effortlessly.' },
];

const WhyLoadSaathi = React.memo(() => (
  <section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.08] dark:opacity-[0.12] pointer-events-none"
      style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', filter: 'blur(60px)' }} />
    <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Why LoadSaathi?</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Whether you are shipping goods or hauling loads, LoadSaathi solves the problems that have plagued East India&apos;s freight industry for decades.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-8 rounded-xl border border-blue-500/20">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Package className="h-5 w-5 text-blue-400" /> Why Ship on LoadSaathi?
          </h3>
          <div className="space-y-4">
            {shipperBenefits.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-900/20 border border-blue-700/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-400">{i + 1}</span>
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/solutions/shippers" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-500 hover:text-blue-400 mt-6">
            Start Shipping <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="glass-card p-8 rounded-xl border border-orange-500/20">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Truck className="h-5 w-5 text-orange-400" /> Why Drive on LoadSaathi?
          </h3>
          <div className="space-y-4">
            {truckerBenefits.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-900/20 border border-orange-700/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-orange-400">{i + 1}</span>
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                    {item.title}
                    {'comingSoon' in item && item.comingSoon && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        Coming soon
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/solutions/truckers" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-500 hover:text-orange-400 mt-6">
            Start Driving <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  </section>
));
WhyLoadSaathi.displayName = "WhyLoadSaathi";

export default WhyLoadSaathi;
