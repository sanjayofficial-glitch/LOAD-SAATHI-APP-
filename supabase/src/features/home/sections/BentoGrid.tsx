import React from 'react';
import { Route, Handshake, EyeOff, CircuitBoard } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface BentoCard {
  icon: LucideIcon;
  title: string;
  desc: string;
  badge: string | null;
  badgeClass?: string;
  colSpan?: string;
  iconColor: string;
}

const cards: BentoCard[] = [
  { icon: Route, title: 'Empty Return Trips', desc: 'Trucks frequently return empty after a delivery, burning fuel and wasting economic potential due to lack of network visibility.', badge: 'CRITICAL INEFFICIENCY', badgeClass: 'text-red-500 dark:bg-red-900/20 dark:border-red-800/30 bg-red-100 border-red-200', colSpan: 'md:col-span-2', iconColor: 'text-orange-600 dark:text-orange-400' },
  { icon: Handshake, title: 'Broker Dependency', desc: 'Opaque pricing and multiple intermediaries erode margins for both shippers and transporters.', badge: null, iconColor: 'text-blue-500' },
  { icon: EyeOff, title: 'Zero Visibility', desc: 'Lack of real-time tracking leads to supply chain anxiety and manual intervention.', badge: null, iconColor: 'text-muted-foreground' },
  { icon: CircuitBoard, title: 'Fragmented Data Silos', desc: 'Disconnected systems prevent systemic optimization and intelligent capacity planning.', badge: null, iconColor: 'text-orange-500', colSpan: 'md:col-span-2' },
];

const BentoGrid = React.memo(() => (
  <section className="fade-section py-24 relative">
    <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.08] dark:opacity-[0.12] pointer-events-none"
      style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', filter: 'blur(60px)' }} />
    <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
      <div className="mb-16">
        <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">The Utilization Crisis</h2>
        <p className="text-lg text-muted-foreground max-w-2xl">India doesn&apos;t have a truck shortage. India has a utilization problem. Legacy systems create friction, leaving capacity stranded.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className={`glass-card p-8 rounded-xl min-h-[260px] flex flex-col ${card.colSpan || ''} hover:border-orange-500/30 transition-all duration-300 group`}>
            <card.icon className={`${card.iconColor} text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 shrink-0`} />
            <h3 className="text-lg font-bold text-foreground mb-2">{card.title}</h3>
            <p className="text-sm text-muted-foreground flex-grow">{card.desc}</p>
            {card.badge && (
              <div className="mt-auto pt-6 border-t border-border">
                <span className={`text-xs font-semibold ${card.badgeClass} px-2 py-1 rounded border`}>{card.badge}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
));
BentoGrid.displayName = "BentoGrid";

export default BentoGrid;
