import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, ShieldCheck, MapPin, Handshake, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDishaGuide } from '@/components/DishaGuideProvider.hooks';
import HeroQuoteWidget, { CORRIDOR_COUNT } from './HeroQuoteWidget';
import { SharedTruckVisualizer } from '../components/truck/SharedTruckVisualizer';
import { trackPostLoadClick } from '@/utils/analytics';

const HeroSection = React.memo(() => {
  const { handleClick: guideHandleClick } = useDishaGuide();

  const scrollToRate = () => {
    const el = document.getElementById('instant-rate');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Focus on the next frame, not after an arbitrary delay: the field is
    // already in the DOM and `preventScroll` lets the smooth scroll finish
    // undisturbed. No artificial wait on the input path (Apple §1).
    requestAnimationFrame(() => {
      el.querySelector('input')?.focus({ preventScroll: true });
    });
  };

  return (
    /* Top-aligned instead of min-h + items-center: on desktop the centred
       slack pushed the whole hero down the fold. Content now starts under the
       nav and grows naturally (DK-01, §13.2 spacing). */
    <section className="relative overflow-hidden pt-6 sm:pt-8 lg:pt-12 pb-16 sm:pb-20">
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-bg.webp"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover opacity-20"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background/95 dark:from-[#0a1a2e]/90 dark:via-[#0a1a2e]/80 dark:to-[#0a1a2e]/95" />
      </div>

      <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-start">
          {/* ── Left: value prop + ONE primary CTA ── */}
          {/* Tight rhythm: `space-y-*` compiles to a sibling selector with
              higher specificity than any `mt-*` on the child, so the vertical
              rhythm is tuned here (not with margin overrides on the h1). */}
          <div className="space-y-4 sm:space-y-5 lg:space-y-6">
            <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-full text-sm w-max">
              <Star className="h-4 w-4 fill-orange-500 icon-hover" /> Live in East India — Early
              Access
            </div>
            {/* Display type needs breathing room: leading-none (1.0) crushes
                ascenders/descenders at lg:text-7xl, and tracking-tighter
                (-0.05em) over-tightens a 7-word headline (KR-02, EM-01, EM-03). */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground dark:text-white tracking-[-0.03em] leading-[1.1] text-balance">
              Pay Only for the Space You Fill
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              Save up to <strong className="text-foreground">40%</strong> vs booking a full truck —
              AI-matched space, live GPS tracking, GST-verified partners, zero broker commission.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="button"
                onClick={scrollToRate}
                className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-transform duration-150 active:scale-[0.97] min-h-12"
                aria-label="Check your instant freight rate"
              >
                Check Instant Rate <ArrowRight className="ml-2 h-5 w-5 icon-hover" />
              </Button>
              <Link
                to="/register?type=trucker"
                data-guide="hero-trucker-cta"
                onClick={() => guideHandleClick('[data-guide="hero-trucker-cta"]')}
              >
                <Button
                  variant="outline"
                  className="text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg border-foreground/20 dark:border-white/20 text-foreground dark:text-white hover:bg-foreground/5 dark:hover:bg-white/5 w-full sm:w-auto transition-transform duration-150 active:scale-[0.97] min-h-12"
                >
                  Attach Your Truck <ArrowRight className="ml-2 h-5 w-5 icon-hover" />
                </Button>
              </Link>
            </div>

            <Link
              to="/register?type=shipper"
              data-guide="hero-shipper-cta"
              onClick={() => {
                guideHandleClick('[data-guide="hero-shipper-cta"]');
                trackPostLoadClick({ source: "home-hero" });
              }}
              className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-fast"
            >
              I want to ship goods — start free posting <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-6 pt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-orange-500" /> GST-verified truckers
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-orange-500" /> Live GPS tracking
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Handshake className="h-4 w-4 text-orange-500" /> 0% broker commission
              </span>
            </div>

            {/* ── Instant value on the left: the quote sits directly under the
                promise, so the reward is reachable without scrolling
                (reciprocity CI-01, progressive disclosure FR-01). ── */}
            <div id="instant-rate" className="scroll-mt-24 pt-2 sm:pt-3">
              <HeroQuoteWidget />
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 pl-1 mt-2">
                <Gauge className="h-3.5 w-3.5" /> Instant estimates cover {CORRIDOR_COUNT} East-India corridors
                — no login needed.
              </p>
            </div>
          </div>

          {/* ── Right: interactive shared-truck visualizer ── */}
          <div className="space-y-4 sm:space-y-6">
            <SharedTruckVisualizer />
          </div>
        </div>
      </div>
    </section>
  );
});
HeroSection.displayName = 'HeroSection';

export default HeroSection;
