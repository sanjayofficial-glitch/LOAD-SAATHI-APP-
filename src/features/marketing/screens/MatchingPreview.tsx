
import { useState } from 'react';
import { Search, MapPin, Truck, Package, Star, Brain, ChevronDown, SlidersHorizontal } from 'lucide-react';
import SeoMeta from "@/components/SeoMeta";

const shipments = [
  { id: 'SHP-1024', origin: 'Mumbai, MH', dest: 'Delhi, DL', weight: '18T', type: 'FTL', price: '₹42,000', date: '2026-07-08', match: 98, matchLabel: 'Excellent', driver: 'Rajesh Kumar', rating: 4.9, trips: 342 },
  { id: 'SHP-1023', origin: 'Bangalore, KA', dest: 'Hyderabad, TG', weight: '12T', type: 'PTL', price: '₹28,500', date: '2026-07-09', match: 94, matchLabel: 'Excellent', driver: 'Suresh Patel', rating: 4.8, trips: 287 },
  { id: 'SHP-1022', origin: 'Chennai, TN', dest: 'Kolkata, WB', weight: '22T', type: 'FTL', price: '₹58,000', date: '2026-07-10', match: 87, matchLabel: 'Good', driver: 'Amit Singh', rating: 4.7, trips: 198 },
  { id: 'SHP-1021', origin: 'Pune, MH', dest: 'Ahmedabad, GJ', weight: '9T', type: 'LTL', price: '₹18,000', date: '2026-07-07', match: 82, matchLabel: 'Good', driver: 'Vikram Joshi', rating: 4.6, trips: 156 },
  { id: 'SHP-1020', origin: 'Delhi, DL', dest: 'Jaipur, RJ', weight: '15T', type: 'FTL', price: '₹32,000', date: '2026-07-08', match: 76, matchLabel: 'Fair', driver: 'Deepak Verma', rating: 4.4, trips: 112 },
  { id: 'SHP-1019', origin: 'Hyderabad, TG', dest: 'Bangalore, KA', weight: '8T', type: 'LTL', price: '₹15,500', date: '2026-07-09', match: 71, matchLabel: 'Fair', driver: 'Manoj Tiwari', rating: 4.3, trips: 89 },
  { id: 'SHP-1018', origin: 'Ahmedabad, GJ', dest: 'Mumbai, MH', weight: '20T', type: 'FTL', price: '₹38,000', date: '2026-07-11', match: 65, matchLabel: 'Average', driver: 'Ravi Shankar', rating: 4.1, trips: 67 },
  { id: 'SHP-1017', origin: 'Kolkata, WB', dest: 'Guwahati, AS', weight: '14T', type: 'FTL', price: '₹48,000', date: '2026-07-12', match: 58, matchLabel: 'Low', driver: 'Prakash Das', rating: 3.9, trips: 45 },
];

const trips = [
  { id: 'TRP-891', origin: 'Delhi, DL', dest: 'Mumbai, MH', distance: '1,420km', price: '₹45,000', date: '2026-07-08', match: 96, matchLabel: 'Excellent', cargo: 'Electronics', weight: '16T' },
  { id: 'TRP-890', origin: 'Mumbai, MH', dest: 'Pune, MH', distance: '150km', price: '₹8,500', date: '2026-07-07', match: 91, matchLabel: 'Excellent', cargo: 'Auto Parts', weight: '6T' },
  { id: 'TRP-889', origin: 'Bangalore, KA', dest: 'Chennai, TN', distance: '350km', price: '₹18,000', date: '2026-07-09', match: 85, matchLabel: 'Good', cargo: 'Pharma', weight: '10T' },
  { id: 'TRP-888', origin: 'Hyderabad, TG', dest: 'Kolkata, WB', distance: '1,480km', price: '₹52,000', date: '2026-07-10', match: 79, matchLabel: 'Good', cargo: 'Machinery', weight: '22T' },
  { id: 'TRP-887', origin: 'Chennai, TN', dest: 'Bangalore, KA', distance: '350km', price: '₹16,000', date: '2026-07-08', match: 73, matchLabel: 'Fair', cargo: 'Textiles', weight: '8T' },
  { id: 'TRP-886', origin: 'Jaipur, RJ', dest: 'Delhi, DL', distance: '280km', price: '₹12,000', date: '2026-07-11', match: 67, matchLabel: 'Fair', cargo: 'Marble', weight: '14T' },
  { id: 'TRP-885', origin: 'Ahmedabad, GJ', dest: 'Mumbai, MH', distance: '520km', price: '₹22,000', date: '2026-07-12', match: 61, matchLabel: 'Average', cargo: 'Chemicals', weight: '12T' },
  { id: 'TRP-884', origin: 'Lucknow, UP', dest: 'Patna, BR', distance: '520km', price: '₹20,000', date: '2026-07-13', match: 54, matchLabel: 'Low', cargo: 'Food Grain', weight: '18T' },
];

