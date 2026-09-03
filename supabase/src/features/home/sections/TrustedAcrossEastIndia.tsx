import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

const cities = [
  { city: 'Rourkela', state: 'Odisha', desc: 'Steel City hub — primary origin for industrial and manufacturing freight.', routes: '12 corridors' },
  { city: 'Ranchi', state: 'Jharkhand', desc: 'Mineral belt — mining, heavy machinery, and construction materials.', routes: '8 corridors' },
  { city: 'Kolkata', state: 'West Bengal', desc: 'Port city — container, FMCG, and distribution freight to eastern India.', routes: '10 corridors' },
  { city: 'Bhubaneswar', state: 'Odisha', desc: 'Capital corridor — IT, pharma, and commercial freight.', routes: '6 corridors' },
] as const;

const stats = [
  { value: '500+', label: 'Verified Truckers' },
  { value: '25+', label: 'Active Corridors' },
  { value: '50+', label: 'Cities Connected' },
  { value: '10K+', label: 'Loads Completed' },
] as const;

const TrustedAcrossEastIndia = React.memo(() => (
  <section className="fade-section py-24 relative">
    <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Trusted Across East India</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">From Rourkela&apos;s steel plants to Kolkata&apos;s ports, LoadSaathi is building the freight network for India&apos;s fastest-growing industrial corridor.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {cities.map((city, i) => (
          <Link key={i} to={`/location/${city.city.toLowerCase()}`} className="glass-card p-6 rounded-xl border border-border hover:border-orange-500/30 transition-all duration-300 group">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-orange-500" />
              <h3 className="font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{city.city}</h3>
              <span className="text-xs text-muted-foreground">{city.state}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{city.desc}</p>
            <span className="text-xs font-semibold text-orange-500">{city.routes} →</span>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-8 text-center">
        {stats.map((stat, i) => (
          <div key={i}>
            <div className="text-3xl font-black text-orange-600 dark:text-orange-400">{stat.value}</div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
));
TrustedAcrossEastIndia.displayName = "TrustedAcrossEastIndia";

export default TrustedAcrossEastIndia;
