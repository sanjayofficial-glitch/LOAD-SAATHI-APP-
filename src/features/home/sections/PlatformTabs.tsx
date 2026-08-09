import React, { useState } from 'react';
import { Truck, Package, Brain, Map, Search, MapPin, Shield, BarChart3, MessageSquare, Route, TrendingUp, DollarSign, Star, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  accent: string;
  accentClass: string;
}

const tabs = [
  { id: 'shipper', label: 'Shipper OS' },
  { id: 'transporter', label: 'Transporter OS' },
  { id: 'command', label: 'AI Command Center' },
] as const;

const shipperFeatures: Feature[] = [
  { icon: Package, title: 'AI-Powered Shipment Posting', desc: 'Enter load details — origin, destination, weight, timeline. AI suggests optimal pricing based on market data.', accent: 'Smart Pricing', accentClass: 'text-blue-400 bg-blue-900/20 border-blue-700/30' },
  { icon: Search, title: 'Intelligent Truck Matching', desc: 'Find available trucks matched to your route and cargo type. View credit scores, ratings, and past performance.', accent: '98% Match Accuracy', accentClass: 'text-emerald-400 bg-emerald-900/20 border-emerald-700/30' },
  { icon: MapPin, title: 'Real-Time GPS Tracking', desc: 'Live tracking from pickup to delivery with ETA updates. No more "kahan pahuncha?" coordination calls.', accent: 'Live', accentClass: 'text-blue-400 bg-blue-900/20 border-blue-700/30' },
  { icon: Shield, title: 'Shipper Credit Score (300–900)', desc: 'Build your shipper reputation with every transaction. Higher scores attract premium truckers instantly.', accent: 'Score: 720', accentClass: 'text-orange-400 bg-orange-900/20 border-orange-700/30' },
  { icon: BarChart3, title: 'Shipment Analytics & Insights', desc: 'Track costs, transit times, and carrier performance. Data-driven decisions to optimize your logistics.', accent: '+34% Efficiency', accentClass: 'text-emerald-400 bg-emerald-900/20 border-emerald-700/30' },
  { icon: MessageSquare, title: 'Direct Shipper–Trucker Chat', desc: 'Communicate directly with truckers. Share documents, negotiate rates, and build relationships — no middlemen.', accent: 'Instant', accentClass: 'text-blue-400 bg-blue-900/20 border-blue-700/30' },
] as const;

const transporterFeatures: Feature[] = [
  { icon: Truck, title: 'Load Discovery Dashboard', desc: 'Browse available shipments matched to your route and vehicle type. AI prioritizes the highest-paying loads first.', accent: '12 Loads Found', accentClass: 'text-orange-400 bg-orange-900/20 border-orange-700/30' },
  { icon: Route, title: 'Smart Route Optimization', desc: 'AI suggests return loads to eliminate empty trips. Maximize every kilometer on the Rourkela–Ranchi–Burdwan corridor.', accent: '0% Empty Target', accentClass: 'text-emerald-400 bg-emerald-900/20 border-emerald-700/30' },
  { icon: MapPin, title: 'Live Location Sharing', desc: 'Share your trip location with shippers automatically. Build trust through complete transparency on every delivery.', accent: 'Sharing', accentClass: 'text-orange-400 bg-orange-900/20 border-orange-700/30' },
  { icon: TrendingUp, title: 'Transporter Credit Score', desc: '300–900 credit score based on completion rate, reviews, and tenure. Higher scores unlock premium, higher-paying loads.', accent: 'Score: 810', accentClass: 'text-emerald-400 bg-emerald-900/20 border-emerald-700/30' },
  { icon: DollarSign, title: 'Earnings & Payments Dashboard', desc: 'Track trip earnings, incentives, and payment history in real time. Digital settlements mean faster, transparent payouts.', accent: '₹45K This Week', accentClass: 'text-orange-400 bg-orange-900/20 border-orange-700/30' },
  { icon: Star, title: 'Reputation & Bidirectional Reviews', desc: 'Build your profile with ratings from every trip. Higher ratings mean preferential access to top-paying loads.', accent: '4.8 ★ Rating', accentClass: 'text-yellow-400 bg-yellow-900/20 border-yellow-700/30' },
] as const;

const commandFeatures: Feature[] = [
  { icon: Brain, title: 'Smart Load–Truck Matching', desc: 'Proprietary neural algorithm pairs every shipment with the optimal truck based on route, capacity, timing, and price preferences.', accent: '99.2% Accuracy', accentClass: 'text-orange-400 bg-orange-900/20 border-orange-700/30' },
  { icon: TrendingUp, title: 'Dynamic Price Prediction', desc: 'Real-time pricing engine analyzes market demand, fuel costs, and seasonal patterns to suggest fair, competitive rates instantly.', accent: 'Market +5.2%', accentClass: 'text-emerald-400 bg-emerald-900/20 border-emerald-700/30' },
  { icon: Activity, title: 'Network Demand Forecasting', desc: 'Predict capacity shortages 7 days in advance. AI identifies high-demand corridors and alerts transporters to position their fleet.', accent: 'Demand: High', accentClass: 'text-orange-400 bg-orange-900/20 border-orange-700/30' },
  { icon: Shield, title: 'Fraud Detection & Trust Layer', desc: 'Automated verification flags suspicious activity across the network. Digital trail on every transaction ensures accountability.', accent: '0 Fraud Incidents', accentClass: 'text-emerald-400 bg-emerald-900/20 border-emerald-700/30' },
  { icon: BarChart3, title: 'Fleet Utilization Analytics', desc: 'Aggregate network-wide analytics — fill rates, empty kilometers, route efficiency. Benchmark your fleet against corridor averages.', accent: '87% Utilization', accentClass: 'text-blue-400 bg-blue-900/20 border-blue-700/30' },
  { icon: Map, title: 'Corridor Intelligence', desc: 'Real-time insights on East India\'s primary freight corridors. Traffic patterns, weather conditions, and route disruptions.', accent: '3 Corridors Live', accentClass: 'text-orange-400 bg-orange-900/20 border-orange-700/30' },
] as const;

