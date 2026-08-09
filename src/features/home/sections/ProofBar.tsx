import React from 'react';

const ProofBar = React.memo(() => (
  <section className="fade-section border-y border-border dark:border-white/5 bg-muted/50 dark:bg-[#010f1f]/80 backdrop-blur-sm">
    <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-8 flex flex-col md:flex-row justify-center items-center gap-x-16 gap-y-8">
      {[
        { value: '40%', label: 'Empty Kilometers Today' },
        { value: '₹1.5L Cr', label: 'Annual Economic Loss' },
        { value: '0%', label: 'Tolerance for Inefficiency' },
      ].map((stat, i) => (
        <div key={i} className="text-center">
          <div className="text-4xl sm:text-5xl font-black text-orange-600 dark:text-orange-400 tracking-tight">{stat.value}</div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">{stat.label}</div>
        </div>
      ))}
      <p className="w-full text-center text-xs sm:text-sm text-muted-foreground/60 mt-2">Sources: Ministry of Road Transport &amp; Highways 2025, IBEF Logistics Report 2026</p>
    </div>
  </section>
));
ProofBar.displayName = "ProofBar";

export default ProofBar;