type MatchItem =
  | {
      id: string;
      origin: string;
      dest: string;
      weight: string;
      type: string;
      price: string;
      date: string;
      match: number;
      matchLabel: string;
      driver: string;
      rating: number;
      trips: number;
    }
  | {
      id: string;
      origin: string;
      dest: string;
      distance: string;
      price: string;
      date: string;
      match: number;
      matchLabel: string;
      cargo: string;
      weight: string;
    };

const matchColor = (score: number) => {
  if (score >= 90) return 'bg-green-500/15 text-green-400 border-green-500/30';
  if (score >= 75) return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
  if (score >= 60) return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
  return 'bg-red-500/15 text-red-400 border-red-500/30';
};

export default function MatchingPreview() {
  const [tab, setTab] = useState<'shipments' | 'trips'>('shipments');
  const [search, setSearch] = useState('');

  const data: MatchItem[] = tab === 'shipments' ? shipments : trips;
  const filtered = data.filter(item =>
    item.origin.toLowerCase().includes(search.toLowerCase()) ||
    item.dest.toLowerCase().includes(search.toLowerCase()) ||
    item.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <SeoMeta title="AI Matching Preview — LoadSaathi App Screens" description="Preview LoadSaathi's AI-powered load matching: intelligent shipment-to-truck matching with confidence scores, filters, and driver profiles." canonical="/screens/matching" />
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-blue-500/5 via-transparent to-transparent">
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.06] pointer-events-none"
            style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-16 sm:py-20 relative z-10">
          <h1 className="text-4xl sm:text-5xl font-black text-foreground mb-4">App Preview: AI Matching</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Intelligent load matching powered by multi-factor AI — connecting the right shipment with the right truck.
          </p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-12">
        <div className="glass-card rounded-xl border-border overflow-hidden shadow-2xl">
          <div className="h-12 border-b border-border bg-card/80 flex items-center px-5 gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">AI_MATCH_ENGINE v2.4</span>
            <div className="flex-grow" />
            <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
              <button
                onClick={() => setTab('shipments')}
                className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                  tab === 'shipments' ? 'bg-orange-500/20 text-orange-400' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Browse Shipments
              </button>
              <button
                onClick={() => setTab('trips')}
                className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                  tab === 'trips' ? 'bg-blue-500/20 text-blue-400' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Browse Trips
              </button>
            </div>
          </div>

          <div className="p-6 bg-background/50 dark:bg-[#050816]/50">
            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={`Search ${tab} by origin, destination, or ID...`}
                  className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                <ChevronDown className="h-3 w-3" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                <Brain className="h-3.5 w-3.5 text-orange-400" />
                AI Sort
              </button>
            </div>

            {/* Listings */}
            <div className="space-y-3">
              {filtered.map((item) => (
                <div key={item.id} className="glass-card p-4 rounded-xl border-border hover:border-orange-500/20 transition-all duration-200 group">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-grow">
                      {tab === 'shipments' ? (
                        <div className="p-2.5 rounded-lg bg-orange-500/10 mt-0.5">
                          <Package className="h-5 w-5 text-orange-400" />
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-blue-500/10 mt-0.5">
                          <Truck className="h-5 w-5 text-blue-400" />
                        </div>
                      )}
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-foreground">{item.id}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${matchColor(item.match)}`}>
                            AI {item.match}%
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-orange-400/70" />
                            {item.origin}
                          </span>
                          <span className="text-muted-foreground/40">→</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-blue-400/70" />
                            {item.dest}
                          </span>
                          {('type' in item) && (
                            <>
                              <span className="text-muted-foreground/60">·</span>
                              <span>{item.weight}</span>
                              <span className="text-muted-foreground/60">·</span>
                              <span>{item.type}</span>
                            </>
                          )}
                          {('distance' in item) && (
                            <>
                              <span className="text-muted-foreground/60">·</span>
                              <span>{item.distance}</span>
                              <span className="text-muted-foreground/60">·</span>
                              <span>{item.cargo}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-base font-black text-foreground">{item.price}</div>
                      <div className="text-[10px] text-muted-foreground">{item.date}</div>
                      {tab === 'shipments' && 'driver' in item && (
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-semibold text-foreground">{item.rating}</span>
                          <span className="text-[10px] text-muted-foreground">({item.trips} trips)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-center">
              <span className="text-xs text-muted-foreground">
                Showing {filtered.length} of {data.length} {tab} · Powered by Gemini + Groq AI
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
