import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Star, UserCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const items = [
  { icon: Shield, title: "Credit Score (300-900)", desc: "Every user has a digital freight credit score based on completion rate, reliability, reviews, and tenure." },
  { icon: Star, title: "Bidirectional Reviews", desc: "Both shippers and truckers rate each other after every completed trip. Transparency builds accountability." },
  { icon: UserCheck, title: "Verified Profiles", desc: "Phone-verified accounts and detailed fleet documentation ensure you know who you're dealing with." },
] as const;

const SafetyTrust = React.memo(() => (
  <section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.06] dark:opacity-[0.10] pointer-events-none"
      style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)", filter: "blur(60px)" }} />
    <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Built on Trust</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Every transaction is backed by a digital reputation system that rewards reliability.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="glass-card p-8 rounded-xl border border-border hover:border-blue-500/30 transition-all duration-300">
              <Icon className="text-blue-500 text-3xl mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          );
        })}
      </div>
      <div className="text-center">
        <Link to="/safety-trust">
          <Button variant="outline" className="text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg border-border hover:border-blue-400 text-foreground">
            Learn About Safety & Trust <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  </section>
));
SafetyTrust.displayName = "SafetyTrust";

export default SafetyTrust;