const FeatureCard = React.memo(({ feat }: { feat: Feature }) => {
  const Icon = feat.icon;
  return (
    <div className="glass-card p-4 rounded-lg border border-border hover:border-orange-500/30 transition-all duration-300 group min-h-[180px] flex flex-col">
      <div className="bg-orange-900/10 dark:bg-orange-900/10 w-9 h-9 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shrink-0">
        <Icon className="h-4 w-4 text-orange-400" />
      </div>
      <h3 className="text-sm font-bold text-foreground mb-1.5">{feat.title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed flex-grow">{feat.desc}</p>
      <span className={`mt-auto inline-block text-[10px] font-semibold ${feat.accentClass} px-2 py-0.5 rounded border w-fit`}>{feat.accent}</span>
    </div>
  );
});
FeatureCard.displayName = "FeatureCard";

const PlatformTabs = React.memo(() => {
  const [activeTab, setActiveTab] = useState<'shipper' | 'transporter' | 'command'>('shipper');

  return (
    <section className="fade-section py-24 bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.08] dark:opacity-[0.12] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">The Freight Operating System</h2>
          <p className="text-lg text-muted-foreground">A unified architecture serving every node in the logistics network, powered by advanced matching algorithms.</p>
        </div>
        <div className="flex justify-center mb-12">
          <div className="glass-panel p-1 rounded-lg inline-flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab.id
                    ? 'bg-card/80 dark:bg-white/10 text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50 dark:hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="relative w-full aspect-[16/9] max-h-[700px]">
          {/* Shipper OS */}
          <div role="tabpanel" className={`tab-content ${activeTab === 'shipper' ? 'active' : ''} absolute inset-0 glass-card rounded-xl border-blue-500/20 overflow-hidden shadow-2xl flex-col`}
            style={{ display: activeTab === 'shipper' ? 'flex' : 'none' }}
            inert={activeTab !== 'shipper'}
          >
            <div className="h-12 border-b border-blue-500/20 bg-card/80 flex items-center px-5 gap-3">
              <Package className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Shipper OS</span>
              <div className="flex-grow" />
              <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/50">v2.4.1</span>
            </div>
            <div className="flex-grow p-5 lg:p-6 bg-background/50 dark:bg-[#050816]/50 overflow-y-auto">
              <p className="text-sm text-muted-foreground mb-5 max-w-2xl">Empower your supply chain with AI-driven tools to post, track, and optimize every shipment across East India&apos;s industrial corridors.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {shipperFeatures.map((feat, i) => <FeatureCard key={i} feat={feat} />)}
              </div>
            </div>
          </div>

          {/* Transporter OS */}
          <div role="tabpanel" className={`tab-content ${activeTab === 'transporter' ? 'active' : ''} absolute inset-0 glass-card rounded-xl border-orange-500/20 overflow-hidden shadow-2xl flex-col`}
            style={{ display: activeTab === 'transporter' ? 'flex' : 'none' }}
            inert={activeTab !== 'transporter'}
          >
            <div className="h-12 border-b border-orange-500/20 bg-card/80 flex items-center px-5 gap-3">
              <Truck className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Transporter OS</span>
              <div className="flex-grow" />
              <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/50">v2.4.1</span>
            </div>
            <div className="flex-grow p-5 lg:p-6 bg-background/50 dark:bg-[#050816]/50 overflow-y-auto">
              <p className="text-sm text-muted-foreground mb-5 max-w-2xl">Maximize your fleet&apos;s earning potential. Discover high-value loads, optimize routes, and build a digital reputation that commands premium rates.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {transporterFeatures.map((feat, i) => <FeatureCard key={i} feat={feat} />)}
              </div>
            </div>
          </div>

          {/* AI Command Center */}
          <div role="tabpanel" className={`tab-content ${activeTab === 'command' ? 'active' : ''} absolute inset-0 glass-card rounded-xl border-orange-500/20 overflow-hidden shadow-[0_0_30px_rgba(249,115,22,0.1)] flex-col`}
            style={{ display: activeTab === 'command' ? 'flex' : 'none' }}
            inert={activeTab !== 'command'}
          >
            <div className="h-12 border-b border-orange-500/20 bg-orange-900/10 flex items-center px-5 gap-3">
              <Brain className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">AI Command Center</span>
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse-ring" />
              <div className="flex-grow" />
              <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/50">NEURAL CORE v3.1</span>
            </div>
            <div className="flex-grow p-5 lg:p-6 bg-background/50 dark:bg-[#050816]/50 overflow-y-auto">
              <p className="text-sm text-muted-foreground mb-5 max-w-2xl">The intelligence layer powering the entire LoadSaathi network. Real-time algorithms optimize every match, predict every price, and secure every transaction.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {commandFeatures.map((feat, i) => <FeatureCard key={i} feat={feat} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
PlatformTabs.displayName = "PlatformTabs";

export default PlatformTabs;
