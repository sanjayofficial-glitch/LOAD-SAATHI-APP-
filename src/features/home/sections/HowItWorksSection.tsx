import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Package, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const shipperSteps = [
  { step: "01", title: "Post Your Shipment", desc: "Enter load details — origin, destination, weight, timeline. AI suggests optimal pricing instantly." },
  { step: "02", title: "Get AI-Matched", desc: "Our engine finds the best truckers for your route. Review profiles, credit scores, and past ratings." },
  { step: "03", title: "Track in Real-Time", desc: "GPS tracking from pickup to delivery. No more 'kahan pahuncha?' calls." },
  { step: "04", title: "Rate & Review", desc: "Build your shipper reputation. Leave reviews that help the next trucker choose wisely." },
] as const;

const truckerSteps = [
  { step: "01", title: "Register Your Fleet", desc: "Set up your profile, vehicle details, and service areas. Your digital identity in freight." },
  { step: "02", title: "Find Loads Instantly", desc: "Browse available shipments matched to your route. AI recommends the best paying loads." },
  { step: "03", title: "Haul with Confidence", desc: "Share live location. Get paid faster. Build your credit score with every completed trip." },
  { step: "04", title: "Grow Your Business", desc: "Higher credit scores unlock better loads. Direct relationships replace broker dependency." },
] as const;

const HowItWorksSection = React.memo(() => (
  <section className="fade-section py-24 relative">
    <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.06] dark:opacity-[0.10] pointer-events-none"
      style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)", filter: "blur(60px)" }} />
    <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">How LoadSaathi Works</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Two sides, one platform. Whether you&apos;re shipping goods or hauling loads, the process is simple.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="glass-card p-8 rounded-xl border border-blue-500/20">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Package className="h-5 w-5 text-blue-400" /> For Shippers
          </h3>
          <div className="space-y-6">
            {shipperSteps.map((item, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-2xl font-black text-blue-400 dark:text-blue-500 shrink-0">{item.step}</span>
                <div>
                  <h4 className="font-bold text-foreground">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/solutions/shippers" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-500 hover:text-orange-400 mt-6">
            Learn More <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="glass-card p-8 rounded-xl border border-orange-500/20">
          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Truck className="h-5 w-5 text-orange-400" /> For Truckers
          </h3>
          <div className="space-y-6">
            {truckerSteps.map((item, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-2xl font-black text-orange-400 dark:text-orange-500 shrink-0">{item.step}</span>
                <div>
                  <h4 className="font-bold text-foreground">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/solutions/truckers" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-500 hover:text-orange-400 mt-6">
            Learn More <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="text-center">
        <Link to="/how-it-works">
          <Button variant="outline" className="text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg border-border hover:border-orange-400 text-foreground">
            See Full Walkthrough <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  </section>
));
HowItWorksSection.displayName = "HowItWorksSection";

export default HowItWorksSection;
