import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Brain, MessageSquare, Shield, Star, Activity, ArrowRight } from 'lucide-react';

const items = [
  { title: "Dashboard", desc: "Real-time stats, earnings, and activity at a glance.", icon: LayoutDashboard, link: "/screens/dashboard" },
  { title: "AI Matching", desc: "Smart load-to-truck matching with confidence scores.", icon: Brain, link: "/screens/matching" },
  { title: "Chat", desc: "Direct communication between shippers and truckers.", icon: MessageSquare, link: "/screens/chat" },
  { title: "Credit Score", desc: "Digital reputation system for trust and transparency.", icon: Shield, link: "/screens/credit-score" },
  { title: "Reviews", desc: "Bidirectional ratings that build accountability.", icon: Star, link: "/screens/reviews" },
  { title: "Admin Center", desc: "Command and control for platform operators.", icon: Activity, link: "/screens/admin" },
] as const;

const AppPreview = React.memo(() => (
  <section className="fade-section py-24 relative">
    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.08] dark:opacity-[0.12] pointer-events-none"
      style={{ background: "radial-gradient(circle, #f97316 0%, transparent 70%)", filter: "blur(60px)" }} />
    <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">See LoadSaathi in Action</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Explore the screens that power India&apos;s intelligent freight network.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link key={i} to={item.link} className="glass-card p-6 rounded-xl border border-border hover:border-orange-500/30 transition-all duration-300 group">
              <div className="bg-orange-100 dark:bg-orange-900/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
              <div className="flex items-center gap-1 text-xs font-semibold text-orange-500 mt-4">
                Preview <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  </section>
));
AppPreview.displayName = "AppPreview";

export default AppPreview;
