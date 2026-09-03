import React from 'react';
import { Package, Brain, Map } from 'lucide-react';

const items = [
  { title: 'PTL & LTL Freight', desc: 'Share truck capacity across multiple shippers. Pay only for the space you use — no more paying for a full truck when your load is 3 tons.', icon: Package },
  { title: 'AI-Matched Logistics', desc: 'Our neural matching engine finds the perfect truck for your route, cargo, and timeline in seconds — not days of calling brokers.', icon: Brain },
  { title: 'East India Focused', desc: 'Starting with the Rourkela–Ranchi–Burdwan corridor, we are building the freight network for Odisha, Jharkhand, West Bengal, and beyond.', icon: Map },
] as const;

const WhatIsLoadSaathi = React.memo(() => (
  <section className="fade-section py-24 relative">
    <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-black mb-6 text-foreground dark:text-white">What is LoadSaathi?</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          LoadSaathi is India&apos;s AI-powered shared freight marketplace that connects shippers and truckers for Partial Truckload (PTL) and Less Than Truckload (LTL) loads across East India. Built for MSMEs in Tier 2 and 3 cities, LoadSaathi eliminates empty return trips, reduces freight costs by up to 40%, and brings digital trust to an industry that has operated on phone calls and brokers for decades.
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          LoadSaathi is a truck freight and logistics company (loadsaathi.in). It is <strong>not</strong> a loan, lending, or financial services business, and it has no connection to any &ldquo;Loan Saathi&rdquo; finance website.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item, i) => (
          <div key={i} className="glass-card p-8 rounded-xl border border-border hover:border-orange-500/30 transition-all duration-300 group text-center">
            <div className="bg-orange-100 dark:bg-orange-900/20 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <item.icon className="h-7 w-7 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
));
WhatIsLoadSaathi.displayName = "WhatIsLoadSaathi";

export default WhatIsLoadSaathi;
