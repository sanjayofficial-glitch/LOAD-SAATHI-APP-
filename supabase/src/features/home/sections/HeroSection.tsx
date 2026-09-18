import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroSection = React.memo(() => {
  const stats = [
    { value: "40%", label: "Empty Trucks" },
    { value: "10x", label: "Slow Matching" },
    { value: "30-60 Days", label: "Delayed Payments" },
  ];

  return (
    <section className="min-h-[85vh] sm:min-h-[95vh] flex items-center relative overflow-hidden pt-16 sm:pt-0">
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-bg.webp"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover opacity-20"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background/95 dark:from-[#0a1a2e]/90 dark:via-[#0a1a2e]/80 dark:to-[#0a1a2e]/95" />
      </div>

      <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          <div className="space-y-6 sm:space-y-8 lg:space-y-10">
            <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-full text-sm w-max">
              <Star className="h-4 w-4 fill-orange-500 icon-hover" /> Live in East India — Early Access
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground dark:text-white tracking-tighter leading-none">
              The OS for<br />
              <span className="text-orange-600 dark:text-orange-500">India's Freight</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              AI-powered PTL/LTL matching platform that eliminates empty trucks, delivers real-time visibility, and pays truckers faster — starting in India's mineral and industrial heartland of Odisha, Jharkhand, and West Bengal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register?type=shipper">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg w-full sm:w-auto shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-transform duration-150 active:scale-[0.97]">
                  I Want to Ship Goods <ArrowRight className="ml-2 h-5 w-5 icon-hover" />
                </Button>
              </Link>
              <Link to="/register?type=trucker">
                <Button variant="outline" className="text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg border-foreground/20 dark:border-white/20 text-foreground dark:text-white hover:bg-foreground/5 dark:hover:bg-white/5 w-full sm:w-auto transition-transform duration-150 active:scale-[0.97]">
                   I Have Truck Space <ArrowRight className="ml-2 h-5 w-5 icon-hover" />
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { label: "See Problems", target: "problems" },
                { label: "How It Works", target: "how-it-works" },
                { label: "Platform", target: "platform" },
                { label: "FAQ", target: "faq" },
              ].map(({ label, target }) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(target);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors px-3 py-1.5 rounded-full border border-border/60 hover:border-orange-300 dark:hover:border-orange-700"
                >
                  {label} <ChevronDown className="h-3 w-3" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card/80 dark:bg-[#0d2035]/80 backdrop-blur-xl border border-border dark:border-white/10 rounded-2xl p-4 sm:p-8 shadow-lg dark:shadow-[0_0_50px_rgba(0,0,0,0.5)]">
             <div className="grid grid-cols-3 gap-3 sm:gap-6 text-center sm:text-left">
                {stats.map((stat, i) => (
                  <div key={i} className="p-3 sm:p-4 bg-muted/50 dark:bg-black/40 border border-border dark:border-white/5 rounded-xl animate-fade-in-up" style={{ animationDelay: `${i * 120}ms` }}>
                     <p className="text-xl sm:text-3xl font-black text-orange-600 dark:text-orange-500 mb-1">{stat.value}</p>
                     <p className="text-[11px] sm:text-sm font-medium text-foreground dark:text-white leading-tight">{stat.label}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </section>
  );
});
HeroSection.displayName = "HeroSection";

export default HeroSection;
